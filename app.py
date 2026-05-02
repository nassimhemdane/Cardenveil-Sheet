from __future__ import annotations

import base64
import io
import json
import mimetypes
import os
import re
import shutil
import socket
import sys
import uuid
import zipfile
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Timer
from urllib.parse import parse_qs, unquote, urlparse
import webbrowser

from pdf_import_agent import (
    convert_pdf_to_character,
    extract_pdf_images_for_character,
    has_openai_api_key,
    load_local_env,
)

APP_ROOT = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
SOURCE_ROOT = Path(__file__).resolve().parent
LOCAL_APPDATA = Path.home() / "AppData" / "Local"
APP_NAME = "FicheCardenveil"


def app_data_root() -> Path:
    if not getattr(sys, "frozen", False):
        return SOURCE_ROOT / "data"
    base = Path(os.environ.get("LOCALAPPDATA") or os.environ.get("APPDATA") or str(LOCAL_APPDATA))
    return base / APP_NAME


DATA_DIR = app_data_root()
BUNDLED_DATA_DIR = APP_ROOT / "data"
TEMPLATE_FILE = DATA_DIR / "templates" / "cardenveil-standard.json"
CHARACTERS_DIR = DATA_DIR / "characters"
ASSETS_DIR = DATA_DIR / "assets"
PICTOGRAMMES_DIR = APP_ROOT / "pictogrammes"
INDEX_FILE = APP_ROOT / "templates" / "index.html"
SETTINGS_FILE = DATA_DIR / "settings.json"


def ensure_dirs() -> None:
    for path in (DATA_DIR, DATA_DIR / "templates", CHARACTERS_DIR, ASSETS_DIR):
        path.mkdir(parents=True, exist_ok=True)
    bundled_templates = BUNDLED_DATA_DIR / "templates"
    target_templates = DATA_DIR / "templates"
    if bundled_templates.exists():
        for source in bundled_templates.glob("*.json"):
            target = target_templates / source.name
            if not target.exists():
                shutil.copy2(source, target)


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9A-ZÀ-ÿ_-]+", "-", value, flags=re.UNICODE)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or "personnage"


def read_json(path: Path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def read_settings() -> dict:
    return read_json(SETTINGS_FILE, {"pdfImageExportDir": ""})


def write_settings(settings: dict) -> None:
    write_json(SETTINGS_FILE, settings)


def _dialog_root():
    import tkinter as tk

    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    return root


def pick_directory_dialog(initial_dir: str = "") -> str:
    from tkinter import filedialog

    root = _dialog_root()
    selected = filedialog.askdirectory(initialdir=initial_dir or str(Path.home()), mustexist=True)
    root.destroy()
    return selected or ""


def pick_pdf_file_dialog(initial_dir: str = "") -> str:
    from tkinter import filedialog

    root = _dialog_root()
    selected = filedialog.askopenfilename(
        initialdir=initial_dir or str(Path.home()),
        filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")],
        title="Choisir un PDF",
    )
    root.destroy()
    return selected or ""


def save_zip_file_dialog(initial_dir: str = "", initial_name: str = "personnage.zip") -> str:
    from tkinter import filedialog

    root = _dialog_root()
    selected = filedialog.asksaveasfilename(
        initialdir=initial_dir or str(Path.home()),
        initialfile=initial_name,
        defaultextension=".zip",
        filetypes=[("ZIP files", "*.zip"), ("All files", "*.*")],
        title="Sauvegarder l'archive ZIP",
    )
    root.destroy()
    return selected or ""


def open_folder(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)
    os.startfile(str(path))


def collect_character_asset_paths(character: dict) -> list[str]:
    paths: list[str] = []

    def add_path(value):
        if isinstance(value, str) and value.startswith("/assets/"):
            paths.append(value)

    add_path(character.get("portrait"))
    add_path((character.get("totem") or {}).get("image"))
    for capacity in character.get("capacities") or []:
        add_path((capacity or {}).get("image"))

    unique_paths: list[str] = []
    seen = set()
    for path in paths:
        if path not in seen:
            seen.add(path)
            unique_paths.append(path)
    return unique_paths


def rewrite_character_asset_paths(character: dict, old_prefix: str, new_prefix: str) -> dict:
    def remap(value):
        if isinstance(value, str) and value.startswith(old_prefix):
            return new_prefix + value[len(old_prefix):]
        return value

    character["portrait"] = remap(character.get("portrait", ""))
    totem = character.get("totem") or {}
    if isinstance(totem, dict):
        totem["image"] = remap(totem.get("image", ""))
    for capacity in character.get("capacities") or []:
        if isinstance(capacity, dict):
            capacity["image"] = remap(capacity.get("image", ""))
    return character


def build_character_export_zip(character: dict) -> tuple[str, bytes]:
    character_id = slugify(character.get("id") or character.get("identity", {}).get("nom") or "personnage")
    buffer = io.BytesIO()

    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(
            f"{character_id}.rpsheet.json",
            json.dumps(character, ensure_ascii=False, indent=2).encode("utf-8")
        )

        for asset_path in collect_character_asset_paths(character):
            asset_file = (ASSETS_DIR / asset_path.removeprefix("/assets/")).resolve()
            if not asset_file.exists() or not asset_file.is_file():
                continue
            archive.write(asset_file, arcname=asset_path.lstrip("/"))

    return f"{character_id}.zip", buffer.getvalue()


def import_character_package(package_bytes: bytes) -> dict:
    with zipfile.ZipFile(io.BytesIO(package_bytes), "r") as archive:
        entries_by_name = {name.replace("\\", "/").strip("/"): name for name in archive.namelist()}
        json_members = [name for name in archive.namelist() if name.lower().endswith(".rpsheet.json")]
        if not json_members:
            raise ValueError("Aucune fiche personnage trouvée dans l'archive")

        character = json.loads(archive.read(json_members[0]).decode("utf-8"))
        identity_name = character.get("identity", {}).get("nom") or character.get("name") or "personnage"
        original_id = slugify(character.get("id") or identity_name)
        character["id"] = original_id
        character["updatedAt"] = datetime.now(timezone.utc).isoformat()
        character.setdefault("createdAt", character["updatedAt"])

        old_prefix = f"/assets/{original_id}/"
        new_prefix = f"/assets/{character['id']}/"
        rewrite_character_asset_paths(character, old_prefix, new_prefix)

        for asset_path in collect_character_asset_paths(character):
            archive_key = asset_path.lstrip("/")
            source_name = entries_by_name.get(archive_key)
            if not source_name:
                fallback_name = Path(asset_path).name
                source_name = next((original for normalized, original in entries_by_name.items() if Path(normalized).name == fallback_name), None)
            if not source_name:
                continue
            target_file = ASSETS_DIR / asset_path.removeprefix("/assets/")
            target_file.parent.mkdir(parents=True, exist_ok=True)
            target_file.write_bytes(archive.read(source_name))

        write_json(character_path(character["id"]), character)
        return character


def character_path(character_id: str) -> Path:
    safe_id = slugify(character_id)
    return CHARACTERS_DIR / f"{safe_id}.rpsheet.json"


def delete_character(character_id: str) -> None:
    safe_id = slugify(character_id)
    target_file = character_path(safe_id)
    if target_file.exists():
        target_file.unlink()
    target_assets = ASSETS_DIR / safe_id
    if target_assets.exists() and target_assets.is_dir():
        shutil.rmtree(target_assets)


def list_characters():
    characters = []
    for file in sorted(CHARACTERS_DIR.glob("*.rpsheet.json")):
        try:
            data = read_json(file, {})
            characters.append(
                {
                    "id": data.get("id") or file.stem.replace(".rpsheet", ""),
                    "name": data.get("identity", {}).get("nom") or data.get("name") or file.stem,
                    "updatedAt": data.get("updatedAt"),
                    "file": file.name,
                }
            )
        except json.JSONDecodeError:
            continue
    return characters


def default_character():
    now = datetime.now(timezone.utc).isoformat()
    return {
        "schemaVersion": 1,
        "id": "nouveau-personnage",
        "templateId": "cardenveil-standard",
        "createdAt": now,
        "updatedAt": now,
        "identity": {
            "nom": "Nouveau personnage",
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
            "pvMax": 110,
            "bonusPv": "",
            "pvActuels": 110,
            "pvTemporaires": 0,
            "mouvement": 10,
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
        "defense": {"parade": "", "armure": "", "deflexion": "", "gardeBonus": ""},
        "resources": {
            "or": "",
            "rations": "",
            "cartesEtTokens": "",
            "tokens": {"force": "", "agilite": "", "esprit": "", "social": ""},
        },
        "skills": {},
        "weapons": [],
        "inventory": {"equipement": "", "inventaire": "", "totem": ""},
        "totem": {"nom": "", "description": "", "image": ""},
        "narrative": {
            "background": "",
            "objectif": "",
            "liens": "",
            "traitsSpeciaux": "",
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
    }


class AppHandler(SimpleHTTPRequestHandler):
    server_version = "CardenveilSheet/0.1"

    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_bytes(self, body: bytes, content_type: str, filename: str | None = None, status=200):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        if filename:
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.end_headers()
        self.wfile.write(body)

    def read_body_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8") if length else "{}"
        return json.loads(raw or "{}")

    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)

        if path == "/":
            self.serve_file(INDEX_FILE, "text/html; charset=utf-8")
            return
        if path == "/api/template":
            self.send_json(read_json(TEMPLATE_FILE, {}))
            return
        if path == "/api/characters":
            self.send_json({"characters": list_characters()})
            return
        if path == "/api/settings":
            self.send_json({"settings": read_settings()})
            return
        if path == "/api/character":
            params = parse_qs(parsed.query)
            character_id = params.get("id", ["nouveau-personnage"])[0]
            data = read_json(character_path(character_id), default_character())
            self.send_json({"character": data})
            return
        if path.startswith("/api/export-package"):
            params = parse_qs(parsed.query)
            character_id = params.get("id", ["nouveau-personnage"])[0]
            character = read_json(character_path(character_id), default_character())
            filename, body = build_character_export_zip(character)
            self.send_bytes(body, "application/zip", filename=filename)
            return
        if path.startswith("/assets/"):
            self.serve_file(ASSETS_DIR / path.removeprefix("/assets/"))
            return
        if path.startswith("/pictogrammes/"):
            self.serve_file(APP_ROOT / path.lstrip("/"))
            return
        if path.startswith("/static/"):
            self.serve_file(APP_ROOT / path.lstrip("/"))
            return

        self.send_error(404, "Introuvable")

    def do_POST(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/character":
            payload = self.read_body_json()
            character = payload.get("character") or {}
            identity_name = character.get("identity", {}).get("nom") or character.get("name") or "personnage"
            character["id"] = slugify(character.get("id") or identity_name)
            character["updatedAt"] = datetime.now(timezone.utc).isoformat()
            write_json(character_path(character["id"]), character)
            self.send_json({"ok": True, "character": character})
            return

        if parsed.path == "/api/delete-character":
            payload = self.read_body_json()
            character_id = slugify(payload.get("id") or "")
            if not character_id:
                self.send_json({"ok": False, "error": "Personnage introuvable"}, status=400)
                return
            if character_id == "nouveau-personnage":
                self.send_json({"ok": False, "error": "Impossible de supprimer ce personnage par défaut"}, status=400)
                return
            delete_character(character_id)
            self.send_json({"ok": True})
            return

        if parsed.path == "/api/image":
            payload = self.read_body_json()
            character_id = slugify(payload.get("characterId") or "personnage")
            image_name = slugify(payload.get("name") or "image")
            data_url = payload.get("dataUrl") or ""
            match = re.match(r"data:(?P<mime>[-\w.]+/[-\w.+]+);base64,(?P<data>.+)", data_url)
            if not match:
                self.send_json({"ok": False, "error": "Image invalide"}, status=400)
                return
            mime = match.group("mime")
            ext = mimetypes.guess_extension(mime) or ".png"
            target_dir = ASSETS_DIR / character_id
            target_dir.mkdir(parents=True, exist_ok=True)
            unique_suffix = f"{datetime.now().strftime('%Y%m%d%H%M%S%f')}-{uuid.uuid4().hex[:8]}"
            target = target_dir / f"{image_name}-{unique_suffix}{ext}"
            target.write_bytes(base64.b64decode(match.group("data")))
            self.send_json({"ok": True, "path": f"/assets/{character_id}/{target.name}"})
            return

        if parsed.path.startswith("/api/export-package"):
            payload = self.read_body_json()
            character = payload.get("character") or {}
            if not character:
                self.send_json({"ok": False, "error": "Personnage introuvable"}, status=400)
                return
            filename, body = build_character_export_zip(character)
            self.send_bytes(body, "application/zip", filename=filename)
            return

        if parsed.path == "/api/save-package-dialog":
            payload = self.read_body_json()
            character = payload.get("character") or {}
            if not character:
                self.send_json({"ok": False, "error": "Personnage introuvable"}, status=400)
                return
            filename, body = build_character_export_zip(character)
            selected = save_zip_file_dialog(initial_name=filename)
            if not selected:
                self.send_json({"ok": False, "error": "Sauvegarde annulée"}, status=400)
                return
            target = Path(selected)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(body)
            open_folder(target.parent)
            self.send_json({"ok": True, "savedTo": str(target)})
            return

        if parsed.path == "/api/import-package":
            payload = self.read_body_json()
            data_url = payload.get("dataUrl") or ""
            match = re.match(r"data:application/(zip|x-zip-compressed);base64,(?P<data>.+)", data_url)
            if not match:
                self.send_json({"ok": False, "error": "Archive invalide"}, status=400)
                return
            try:
                character = import_character_package(base64.b64decode(match.group("data")))
            except (ValueError, zipfile.BadZipFile, json.JSONDecodeError):
                self.send_json({"ok": False, "error": "Impossible d'importer cette archive"}, status=400)
                return
            self.send_json({"ok": True, "character": character})
            return

        if parsed.path == "/api/import-pdf":
            payload = self.read_body_json()
            data_url = payload.get("dataUrl") or ""
            filename = payload.get("filename") or "personnage.pdf"
            allow_fallback = bool(payload.get("allowFallback"))
            match = re.match(r"data:application/pdf;base64,(?P<data>.+)", data_url)
            if not match:
                self.send_json({"ok": False, "error": "PDF invalide"}, status=400)
                return
            if not has_openai_api_key() and not allow_fallback:
                self.send_json(
                    {
                        "ok": False,
                        "error": "OPENAI_API_KEY manquant. Configure la clé pour utiliser l'import PDF par IA.",
                    },
                    status=400,
                )
                return
            try:
                character, report = convert_pdf_to_character(
                    pdf_bytes=base64.b64decode(match.group("data")),
                    source_name=filename,
                    assets_dir=ASSETS_DIR,
                )
            except Exception as exc:
                self.send_json({"ok": False, "error": f"Impossible d'importer ce PDF: {exc}"}, status=400)
                return
            write_json(character_path(character["id"]), character)
            self.send_json({"ok": True, "character": character, "report": report})
            return

        if parsed.path == "/api/extract-pdf-images":
            payload = self.read_body_json()
            data_url = payload.get("dataUrl") or ""
            filename = payload.get("filename") or "personnage.pdf"
            character_id = slugify(payload.get("characterId") or "personnage")
            capacity_count = int(payload.get("capacityCount") or 0)
            match = re.match(r"data:application/pdf;base64,(?P<data>.+)", data_url)
            if not match:
                self.send_json({"ok": False, "error": "PDF invalide"}, status=400)
                return
            character = read_json(character_path(character_id), default_character())
            try:
                extraction, warnings = extract_pdf_images_for_character(
                    pdf_bytes=base64.b64decode(match.group("data")),
                    source_name=filename,
                    assets_dir=ASSETS_DIR,
                    character_id=character_id,
                    capacity_count=capacity_count,
                )
            except Exception as exc:
                self.send_json({"ok": False, "error": f"Impossible d'extraire les images du PDF: {exc}"}, status=400)
                return

            settings = read_settings()
            export_dir = str(settings.get("pdfImageExportDir") or "").strip()
            opened_folder = ""
            if export_dir:
                target_dir = Path(export_dir) / character["id"]
                target_dir.mkdir(parents=True, exist_ok=True)
                for image_info in extraction.get("images") or []:
                    asset_path = str(image_info.get("path") or "")
                    if not asset_path.startswith("/assets/"):
                        continue
                    source_file = ASSETS_DIR / asset_path.removeprefix("/assets/")
                    if source_file.exists() and source_file.is_file():
                        shutil.copy2(source_file, target_dir / source_file.name)
                open_folder(target_dir)
                opened_folder = str(target_dir)
            else:
                internal_dir = ASSETS_DIR / character["id"]
                open_folder(internal_dir)
                opened_folder = str(internal_dir)

            if extraction.get("portrait"):
                character["portrait"] = extraction["portrait"]
            character.setdefault("totem", {"nom": "", "description": "", "image": ""})
            if extraction.get("totem"):
                character["totem"]["image"] = extraction["totem"]

            character["capacities"] = character.get("capacities") or []
            for index, image_path in enumerate(extraction.get("capacities") or []):
                while len(character["capacities"]) <= index:
                    character["capacities"].append(
                        {
                            "name": "",
                            "prepared": False,
                            "image": "",
                            "description": "",
                            "value": {"main": "", "bonus": ""},
                            "cost": {
                                "color": "spade",
                                "base": 0,
                                "incantationReduction": 0,
                                "colorReduction": 0,
                                "awakeningReduction": 0,
                                "weaponMasteryReduction": 0,
                                "total": 0,
                            },
                            "incantation": "",
                            "save": "",
                            "usage": "",
                        }
                    )
                if not character["capacities"][index].get("image"):
                    character["capacities"][index]["image"] = image_path

            character["updatedAt"] = datetime.now(timezone.utc).isoformat()
            write_json(character_path(character["id"]), character)
            self.send_json(
                {
                    "ok": True,
                    "character": character,
                    "report": {"warnings": warnings, "openedFolder": opened_folder, **extraction},
                }
            )
            return

        if parsed.path == "/api/extract-pdf-images-dialog":
            payload = self.read_body_json()
            character_id = slugify(payload.get("characterId") or "personnage")
            capacity_count = int(payload.get("capacityCount") or 0)
            character = read_json(character_path(character_id), default_character())
            pdf_path = pick_pdf_file_dialog()
            if not pdf_path:
                self.send_json({"ok": False, "error": "Sélection du PDF annulée"}, status=400)
                return
            export_dir = pick_directory_dialog(str(Path(pdf_path).parent))
            if not export_dir:
                self.send_json({"ok": False, "error": "Sélection du dossier annulée"}, status=400)
                return
            try:
                extraction, warnings = extract_pdf_images_for_character(
                    pdf_bytes=Path(pdf_path).read_bytes(),
                    source_name=Path(pdf_path).name,
                    assets_dir=ASSETS_DIR,
                    character_id=character_id,
                    capacity_count=capacity_count,
                )
            except Exception as exc:
                self.send_json({"ok": False, "error": f"Impossible d'extraire les images du PDF: {exc}"}, status=400)
                return

            target_dir = Path(export_dir) / character["id"]
            target_dir.mkdir(parents=True, exist_ok=True)
            for image_info in extraction.get("images") or []:
                asset_path = str(image_info.get("path") or "")
                if not asset_path.startswith("/assets/"):
                    continue
                source_file = ASSETS_DIR / asset_path.removeprefix("/assets/")
                if source_file.exists() and source_file.is_file():
                    shutil.copy2(source_file, target_dir / source_file.name)
            open_folder(target_dir)

            if extraction.get("portrait"):
                character["portrait"] = extraction["portrait"]
            character.setdefault("totem", {"nom": "", "description": "", "image": ""})
            if extraction.get("totem"):
                character["totem"]["image"] = extraction["totem"]

            character["capacities"] = character.get("capacities") or []
            for index, image_path in enumerate(extraction.get("capacities") or []):
                while len(character["capacities"]) <= index:
                    character["capacities"].append(
                        {
                            "name": "",
                            "prepared": False,
                            "image": "",
                            "description": "",
                            "value": {"main": "", "bonus": ""},
                            "cost": {
                                "color": "spade",
                                "base": 0,
                                "incantationReduction": 0,
                                "colorReduction": 0,
                                "awakeningReduction": 0,
                                "weaponMasteryReduction": 0,
                                "total": 0,
                            },
                            "incantation": "",
                            "save": "",
                            "usage": "",
                        }
                    )
                if not character["capacities"][index].get("image"):
                    character["capacities"][index]["image"] = image_path

            character["updatedAt"] = datetime.now(timezone.utc).isoformat()
            write_json(character_path(character["id"]), character)
            self.send_json(
                {
                    "ok": True,
                    "character": character,
                    "report": {
                        "warnings": warnings,
                        "openedFolder": str(target_dir),
                        "selectedPdf": pdf_path,
                        **extraction,
                    },
                }
            )
            return

        if parsed.path == "/api/pick-pdf-image-folder":
            settings = read_settings()
            selected = pick_directory_dialog(str(settings.get("pdfImageExportDir") or ""))
            if selected:
                settings["pdfImageExportDir"] = selected
                write_settings(settings)
            self.send_json({"ok": True, "settings": read_settings()})
            return

        self.send_error(404, "Introuvable")

    def serve_file(self, path: Path, content_type: str | None = None):
        resolved = path.resolve()
        allowed = [APP_ROOT.resolve(), ASSETS_DIR.resolve(), PICTOGRAMMES_DIR.resolve()]
        if not any(resolved.is_relative_to(base) for base in allowed) or not resolved.exists() or not resolved.is_file():
            self.send_error(404, "Introuvable")
            return
        body = resolved.read_bytes()
        content_type = content_type or mimetypes.guess_type(resolved.name)[0] or "application/octet-stream"
        if content_type.startswith("text/") and "charset" not in content_type:
            content_type += "; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def choose_port(start=8000, attempts=20) -> int:
    for port in range(start, start + attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            if sock.connect_ex(("127.0.0.1", port)) != 0:
                return port
    raise OSError("Aucun port disponible")


def maybe_open_browser(port: int) -> None:
    if os.environ.get("CARDENVEIL_NO_BROWSER") == "1":
        return
    Timer(1.0, lambda: webbrowser.open(f"http://127.0.0.1:{port}/")).start()


def main():
    load_local_env(SOURCE_ROOT)
    ensure_dirs()
    port = choose_port(8000)
    server = ThreadingHTTPServer(("127.0.0.1", port), AppHandler)
    maybe_open_browser(port)
    print(f"Cardenveil Sheet lance sur http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
