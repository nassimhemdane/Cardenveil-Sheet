const state = {
  template: null,
  character: null,
  settings: {},
  dirtyTimer: null,
  saving: false,
  draggingCapacityIndex: null,
  mode: "edit"
};

const RICH_TEXT_EXCLUDED_PATHS = [
  /^stats\./,
  /^progression\.xpDepenses$/,
  /^progression\.xpDisponibles$/,
  /^identity\.niveau$/,
  /^resources\.tokens\./,
  /^derived\.pvMax$/,
  /^derived\.bonusPv$/,
  /^derived\.pvActuels$/,
  /^derived\.pvTemporaires$/,
  /^derived\.initiative$/,
  /^derived\.initiativeBonus$/,
  /^derived\.mouvement$/,
  /^derived\.mouvementBonus$/,
  /^derived\.seuilMiss$/,
  /^derived\.canalisation$/,
  /^derived\.volonte$/,
  /^abilityControls\.knownAbilities$/,
  /^abilityControls\.maxPreparedAbilities$/,
  /^abilityControls\.cardMin$/,
  /^abilityControls\.cardMax$/
];

function isRichTextExcludedPath(path = "") {
  return RICH_TEXT_EXCLUDED_PATHS.some((pattern) => pattern.test(String(path || "")));
}

function shouldEnableRichText(path = "", type = "text", options = {}) {
  if (options.readOnly || type === "number") return false;
  if (path && isRichTextExcludedPath(path)) return false;
  return type === "textarea" || type === "text";
}

function markRichTextEditable(element, mode = "single", path = "") {
  element.dataset.richText = "true";
  element.dataset.richTextMode = mode;
  if (path) {
    element.dataset.richTextPath = path;
  }
}

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
  casque: "static/pictogrammes/Helmet.png",
  plastron: "static/pictogrammes/Breastplate.png",
  gantelets: "static/pictogrammes/Gantlets.png",
  bottes: "static/pictogrammes/Boots.png",
  anneau: "static/pictogrammes/Ring.png",
  amulette: "static/pictogrammes/Amulet.png",
  cape: "static/pictogrammes/cape.png"
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

const GUIDE_TITLE_COLORS = {
  force: "guide-force",
  agilite: "guide-agilite",
  esprit: "guide-esprit",
  social: "guide-social"
};

const GUIDE_SECTIONS = [
  {
    title: "Bonus actions",
    entries: [
      {
        title: "Attaque secondaire",
        type: "force",
        description: "• Une seconde attaque en mêlée\n• Sans modificateur aux dégâts"
      },
      {
        title: "Poussée",
        type: "force",
        description: "• Repoussez une créature de 5 m\n• Contestation de vos jets d’Athlétisme"
      },
      {
        title: "Ruée",
        type: "agilite",
        description: "• Augmentez votre vitesse de déplacement de moitié\n• Vous permet un troisième mouvement durant le round"
      },
      {
        title: "Planque",
        type: "agilite",
        description: "• Si vous êtes hors de vue ou obscurci, cachez-vous\n• Faites un jet de Discrétion contre la Perception ennemie\n• Au début de chaque round et chaque fois que vous entrez dans une ligne de vue, refaites un jet\n• Toute action hostile vous dévoile\n• Une action non hostile exige un nouveau jet pour rester planqué"
      },
      {
        title: "Consommable",
        type: "agilite",
        description: "• Boire une potion\n• Utiliser un parchemin\n• Ou un consommable du même type"
      },
      {
        title: "Échange d’équipement",
        type: "agilite",
        description: "• Alterner entre deux armes ou équipements"
      },
      {
        title: "Stabilisation",
        type: "agilite",
        description: "• Mettez fin à une condition dont la sortie est possible\n• Sur un allié ou sur vous si la condition le permet\n• Exemples : À terre, Immobilisé, Endormi, Inconscient\n• Certaines conditions peuvent exiger un jet contextuel selon la situation"
      },
      {
        title: "Analyse",
        type: "esprit",
        description: "• Faites un jet d’Investigation : DC 10 + mod. Agilité\n• Sur une créature adverse\n• Découvre une résistance, une immunité, une vulnérabilité\n• Ou un détail contextuel"
      },
      {
        title: "Imprégnation",
        type: "esprit",
        description: "• Imprégnez une arme ou un projectile avec un consommable\n• Si une source élémentaire est à portée (feu, poison, etc.), utilisez-la pour imprégner votre arme\n• Ajoutez mod. Survie en dégâts élémentaires à votre prochaine attaque"
      },
      {
        title: "Canalisation",
        type: "esprit",
        description: "• Canalisez votre catalyseur et activez son bonus de couleur pour ce round et le suivant\n• Les capacités de la couleur correspondante voient leur coût réduit de votre modificateur d’Esprit + le bonus du catalyseur\n• Si vous maniez deux catalyseurs à une main, vous pouvez les canaliser simultanément pour combiner leurs couleurs\n• Le catalyseur s’entoure alors d’une aura de son type de dégâts\n• En canalisant, vous donnez avantage à vos jets d’attaques avec le catalyseur et de valeur brute de capacités"
      },
      {
        title: "Provocation",
        type: "social",
        description: "• Provoquez une créature\n• Faites un jet de Représentation contre sa Perspicacité\n• La créature provoquée ne peut cibler que vous jusqu’à la fin du round"
      },
      {
        title: "Flatterie",
        type: "social",
        description: "• Faites un jet de Tromperie contre la Perspicacité de l’allié\n• En cas de réussite, l’allié gagne + mod. Social aux dégâts de sa prochaine attaque"
      }
    ]
  },
  {
    title: "Réactions",
    entries: [
      {
        title: "Attaque d’opportunité",
        type: "force",
        description: "• Si un ennemi quitte votre zone de contrôle\n• S’il lance une capacité à distance\n• Ou s’il est attaqué par un allié en mêlée\n• Vous pouvez l’attaquer\n• Si vous jouez dual wield, attaquez avec vos deux armes"
      },
      {
        title: "Parade",
        type: "force",
        description: "• Parez avec votre bouclier ou vos armes\n• Vous réduisez les dégâts subits avant réduction d’armure\n• Avec bouclier : déflexion de l’armure + parade du bouclier + mod. Force\n• Sans bouclier : parade de l’arme = valeur maximale du dé de votre arme / 2 + mod. Agilité\n• Exemple : 3 pour 1d6\n• Si vous annulez la totalité des dégâts, vous activez Feintre"
      },
      {
        title: "Bastion",
        type: "force",
        description: "• Interceptez une attaque ciblée visant un allié\n• Jet d’Acrobaties = 3 + 2 × distance en mètres"
      },
      {
        title: "Soutien",
        type: "force",
        description: "• Lorsqu’un allié dans votre zone de contrôle attaque\n• Offrez-lui avantage à son jet d’attaque"
      },
      {
        title: "Ciblage",
        type: "agilite",
        description: "• Lorsqu’un ennemi agit (attaque, mouvement, etc.)\n• Utilisez votre réaction pour vous focaliser sur lui\n• Analysez ses mouvements\n• Vous vous octroyez avantage pour un tir contre lui au prochain tour"
      },
      {
        title: "Précipitation",
        type: "agilite",
        description: "• Utilisez votre réaction pour précipiter votre tour\n• Faites un jet d’initiative avec avantage pendant l’action d’une autre créature\n• Si votre résultat dépasse son initiative, vous pouvez jouer immédiatement votre Action et/ou Bonus Action\n• Vos deux actions sont résolues simultanément selon la décision du MJ\n• Si vous avez déjà joué ce round, faites un jet d’initiative avec avantage contre 10 + l’initiative de la créature actuelle\n• En cas de réussite, vous pouvez jouer votre Action et/ou Bonus Action du round suivant immédiatement"
      },
      {
        title: "Harmonisation",
        type: "esprit",
        description: "• Lorsqu’une créature lance une capacité utilisant l’Esprit\n• Accentuer : + mod. Esprit au jet de valeur brute de la capacité et au seuil de sauvegarde\n• Atténuer : - mod. Esprit aux dégâts directs et au seuil de sauvegarde"
      },
      {
        title: "Altération",
        type: "esprit",
        description: "• Lorsque vous utilisez une capacité\n• Vous pouvez ajuster son effet ou sa portée\n• Sans augmenter sa puissance\n• Peut potentiellement activer une combinaison élémentaire"
      },
      {
        title: "Dissuasion",
        type: "social",
        description: "• Faites un jet d’Intimidation contre la Perspicacité de l’ennemi\n• Donnez-lui désavantage à son attaque en mêlée"
      },
      {
        title: "Coordination",
        type: "social",
        description: "• En réaction, choisissez un allié à 2 × mod. Persuasion m\n• Cet allié peut immédiatement utiliser une réaction\n• Ou refaire son jet de sauvegarde contre la capacité qui le vise"
      }
    ]
  },
  {
    title: "Actions",
    entries: [
      {
        title: "Attaquer",
        type: "force",
        description: "• Attaquez votre cible"
      },
      {
        title: "Esquive",
        type: "agilite",
        description: "• Désavantage aux attaques contre vous\n• Pas d’attaques d’opportunité"
      }
    ]
  },
  {
    title: "Tokens",
    entries: [
      {
        title: "Tokens de Force",
        type: "force",
        description: "• Carte : piocher une carte\n• Attaque : double frappe"
      },
      {
        title: "Tokens d’Agilité",
        type: "agilite",
        description: "• Carte : piocher une couleur précise\n• Attaque : jusqu’à 3 cibles"
      },
      {
        title: "Tokens d’Esprit",
        type: "esprit",
        description: "• Carte : stocker / cristalliser une carte\n• Attaque : réverbération, 2 × dégâts au prochain tour"
      },
      {
        title: "Tokens de Social",
        type: "social",
        description: "• Carte : échanger une carte avec un allié\n• Attaque : marque qui réplique vos dégâts"
      }
    ]
  }
];

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
const Storage = window.CardenveilStorage;

function isEditMode() {
  return state.mode === "edit";
}

function modifier(score) {
  return Math.floor((Number(score || 0) - 10) / 2);
}

function signedNumber(value) {
  const numeric = toNumber(value, 0);
  return `${numeric >= 0 ? "+" : "-"}${Math.abs(numeric)}`;
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
  const slotLabel = EQUIPMENT_SLOT_LABELS[slot] || "";
  const defaults = {
    casque: { nom: slotLabel, raretePrix: "", deflexion: "0", volonte: "1", enchantement: "", description: "" },
    plastron: { nom: slotLabel, raretePrix: "", deflexion: "1", armure: "1", enchantement: "", description: "" },
    gantelets: { nom: slotLabel, raretePrix: "", deflexion: "0", initiative: "1", enchantement: "", description: "" },
    bottes: { nom: slotLabel, raretePrix: "", deflexion: "0", vitesse: "1", enchantement: "", description: "" },
    anneau: { nom: slotLabel, raretePrix: "", enchantement: "", description: "" },
    amulette: { nom: slotLabel, raretePrix: "", enchantement: "", description: "" },
    cape: { nom: slotLabel, raretePrix: "", enchantement: "", description: "" }
  };
  const base = defaults[slot] || {};
  const data = {};
  for (const fieldName of EQUIPMENT_SLOT_FIELDS[slot] || []) {
    data[fieldName] = source[fieldName] ?? base[fieldName] ?? "";
  }
  return data;
}

function parseWeaponDieFaces(damage) {
  const match = String(damage || "").match(/d\s*(\d+)/i);
  return match ? toNumber(match[1], 0) : 0;
}

function computeParadeFromDamage(damage) {
  const faces = parseWeaponDieFaces(damage);
  return faces ? String(Math.floor(faces / 2)) : "";
}

function getEquippedWeaponModifier(attributesText) {
  const attributes = String(attributesText || "").toLowerCase();
  if (attributes.includes("catalyseur")) return modifier(getPath(state.character, "stats.esprit", 10));
  if (attributes.includes("finesse")) return modifier(getPath(state.character, "stats.agilite", 10));
  return modifier(getPath(state.character, "stats.force", 10));
}

function normalizeNotesWidgetSettings() {
  const notesWidget = state.settings?.notesWidget || {};
  return {
    open: Boolean(notesWidget.open),
    x: Number.isFinite(Number(notesWidget.x)) ? Number(notesWidget.x) : 24,
    y: Number.isFinite(Number(notesWidget.y)) ? Number(notesWidget.y) : 120
  };
}

function normalizeGuideWidgetSettings() {
  const guideWidget = state.settings?.guideWidget || {};
  const defaultX = Math.max(24, (window.innerWidth || 1440) - 128);
  return {
    open: Boolean(guideWidget.open),
    x: Number.isFinite(Number(guideWidget.x)) ? Number(guideWidget.x) : defaultX,
    y: Number.isFinite(Number(guideWidget.y)) ? Number(guideWidget.y) : 182
  };
}

function saveSettingsSoon() {
  Storage.saveSettings(state.settings || {}).catch((error) => console.error("Impossible de sauvegarder les réglages", error));
}

function syncNotesViews(value, sourceElement = null) {
  document.querySelectorAll('[data-notes-sync="true"]').forEach((element) => {
    if (element === sourceElement) return;
    element.value = value || "";
    element.dispatchEvent(new Event("richtextsync"));
  });
}

function widgetPanelSideClass(x) {
  return x > ((window.innerWidth || 1440) / 2) ? "panel-left" : "panel-right";
}

function recalculateDerivedValues() {
  const force = toNumber(getPath(state.character, "stats.force", 10), 10);
  const agilite = toNumber(getPath(state.character, "stats.agilite", 10), 10);
  const esprit = toNumber(getPath(state.character, "stats.esprit", 10), 10);
  const social = toNumber(getPath(state.character, "stats.social", 10), 10);
  const resilience = toNumber(getPath(state.character, "skills.resilience.bonus", 0), 0);
  const casqueDeflexion = toNumber(getPath(state.character, "equipment.casque.deflexion", 0), 0);
  const ganteletsDeflexion = toNumber(getPath(state.character, "equipment.gantelets.deflexion", 0), 0);
  const plastronDeflexion = toNumber(getPath(state.character, "equipment.plastron.deflexion", 0), 0);
  const bottesDeflexion = toNumber(getPath(state.character, "equipment.bottes.deflexion", 0), 0);
  const initiativeBonus = toNumber(getPath(state.character, "derived.initiativeBonus", 0), 0);
  const mouvementBonus = toNumber(getPath(state.character, "derived.mouvementBonus", 0), 0);

  const modForce = modifier(force);
  const modAgilite = modifier(agilite);
  const modEsprit = modifier(esprit);
  const modSocial = modifier(social);

  const mouvementTotal = Math.floor(5 + (agilite / 2)) + mouvementBonus;
  const initiativeTotal = (agilite - 10) + initiativeBonus;
  const knownAbilities = Math.floor(esprit / 2);
  const missThreshold = Math.max(1, -(1 + modAgilite));
  const deflexionTotale = casqueDeflexion + ganteletsDeflexion + plastronDeflexion + bottesDeflexion;

  state.character.derived = state.character.derived || {};
  state.character.abilityControls = state.character.abilityControls || {};
  state.character.resources = state.character.resources || {};
  state.character.resources.tokens = state.character.resources.tokens || {};

  setPath(state.character, "derived.mouvement", mouvementTotal);
  setPath(state.character, "derived.initiative", initiativeTotal);
  setPath(state.character, "derived.seuilMiss", missThreshold);
  setPath(state.character, "derived.canalisation", modEsprit);
  setPath(state.character, "derived.volonte", resilience);
  setPath(state.character, "defense.deflexion", deflexionTotale);
  state.character.abilityControls.knownAbilities = String(knownAbilities);
  state.character.resources.tokens.force = Math.max(0, 1 + modForce);
  state.character.resources.tokens.agilite = Math.max(0, 1 + modAgilite);
  state.character.resources.tokens.esprit = Math.max(0, 1 + modEsprit);
  state.character.resources.tokens.social = Math.max(0, 1 + modSocial);
}

function imageSrcWithVersion(path) {
  if (!path) return "";
  if (String(path).startsWith("data:")) return path;
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
  input.dataset.path = path;
  if (type !== "textarea") input.type = type;
  input.value = getPath(state.character, path, "");
  if (shouldEnableRichText(path, type, options)) {
    markRichTextEditable(input, type === "textarea" ? "multiline" : "single", path);
  }
  if (options.readOnly) {
    input.dataset.locked = "true";
    input.readOnly = true;
    input.tabIndex = -1;
  }
  if (path === "notes") {
    input.dataset.notesSync = "true";
  }
  input.addEventListener("input", () => {
    if (options.readOnly) {
      input.value = getPath(state.character, path, "");
      return;
    }
    const value = input.type === "number" ? Number(input.value || 0) : input.value;
    setPath(state.character, path, value);
    if (path === "notes") {
      syncNotesViews(value, input);
    }
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

  renderFloatingNotesWidget();
  renderFloatingGuideWidget();
  recalculate();
  applyModeToSheet();
  window.CardenveilRichText?.refresh();
}

function applyModeToSheet() {
  document.body.dataset.mode = state.mode;
  const root = $("#sheetRoot");
  if (!root) return;

  root.querySelectorAll("textarea").forEach((textarea) => {
    textarea.readOnly = textarea.dataset.locked === "true" || !isEditMode();
  });

  root.querySelectorAll("select, button").forEach((element) => {
    element.disabled = !isEditMode();
  });

  root.querySelectorAll("input").forEach((input) => {
    if (["checkbox", "radio", "file"].includes(input.type)) {
      input.disabled = !isEditMode();
    } else {
      input.readOnly = input.dataset.locked === "true" || !isEditMode();
    }
  });

  const floatingNotes = document.getElementById("floatingNotesWidget");
  const floatingNotesInput = floatingNotes?.querySelector("textarea");
  if (floatingNotesInput) {
    floatingNotesInput.readOnly = !isEditMode();
  }
  window.CardenveilRichText?.refreshMode();
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
    ["identity.nom", "Nom du personnage", "text", "identity-field identity-name-field"],
    ["identity.alignement", "Alignement", "text", "identity-field identity-alignement-field"],
    ["identity.race", "Race", "text", "identity-field identity-race-field"],
    ["progression.xpDepenses", "XP dépensés", "number", "identity-field identity-xp-field"],
    ["progression.xpDisponibles", "XP disponibles", "number", "identity-field identity-xp-field"],
    ["identity.niveau", "Niveau", "number", "identity-field identity-level-field"]
  ].forEach(([path, label, type, className]) => grid.append(combatField(path, label, className, type || "text")));
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
    ["derived.seuilMiss", "Seuil de miss", "text"],
    ["derived.bonusAttaque", "Bns. attaque"],
    ["derived.canalisation", "Canalisation"],
    ["derived.volonte", "Volonté", "number"]
  ].forEach(([path, label, type, readOnly]) => grid.append(field(path, label, type || "text", { readOnly })));
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
    ["defense.deflexion", "Déflexion", "text"],
    ["defense.gardeBonus", "Garde"],
    ["defense.bonus", "Bonus"],
    ["derived.fatigue", "Fatigue"],
    ["derived.mort", "Mort"]
  ].forEach(([path, label, type, readOnly]) => grid.append(field(path, label, type || "text", { readOnly })));
  m.append(grid);
  return m;
}

function combatField(path, label, className = "", type = "text", options = {}) {
  const wrap = document.createElement("div");
  wrap.className = `combat-field ${className}`;
  const input = document.createElement("input");
  input.type = type;
  input.dataset.path = path;
  input.value = getPath(state.character, path, "");
  if (shouldEnableRichText(path, type, options)) {
    markRichTextEditable(input, type === "textarea" ? "multiline" : "single", path);
  }
  if (options.readOnly) {
    input.dataset.locked = "true";
    input.readOnly = true;
    input.tabIndex = -1;
  }
  input.addEventListener("input", () => {
    if (options.readOnly) {
      input.value = getPath(state.character, path, "");
      return;
    }
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

function derivedSplitField(valuePath, valueLabel, bonusPath, bonusLabel, className = "") {
  const wrap = document.createElement("div");
  wrap.className = `combat-field dual-combat-field ${className}`;

  const left = document.createElement("div");
  left.className = "dual-side";
  const leftInput = document.createElement("input");
  leftInput.type = "number";
  leftInput.dataset.path = valuePath;
  leftInput.value = getPath(state.character, valuePath, "");
  leftInput.addEventListener("input", () => {
    setPath(state.character, valuePath, Number(leftInput.value || 0));
    scheduleSave();
  });
  const leftRule = document.createElement("span");
  leftRule.className = "combat-rule";
  const leftLabelEl = document.createElement("label");
  leftLabelEl.textContent = valueLabel;
  left.append(leftInput, leftRule, leftLabelEl);

  const divider = document.createElement("span");
  divider.className = "dual-divider";
  divider.textContent = "|";

  const right = document.createElement("div");
  right.className = "dual-side";
  const rightInput = document.createElement("input");
  rightInput.type = "number";
  rightInput.dataset.path = bonusPath;
  rightInput.value = getPath(state.character, bonusPath, "");
  rightInput.addEventListener("input", () => {
    setPath(state.character, bonusPath, Number(rightInput.value || 0));
    scheduleSave();
  });
  const rightRule = document.createElement("span");
  rightRule.className = "combat-rule";
  const rightLabelEl = document.createElement("label");
  rightLabelEl.textContent = bonusLabel;
  right.append(rightInput, rightRule, rightLabelEl);

  wrap.append(left, divider, right);
  return wrap;
}

function dualCombatField(leftPath, leftLabel, rightPath, rightLabel, className = "", options = {}) {
  const wrap = document.createElement("div");
  wrap.className = `combat-field dual-combat-field ${className}`;

  const left = document.createElement("div");
  left.className = "dual-side";
  const leftInput = document.createElement("input");
  leftInput.type = "number";
  leftInput.dataset.path = leftPath;
  leftInput.value = getPath(state.character, leftPath, "");
  if (options.leftReadOnly) {
    leftInput.dataset.locked = "true";
    leftInput.readOnly = true;
    leftInput.tabIndex = -1;
  }
  leftInput.addEventListener("input", () => {
    if (options.leftReadOnly) {
      leftInput.value = getPath(state.character, leftPath, "");
      return;
    }
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
  rightInput.dataset.path = rightPath;
  rightInput.value = getPath(state.character, rightPath, "");
  if (options.rightReadOnly) {
    rightInput.dataset.locked = "true";
    rightInput.readOnly = true;
    rightInput.tabIndex = -1;
  }
  rightInput.addEventListener("input", () => {
    if (options.rightReadOnly) {
      rightInput.value = getPath(state.character, rightPath, "");
      return;
    }
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
    combatField("defense.deflexion", "Déflexion", "cut-field", "number"),
    combatField("defense.gardeBonus", "Garde", "cut-field"),
    combatField("defense.bonus", "Bonus", "cut-field")
  );

  const mid = document.createElement("div");
  mid.className = "combat-mid-row";
  mid.append(
    derivedSplitField("derived.initiative", "Initiative", "derived.initiativeBonus", "Bonus", "cut-field big-value"),
    derivedSplitField("derived.mouvement", "Mouvement", "derived.mouvementBonus", "Bonus", "cut-field big-value")
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
    combatField("derived.seuilMiss", "Seuil. Miss", "cut-field big-value", "number"),
    combatField("derived.bonusAttaque", "Bns. attaque", "cut-field"),
    combatField("derived.canalisation", "Canalisation", "cut-field", "number"),
    combatField("derived.volonte", "Volonté", "cut-field", "number")
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
  if (["nom"].includes(key)) {
    markRichTextEditable(input, "single", `weapons.${key}`);
  }
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
  markRichTextEditable(notes, "multiline", "weapons.notes");
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
  grid.append(renderTotemCard(), renderTokenSummaryCard());
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
  markRichTextEditable(name, "single", "totem.nom");
  name.addEventListener("input", () => {
    totem.nom = name.value;
    scheduleSave();
  });

  top.append(image, name);

  const description = document.createElement("textarea");
  description.className = "totem-description";
  description.value = totem.description || "";
  markRichTextEditable(description, "multiline", "totem.description");
  description.addEventListener("input", () => {
    totem.description = description.value;
    scheduleSave();
  });

  const label = document.createElement("div");
  label.className = "totem-label";
  label.textContent = "Totem";

  card.append(top, description);
  return card;
}

function renderNarrative() {
  const m = module("Narratif", 12);
  const grid = document.createElement("div");
  grid.className = "narrative-grid";
  [
    ["narrative.background", "Background"],
    ["narrative.objectif", "Objectif"],
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
    markRichTextEditable(input, "single");
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
      markRichTextEditable(input, "single");
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
  markRichTextEditable(title, "single", "capacities.name");
  title.addEventListener("input", () => {
    cap.name = title.value;
    scheduleSave();
  });

  const costSummary = document.createElement("div");
  costSummary.className = "capacity-cost-summary";
  updateCapacitySummary(costSummary, cap.cost);

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
  head.append(prepared, title, costSummary, dragHandle, remove);

  const meta = document.createElement("div");
  meta.className = "capacity-meta";
  meta.append(
    capacityMetaField(cap, "usage", "Utilisation"),
    capacityMetaField(cap, "incantation", "Incantation"),
    capacityMetaField(cap, "save", "Sauvegarde")
  );

  const visual = document.createElement("div");
  visual.className = "capacity-visual";
  visual.append(capacityImageBlock(cap), capacityDetailsBlock(cap, costSummary));

  const descriptionWrap = document.createElement("div");
  descriptionWrap.className = "capacity-description-block";
  const description = document.createElement("textarea");
  description.className = "capacity-description";
  description.value = cap.description || "";
  markRichTextEditable(description, "multiline", "capacities.description");
  description.addEventListener("input", () => {
    cap.description = description.value;
    scheduleSave();
  });
  descriptionWrap.append(description);

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
  markRichTextEditable(input, "single", `capacities.${key}`);
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
  markRichTextEditable(input, "single", `capacities.${path}`);
  input.addEventListener("input", () => {
    setPath(cap, path, input.value);
    scheduleSave();
  });
  wrap.append(label, input);
  return wrap;
}

function capacityCostInput(cap, key, labelText, totalInput, costSummary = null) {
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
    if (costSummary) {
      updateCapacitySummary(costSummary, cap.cost);
    }
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

function capacityColorMeta(colorValue) {
  const normalized = normalizeCapacityColor(colorValue);
  const option = CAPACITY_COLOR_OPTIONS.find((item) => item.value === normalized) || CAPACITY_COLOR_OPTIONS[0];
  return {
    value: normalized,
    symbol: option.symbol,
    toneClass: normalized === "heart" || normalized === "diamond" ? "is-red" : "is-dark"
  };
}

function updateCapacitySummary(element, cost = {}) {
  const color = capacityColorMeta(cost.color);
  const total = computeCapacityTotal(cost);
  element.className = `capacity-cost-summary ${color.toneClass}`;
  element.innerHTML = "";

  const totalValue = document.createElement("span");
  totalValue.className = "capacity-cost-summary-value";
  totalValue.textContent = String(total);

  const colorValue = document.createElement("span");
  colorValue.className = "capacity-cost-summary-color";
  colorValue.textContent = color.symbol;

  element.append(totalValue, colorValue);
}

function capacityDetailsBlock(cap, costSummary = null) {
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
  if (costSummary) {
    updateCapacitySummary(costSummary, cap.cost);
  }

  const formulaRow = document.createElement("div");
  formulaRow.className = "capacity-cost-formula";
  formulaRow.append(
    capacityCostInput(cap, "base", "Base", totalInput, costSummary),
    capacityOperator("-"),
    capacityCostInput(cap, "incantationReduction", "Incantation", totalInput, costSummary),
    capacityOperator("-"),
    capacityCostInput(cap, "colorReduction", "Couleur", totalInput, costSummary),
    capacityOperator("-"),
    capacityCostInput(cap, "awakeningReduction", "Éveil", totalInput, costSummary),
    capacityOperator("-"),
    capacityCostInput(cap, "weaponMasteryReduction", "Arme", totalInput, costSummary)
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
    if (costSummary) {
      updateCapacitySummary(costSummary, cap.cost);
    }
    scheduleSave();
  });
  updateColorSelectAppearance(colorSelect);
  colorField.append(colorSelect, colorLabel);

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
    markRichTextEditable(name, "single", "feats.title");
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
    markRichTextEditable(description, "multiline", "feats.description");
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
    markRichTextEditable(family, "single", "weaponMasteries.family");
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
    ["cardMin", "Carte min", false],
    ["cardMax", "Carte max", false],
    ["knownAbilities", "Capacités connues", false],
    ["maxPreparedAbilities", "Capacités préparées max", false]
  ].forEach(([key, label, readOnly]) => top.append(masteryField(controls, key, label, { readOnly })));

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

function masteryField(target, key, labelText, options = {}) {
  const wrap = document.createElement("label");
  wrap.className = "mastery-field";
  const label = document.createElement("span");
  label.textContent = labelText;
  const input = document.createElement("input");
  const targetPath = target === state.character.abilityControls ? `abilityControls.${key}` : key;
  input.dataset.path = targetPath;
  input.value = target[key] ?? "";
  if (shouldEnableRichText(targetPath, "text", options)) {
    markRichTextEditable(input, "single", targetPath);
  }
  if (options.readOnly) {
    input.dataset.locked = "true";
    input.readOnly = true;
    input.tabIndex = -1;
  }
  input.addEventListener("input", () => {
    if (options.readOnly) {
      input.value = target[key] ?? "";
      return;
    }
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
  if (["nom", "enchantement", "description"].includes(fieldName)) {
    markRichTextEditable(input, fieldName === "description" ? "multiline" : "single", `equipment.${fieldName}`);
  }
  input.addEventListener("input", () => {
    target[fieldName] = input.value;
    recalculate();
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

  const refreshEquipButton = () => {
    const equipable = item.type === "Arme" || item.type === "Équipement";
    equipButton.hidden = !equipable;
    equipButton.textContent = item.type === "Arme" ? "Équiper arme" : "Équiper";
    equipButton.disabled = !equipable || !isEditMode();
  };

  const refreshItemUi = () => {
    refreshBody();
    refreshEquipButton();
  };

  const head = document.createElement("div");
  head.className = "inventory-item-head";
  const equipButton = document.createElement("button");
  equipButton.className = "inventory-equip-button";
  equipButton.type = "button";
  equipButton.addEventListener("click", () => {
    equipInventoryItem(item);
  });
  head.append(
    equipButton,
    inventoryTypeField(item, refreshItemUi),
    inventoryTextField(item, "name", "Nom"),
    inventoryTextField(item, "raretePrix", "Rareté / prix estimé")
  );

  refreshItemUi();

  const description = document.createElement("label");
  description.className = "inventory-description-field";
  const descriptionLabel = document.createElement("span");
  descriptionLabel.textContent = "Description";
  const textarea = document.createElement("textarea");
  textarea.value = item.description || "";
  markRichTextEditable(textarea, "multiline", "inventoryItems.description");
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

  card.append(head, body);
  if (item.type !== "Équipement") {
    card.append(description);
  }
  card.append(remove);
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
      item.equipmentData = normalizeInventoryEquipmentData(item.slot, {});
      item.name = EQUIPMENT_SLOT_LABELS[item.slot] || item.name;
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
  if (key === "name") {
    markRichTextEditable(input, "single", `inventoryItems.${key}`);
  }
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
    item.equipmentData = normalizeInventoryEquipmentData(item.slot, {});
    item.name = EQUIPMENT_SLOT_LABELS[item.slot] || item.name;
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
    input.dataset.inventoryKey = key;
    input.value = item[key] || "";
    if (["name", "familySummary"].includes(key)) {
      markRichTextEditable(input, key === "familySummary" ? "multiline" : "single", `inventoryItems.${key}`);
    }
    if (key === "parade") {
      input.readOnly = true;
      input.tabIndex = -1;
    }
    input.addEventListener("input", () => {
      item[key] = input.value;
      if (key === "degats") {
        item.parade = computeParadeFromDamage(item.degats);
        const paradeInput = stats.querySelector('[data-inventory-key="parade"]');
        if (paradeInput) paradeInput.value = item.parade;
      }
      if (key === "parade") {
        item.parade = computeParadeFromDamage(item.degats);
        input.value = item.parade;
      }
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
  item.parade = computeParadeFromDamage(weapon.damage);
  item.attributs = weapon.attributes.join(", ");
  item.familySummary = WEAPON_FAMILY_SUMMARIES[family] || "";
}

function equipInventoryItem(item) {
  if (!isEditMode()) return;
  if (item.type === "Équipement") {
    const slot = item.slot || "casque";
    state.character.equipment[slot] = normalizeInventoryEquipmentData(slot, {
      ...item.equipmentData,
      nom: item.equipmentData?.nom || EQUIPMENT_SLOT_LABELS[slot] || item.name || "",
      raretePrix: item.equipmentData?.raretePrix || item.raretePrix || "",
      description: item.equipmentData?.description || item.description || ""
    });
    recalculateDerivedValues();
    setStatus(`${EQUIPMENT_SLOT_LABELS[slot]} équipé`);
    render();
    scheduleSave();
    return;
  }

  if (item.type !== "Arme") {
    setStatus("Cet objet ne peut pas être équipé");
    return;
  }

  state.character.weapons = state.character.weapons || [];
  const agilityModifier = String(modifier(getPath(state.character, "stats.agilite", 10)));
  const weaponUsesAgility = String(item.attributs || "").toLowerCase().includes("finesse");
  const baseModifierValue = String(getEquippedWeaponModifier(item.attributs));
  const equippedWeapon = {
    nom: item.name || item.weaponName || "",
    de: item.degats || "",
    forceAgi: baseModifierValue,
    critique: weaponUsesAgility ? agilityModifier : "0",
    avantage: weaponUsesAgility ? agilityModifier : "0",
    bonus: "",
    perfection: "",
    notes: [item.familySummary || "", item.description || ""].filter(Boolean).join("\n\n")
  };

  const firstEmptyIndex = state.character.weapons.findIndex((weapon) => {
    return !String(weapon?.nom || "").trim() && !String(weapon?.de || "").trim();
  });

  if (state.character.weapons.length < 3) {
    if (firstEmptyIndex >= 0) {
      state.character.weapons[firstEmptyIndex] = equippedWeapon;
      recalculateDerivedValues();
      setStatus(`Arme équipée dans l'emplacement ${firstEmptyIndex + 1}`);
      render();
      scheduleSave();
      return;
    }
    state.character.weapons.push(equippedWeapon);
    recalculateDerivedValues();
    setStatus("Arme ajoutée aux armes équipées");
    render();
    scheduleSave();
    return;
  }
  if (firstEmptyIndex >= 0) {
    state.character.weapons[firstEmptyIndex] = equippedWeapon;
    recalculateDerivedValues();
    setStatus(`Arme équipée dans l'emplacement ${firstEmptyIndex + 1}`);
    render();
    scheduleSave();
    return;
  }
  state.character.weapons[0] = equippedWeapon;
  recalculateDerivedValues();
  setStatus("Arme 1 remplacée");
  render();
  scheduleSave();
}

function renderNotes() {
  const m = module("Notes", 12);
  m.append(field("notes", "Notes libres", "textarea"));
  return m;
}

function renderTokenSummaryCard() {
  const card = document.createElement("section");
  card.className = "token-summary-card";
  const title = document.createElement("h4");
  title.textContent = "Tokens";
  const wrap = document.createElement("div");
  wrap.className = "token-box-grid";
  [
    ["resources.tokens.force", "Force"],
    ["resources.tokens.agilite", "Agilité"],
    ["resources.tokens.esprit", "Esprit"],
    ["resources.tokens.social", "Social"]
  ].forEach(([path, labelText]) => {
    wrap.append(combatField(path, labelText, "token-box", "number"));
  });
  card.append(title, wrap);
  return card;
}

async function synchronizeCharacter() {
  recalculateDerivedValues();
  render();
  await saveCharacter();
  setStatus("Synchronisation effectuée");
}

function toggleNotesWidget(forceOpen = null) {
  state.settings = state.settings || {};
  const current = normalizeNotesWidgetSettings();
  const nextOpen = forceOpen === null ? !current.open : Boolean(forceOpen);
  state.settings.notesWidget = {
    ...current,
    open: nextOpen
  };
  const widget = document.getElementById("floatingNotesWidget");
  if (widget) {
    widget.classList.toggle("is-open", nextOpen);
    const bubble = widget.querySelector(".notes-bubble");
    if (bubble) bubble.setAttribute("aria-expanded", nextOpen ? "true" : "false");
  }
  saveSettingsSoon();
}

function renderFloatingNotesWidget() {
  const existing = document.getElementById("floatingNotesWidget");
  if (existing) existing.remove();

  const settings = normalizeNotesWidgetSettings();
  state.settings = state.settings || {};
  state.settings.notesWidget = { ...settings };

  const widget = document.createElement("div");
  widget.id = "floatingNotesWidget";
  widget.className = `floating-notes-widget ${widgetPanelSideClass(settings.x)}${settings.open ? " is-open" : ""}`;
  widget.style.left = `${settings.x}px`;
  widget.style.top = `${settings.y}px`;

  const bubble = document.createElement("button");
  bubble.type = "button";
  bubble.className = "notes-bubble";
  bubble.textContent = "Notes";
  bubble.setAttribute("aria-expanded", settings.open ? "true" : "false");

  const panel = document.createElement("section");
  panel.className = "notes-panel";

  const title = document.createElement("h3");
  title.textContent = "Notes";

  const textarea = document.createElement("textarea");
  textarea.dataset.notesSync = "true";
  textarea.value = state.character?.notes || "";
  markRichTextEditable(textarea, "multiline", "notes");
  textarea.readOnly = !isEditMode();
  textarea.placeholder = "Écris tes notes ici...";
  textarea.addEventListener("input", () => {
    state.character.notes = textarea.value;
    syncNotesViews(textarea.value, textarea);
    scheduleSave();
  });

  panel.append(title, textarea);
  widget.append(panel, bubble);
  document.body.append(widget);

  let dragging = false;
  let moved = false;
  let startPointerX = 0;
  let startPointerY = 0;
  let startX = settings.x;
  let startY = settings.y;

  const clampAndSavePosition = (x, y) => {
    const maxX = Math.max(8, window.innerWidth - widget.offsetWidth - 8);
    const maxY = Math.max(8, window.innerHeight - bubble.offsetHeight - 8);
    const nextX = Math.min(Math.max(8, x), maxX);
    const nextY = Math.min(Math.max(8, y), maxY);
    widget.style.left = `${nextX}px`;
    widget.style.top = `${nextY}px`;
    widget.classList.remove("panel-left", "panel-right");
    widget.classList.add(widgetPanelSideClass(nextX));
    state.settings.notesWidget = {
      ...state.settings.notesWidget,
      x: nextX,
      y: nextY
    };
  };

  const finishDrag = () => {
    if (!dragging) return;
    dragging = false;
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    if (moved) {
      saveSettingsSoon();
      return;
    }
    toggleNotesWidget();
  };

  const handlePointerMove = (event) => {
    if (!dragging) return;
    const deltaX = event.clientX - startPointerX;
    const deltaY = event.clientY - startPointerY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) moved = true;
    clampAndSavePosition(startX + deltaX, startY + deltaY);
  };

  const handlePointerUp = () => finishDrag();

  bubble.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragging = true;
    moved = false;
    startPointerX = event.clientX;
    startPointerY = event.clientY;
    startX = state.settings.notesWidget.x;
    startY = state.settings.notesWidget.y;
    bubble.setPointerCapture?.(event.pointerId);
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    event.preventDefault();
  });
}

function toggleGuideWidget(forceOpen = null) {
  state.settings = state.settings || {};
  const current = normalizeGuideWidgetSettings();
  const nextOpen = forceOpen === null ? !current.open : Boolean(forceOpen);
  state.settings.guideWidget = {
    ...current,
    open: nextOpen
  };
  const widget = document.getElementById("floatingGuideWidget");
  if (widget) {
    widget.classList.toggle("is-open", nextOpen);
    const bubble = widget.querySelector(".guide-bubble");
    if (bubble) bubble.setAttribute("aria-expanded", nextOpen ? "true" : "false");
  }
  saveSettingsSoon();
}

function renderGuideSection(section) {
  const block = document.createElement("section");
  block.className = "guide-section";

  const title = document.createElement("h4");
  title.className = "guide-section-title";
  title.textContent = section.title;
  block.append(title);

  const list = document.createElement("div");
  list.className = "guide-entry-list";
  for (const entry of section.entries) {
    const item = document.createElement("article");
    item.className = "guide-entry";

    const heading = document.createElement("h5");
    heading.className = "guide-entry-title";
    if (entry.type && GUIDE_TITLE_COLORS[entry.type]) {
      heading.classList.add(GUIDE_TITLE_COLORS[entry.type]);
    }
    heading.textContent = entry.title;

    const description = document.createElement("p");
    description.className = "guide-entry-description";
    description.textContent = entry.description;

    item.append(heading, description);
    list.append(item);
  }

  block.append(list);
  return block;
}

function renderFloatingGuideWidget() {
  const existing = document.getElementById("floatingGuideWidget");
  if (existing) existing.remove();

  const settings = normalizeGuideWidgetSettings();
  state.settings = state.settings || {};
  state.settings.guideWidget = { ...settings };

  const widget = document.createElement("div");
  widget.id = "floatingGuideWidget";
  widget.className = `floating-guide-widget ${widgetPanelSideClass(settings.x)}${settings.open ? " is-open" : ""}`;
  widget.style.left = `${settings.x}px`;
  widget.style.top = `${settings.y}px`;

  const bubble = document.createElement("button");
  bubble.type = "button";
  bubble.className = "guide-bubble";
  bubble.textContent = "Guide";
  bubble.setAttribute("aria-expanded", settings.open ? "true" : "false");

  const panel = document.createElement("section");
  panel.className = "guide-panel";

  const title = document.createElement("h3");
  title.textContent = "Guide";
  panel.append(title);

  const content = document.createElement("div");
  content.className = "guide-content";
  for (const section of GUIDE_SECTIONS) {
    content.append(renderGuideSection(section));
  }
  panel.append(content);

  widget.append(panel, bubble);
  document.body.append(widget);

  let dragging = false;
  let moved = false;
  let startPointerX = 0;
  let startPointerY = 0;
  let startX = settings.x;
  let startY = settings.y;

  const clampAndSavePosition = (x, y) => {
    const maxX = Math.max(8, window.innerWidth - widget.offsetWidth - 8);
    const maxY = Math.max(8, window.innerHeight - bubble.offsetHeight - 8);
    const nextX = Math.min(Math.max(8, x), maxX);
    const nextY = Math.min(Math.max(8, y), maxY);
    widget.style.left = `${nextX}px`;
    widget.style.top = `${nextY}px`;
    widget.classList.remove("panel-left", "panel-right");
    widget.classList.add(widgetPanelSideClass(nextX));
    state.settings.guideWidget = {
      ...state.settings.guideWidget,
      x: nextX,
      y: nextY
    };
  };

  const finishDrag = () => {
    if (!dragging) return;
    dragging = false;
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    if (moved) {
      saveSettingsSoon();
      return;
    }
    toggleGuideWidget();
  };

  const handlePointerMove = (event) => {
    if (!dragging) return;
    const deltaX = event.clientX - startPointerX;
    const deltaY = event.clientY - startPointerY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) moved = true;
    clampAndSavePosition(startX + deltaX, startY + deltaY);
  };

  const handlePointerUp = () => finishDrag();

  bubble.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragging = true;
    moved = false;
    startPointerX = event.clientX;
    startPointerY = event.clientY;
    startX = state.settings.guideWidget.x;
    startY = state.settings.guideWidget.y;
    bubble.setPointerCapture?.(event.pointerId);
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    event.preventDefault();
  });
}

function recalculate() {
  for (const stat of state.template?.stats || []) {
    const el = document.querySelector(`[data-mod-for="${stat.key}"]`);
    if (el) {
      const mod = modifier(getPath(state.character, `stats.${stat.key}`, 10));
      el.textContent = `${mod >= 0 ? "" : "-"}${Math.abs(mod)}`;
    }
  }

  const syncMap = {
    "derived.pvMax": getPath(state.character, "derived.pvMax", ""),
    "derived.seuilMiss": getPath(state.character, "derived.seuilMiss", ""),
    "derived.mouvement": getPath(state.character, "derived.mouvement", ""),
    "derived.initiative": getPath(state.character, "derived.initiative", ""),
    "derived.canalisation": getPath(state.character, "derived.canalisation", ""),
    "derived.volonte": getPath(state.character, "derived.volonte", ""),
    "defense.deflexion": getPath(state.character, "defense.deflexion", ""),
    "derived.mouvementBonus": getPath(state.character, "derived.mouvementBonus", ""),
    "derived.initiativeBonus": getPath(state.character, "derived.initiativeBonus", ""),
    "abilityControls.knownAbilities": getPath(state.character, "abilityControls.knownAbilities", ""),
    "resources.tokens.force": getPath(state.character, "resources.tokens.force", ""),
    "resources.tokens.agilite": getPath(state.character, "resources.tokens.agilite", ""),
    "resources.tokens.esprit": getPath(state.character, "resources.tokens.esprit", ""),
    "resources.tokens.social": getPath(state.character, "resources.tokens.social", "")
  };

  for (const [path, value] of Object.entries(syncMap)) {
    document.querySelectorAll(`[data-path="${path}"]`).forEach((input) => {
      input.value = value;
    });
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
  setStatus("Image chargée localement...");
  targetObject[targetKey] = dataUrl;
  render();
  scheduleSave();
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
  try {
    const savedCharacter = normalizeCharacterData(await Storage.saveCharacter(state.character));
    state.character.id = savedCharacter.id;
    state.character.createdAt = savedCharacter.createdAt;
    state.character.updatedAt = savedCharacter.updatedAt;
    state.character.schemaVersion = savedCharacter.schemaVersion;
    state.character.templateId = savedCharacter.templateId;
    Storage.setCurrentCharacterId(savedCharacter.id);
    setStatus(`Sauvegardé à ${new Date().toLocaleTimeString("fr-FR")}`);
    await refreshCharacters();
  } catch (error) {
    console.error(error);
    setStatus("Erreur de sauvegarde");
  } finally {
    state.saving = false;
  }
}

function setStatus(text) {
  $("#saveStatus").textContent = text;
}

async function refreshCharacters() {
  const select = $("#characterSelect");
  const current = state.character?.id;
  const characters = await Storage.getAllCharacters();
  characters.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  select.innerHTML = `<option value="">Personnages sauvegardés</option>`;
  for (const character of characters) {
    const option = document.createElement("option");
    option.value = character.id;
    option.textContent = character.identity?.nom || character.name || character.id;
    if (character.id === current) option.selected = true;
    select.append(option);
  }
}

async function loadCharacter(id = "nouveau-personnage") {
  const saved = await Storage.getCharacter(id);
  state.character = normalizeCharacterData(saved || Storage.defaultCharacter());
  Storage.setCurrentCharacterId(state.character.id);
  render();
  await refreshCharacters();
  setStatus("Prêt");
}

async function loadSettings() {
  state.settings = await Storage.getSettings();
}

async function loadTemplate() {
  if (window.CARDENVEIL_TEMPLATE) {
    return window.CARDENVEIL_TEMPLATE;
  }
  try {
    const response = await fetch("data/templates/cardenveil-standard.json");
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn("Static template fetch failed", error);
  }
  throw new Error("Template introuvable pour la version statique");
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

  try {
    await Storage.deleteCharacter(characterId);
  } catch (error) {
    console.error(error);
    setStatus("Suppression impossible");
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
  try {
    const { blob, filename } = await Storage.exportCharacterZip(state.character);
    Storage.downloadBlob(blob, filename);
    setStatus("Archive ZIP téléchargée");
  } catch (error) {
    console.error(error);
    setStatus("Erreur lors de la sauvegarde ZIP");
    return;
  }
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
  try {
    state.character = normalizeCharacterData(await Storage.importCharacterZip(file));
  } catch (error) {
    console.error(error);
    setStatus("Erreur à l'import");
    return;
  }
  Storage.setCurrentCharacterId(state.character.id);
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
  state.template = await loadTemplate();
  await loadSettings();
  const currentId = Storage.getCurrentCharacterId() || "nouveau-personnage";
  await loadCharacter(currentId);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.target;
    const tagName = target?.tagName || "";
    if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(tagName)) return;
    event.preventDefault();
    toggleNotesWidget();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Shift" || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    const tagName = target?.tagName || "";
    if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(tagName)) return;
    event.preventDefault();
    toggleGuideWidget();
  });
  const modeSelect = $("#viewModeSelect");
  if (modeSelect) {
    modeSelect.value = state.mode;
    modeSelect.addEventListener("change", (event) => {
      state.mode = event.target.value === "view" ? "view" : "edit";
      applyModeToSheet();
    });
  }
  const deleteButton = $("#deleteCharacter");
  if (deleteButton) deleteButton.addEventListener("click", deleteCurrentCharacter);
  const saveButton = $("#saveCharacter");
  if (saveButton) saveButton.addEventListener("click", saveCharacter);
  const syncButton = $("#syncCharacter");
  if (syncButton) syncButton.addEventListener("click", synchronizeCharacter);
  const exportButton = $("#exportJson");
  if (exportButton) exportButton.addEventListener("click", exportPackage);
  const newCharacterButton = $("#newCharacter");
  if (newCharacterButton) newCharacterButton.addEventListener("click", async () => {
    const id = `nouveau-personnage-${Date.now()}`;
    await loadCharacter(id);
    state.character.id = id;
    state.character.identity.nom = "Nouveau personnage";
    render();
    scheduleSave();
  });
  const characterSelect = $("#characterSelect");
  if (characterSelect) characterSelect.addEventListener("change", (event) => {
    if (event.target.value) loadCharacter(event.target.value);
  });
  const importJsonInput = $("#importJson");
  if (importJsonInput) importJsonInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await importCharacterFile(file);
  });
}

init().catch((error) => {
  console.error(error);
  setStatus("Erreur au chargement");
});



