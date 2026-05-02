const state = {
  template: null,
  character: null,
  settings: {},
  dirtyTimer: null,
  saving: false,
  draggingCapacityIndex: null,
  mode: "edit"
};

const CAPACITY_COLOR_OPTIONS = [
  { value: "spade", symbol: "\u2660" },
  { value: "heart", symbol: "\u2665" },
  { value: "diamond", symbol: "\u2666" },
  { value: "club", symbol: "\u2663" }
];

const EQUIPMENT_SLOT_FIELDS = {
  casque: ["nom", "raretePrix", "deflexion", "volonte", "enchantement", "description"],
  plastron: ["nom", "raretePrix", "deflexion", "armure", "enchantement", "description"],
  gantelets: ["nom", "raretePrix", "deflexion", "initiative", "enchantement", "description"],
  bottes: ["nom", "raretePrix", "deflexion", "vitesse", "enchantement", "description"],
  anneau: ["nom", "raretePrix", "enchantement", "description"],
  amulette: ["nom", "raretePrix", "enchantement", "description"],
  cape: ["nom", "raretePrix", "enchantement", "description"]
};

const EQUIPMENT_SLOT_LABELS = {
  casque: "Casque",
  plastron: "Plastron",
  gantelets: "Gantelets",
  bottes: "Bottes",
  anneau: "Anneau",
  amulette: "Amulette",
  cape: "Cape"
};

const EQUIPMENT_PICTOGRAMS = {
  casque: "/static/pictogrammes/Helmet.png",
  plastron: "/static/pictogrammes/Breastplate.png",
  gantelets: "/static/pictogrammes/Gantlets.png",
  bottes: "/static/pictogrammes/Boots.png",
  anneau: "/static/pictogrammes/Ring.png",
  amulette: "/static/pictogrammes/Amulet.png",
  cape: "/static/pictogrammes/cape.png"
};

const INVENTORY_TYPE_OPTIONS = ["Divers", "Consommable", "Arme", "Équipement"];

const WEAPON_FAMILY_SUMMARIES = {
  "Épées droites": "Parade avec Force + Agilité, une parade réussie donne l'avantage.",
  "Épées courbes": "Permettent les enchaînements, un désavantage peut devenir un avantage au prochain coup.",
  "Haches": "Critique = dés doublés, les critiques peuvent s'enchaîner.",
  "Massues": "Ignorent l'armure, réduisent la parade et repoussent sur critique.",
  "Armes à allonge": "Portée de 3 m, excellent contrôle des opportunités.",
  "Arcs": "Prennent l'avantage depuis la hauteur.",
  "Arbalètes": "Ignorent l'armure et réduisent la parade.",
  "Catalyseurs": "Utilisent l'Esprit et la mécanique de canalisation.",
  "Boucliers": "Défense passive et parade spéciale.",
  "Armes uniques": "Comportement spécial selon l'arme."
};

const WEAPON_DATABASE = {
  "Épées droites": [
    { name: "Dague", damage: "1d4", attributes: ["Finesse", "Légère", "Lancer", "Garde"] },
    { name: "Épée courte", damage: "1d6", attributes: ["Finesse", "Garde"] },
    { name: "Épée longue", damage: "1d8", attributes: ["Polyvalente", "Garde"] },
    { name: "Espadon", damage: "1d12", attributes: ["Deux mains", "Garde"] }
  ],
  "Épées courbes": [
    { name: "Serpe", damage: "1d4", attributes: ["Légère", "Fluide"] },
    { name: "Épée courbe", damage: "1d6", attributes: ["Finesse", "Légère", "Fluide"] },
    { name: "Katana", damage: "1d10", attributes: ["Finesse", "Deux mains", "Fluide"] },
    { name: "Grand sabre", damage: "1d12", attributes: ["Deux mains", "Fluide"] }
  ],
  "Haches": [
    { name: "Hachette", damage: "1d6", attributes: ["Légère", "Lancer", "Brutalité"] },
    { name: "Hache d’armes", damage: "1d8", attributes: ["Polyvalente", "Brutalité"] },
    { name: "Grande hache", damage: "1d12", attributes: ["Deux mains", "Brutalité"] }
  ],
  "Massues": [
    { name: "Gourdin", damage: "1d4", attributes: ["Improvisée", "Brute", "Impact"] },
    { name: "Marteau de guerre", damage: "1d8", attributes: ["Polyvalente", "Impact"] },
    { name: "Grand marteau", damage: "1d12", attributes: ["Deux mains", "Impact"] }
  ],
  "Armes à allonge": [
    { name: "Bâton long", damage: "1d6", attributes: ["Allonge"] },
    { name: "Lance", damage: "1d8", attributes: ["Polyvalente", "Allonge"] },
    { name: "Hallebarde", damage: "1d12", attributes: ["Deux mains", "Allonge"] }
  ],
  "Armes uniques": [
    { name: "Faux", damage: "1d10", attributes: ["Deux mains", "Fluide", "Allonge"] },
    { name: "Twinblade", damage: "1d8", attributes: ["Deux mains", "Spéciale"] },
    { name: "Rapière", damage: "1d8", attributes: ["Finesse", "Spéciale"] },
    { name: "Fouet", damage: "1d6", attributes: ["Finesse", "Spéciale"] },
    { name: "Fist weapons", damage: "1d4", attributes: ["Brute"] },
    { name: "Fléau", damage: "1d8", attributes: ["Spéciale"] }
  ],
  "Arcs": [
    { name: "Arc court", damage: "1d6", attributes: ["Distance", "Surplomb"] },
    { name: "Arc long", damage: "1d8", attributes: ["Distance", "Surplomb"] }
  ],
  "Arbalètes": [
    { name: "Arbalète de poing", damage: "1d4", attributes: ["Distance", "Brute", "Tir léger", "Secondaire", "Perforant"] },
    { name: "Arbalète", damage: "1d8", attributes: ["Distance", "Perforant"] },
    { name: "Arbalète lourde", damage: "1d12", attributes: ["Distance", "Recharge", "Perforant"] }
  ],
  "Catalyseurs": [
    { name: "Focus", damage: "1d4", attributes: ["Catalyseur"] },
    { name: "Bâton", damage: "1d8", attributes: ["Catalyseur"] }
  ],
  "Boucliers": [
    { name: "Bouclier", damage: "1d4", attributes: ["Rempart"] }
  ]
};

const $ = (selector, root = document) => root.querySelector(selector);

function isEditMode() {
  return state.mode === "edit";
}

function modifier(score) {
  return Math.floor((Number(score || 0) - 10) / 2);
}

function getPath(obj, path, fallback = "") {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj) ?? fallback;
}

function setPath(obj, path, value) {
  const parts = path.split(".");
  let target = obj;
  for (const part of parts.slice(0, -1)) {
    target[part] = target[part] || {};
    target = target[part];
  }
  target[parts.at(-1)] = value;
}

function toNumber(value, fallback = 0) {
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeCapacityColor(value) {
  const color = String(value || "").trim().toLowerCase();
  const aliases = {
    spade: "spade",
    spades: "spade",
    pique: "spade",
    heart: "heart",
    hearts: "heart",
    coeur: "heart",
    "c\u0153ur": "heart",
    diamond: "diamond",
    diamonds: "diamond",
    carreau: "diamond",
    carreaux: "diamond",
    club: "club",
    clubs: "club",
    trefle: "club",
    "tr\u00e8fle": "club",
    trefles: "club",
    "tr\u00e8fles": "club",
    "\u2660": "spade",
    "\u2665": "heart",
    "\u2666": "diamond",
    "\u2663": "club"
  };
  return aliases[color] || "spade";
}

function computeCapacityTotal(cost = {}) {
  return (
    toNumber(cost.base)
    - toNumber(cost.incantationReduction)
    - toNumber(cost.colorReduction)
    - toNumber(cost.awakeningReduction)
    - toNumber(cost.weaponMasteryReduction)
  );
}

function normalizeCapacity(capacity = {}) {
  const costSource = capacity.cost || {};
  const normalized = {
    name: capacity.name ?? capacity.nom ?? "",
    prepared: Boolean(capacity.prepared),
    image: capacity.image || "",
    description: capacity.description ?? capacity.effet ?? "",
    value: {
      main: capacity.value?.main ?? "",
      bonus: capacity.value?.bonus ?? capacity.amelioration ?? ""
    },
    cost: {
      color: normalizeCapacityColor(costSource.color ?? capacity.color),
      base: toNumber(costSource.base ?? capacity.cout, 0),
      incantationReduction: toNumber(costSource.incantationReduction, 0),
      colorReduction: toNumber(costSource.colorReduction, 0),
      awakeningReduction: toNumber(costSource.awakeningReduction, 0),
      weaponMasteryReduction: toNumber(costSource.weaponMasteryReduction, 0),
      total: 0
    },
    incantation: capacity.incantation ?? capacity.declencheur ?? "",
    save: capacity.save ?? capacity.portee ?? "",
    usage: capacity.usage ?? capacity.type ?? ""
  };
  normalized.cost.total = computeCapacityTotal(normalized.cost);
  return normalized;
}

function normalizeCharacterData(character) {
  if (!character) return character;
  character.capacities = (character.capacities || []).map(normalizeCapacity);
  character.feats = (character.feats || []).map((item) => ({
    title: item.title || item.nom || "",
    description: item.description || ""
  }));
  character.narrative = character.narrative || {};
  const existingTraits = character.narrative.traitsSpeciaux;
  if (Array.isArray(existingTraits)) {
    character.narrative.traitsSpeciaux = existingTraits.map((item) => String(item || ""));
  } else if (typeof existingTraits === "string" && existingTraits.trim()) {
    character.narrative.traitsSpeciaux = [existingTraits.trim()];
  } else {
    character.narrative.traitsSpeciaux = [];
  }
  character.abilityControls = character.abilityControls || {
    cardMin: "",
    cardMax: "",
    knownAbilities: "",
    maxPreparedAbilities: "",
    colorReductions: { spade: 0, heart: 0, diamond: 0, club: 0 }
  };
  character.abilityControls.colorReductions = {
    spade: toNumber(character.abilityControls.colorReductions?.spade, 0),
    heart: toNumber(character.abilityControls.colorReductions?.heart, 0),
    diamond: toNumber(character.abilityControls.colorReductions?.diamond, 0),
    club: toNumber(character.abilityControls.colorReductions?.club, 0)
  };
  character.weaponMasteries = (character.weaponMasteries || []).map((item) => ({
    family: item.family || "",
    perfection: toNumber(item.perfection, 0)
  }));
  character.weapons = (character.weapons || []).map((item) => ({
    nom: item.nom || "",
    de: item.de || "",
    forceAgi: item.forceAgi || "",
    critique: item.critique || "",
    avantage: item.avantage || "",
    bonus: item.bonus || "",
    perfection: item.perfection || "",
    notes: item.notes || ""
  }));
  character.elementalMasteries = (character.elementalMasteries || []).map((item) => ({
    element: item.element || "",
    level: toNumber(item.level, 1)
  }));
  character.equipment = character.equipment || {};
  for (const [slot, fields] of Object.entries(EQUIPMENT_SLOT_FIELDS)) {
    character.equipment[slot] = character.equipment[slot] || {};
    for (const fieldName of fields) {
      character.equipment[slot][fieldName] = character.equipment[slot][fieldName] || "";
    }
  }
  character.inventoryItems = (character.inventoryItems || []).map(normalizeInventoryItem);
  return character;
}

function isImageFile(file) {
  if (!file) return false;
  return !file.type || file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name || "");
}

async function getClipboardImage(event) {
  const items = event.clipboardData?.items || [];
  for (const item of items) {
    if (item.type?.startsWith("image/")) {
      return item.getAsFile();
    }
  }
  return null;
}

function attachImageDropZone(zone, input, targetObject, targetKey = "image") {
  zone.tabIndex = 0;
  zone.addEventListener("click", (event) => {
    if (!isEditMode()) return;
    if (event.target.tagName !== "INPUT" && event.target.tagName !== "TEXTAREA" && event.target.tagName !== "BUTTON") {
      input.click();
    }
  });
  input.addEventListener("change", () => {
    if (!isEditMode()) {
      input.value = "";
      return;
    }
    const file = input.files?.[0];
    input.value = "";
    uploadImage(file, targetObject, targetKey);
  });
  zone.addEventListener("dragover", (event) => {
    if (!isEditMode()) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    zone.classList.add("drag");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag"));
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.classList.remove("drag");
    if (!isEditMode()) return;
    uploadImage(event.dataTransfer?.files?.[0], targetObject, targetKey);
  });
  zone.addEventListener("paste", async (event) => {
    if (!isEditMode()) return;
    const file = await getClipboardImage(event);
    if (!file) return;
    event.preventDefault();
    uploadImage(file, targetObject, targetKey);
  });
}

function normalizeInventoryItem(item = {}) {
  const normalized = {
    type: item.type || "Divers",
    slot: item.slot || "casque",
    family: item.family || "Épées droites",
    weaponName: item.weaponName || "",
    name: item.name || "",
    raretePrix: item.raretePrix || "",
    description: item.description || "",
    degats: item.degats || "",
    parade: item.parade || "",
    attributs: item.attributs || "",
    familySummary: item.familySummary || "",
    catalystColor: normalizeCapacityColor(item.catalystColor || "spade"),
    equipmentData: item.equipmentData || {}
  };
  normalized.equipmentData = normalizeInventoryEquipmentData(normalized.slot, normalized.equipmentData);
  return normalized;
}

function normalizeInventoryEquipmentData(slot, source = {}) {
  const data = {};
  for (const fieldName of EQUIPMENT_SLOT_FIELDS[slot] || []) {
    data[fieldName] = source[fieldName] || "";
  }
  return data;
}

function imageSrcWithVersion(path) {
  if (!path) return "";
  const token = encodeURIComponent(state.character?.updatedAt || Date.now());
  return `${path}${path.includes("?") ? "&" : "?"}v=${token}`;
}

function field(path, label, type = "text", options = {}) {
  const wrap = document.createElement("div");
  wrap.className = `field ${options.className || ""}`;
  const id = `f-${path.replaceAll(".", "-")}-${Math.random().toString(36).slice(2)}`;
  const labelEl = document.createElement("label");
  labelEl.setAttribute("for", id);
  labelEl.textContent = label;
  const input = document.createElement(type === "textarea" ? "textarea" : "input");
  input.id = id;
  if (type !== "textarea") input.type = type;
  input.value = getPath(state.character, path, "");
  input.addEventListener("input", () => {
    const value = input.type === "number" ? Number(input.value || 0) : input.value;
    setPath(state.character, path, value);
    recalculate();
    scheduleSave();
  });
  wrap.append(labelEl, input);
  return wrap;
}

function module(title, span = 4) {
  const section = document.createElement("section");
  section.className = `module span-${span}`;
  const h = document.createElement("h3");
  h.textContent = title;
  section.append(h);
  return section;
}

function render() {
  $("#templateName").textContent = state.template?.name || "";
  const root = $("#sheetRoot");
  root.innerHTML = "";

  const rectoPage = document.createElement("article");
  rectoPage.className = "sheet-page sheet-page-main screen-page";
  rectoPage.append(renderRectoLayout());
  root.append(rectoPage);

  for (const page of state.template.pages.filter((item) => item.id !== "recto")) {
    const pageEl = document.createElement("article");
    pageEl.className = "sheet-page sheet-page-flow screen-page";
    pageEl.append(renderGenericPage(page));
    root.append(pageEl);
  }

  const systemsPage = document.createElement("article");
  systemsPage.className = "sheet-page sheet-page-flow";
  systemsPage.append(renderEquipmentSection(), renderInventorySection());
  root.append(systemsPage);

  recalculate();
  applyModeToSheet();
}

function applyModeToSheet() {
  document.body.dataset.mode = state.mode;
  const root = $("#sheetRoot");
  if (!root) return;

  root.querySelectorAll("textarea").forEach((textarea) => {
    textarea.readOnly = !isEditMode();
  });

  root.querySelectorAll("select, button").forEach((element) => {
    element.disabled = !isEditMode();
  });

  root.querySelectorAll("input").forEach((input) => {
    if (["checkbox", "radio", "file"].includes(input.type)) {
      input.disabled = !isEditMode();
    } else {
      input.readOnly = !isEditMode();
    }
  });
}

function renderGenericPage(page) {
  const grid = document.createElement("div");
  grid.className = "module-grid";
  for (const moduleId of page.modules) {
    const block = renderModule(moduleId);
    if (block) grid.append(block);
  }
  return grid;
}

function renderRectoLayout() {
  const grid = document.createElement("div");
  grid.className = "sheet-recto";

  const left = document.createElement("div");
  left.className = "sheet-column left-column";
  left.append(renderPortrait(), renderStats(), renderInventory());

  const center = document.createElement("div");
  center.className = "sheet-column center-column";
  center.append(renderIdentity(), renderCombatPanel(), renderWeapons());

  const right = document.createElement("div");
  right.className = "sheet-column right-column";
  right.append(renderPhysical(), renderNarrative());

  grid.append(left, center, right);
  return grid;
}

function renderModule(id) {
  const renderers = {
    identity: renderIdentity,
    stats: renderStats,
    combat: renderCombat,
    skills: renderSkills,
    weapons: renderWeapons,
    inventory: renderInventory,
    narrative: renderNarrative,
    capacities: renderCapacities,
    notes: renderNotes
  };
  if (!renderers[id]) return null;
  return renderers[id]();
}

function renderPortrait() {
  const m = module("Portrait", 12);
  m.classList.add("portrait-module");
  const slot = document.createElement("label");
  slot.className = "portrait-slot image-drop";
  const image = getPath(state.character, "portrait", "");
  if (image) {
    const img = document.createElement("img");
    img.src = imageSrcWithVersion(image);
    img.alt = "Portrait du personnage";
    slot.append(img);
  } else {
    slot.textContent = "Portrait";
  }
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  attachImageDropZone(slot, input, state.character, "portrait");
  slot.append(input);
  m.append(slot);
  return m;
}

function renderInspiration() {
  const m = module("Inspiration", 12);
  m.classList.add("compact-module");
  m.append(field("derived.inspiration", "Inspiration"));
  return m;
}

function renderIdentity() {
  const m = module("Identité", 12);
  m.classList.add("identity-module");
  const grid = document.createElement("div");
  grid.className = "identity-grid";
  [
    ["identity.nom", "Nom du personnage"],
    ["identity.race", "Race"],
    ["identity.alignement", "Alignement"],
    ["identity.joueur", "Nom joueur"],
    ["progression.xpDepenses", "XP dépensés", "number"],
    ["progression.xpDisponibles", "XP disponibles", "number"],
    ["identity.niveau", "Niveau", "number"]
  ].forEach(([path, label, type]) => grid.append(combatField(path, label, "identity-field", type || "text")));
  m.append(grid);
  return m;
}

function renderPhysical() {
  const m = module("Physique", 12);
  const grid = document.createElement("div");
  grid.className = "physical-box-grid";
  [
    ["identity.age", "Âge"],
    ["identity.taille", "Taille"],
    ["identity.poids", "Poids"],
    ["identity.yeux", "Yeux"],
    ["identity.peau", "Peau"],
    ["identity.cheveux", "Cheveux"]
  ].forEach(([path, label]) => grid.append(combatField(path, label, "physical-field")));
  m.append(grid);
  return m;
}

function renderStats() {
  const m = module("Caractéristiques", 12);
  const wrap = document.createElement("div");
  wrap.className = "stat-skill-list";
  for (const stat of state.template.stats) {
    const group = document.createElement("div");
    group.className = `stat-skill-group stat-${stat.key}`;

    const box = document.createElement("div");
    box.className = "stat-box";
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "20";
    input.value = getPath(state.character, `stats.${stat.key}`, 10);
    const mod = document.createElement("span");
    mod.dataset.modFor = stat.key;
    const bonus = document.createElement("input");
    bonus.className = "stat-bonus-input";
    bonus.type = "text";
    bonus.value = getPath(state.character, `statBonuses.${stat.key}`, "");
    bonus.title = `Bonus ${stat.label}`;
    bonus.addEventListener("input", () => {
      setPath(state.character, `statBonuses.${stat.key}`, bonus.value);
      scheduleSave();
    });
    const label = document.createElement("strong");
    label.textContent = stat.label;
    input.addEventListener("input", () => {
      setPath(state.character, `stats.${stat.key}`, Number(input.value || 0));
      recalculate();
      scheduleSave();
    });
    box.append(mod, input, bonus, label);
    group.append(box, renderSkillGroup(stat.key));
    wrap.append(group);
  }
  m.append(wrap);
  return m;
}

function renderSkillGroup(statKey) {
  const list = document.createElement("div");
  list.className = "skill-list";
  for (const skill of state.template.skills.filter((item) => item.stat === statKey)) {
    state.character.skills[skill.key] = state.character.skills[skill.key] || { trained: false, bonus: 0 };
    const row = document.createElement("label");
    row.className = "skill-row";
    const trained = document.createElement("input");
    trained.type = "checkbox";
    trained.checked = Boolean(state.character.skills[skill.key].trained);
    const name = document.createElement("span");
    name.textContent = skill.label;
    const bonus = document.createElement("input");
    bonus.type = "number";
    bonus.value = state.character.skills[skill.key].bonus ?? 0;
    trained.addEventListener("change", () => {
      state.character.skills[skill.key].trained = trained.checked;
      scheduleSave();
    });
    bonus.addEventListener("input", () => {
      state.character.skills[skill.key].bonus = Number(bonus.value || 0);
      scheduleSave();
    });
    row.append(trained, name, bonus);
    list.append(row);
  }
  return list;
}

function renderCombat() {
  const m = module("Combat", 12);
  const grid = document.createElement("div");
  grid.className = "combat-grid";
  [
    ["derived.pvMax", "Max PV", "number"],
    ["derived.bonusPv", "Bonus PV"],
    ["derived.pvActuels", "PV actuels", "number"],
    ["derived.pvTemporaires", "PV temporaires", "number"],
    ["derived.initiative", "Initiative", "number"],
    ["derived.mouvement", "Mouvement", "number"],
    ["derived.seuilMiss", "Seuil de miss"],
    ["derived.bonusAttaque", "Bns. attaque"],
    ["derived.canalisation", "Canalisation"],
    ["derived.seuilSauvegarde", "Seuil sauvegarde"]
  ].forEach(([path, label, type]) => grid.append(field(path, label, type || "text")));
  m.append(grid);
  return m;
}

function renderDefenseBlock() {
  const m = module("Défense", 12);
  const grid = document.createElement("div");
  grid.className = "defense-grid";
  [
    ["defense.parade", "Parade"],
    ["defense.armure", "Armure"],
    ["defense.deflexion", "Déflexion"],
    ["defense.gardeBonus", "Garde"],
    ["defense.bonus", "Bonus"],
    ["derived.fatigue", "Fatigue"],
    ["derived.mort", "Mort"]
  ].forEach(([path, label]) => grid.append(field(path, label)));
  m.append(grid);
  return m;
}

function combatField(path, label, className = "", type = "text") {
  const wrap = document.createElement("div");
  wrap.className = `combat-field ${className}`;
  const input = document.createElement("input");
  input.type = type;
  input.value = getPath(state.character, path, "");
  input.addEventListener("input", () => {
    const value = input.type === "number" ? Number(input.value || 0) : input.value;
    setPath(state.character, path, value);
    scheduleSave();
  });
  const rule = document.createElement("span");
  rule.className = "combat-rule";
  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  wrap.append(input, rule, labelEl);
  return wrap;
}

function dualCombatField(leftPath, leftLabel, rightPath, rightLabel, className = "") {
  const wrap = document.createElement("div");
  wrap.className = `combat-field dual-combat-field ${className}`;

  const left = document.createElement("div");
  left.className = "dual-side";
  const leftInput = document.createElement("input");
  leftInput.type = "number";
  leftInput.value = getPath(state.character, leftPath, "");
  leftInput.addEventListener("input", () => {
    setPath(state.character, leftPath, Number(leftInput.value || 0));
    scheduleSave();
  });
  const leftRule = document.createElement("span");
  leftRule.className = "combat-rule";
  const leftLabelEl = document.createElement("label");
  leftLabelEl.textContent = leftLabel;
  left.append(leftInput, leftRule, leftLabelEl);

  const divider = document.createElement("span");
  divider.className = "dual-divider";
  divider.textContent = "|";

  const right = document.createElement("div");
  right.className = "dual-side";
  const rightInput = document.createElement("input");
  rightInput.type = "number";
  rightInput.value = getPath(state.character, rightPath, "");
  rightInput.addEventListener("input", () => {
    setPath(state.character, rightPath, Number(rightInput.value || 0));
    scheduleSave();
  });
  const rightRule = document.createElement("span");
  rightRule.className = "combat-rule";
  const rightLabelEl = document.createElement("label");
  rightLabelEl.textContent = rightLabel;
  right.append(rightInput, rightRule, rightLabelEl);

  wrap.append(left, divider, right);
  return wrap;
}

function renderCombatPanel() {
  const m = module("Combat", 12);
  m.classList.add("combat-panel-module");
  const panel = document.createElement("div");
  panel.className = "combat-panel";

  const left = document.createElement("div");
  left.className = "combat-left";
  left.append(
    combatField("defense.parade", "Parade", "shield-field parade-field"),
    combatField("defense.armure", "Armure", "shield-field armor-field"),
    renderFatigueTrack()
  );

  const right = document.createElement("div");
  right.className = "combat-right";

  const top = document.createElement("div");
  top.className = "combat-top-row";
  top.append(
    combatField("defense.deflexion", "Déflexion", "cut-field"),
    combatField("defense.gardeBonus", "Garde", "cut-field"),
    combatField("defense.bonus", "Bonus", "cut-field")
  );

  const mid = document.createElement("div");
  mid.className = "combat-mid-row";
  mid.append(
    combatField("derived.initiative", "Initiative", "cut-field big-value", "number"),
    combatField("derived.mouvement", "Mouvement", "cut-field big-value", "number")
  );

  const pv = document.createElement("div");
  pv.className = "combat-pv-row";
  const pvMain = document.createElement("div");
  pvMain.className = "pv-stack";
  pvMain.append(
    dualCombatField("derived.pvActuels", "PV actuels", "derived.pvMax", "Max PV", "cut-field big-value")
  );
  const pvBonus = document.createElement("div");
  pvBonus.className = "pv-bonus";
  pvBonus.append(
    combatField("derived.bonusPv", "Bonus PV", "cut-field"),
    combatField("derived.pvTemporaires", "PV temporaires", "cut-field", "number")
  );
  pv.append(pvMain, pvBonus);

  const bottom = document.createElement("div");
  bottom.className = "combat-bottom-row";
  bottom.append(
    combatField("derived.seuilMiss", "Seuil. Miss", "cut-field big-value"),
    combatField("derived.bonusAttaque", "Bns. attaque", "cut-field"),
    combatField("derived.canalisation", "Canalisation", "cut-field"),
    combatField("derived.seuilSauvegarde", "Seuil. sauv.", "cut-field")
  );

  right.append(top, mid, pv);
  panel.append(left, right, bottom);
  m.append(panel);
  return m;
}

function renderFatigueTrack() {
  const wrap = document.createElement("div");
  wrap.className = "fatigue-track cut-field";
  const options = [
    "-1 val.cartes",
    "-2 val.cartes",
    "-4 val.cartes",
    "-6 val.cartes",
    "Mort"
  ];
  const current = getPath(state.character, "derived.fatigue", "");
  for (const option of options) {
    const label = document.createElement("label");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "fatigue";
    radio.value = option;
    radio.checked = current === option;
    radio.addEventListener("change", () => {
      setPath(state.character, "derived.fatigue", option);
      scheduleSave();
    });
    const dot = document.createElement("span");
    dot.className = "fatigue-dot";
    const text = document.createElement("span");
    text.textContent = option;
    label.append(radio, dot, text);
    wrap.append(label);
  }
  const rule = document.createElement("span");
  rule.className = "combat-rule";
  const title = document.createElement("strong");
  title.textContent = "Fatigue";
  wrap.append(rule, title);
  return wrap;
}

function renderSkills() {
  const m = module("Compétences", 4);
  const list = document.createElement("div");
  list.className = "skill-list";
  for (const skill of state.template.skills) {
    state.character.skills[skill.key] = state.character.skills[skill.key] || { trained: false, bonus: 0 };
    const row = document.createElement("label");
    row.className = "skill-row";
    const trained = document.createElement("input");
    trained.type = "checkbox";
    trained.checked = Boolean(state.character.skills[skill.key].trained);
    const name = document.createElement("span");
    name.textContent = skill.label;
    const bonus = document.createElement("input");
    bonus.type = "number";
    bonus.value = state.character.skills[skill.key].bonus ?? 0;
    trained.addEventListener("change", () => {
      state.character.skills[skill.key].trained = trained.checked;
      scheduleSave();
    });
    bonus.addEventListener("input", () => {
      state.character.skills[skill.key].bonus = Number(bonus.value || 0);
      scheduleSave();
    });
    row.append(trained, name, bonus);
    list.append(row);
  }
  m.append(list);
  return m;
}

function renderWeapons() {
  const m = module("Armes", 12);
  state.character.weapons = state.character.weapons || [];
  const list = document.createElement("div");
  list.className = "weapon-card-list";
  state.character.weapons.forEach((weapon, index) => list.append(renderWeaponCard(weapon, index)));
  const add = document.createElement("button");
  add.className = "add-button";
  add.type = "button";
  add.textContent = "Ajouter une arme";
  add.addEventListener("click", () => {
    state.character.weapons.push({ nom: "", de: "", forceAgi: "", critique: "", avantage: "", bonus: "", perfection: "", notes: "" });
    render();
    scheduleSave();
  });
  m.append(list, add);
  return m;
}

function weaponInput(weapon, key, label) {
  const wrap = document.createElement("label");
  wrap.className = "weapon-field";
  const text = document.createElement("span");
  text.textContent = label;
  const input = document.createElement("input");
  input.value = weapon[key] || "";
  input.addEventListener("input", () => {
    weapon[key] = input.value;
    scheduleSave();
  });
  wrap.append(text, input);
  return wrap;
}

function renderWeaponCard(weapon, index) {
  weapon.forceAgi = weapon.forceAgi ?? "";
  weapon.critique = weapon.critique ?? "";
  weapon.avantage = weapon.avantage ?? "";
  weapon.bonus = weapon.bonus ?? "";
  weapon.perfection = weapon.perfection ?? "";
  const card = document.createElement("article");
  card.className = "weapon-card";

  const top = document.createElement("div");
  top.className = "weapon-top";
  top.append(weaponInput(weapon, "nom", "Arme"), weaponInput(weapon, "de", "Dé de l'arme"));

  const bottom = document.createElement("div");
  bottom.className = "weapon-bottom";
  [
    ["forceAgi", "Force/Agi"],
    ["critique", "Critique"],
    ["avantage", "Avantage"],
    ["bonus", "Bonus"],
    ["perfection", "Perfection"]
  ].forEach(([key, label], itemIndex) => {
    bottom.append(weaponInput(weapon, key, label));
    if (itemIndex < 4) {
      const plus = document.createElement("span");
      plus.className = "weapon-plus";
      plus.textContent = "+";
      bottom.append(plus);
    }
  });

  const remove = document.createElement("button");
  remove.className = "remove-button weapon-remove";
  remove.type = "button";
  remove.textContent = "×";
  remove.addEventListener("click", () => {
    state.character.weapons.splice(index, 1);
    render();
    scheduleSave();
  });

  const notes = document.createElement("textarea");
  notes.className = "weapon-notes";
  notes.value = weapon.notes || "";
  notes.addEventListener("input", () => {
    weapon.notes = notes.value;
    scheduleSave();
  });

  card.append(top, bottom, notes, remove);
  return card;
}

function renderInventory() {
  const m = module("Totem", 12);
  const grid = document.createElement("div");
  grid.className = "totem-wrap";
  grid.append(renderTotemCard());
  m.append(grid);
  return m;
}

function renderTotemCard() {
  state.character.totem = state.character.totem || {};
  const totem = state.character.totem;
  const card = document.createElement("article");
  card.className = "totem-card";

  const top = document.createElement("div");
  top.className = "totem-top";
  const image = document.createElement("label");
  image.className = "totem-image";
  if (totem.image) {
    const img = document.createElement("img");
    img.src = imageSrcWithVersion(totem.image);
    img.alt = totem.nom || "Totem";
    image.append(img);
  } else {
    image.textContent = "Image";
  }
  const file = document.createElement("input");
  file.type = "file";
  file.accept = "image/*";
  attachImageDropZone(image, file, totem);
  image.append(file);

  const name = document.createElement("input");
  name.className = "totem-name";
  name.placeholder = "Nom du totem";
  name.value = totem.nom || "";
  name.addEventListener("input", () => {
    totem.nom = name.value;
    scheduleSave();
  });

  top.append(image, name);

  const description = document.createElement("textarea");
  description.className = "totem-description";
  description.value = totem.description || "";
  description.addEventListener("input", () => {
    totem.description = description.value;
    scheduleSave();
  });

  const label = document.createElement("div");
  label.className = "totem-label";
  label.textContent = "Totem";

  card.append(top, description, label);
  return card;
}

function renderNarrative() {
  const m = module("Narratif", 12);
  const grid = document.createElement("div");
  grid.className = "narrative-grid";
  [
    ["narrative.background", "Background"],
    ["narrative.objectif", "Objectif"],
    ["narrative.liens", "Liens"],
    ["narrative.personnalite", "Personnalité"],
    ["narrative.reputation", "Réputation"],
    ["narrative.education", "Éducation"],
    ["narrative.croyances", "Croyances"],
    ["narrative.cicatrices", "Cicatrices"],
    ["narrative.pulsion", "Pulsion"],
    ["narrative.maniesEtTics", "Manies et tics"],
    ["narrative.instinct", "Instinct"]
  ].forEach(([path, label]) => grid.append(field(path, label, "textarea")));
  m.append(grid, renderStringList("Traits spéciaux", state.character.narrative.traitsSpeciaux));
  return m;
}

function renderStringList(title, items) {
  const wrap = document.createElement("section");
  wrap.className = "string-list-block";

  const titleEl = document.createElement("h4");
  titleEl.className = "string-list-title";
  titleEl.textContent = title;

  const list = document.createElement("div");
  list.className = "string-list";
  items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "string-list-row";

    const input = document.createElement("input");
    input.className = "line-input";
    input.value = item || "";
    input.addEventListener("input", () => {
      items[index] = input.value;
      scheduleSave();
    });

    const remove = document.createElement("button");
    remove.className = "remove-button";
    remove.type = "button";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      items.splice(index, 1);
      render();
      scheduleSave();
    });

    row.append(input, remove);
    list.append(row);
  });

  const add = document.createElement("button");
  add.className = "add-button";
  add.type = "button";
  add.textContent = "Ajouter un trait";
  add.addEventListener("click", () => {
    items.push("");
    render();
    scheduleSave();
  });

  wrap.append(titleEl, list, add);
  return wrap;
}

function renderPassiveAndCards() {
  const m = module("Tokens", 12);
  const grid = document.createElement("div");
  grid.className = "token-box-grid";
  [
    ["resources.tokens.force", "Force"],
    ["resources.tokens.agilite", "Agilité"],
    ["resources.tokens.esprit", "Esprit"],
    ["resources.tokens.social", "Social"]
  ].forEach(([path, label]) => grid.append(combatField(path, label, "token-box")));
  m.append(grid);
  return m;
}

function renderSimpleList(title, path, span) {
  const m = module(title, span);
  m.append(renderRows(path, "compact-row", ["nom", "description"], ["Nom", "Description"]));
  return m;
}

function renderRows(path, rowClass, keys, labels) {
  state.character[path] = state.character[path] || [];
  const wrap = document.createElement("div");
  wrap.className = "table-list";
  state.character[path].forEach((item, index) => {
    const row = document.createElement("div");
    row.className = `row ${rowClass}`;
    keys.forEach((key, keyIndex) => {
      const input = document.createElement("input");
      input.className = "line-input";
      input.placeholder = labels[keyIndex];
      input.value = item[key] || "";
      input.addEventListener("input", () => {
        item[key] = input.value;
        scheduleSave();
      });
      row.append(input);
    });
    const remove = document.createElement("button");
    remove.className = "remove-button";
    remove.type = "button";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      state.character[path].splice(index, 1);
      render();
      scheduleSave();
    });
    row.append(remove);
    wrap.append(row);
  });
  const add = document.createElement("button");
  add.className = "add-button";
  add.type = "button";
  add.textContent = "Ajouter";
  add.addEventListener("click", () => {
    state.character[path].push(Object.fromEntries(keys.map((key) => [key, ""])));
    render();
    scheduleSave();
  });
  wrap.append(add);
  return wrap;
}

function renderCapacities() {
  const m = module("Capacités", 12);
  state.character.capacities = (state.character.capacities || []).map(normalizeCapacity);

  m.append(renderMechanicalMasteries());

  const list = document.createElement("div");
  list.className = "capacity-list";
  state.character.capacities.forEach((cap, index) => list.append(capacityCard(cap, index)));

  const add = document.createElement("button");
  add.className = "add-button";
  add.type = "button";
  add.textContent = "Ajouter une capacité";
  add.addEventListener("click", () => {
    state.character.capacities.push(normalizeCapacity());
    render();
    scheduleSave();
  });

  m.append(list, add);
  return m;
}

function capacityCard(cap, index) {
  cap = normalizeCapacity(cap);
  state.character.capacities[index] = cap;

  const card = document.createElement("article");
  card.className = "capacity-card";

  const head = document.createElement("div");
  head.className = "capacity-head";

  const prepared = document.createElement("input");
  prepared.type = "checkbox";
  prepared.className = "capacity-prepared-toggle";
  prepared.checked = Boolean(cap.prepared);
  prepared.addEventListener("change", () => {
    cap.prepared = prepared.checked;
    scheduleSave();
  });

  const title = document.createElement("input");
  title.className = "capacity-name-input";
  title.placeholder = "Nom de la capacité";
  title.value = cap.name || "";
  title.addEventListener("input", () => {
    cap.name = title.value;
    scheduleSave();
  });

  const dragHandle = document.createElement("div");
  dragHandle.className = "capacity-drag-handle";
  dragHandle.draggable = true;
  dragHandle.textContent = "::";
  attachCapacityDrag(card, dragHandle, index);

  const remove = document.createElement("button");
  remove.className = "remove-button";
  remove.type = "button";
  remove.textContent = "×";
  remove.addEventListener("click", () => {
    state.character.capacities.splice(index, 1);
    render();
    scheduleSave();
  });
  head.append(prepared, title, dragHandle, remove);

  const meta = document.createElement("div");
  meta.className = "capacity-meta";
  meta.append(
    capacityMetaField(cap, "usage", "Utilisation"),
    capacityMetaField(cap, "incantation", "Incantation"),
    capacityMetaField(cap, "save", "Sauvegarde")
  );

  const visual = document.createElement("div");
  visual.className = "capacity-visual";
  visual.append(capacityImageBlock(cap), capacityDetailsBlock(cap));

  const descriptionWrap = document.createElement("div");
  descriptionWrap.className = "capacity-description-block";
  const descriptionLabel = document.createElement("label");
  descriptionLabel.textContent = "Description";
  const description = document.createElement("textarea");
  description.className = "capacity-description";
  description.value = cap.description || "";
  description.addEventListener("input", () => {
    cap.description = description.value;
    scheduleSave();
  });
  descriptionWrap.append(descriptionLabel, description);

  card.append(head, meta, visual, descriptionWrap);
  return card;
}

function attachCapacityDrag(card, handle, index) {
  handle.addEventListener("dragstart", (event) => {
    if (!isEditMode()) {
      event.preventDefault();
      return;
    }
    state.draggingCapacityIndex = index;
    card.classList.add("capacity-card-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  });

  handle.addEventListener("dragend", () => {
    state.draggingCapacityIndex = null;
    clearCapacityDropMarkers();
  });

  card.addEventListener("dragover", (event) => {
    if (!isEditMode()) return;
    if (state.draggingCapacityIndex === null || state.draggingCapacityIndex === index) return;
    event.preventDefault();
    const rect = card.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    clearCapacityDropMarkers();
    card.classList.add(before ? "capacity-drop-before" : "capacity-drop-after");
  });

  card.addEventListener("dragleave", () => {
    card.classList.remove("capacity-drop-before", "capacity-drop-after");
  });

  card.addEventListener("drop", (event) => {
    if (!isEditMode()) return;
    event.preventDefault();
    const fromIndex = state.draggingCapacityIndex;
    if (fromIndex === null || fromIndex === index) return;

    const rect = card.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    const [moved] = state.character.capacities.splice(fromIndex, 1);
    let targetIndex = index;
    if (!before && fromIndex < index) targetIndex = index;
    if (before && fromIndex < index) targetIndex = index - 1;
    if (!before && fromIndex > index) targetIndex = index + 1;
    state.character.capacities.splice(targetIndex, 0, moved);

    state.draggingCapacityIndex = null;
    clearCapacityDropMarkers();
    render();
    scheduleSave();
  });
}

function clearCapacityDropMarkers() {
  document.querySelectorAll(".capacity-card").forEach((card) => {
    card.classList.remove("capacity-card-dragging", "capacity-drop-before", "capacity-drop-after");
  });
}

function capacityMetaField(cap, key, labelText) {
  const wrap = document.createElement("label");
  wrap.className = "capacity-meta-field";
  const label = document.createElement("span");
  label.textContent = labelText;
  const input = document.createElement("input");
  input.value = cap[key] || "";
  input.addEventListener("input", () => {
    cap[key] = input.value;
    scheduleSave();
  });
  wrap.append(label, input);
  return wrap;
}

function capacityImageBlock(cap) {
  const label = document.createElement("label");
  label.className = "image-drop capacity-image-drop";
  if (cap.image) {
    const img = document.createElement("img");
    img.src = imageSrcWithVersion(cap.image);
    img.alt = cap.name || "Image de capacité";
    label.append(img);
  } else {
    label.textContent = "Image";
  }
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  attachImageDropZone(label, input, cap);
  label.append(input);
  return label;
}

function capacityValueField(cap, path, labelText) {
  const wrap = document.createElement("label");
  wrap.className = "capacity-value-field";
  const label = document.createElement("span");
  label.textContent = labelText;
  const input = document.createElement("input");
  input.value = getPath(cap, path, "");
  input.addEventListener("input", () => {
    setPath(cap, path, input.value);
    scheduleSave();
  });
  wrap.append(label, input);
  return wrap;
}

function capacityCostInput(cap, key, labelText, totalInput) {
  const wrap = document.createElement("label");
  wrap.className = "capacity-cost-mini";
  const label = document.createElement("span");
  label.textContent = labelText;
  const input = document.createElement("input");
  input.type = "number";
  input.value = cap.cost[key] ?? 0;
  input.addEventListener("input", () => {
    cap.cost[key] = toNumber(input.value, 0);
    const total = computeCapacityTotal(cap.cost);
    cap.cost.total = total;
    totalInput.value = total;
    scheduleSave();
  });
  wrap.append(label, input);
  return wrap;
}

function capacityOperator(symbol) {
  const op = document.createElement("span");
  op.className = "capacity-cost-operator";
  op.textContent = symbol;
  return op;
}

function updateColorSelectAppearance(select) {
  select.classList.remove("color-spade", "color-heart", "color-diamond", "color-club");
  select.classList.add(`color-${select.value}`);
}

function capacityDetailsBlock(cap) {
  const wrap = document.createElement("div");
  wrap.className = "capacity-details";

  const valueSection = document.createElement("section");
  valueSection.className = "capacity-section";
  const valueTitle = document.createElement("h4");
  valueTitle.textContent = "Valeur";
  const valueGrid = document.createElement("div");
  valueGrid.className = "capacity-value-grid";
  valueGrid.append(
    capacityValueField(cap, "value.main", "Valeur principale"),
    capacityValueField(cap, "value.bonus", "Bonus")
  );
  valueSection.append(valueTitle, valueGrid);

  const costSection = document.createElement("section");
  costSection.className = "capacity-section capacity-cost-section";
  const costTitle = document.createElement("h4");
  costTitle.textContent = "Coût";

  const totalInput = document.createElement("input");
  totalInput.type = "number";
  totalInput.readOnly = true;
  totalInput.value = computeCapacityTotal(cap.cost);
  cap.cost.total = toNumber(totalInput.value, 0);

  const formulaRow = document.createElement("div");
  formulaRow.className = "capacity-cost-formula";
  formulaRow.append(
    capacityCostInput(cap, "base", "Base", totalInput),
    capacityOperator("-"),
    capacityCostInput(cap, "incantationReduction", "Incantation", totalInput),
    capacityOperator("-"),
    capacityCostInput(cap, "colorReduction", "Couleur", totalInput),
    capacityOperator("-"),
    capacityCostInput(cap, "awakeningReduction", "Éveil", totalInput),
    capacityOperator("-"),
    capacityCostInput(cap, "weaponMasteryReduction", "Arme", totalInput)
  );

  const footer = document.createElement("div");
  footer.className = "capacity-cost-footer";

  const totalWrap = document.createElement("label");
  totalWrap.className = "capacity-total-field";
  const totalLabel = document.createElement("span");
  totalLabel.textContent = "Total";
  totalWrap.append(capacityOperator("="), totalLabel, totalInput);

  const colorField = document.createElement("label");
  colorField.className = "capacity-color-field";
  const colorLabel = document.createElement("span");
  colorLabel.textContent = "Couleur";
  const colorSelect = document.createElement("select");
  for (const optionDef of CAPACITY_COLOR_OPTIONS) {
    const option = document.createElement("option");
    option.value = optionDef.value;
    option.textContent = optionDef.symbol;
    option.selected = optionDef.value === cap.cost.color;
    colorSelect.append(option);
  }
  colorSelect.addEventListener("change", () => {
    cap.cost.color = colorSelect.value;
    updateColorSelectAppearance(colorSelect);
    scheduleSave();
  });
  updateColorSelectAppearance(colorSelect);
  colorField.append(colorLabel, colorSelect);

  footer.append(totalWrap, colorField);
  costSection.append(costTitle, formulaRow, footer);

  wrap.append(valueSection, costSection);
  return wrap;
}

function renderMechanicalMasteries() {
  const wrap = document.createElement("section");
  wrap.className = "mechanical-masteries";

  const title = document.createElement("h4");
  title.className = "mechanical-masteries-title";
  title.textContent = "Maîtrises mécaniques";

  const grid = document.createElement("div");
  grid.className = "mechanical-masteries-grid";
  grid.append(
    renderWeaponMasteriesPanel(),
    renderCardsAbilitiesPanel(),
    renderElementalMasteriesPanel()
  );

  wrap.append(title, grid, renderFeatsPanel());
  return wrap;
}

function renderFeatsPanel() {
  const panel = document.createElement("section");
  panel.className = "mastery-panel mastery-feats-panel";
  const title = document.createElement("h5");
  title.textContent = "Dons";
  panel.append(title);

  const list = document.createElement("div");
  list.className = "feats-list";
  state.character.feats.forEach((feat, index) => {
    const card = document.createElement("article");
    card.className = "feat-card";

    const head = document.createElement("div");
    head.className = "feat-head";
    const name = document.createElement("input");
    name.placeholder = "Titre du don";
    name.value = feat.title || "";
    name.addEventListener("input", () => {
      feat.title = name.value;
      scheduleSave();
    });
    const remove = document.createElement("button");
    remove.className = "remove-button";
    remove.type = "button";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      state.character.feats.splice(index, 1);
      render();
      scheduleSave();
    });
    head.append(name, remove);

    const description = document.createElement("textarea");
    description.placeholder = "Description";
    description.value = feat.description || "";
    description.addEventListener("input", () => {
      feat.description = description.value;
      scheduleSave();
    });

    card.append(head, description);
    list.append(card);
  });

  const add = document.createElement("button");
  add.className = "add-button";
  add.type = "button";
  add.textContent = "Ajouter un don";
  add.addEventListener("click", () => {
    state.character.feats.push({ title: "", description: "" });
    render();
    scheduleSave();
  });

  panel.append(list, add);
  return panel;
}

function renderWeaponMasteriesPanel() {
  const panel = document.createElement("section");
  panel.className = "mastery-panel";
  const title = document.createElement("h5");
  title.textContent = "Maîtrises d’armes";
  panel.append(title);

  const list = document.createElement("div");
  list.className = "mastery-list";
  for (const [index, item] of state.character.weaponMasteries.entries()) {
    const row = document.createElement("div");
    row.className = "mastery-row";

    const family = document.createElement("input");
    family.placeholder = "Famille d’arme";
    family.value = item.family || "";
    family.addEventListener("input", () => {
      item.family = family.value;
      scheduleSave();
    });

    const perfection = document.createElement("input");
    perfection.type = "number";
    perfection.placeholder = "Perfection +0";
    perfection.value = item.perfection ?? 0;
    perfection.addEventListener("input", () => {
      item.perfection = toNumber(perfection.value, 0);
      scheduleSave();
    });

    const remove = document.createElement("button");
    remove.className = "remove-button";
    remove.type = "button";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      state.character.weaponMasteries.splice(index, 1);
      render();
      scheduleSave();
    });

    row.append(family, perfection, remove);
    list.append(row);
  }

  const add = document.createElement("button");
  add.className = "add-button";
  add.type = "button";
  add.textContent = "Ajouter une famille";
  add.addEventListener("click", () => {
    state.character.weaponMasteries.push({ family: "", perfection: 0 });
    render();
    scheduleSave();
  });

  panel.append(list, add);
  return panel;
}

function renderCardsAbilitiesPanel() {
  const panel = document.createElement("section");
  panel.className = "mastery-panel mastery-panel-center";
  const title = document.createElement("h5");
  title.textContent = "Cartes & capacités";
  panel.append(title);

  const controls = state.character.abilityControls;
  const top = document.createElement("div");
  top.className = "cards-abilities-grid";
  [
    ["cardMin", "Carte min"],
    ["cardMax", "Carte max"],
    ["knownAbilities", "Capacités connues"],
    ["maxPreparedAbilities", "Capacités préparées max"]
  ].forEach(([key, label]) => top.append(masteryField(controls, key, label)));

  const reductions = document.createElement("div");
  reductions.className = "color-reduction-grid";
  for (const option of CAPACITY_COLOR_OPTIONS) {
    reductions.append(colorReductionField(option, controls.colorReductions));
  }

  panel.append(top, reductions);
  return panel;
}

function renderElementalMasteriesPanel() {
  const panel = document.createElement("section");
  panel.className = "mastery-panel";
  const title = document.createElement("h5");
  title.textContent = "Maîtrises élémentaires";
  panel.append(title);

  const list = document.createElement("div");
  list.className = "mastery-list";
  for (const [index, item] of state.character.elementalMasteries.entries()) {
    const row = document.createElement("div");
    row.className = "mastery-row";

    const element = document.createElement("input");
    element.placeholder = "Élément";
    element.value = item.element || "";
    element.addEventListener("input", () => {
      item.element = element.value;
      scheduleSave();
    });

    const level = document.createElement("input");
    level.type = "number";
    level.min = "1";
    level.max = "5";
    level.value = item.level ?? 1;
    level.addEventListener("input", () => {
      item.level = Math.max(1, Math.min(5, toNumber(level.value, 1)));
      scheduleSave();
    });

    const remove = document.createElement("button");
    remove.className = "remove-button";
    remove.type = "button";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      state.character.elementalMasteries.splice(index, 1);
      render();
      scheduleSave();
    });

    row.append(element, level, remove);
    list.append(row);
  }

  const add = document.createElement("button");
  add.className = "add-button";
  add.type = "button";
  add.textContent = "Ajouter un élément";
  add.addEventListener("click", () => {
    state.character.elementalMasteries.push({ element: "", level: 1 });
    render();
    scheduleSave();
  });

  panel.append(list, add);
  return panel;
}

function masteryField(target, key, labelText) {
  const wrap = document.createElement("label");
  wrap.className = "mastery-field";
  const label = document.createElement("span");
  label.textContent = labelText;
  const input = document.createElement("input");
  input.value = target[key] ?? "";
  input.addEventListener("input", () => {
    target[key] = input.value;
    scheduleSave();
  });
  wrap.append(label, input);
  return wrap;
}

function colorReductionField(option, target) {
  const wrap = document.createElement("label");
  wrap.className = `mastery-field mastery-color-field color-${option.value}`;
  const label = document.createElement("span");
  label.textContent = option.symbol;
  const input = document.createElement("input");
  input.type = "number";
  input.value = target[option.value] ?? 0;
  input.addEventListener("input", () => {
    target[option.value] = toNumber(input.value, 0);
    scheduleSave();
  });
  wrap.append(label, input);
  return wrap;
}

function renderEquipmentSection() {
  const section = module("Équipement", 12);
  section.classList.add("equipment-section");

  const grid = document.createElement("div");
  grid.className = "equipment-grid";
  const orderedSlots = [
    "amulette", "casque", "cape",
    "gantelets", "plastron", "anneau",
    "empty-left", "bottes", "empty-right"
  ];
  for (const slot of orderedSlots) {
    if (slot.startsWith("empty-")) {
      const spacer = document.createElement("div");
      spacer.className = "equipment-grid-spacer";
      grid.append(spacer);
      continue;
    }
    grid.append(renderEquipmentCard(slot, EQUIPMENT_SLOT_LABELS[slot], state.character.equipment[slot]));
  }

  section.append(grid);
  return section;
}

function renderEquipmentCard(slot, titleText, item) {
  const card = document.createElement("article");
  card.className = "equipment-card";
  card.dataset.slot = slot;

  const header = document.createElement("div");
  header.className = "equipment-card-header";
  const iconWrap = document.createElement("div");
  iconWrap.className = "equipment-card-icon";
  const icon = document.createElement("img");
  icon.src = EQUIPMENT_PICTOGRAMS[slot];
  icon.alt = titleText;
  iconWrap.append(icon);
  const title = document.createElement("h4");
  title.textContent = titleText;

  const fields = document.createElement("div");
  fields.className = "equipment-card-fields";
  for (const fieldName of EQUIPMENT_SLOT_FIELDS[slot]) {
    fields.append(equipmentField(item, fieldName));
  }
  header.append(iconWrap, title);
  card.append(header, fields);
  return card;
}

function equipmentField(target, fieldName) {
  const wrap = document.createElement("label");
  wrap.className = ["description", "enchantement"].includes(fieldName)
    ? "equipment-field equipment-field-wide"
    : "equipment-field";
  const label = document.createElement("span");
  label.textContent = equipmentFieldLabel(fieldName);
  const input = document.createElement(fieldName === "description" ? "textarea" : "input");
  input.value = target[fieldName] || "";
  input.addEventListener("input", () => {
    target[fieldName] = input.value;
    scheduleSave();
  });
  wrap.append(label, input);
  return wrap;
}

function equipmentFieldLabel(fieldName) {
  const labels = {
    nom: "Nom",
    raretePrix: "Rareté / prix estimé",
    deflexion: "Déflexion",
    volonte: "Volonté",
    armure: "Armure",
    initiative: "Initiative",
    vitesse: "Vitesse",
    enchantement: "Enchantement",
    description: "Description"
  };
  return labels[fieldName] || fieldName;
}

function renderInventorySection() {
  const section = module("Inventaire", 12);
  section.classList.add("inventory-section");

  const top = document.createElement("div");
  top.className = "inventory-top-fields";
  top.append(
    resourceField("resources.or", "Or"),
    resourceField("resources.rations", "Rations")
  );

  const list = document.createElement("div");
  list.className = "inventory-item-list";
  state.character.inventoryItems.forEach((item, index) => list.append(renderInventoryItem(normalizeInventoryItem(item), index)));

  const add = document.createElement("button");
  add.className = "add-button";
  add.type = "button";
  add.textContent = "Ajouter un objet";
  add.addEventListener("click", () => {
    state.character.inventoryItems.push(normalizeInventoryItem());
    render();
    scheduleSave();
  });

  section.append(top, list, add);
  return section;
}

function resourceField(path, labelText) {
  const wrap = document.createElement("label");
  wrap.className = "inventory-resource-field";
  const label = document.createElement("span");
  label.textContent = labelText;
  const input = document.createElement("input");
  input.value = getPath(state.character, path, "");
  input.addEventListener("input", () => {
    setPath(state.character, path, input.value);
    scheduleSave();
  });
  wrap.append(label, input);
  return wrap;
}

function renderInventoryItem(item, index) {
  state.character.inventoryItems[index] = item;
  const card = document.createElement("article");
  card.className = "inventory-item-card";

  const body = document.createElement("div");
  body.className = "inventory-item-body";
  const refreshBody = () => {
    body.innerHTML = "";
    if (item.type === "Équipement") {
      body.append(renderInventoryEquipmentDetails(item, refreshBody));
    } else if (item.type === "Arme") {
      body.append(renderInventoryWeaponDetails(item, refreshBody));
    }
  };

  const head = document.createElement("div");
  head.className = "inventory-item-head";
  head.append(
    inventoryTypeField(item, refreshBody),
    inventoryTextField(item, "name", "Nom"),
    inventoryTextField(item, "raretePrix", "Rareté / prix estimé")
  );

  refreshBody();

  const description = document.createElement("label");
  description.className = "inventory-description-field";
  const descriptionLabel = document.createElement("span");
  descriptionLabel.textContent = "Description";
  const textarea = document.createElement("textarea");
  textarea.value = item.description || "";
  textarea.addEventListener("input", () => {
    item.description = textarea.value;
    scheduleSave();
  });
  description.append(descriptionLabel, textarea);

  const remove = document.createElement("button");
  remove.className = "remove-button inventory-item-remove";
  remove.type = "button";
  remove.textContent = "×";
  remove.addEventListener("click", () => {
    state.character.inventoryItems.splice(index, 1);
    render();
    scheduleSave();
  });

  card.append(head, body, description, remove);
  return card;
}

function inventoryTypeField(item, onTypeChange = () => {}) {
  const wrap = document.createElement("label");
  wrap.className = "inventory-select-field";
  const label = document.createElement("span");
  label.textContent = "Type";
  const select = document.createElement("select");
  for (const optionText of INVENTORY_TYPE_OPTIONS) {
    const option = document.createElement("option");
    option.value = optionText;
    option.textContent = optionText;
    option.selected = optionText === item.type;
    select.append(option);
  }
  select.addEventListener("change", () => {
    item.type = select.value;
    if (item.type === "Équipement") {
      item.slot = item.slot || "casque";
      item.equipmentData = normalizeInventoryEquipmentData(item.slot, item.equipmentData);
    }
    if (item.type === "Arme") {
      applyWeaponSelection(item, item.family || "Épées droites", item.weaponName || "");
    }
    onTypeChange();
    scheduleSave();
  });
  wrap.append(label, select);
  return wrap;
}

function inventoryTextField(item, key, labelText) {
  const wrap = document.createElement("label");
  wrap.className = "inventory-text-field";
  const label = document.createElement("span");
  label.textContent = labelText;
  const input = document.createElement("input");
  input.value = item[key] || "";
  input.addEventListener("input", () => {
    item[key] = input.value;
    scheduleSave();
  });
  wrap.append(label, input);
  return wrap;
}

function renderInventoryEquipmentDetails(item, onChange = () => {}) {
  const wrap = document.createElement("div");
  wrap.className = "inventory-equipment-details";

  const slotField = document.createElement("label");
  slotField.className = "inventory-select-field";
  const label = document.createElement("span");
  label.textContent = "Emplacement";
  const select = document.createElement("select");
  for (const [value, text] of Object.entries(EQUIPMENT_SLOT_LABELS)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    option.selected = value === item.slot;
    select.append(option);
  }
  select.addEventListener("change", () => {
    item.slot = select.value;
    item.equipmentData = normalizeInventoryEquipmentData(item.slot, item.equipmentData);
    onChange();
    scheduleSave();
  });
  slotField.append(label, select);

  const fields = document.createElement("div");
  fields.className = "inventory-equipment-fields";
  for (const fieldName of EQUIPMENT_SLOT_FIELDS[item.slot]) {
    fields.append(equipmentField(item.equipmentData, fieldName));
  }
  wrap.append(slotField, fields);
  return wrap;
}

function renderInventoryWeaponDetails(item, onChange = () => {}) {
  if (!item.weaponName || !(WEAPON_DATABASE[item.family] || []).some((weapon) => weapon.name === item.weaponName)) {
    applyWeaponSelection(item, item.family || "Épées droites", item.weaponName || "");
  }
  const wrap = document.createElement("div");
  wrap.className = "inventory-weapon-details";

  const selectors = document.createElement("div");
  selectors.className = "inventory-weapon-selectors";

  const familyField = document.createElement("label");
  familyField.className = "inventory-select-field";
  const familyLabel = document.createElement("span");
  familyLabel.textContent = "Famille d’arme";
  const familySelect = document.createElement("select");
  for (const family of Object.keys(WEAPON_DATABASE)) {
    const option = document.createElement("option");
    option.value = family;
    option.textContent = family;
    option.selected = family === item.family;
    familySelect.append(option);
  }
  familySelect.addEventListener("change", () => {
    applyWeaponSelection(item, familySelect.value, "");
    onChange();
    scheduleSave();
  });
  familyField.append(familyLabel, familySelect);

  const weaponField = document.createElement("label");
  weaponField.className = "inventory-select-field";
  const weaponLabel = document.createElement("span");
  weaponLabel.textContent = "Arme";
  const weaponSelect = document.createElement("select");
  const weapons = WEAPON_DATABASE[item.family] || [];
  for (const weapon of weapons) {
    const option = document.createElement("option");
    option.value = weapon.name;
    option.textContent = weapon.name;
    option.selected = weapon.name === item.weaponName;
    weaponSelect.append(option);
  }
  weaponSelect.addEventListener("change", () => {
    applyWeaponSelection(item, item.family, weaponSelect.value);
    onChange();
    scheduleSave();
  });
  weaponField.append(weaponLabel, weaponSelect);
  selectors.append(familyField, weaponField);

  const stats = document.createElement("div");
  stats.className = "inventory-weapon-stats";
  [
    ["name", "Nom"],
    ["degats", "Dégâts"],
    ["parade", "Parade"],
    ["family", "Famille"],
    ["attributs", "Attributs"],
    ["familySummary", "Résumé de famille"]
  ].forEach(([key, labelText]) => {
    const fieldWrap = document.createElement("label");
    fieldWrap.className = key === "familySummary" ? "inventory-text-field inventory-text-field-wide" : "inventory-text-field";
    const label = document.createElement("span");
    label.textContent = labelText;
    const input = document.createElement(key === "familySummary" ? "textarea" : "input");
    input.value = item[key] || "";
    input.addEventListener("input", () => {
      item[key] = input.value;
      scheduleSave();
    });
    fieldWrap.append(label, input);
    stats.append(fieldWrap);
  });

  wrap.append(selectors, stats);
  if ((item.attributs || "").includes("Catalyseur")) {
    wrap.append(renderInventoryCatalystColor(item));
  }
  return wrap;
}

function renderInventoryCatalystColor(item) {
  const wrap = document.createElement("label");
  wrap.className = "inventory-select-field inventory-catalyst-color";
  const label = document.createElement("span");
  label.textContent = "Couleur";
  const select = document.createElement("select");
  for (const optionDef of CAPACITY_COLOR_OPTIONS) {
    const option = document.createElement("option");
    option.value = optionDef.value;
    option.textContent = optionDef.symbol;
    option.selected = optionDef.value === item.catalystColor;
    select.append(option);
  }
  select.addEventListener("change", () => {
    item.catalystColor = select.value;
    updateColorSelectAppearance(select);
    scheduleSave();
  });
  updateColorSelectAppearance(select);
  wrap.append(label, select);
  return wrap;
}

function applyWeaponSelection(item, family, weaponName) {
  item.family = family;
  const weapons = WEAPON_DATABASE[family] || [];
  const weapon = weapons.find((entry) => entry.name === weaponName) || weapons[0];
  if (!weapon) return;
  item.weaponName = weapon.name;
  item.name = weapon.name;
  item.degats = weapon.damage;
  item.parade = String(Math.floor(parseInt(weapon.damage.replace(/\D/g, ""), 10) / 2) || "");
  item.attributs = weapon.attributes.join(", ");
  item.familySummary = WEAPON_FAMILY_SUMMARIES[family] || "";
}

function renderNotes() {
  const m = module("Notes", 12);
  m.append(field("notes", "Notes libres", "textarea"));
  return m;
}

function recalculate() {
  for (const stat of state.template?.stats || []) {
    const el = document.querySelector(`[data-mod-for="${stat.key}"]`);
    if (el) {
      const mod = modifier(getPath(state.character, `stats.${stat.key}`, 10));
      el.textContent = `${mod >= 0 ? "" : "-"}${Math.abs(mod)}`;
    }
  }
}

async function uploadImage(file, targetObject, targetKey = "image") {
  if (!file) return;
  if (!isImageFile(file)) return;
  const dataUrl = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
  setStatus("Envoi de l'image...");
  const response = await fetch("/api/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ characterId: state.character.id, name: targetObject.name || targetObject.nom || file.name, dataUrl })
  });
  const payload = await response.json();
  if (payload.ok) {
    targetObject[targetKey] = payload.path;
    render();
    scheduleSave();
  } else {
    setStatus(payload.error || "Image impossible à enregistrer");
  }
}

function scheduleSave() {
  setStatus("Modifications non sauvegardées...");
  clearTimeout(state.dirtyTimer);
  state.dirtyTimer = setTimeout(saveCharacter, 700);
}

async function saveCharacter() {
  if (state.saving || !state.character) return;
  state.saving = true;
  setStatus("Sauvegarde...");
  const response = await fetch("/api/character", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ character: state.character })
  });
  const payload = await response.json();
  state.saving = false;
  if (payload.ok) {
    const savedCharacter = normalizeCharacterData(payload.character);
    state.character.id = savedCharacter.id;
    state.character.createdAt = savedCharacter.createdAt;
    state.character.updatedAt = savedCharacter.updatedAt;
    state.character.schemaVersion = savedCharacter.schemaVersion;
    state.character.templateId = savedCharacter.templateId;
    setStatus(`Sauvegardé à ${new Date().toLocaleTimeString("fr-FR")}`);
    refreshCharacters();
  } else {
    setStatus("Erreur de sauvegarde");
  }
}

function setStatus(text) {
  $("#saveStatus").textContent = text;
}

async function refreshCharacters() {
  const select = $("#characterSelect");
  const current = state.character?.id;
  const { characters } = await fetch("/api/characters").then((res) => res.json());
  select.innerHTML = `<option value="">Personnages sauvegardés</option>`;
  for (const character of characters) {
    const option = document.createElement("option");
    option.value = character.id;
    option.textContent = character.name;
    if (character.id === current) option.selected = true;
    select.append(option);
  }
}

async function loadCharacter(id = "nouveau-personnage") {
  const payload = await fetch(`/api/character?id=${encodeURIComponent(id)}`).then((res) => res.json());
  state.character = normalizeCharacterData(payload.character);
  render();
  await refreshCharacters();
  setStatus("Prêt");
}

async function loadSettings() {
  const payload = await fetch("/api/settings").then((res) => res.json());
  state.settings = payload.settings || {};
}

async function deleteCurrentCharacter() {
  const characterId = state.character?.id || "";
  if (!characterId) {
    setStatus("Aucun personnage à supprimer");
    return;
  }
  if (characterId === "nouveau-personnage") {
    setStatus("Ce personnage par défaut ne peut pas être supprimé");
    return;
  }
  const confirmed = window.confirm(`Supprimer définitivement la fiche "${state.character?.identity?.nom || characterId}" ?`);
  if (!confirmed) return;

  const response = await fetch("/api/delete-character", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: characterId })
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    setStatus(payload.error || "Suppression impossible");
    return;
  }
  await loadCharacter("nouveau-personnage");
  await refreshCharacters();
  $("#characterSelect").value = state.character.id || "";
  setStatus("Fiche supprimée");
}

async function exportPackage() {
  setStatus("Préparation de la sauvegarde ZIP...");
  await saveCharacter();
  if (!state.character?.id) {
    setStatus("Erreur lors de l'export");
    return;
  }
  const response = await fetch("/api/save-package-dialog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ character: state.character })
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    setStatus(payload.error || "Erreur lors de la sauvegarde ZIP");
    return;
  }
  setStatus("Archive ZIP sauvegardée");
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Lecture impossible"));
    reader.readAsDataURL(file);
  });
}

async function importJson(file) {
  const text = await file.text();
  state.character = normalizeCharacterData(JSON.parse(text));
  state.character.id = state.character.id || "personnage-importe";
  render();
  scheduleSave();
}

async function importPackage(file) {
  setStatus("Import de l'archive...");
  const dataUrl = await readFileAsDataUrl(file);
  const response = await fetch("/api/import-package", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl })
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    setStatus(payload.error || "Erreur à l'import");
    return;
  }
  state.character = normalizeCharacterData(payload.character);
  render();
  await refreshCharacters();
  $("#characterSelect").value = state.character.id || "";
  setStatus("Archive importée");
}

async function importPdf(file) {
  setStatus("Analyse du PDF...");
  const dataUrl = await readFileAsDataUrl(file);
  const response = await fetch("/api/import-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, filename: file.name || "personnage.pdf" })
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    setStatus(payload.error || "Erreur pendant l'import PDF");
    return;
  }
  state.character = normalizeCharacterData(payload.character);
  render();
  await refreshCharacters();
  $("#characterSelect").value = state.character.id || "";
  const warningCount = Array.isArray(payload.report?.warnings) ? payload.report.warnings.length : 0;
  setStatus(
    warningCount
      ? `PDF importé avec ${warningCount} avertissement${warningCount > 1 ? "s" : ""}`
      : "PDF importé"
  );
  if (warningCount) {
    console.warn("PDF import warnings", payload.report.warnings);
  }
}

async function extractPdfImages() {
  setStatus("Extraction des images du PDF...");
  await saveCharacter();
  const response = await fetch("/api/extract-pdf-images-dialog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      characterId: state.character?.id || "personnage",
      capacityCount: Array.isArray(state.character?.capacities) ? state.character.capacities.length : 0
    })
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    setStatus(payload.error || "Erreur pendant l'extraction des images");
    return;
  }
  state.character = normalizeCharacterData(payload.character);
  render();
  await refreshCharacters();
  $("#characterSelect").value = state.character.id || "";
  scheduleSave();
  const extractedCount = Array.isArray(payload.report?.images) ? payload.report.images.length : 0;
  const warningCount = Array.isArray(payload.report?.warnings) ? payload.report.warnings.length : 0;
  const openedFolder = payload.report?.openedFolder || "";
  setStatus(
    warningCount
      ? `${extractedCount} image(s) extraites, ${warningCount} avertissement(s)`
      : `${extractedCount} image(s) extraites${openedFolder ? " - dossier ouvert" : ""}`
  );
  if (warningCount) {
    console.warn("PDF image extraction warnings", payload.report.warnings);
  }
}

async function importCharacterFile(file) {
  const lowerName = String(file.name || "").toLowerCase();
  if (lowerName.endsWith(".zip")) {
    await importPackage(file);
    return;
  }
  await importJson(file);
}

async function init() {
  state.template = await fetch("/api/template").then((res) => res.json());
  await loadCharacter();
  const modeSelect = $("#viewModeSelect");
  if (modeSelect) {
    modeSelect.value = state.mode;
    modeSelect.addEventListener("change", (event) => {
      state.mode = event.target.value === "view" ? "view" : "edit";
      applyModeToSheet();
    });
  }
  $("#deleteCharacter").addEventListener("click", deleteCurrentCharacter);
  $("#saveCharacter").addEventListener("click", saveCharacter);
  $("#exportJson").addEventListener("click", exportPackage);
  $("#extractPdfImages").addEventListener("click", extractPdfImages);
  $("#newCharacter").addEventListener("click", async () => {
    const id = `nouveau-personnage-${Date.now()}`;
    await loadCharacter(id);
    state.character.id = id;
    state.character.identity.nom = "Nouveau personnage";
    render();
    scheduleSave();
  });
  $("#characterSelect").addEventListener("change", (event) => {
    if (event.target.value) loadCharacter(event.target.value);
  });
  $("#importJson").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await importCharacterFile(file);
  });
}

init().catch((error) => {
  console.error(error);
  setStatus("Erreur au chargement");
});



