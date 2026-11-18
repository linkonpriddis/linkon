# Dictionary Binary AI

A small, browser-based, dictionary-powered chatbot. It uses a bundled JSON dictionary and simple JavaScript matching rules. It does **not** use a large language model, external AI API, or live internet search to answer questions.

## Files

- `index.html` — page structure and interface
- `style.css` — responsive dark theme
- `script.js` — dictionary matching, chat, local entries, and binary conversion
- `dictionary.json` — starter word database

## Run locally

Because the app loads `dictionary.json` with `fetch()`, open it through a local web server rather than directly as a `file://` page.

For example, in VS Code install/use the Live Server extension, right-click `index.html`, and choose **Open with Live Server**.

## Publish with GitHub Pages

1. Push these files to the repository's `main` branch.
2. Open the repository's **Settings → Pages**.
3. Under Build and deployment, select **Deploy from a branch**.
4. Choose `main` and `/ (root)`, then save.
5. Wait for GitHub Pages to publish the site.

## What it can do

- Define words present in the local dictionary.
- Return stored synonyms and related words.
- Compare two stored terms.
- Search the dictionary.
- Add custom entries saved in the current browser using localStorage.
- Encode text as UTF-8 bytes and decode groups of 8-bit binary bytes.
- Display each chatbot answer as binary in the Binary Lab output.

## Important limitations

This is a rule-based dictionary chatbot, not a self-learning or reasoning AI model. It can only answer from entries in its dictionary and the matching rules in `script.js`. Adding an entry saves it in the current browser; it does not edit the repository's `dictionary.json`. To permanently add words for every visitor, edit `dictionary.json` and commit the change.

Binary is the data representation used by the computer. The dictionary and JavaScript rules provide the knowledge and behavior.
