"use strict";

/* Base de datos separada de personajes. Los nombres originales y las fichas añadidas se mantienen aquí. */
const ORIGINAL_DATABASE = [
  {name:"Mark Evans",role:"POR",rating:85,color:"#e9b63c",hair:"#4b281c",speed:1.4,shot:55,emoji:"🧤",techName:"MANO CELESTIAL",techType:"PARADA",pt:110,maxPt:110,ptCost:35},
  {name:"Jack Wallside",role:"DEF",rating:79,color:"#3886b7",hair:"#493126",speed:1.4,shot:55,emoji:"🛡️",techName:"EL MURO",techType:"DEFENSA",pt:90,maxPt:90,ptCost:30},
  {name:"Jude Sharp",role:"MC",rating:86,color:"#624e9d",hair:"#33243b",speed:1.8,shot:78,emoji:"⚡",techName:"ESPEJISMO DE BALÓN",techType:"REGATE",pt:115,maxPt:115,ptCost:35},
  {name:"Shawn Froste",role:"DEL",rating:89,color:"#80b9d9",hair:"#d6e6ed",speed:2,shot:91,emoji:"❄️",techName:"VENTISCA ETERNA",techType:"TIRO",pt:120,maxPt:120,ptCost:45},
  {name:"Axel Blaze",role:"DEL",rating:88,color:"#d84b37",hair:"#e6d9b7",speed:1.9,shot:92,emoji:"🔥",techName:"TORNADO DE FUEGO",techType:"TIRO",pt:115,maxPt:115,ptCost:40},
  {name:"Nathan Swift",role:"DEF",rating:80,color:"#3b7db8",hair:"#2c3e50",speed:2.2,shot:68,emoji:"🌪️",techName:"REGATE EN ESPIRAL",techType:"REGATE",pt:95,maxPt:95,ptCost:30},
  {name:"Kevin Dragonfly",role:"DEL",rating:78,color:"#8e44ad",hair:"#2c3e50",speed:1.6,shot:82,emoji:"🐉",techName:"REMATE DRAGÓN",techType:"TIRO",pt:90,maxPt:90,ptCost:35},
  {name:"Hurley Kane",role:"DEF",rating:81,color:"#e67e22",hair:"#d35400",speed:1.7,shot:80,emoji:"🌊",techName:"TIRO DEL MEGAAULÓN",techType:"TIRO",pt:100,maxPt:100,ptCost:35},
  {name:"Darren LaChance",role:"POR",rating:82,color:"#27ae60",hair:"#16a085",speed:1.4,shot:50,emoji:"👐",techName:"MANO MÁGICA",techType:"PARADA",pt:105,maxPt:105,ptCost:35},
  {name:"Xavier Foster",role:"DEL",rating:90,color:"#e74c3c",hair:"#c0392b",speed:2.1,shot:94,emoji:"☄️",techName:"CAÑÓN METEORITO",techType:"TIRO",pt:130,maxPt:130,ptCost:50},
  {name:"Jordan Greenway",role:"MC",rating:83,color:"#2ecc71",hair:"#27ae60",speed:1.9,shot:76,emoji:"🌌",techName:"ASTRAL",techType:"REGATE",pt:105,maxPt:105,ptCost:35},
  {name:"David Samford",role:"DEL",rating:83,color:"#16a085",hair:"#117864",speed:1.8,shot:84,emoji:"🐧",techName:"PINGÜINO DIGITAL",techType:"TIRO",pt:100,maxPt:100,ptCost:40},
  {name:"Joseph King",role:"POR",rating:81,color:"#f39c12",hair:"#d68910",speed:1.4,shot:48,emoji:"🛡️",techName:"ESCUDO DE FUERZA",techType:"PARADA",pt:100,maxPt:100,ptCost:35},
  {name:"Caleb Stonewall",role:"MC",rating:84,color:"#7d3c98",hair:"#512e5f",speed:1.8,shot:79,emoji:"⚡",techName:"DESLIZAMIENTO CORTANTE",techType:"DEFENSA",pt:110,maxPt:110,ptCost:35},
  {name:"Byron Love",role:"DEL",rating:88,color:"#f1c40f",hair:"#b7950b",speed:1.9,shot:88,emoji:"👼",techName:"SABIDURÍA DIVINA",techType:"TIRO",pt:125,maxPt:125,ptCost:50},
  {name:"Gazel",role:"DEL",rating:88,color:"#aed6f1",hair:"#5d6d7e",speed:2.1,shot:90,emoji:"🧊",techName:"BALÓN DE HIELO",techType:"TIRO",pt:120,maxPt:120,ptCost:45},
  {name:"Torch",role:"DEL",rating:88,color:"#f1948a",hair:"#78281f",speed:2.1,shot:90,emoji:"🔥",techName:"LLAMARADA ATÓMICA",techType:"TIRO",pt:120,maxPt:120,ptCost:45},
  // Raimon
  {name:"Bobby Shearer",role:"DEF",rating:78,color:"#587a9e",hair:"#7b604b",speed:1.7,shot:62,emoji:"🛡️",techName:"BARRERA DEFENSIVA",techType:"DEFENSA",pt:90,maxPt:90,ptCost:30},
  {name:"Timmy Saunders",role:"MC",rating:75,color:"#e2b64f",hair:"#b77a38",speed:1.8,shot:65,emoji:"⚡",techName:"PASE RELÁMPAGO",techType:"REGATE",pt:85,maxPt:85,ptCost:30},
  {name:"Sam Kincaid",role:"DEF",rating:76,color:"#6c9b65",hair:"#65402e",speed:1.6,shot:60,emoji:"🛡️",techName:"BLOQUEO DOBLE",techType:"DEFENSA",pt:88,maxPt:88,ptCost:30},
  {name:"Steve Grim",role:"MC",rating:77,color:"#bd8b54",hair:"#7c4d32",speed:1.8,shot:70,emoji:"⚽",techName:"TIRO GIRATORIO",techType:"TIRO",pt:90,maxPt:90,ptCost:35},
  {name:"William Glass",role:"DEL",rating:74,color:"#8a9cb4",hair:"#c8c5bd",speed:1.9,shot:73,emoji:"💨",techName:"REGATE FANTASMA",techType:"REGATE",pt:85,maxPt:85,ptCost:30},
  {name:"Erik Eagle",role:"MC",rating:82,color:"#c75c42",hair:"#9c633c",speed:1.9,shot:79,emoji:"🦅",techName:"TIRO DEL ÁGUILA",techType:"TIRO",pt:100,maxPt:100,ptCost:38},
  {name:"Celia Hills",role:"MC",rating:76,color:"#7d9fc4",hair:"#60483d",speed:1.7,shot:64,emoji:"🌟",techName:"PASE PRECISO",techType:"REGATE",pt:90,maxPt:90,ptCost:30},
  {name:"Silvia Woods",role:"MC",rating:75,color:"#db8ba7",hair:"#8c563e",speed:1.7,shot:61,emoji:"💗",techName:"APOYO TOTAL",techType:"REGATE",pt:88,maxPt:88,ptCost:30},
  // Royal Academy
  {name:"Seymour Hillman",role:"POR",rating:84,color:"#8c8caa",hair:"#443b55",speed:1.4,shot:48,emoji:"🧤",techName:"MANO FANTASMA",techType:"PARADA",pt:110,maxPt:110,ptCost:35},
  {name:"King",role:"DEL",rating:86,color:"#7e57c2",hair:"#d8c7a5",speed:1.9,shot:88,emoji:"👑",techName:"LANZA DEL REY",techType:"TIRO",pt:115,maxPt:115,ptCost:45},
  {name:"Derek Swing",role:"MC",rating:82,color:"#546e7a",hair:"#47352d",speed:1.8,shot:76,emoji:"🌀",techName:"REGATE GIRATORIO",techType:"REGATE",pt:100,maxPt:100,ptCost:35},
  {name:"Alan Master",role:"DEF",rating:80,color:"#607d8b",hair:"#302b2b",speed:1.6,shot:68,emoji:"🛡️",techName:"MURO DE ACERO",techType:"DEFENSA",pt:95,maxPt:95,ptCost:32},
  {name:"Jimon Daiki",role:"DEF",rating:78,color:"#795548",hair:"#392b25",speed:1.6,shot:65,emoji:"🛡️",techName:"BLOQUEO REAL",techType:"DEFENSA",pt:90,maxPt:90,ptCost:30},
  // Zeus
  {name:"Poseidon",role:"POR",rating:86,color:"#a82e50",hair:"#271b2b",speed:1.4,shot:50,emoji:"🌊",techName:"MURALLA GIGANTE",techType:"PARADA",pt:115,maxPt:115,ptCost:40},
  {name:"Aphrodite",role:"DEL",rating:91,color:"#e5c7ed",hair:"#e6d8e9",speed:2.0,shot:94,emoji:"✨",techName:"SABIDURÍA DIVINA",techType:"TIRO",pt:130,maxPt:130,ptCost:50},
  {id:"demeter",name:"Demeter",role:"DEL",rating:85,color:"#8dba7c",hair:"#b58b54",speed:1.9,shot:88,emoji:"🌿",techName:"DISPARO CON REBOTES",techType:"TIRO",techniques:[{name:"Disparo con Rebotes",type:"TIRO"}],pt:110,maxPt:110,ptCost:42},
  {name:"Apollo",role:"DEL",rating:85,color:"#f3b94f",hair:"#e7b65b",speed:1.9,shot:86,emoji:"☀️",techName:"FLECHA SOLAR",techType:"TIRO",pt:110,maxPt:110,ptCost:42},
  {name:"Ares",role:"DEF",rating:82,color:"#8051a5",hair:"#33243b",speed:1.7,shot:70,emoji:"🛡️",techName:"PISOTÓN DE ARES",techType:"DEFENSA",pt:100,maxPt:100,ptCost:35},
  // Kirkwood
  {name:"Bobby Shearer",role:"DEF",rating:79,color:"#4e789c",hair:"#6b503c",speed:1.7,shot:64,emoji:"🛡️",techName:"BARRERA DEFENSIVA",techType:"DEFENSA",pt:92,maxPt:92,ptCost:30},
  {name:"Jim Wraith",role:"DEL",rating:81,color:"#d7a14b",hair:"#8b633d",speed:1.8,shot:82,emoji:"👻",techName:"TIRO FANTASMA",techType:"TIRO",pt:98,maxPt:98,ptCost:38},
  {name:"Maxwell Carson",role:"MC",rating:80,color:"#6496b7",hair:"#4b3428",speed:1.9,shot:75,emoji:"🌪️",techName:"VÓRTICE",techType:"REGATE",pt:95,maxPt:95,ptCost:32},
  {name:"Darren LaChance",role:"POR",rating:82,color:"#27ae60",hair:"#16a085",speed:1.4,shot:50,emoji:"👐",techName:"MANO MÁGICA",techType:"PARADA",pt:105,maxPt:105,ptCost:35},
  // Brainwashing / Occult / Wild / Farm
  {name:"Brain",role:"MC",rating:81,color:"#5e7d9c",hair:"#c6d0d8",speed:1.8,shot:76,emoji:"🧠",techName:"CONTROL MENTAL",techType:"REGATE",pt:100,maxPt:100,ptCost:35},
  {name:"Miyasaka",role:"DEL",rating:79,color:"#6d9e78",hair:"#6a4c39",speed:2.0,shot:78,emoji:"💨",techName:"ACELERACIÓN",techType:"TIRO",pt:95,maxPt:95,ptCost:35},
  {name:"Manga",role:"DEF",rating:77,color:"#6a5c8d",hair:"#302c3b",speed:1.7,shot:64,emoji:"🛡️",techName:"SOMBRA DEFENSIVA",techType:"DEFENSA",pt:90,maxPt:90,ptCost:30},
  {name:"Scotty Banyan",role:"DEF",rating:78,color:"#4d8c62",hair:"#c68b4b",speed:1.8,shot:66,emoji:"🌳",techName:"BLOQUEO DEL BOSQUE",techType:"DEFENSA",pt:92,maxPt:92,ptCost:30},
  {name:"Thor Stoutberg",role:"MC",rating:80,color:"#9c7448",hair:"#8c542e",speed:1.7,shot:74,emoji:"⚡",techName:"TRUENO",techType:"TIRO",pt:95,maxPt:95,ptCost:35},
  {name:"Byron Love",role:"DEL",rating:88,color:"#f1c40f",hair:"#b7950b",speed:1.9,shot:88,emoji:"👼",techName:"SABIDURÍA DIVINA",techType:"TIRO",pt:125,maxPt:125,ptCost:50},
  // Alius Academy
  {name:"Janus",role:"MC",rating:86,color:"#7f6bc4",hair:"#b7a6d9",speed:1.9,shot:82,emoji:"🌌",techName:"GRAVEDAD",techType:"REGATE",pt:115,maxPt:115,ptCost:40},
  {name:"Bellatrix",role:"DEL",rating:87,color:"#a46bd1",hair:"#d5b9ee",speed:2.0,shot:89,emoji:"💜",techName:"TIRO GALÁCTICO",techType:"TIRO",pt:118,maxPt:118,ptCost:45},
  {name:"Icer",role:"DEF",rating:83,color:"#75cbe8",hair:"#d7f4ff",speed:1.8,shot:72,emoji:"❄️",techName:"PRISIÓN DE HIELO",techType:"DEFENSA",pt:105,maxPt:105,ptCost:38},
  {name:"Droll",role:"MC",rating:82,color:"#77a6d8",hair:"#d8e8f4",speed:1.9,shot:78,emoji:"🧊",techName:"ESPEJISMO HELADO",techType:"REGATE",pt:100,maxPt:100,ptCost:35},
  {name:"Wheeze",role:"DEL",rating:84,color:"#8e72c6",hair:"#c8b6e2",speed:1.9,shot:84,emoji:"🌠",techName:"COMETA OSCURO",techType:"TIRO",pt:108,maxPt:108,ptCost:40},
  {name:"Xavier Foster",role:"DEL",rating:90,color:"#e74c3c",hair:"#c0392b",speed:2.1,shot:94,emoji:"☄️",techName:"CAÑÓN METEORITO",techType:"TIRO",pt:130,maxPt:130,ptCost:50},
  // Otros equipos de la serie
  {name:"Scotty Banyan",role:"DEF",rating:78,color:"#4d8c62",hair:"#c68b4b",speed:1.8,shot:66,emoji:"🌳",techName:"BLOQUEO DEL BOSQUE",techType:"DEFENSA",pt:92,maxPt:92,ptCost:30},
  {name:"Harley Hathaway",role:"DEL",rating:82,color:"#e18b43",hair:"#b36a37",speed:2.0,shot:83,emoji:"🌊",techName:"OLA GIGANTE",techType:"TIRO",pt:102,maxPt:102,ptCost:38},
  {id:"dvalin-forward",name:"Dvalin",role:"DEL",rating:86,color:"#a68bd7",hair:"#ded4f0",speed:2.0,shot:91,emoji:"🪐",techName:"LANZA DE ODÍN",techType:"TIRO",techniques:[{name:"Lanza de Odín",type:"TIRO"},{name:"Rayo de Ganímedes",type:"TIRO"},{name:"Espejismo de balón",type:"REGATE"}],pt:115,maxPt:115,ptCost:45},
  {id:"zell",name:"Zell",role:"DEL",rating:83,color:"#e5a6c9",hair:"#e8d0dc",speed:1.95,shot:86,emoji:"🌸",techName:"RAYO DE GANÍMEDES",techType:"TIRO",techniques:[{name:"Rayo de Ganímedes",type:"TIRO"},{name:"Remate de Gaia",type:"TIRO"},{name:"Agujero de gusano",type:"PARADA"},{name:"Muro dimensional",type:"DEFENSA"}],pt:108,maxPt:108,ptCost:40},
  {name:"Nero",role:"POR",rating:85,color:"#8d7ca8",hair:"#44364d",speed:1.4,shot:48,emoji:"🧤",techName:"MANO DEL VACÍO",techType:"PARADA",pt:112,maxPt:112,ptCost:38},
  {id:"dvalin-keeper",name:"Dvalin",variantLabel:"Portero",role:"POR",rating:88,color:"#6bbd9c",hair:"#ded4f0",speed:1.4,shot:48,emoji:"🌀",techName:"AGUJERO DE GUSANO",techType:"PARADA",techniques:[{name:"Agujero de gusano",type:"PARADA"},{name:"Destrozataladros",type:"PARADA"}],pt:118,maxPt:118,ptCost:42},
  {name:"Shadow Cimmerian",role:"DEF",rating:84,color:"#3e465f",hair:"#202538",speed:1.9,shot:74,emoji:"🌑",techName:"SOMBRA FANTASMA",techType:"DEFENSA",pt:108,maxPt:108,ptCost:38},
  {name:"Darren LaChance",role:"POR",rating:82,color:"#27ae60",hair:"#16a085",speed:1.4,shot:50,emoji:"👐",techName:"MANO MÁGICA",techType:"PARADA",pt:105,maxPt:105,ptCost:35}
];

// Personajes destacados de la historia original (Inazuma Eleven 1, 2, 3 y Ogre).
// Solo personajes principales con nombres oficiales localizados; se excluyen secundarios desconocidos.
const EXTRA_STORY_CHARACTERS = [
  {name:"Tod Ironside",role:"DEF",rating:73,techName:"",techType:"NORMAL",emoji:"🛡️"},
  {name:"Aiden Froste",role:"DEL",rating:89,techName:"",techType:"NORMAL",emoji:"❄️"},
  {name:"Austin Hobbes",role:"DEL",rating:89,techName:"",techType:"NORMAL",emoji:"🐯"},
  {id:"archer-hawkins",name:"Archer Hawkins",role:"DEF",rating:84,techName:"GOLPE DE VACÍO",techType:"DEFENSA",techniques:[{name:"Golpe de Vacío",type:"DEFENSA"},{name:"Coz",type:"DEFENSA"},{name:"Remate Halcón",type:"DEFENSA"},{name:"Siempre a muerte",type:"TALENTO"}],emoji:"🥋"},
  {name:"Edgar Partinus",role:"DEL",rating:91,techName:"",techType:"NORMAL",emoji:"👑"},
  {name:"Hector Helio",role:"POR",rating:94,techName:"",techType:"NORMAL",emoji:"🧤"},
  {name:"Paolo Bianchi",role:"DEL",rating:87,techName:"ODIN SWORD",techType:"TIRO",emoji:"🌪️"},
  {name:"Mark Kruger",role:"MC",rating:86,techName:"",techType:"NORMAL",emoji:"🦄"},
  {name:"Dylan Keith",role:"DEL",rating:85,techName:"",techType:"NORMAL",emoji:"🦅"},
  {id:"hidetoshi-nakata",name:"Hidetoshi Nakata",role:"MC",rating:92,techName:"DISPARO VALIENTE",techType:"TIRO",techniques:[{name:"Disparo Valiente",type:"TIRO"},{name:"Voltereta Circense",type:"DEFENSA"},{name:"Súper Elástico",type:"REGATE"},{name:"Ultratécnica",type:"TALENTO"}],emoji:"⭐"},
  {name:"Baddap Sleed",team:"Equipo Ogre",role:"DEL",rating:93,techName:"LANZA DE ODÍN",techType:"TIRO",emoji:"⚔️"},
  {name:"Canon Evans",team:"Equipo Ogre",role:"DEL",rating:89,techName:"TORNADO DE FUEGO",techType:"TIRO",emoji:"⚡"},
  {name:"David Quagmire",team:"Equipo Ogre",role:"POR",rating:85,techName:"MANO DEL VACÍO",techType:"PARADA",emoji:"🧤"},
  // Equipos clásicos: Farm, Occult y Shuriken.
  {id:"lancer-farm",name:"Lancer",team:"Farm",role:"DEL",rating:78,techName:"LANZA LETAL",techType:"TIRO",techniques:[{name:"Lanza Letal",type:"TIRO"},{name:"Mangual Letal",type:"TIRO"}],emoji:"🗡️"},
  {id:"occult-franky",name:"Franky",team:"Occult",role:"DEF",rating:76,techName:"SOMBRA FANTASMA",techType:"DEFENSA",emoji:"👻"},
  {id:"occult-thomas",name:"Thomas Feldt",team:"Occult",role:"POR",rating:79,techName:"CAMPO DE FUERZA",techType:"PARADA",techniques:[{name:"Campo de Fuerza",type:"PARADA"}],emoji:"🧤"},
  {id:"occult-scarecrow",name:"Scarecrow",team:"Occult",role:"MC",rating:77,techName:"CONTROL MENTAL",techType:"REGATE",emoji:"🎭"},
  {id:"shuriken-kageno",name:"Hidetoshi Kageno",team:"Shuriken",role:"DEF",rating:78,techName:"SOMBRA DEFENSIVA",techType:"DEFENSA",emoji:"🥷"},
  {id:"shuriken-kirigakure",name:"Kirigakure",team:"Shuriken",role:"DEL",rating:80,techName:"TIRO DEL ÁGUILA",techType:"TIRO",emoji:"🌪️"},
  {id:"farm-tommy",name:"Tommy Mitchell",team:"Farm",role:"MC",rating:77,techName:"PASE PRECISO",techType:"REGATE",emoji:"⚽"},
  // Raimon GO y Chrono Stone.
  {id:"go-arion",name:"Arion Sherwind",team:"Raimon GO",role:"MC",rating:89,techName:"DANZA DEL VIENTO DIVINO",techType:"REGATE",techniques:[{name:"Danza del Viento Divino",type:"REGATE"},{name:"Gran Salto",type:"REGATE"}],emoji:"🌪️"},
  {id:"go-victor",name:"Victor Blade",team:"Raimon GO",role:"DEL",rating:92,techName:"ESPADA MORTAL",techType:"TIRO",techniques:[{name:"Espada Mortal",type:"TIRO"},{name:"Doble Espada Mortal",type:"TIRO"}],emoji:"⚔️"},
  {id:"go-riccardo",name:"Riccardo Di Rigo",team:"Raimon GO",role:"MC",rating:90,techName:"FORTÍSIMO",techType:"TIRO",techniques:[{name:"Fortísimo",type:"TIRO"},{name:"Pase Preciso",type:"REGATE"}],emoji:"🎼"},
  {id:"go-sol",name:"Sol Daystar",team:"Raimon GO",role:"DEL",rating:91,techName:"TORMENTA SOLAR",techType:"TIRO",techniques:[{name:"Tormenta Solar",type:"TIRO"},{name:"Supernova",type:"TIRO"}],emoji:"☀️"},
  {id:"go-jean-pierre",name:"Jean-Pierre Lapin",team:"Raimon GO",role:"POR",rating:87,techName:"SUPERPUÑO INVENCIBLE",techType:"PARADA",techniques:[{name:"Superpuño Invencible",type:"PARADA"}],emoji:"🧤"},
  {id:"go-gabriel",name:"Gabriel Garcia",team:"Raimon GO",role:"DEF",rating:86,techName:"BARRERA DEFENSIVA",techType:"DEFENSA",emoji:"🛡️"},
  {id:"go-aitor",name:"Aitor Cazador",team:"Raimon GO",role:"DEF",rating:85,techName:"GARRA BESTIAL",techType:"DEFENSA",emoji:"🐺"},
  {id:"go-skie",name:"Skie Blue",team:"Raimon GO",role:"MC",rating:84,techName:"DANZA DEL VIENTO DIVINO",techType:"REGATE",emoji:"🪽"},
  {id:"chrono-fei",name:"Fei Rune",team:"Raimon GO Chrono Stone",role:"DEL",rating:93,techName:"REMATE DINOSAURIO",techType:"TIRO",techniques:[{name:"Remate Dinosaurio",type:"TIRO"},{name:"Gran Salto",type:"REGATE"}],emoji:"🦖"},
  {id:"chrono-goldie",name:"Goldie Lemmon",team:"Raimon GO Chrono Stone",role:"MC",rating:88,techName:"SUPERNOVA",techType:"TIRO",emoji:"🌟"},
  {id:"chrono-zanark",name:"Zanark Avalonic",team:"Raimon GO Chrono Stone",role:"DEL",rating:96,techName:"GARRA BESTIAL",techType:"TIRO",techniques:[{name:"Garra Bestial",type:"TIRO"},{name:"Remate Dinosaurio",type:"TIRO"}],emoji:"🦁"},
  {id:"chrono-bailong",name:"Bailong",team:"Raimon GO Chrono Stone",role:"DEL",rating:94,techName:"ESPADA MORTAL",techType:"TIRO",emoji:"🐉"},
  {id:"chrono-alpha",name:"Alpha",team:"Protocolo Omega",role:"DEL",rating:91,techName:"SUPERNOVA",techType:"TIRO",emoji:"🌀"},
  {id:"chrono-beta",name:"Beta",team:"Protocolo Omega",role:"MC",rating:89,techName:"GRAVEDAD",techType:"REGATE",emoji:"🔮"},
  {id:"go-samguk",name:"Samguk Han",team:"Raimon GO",role:"POR",rating:86,techName:"MANO DEL VACÍO",techType:"PARADA",emoji:"🧤"},
  {id:"go-wanli",name:"Wanli Changcheng",team:"Raimon GO",role:"DEF",rating:85,techName:"MURO DE ACERO",techType:"DEFENSA",emoji:"🧱"},
  {id:"go-michael",name:"Michael Ballzack",team:"Raimon GO",role:"DEF",rating:84,techName:"BLOQUEO DOBLE",techType:"DEFENSA",emoji:"🛡️"},
  {id:"go-eugene",name:"Eugene Peabody",team:"Raimon GO",role:"DEF",rating:83,techName:"BARRERA DEFENSIVA",techType:"DEFENSA",emoji:"🛡️"},
  {id:"go-shunsuke",name:"Shunsuke Aoyama",team:"Raimon GO",role:"MC",rating:82,techName:"REGATE GIRATORIO",techType:"REGATE",emoji:"⚽"},
  {id:"go-ryoma",name:"Ryoma Nishiki",team:"Raimon GO",role:"DEL",rating:88,techName:"TIRO DEL ÁGUILA",techType:"TIRO",emoji:"🦅"},
  {id:"go-hikaru",name:"Hikaru Kageyama",team:"Raimon GO",role:"DEL",rating:84,techName:"TIRO FANTASMA",techType:"TIRO",emoji:"🌑"},
  {id:"go-kariya",name:"Masaki Kariya",team:"Raimon GO",role:"DEF",rating:85,techName:"DESLIZAMIENTO CORTANTE",techType:"DEFENSA",emoji:"🌀"},
  {id:"go-kirino",name:"Ranmaru Kirino",team:"Raimon GO",role:"DEF",rating:88,techName:"BLOQUEO DEL BOSQUE",techType:"DEFENSA",emoji:"🌸"},
  {id:"chrono-tezcat",name:"Tezcat",team:"Raimon GO Chrono Stone",role:"DEL",rating:94,techName:"ESPADA MORTAL",techType:"TIRO",emoji:"🐆"},
  {id:"chrono-wonder",name:"Wonderbot",team:"Raimon GO Chrono Stone",role:"MC",rating:80,techName:"CONTROL MENTAL",techType:"REGATE",emoji:"🤖"},
  {id:"chrono-claire",name:"Claire Lesnow",team:"Raimon GO Chrono Stone",role:"MC",rating:86,techName:"ESPEJISMO HELADO",techType:"REGATE",emoji:"❄️"},
  {id:"alius-grent",name:"Grent",team:"Alius Academy",role:"DEL",rating:87,techName:"COMETA OSCURO",techType:"TIRO",emoji:"🌌"},
  {id:"alius-wittz",name:"Wittz",team:"Alius Academy",role:"MC",rating:84,techName:"GRAVEDAD",techType:"REGATE",emoji:"🪐"},
  {id:"alius-clear",name:"Clear",team:"Alius Academy",role:"POR",rating:86,techName:"MANO DEL VACÍO",techType:"PARADA",emoji:"🧤"},
  {id:"alius-metron",name:"Metron",team:"Alius Academy",role:"DEF",rating:84,techName:"PRISIÓN DE HIELO",techType:"DEFENSA",emoji:"🧊"},
  // GO Galaxy: Earth Eleven y sus figuras más conocidas.
  {id:"galaxy-matatagi",name:"Hayato Matatagi",team:"Earth Eleven (Galaxy)",role:"DEL",rating:94,techName:"TIRO DEL HALCÓN",techType:"TIRO",techniques:[{name:"Tiro del Halcón",type:"TIRO"},{name:"Viento Fugaz",type:"REGATE"}],emoji:"🦅"},
  {id:"galaxy-ibuki",name:"Munemasa Ibuki",team:"Earth Eleven (Galaxy)",role:"POR",rating:93,techName:"PARADA ARDIENTE",techType:"PARADA",techniques:[{name:"Parada Ardiente",type:"PARADA"},{name:"Manos Infinitas",type:"PARADA"}],emoji:"🧤"},
  {id:"galaxy-tetsukado",name:"Shin Tetsukado",team:"Earth Eleven (Galaxy)",role:"DEF",rating:90,techName:"PUÑO DE HIERRO",techType:"DEFENSA",techniques:[{name:"Puño de Hierro",type:"DEFENSA"},{name:"Bloqueo de Acero",type:"DEFENSA"}],emoji:"🥊"},
  {id:"galaxy-kusaka",name:"Ryuuji Kusaka",team:"Earth Eleven (Galaxy)",role:"MC",rating:89,techName:"GRITO SALVAJE",techType:"REGATE",techniques:[{name:"Grito Salvaje",type:"REGATE"},{name:"Remate Salvaje",type:"TIRO"}],emoji:"🐻"},
  {id:"galaxy-sakura",name:"Nozaki Sakura",team:"Earth Eleven (Galaxy)",role:"MC",rating:88,techName:"DANZA DE PÉTALOS",techType:"REGATE",emoji:"🌸"},
  {id:"galaxy-konoha",name:"Morimura Konoha",team:"Earth Eleven (Galaxy)",role:"DEF",rating:87,techName:"RAÍCES ENREDADAS",techType:"DEFENSA",emoji:"🌿"},
  {id:"galaxy-minaho",name:"Kazuto Minaho",team:"Earth Eleven (Galaxy)",role:"DEF",rating:89,techName:"TRAMPA MAGNÉTICA",techType:"DEFENSA",emoji:"🧲"},
  {id:"galaxy-manabe",name:"Jinichirou Manabe",team:"Earth Eleven (Galaxy)",role:"MC",rating:88,techName:"CÁLCULO PERFECTO",techType:"REGATE",emoji:"📐"},
  {id:"galaxy-kuroiwa",name:"Ryuusei Kuroiwa",team:"Earth Eleven (Galaxy)",role:"DEF",rating:92,techName:"MURO DE SOMBRA",techType:"DEFENSA",emoji:"🌑"},
  // Ares: Inakuni Raimon, Seishou y Outei Tsukinomiya.
  {id:"ares-asuto",name:"Asuto Inamori",team:"Inakuni Raimon (Ares)",role:"DEL",rating:92,techName:"CHUT AL ROJO VIVO",techType:"TIRO",techniques:[{name:"Chut al Rojo Vivo",type:"TIRO"},{name:"Ímpetu de Dragón",type:"TIRO"}],emoji:"🔥"},
  {id:"ares-haizaki",name:"Ryouhei Haizaki",team:"Seishou Gakuen (Ares)",role:"DEL",rating:95,techName:"PINGÜINO PERFECTO",techType:"TIRO",techniques:[{name:"Pingüino Perfecto",type:"TIRO"},{name:"Chilena de Pingüino",type:"TIRO"}],emoji:"🐧"},
  {id:"ares-nosaka",name:"Yuuma Nosaka",team:"Outei Tsukinomiya (Ares)",role:"MC",rating:95,techName:"OMNISABIDURÍA DIVINA",techType:"REGATE",techniques:[{name:"Omnisabiduría Divina",type:"REGATE"},{name:"Tiro Meteórico",type:"TIRO"}],emoji:"♟️"},
  {id:"ares-nishikage",name:"Seiya Nishikage",team:"Outei Tsukinomiya (Ares)",role:"POR",rating:92,techName:"PARADA PELIAGUDA",techType:"PARADA",emoji:"🧤"},
  {id:"ares-kozoumaru",name:"Kozoumaru Sasuke",team:"Inakuni Raimon (Ares)",role:"DEL",rating:89,techName:"GRANIZADO DE FUEGO",techType:"TIRO",emoji:"🍖"},
  {id:"ares-goujin",name:"Masatatsu Goujin",team:"Inakuni Raimon (Ares)",role:"DEL",rating:87,techName:"TIRO METEÓRICO",techType:"TIRO",emoji:"☄️"},
  {id:"ares-norika",name:"Norika Umihara",team:"Inakuni Raimon (Ares)",role:"POR",rating:90,techName:"MANO OCEÁNICA",techType:"PARADA",emoji:"🌊"},
  {id:"ares-hiura",name:"Kirina Hiura",team:"Inakuni Raimon (Ares)",role:"MC",rating:88,techName:"FRENTE FRÍO",techType:"REGATE",emoji:"❄️"},
  {id:"ares-mizukamiya",name:"Seiryuu Mizukamiya",team:"Seishou Gakuen (Ares)",role:"DEF",rating:91,techName:"LANZA POLAR",techType:"DEFENSA",emoji:"🧊"},
  {id:"ares-aphrodi",name:"Terumi Aphrodi",team:"Instituto Zeus (Ares)",role:"DEL",rating:94,techName:"SABIDURÍA DIVINA",techType:"TIRO",emoji:"✨"},
  {id:"ares-fubuki",name:"Atsuya Fubuki",team:"Hakuren (Ares)",role:"DEL",rating:92,techName:"VENTISCA TRIPLE",techType:"TIRO",emoji:"❄️"},
  {id:"ares-hiroto",name:"Kiyama Hiroto",team:"Inakuni Raimon (Ares)",role:"DEL",rating:93,techName:"RAYO DE DIAMANTES",techType:"TIRO",emoji:"💎"},
  {id:"ares-clario",name:"Clario Orvan",team:"Barcelona Orb",role:"DEL",rating:94,techName:"VICTORIA TRICOLOR",techType:"TIRO",emoji:"🇪🇸"},
  // Orion: selección Inazuma Japón y rivales internacionales.
  {id:"orion-froy",name:"Froy Girikanan",team:"Perfect Spark (Orion)",role:"DEL",rating:96,techName:"LANZA GÉLIDA",techType:"TIRO",emoji:"🧊"},
  {id:"orion-ichihoshi",name:"Mitsuhiro Ichihoshi",team:"Inazuma Japón (Orion)",role:"MC",rating:93,techName:"DIMENSIÓN KAMAKURA",techType:"REGATE",emoji:"🌌"},
  {id:"orion-bernard",name:"Bernard Girikanan",team:"Perfect Spark (Orion)",role:"MC",rating:94,techName:"BÚNKER",techType:"DEFENSA",emoji:"🛡️"},
  {id:"orion-zhao",name:"Zhao Jinyun",team:"Inazuma Japón (Orion)",role:"DEL",rating:92,techName:"LEÓN DEVORADOR",techType:"TIRO",emoji:"🦁"},
  {id:"orion-lihao",name:"Li Hao",team:"Inazuma Japón (Orion)",role:"MC",rating:90,techName:"HURACÁN MÚLTIPLE",techType:"REGATE",emoji:"🌪️"},
  {id:"orion-clario",name:"Clario Orvan",team:"Guardianes de la Reina",role:"DEL",rating:95,techName:"HOJA DIAMANTINA",techType:"TIRO",emoji:"💠"},
  {id:"orion-bellatrix",name:"Bellatrix",team:"Guardianes de la Reina",role:"DEL",rating:92,techName:"CHUT VITRAL",techType:"TIRO",emoji:"🔮"},
  {id:"orion-adam",name:"Adam Sanchi",team:"Italia (Orion)",role:"POR",rating:91,techName:"BRAZO DE DIAMANTE",techType:"PARADA",emoji:"💎"},
  {id:"orion-alex",name:"Alex Hawk",team:"Estados Unidos (Orion)",role:"DEL",rating:91,techName:"BALA DE CAÑÓN",techType:"TIRO",emoji:"🏈"},
  {id:"orion-aphrodi",name:"Terumi Aphrodi",team:"Inazuma Japón (Orion)",role:"DEL",rating:94,techName:"MANO CELESTIAL DE LA AMISTAD",techType:"TIRO",emoji:"👼"},
  {id:"orion-fubuki",name:"Shirou Fubuki",team:"Inazuma Japón (Orion)",role:"DEF",rating:94,techName:"HOJA DIAMANTINA",techType:"DEFENSA",emoji:"🐺"},
  {id:"orion-gouenji",name:"Shuuya Gouenji",team:"Inazuma Japón (Orion)",role:"DEL",rating:96,techName:"GRANIZADO DE FUEGO ALTO",techType:"TIRO",emoji:"🔥"},
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
    RARO: [{ name: "Colmillo de Pantera", type: "PARADA" }],
    ÉPICO: [{ name: "Colmillo de Pantera", type: "PARADA" }],
    LEGENDARIO: [{ name: "Colmillo de Pantera", type: "PARADA" }],
    MÍTICO: [{ name: "Colmillo de Pantera", type: "PARADA" }]
  },
  "Mark Evans": {
    COMÚN: [{ name: "Mano Celestial", type: "PARADA" }],
    RARO: [{ name: "Mano Celestial", type: "PARADA" }],
    ÉPICO: [{ name: "Superpuño Invencible", type: "PARADA" }],
    LEGENDARIO: [{ name: "Parada Celestial", type: "PARADA" }],
    MÍTICO: [{ name: "Mano Celestial V", type: "PARADA" }]
  },
  "Lancer": {
    COMÚN: [{ name: "Lanza Letal", type: "TIRO" }],
    RARO: [{ name: "Lanza Letal", type: "TIRO" }, { name: "Mangual Letal", type: "TIRO" }],
    ÉPICO: [{ name: "Lanza Letal", type: "TIRO" }, { name: "Mangual Letal", type: "TIRO" }],
    LEGENDARIO: [{ name: "Lanza Letal", type: "TIRO" }, { name: "Mangual Letal", type: "TIRO" }],
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
"Celia Hills": "celia.webp", 
"Silvia Woods": "nelly.webp", 
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
"Shadow Cimmerian": "shadow.webp", 
"Aiden Froste": "aiden.webp", 
"Austin Hobbes": "austin.webp", 
"Edgar Partinus": "edgar.webp", 
"Hector Helio": "helio.webp", 
"Paolo Bianchi": "paolo.webp", 
"William Glass": "willy.webp", 
"Hidetoshi Nakata": "nakata.webp", 
"Baddap Sleed": "Desuta.webp", 
"Canon Evans": "canon.webp", 
"David Quagmire": "quagmire.webp", 
"Lancer": "lancer.webp", 
"Thomas Feldt": "feldt.webp", 
"Arion Sherwind": "arion.webp", 
"Victor Blade": "Tvictor.webp", 
"Riccardo Di Rigo": "ricardo.webp", 
"Fei Rune": "fei.webp", 
"Goldie Lemmon": "Kisaragi_Mako.webp", 
"Zanark Avalonic": "zanark.webp", 
"Alpha": "alpha.webp", 
"Beta": "beta.webp", 
"Michael Ballzack": "ballzack.webp", 
"Eugene Peabody": "Hamano_Kaiji.webp", 
"Shunsuke Aoyama": "Hattori_Hanta.webp", 
"Ryoma Nishiki": "Tsunami_Jousuke.webp", 
"Hikaru Kageyama": "Kageyama_Hikaru.webp", 
"Masaki Kariya": "Kurama_Norihito.webp", 
"Ranmaru Kirino": "Shiratoya_Nae_.webp", 
"Tezcat": "Bitway_Ozrock.webp", 
"Wonderbot": "Clark_Wonderbot.webp", 
"Claire Lesnow": "Gazel.webp", 
"Gamma": "gamma.webp", 
"Shuuya Gouenji": "gouenji.webp"};
DATABASE.forEach(player => {
  const supplied = CHARACTER_IMAGE_FILES[player.name];
  // Solo se asignan las imágenes WEBP aportadas por el usuario.
  // Si no hay WEBP para un personaje, se deja null y se usa el dibujo/emoji de respaldo.
  player.image = supplied ? `assets/players/new/${supplied}` : null;
});
