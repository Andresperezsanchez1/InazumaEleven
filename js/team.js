
"use strict";

/* ==========================================
   INAZUMA SD - GESTIÓN DE PLANTILLA
   ========================================== */

// Jugadores iniciales
let ownedPlayerIds = [...STARTER_IDS];

// Cinco titulares iniciales
let startingTeam = [...STARTER_IDS];

/* ==========================================
   AÑADIR JUGADOR AL EQUIPO
   ========================================== */

function addToTeam(id) {
    if (!ownedPlayerIds.includes(id)) {
        return "No tienes este jugador.";
    }

    if (startingTeam.includes(id)) {
        return "Ya está en tu equipo.";
    }

    if (startingTeam.length >= 5) {
        return "Tu equipo ya tiene cinco jugadores.";
    }

    startingTeam.push(id);

    return "Jugador añadido.";
}

/* ==========================================
   RETIRAR JUGADOR DEL EQUIPO
   ========================================== */

function removeFromTeam(id) {
    if (!startingTeam.includes(id)) {
        return "Este jugador no está en tu equipo.";
    }

    if (startingTeam.length <= 1) {
        return "Necesitas mantener al menos un jugador.";
    }

    startingTeam = startingTeam.filter(
        playerId => playerId !== id
    );

    return "Jugador retirado.";
}

/* ==========================================
   CAMBIAR TITULAR
   ========================================== */

function replaceTeamPlayer(oldId, newId) {
    if (!startingTeam.includes(oldId)) {
        return "El jugador que quieres sustituir no está en el equipo.";
    }

    if (!ownedPlayerIds.includes(newId)) {
        return "No tienes al nuevo jugador.";
    }

    if (startingTeam.includes(newId)) {
        return "Ese jugador ya es titular.";
    }

    const index = startingTeam.indexOf(oldId);

    startingTeam[index] = newId;

    return "Titular sustituido correctamente.";
}

/* ==========================================
   ACTIVAR O DESACTIVAR TITULAR
   ========================================== */

function toggleTeamPlayer(id) {
    return startingTeam.includes(id)
        ? removeFromTeam(id)
        : addToTeam(id);
}

/* ==========================================
   OBTENER TITULARES
   ========================================== */

function getStartingPlayers() {
    return startingTeam
        .map(id => PLAYER_BY_ID(id))
        .filter(Boolean);
}

/* ==========================================
   OBTENER PLANTILLA COMPLETA
   ========================================== */

function getOwnedPlayers() {
    return ownedPlayerIds
        .map(id => PLAYER_BY_ID(id))
        .filter(Boolean);
}

/* ==========================================
   COMPROBAR SI TIENES UN JUGADOR
   ========================================== */

function ownsPlayer(id) {
    return ownedPlayerIds.includes(id);
}

/* ==========================================
   VALOR DE VENTA
   ========================================== */

function playerSaleValue(player) {
    if (!player) return 0;

    const rating = Number(player.rating) || 0;

    if (rating >= 90) return 1000;
    if (rating >= 86) return 500;
    if (rating >= 81) return 350;
    if (rating >= 76) return 250;
    if (rating >= 71) return 150;

    return 75;
}

/* ==========================================
   VENDER JUGADOR
   ========================================== */

function sellPlayer(id) {
    if (!ownedPlayerIds.includes(id)) {
        return {
            ok: false,
            message: "No tienes este jugador."
        };
    }

    if (startingTeam.includes(id)) {
        return {
            ok: false,
            message: "No puedes vender a un jugador titular."
        };
    }

    if (ownedPlayerIds.length <= 5) {
        return {
            ok: false,
            message: "Debes conservar al menos cinco jugadores."
        };
    }

    const player = PLAYER_BY_ID(id);

    if (!player) {
        return {
            ok: false,
            message: "Jugador no encontrado."
        };
    }

    const value = playerSaleValue(player);

    ownedPlayerIds = ownedPlayerIds.filter(
        playerId => playerId !== id
    );

    coins += value;

    if (typeof updateResources === "function") {
        updateResources();
    }

    return {
        ok: true,
        player,
        value,
        message: `Has vendido a ${player.name} por ${value} monedas.`
    };
}

/* ==========================================
   COMPRAR / INCORPORAR JUGADOR
   ========================================== */

function addOwnedPlayer(id) {
    if (!PLAYER_BY_ID(id)) {
        return {
            ok: false,
            message: "Jugador no encontrado."
        };
    }

    if (ownsPlayer(id)) {
        return {
            ok: false,
            message: "Ya tienes este jugador."
        };
    }

    ownedPlayerIds.push(id);

    if (typeof updateResources === "function") {
        updateResources();
    }

    return {
        ok: true,
        message: "Jugador incorporado a tu plantilla."
    };
}

/* ==========================================
   ESTADÍSTICAS DE PLANTILLA
   ========================================== */

function getTeamAverageRating() {
    const players = getStartingPlayers();

    if (!players.length) return 0;

    const total = players.reduce(
        (sum, player) => sum + player.rating,
        0
    );

    return Math.round(total / players.length);
}

function getOwnedAverageRating() {
    const players = getOwnedPlayers();

    if (!players.length) return 0;

    const total = players.reduce(
        (sum, player) => sum + player.rating,
        0
    );

    return Math.round(total / players.length);
}

/* ==========================================
   REINICIAR PLANTILLA
   ========================================== */

function resetTeam() {
    ownedPlayerIds = [...STARTER_IDS];
    startingTeam = [...STARTER_IDS];

    if (typeof updateResources === "function") {
        updateResources();
    }

    if (typeof renderTeamScreen === "function") {
        renderTeamScreen();
    }

    if (typeof renderCollectionScreen === "function") {
        renderCollectionScreen();
    }

    return "Plantilla reiniciada correctamente.";
}
