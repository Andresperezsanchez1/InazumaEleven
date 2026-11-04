
"use strict";

/* ==========================================
   INAZUMA SD - INTERFAZ PRINCIPAL
   ========================================== */

/* ==========================================
   UTILIDADES
   ========================================== */

function getUIElement(id) {
    return document.getElementById(id);
}

function setUIValue(id, value) {
    const element = getUIElement(id);

    if (element) {
        element.textContent = value;
    }
}

/* ==========================================
   CAMBIAR DE PANTALLA
   ========================================== */

function showScreen(name) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.toggle(
            "active",
            screen.id === name
        );
    });

    document.querySelectorAll(".navigation button").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.screen === name
        );
    });

    if (name === "team") {
        renderTeamScreen();
    }

    if (name === "collection") {
        renderCollectionScreen();
    }

    if (name === "transfers") {
        updateResources();
    }

    if (name === "match" && typeof renderGame === "function") {
        renderGame();
    }
}

/* ==========================================
   CERRAR MODAL
   ========================================== */

function closeModal() {
    const modal = getUIElement("modal");

    if (modal) {
        modal.classList.remove("show");
    }
}

/* ==========================================
   MOSTRAR MODAL
   ========================================== */

function showModal(title, message, buttons = []) {
    const modal = getUIElement("modal");

    if (!modal) {
        console.warn("No se encuentra el modal:", title);
        return;
    }

    const titleElement = getUIElement("modalTitle");
    const messageElement = getUIElement("modalText");
    const actions = getUIElement("modalActions");

    if (titleElement) {
        titleElement.textContent = title;
    }

    if (messageElement) {
        messageElement.textContent = message;
    }

    if (!actions) {
        modal.classList.add("show");
        return;
    }

    actions.innerHTML = "";

    buttons.forEach(item => {
        const button = document.createElement("button");

        button.className = item.className || "primary";
        button.textContent = item.label || "Aceptar";

        button.addEventListener("click", () => {
            closeModal();

            if (typeof item.action === "function") {
                item.action();
            }
        });

        actions.appendChild(button);
    });

    modal.classList.add("show");
}

/* ==========================================
   ACTUALIZAR MONEDAS Y RECURSOS
   ========================================== */

function updateResources() {
    setUIValue("coins", coins);
    setUIValue("shopCoins", coins);

    setUIValue("wins", wins);
    setUIValue("homeWins", wins);

    setUIValue("level", level);

    setUIValue(
        "ownedCount",
        ownedPlayerIds.length
    );

    setUIValue(
        "starterCount",
        startingTeam.length + "/5"
    );

    setUIValue(
        "collectionCount",
        ownedPlayerIds.length + " jugadores"
    );

    setUIValue(
        "teamCount",
        startingTeam.length + "/5"
    );
}

/* ==========================================
   CREAR TARJETA DE JUGADOR
   ========================================== */

function createPlayerCard(player, container, mode) {
    if (!player || !container) return;

    const card = document.createElement("article");

    card.className = "player-card";

    const isSelected = startingTeam.includes(player.id);

    if (isSelected) {
        card.classList.add("selected");
    }

    // Valoración
    const rating = document.createElement("span");

    rating.className = "rating";
    rating.textContent = player.rating;

    card.appendChild(rating);

    // Retrato
    const portrait = document.createElement("canvas");

    if (typeof createPlayerPortrait === "function") {
        createPlayerPortrait(player, portrait);
    }

    card.appendChild(portrait);

    // Nombre
    const name = document.createElement("h3");

    name.textContent = player.name;

    card.appendChild(name);

    // Posición
    const position = document.createElement("span");

    position.className = "position";
    position.textContent = player.position;

    card.appendChild(position);

    // Elemento y equipo
    const element = document.createElement("p");

    element.className = "element";

    element.textContent =
        (player.element || "Normal") +
        " · " +
        (player.team || "Sin equipo");

    card.appendChild(element);

    // Supertécnica
    const technique = document.createElement("p");

    technique.className = "technique";
    technique.textContent = player.technique || "Sin técnica";

    card.appendChild(technique);

    /* --------------------------------------
       BOTONES DEL EQUIPO
       -------------------------------------- */

    if (mode === "team") {
        const button = document.createElement("button");

        button.textContent = isSelected
            ? "Quitar"
            : "Añadir";

        button.addEventListener("click", () => {
            const result = toggleTeamPlayer(player.id);

            showModal(
                "Equipo",
                result,
                [{
                    label: "Continuar",
                    action: () => renderTeamScreen()
                }]
            );

            renderTeamScreen();
        });

        card.appendChild(button);
    }

    /* --------------------------------------
       BOTÓN DE VENDER
       -------------------------------------- */

    if (mode === "collection" && !isSelected) {
        const button = document.createElement("button");

        button.textContent = "Vender";

        button.addEventListener("click", () => {
            showModal(
                "Vender jugador",
                `¿Quieres vender a ${player.name}?`,
                [
                    {
                        label: "Cancelar",
                        className: "secondary"
                    },
                    {
                        label: "Vender",
                        action: () => {
                            const result = sellPlayer(player.id);

                            showModal(
                                "Mercado",
                                result.message,
                                [{
                                    label: "Aceptar",
                                    action: () => {
                                        renderCollectionScreen();
                                        updateResources();
                                    }
                                }]
                            );

                            renderCollectionScreen();
                            updateResources();
                        }
                    }
                ]
            );
        });

        card.appendChild(button);
    }

    container.appendChild(card);
}

/* ==========================================
   PANTALLA DE COLECCIÓN
   ========================================== */

function renderCollectionScreen() {
    const container = getUIElement("collectionGrid");

    if (!container) return;

    container.innerHTML = "";

    const players = getOwnedPlayers();

    players.forEach(player => {
        createPlayerCard(
            player,
            container,
            "collection"
        );
    });

    setUIValue(
        "collectionCount",
        players.length + " jugadores"
    );

    updateResources();
}

/* ==========================================
   PANTALLA DE EQUIPO
   ========================================== */

function renderTeamScreen() {
    const slots = getUIElement("teamSlots");
    const available = getUIElement("teamAvailable");

    if (!slots || !available) return;

    slots.innerHTML = "";
    available.innerHTML = "";

    // Cinco posiciones titulares
    for (let i = 0; i < 5; i++) {
        const id = startingTeam[i];

        const slot = document.createElement("div");

        slot.className = "team-slot";

        if (id) {
            const player = PLAYER_BY_ID(id);

            if (player) {
                slot.textContent =
                    player.name +
                    " · " +
                    player.position;
            } else {
                slot.textContent = "Jugador no encontrado";
            }
        } else {
            slot.textContent = "Hueco disponible";
        }

        slots.appendChild(slot);
    }

    // Jugadores disponibles
    const players = getOwnedPlayers();

    players.forEach(player => {
        createPlayerCard(
            player,
            available,
            "team"
        );
    });

    setUIValue(
        "teamCount",
        startingTeam.length + "/5"
    );

    updateResources();
}

/* ==========================================
   NAVEGACIÓN PRINCIPAL
   ========================================== */

function initializeInterfaceNavigation() {
    document.querySelectorAll(".navigation button").forEach(button => {
        if (button.dataset.interfaceConnected) return;

        button.dataset.interfaceConnected = "true";

        button.addEventListener("click", () => {
            showScreen(button.dataset.screen);
        });
    });

    document.querySelectorAll("[data-go]").forEach(button => {
        if (button.dataset.interfaceConnected) return;

        button.dataset.interfaceConnected = "true";

        button.addEventListener("click", () => {
            showScreen(button.dataset.go);
        });
    });
}

/* ==========================================
   INICIALIZACIÓN
   ========================================== */

function initializeInterface() {
    updateResources();

    renderCollectionScreen();
    renderTeamScreen();

    initializeInterfaceNavigation();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeInterface,
        { once: true }
    );
} else {
    initializeInterface();
}
