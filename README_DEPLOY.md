# Deploy To Cloudflare Pages

This project includes a static deployment build in the `web/` folder.

Use the `web/` folder for hosting on Cloudflare Pages.

## What Works In The Static Version

- Normal sheet editing
- Local browser saving with IndexedDB
- Current sheet memory with localStorage
- Delete sheet
- ZIP export
- ZIP import

## What Is Disabled In The Static Version

- `Importer PDF`
- `Extraire images PDF`
- Python backend features

## Cloudflare Pages Settings

- Framework preset: `None`
- Build command: leave empty
- Build output directory: `web`

## Recommended Pre-Deploy Check

Before pushing, open the static build locally with a simple web server and confirm:

1. A sheet can be created.
2. Changes persist after refresh.
3. `Sauvegarder ZIP` downloads a zip file.
4. `Importer fiche` restores a zip file.
5. `Supprimer` deletes the current sheet.

## Suggested Local Test Command

From the project root:

```powershell
py -m http.server 8000 -d web
```

Then open:

```text
http://127.0.0.1:8000
```

## GitHub Push Flow

1. Create a new repository on GitHub if you have not already.
2. Upload this project, including the `web/` folder.
3. Make sure the deployed branch contains:
   - `web/index.html`
   - `web/static/`
   - `web/data/templates/cardenveil-standard.json`

## Cloudflare Pages Flow

1. Log in to Cloudflare.
2. Open `Workers & Pages`.
3. Click `Create application`.
4. Choose `Pages`.
5. Choose `Connect to Git`.
6. Select your GitHub repository.
7. Set:
   - Framework preset: `None`
   - Build command: empty
   - Build output directory: `web`
8. Click `Save and Deploy`.

## Important Notes

- Browser-saved sheets are local to one browser/device.
- If browser storage is cleared, local sheets are lost unless exported as ZIP.
- The static version does not require Python for normal editing.
