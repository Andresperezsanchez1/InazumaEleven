
"use strict";

/* ==========================================
   INAZUMA SD - MONEDAS Y SOBRES
   ========================================== */

let coins = 1000;
let wins = 0;
let level = 1;

/* ==========================================
   CONFIGURACIÓN DE SOBRES
   ========================================== */

const PACKS = {
    bronze: {
        price: 100,
        min: 60,
        highChance: 0.04,
        name: "Bronce"
    },

    silver: {
        price: 300,
        min: 74,
        highChance: 0.20,
        name: "Plata"
    },

    gold: {
        price: 700,
        min: 82,
        highChance: 0.35,
        name: "Oro"
    }
};

/* ==========================================
   CONSULTAR PRECIO DE SOBRE
   ========================================== */

function getPackPrice(type) {
    return PACKS[type] ? PACKS[type].price : 0;
}

/* ==========================================
   SELECCIÓN ALEATORIA
   ========================================== */

function randomPlayerFrom(list) {
    if (!list || !list.length) return null;

    const index = Math.floor(Math.random() * list.length);

    return list[index];
}

/* ==========================================
   SELECCIÓN DE JUGADOR PARA SOBRE
   ========================================== */

function selectPackPlayer(pack) {
    if (!Array.isArray(PLAYER_DATA) || !PLAYER_DATA.length) {
        return null;
    }

    const available = PLAYER_DATA.filter(player =>
        Number(player.rating) >= pack.min
    );

    if (!available.length) {
        return null;
    }

    // Probabilidad de conseguir un jugador especial
    const highRoll = Math.random() < pack.highChance;

    let candidates;

    if (highRoll) {
        // Jugadores de valoración alta
        candidates = available.filter(player =>
            Number(player.rating) >= pack.min + 8
        );
    } else {
        // Jugadores normales
        candidates = available.filter(player =>
            player.kind !== "icon" &&
            player.kind !== "legend" &&
            player.kind !== "hero"
        );
    }

    // Si no hay candidatos de esa categoría,
    // se utiliza la lista disponible.
    if (!candidates.length) {
        candidates = available;
    }

    return randomPlayerFrom(candidates);
}

/* ==========================================
   ABRIR SOBRE
   ========================================== */

function openPack(type) {
    const pack = PACKS[type];

    if (!pack) {
        return {
            ok: false,
            message: "Sobre desconocido."
        };
    }

    if (typeof PLAYER_DATA === "undefined" ||
        !Array.isArray(PLAYER_DATA) ||
        PLAYER_DATA.length === 0) {
        return {
            ok: false,
            message: "No hay jugadores disponibles."
        };
    }

    if (coins < pack.price) {
        return {
            ok: false,
            message: "No tienes monedas suficientes."
        };
    }

    const player = selectPackPlayer(pack);

    if (!player) {
        return {
            ok: false,
            message: "No hay jugadores disponibles para este sobre."
        };
    }

    // Cobrar únicamente cuando se ha encontrado un jugador
    coins -= pack.price;

    // Comprobar duplicado
    if (ownedPlayerIds.includes(player.id)) {
        const value = playerSaleValue(player);

        coins += value;

        if (typeof updateResources === "function") {
            updateResources();
        }

        return {
            ok: true,
            duplicate: true,
            player,
            reward: value,
            message:
                `¡Duplicado! ${player.name} se ha vendido automáticamente por ${value} monedas.`
        };
    }

    // Incorporar nuevo jugador a la plantilla
    ownedPlayerIds.push(player.id);

    if (typeof updateResources === "function") {
        updateResources();
    }

    if (typeof renderCollectionScreen === "function") {
        renderCollectionScreen();
    }

    return {
        ok: true,
        duplicate: false,
        player,
        reward: 0,
        message:
            `¡Nuevo fichaje! Has conseguido a ${player.name}.`
    };
}

/* ==========================================
   INFORMACIÓN DE SOBRES
   ========================================== */

function getPackInfo(type) {
    const pack = PACKS[type];

    if (!pack) return null;

    return {
        name: pack.name,
        price: pack.price,
        minimumRating: pack.min,
        highChance: pack.highChance
    };
}

/* ==========================================
   PROGRESO Y RECOMPENSAS
   ========================================== */

function addCoins(amount) {
    amount = Number(amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        return false;
    }

    coins += Math.floor(amount);

    if (typeof updateResources === "function") {
        updateResources();
    }

    return true;
}

function addWin() {
    wins++;
    level = Math.floor(wins / 5) + 1;

    if (typeof updateResources === "function") {
        updateResources();
    }
}
