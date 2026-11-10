"use strict";

/* Base de datos separada de personajes. Los nombres originales y las fichas añadidas se mantienen aquí. */
const ORIGINAL_DATABASE = [
  {name:"Mark Evans",role:"POR",rating:85,color:"#e9b63c",hair:"#4b281c",speed:1.4,shot:55,emoji:"🧤",techName:"MANO CELESTIAL",techType:"PARADA",pt:110,maxPt:110,ptCost:35},
  {name:"Meca Mark",role:"POR",rating:85,color:"#e9b63c",hair:"#4b281c",speed:1.4,shot:55,emoji:"🧤",techName:"MANO DE PINGUINOS",techType:"PARADA",pt:110,maxPt:110,ptCost:35},
  {name:"Jack Wallside",role:"DEF",rating:79,color:"#3886b7",hair:"#493126",speed:1.4,shot:55,emoji:"🛡️",techName:"EL MURO",techType:"DEFENSA",pt:90,maxPt:90,ptCost:30},
  {name:"Jude Sharp",role:"MC",rating:86,color:"#624e9d",hair:"#33243b",speed:1.8,shot:78,emoji:"⚡",techName:"ESPEJISMO DE BALÓN",techType:"REGATE",pt:115,maxPt:115,ptCost:35},
  {name:"Shawn Froste",role:"DEL",rating:89,color:"#80b9d9",hair:"#d6e6ed",speed:2,shot:91,emoji:"❄️",techName:"AULLIDO DE LOBO",techType:"TIRO",pt:120,maxPt:120,ptCost:45},
  {name:"Axel Blaze",role:"DEL",rating:88,color:"#d84b37",hair:"#e6d9b7",speed:1.9,shot:92,emoji:"🔥",techName:"TORNADO DE FUEGO",techType:"TIRO",pt:115,maxPt:115,ptCost:40},
  {name:"Nathan Swift",role:"DEF",rating:80,color:"#3b7db8",hair:"#2c3e50",speed:2.2,shot:68,emoji:"🌪️",techName:"ENTRADA HURACAN",techType:"REGATE",pt:95,maxPt:95,ptCost:30},
  {name:"Kevin Dragonfly",role:"DEL",rating:78,color:"#8e44ad",hair:"#2c3e50",speed:1.6,shot:82,emoji:"🐉",techName:"REMATE DRAGÓN",techType:"TIRO",pt:90,maxPt:90,ptCost:35},
  {name:"Hurley Kane",role:"DEF",rating:81,color:"#e67e22",hair:"#d35400",speed:1.7,shot:80,emoji:"🌊",techName:"REMATE TSUNAMI",techType:"TIRO",pt:100,maxPt:100,ptCost:35},
  {name:"David Samford",role:"DEL",rating:83,color:"#16a085",hair:"#117864",speed:1.8,shot:84,emoji:"🐧",techName:"PINGÜINO EMPERADOR 2",techType:"TIRO",pt:100,maxPt:100,ptCost:40},
  {name:"Joseph King",role:"POR",rating:81,color:"#f39c12",hair:"#d68910",speed:1.4,shot:48,emoji:"🛡️",techName:"ESCUDO DE FUERZA",techType:"PARADA",pt:100,maxPt:100,ptCost:35},
  {name:"Caleb Stonewall",role:"MC",rating:84,color:"#7d3c98",hair:"#512e5f",speed:1.8,shot:79,emoji:"⚡",techName:"BARRIDO DEFENSIVO",techType:"DEFENSA",pt:110,maxPt:110,ptCost:35},
  {name:"Byron Love",role:"DEL",rating:88,color:"#f1c40f",hair:"#b7950b",speed:1.9,shot:88,emoji:"👼",techName:"SABIDURÍA DIVINA",techType:"TIRO",pt:125,maxPt:125,ptCost:50},
  {name:"Gazel",role:"DEL",rating:88,color:"#aed6f1",hair:"#5d6d7e",speed:2.1,shot:90,emoji:"🧊",techName:"BALÓN ICEBERG",techType:"TIRO",pt:120,maxPt:120,ptCost:45},
  {name:"Torch",role:"DEL",rating:88,color:"#f1948a",hair:"#78281f",speed:2.1,shot:90,emoji:"🔥",techName:"LLAMARADA ATÓMICA",techType:"TIRO",pt:120,maxPt:120,ptCost:45},
  // Raimon
  {name:"Bobby Shearer",role:"DEF",rating:78,color:"#587a9e",hair:"#7b604b",speed:1.7,shot:62,emoji:"🛡️",techName:"BARRERA DEFENSIVA",techType:"DEFENSA",pt:90,maxPt:90,ptCost:30},
  {name:"Timmy Saunders",role:"MC",rating:75,color:"#e2b64f",hair:"#b77a38",speed:1.8,shot:65,emoji:"⚡",techName:"PASE RELÁMPAGO",techType:"REGATE",pt:85,maxPt:85,ptCost:30},
  {name:"Sam Kincaid",role:"DEF",rating:76,color:"#6c9b65",hair:"#65402e",speed:1.6,shot:60,emoji:"🛡️",techName:"BLOQUEO DOBLE",techType:"DEFENSA",pt:88,maxPt:88,ptCost:30},
  {name:"Steve Grim",role:"MC",rating:77,color:"#bd8b54",hair:"#7c4d32",speed:1.8,shot:70,emoji:"⚽",techName:"TIRO GIRATORIO",techType:"TIRO",pt:90,maxPt:90,ptCost:35},
  {name:"William Glass",role:"DEL",rating:74,color:"#8a9cb4",hair:"#c8c5bd",speed:1.9,shot:73,emoji:"💨",techName:"REMATE GAFAS",techType:"TIRO",pt:85,maxPt:85,ptCost:30},
  {name:"Erik Eagle",role:"MC",rating:82,color:"#c75c42",hair:"#9c633c",speed:1.9,shot:79,emoji:"🦅",techName:"TRIPEGASO",techType:"TIRO",pt:100,maxPt:100,ptCost:38},
  // Royal Academy
  {name:"Seymour Hillman",role:"POR",rating:84,color:"#8c8caa",hair:"#443b55",speed:1.4,shot:48,emoji:"🧤",techName:"MANO CELESTIAL",techType:"PARADA",pt:110,maxPt:110,ptCost:35},
  {name:"King",role:"DEL",rating:86,color:"#7e57c2",hair:"#d8c7a5",speed:1.9,shot:88,emoji:"👑",techName:"LANZA DEL REY",techType:"TIRO",pt:115,maxPt:115,ptCost:45},
  // Zeus
  {name:"Poseidon",role:"POR",rating:86,color:"#a82e50",hair:"#271b2b",speed:1.4,shot:50,emoji:"🌊",techName:"MURALLA GIGANTE",techType:"PARADA",pt:115,maxPt:115,ptCost:40},
  {name:"Aphrodite",role:"DEL",rating:91,color:"#e5c7ed",hair:"#e6d8e9",speed:2.0,shot:94,emoji:"✨",techName:"SABIDURÍA DIVINA",techType:"TIRO",pt:130,maxPt:130,ptCost:50},
  {id:"demeter",name:"Demeter",role:"DEL",rating:85,color:"#8dba7c",hair:"#b58b54",speed:1.9,shot:88,emoji:"🌿",techName:"DISPARO CON REBOTES",techType:"TIRO",techniques:[{name:"Disparo con Rebotes",type:"TIRO"}],pt:110,maxPt:110,ptCost:42},
  // Alius Academy
  {name:"Janus",role:"MC",rating:86,color:"#7f6bc4",hair:"#b7a6d9",speed:1.9,shot:82,emoji:"🌌",techName:"ASTRO REMATE",techType:"REGATE",pt:115,maxPt:115,ptCost:40},
  {name:"Bellatrix",role:"DEL",rating:87,color:"#a46bd1",hair:"#d5b9ee",speed:2.0,shot:89,emoji:"💜",techName:"PINGUINO GALÁCTICO",techType:"TIRO",pt:118,maxPt:118,ptCost:45},
  {name:"Xavier Foster",role:"DEL",rating:90,color:"#e74c3c",hair:"#c0392b",speed:2.1,shot:94,emoji:"☄️",techName:"CAÑÓN METEORITO",techType:"TIRO",pt:130,maxPt:130,ptCost:50},
  // Otros equipos de la serie
  {name:"Scotty Banyan",role:"DEF",rating:78,color:"#4d8c62",hair:"#c68b4b",speed:1.8,shot:66,emoji:"🌳",techName:"CAMPO TORBELLINO",techType:"DEFENSA",pt:92,maxPt:92,ptCost:30},
   {id:"dvalin-forward",name:"Dvalin",role:"DEL",rating:86,color:"#a68bd7",hair:"#ded4f0",speed:2.0,shot:91,emoji:"🪐",techName:"LANZA DE ODÍN",techType:"TIRO",techniques:[{name:"Lanza de Odín",type:"TIRO"},{name:"Rayo de Ganímedes",type:"TIRO"},{name:"Espejismo de balón",type:"REGATE"}],pt:115,maxPt:115,ptCost:45},
  {id:"zell",name:"Zell",role:"DEL",rating:83,color:"#e5a6c9",hair:"#e8d0dc",speed:1.95,shot:86,emoji:"🌸",techName:"RAYO DE GANÍMEDES",techType:"TIRO",techniques:[{name:"Rayo de Ganímedes",type:"TIRO"},{name:"Remate de Gaia",type:"TIRO"},{name:"Agujero de gusano",type:"PARADA"},{name:"Muro dimensional",type:"DEFENSA"}],pt:108,maxPt:108,ptCost:40},
  {name:"Nero",role:"POR",rating:85,color:"#8d7ca8",hair:"#44364d",speed:1.4,shot:48,emoji:"🧤",techName:"MURO DIMENSIONAL",techType:"PARADA",pt:112,maxPt:112,ptCost:38},
  {id:"dvalin-keeper",name:"Dvalin",variantLabel:"Portero",role:"POR",rating:88,color:"#6bbd9c",hair:"#ded4f0",speed:1.4,shot:48,emoji:"🌀",techName:"AGUJERO DE GUSANO",techType:"PARADA",techniques:[{name:"Agujero de gusano",type:"PARADA"},{name:"Destrozataladros",type:"PARADA"}],pt:118,maxPt:118,ptCost:42},
  {name:"Darren LaChance",role:"POR",rating:82,color:"#27ae60",hair:"#16a085",speed:1.4,shot:50,emoji:"👐",techName:"MANO MÁGICA",techType:"PARADA",pt:105,maxPt:105,ptCost:35}
];

// Personajes destacados de la historia original (Inazuma Eleven 1, 2, 3 y Ogre).
// Solo personajes principales con nombres oficiales localizados; se excluyen secundarios desconocidos.
const EXTRA_STORY_CHARACTERS = [
  {name:"Aiden Froste",role:"DEL",rating:89,techName:"VENTICSCA ETERNA",techType:"TIRO",emoji:"❄️"},
  {name:"Austin Hobbes",role:"DEL",rating:89,techName:"REMATE DEL TIGRE",techType:"TIRO",emoji:"🐯"},
  {name:"Edgar Partinus",role:"DEL",rating:91,techName:"EXCALIBUR",techType:"TIRO",emoji:"👑"},
  {name:"Hector Helio",role:"POR",rating:94,techName:"MANO CELESTIAL X",techType:"PARADA",emoji:"🧤"},
  {name:"Paolo Bianchi",role:"DEL",rating:87,techName:"ODIN SWORD",techType:"TIRO",emoji:"🌪️"},
  {id:"hidetoshi-nakata",name:"Hidetoshi Nakata",role:"MC",rating:92,techName:"DISPARO VALIENTE",techType:"TIRO",techniques:[{name:"Disparo Valiente",type:"TIRO"},{name:"Voltereta Circense",type:"DEFENSA"},{name:"Súper Elástico",type:"REGATE"},{name:"Ultratécnica",type:"TALENTO"}],emoji:"⭐"},
  {name:"Canon Evans",team:"Equipo Ogre",role:"DEL",rating:89,techName:"CANION CELESTIAL",techType:"TIRO",emoji:"⚡"},
  {name:"Lucifer",team:"Equipo Ogre",role:"POR",rating:85,techName:"VOLTAJE DUAL",techType:"PARADA",emoji:"🧤"},
  // Equipos clásicos: Farm, Occult y Shuriken.
  {id:"lancer-ogre",name:"Lancer",team:"Ogre",role:"DEL",rating:78,techName:"LANZA LETAL",techType:"TIRO",techniques:[{name:"Lanza Letal",type:"TIRO"},{name:"Mangual Letal",type:"TIRO"}],emoji:"🗡️"},
  // Raimon GO y Chrono Stone.
  {id:"go-arion",name:"Arion Sherwind",team:"Raimon GO",role:"MC",rating:89,techName:"DANZA DEL VIENTO DIVINO",techType:"REGATE",emoji:"🌪️"},
  {id:"go-victor",name:"Victor Blade",team:"Raimon GO",role:"DEL",rating:92,techName:"PROYECTIL LETAL",techType:"TIRO",emoji:"⚔️"},
  {id:"go-riccardo",name:"Riccardo Di Rigo",team:"Raimon GO",role:"MC",rating:90,techName:"PENTAGRAMA",techType:"TIRO",emoji:"🎼"},
  {id:"chrono-fei",name:"Fei Rune",team:"Raimon GO Chrono Stone",role:"DEL",rating:93,techName:"REMATE DINOSAURIO",techType:"TIRO",techniques:[{name:"Remate Dinosaurio",type:"TIRO"},{name:"Gran Salto",type:"REGATE"}],emoji:"🦖"},
  {id:"chrono-zanark",name:"Zanark Avalonic",team:"Raimon GO Chrono Stone",role:"DEL",rating:96,techName:"GOLPE CATACLISMO",techType:"TIRO",techniques:[{name:"Garra Bestial",type:"TIRO"},{name:"Remate Dinosaurio",type:"TIRO"}],emoji:"🦁"},
  {id:"chrono-bailong",name:"Bailong",team:"Raimon GO Chrono Stone",role:"DEL",rating:94,techName:"CICLON BLANCO",techType:"TIRO",emoji:"🐉"},
  {id:"chrono-alpha",name:"Alpha",team:"Protocolo Omega",role:"DEL",rating:91,techName:"TIRO ROTATIVO",techType:"TIRO",emoji:"🌀"},
  {id:"chrono-beta",name:"Beta",team:"Protocolo Omega",role:"MC",rating:89,techName:"DISPARO DOBLE",techType:"TIRO",emoji:"🔮"},
  {id:"chrono-gamma",name:"Gamma",team:"Protocolo Omega",role:"DEL",rating:91,techName:"GIRO ATOMICO",techType:"TIRO",emoji:"🔮"},
  {id:"go-michael",name:"Michael Ballzack",team:"Raimon GO",role:"DEL",rating:84,techName:"CASCABEL",techType:"TYRO",emoji:"🐉"},
  {id:"chrono-tezcat",name:"Tezcat",team:"Raimon GO Chrono Stone",role:"DEL",rating:94,techName:"CENIZA NEGRA",techType:"TIRO",emoji:"🐆"},
  // GO Galaxy: Earth Eleven y sus figuras más conocidas.

  // Ares: Inakuni Raimon, Seishou y Outei Tsukinomiya.
  {id:"ares-asuto",name:"Asuto Inamori",team:"Inakuni Raimon (Ares)",role:"DEL",rating:92,techName:"SHYNING BIRD",techType:"TIRO",emoji:"🔥"},
  {id:"ares-haizaki",name:"Ryouhei Haizaki",team:"Seishou Gakuen (Ares)",role:"DEL",rating:95,techName:"PINGÜINO PERFECTO",techType:"TIRO",techniques:[{name:"Pingüino Perfecto",type:"TIRO"},{name:"Chilena de Pingüino",type:"TIRO"}],emoji:"🐧"},
  {id:"ares-nosaka",name:"Yuuma Nosaka",team:"Outei Tsukinomiya (Ares)",role:"MC",rating:95,techName:"LANCERO REAL",techType:"TIRO",emoji:"♟️"},
  {id:"ares-nishikage",name:"Seiya Nishikage",team:"Outei Tsukinomiya (Ares)",role:"POR",rating:92,techName:"ESCUDO LUNAR",techType:"PARADA",emoji:"🧤"},
  {id:"ares-kozoumaru",name:"Kozoumaru Sasuke",team:"Inakuni Raimon (Ares)",role:"DEL",rating:89,techName:"TORNADO DE FUEGO",techType:"TIRO",emoji:"🍖"},
  {id:"ares-hiura",name:"Kirina Hiura",team:"Inakuni Raimon (Ares)",role:"MC",rating:88,techName:"FRENTE FRÍO",techType:"REGATE",emoji:"❄️"},
   // Orion: selección Inazuma Japón y rivales internacionales.
  {id:"orion-ichihoshi",name:"Mitsuhiro Ichihoshi",team:"Inazuma Japón (Orion)",role:"MC",rating:93,techName:"DIMENSIÓN KAMAKURA",techType:"REGATE",emoji:"🌌"},
  {id:"orion-clario",name:"Clario Orvan",team:"Guardianes de la Reina",role:"DEL",rating:95,techName:"RAYO DE DIAMANTES",techType:"TIRO",emoji:"💠"},
  // Equipo Ogre y selección internacional.
];

const EXTRA_PALETTES = ["#d84b37", "#3b82b8", "#8e44ad", "#27ae60", "#d4a72c", "#5b6c9c", "#bd6b9d"];
const EXTRA_HAIR = ["#302b2b", "#6b503c", "#d8c7a5", "#c7d7e8", "#9c6b42", "#40304f"];
const EXTRA_CHARACTER_CARDS = EXTRA_STORY_CHARACTERS.map((p, i) => {
  const role = p.role || "MC";
  const isKeeper = role === "POR";
  const isShot = p.techType === "TIRO";
  const rating = p.rating || 78;
  const maxPt = 88 + Math.round((rating - 65) * 1.35);
  return {
    ...p, color: EXTRA_PALETTES[i % EXTRA_PALETTES.length],
    hair: EXTRA_HAIR[i % EXTRA_HAIR.length],
    speed: role === "POR" ? 1.4 : role === "DEF" ? 1.65 : role === "DEL" ? 2.0 : 1.85,
    shot: isKeeper ? 45 : isShot ? Math.min(98, rating + 3) : Math.max(55, rating - 8),
    pt: maxPt, maxPt, ptCost: isKeeper ? 35 : isShot ? 42 : 32
  };
});

const DATABASE = (() => {
  const combined = [...ORIGINAL_DATABASE, ...EXTRA_CHARACTER_CARDS];
  const unique = new Map();
  combined.forEach(p => {
    const key = p.id || `${p.name.toLowerCase()}-${(p.role || "MC").toLowerCase()}`;
    if (!unique.has(key)) unique.set(key, { ...p, id: key });
  });
  return [...unique.values()].map(p => ({
    ...p,
    techniques: Array.isArray(p.techniques) && p.techniques.length
      ? p.techniques
      : (p.techName && p.techType && p.techType !== "NORMAL" ? [{ name: p.techName, type: p.techType }] : [])
  }));
})();

// Rareza y técnicas alternativas por personaje. Las variantes se generan en gacha.js.
// Joseph King: la versión básica usa Escudo de Fuerza y las versiones superiores Colmillo de Pantera.
const CHARACTER_RARITY_TECHNIQUES = {
  "Joseph King": {
    COMÚN: [{ name: "Escudo de Fuerza", type: "PARADA" }],
    LEGENDARIO: [{ name: "Colmillo de Pantera", type: "PARADA" }]
  },
  "Mark Evans": {
    COMÚN: [{ name: "Mano Celestial", type: "PARADA" }],
    ÉPICO: [{ name: "Superpuño Invencible", type: "PARADA" }],
    MÍTICO: [{ name: "Mano Celestial V", type: "PARADA" }]
  },
  "Lancer": {
    COMÚN: [{ name: "Lanza Letal", type: "TIRO" }],
    MÍTICO: [{ name: "Lanza Letal", type: "TIRO" }, { name: "Mangual Letal", type: "TIRO" }]
  }
};


/* =====================================================
   IMÁGENES NUEVAS DEL USUARIO: asociación automática por nombre
   Las rutas WEBP se asignan sin alterar IDs, estadísticas ni técnicas.
===================================================== */
const CHARACTER_IMAGE_FILES = {
"Mark Evans": "mark.webp", 
"Jack Wallside": "jack.webp", 
"Jude Sharp": "jude.webp", 
"Shawn Froste": "shawn.webp", 
"Axel Blaze": "axel.webp", 
"Nathan Swift": "nathan.webp", 
"Kevin Dragonfly": "kevin.webp", 
"Darren LaChance": "darren.webp", 
"Gazel": "gazel.webp", 
"Torch": "torch.webp", 
"Joseph King": "king.webp", 
"David Samford": "samford.webp", 
"Hurley Kane": "hurley.webp", 
"Timmy Saunders": "timmy.webp", 
"Steve Grim": "steve.webp", 
"Erik Eagle": "erik.webp", 
"Xavier Foster": "xavier.webp", 
"Jordan Greenway": "janus.webp", 
"Byron Love": "byron.webp", 
"Demeter": "demeter.webp", 
"Apollo": "artemis.webp", 
"Poseidon": "poseidon.webp", 
"Aphrodite": "byron.webp", 
"Janus": "janus.webp", 
"Bellatrix": "bellatrix.webp", 
"Nero": "nero.webp", 
"Dvalin": "dvalin.webp", 
"Aiden Froste": "aiden.webp", 
"Austin Hobbes": "austin.webp", 
"Edgar Partinus": "edgar.webp", 
"Hector Helio": "helio.webp", 
"Paolo Bianchi": "paolo.webp", 
"William Glass": "willy.webp", 
"Hidetoshi Nakata": "nakata.webp", 
"Destra": "destra.webp", 
"Canon Evans": "canon.webp", 
"David Quagmire": "dvalin.webp", 
"Lancer": "lancer.png", 
"Thomas Feldt": "feldt.webp", 
"Arion Sherwind": "arion.webp", 
"Victor Blade": "victor.webp", 
"Riccardo Di Rigo": "ricardo.webp", 
"Fei Rune": "fei.webp", 
"Goldie Lemmon": "Kisaragi_Mako.webp", 
"Zanark Avalonic": "zanark.webp", 
"Alpha": "alpha.webp", 
"Beta": "beta.webp", 
"Michael Ballzack": "ballzack.webp", 
"Tezcat": "tezcat.webp", 
"Lucifer": "lucifer.webp", 
"Wonderbot": "Clark_Wonderbot.webp", 
"Caleb Stonewall": "caleb.webp",
"Bobby Shearer": "bobby.webp",
"Sam Kincaid": "sam.webp",
"Seymour Hillman": "hillman.webp",
"Jim Wraith": "jim.webp",
"Maxwell Carson": "max.webp",
"Scotty Banyan": "scotty.webp",
"Zell": "zell.webp",
"Meca Mark": "mecamark.webp",
"Bailong": "bailog.webp",
"Asuto Inamori": "asuto.webp",
"Gamma": "gamma.webp", 
"Ryouhei Haizaki": "haizaki.webp", 
"Yuuma Nosaka": "nosaka.webp", 
"Seiya Nishikage": "nishikage.webp", 
"Kozoumaru Sasuke": "sasuke.webp", 
"Kirina Hiura": "kirina.webp", 
"Mitsuhiro Ichihoshi": "ichihoshi.webp", 
"Clario Orvan": "clario.webp"};
DATABASE.forEach(player => {
  const supplied = CHARACTER_IMAGE_FILES[player.name];
  // Solo se asignan las imágenes WEBP aportadas por el usuario.
  // Si no hay WEBP para un personaje, se deja null y se usa el dibujo/emoji de respaldo.
  player.image = supplied ? `assets/players/new/${supplied}` : null;
});

