(function () {
  const DB_NAME = "cardenveil-browser-storage";
  const DB_VERSION = 1;
  const CHARACTERS_STORE = "characters";
  const SETTINGS_STORE = "settings";
  const CURRENT_CHARACTER_KEY = "cardenveil-current-character-id";
  const JSZIP_CDN = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "personnage";
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function defaultCharacter() {
    const now = nowIso();
    return {
      schemaVersion: 1,
      id: "nouveau-personnage",
      templateId: "cardenveil-standard",
      createdAt: now,
      updatedAt: now,
      identity: {
        nom: "Nouveau personnage",
        joueur: "",
        niveau: 1,
        race: "",
        alignement: "",
        age: "",
        taille: "",
        poids: "",
        yeux: "",
        peau: "",
        cheveux: ""
      },
      portrait: "",
      stats: { force: 10, agilite: 10, esprit: 10, social: 10 },
      progression: { xpDepenses: 0, xpDisponibles: 0 },
      derived: {
        pvMax: 110,
        bonusPv: "",
        pvActuels: 110,
        pvTemporaires: 0,
        mouvement: 10,
        initiative: 0,
        perceptionPassive: 10,
        seuilSauvegarde: "",
        seuilMiss: "",
        canalisation: "",
        bonusAttaque: "",
        inspiration: "",
        fatigue: "",
        mort: ""
      },
      defense: { parade: "", armure: "", deflexion: "", gardeBonus: "", bonus: "" },
      resources: { or: "", rations: "", cartesEtTokens: "" },
      skills: {},
      weapons: [],
      inventory: { equipement: "", inventaire: "", totem: "" },
      totem: { nom: "", description: "", image: "" },
      narrative: {
        background: "",
        objectif: "",
        liens: "",
        traitsSpeciaux: [],
        personnalite: "",
        reputation: "",
        education: "",
        croyances: "",
        cicatrices: "",
        pulsion: "",
        maniesEtTics: "",
        instinct: ""
      },
      actions: [],
      reactions: [],
      tokens: [],
      capacities: [],
      notes: "",
      abilityControls: {
        cardMin: "",
        cardMax: "",
        knownAbilities: "",
        maxPreparedAbilities: "",
        colorReductions: { spade: 0, heart: 0, diamond: 0, club: 0 }
      },
      weaponMasteries: [],
      elementalMasteries: [],
      equipment: {
        casque: { nom: "", raretePrix: "", deflexion: "", volonte: "", enchantement: "", description: "" },
        plastron: { nom: "", raretePrix: "", deflexion: "", armure: "", enchantement: "", description: "" },
        gantelets: { nom: "", raretePrix: "", deflexion: "", initiative: "", enchantement: "", description: "" },
        bottes: { nom: "", raretePrix: "", deflexion: "", vitesse: "", enchantement: "", description: "" },
        anneau: { nom: "", raretePrix: "", enchantement: "", description: "" },
        amulette: { nom: "", raretePrix: "", enchantement: "", description: "" },
        cape: { nom: "", raretePrix: "", enchantement: "", description: "" }
      },
      inventoryItems: [],
      feats: []
    };
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(CHARACTERS_STORE)) {
          db.createObjectStore(CHARACTERS_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function withStore(storeName, mode, runner) {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      let result;
      try {
        result = runner(store, resolve, reject);
      } catch (error) {
        reject(error);
      }
      tx.oncomplete = () => {
        db.close();
        if (result !== undefined) resolve(result);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  async function getAllCharacters() {
    return withStore(CHARACTERS_STORE, "readonly", (store, resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async function getCharacter(id) {
    return withStore(CHARACTERS_STORE, "readonly", (store, resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function saveCharacter(character) {
    const clone = deepClone(character);
    const identityName = clone.identity?.nom || clone.name || "personnage";
    const previousId = clone.id || "";
    clone.id = slugify(clone.id || identityName);
    clone.updatedAt = nowIso();
    clone.createdAt = clone.createdAt || clone.updatedAt;

    if (previousId && previousId !== clone.id) {
      await deleteCharacter(previousId);
    }

    return withStore(CHARACTERS_STORE, "readwrite", (store, resolve, reject) => {
      const request = store.put(clone);
      request.onsuccess = () => {
        setCurrentCharacterId(clone.id);
        resolve(clone);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async function deleteCharacter(id) {
    return withStore(CHARACTERS_STORE, "readwrite", (store, resolve, reject) => {
      const request = store.delete(slugify(id));
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async function getSettings() {
    return withStore(SETTINGS_STORE, "readonly", (store, resolve, reject) => {
      const request = store.get("app-settings");
      request.onsuccess = () => resolve(request.result || {});
      request.onerror = () => reject(request.error);
    });
  }

  async function saveSettings(settings) {
    return withStore(SETTINGS_STORE, "readwrite", (store, resolve, reject) => {
      const request = store.put(settings || {}, "app-settings");
      request.onsuccess = () => resolve(settings || {});
      request.onerror = () => reject(request.error);
    });
  }

  function getCurrentCharacterId() {
    return localStorage.getItem(CURRENT_CHARACTER_KEY) || "";
  }

  function setCurrentCharacterId(id) {
    if (!id) {
      localStorage.removeItem(CURRENT_CHARACTER_KEY);
      return;
    }
    localStorage.setItem(CURRENT_CHARACTER_KEY, id);
  }

  function dataUrlToBlob(dataUrl) {
    const match = String(dataUrl || "").match(/^data:(?<mime>[^;]+);base64,(?<data>.+)$/);
    if (!match?.groups) return null;
    const mime = match.groups.mime;
    const bytes = atob(match.groups.data);
    const array = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) {
      array[i] = bytes.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("Lecture impossible"));
      reader.readAsDataURL(blob);
    });
  }

  function extFromMime(mime) {
    const lookup = {
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/webp": ".webp",
      "image/gif": ".gif",
      "image/bmp": ".bmp",
      "image/svg+xml": ".svg"
    };
    return lookup[mime] || ".png";
  }

  function sanitizeFileBase(name) {
    return slugify(String(name || "").replace(/\.[^.]+$/, "")) || "image";
  }

  function extractImageEntries(character) {
    const entries = [];
    const addEntry = (container, key, fallbackName) => {
      const value = container?.[key];
      if (typeof value === "string" && value.startsWith("data:image/")) {
        entries.push({ container, key, dataUrl: value, fallbackName });
      }
    };
    addEntry(character, "portrait", "portrait");
    addEntry(character.totem || {}, "image", "totem");
    (character.capacities || []).forEach((capacity, index) => addEntry(capacity || {}, "image", `capacity-${index + 1}`));
    return entries;
  }

  async function ensureJsZip() {
    if (window.JSZip) return window.JSZip;
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = JSZIP_CDN;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Impossible de charger JSZip"));
      document.head.append(script);
    });
    if (!window.JSZip) {
      throw new Error("JSZip indisponible");
    }
    return window.JSZip;
  }

  async function exportCharacterZip(character) {
    const JSZip = await ensureJsZip();
    const characterClone = deepClone(character);
    const characterId = slugify(characterClone.id || characterClone.identity?.nom || "personnage");
    characterClone.id = characterId;

    const zip = new JSZip();
    for (const entry of extractImageEntries(characterClone)) {
      const blob = dataUrlToBlob(entry.dataUrl);
      if (!blob) continue;
      const ext = extFromMime(blob.type);
      const filename = `${sanitizeFileBase(entry.fallbackName)}${ext}`;
      const zipPath = `assets/${characterId}/${filename}`;
      zip.file(zipPath, blob);
      entry.container[entry.key] = `/${zipPath}`;
    }

    zip.file(`${characterId}.rpsheet.json`, JSON.stringify(characterClone, null, 2));
    const blob = await zip.generateAsync({ type: "blob" });
    return { blob, filename: `${characterId}.zip` };
  }

  async function importCharacterZip(file) {
    const JSZip = await ensureJsZip();
    const zip = await JSZip.loadAsync(file);
    const jsonName = Object.keys(zip.files).find((name) => name.toLowerCase().endsWith(".rpsheet.json"));
    if (!jsonName) {
      throw new Error("Aucune fiche personnage trouvée dans l'archive");
    }
    const character = JSON.parse(await zip.file(jsonName).async("text"));
    const characterId = slugify(character.id || character.identity?.nom || "personnage");
    character.id = characterId;

    const remapPathToDataUrl = async (container, key) => {
      const value = container?.[key];
      if (typeof value !== "string" || !value.startsWith("/assets/")) return;
      const normalized = value.replace(/^\/+/, "");
      const zipEntry = zip.file(normalized) || Object.values(zip.files).find((item) => item.name.endsWith(value.split("/").pop()));
      if (!zipEntry) {
        container[key] = "";
        return;
      }
      const blob = await zipEntry.async("blob");
      container[key] = await blobToDataUrl(blob);
    };

    await remapPathToDataUrl(character, "portrait");
    await remapPathToDataUrl(character.totem || {}, "image");
    for (const capacity of character.capacities || []) {
      await remapPathToDataUrl(capacity || {}, "image");
    }

    return await saveCharacter(character);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.CardenveilStorage = {
    defaultCharacter,
    getAllCharacters,
    getCharacter,
    saveCharacter,
    deleteCharacter,
    getSettings,
    saveSettings,
    getCurrentCharacterId,
    setCurrentCharacterId,
    exportCharacterZip,
    importCharacterZip,
    downloadBlob
  };
})();
