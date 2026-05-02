# Fiche Cardenveil - Import / Export Spec for AI Agents

## Purpose

This document explains how the Cardenveil sheet application stores data, how character archives are exported/imported, how images are organized, and how an AI agent should generate valid `.zip` packages from future PDF character sheets.

This file is written for an automated agent that will:
- read a character sheet PDF
- extract structured character data
- optionally extract or generate image assets
- produce a valid importable character archive for this application

The app language is French, but internal implementation rules are simple and JSON-based.


## What the Application Is

This application is a local character sheet editor for **Cardenveil**.

It supports:
- editable stats and derived values
- weapons
- narrative fields
- capacities as editable cards
- mechanical masteries
- feats (`Dons`)
- equipment
- inventory
- image-backed portrait / totem / capacities
- full character export/import as `.zip`


## Current Storage Model

The application separates:

1. **Character JSON**
2. **Image files**

### Character JSON

Stored as:

```text
data/characters/<character-id>.rpsheet.json
```

### Images

Stored as:

```text
data/assets/<character-id>/<image-file>
```

In the packaged Windows build, user data is stored under:

```text
%LOCALAPPDATA%\FicheCardenveil\
```

with the same logical structure:

```text
characters/
assets/
templates/
```


## Export Format

The application exports a **portable ZIP package**.

### ZIP structure

A valid export archive looks like:

```text
<character-id>.zip
  <character-id>.rpsheet.json
  assets/<character-id>/<image-file-1>
  assets/<character-id>/<image-file-2>
  ...
```

Example:

```text
nouveau-personnage.zip
  nouveau-personnage.rpsheet.json
  assets/nouveau-personnage/portrait-123.png
  assets/nouveau-personnage/totem-456.jpg
  assets/nouveau-personnage/fireball-789.png
```

### Important rule

The JSON **does not embed image bytes**.

It references image files using paths like:

```json
"/assets/nouveau-personnage/portrait-123.png"
```

So the ZIP must contain:
- the JSON
- every referenced image file


## Import Rules

When importing a ZIP:
- the app reads the `.rpsheet.json`
- it restores image files under `assets/<character-id>/`
- it keeps image references in JSON as `/assets/<character-id>/<filename>`

### Critical constraint

If the ZIP contains JSON references to images, but the image files are missing from the archive, the sheet will import but images will not appear.


## Character ID Rules

The app uses a slugified character id.

### Slug behavior

The app transforms the id or character name roughly like this:
- trim
- lowercase
- replace non alphanumeric separators with `-`
- collapse repeated `-`

Examples:

- `Nouveau personnage` -> `nouveau-personnage`
- `Maitre d'Armes` -> `maitre-d-armes`

### Recommendation for AI agents

Always set:

```json
"id": "<slugified-character-name>"
```

and use the same id:
- in the JSON filename
- in the ZIP filename
- in the image paths
- in the image folder under `assets/`


## Image Rules

### Supported image-backed fields

At the moment, images are used in:

1. `portrait`
2. `totem.image`
3. `capacities[].image`

### Required path format

All image paths inside JSON must be **relative app asset URLs**, not filesystem paths and not full HTTP URLs.

Correct:

```json
"/assets/nouveau-personnage/portrait.png"
```

Incorrect:

```json
"C:\\images\\portrait.png"
"http://127.0.0.1:8000/assets/nouveau-personnage/portrait.png"
"assets/nouveau-personnage/portrait.png"
```

Always use:

```json
"/assets/<character-id>/<filename>"
```

### File naming recommendation

Use stable ASCII-safe filenames:

```text
portrait.png
totem.jpg
capacity-1.png
capacity-feu.png
```

Avoid spaces and special characters when possible.


## JSON Root Structure

The character JSON is a single object.

### Core top-level keys currently used

```json
{
  "schemaVersion": 1,
  "id": "nouveau-personnage",
  "templateId": "cardenveil-standard",
  "createdAt": "2026-05-01T00:00:00+00:00",
  "updatedAt": "2026-05-01T00:00:00+00:00",
  "identity": {},
  "portrait": "",
  "stats": {},
  "progression": {},
  "derived": {},
  "defense": {},
  "resources": {},
  "skills": {},
  "weapons": [],
  "inventory": {},
  "totem": {},
  "narrative": {},
  "actions": [],
  "reactions": [],
  "tokens": [],
  "capacities": [],
  "notes": "",
  "abilityControls": {},
  "weaponMasteries": [],
  "elementalMasteries": [],
  "equipment": {},
  "inventoryItems": [],
  "feats": []
}
```

Some legacy keys like `actions`, `reactions`, `tokens`, `inventory` still exist in JSON even if the UI no longer focuses on them.


## Recommended JSON Template for AI Generation

When generating a new sheet from a PDF, use this as the canonical shape.

```json
{
  "schemaVersion": 1,
  "id": "character-id",
  "templateId": "cardenveil-standard",
  "createdAt": "2026-05-01T00:00:00+00:00",
  "updatedAt": "2026-05-01T00:00:00+00:00",
  "identity": {
    "nom": "",
    "joueur": "",
    "niveau": 1,
    "race": "",
    "alignement": "",
    "age": "",
    "taille": "",
    "poids": "",
    "yeux": "",
    "peau": "",
    "cheveux": ""
  },
  "portrait": "",
  "stats": {
    "force": 10,
    "agilite": 10,
    "esprit": 10,
    "social": 10
  },
  "progression": {
    "xpDepenses": 0,
    "xpDisponibles": 0
  },
  "derived": {
    "pvMax": 0,
    "bonusPv": "",
    "pvActuels": 0,
    "pvTemporaires": 0,
    "mouvement": 0,
    "initiative": 0,
    "perceptionPassive": 10,
    "seuilSauvegarde": "",
    "seuilMiss": "",
    "canalisation": "",
    "bonusAttaque": "",
    "inspiration": "",
    "fatigue": "",
    "mort": ""
  },
  "defense": {
    "parade": "",
    "armure": "",
    "deflexion": "",
    "gardeBonus": "",
    "bonus": ""
  },
  "resources": {
    "or": "",
    "rations": "",
    "cartesEtTokens": ""
  },
  "skills": {},
  "weapons": [],
  "inventory": {
    "equipement": "",
    "inventaire": "",
    "totem": ""
  },
  "totem": {
    "nom": "",
    "description": "",
    "image": ""
  },
  "narrative": {
    "background": "",
    "objectif": "",
    "liens": "",
    "traitsSpeciaux": [],
    "personnalite": "",
    "reputation": "",
    "education": "",
    "croyances": "",
    "cicatrices": "",
    "pulsion": "",
    "maniesEtTics": "",
    "instinct": ""
  },
  "actions": [],
  "reactions": [],
  "tokens": [],
  "capacities": [],
  "notes": "",
  "abilityControls": {
    "cardMin": "",
    "cardMax": "",
    "knownAbilities": "",
    "maxPreparedAbilities": "",
    "colorReductions": {
      "spade": 0,
      "heart": 0,
      "diamond": 0,
      "club": 0
    }
  },
  "weaponMasteries": [],
  "elementalMasteries": [],
  "equipment": {
    "casque": {
      "nom": "",
      "raretePrix": "",
      "deflexion": "",
      "volonte": "",
      "enchantement": "",
      "description": ""
    },
    "plastron": {
      "nom": "",
      "raretePrix": "",
      "deflexion": "",
      "armure": "",
      "enchantement": "",
      "description": ""
    },
    "gantelets": {
      "nom": "",
      "raretePrix": "",
      "deflexion": "",
      "initiative": "",
      "enchantement": "",
      "description": ""
    },
    "bottes": {
      "nom": "",
      "raretePrix": "",
      "deflexion": "",
      "vitesse": "",
      "enchantement": "",
      "description": ""
    },
    "anneau": {
      "nom": "",
      "raretePrix": "",
      "enchantement": "",
      "description": ""
    },
    "amulette": {
      "nom": "",
      "raretePrix": "",
      "enchantement": "",
      "description": ""
    },
    "cape": {
      "nom": "",
      "raretePrix": "",
      "enchantement": "",
      "description": ""
    }
  },
  "inventoryItems": [],
  "feats": []
}
```


## Capacity Card Format

Each entry in `capacities` should use this shape:

```json
{
  "name": "",
  "prepared": false,
  "image": "",
  "description": "",
  "value": {
    "main": "",
    "bonus": ""
  },
  "cost": {
    "color": "spade",
    "base": 0,
    "incantationReduction": 0,
    "colorReduction": 0,
    "awakeningReduction": 0,
    "weaponMasteryReduction": 0,
    "total": 0
  },
  "incantation": "",
  "save": "",
  "usage": ""
}
```

### Allowed color values

Use only:

- `spade`
- `heart`
- `diamond`
- `club`

Do not use:
- `pique`
- `coeur`
- `carreau`
- `trefle`
- symbols directly inside JSON

The UI converts these internal values into French symbols and display behavior.


## Weapons Format

The editable `weapons` block currently uses:

```json
{
  "nom": "",
  "de": "",
  "forceAgi": "",
  "critique": "",
  "avantage": "",
  "bonus": "",
  "perfection": "",
  "notes": ""
}
```


## Feats Format

`feats` is a list of:

```json
{
  "title": "",
  "description": ""
}
```


## Weapon Masteries Format

`weaponMasteries` is a list of:

```json
{
  "family": "",
  "perfection": 0
}
```


## Elemental Masteries Format

`elementalMasteries` is a list of:

```json
{
  "element": "",
  "level": 1
}
```


## Inventory Item Format

Each `inventoryItems` entry uses:

```json
{
  "type": "Divers",
  "slot": "casque",
  "family": "Épées droites",
  "weaponName": "",
  "name": "",
  "raretePrix": "",
  "description": "",
  "degats": "",
  "parade": "",
  "attributs": "",
  "familySummary": "",
  "catalystColor": "spade",
  "equipmentData": {}
}
```

### Allowed inventory item types

- `Divers`
- `Consommable`
- `Arme`
- `Équipement`


## Equipment Slot Keys

Use these exact keys:

- `casque`
- `plastron`
- `gantelets`
- `bottes`
- `anneau`
- `amulette`
- `cape`


## Timestamps

Use ISO-8601 strings, UTC preferred.

Example:

```json
"2026-05-01T21:41:23.463601+00:00"
```

If generating from scratch:
- set both `createdAt` and `updatedAt`


## Rules for AI Agents Building ZIPs from PDFs

### Minimum valid output

An agent should produce:

1. one JSON file named:

```text
<character-id>.rpsheet.json
```

2. zero or more images under:

```text
assets/<character-id>/
```

3. one final ZIP file named:

```text
<character-id>.zip
```

### If the PDF contains no images

Still create a valid ZIP:
- include the JSON
- leave image fields empty strings
- do not invent fake `/assets/...` paths unless the file is actually included

### If the PDF contains portrait / spell art / totem art

Then:
- export the image files into `assets/<character-id>/`
- reference them in JSON using `/assets/<character-id>/<filename>`


## Validation Checklist for Agents

Before finalizing a ZIP, verify:

1. JSON parses successfully
2. JSON filename matches character id
3. ZIP filename matches character id
4. Every image path in JSON starts with `/assets/<character-id>/`
5. Every referenced image is physically present in the ZIP
6. No image path uses `http://`, `https://`, or filesystem paths
7. `capacities[].cost.color` is one of:
   - `spade`
   - `heart`
   - `diamond`
   - `club`
8. `narrative.traitsSpeciaux` is a list, not a single string
9. `feats`, `weaponMasteries`, `elementalMasteries`, `inventoryItems`, `capacities`, `weapons` are arrays


## Known Pitfalls

### 1. Broken image URLs

Do not write absolute local paths or old localhost URLs into JSON.

Bad:

```json
"http://127.0.0.1:8000/assets/..."
```

Good:

```json
"/assets/character-id/file.png"
```

### 2. Missing images in ZIP

If JSON references images but they are not included in the ZIP, import will succeed but images will be blank.

### 3. Using French suit names in JSON

Display is French; internal values are English:
- `spade`
- `heart`
- `diamond`
- `club`

### 4. Legacy malformed fields

Some existing older sheets may contain malformed content, especially in fields that were historically edited manually.
For new AI-generated sheets, prefer clean normalized values.


## Best-Practice Output Strategy for Future PDF Conversion

When building a character from a PDF:

1. Extract character identity first
2. Build a clean `character-id`
3. Fill core JSON fields
4. Normalize arrays and optional blocks
5. Extract any usable art/images
6. Save images under `assets/<character-id>/`
7. Reference them using `/assets/<character-id>/<filename>`
8. Produce the final ZIP


## Recommended Deliverable from an AI Agent

For each processed PDF, the agent should return:

- one `.zip` import package
- optionally one preview JSON for debugging
- optionally one validation report listing:
  - missing fields
  - uncertain OCR values
  - inferred defaults


## Summary

To create a valid importable character package:

- build one normalized character JSON
- keep all image references as `/assets/<character-id>/<filename>`
- include every referenced image in the ZIP
- place images under `assets/<character-id>/`
- name the archive `<character-id>.zip`

If those rules are respected, the application can import the character correctly in both development mode and packaged Windows builds.
