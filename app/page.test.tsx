import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './page';

const mocked = vi.hoisted(() => ({
  getUser: vi.fn(),
  authCallback: null as null | ((event: string, session: unknown) => void),
  from: vi.fn(),
  scopes: [] as Array<[string, string, string]>,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: mocked.getUser,
      onAuthStateChange: (callback: typeof mocked.authCallback) => {
        mocked.authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
    from: mocked.from,
  },
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let renderer: ReactTestRenderer;
const user = (id: string) => ({ id, email: `${id}@example.com`, user_metadata: { display_name: id } });
function renderedText() { return JSON.stringify(renderer.toJSON()); }

beforeEach(() => {
  vi.clearAllMocks();
  mocked.scopes = [];
  mocked.authCallback = null;
  mocked.getUser.mockResolvedValue({ data: { user: user('alice') } });
  mocked.from.mockImplementation((table: string) => {
    const query = {
      select: () => query,
      eq: (field: string, id: string) => { mocked.scopes.push([table, field, id]); return query; },
      order: () => Promise.resolve({ data: [], error: null }),
    };
    return query;
  });
});

afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); });

describe('private account lifecycle', () => {
  it('resets unsaved letters and scopes entry queries when switching accounts', async () => {
    await act(async () => { renderer = create(<Home />); });
    const recipient = renderer.root.findAllByType('input')[0];
    const body = renderer.root.findByType('textarea');
    await act(async () => {
      recipient.props.onChange({ target: { value: 'Alice private recipient' } });
      body.props.onChange({ target: { value: 'Alice private letter' } });
    });
    expect(renderedText()).toContain('Alice private letter');
    await act(async () => mocked.authCallback?.('SIGNED_IN', { user: user('bob') }));
    expect(renderedText()).not.toContain('Alice private letter');
    expect(renderedText()).not.toContain('Alice private recipient');
    expect(renderedText()).toContain('bob');
    expect(mocked.scopes).toContainEqual(['letters', 'user_id', 'alice']);
    expect(mocked.scopes).toContainEqual(['letters', 'user_id', 'bob']);
    expect(mocked.scopes).toContainEqual(['memories', 'user_id', 'bob']);
  });

  it('ignores an initial auth lookup that resolves after a sign-in event', async () => {
    let resolveUser!: (result: unknown) => void;
    mocked.getUser.mockReturnValue(new Promise(resolve => { resolveUser = resolve; }));
    await act(async () => { renderer = create(<Home />); });
    await act(async () => mocked.authCallback?.('SIGNED_IN', { user: user('bob') }));
    await act(async () => resolveUser({ data: { user: user('alice') } }));
    expect(renderedText()).toContain('bob');
    expect(mocked.scopes).not.toContainEqual(['letters', 'user_id', 'alice']);
  });

  it('stops loading when the initial user lookup fails', async () => {
    mocked.getUser.mockRejectedValue(new Error('offline'));
    await act(async () => { renderer = create(<Home />); });
    expect(renderedText()).toContain('Welcome back');
    expect(renderedText()).not.toContain('Opening your private space');
  });
});
