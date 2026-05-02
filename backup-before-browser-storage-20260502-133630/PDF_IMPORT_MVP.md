# PDF Import MVP

This MVP adds a first-pass PDF-to-character pipeline to the Cardenveil sheet app.

## What it does

1. Accepts a PDF from the app UI with `Importer PDF`
2. Extracts plaintext from the PDF locally
3. Extracts embedded PDF images when `Pillow` is installed
4. Sends the PDF to an LLM when `OPENAI_API_KEY` is configured
5. Normalizes the response into the app's `.rpsheet.json` structure
6. Saves the character in the existing local storage
7. Keeps compatibility with the current ZIP export flow

## Current behavior

- With `OPENAI_API_KEY` configured:
  - the converter sends the PDF itself to the model
  - this is the preferred MVP path for sheets with layout variation
- Without `OPENAI_API_KEY`:
  - the converter falls back to local extraction
  - it still creates a valid character
  - most uncertain content is stored in `notes`

## Environment

Set these environment variables before starting the app, or copy `.env.example` to `.env`:

```powershell
$env:OPENAI_API_KEY="sk-..."
$env:OPENAI_MODEL="gpt-4.1-mini"
py -X utf8 app.py
```

`OPENAI_MODEL` is optional. If omitted, the app defaults to `gpt-4.1-mini`.

The app now loads `.env` automatically on startup.

## Install dependencies

```powershell
py -m pip install -r requirements.txt
```

`Pillow` is needed for embedded image extraction from PDFs.

## MVP limitations

- Image assignment is heuristic for now
- The fallback mode is intentionally conservative
- The LLM output is normalized, but not yet confidence-scored field by field
- Different PDF families will still need prompt and schema tuning

## Next recommended upgrades

1. Add a validation panel in the UI to show uncertain fields after import
2. Add a schema-versioned export adapter layer
3. Add better image ranking and page-region capture
4. Add test fixtures for multiple PDF families
