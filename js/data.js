
"use strict";

/* ==========================================
   INAZUMA SD - BASE DE DATOS DE JUGADORES
   ========================================== */

const PLAYER_DATA = [

    // RAIMON - PRIMERA GENERACIÓN

    {
        id: 1,
        name: "Mark Evans",
        position: "POR",
        rating: 88,
        element: "Tierra",
        color: "#e7a928",
        hair: "#493024",
        skin: "#efbd91",
        team: "Raimon",
        technique: "Mano Celestial",
        kind: "normal"
    },

    {
        id: 2,
        name: "Axel Blaze",
        position: "DEL",
        rating: 89,
        element: "Fuego",
        color: "#e9a82b",
        hair: "#eee9e0",
        skin: "#edbd96",
        team: "Raimon",
        technique: "Tornado de Fuego",
        kind: "normal"
    },

    {
        id: 3,
        name: "Jude Sharp",
        position: "MC",
        rating: 87,
        element: "Bosque",
        color: "#e9a82b",
        hair: "#392c37",
        skin: "#e8b998",
        team: "Raimon",
        technique: "Pingüino Emperador",
        kind: "normal"
    },

    {
        id: 4,
        name: "Jack Wallside",
        position: "DEF",
        rating: 82,
        element: "Tierra",
        color: "#e9a82b",
        hair: "#8b5838",
        skin: "#d9a57e",
        team: "Raimon",
        technique: "Muralla Infinita",
        kind: "normal"
    },

    {
        id: 5,
        name: "Nathan Swift",
        position: "DEF",
        rating: 84,
        element: "Viento",
        color: "#e9a82b",
        hair: "#8ac4dd",
        skin: "#edc39e",
        team: "Raimon",
        technique: "Viento Huracanado",
        kind: "normal"
    },

    {
        id: 6,
        name: "Kevin Dragonfly",
        position: "DEL",
        rating: 80,
        element: "Fuego",
        color: "#d74b43",
        hair: "#b83b2c",
        skin: "#e9b58d",
        team: "Raimon",
        technique: "Dragón",
        kind: "normal"
    },

    {
        id: 7,
        name: "Shawn Froste",
        position: "DEL",
        rating: 91,
        element: "Viento",
        color: "#d9f4ff",
        hair: "#e4edf2",
        skin: "#f0c7a4",
        team: "Raimon",
        technique: "Ventisca Eterna",
        kind: "special"
    },

    {
        id: 8,
        name: "Erik Eagle",
        position: "MC",
        rating: 83,
        element: "Bosque",
        color: "#3c9d65",
        hair: "#a26d42",
        skin: "#eac09b",
        team: "Raimon",
        technique: "Fénix",
        kind: "normal"
    },

    {
        id: 9,
        name: "Bobby Shearer",
        position: "DEF",
        rating: 78,
        element: "Tierra",
        color: "#3988cf",
        hair: "#61462f",
        skin: "#e8bd9b",
        team: "Raimon",
        technique: "Bloqueo",
        kind: "normal"
    },

    {
        id: 10,
        name: "Silvia Woods",
        position: "MC",
        rating: 77,
        element: "Bosque",
        color: "#df7aa8",
        hair: "#d8a34c",
        skin: "#edc29f",
        team: "Raimon",
        technique: "Impulso",
        kind: "normal"
    },

    // RAIMON - INAZUMA ELEVEN GO

    {
        id: 11,
        name: "Arion Sherwind",
        position: "MC",
        rating: 90,
        element: "Viento",
        color: "#e9a82b",
        hair: "#6d482e",
        skin: "#eabd98",
        team: "Raimon",
        technique: "Tornado de viento",
        kind: "special"
    },

    {
        id: 12,
        name: "Victor Blade",
        position: "DEL",
        rating: 92,
        element: "Fuego",
        color: "#e9a82b",
        hair: "#27314c",
        skin: "#e7b796",
        team: "Raimon",
        technique: "Espada Mortal",
        kind: "special"
    },

    {
        id: 13,
        name: "Riccardo Di Rigo",
        position: "MC",
        rating: 89,
        element: "Bosque",
        color: "#e9a82b",
        hair: "#20243b",
        skin: "#e8bd9d",
        team: "Raimon",
        technique: "奏者 Maestro",
        kind: "special"
    },

    {
        id: 14,
        name: "Gabriel Garcia",
        position: "DEF",
        rating: 86,
        element: "Viento",
        color: "#e9a82b",
        hair: "#a8d6ec",
        skin: "#edc39e",
        team: "Raimon",
        technique: "Viento protector",
        kind: "normal"
    },

    {
        id: 15,
        name: "Goldie Lemmon",
        position: "MC",
        rating: 85,
        element: "Bosque",
        color: "#e9a82b",
        hair: "#e8a84a",
        skin: "#f0c6a4",
        team: "Raimon",
        technique: "Corazón alegre",
        kind: "normal"
    },

    // ROYAL ACADEMY

    {
        id: 16,
        name: "David Samford",
        position: "DEL",
        rating: 88,
        element: "Bosque",
        color: "#8c73bd",
        hair: "#574b72",
        skin: "#e8bd9d",
        team: "Royal",
        technique: "Disparo espectral",
        kind: "special"
    },

    {
        id: 17,
        name: "Joseph King",
        position: "POR",
        rating: 86,
        element: "Tierra",
        color: "#8c73bd",
        hair: "#a1a0aa",
        skin: "#e9c3a2",
        team: "Royal",
        technique: "Mano Fantasma",
        kind: "special"
    },

    // ALIUS ACADEMY

    {
        id: 18,
        name: "Reize",
        position: "DEL",
        rating: 90,
        element: "Fuego",
        color: "#bd5666",
        hair: "#b85b72",
        skin: "#e9bb98",
        team: "Alius",
        technique: "Meteorito",
        kind: "special"
    },

    {
        id: 20,
        name: "Burn",
        position: "DEL",
        rating: 88,
        element: "Fuego",
        color: "#d75a3b",
        hair: "#e0a35e",
        skin: "#e9bd98",
        team: "Alius",
        technique: "Llama Explosiva",
        kind: "special"
    },

    // ZEUS

    {
        id: 19,
        name: "Aphrodi",
        position: "DEL",
        rating: 94,
        element: "Viento",
        color: "#d4c7ed",
        hair: "#f0e6db",
        skin: "#f0c6a5",
        team: "Zeus",
        technique: "Caída Divina",
        kind: "legend"
    }

];


/* ==========================================
   BASE DE DATOS DE TÉCNICAS
   ========================================== */

const TECHNIQUE_DATA = {

    "Mano Celestial": {
        element: "light",
        type: "save"
    },

    "Tornado de Fuego": {
        element: "fire",
        type: "shot"
    },

    "Pingüino Emperador": {
        element: "dark",
        type: "shot"
    },

    "Muralla Infinita": {
        element: "earth",
        type: "block"
    },

    "Viento Huracanado": {
        element: "wind",
        type: "dribble"
    },

    "Dragón": {
        element: "fire",
        type: "shot"
    },

    "Ventisca Eterna": {
        element: "ice",
        type: "shot"
    },

    "Fénix": {
        element: "fire",
        type: "shot"
    },

    "Bloqueo": {
        element: "earth",
        type: "block"
    },

    "Impulso": {
        element: "wind",
        type: "dribble"
    },

    "Tornado de viento": {
        element: "wind",
        type: "shot"
    },

    "Espada Mortal": {
        element: "dark",
        type: "shot"
    },

    "奏者 Maestro": {
        element: "light",
        type: "dribble"
    },

    "Viento protector": {
        element: "wind",
        type: "block"
    },

    "Corazón alegre": {
        element: "light",
        type: "dribble"
    },

    "Disparo espectral": {
        element: "dark",
        type: "shot"
    },

    "Mano Fantasma": {
        element: "dark",
        type: "save"
    },

    "Meteorito": {
        element: "fire",
        type: "shot"
    },

    "Caída Divina": {
        element: "light",
        type: "shot"
    },

    "Llama Explosiva": {
        element: "fire",
        type: "shot"
    }

};


/* ==========================================
   JUGADORES INICIALES
   ========================================== */

const STARTER_IDS = [1, 2, 3, 4, 5];


/* ==========================================
   BUSCAR JUGADOR POR IDENTIFICADOR
   ========================================== */

const PLAYER_BY_ID = id => {
    return PLAYER_DATA.find(player => player.id === Number(id)) || null;
};


/* ==========================================
   BUSCAR JUGADORES POR POSICIÓN
   ========================================== */

function getPlayersByPosition(position) {
    return PLAYER_DATA.filter(
        player => player.position === position
    );
}


/* ==========================================
   BUSCAR TÉCNICA DE UN JUGADOR
   ========================================== */

function getPlayerTechnique(player) {
    if (!player) return null;

    return TECHNIQUE_DATA[player.technique] || null;
}


/* ==========================================
   NOMBRE DEL TIPO DE CARTA
   ========================================== */

function getPlayerKindLabel(kind) {
    const labels = {
        normal: "Normal",
        special: "Especial",
        hero: "Héroe",
        legend: "Leyenda",
        icon: "Icono"
    };

    return labels[kind] || "Normal";
}
