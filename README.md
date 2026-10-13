# Letters to Heaven

**A quiet place for what remains**

A gentle, private-first web app for writing letters to loved ones who have passed and preserving memories.

## Production application (`production` branch / PR #1)

The production application uses Next.js and Supabase for account authentication,
private letters, a memory jar, journaling prompts, released-letter state, and
candle events. This branch builds on the existing production pull request.

Use Node.js 22–24, then:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Configure `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for your dedicated Supabase project.
Apply `supabase/migrations/202608280001_production.sql` to that project before
using accounts. Keep the published row-level security policies enabled. A
service-role key must never be placed in a browser environment variable.

Without Supabase configuration, the app displays a setup message. Production
auth and database access still require the external project and migration.
Run `npm run check` for the mocked account regressions, lint, typechecking, and a
production build. These checks do not verify live Supabase access or row policies.

Changing accounts resets the letter editor and all private in-memory entries.
Late results from an earlier auth lookup cannot replace the current account.

## Legacy browser build (`main`)

The root `index.html` preserves the original local-storage application. It is
separate from the production account application. The original browser build
includes:

- Letter vault with All / Kept close / Released / Shared filters
- Search across names, titles, and letter text
- Write and save new letters locally in the browser
- Candle-lighting state and candle count
- Keepsake presentation for memories such as hydrangeas
- Private-by-default messaging and support note
- Responsive mobile layout
- Optional OpenAI-powered gentle reflection endpoint through the included React/Express app
- Canva visual-system brief in `canva/visual-system.md`

## Run the simple version

Open `index.html` in a modern browser. Letters are stored locally in browser storage.

The older React/Express OpenAI helper files are retained as legacy source. The
production Next.js scripts run the account application described above.

## GitHub Pages

The root `index.html` is a self-contained browser build, so this repository can be published as a static GitHub Pages site. The optional OpenAI helper requires a server deployment and should not be implemented as a client-side API key.

## Design

Soft dark night-sky aesthetic with warm cream paper, muted gold, sage keepsakes, and elegant typography. Built to feel calm, private, and unhurried.

---

*There is no right or wrong way to write. Messy, short, long, angry, tender — all of it belongs here.*
