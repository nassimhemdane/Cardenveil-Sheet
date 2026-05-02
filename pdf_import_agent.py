from __future__ import annotations

import base64
import io
import json
import os
import re
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pypdf import PdfReader


def load_local_env(base_dir: Path | None = None) -> None:
    env_path = (base_dir or Path.cwd()) / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def has_openai_api_key() -> bool:
    return bool(os.environ.get("OPENAI_API_KEY", "").strip())


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9A-ZÀ-ÿ_-]+", "-", value, flags=re.UNICODE)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or "personnage"


def empty_character(character_id: str, now_iso: str) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "id": character_id,
        "templateId": "cardenveil-standard",
        "createdAt": now_iso,
        "updatedAt": now_iso,
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
            "cheveux": "",
        },
        "portrait": "",
        "stats": {"force": 10, "agilite": 10, "esprit": 10, "social": 10},
        "progression": {"xpDepenses": 0, "xpDisponibles": 0},
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
            "mort": "",
        },
        "defense": {
            "parade": "",
            "armure": "",
            "deflexion": "",
            "gardeBonus": "",
            "bonus": "",
        },
        "resources": {
            "or": "",
            "rations": "",
            "cartesEtTokens": "",
        },
        "skills": {},
        "weapons": [],
        "inventory": {"equipement": "", "inventaire": "", "totem": ""},
        "totem": {"nom": "", "description": "", "image": ""},
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
            "instinct": "",
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
                "club": 0,
            },
        },
        "weaponMasteries": [],
        "elementalMasteries": [],
        "equipment": {
            "casque": {"nom": "", "raretePrix": "", "deflexion": "", "volonte": "", "enchantement": "", "description": ""},
            "plastron": {"nom": "", "raretePrix": "", "deflexion": "", "armure": "", "enchantement": "", "description": ""},
            "gantelets": {"nom": "", "raretePrix": "", "deflexion": "", "initiative": "", "enchantement": "", "description": ""},
            "bottes": {"nom": "", "raretePrix": "", "deflexion": "", "vitesse": "", "enchantement": "", "description": ""},
            "anneau": {"nom": "", "raretePrix": "", "enchantement": "", "description": ""},
            "amulette": {"nom": "", "raretePrix": "", "enchantement": "", "description": ""},
            "cape": {"nom": "", "raretePrix": "", "enchantement": "", "description": ""},
        },
        "inventoryItems": [],
        "feats": [],
    }


def extract_pdf_text(pdf_bytes: bytes) -> dict[str, Any]:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages: list[dict[str, Any]] = []
    combined_parts: list[str] = []
    for index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        pages.append({"page": index, "text": text})
        if text.strip():
            combined_parts.append(f"=== PAGE {index} ===\n{text.strip()}")
    return {
        "pageCount": len(reader.pages),
        "pages": pages,
        "combinedText": "\n\n".join(combined_parts).strip(),
    }


def _guess_image_ext(name: str) -> str:
    lower = name.lower()
    if lower.endswith(".jpg") or lower.endswith(".jpeg"):
        return ".jpg"
    if lower.endswith(".webp"):
        return ".webp"
    return ".png"


def extract_pdf_images(pdf_bytes: bytes, assets_dir: Path, character_id: str) -> tuple[list[dict[str, Any]], list[str]]:
    warnings: list[str] = []
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        images_meta: list[dict[str, Any]] = []
        target_dir = assets_dir / character_id
        target_dir.mkdir(parents=True, exist_ok=True)

        for page_index, page in enumerate(reader.pages, start=1):
            try:
                page_images = list(page.images)
            except ImportError:
                warnings.append("Image extraction requires Pillow. Install dependencies from requirements.txt to enable PDF image export.")
                return [], warnings
            except Exception as exc:
                warnings.append(f"Unable to inspect images on page {page_index}: {exc}")
                continue

            for image_index, image_file in enumerate(page_images, start=1):
                pil_image = getattr(image_file, "image", None)
                if pil_image is None:
                    continue
                width, height = pil_image.size
                if width < 96 or height < 96:
                    continue

                ext = _guess_image_ext(getattr(image_file, "name", ""))
                filename = f"pdf-p{page_index:02d}-img{image_index:02d}{ext}"
                target_path = target_dir / filename
                save_format = "JPEG" if ext == ".jpg" else "PNG"
                pil_image.save(target_path, format=save_format)
                images_meta.append(
                    {
                        "page": page_index,
                        "index": image_index,
                        "filename": filename,
                        "path": f"/assets/{character_id}/{filename}",
                        "width": width,
                        "height": height,
                        "area": width * height,
                    }
                )
    except Exception as exc:
        warnings.append(f"Unable to extract embedded images: {exc}")
        return [], warnings

    images_meta.sort(key=lambda item: (item["page"], -item["area"], item["filename"]))
    return images_meta, warnings


def _extract_response_text(response_payload: dict[str, Any]) -> str:
    text_parts: list[str] = []
    for item in response_payload.get("output", []):
        for content in item.get("content", []):
            if content.get("type") in {"output_text", "text"} and isinstance(content.get("text"), str):
                text_parts.append(content["text"])
    if text_parts:
        return "".join(text_parts).strip()
    if isinstance(response_payload.get("output_text"), str):
        return response_payload["output_text"].strip()
    return ""


def call_openai_pdf_mapper(pdf_bytes: bytes, filename: str, extracted_text: str) -> tuple[dict[str, Any] | None, list[str]]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None, ["OPENAI_API_KEY is not configured, using fallback extraction."]

    model = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini")
    prompt = """
You extract a Cardenveil RPG character sheet from a PDF and return JSON.

Return JSON only.
Do not wrap it in markdown.
If a field is unknown, keep it empty, zero, or false.
Do not invent image paths.
Use these internal suit names only: spade, heart, diamond, club.
If text is ambiguous, prefer preserving it in notes or descriptions instead of hallucinating.

Return an object with these keys:
- identity
- stats
- progression
- derived
- defense
- resources
- skills
- weapons
- inventory
- totem
- narrative
- capacities
- notes
- weaponMasteries
- elementalMasteries
- inventoryItems
- feats
- uncertainFields
- warnings

For skills, use an object keyed by skill name. Each value should be:
{"trained": boolean, "bonus": integer}

For capacities, use entries with:
name, prepared, description, value{main,bonus}, cost{color,base,incantationReduction,colorReduction,awakeningReduction,weaponMasteryReduction,total}, incantation, save, usage

For feats, use:
{"title": "...", "description": "..."}

For weaponMasteries, use:
{"family": "...", "perfection": 0}

For elementalMasteries, use:
{"element": "...", "level": 1}

For inventoryItems, use the app schema when clearly available, otherwise return an empty array.

The PDF may have layout variation. Extract the actual character data, not the static labels.
The following plaintext extraction may help if some PDF text was not read well:
""" + "\n" + extracted_text[:20000]

    payload = {
        "model": model,
        "input": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_file",
                        "filename": filename,
                        "file_data": f"data:application/pdf;base64,{base64.b64encode(pdf_bytes).decode('utf-8')}",
                    },
                    {"type": "input_text", "text": prompt},
                ],
            }
        ],
        "text": {
            "format": {
                "type": "json_object",
            }
        },
    }

    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        return None, [f"OpenAI request failed: HTTP {exc.code} {detail[:400]}"]
    except Exception as exc:
        return None, [f"OpenAI request failed: {exc}"]

    response_text = _extract_response_text(body)
    if not response_text:
        return None, ["OpenAI returned an empty response."]

    try:
        return json.loads(response_text), []
    except json.JSONDecodeError as exc:
        return None, [f"OpenAI returned invalid JSON: {exc}"]


def _clean_pdf_text(value: str) -> str:
    replacements = {
        "\u02c6": "",
        "\u00b4": "",
        "`": "'",
        "_": "",
        "/f_": "f",
        "/": " / ",
    }
    for source, target in replacements.items():
        value = value.replace(source, target)
    value = re.sub(r"\s+", " ", value)
    return value.strip(" -\t")


def _extract_capacity_color(text: str) -> str:
    if "♠" in text:
        return "spade"
    if "♥" in text:
        return "heart"
    if "♦" in text:
        return "diamond"
    if "♣" in text:
        return "club"
    return "spade"


def _looks_like_capacity_header(line: str) -> bool:
    if ":" not in line:
        return False
    name = _clean_pdf_text(line.split(":", 1)[0]).lstrip("´'")
    if not name or len(name) > 40:
        return False
    first_alpha = next((char for char in name if char.isalpha()), "")
    if not first_alpha or not first_alpha.isupper():
        return False
    return True


def fallback_capacity_parser(extracted_text: dict[str, Any]) -> list[dict[str, Any]]:
    capacities: list[dict[str, Any]] = []
    page_two = extracted_text["pages"][1]["text"] if len(extracted_text.get("pages", [])) > 1 else ""
    if not page_two:
        return capacities

    raw_lines = [line.strip() for line in page_two.splitlines() if line.strip()]
    blocks: list[list[str]] = []
    current: list[str] = []
    excluded_prefixes = ("Visuel ", "Notes personnelles")

    for line in raw_lines:
        line_clean = _clean_pdf_text(line)
        if _looks_like_capacity_header(line_clean) and not line_clean.startswith(excluded_prefixes):
            if current:
                blocks.append(current)
            current = [line_clean]
            continue
        if current:
            current.append(_clean_pdf_text(line))
    if current:
        blocks.append(current)

    for block in blocks:
        header, *rest = block
        name, _, desc_head = header.partition(":")
        name = _clean_pdf_text(name).lstrip("´'").strip()
        description_bits = [desc_head.strip(), *rest]
        full_text = " ".join(bit for bit in description_bits if bit).strip()
        full_text = _clean_pdf_text(full_text)
        usage = ""
        usage_patterns = [
            ("Action / Réaction", r"Action\s*/\s*R\s*[ée]action"),
            ("Bonus action", r"Bonus action"),
            ("Réaction", r"R\s*[ée]action"),
            ("Action", r"Action"),
        ]
        for label, pattern in usage_patterns:
            if re.search(pattern, full_text, flags=re.IGNORECASE):
                usage = label
                break
        capacities.append(
            {
                "name": name,
                "prepared": False,
                "description": full_text,
                "value": {"main": "", "bonus": ""},
                "cost": {
                    "color": _extract_capacity_color(full_text),
                    "base": 0,
                    "incantationReduction": 0,
                    "colorReduction": 0,
                    "awakeningReduction": 0,
                    "weaponMasteryReduction": 0,
                    "total": 0,
                },
                "incantation": "",
                "save": "",
                "usage": usage,
            }
        )
    return capacities


def fallback_mapping(extracted_text: dict[str, Any], source_stem: str) -> tuple[dict[str, Any], list[str]]:
    combined_text = extracted_text.get("combinedText", "")
    identity_name = source_stem.replace("-", " ").strip().title()
    match_name = re.search(r"\n([A-Z][A-Za-zÀ-ÿ' -]{2,})\nAas", combined_text)
    if match_name:
        identity_name = _clean_pdf_text(match_name.group(1))
    payload = {
        "identity": {
            "nom": identity_name,
            "joueur": "",
            "niveau": 1,
            "race": "",
            "alignement": "",
            "age": "",
            "taille": "",
            "poids": "",
            "yeux": "",
            "peau": "",
            "cheveux": "",
        },
        "stats": {"force": 10, "agilite": 10, "esprit": 10, "social": 10},
        "progression": {"xpDepenses": 0, "xpDisponibles": 0},
        "derived": {},
        "defense": {},
        "resources": {},
        "skills": {},
        "weapons": [],
        "inventory": {"equipement": "", "inventaire": "", "totem": ""},
        "totem": {"nom": "", "description": ""},
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
            "instinct": "",
        },
        "capacities": fallback_capacity_parser(extracted_text),
        "notes": combined_text[:12000],
        "weaponMasteries": [],
        "elementalMasteries": [],
        "inventoryItems": [],
        "feats": [],
        "uncertainFields": [
            "Most fields were not mapped because no LLM provider was configured.",
            "Raw extracted PDF text was placed in notes for manual review.",
        ],
        "warnings": ["Fallback parser used instead of an LLM mapping step."],
    }
    return payload, payload["warnings"]


def _merge_dict(target: dict[str, Any], incoming: dict[str, Any], allowed_keys: list[str]) -> None:
    for key in allowed_keys:
        if key in incoming:
            target[key] = incoming[key]


def _normalize_int(value: Any, default: int) -> int:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        match = re.search(r"-?\d+", value.replace(" ", ""))
        if match:
            return int(match.group(0))
    return default


def normalize_agent_output(agent_output: dict[str, Any], source_stem: str) -> tuple[dict[str, Any], list[str]]:
    now_iso = datetime.now(timezone.utc).isoformat()
    raw_name = (
        ((agent_output.get("identity") or {}).get("nom"))
        or source_stem.replace("-", " ").strip().title()
        or "Personnage"
    )
    character_id = slugify(raw_name)
    character = empty_character(character_id, now_iso)
    warnings: list[str] = []

    identity = agent_output.get("identity") or {}
    if isinstance(identity, dict):
        _merge_dict(
            character["identity"],
            identity,
            ["nom", "joueur", "race", "alignement", "age", "taille", "poids", "yeux", "peau", "cheveux"],
        )
        character["identity"]["niveau"] = _normalize_int(identity.get("niveau"), 1)
    character["identity"]["nom"] = character["identity"]["nom"] or raw_name

    stats = agent_output.get("stats") or {}
    if isinstance(stats, dict):
        for key in ["force", "agilite", "esprit", "social"]:
            character["stats"][key] = _normalize_int(stats.get(key), character["stats"][key])

    progression = agent_output.get("progression") or {}
    if isinstance(progression, dict):
        for key in ["xpDepenses", "xpDisponibles"]:
            character["progression"][key] = _normalize_int(progression.get(key), character["progression"][key])

    for block_name in ["derived", "defense", "resources", "inventory"]:
        block = agent_output.get(block_name) or {}
        if isinstance(block, dict):
            character[block_name].update(block)

    skills = agent_output.get("skills") or {}
    if isinstance(skills, dict):
        normalized_skills: dict[str, Any] = {}
        for key, value in skills.items():
            if not isinstance(value, dict):
                continue
            normalized_skills[str(key)] = {
                "trained": bool(value.get("trained", False)),
                "bonus": _normalize_int(value.get("bonus"), 0),
            }
        character["skills"] = normalized_skills

    if isinstance(agent_output.get("totem"), dict):
        _merge_dict(character["totem"], agent_output["totem"], ["nom", "description"])

    if isinstance(agent_output.get("narrative"), dict):
        character["narrative"].update(agent_output["narrative"])
        traits = character["narrative"].get("traitsSpeciaux")
        if isinstance(traits, str):
            character["narrative"]["traitsSpeciaux"] = [traits] if traits.strip() else []
        elif not isinstance(traits, list):
            character["narrative"]["traitsSpeciaux"] = []

    for list_name in ["weapons", "weaponMasteries", "elementalMasteries", "inventoryItems", "feats"]:
        value = agent_output.get(list_name)
        character[list_name] = value if isinstance(value, list) else []

    capacities = agent_output.get("capacities")
    character["capacities"] = capacities if isinstance(capacities, list) else []
    for capacity in character["capacities"]:
        if not isinstance(capacity, dict):
            continue
        capacity.setdefault("prepared", False)
        capacity.setdefault("image", "")
        capacity.setdefault("description", "")
        capacity.setdefault("value", {"main": "", "bonus": ""})
        capacity.setdefault(
            "cost",
            {
                "color": "spade",
                "base": 0,
                "incantationReduction": 0,
                "colorReduction": 0,
                "awakeningReduction": 0,
                "weaponMasteryReduction": 0,
                "total": 0,
            },
        )
        color = str((capacity.get("cost") or {}).get("color", "spade"))
        if color not in {"spade", "heart", "diamond", "club"}:
            capacity["cost"]["color"] = "spade"
            warnings.append(f"Unknown capacity color was normalized to spade for {capacity.get('name', 'unknown capacity')}.")

    notes_parts = []
    if isinstance(agent_output.get("notes"), str) and agent_output["notes"].strip():
        notes_parts.append(agent_output["notes"].strip())
    uncertain_fields = agent_output.get("uncertainFields")
    if isinstance(uncertain_fields, list) and uncertain_fields:
        notes_parts.append("Uncertain fields:\n" + "\n".join(f"- {item}" for item in uncertain_fields if item))
    character["notes"] = "\n\n".join(notes_parts).strip()

    extra_warnings = agent_output.get("warnings")
    if isinstance(extra_warnings, list):
        warnings.extend(str(item) for item in extra_warnings if item)

    return character, warnings


def _rehome_assets(assets_dir: Path, old_id: str, new_id: str, images_meta: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if old_id == new_id:
        return images_meta
    source_dir = assets_dir / old_id
    target_dir = assets_dir / new_id
    target_dir.mkdir(parents=True, exist_ok=True)
    if source_dir.exists():
        for file in source_dir.iterdir():
            new_path = target_dir / file.name
            file.replace(new_path)
        try:
            source_dir.rmdir()
        except OSError:
            pass
    for item in images_meta:
        item["path"] = f"/assets/{new_id}/{item['filename']}"
    return images_meta


def apply_image_heuristics(character: dict[str, Any], images_meta: list[dict[str, Any]]) -> list[str]:
    warnings: list[str] = []
    if not images_meta:
        return warnings

    page_one = [item for item in images_meta if item["page"] == 1]
    page_two = [item for item in images_meta if item["page"] == 2]
    page_one.sort(key=lambda item: item["area"], reverse=True)
    page_two.sort(key=lambda item: item["area"], reverse=True)

    if page_one and not character.get("portrait"):
        character["portrait"] = page_one[0]["path"]
        warnings.append("Portrait was assigned heuristically from the largest extracted image on page 1.")
    if len(page_one) > 1 and not (character.get("totem") or {}).get("image"):
        character["totem"]["image"] = page_one[1]["path"]
        warnings.append("Totem image was assigned heuristically from page 1.")

    capacities = [item for item in character.get("capacities", []) if isinstance(item, dict)]
    if capacities and page_two:
        for capacity, image_meta in zip(capacities, page_two):
            if not capacity.get("image"):
                capacity["image"] = image_meta["path"]
        warnings.append("Capacity images were assigned heuristically from extracted images on page 2.")

    return warnings


def _unique_strings(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if not value or value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def _copy_file_bytes(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(source.read_bytes())


def extract_pdf_images_for_character(
    pdf_bytes: bytes,
    source_name: str,
    assets_dir: Path,
    character_id: str,
    capacity_count: int = 0,
) -> tuple[dict[str, Any], list[str]]:
    provisional_id = slugify(character_id or Path(source_name).stem)
    images_meta, warnings = extract_pdf_images(pdf_bytes, assets_dir, provisional_id)
    if not images_meta:
        return {
            "characterId": provisional_id,
            "portrait": "",
            "totem": "",
            "capacities": [],
            "extras": [],
            "images": [],
        }, warnings

    target_dir = assets_dir / provisional_id
    page_one = sorted((item for item in images_meta if item["page"] == 1), key=lambda item: item["area"], reverse=True)
    page_two = sorted((item for item in images_meta if item["page"] == 2), key=lambda item: (item["index"], -item["area"]))

    portrait_path = ""
    totem_path = ""
    capacity_paths: list[str] = []
    extras: list[str] = []
    used_filenames: set[str] = set()

    def assign_named_asset(meta: dict[str, Any], base_name: str) -> str:
        ext = Path(meta["filename"]).suffix or ".png"
        target_name = f"{base_name}{ext}"
        source_path = target_dir / meta["filename"]
        target_path = target_dir / target_name
        if source_path.resolve() != target_path.resolve():
            _copy_file_bytes(source_path, target_path)
        used_filenames.add(target_name)
        return f"/assets/{provisional_id}/{target_name}"

    if page_one:
        portrait_path = assign_named_asset(page_one[0], "portrait")
    if len(page_one) > 1:
        totem_path = assign_named_asset(page_one[1], "totem")

    if capacity_count <= 0:
        capacity_count = len(page_two)
    for index, meta in enumerate(page_two[:capacity_count], start=1):
        capacity_paths.append(assign_named_asset(meta, f"img{index}"))

    extra_index = 1
    for meta in images_meta:
        ext = Path(meta["filename"]).suffix or ".png"
        source_path = target_dir / meta["filename"]
        if source_path.name in used_filenames:
            continue
        if meta in page_one[:2] or meta in page_two[:capacity_count]:
            continue
        extra_name = f"extra-{extra_index}{ext}"
        extra_index += 1
        target_path = target_dir / extra_name
        _copy_file_bytes(source_path, target_path)
        extras.append(f"/assets/{provisional_id}/{extra_name}")

    images = []
    if portrait_path:
        images.append({"role": "portrait", "path": portrait_path})
    if totem_path:
        images.append({"role": "totem", "path": totem_path})
    for index, path in enumerate(capacity_paths, start=1):
        images.append({"role": f"capacity-{index}", "path": path})
    for path in extras:
        images.append({"role": "extra", "path": path})

    return {
        "characterId": provisional_id,
        "portrait": portrait_path,
        "totem": totem_path,
        "capacities": capacity_paths,
        "extras": extras,
        "images": images,
    }, warnings


def convert_pdf_to_character(pdf_bytes: bytes, source_name: str, assets_dir: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    source_stem = Path(source_name).stem
    provisional_id = slugify(source_stem)
    extracted_text = extract_pdf_text(pdf_bytes)
    images_meta, image_warnings = extract_pdf_images(pdf_bytes, assets_dir, provisional_id)
    agent_output, llm_warnings = call_openai_pdf_mapper(
        pdf_bytes=pdf_bytes,
        filename=source_name,
        extracted_text=extracted_text.get("combinedText", ""),
    )
    if agent_output is None:
        agent_output, fallback_warnings = fallback_mapping(extracted_text, source_stem)
        llm_warnings.extend(fallback_warnings)

    character, normalize_warnings = normalize_agent_output(agent_output, source_stem)
    images_meta = _rehome_assets(assets_dir, provisional_id, character["id"], images_meta)
    heuristic_warnings = apply_image_heuristics(character, images_meta)
    character["updatedAt"] = datetime.now(timezone.utc).isoformat()
    character.setdefault("createdAt", character["updatedAt"])

    report = {
        "sourceFile": source_name,
        "pageCount": extracted_text.get("pageCount", 0),
        "imagesExtracted": len(images_meta),
        "imageAssets": images_meta,
        "warnings": _unique_strings(image_warnings + llm_warnings + normalize_warnings + heuristic_warnings),
    }
    return character, report
