
"use strict";

/* ==========================================
   INAZUMA SD - SISTEMA DE PARTIDOS
   ========================================== */

const canvas = document.getElementById("pitch");
const ctx = canvas ? canvas.getContext("2d") : null;

let homePlayers = [];
let awayPlayers = [];

let ball = { x: 450, y: 280, vx: 0, vy: 0 };

let selectedPlayer = null;
let dragging = false;
let aim = { x: 0, y: 0 };

let playerTurn = true;
let matchActive = false;
let matchSeconds = 180;

let homeScore = 0;
let awayScore = 0;

let gameAnimation = null;
let aiTimer = null;
let matchClockTimer = null;
let goalInProgress = false;

/* ==========================================
   UTILIDADES
   ========================================== */

function getElement(id) {
    return document.getElementById(id);
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function randomSort(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

function makeMatchPlayer(data, team, x, y) {
    return {
        data,
        team,
        x,
        y,
        vx: 0,
        vy: 0
    };
}

function stopMatchTimers() {
    clearTimeout(aiTimer);
    aiTimer = null;

    clearInterval(matchClockTimer);
    matchClockTimer = null;
}

/* ==========================================
   PREPARAR PARTIDO
   ========================================== */

function setupGame() {
    if (!ctx) {
        console.error("No se encuentra el canvas pitch.");
        return;
    }

    stopMatchTimers();

    homePlayers = [];
    awayPlayers = [];

    goalInProgress = false;

    const homePositions = [
        [95, 280],
        [260, 155],
        [260, 405],
        [390, 190],
        [390, 370]
    ];

    const awayPositions = [
        [805, 280],
        [640, 155],
        [640, 405],
        [510, 190],
        [510, 370]
    ];

    const chosen = getStartingPlayers();

    chosen.slice(0, 5).forEach((data, i) => {
        const pos = homePositions[i];

        homePlayers.push(
            makeMatchPlayer(data, "home", pos[0], pos[1])
        );
    });

    const opponents = randomSort(
        PLAYER_DATA.filter(p => !startingTeam.includes(p.id))
    ).slice(0, 5);

    opponents.forEach((data, i) => {
        const pos = awayPositions[i];

        awayPlayers.push(
            makeMatchPlayer(data, "away", pos[0], pos[1])
        );
    });

    ball = {
        x: 450,
        y: 280,
        vx: 0,
        vy: 0
    };

    homeScore = 0;
    awayScore = 0;
    matchSeconds = 180;

    playerTurn = true;
    matchActive = true;

    selectedPlayer = null;
    dragging = false;

    if (typeof preloadCharacterSprites === "function") {
        preloadCharacterSprites([
            ...homePlayers.map(p => p.data),
            ...awayPlayers.map(p => p.data)
        ]);
    }

    updateMatchDisplay();
    updateTurnDisplay();
    renderGame();

    startMatchClock();

    if (!gameAnimation) {
        gameLoop();
    }
}

/* ==========================================
   CAMPO DE FÚTBOL
   ========================================== */

function drawPitch() {
    const w = FIELD.width;
    const h = FIELD.height;

    ctx.fillStyle = "#278344";
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 10; i++) {
        ctx.fillStyle =
            i % 2 === 0 ? "#2c914b" : "#26803f";

        ctx.fillRect(i * w / 10, 0, w / 10, h);
    }

    ctx.strokeStyle = "#e9f5e7";
    ctx.lineWidth = 4;

    ctx.strokeRect(5, 5, w - 10, h - 10);

    ctx.beginPath();
    ctx.moveTo(w / 2, 5);
    ctx.lineTo(w / 2, h - 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 70, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "white";

    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeRect(5, 160, 105, 240);
    ctx.strokeRect(w - 110, 160, 105, 240);

    ctx.strokeRect(5, 210, 38, 140);
    ctx.strokeRect(w - 43, 210, 38, 140);

    ctx.fillStyle = "#e8f1f9";

    ctx.fillRect(-5, 220, 13, 120);
    ctx.fillRect(w - 8, 220, 13, 120);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    ctx.strokeRect(0, 220, 30, 120);
    ctx.strokeRect(w - 30, 220, 30, 120);
}

/* ==========================================
   DIBUJAR JUGADORES
   ========================================== */

function drawPlayer(p) {
    if (typeof drawPlayerFigure === "function") {
        drawPlayerFigure(
            ctx,
            p.data,
            p.x,
            p.y,
            FIGURE_RADIUS,
            p === selectedPlayer
        );
    }
}

/* ==========================================
   DIBUJAR BALÓN
   ========================================== */

function drawBall() {
    ctx.save();

    ctx.fillStyle = "#0005";
    ctx.beginPath();
    ctx.ellipse(ball.x + 2, ball.y + 7, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#17253a";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#18283c";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/* ==========================================
   INDICADOR DE LANZAMIENTO
   ========================================== */

function drawAim() {
    if (!dragging || !selectedPlayer) return;

    ctx.save();

    ctx.strokeStyle = "#ffe34d";
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 7]);

    ctx.beginPath();
    ctx.moveTo(selectedPlayer.x, selectedPlayer.y);
    ctx.lineTo(aim.x, aim.y);
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(selectedPlayer.x, selectedPlayer.y, 30, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

/* ==========================================
   RENDERIZAR PARTIDO
   ========================================== */

function renderGame() {
    if (!ctx) return;

    drawPitch();

    awayPlayers.forEach(drawPlayer);
    homePlayers.forEach(drawPlayer);

    drawBall();
    drawAim();

    if (typeof drawTechniqueEffect === "function") {
        drawTechniqueEffect(ctx);
    }
}

/* ==========================================
   ACTUALIZAR FÍSICAS
   ========================================== */

function updateGame() {
    if (!matchActive || goalInProgress) return;

    const players = [...homePlayers, ...awayPlayers];

    if (typeof resolveFieldPhysics === "function") {
        resolveFieldPhysics(players, ball);
    }

    if (typeof isGoal === "function" && isGoal(ball)) {
        registerGoal(
            ball.x > FIELD.width / 2 ? "home" : "away"
        );
    }
}

/* ==========================================
   BUCLE PRINCIPAL
   ========================================== */

function gameLoop() {
    if (matchActive) {
        updateGame();
    }

    renderGame();

    gameAnimation = requestAnimationFrame(gameLoop);
}

/* ==========================================
   POSICIÓN DEL PUNTERO
   ========================================== */

function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) * FIELD.width / rect.width,
        y: (event.clientY - rect.top) * FIELD.height / rect.height
    };
}

/* ==========================================
   SELECCIONAR JUGADOR
   ========================================== */

function selectPlayerAt(pos) {
    let nearest = null;
    let minDistance = Infinity;

    homePlayers.forEach(p => {
        const d = Math.hypot(p.x - pos.x, p.y - pos.y);

        if (d < minDistance) {
            minDistance = d;
            nearest = p;
        }
    });

    return nearest && minDistance < 35 ? nearest : null;
}

/* ==========================================
   CONTROLES TÁCTILES Y RATÓN
   ========================================== */

if (canvas) {
    canvas.addEventListener("pointerdown", event => {
        if (!matchActive || !playerTurn || goalInProgress) return;

        const pos = pointerPosition(event);
        const nearest = selectPlayerAt(pos);

        if (!nearest) return;

        selectedPlayer = nearest;
        dragging = true;
        aim = pos;

        canvas.setPointerCapture(event.pointerId);

        renderGame();
    });

    canvas.addEventListener("pointermove", event => {
        if (!dragging || !selectedPlayer) return;

        aim = pointerPosition(event);
        renderGame();
    });

    canvas.addEventListener("pointerup", event => {
        if (!dragging || !selectedPlayer) return;

        aim = pointerPosition(event);

        const dx = selectedPlayer.x - aim.x;
        const dy = selectedPlayer.y - aim.y;

        const length = Math.hypot(dx, dy);

        if (length > 7) {
            const power = Math.min(length, 140) / 140;
            const angle = Math.atan2(dy, dx);

            const strength =
                (2.5 + power * 8) *
                (0.75 + selectedPlayer.data.rating / 350);

            selectedPlayer.vx = Math.cos(angle) * strength;
            selectedPlayer.vy = Math.sin(angle) * strength;
        }

        dragging = false;
        selectedPlayer = null;

        finishPlayerTurn();
    });

    canvas.addEventListener("pointercancel", () => {
        dragging = false;
        selectedPlayer = null;
        renderGame();
    });
}

/* ==========================================
   FINALIZAR TURNO
   ========================================== */

function finishPlayerTurn() {
    if (!matchActive) return;

    playerTurn = false;
    updateTurnDisplay();

    clearTimeout(aiTimer);

    aiTimer = setTimeout(enemyTurn, 1300);
}

/* ==========================================
   TURNO DE LA IA
   ========================================== */

function enemyTurn() {
    if (!matchActive || goalInProgress) return;

    if (!awayPlayers.length) {
        playerTurn = true;
        updateTurnDisplay();
        return;
    }

    const attacker = awayPlayers.reduce((best, p) =>
        distance(p, ball) < distance(best, ball) ? p : best
    , awayPlayers[0]);

    if (!attacker) return;

    const d = distance(attacker, ball);

    if (d > 45) {
        const angle = Math.atan2(
            ball.y - attacker.y,
            ball.x - attacker.x
        );

        attacker.vx = Math.cos(angle) * 3;
        attacker.vy = Math.sin(angle) * 3;
    }

    clearTimeout(aiTimer);

    aiTimer = setTimeout(() => {
        if (!matchActive) return;

        const angle = Math.atan2(
            280 - ball.y,
            45 - ball.x
        );

        const power = 4 + (attacker.data.rating || 50) / 35;

        ball.vx = Math.cos(angle) * power;
        ball.vy = Math.sin(angle) * power;

        attacker.vx *= 0.4;
        attacker.vy *= 0.4;

        aiTimer = setTimeout(() => {
            if (!matchActive) return;

            playerTurn = true;
            updateTurnDisplay();
        }, 1600);

    }, 900);
}

/* ==========================================
   JUGADOR MÁS CERCANO
   ========================================== */

function nearestHomePlayer() {
    if (!homePlayers.length) return null;

    return homePlayers.reduce((best, p) =>
        distance(p, ball) < distance(best, ball) ? p : best
    , homePlayers[0]);
}

/* ==========================================
   ACCIONES DEL PARTIDO
   ========================================== */

function performAction(action) {
    if (!matchActive || !playerTurn || goalInProgress) return;

    const player = selectedPlayer || nearestHomePlayer();

    if (!player) return;

    if (action === "pass") {
        const receiver = homePlayers
            .filter(p => p !== player)
            .sort((a, b) => distance(a, ball) - distance(b, ball))[0];

        if (receiver) {
            const angle = Math.atan2(
                receiver.y - ball.y,
                receiver.x - ball.x
            );

            ball.vx = Math.cos(angle) * 6;
            ball.vy = Math.sin(angle) * 6;
        }
    }

    if (action === "dribble") {
        const angle = Math.atan2(
            280 - player.y,
            450 - player.x
        );

        player.vx = Math.cos(angle) * 7;
        player.vy = Math.sin(angle) * 7;

        ball.vx = player.vx;
        ball.vy = player.vy;
    }

    if (action === "shoot") {
        const angle = Math.atan2(
            280 - ball.y,
            FIELD.width - 50 - ball.x
        );

        ball.vx = Math.cos(angle) * 9;
        ball.vy = Math.sin(angle) * 9;
    }

    if (action === "tech") {
        if (distance(player, ball) > 100) {
            showModal(
                "Técnica",
                "Acércate al balón para ejecutar tu técnica.",
                [{ label: "Aceptar" }]
            );

            return;
        }

        if (typeof useTechnique === "function") {
            if (!useTechnique(player, ball)) return;
        }
    }

    selectedPlayer = null;
    finishPlayerTurn();
}

/* ==========================================
   BOTONES
   ========================================== */

function connectButton(id, action) {
    const button = getElement(id);

    if (!button || button.dataset.gameConnected) return;

    button.dataset.gameConnected = "true";

    button.addEventListener("click", () => {
        performAction(action);
    });
}

connectButton("passButton", "pass");
connectButton("dribbleButton", "dribble");
connectButton("shootButton", "shoot");
connectButton("techButton", "tech");

/* ==========================================
   MARCADOR
   ========================================== */

function updateMatchDisplay() {
    const home = getElement("homeScore");
    const away = getElement("awayScore");
    const clock = getElement("matchClock");

    if (home) home.textContent = homeScore;
    if (away) away.textContent = awayScore;

    const minutes = Math.floor(matchSeconds / 60);
    const seconds = matchSeconds % 60;

    if (clock) {
        clock.textContent =
            String(minutes).padStart(2, "0") + ":" +
            String(seconds).padStart(2, "0");
    }
}

function updateTurnDisplay() {
    const text = getElement("turnText");

    if (text) {
        text.textContent = playerTurn ? "Tu turno" : "Turno rival";
    }
}

/* ==========================================
   CRONÓMETRO
   ========================================== */

function startMatchClock() {
    clearInterval(matchClockTimer);

    matchClockTimer = setInterval(() => {
        if (!matchActive || goalInProgress) return;

        matchSeconds--;

        updateMatchDisplay();

        if (matchSeconds <= 0) {
            matchSeconds = 0;
            updateMatchDisplay();
            finishMatch();
        }
    }, 1000);
}

/* ==========================================
   GOLES
   ========================================== */

function registerGoal(team) {
    if (!matchActive || goalInProgress) return;

    goalInProgress = true;

    if (team === "home") {
        homeScore++;
    } else {
        awayScore++;
    }

    ball.vx = 0;
    ball.vy = 0;

    updateMatchDisplay();

    const flash = document.createElement("div");

    flash.className = "goal-flash";
    flash.textContent =
        team === "home" ? "¡GOOOOL!" : "¡GOL DEL RIVAL!";

    document.body.appendChild(flash);

    setTimeout(() => {
        flash.remove();

        if (matchActive) resetAfterGoal();
    }, 1450);
}

/* ==========================================
   REINICIO DESPUÉS DEL GOL
   ========================================== */

function resetAfterGoal() {
    homePlayers.forEach((p, i) => {
        p.x = 100 + (i % 2) * 130;
        p.y = 100 + i * 75;
        p.vx = 0;
        p.vy = 0;
    });

    awayPlayers.forEach((p, i) => {
        p.x = 800 - (i % 2) * 130;
        p.y = 100 + i * 75;
        p.vx = 0;
        p.vy = 0;
    });

    ball = {
        x: FIELD.width / 2,
        y: FIELD.height / 2,
        vx: 0,
        vy: 0
    };

    selectedPlayer = null;
    dragging = false;

    playerTurn = true;
    goalInProgress = false;

    updateTurnDisplay();
    renderGame();
}

/* ==========================================
   FINAL DEL PARTIDO
   ========================================== */

function finishMatch() {
    if (!matchActive) return;

    matchActive = false;

    stopMatchTimers();

    goalInProgress = false;

    let reward = 20;
    let message = "Derrota";

    if (homeScore > awayScore) {
        reward = 50;
        message = "¡Victoria!";
        wins++;
    } else if (homeScore === awayScore) {
        reward = 30;
        message = "¡Empate!";
    }

    coins += reward;
    level = 1 + Math.floor(wins / 3);

    if (typeof updateResources === "function") {
        updateResources();
    }

    showModal(
        message,
        `Resultado: ${homeScore} - ${awayScore}. Has ganado ${reward} monedas.`,
        [{
            label: "Volver a jugar",
            action: () => setupGame()
        }]
    );
}

/* ==========================================
   REINICIAR PARTIDO
   ========================================== */

const restartButton = getElement("restartMatch");

if (restartButton && !restartButton.dataset.gameConnected) {
    restartButton.dataset.gameConnected = "true";

    restartButton.addEventListener("click", () => {
        showModal(
            "Reiniciar",
            "¿Quieres empezar el partido de nuevo?",
            [
                {
                    label: "Cancelar",
                    className: "secondary"
                },
                {
                    label: "Reiniciar",
                    action: () => setupGame()
                }
            ]
        );
    });
}

/* ==========================================
   SISTEMA DE SOBRES
   ========================================== */

document.querySelectorAll("[data-pack]").forEach(button => {
    if (button.dataset.gameConnected) return;

    button.dataset.gameConnected = "true";

    button.addEventListener("click", () => {
        const type = button.dataset.pack;
        const pack = PACKS[type];

        if (!pack) return;

        showModal(
            "Comprar sobre",
            `¿Quieres comprar este sobre por ${pack.price} monedas?`,
            [
                {
                    label: "Cancelar",
                    className: "secondary"
                },
                {
                    label: "Comprar",
                    action: () => {
                        const result = openPack(type);

                        updateResources();

                        if (result.ok) {
                            const extra = result.duplicate
                                ? `\nRecompensa: ${result.reward} monedas.`
                                : `\nValoración: ${result.player.rating} · ${result.player.position}`;

                            showModal(
                                result.duplicate
                                    ? "Jugador duplicado"
                                    : "¡Fichaje conseguido!",
                                result.message + extra,
                                [{
                                    label: "Aceptar",
                                    action: () => renderCollectionScreen()
                                }]
                            );
                        } else {
                            showModal(
                                "No se pudo comprar",
                                result.message,
                                [{ label: "Aceptar" }]
                            );
                        }
                    }
                }
            ]
        );
    });
});

/* ==========================================
   INICIALIZACIÓN
   ========================================== */

function initializeInazumaGame() {
    if (!ctx) {
        console.error("No se encuentra el campo de juego.");
        return;
    }

    if (typeof updateResources === "function") {
        updateResources();
    }

    if (typeof renderCollectionScreen === "function") {
        renderCollectionScreen();
    }

    if (typeof renderTeamScreen === "function") {
        renderTeamScreen();
    }

    setupGame();

    if (!gameAnimation) {
        gameLoop();
    }
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeInazumaGame,
        { once: true }
    );
} else {
    initializeInazumaGame();
}
