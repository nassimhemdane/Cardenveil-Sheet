window.CARDENVEIL_TEMPLATE = {
  id: "cardenveil-standard",
  name: "Cardenveil - Standard",
  language: "fr",
  version: 1,
  description: "Template dynamique inspire des fiches Cardenveil existantes.",
  stats: [
    { key: "force", label: "Force", short: "FO" },
    { key: "agilite", label: "Agilite", short: "AGI" },
    { key: "esprit", label: "Esprit", short: "ESP" },
    { key: "social", label: "Social", short: "SOC" }
  ],
  skills: [
    { key: "athletisme", label: "Athletisme", stat: "force" },
    { key: "resilience", label: "Resilience", stat: "force" },
    { key: "acrobaties", label: "Acrobaties", stat: "agilite" },
    { key: "discretion", label: "Discretion", stat: "agilite" },
    { key: "escamotage", label: "Escamotage", stat: "agilite" },
    { key: "arcanes", label: "Arcanes", stat: "esprit" },
    { key: "investigation", label: "Investigation", stat: "esprit" },
    { key: "perception", label: "Perception", stat: "esprit" },
    { key: "culture", label: "Culture", stat: "esprit" },
    { key: "survie", label: "Survie", stat: "esprit" },
    { key: "persuasion", label: "Persuasion", stat: "social" },
    { key: "tromperie", label: "Tromperie", stat: "social" },
    { key: "intimidation", label: "Intimidation", stat: "social" },
    { key: "representation", label: "Representation", stat: "social" },
    { key: "perspicacite", label: "Perspicacite", stat: "social" },
    { key: "dressage", label: "Dressage", stat: "social" }
  ],
  pages: [
    {
      id: "recto",
      title: "Personnage",
      modules: ["identity", "stats", "combat", "skills", "weapons", "inventory", "narrative"]
    },
    {
      id: "verso",
      title: "Capacites",
      modules: ["actions", "reactions", "tokens", "capacities", "notes"]
    }
  ],
  capacityFields: [
    { key: "nom", label: "Nom", type: "text" },
    { key: "type", label: "Type", type: "text" },
    { key: "cout", label: "Cout", type: "text" },
    { key: "portee", label: "Portee", type: "text" },
    { key: "declencheur", label: "Declencheur", type: "text" },
    { key: "effet", label: "Effet", type: "textarea" },
    { key: "amelioration", label: "Amelioration / notes", type: "textarea" }
  ]
};
