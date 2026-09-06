# Letters to Heaven

**A quiet place for what remains**

A gentle, private-first web app for writing letters to loved ones who have passed and preserving memories.

## Included in this build

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

## Run the React + OpenAI version

1. Install Node.js.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add `OPENAI_API_KEY` if you want the optional AI helper.
4. Run `npm run dev`.

The API key belongs on the server only — never put `OPENAI_API_KEY` in browser code.

## GitHub Pages

The root `index.html` is a self-contained browser build, so this repository can be published as a static GitHub Pages site. The optional OpenAI helper requires a server deployment and should not be implemented as a client-side API key.

## Design

Soft dark night-sky aesthetic with warm cream paper, muted gold, sage keepsakes, and elegant typography. Built to feel calm, private, and unhurried.

---

*There is no right or wrong way to write. Messy, short, long, angry, tender — all of it belongs here.*
