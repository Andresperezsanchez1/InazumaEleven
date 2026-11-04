/* =========================================================
   INAZUMA SD - GAME.JS
   Fútbol táctico 5v5 por turnos
   Cámara superior + física + IA + técnicas especiales
   ========================================================= */

(() => {
    "use strict";

    const canvas = document.getElementById("pitch");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const W = 900;
    const H = 560;

    const CONFIG = {
        maxActions: 3,
        turnDuration: 45,
        playerRadius: 19,
        ballRadius: 8,
        friction: 0.975,
        bounce: 0.72,
        maxSpeed: 13,
        goalWidth: 150,
        matchDuration: 180
    };

    let players = [];
    let ball = {};
    let selected = null;
    let target = null;
    let drag = null;

    let currentTeam = "home";
    let actions = CONFIG.maxActions;
    let turnTime = CONFIG.turnDuration;

    let matchTime = CONFIG.matchDuration;
    let homeScore = 0;
    let awayScore = 0;

    let matchActive = false;
    let animation = null;
    let aiRunning = false;
    let actionMode = "move";

    let lastFrame = 0;
    let lastSecond = 0;
    let techniqueEnergy = 100;

    let homePlayers = [];
    let awayPlayers = [];

    let message = "";
    let messageTime = 0;

    const $ = id => document.getElementById(id);

    const clamp = (v, min, max) =>
        Math.max(min, Math.min(max, v));

    const distance = (a, b) =>
        Math.hypot(a.x - b.x, a.y - b.y);

    const normalize = (x, y) => {
        const length = Math.hypot(x, y) || 1;
        return { x: x / length, y: y / length };
    };

    function getPlayerData(id) {
        return PLAYER_DATA.find(p => Number(p.id) === Number(id));
    }

    function getRating(player) {
        return Number(player.rating || player.overall || 70);
    }

    function getName(player) {
        return player.name || "Jugador";
    }

    function getPosition(player) {
        return player.position || player.pos || "MC";
    }

    function getElement(player) {
        return (player.element || "wind").toLowerCase();
    }

    function randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    function setMessage(text, duration = 1500) {
        message = text;
        messageTime = duration;
    }

    /* =====================================================
       EQUIPOS
       ===================================================== */

    function getStartingLineup() {
        let list = [];

        if (typeof getStartingPlayers === "function") {
            list = getStartingPlayers();
        }

        if (!Array.isArray(list) || list.length === 0) {
            const ids = Array.isArray(window.startingTeam)
                ? window.startingTeam
                : [1, 2, 3, 4, 5];

            list = ids
                .map(id => getPlayerData(id))
                .filter(Boolean);
        }

        return list.slice(0, 5);
    }

    function makePlayer(data, team, index) {
        const isHome = team === "home";

        return {
            data,
            team,
            index,

            x: 0,
            y: 0,

            vx: 0,
            vy: 0,

            radius: CONFIG.playerRadius,

            energy: 100,
            hasBall: false,

            cooldown: 0,
            selected: false
        };
    }

    function createTeams() {
        const lineup = getStartingLineup();

        if (lineup.length < 5) {
            console.error("INAZUMA SD: faltan jugadores para completar el equipo.");
        }

        const fallback = PLAYER_DATA.slice(0, 5);

        homePlayers = [];

        for (let i = 0; i < 5; i++) {
            const data = lineup[i] || fallback[i];

            if (data) {
                homePlayers.push(makePlayer(data, "home", i));
            }
        }

        // Equipo rival generado a partir de jugadores disponibles.
        awayPlayers = [];

        const available = PLAYER_DATA.filter(Boolean);

        for (let i = 0; i < 5; i++) {
            const data = available[
                (i + 5) % available.length
            ];

            if (data) {
                awayPlayers.push(makePlayer(data, "away", i));
            }
        }

        players = [...homePlayers, ...awayPlayers];

        positionPlayers();
    }

    function positionPlayers() {
        const homePositions = [
            [95, 280],
            [245, 150],
            [245, 410],
            [390, 215],
            [390, 345]
        ];

        const awayPositions = [
            [805, 280],
            [655, 150],
            [655, 410],
            [510, 215],
            [510, 345]
        ];

        homePlayers.forEach((p, i) => {
            const pos = homePositions[i];

            p.x = pos[0];
            p.y = pos[1];
        });

        awayPlayers.forEach((p, i) => {
            const pos = awayPositions[i];

            p.x = pos[0];
            p.y = pos[1];
        });

        if (ball) {
            ball.x = W / 2;
            ball.y = H / 2;
            ball.vx = 0;
            ball.vy = 0;
        }
    }

    /* =====================================================
       BALÓN
       ===================================================== */

    function createBall() {
        ball = {
            x: W / 2,
            y: H / 2,
            vx: 0,
            vy: 0,
            radius: CONFIG.ballRadius,
            owner: null,
            lastTouch: null
        };
    }

    function giveBall(player) {
        if (!player) return;

        if (ball.owner) {
            ball.owner.hasBall = false;
        }

        ball.owner = player;
        player.hasBall = true;

        ball.lastTouch = player.team;

        ball.vx = 0;
        ball.vy = 0;

        ball.x = player.x;
        ball.y = player.y;
    }

    function releaseBall() {
        if (ball.owner) {
            ball.owner.hasBall = false;
            ball.owner = null;
        }
    }

    /* =====================================================
       CAMPO
       ===================================================== */

    function drawPitch() {
        ctx.clearRect(0, 0, W, H);

        // Césped.
        ctx.fillStyle = "#287c3d";
        ctx.fillRect(0, 0, W, H);

        // Franjas del campo.
        for (let i = 0; i < 9; i++) {
            ctx.fillStyle = i % 2 === 0
                ? "#2d8946"
                : "#24753a";

            ctx.fillRect(i * 100, 0, 100, H);
        }

        // Bordes.
        ctx.strokeStyle = "#eaffea";
        ctx.lineWidth = 4;
        ctx.strokeRect(25, 25, W - 50, H - 50);

        // Línea central.
        ctx.beginPath();
        ctx.moveTo(W / 2, 25);
        ctx.lineTo(W / 2, H - 25);
        ctx.stroke();

        // Círculo central.
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, 75, 0, Math.PI * 2);
        ctx.stroke();

        // Punto central.
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Áreas.
        ctx.strokeRect(25, 155, 115, 250);
        ctx.strokeRect(W - 140, 155, 115, 250);

        ctx.strokeRect(25, 205, 50, 150);
        ctx.strokeRect(W - 75, 205, 50, 150);

        // Porterías.
        ctx.fillStyle = "#dcecff";
        ctx.fillRect(5, 205, 22, CONFIG.goalWidth);
        ctx.fillRect(W - 27, 205, 22, CONFIG.goalWidth);

        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 205, 22, CONFIG.goalWidth);
        ctx.strokeRect(W - 27, 205, 22, CONFIG.goalWidth);

        // Puntos de penalti.
        ctx.fillStyle = "#fff";

        ctx.beginPath();
        ctx.arc(105, H / 2, 4, 0, Math.PI * 2);
        ctx.arc(W - 105, H / 2, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    /* =====================================================
       PERSONAJES ORIGINALES DIBUJADOS POR CÓDIGO
       ===================================================== */

    function drawCharacter(player) {
        const x = player.x;
        const y = player.y;

        const data = player.data;

        const isHome = player.team === "home";

        const uniform = isHome
            ? "#1676dc"
            : "#d94141";

        const darkUniform = isHome
            ? "#083e91"
            : "#8c1d30";

        const hair = data.hairColor || (
            isHome ? "#34233e" : "#292b45"
        );

        const skin = data.skinColor || "#edbd96";

        const selectedPlayer = player === selected;

        // Sombra.
        ctx.fillStyle = "#0005";
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 6, 20, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Indicador de selección.
        if (selectedPlayer) {
            ctx.strokeStyle = "#fff34d";
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.arc(x, y, 25, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = "#fff34d";
            ctx.beginPath();
            ctx.arc(x, y + 30, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cuerpo.
        ctx.fillStyle = darkUniform;
        ctx.fillRect(x - 12, y - 2, 24, 18);

        ctx.fillStyle = uniform;
        ctx.fillRect(x - 11, y - 5, 22, 17);

        // Camiseta.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - 3, y - 3, 6, 14);

        // Brazos.
        ctx.fillStyle = skin;
        ctx.fillRect(x - 17, y - 3, 6, 12);
        ctx.fillRect(x + 11, y - 3, 6, 12);

        // Piernas.
        ctx.fillStyle = "#14243b";
        ctx.fillRect(x - 9, y + 12, 7, 10);
        ctx.fillRect(x + 2, y + 12, 7, 10);

        // Botas.
        ctx.fillStyle = "#f4f4f4";
        ctx.fillRect(x - 11, y + 20, 9, 4);
        ctx.fillRect(x + 2, y + 20, 9, 4);

        // Cuello.
        ctx.fillStyle = skin;
        ctx.fillRect(x - 4, y - 10, 8, 7);

        // Cabeza.
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.arc(x, y - 15, 11, 0, Math.PI * 2);
        ctx.fill();

        // Pelo.
        ctx.fillStyle = hair;

        ctx.beginPath();
        ctx.moveTo(x - 11, y - 17);
        ctx.lineTo(x - 15, y - 28);
        ctx.lineTo(x - 6, y - 24);
        ctx.lineTo(x - 1, y - 32);
        ctx.lineTo(x + 4, y - 24);
        ctx.lineTo(x + 13, y - 28);
        ctx.lineTo(x + 11, y - 15);
        ctx.closePath();
        ctx.fill();

        // Ojos.
        ctx.fillStyle = "#151525";
        ctx.fillRect(x - 5, y - 16, 2, 3);
        ctx.fillRect(x + 3, y - 16, 2, 3);

        // Número del jugador.
        ctx.fillStyle = "#fff";
        ctx.font = "bold 9px Arial";
        ctx.textAlign = "center";
        ctx.fillText(String(player.index + 1), x, y + 7);

        // Nombre.
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 3;
        ctx.fillText(getName(data), x, y + 39);
        ctx.shadowBlur = 0;

        // Indicador de balón.
        if (player.hasBall) {
            ctx.fillStyle = "#ffe34e";

            ctx.beginPath();
            ctx.arc(x, y - 43, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawBall() {
        ctx.save();

        ctx.fillStyle = "#0005";
        ctx.beginPath();
        ctx.ellipse(
            ball.x + 3,
            ball.y + 5,
            9,
            5,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(
            ball.x,
            ball.y,
            CONFIG.ballRadius,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.strokeStyle = "#222";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /* =====================================================
       DIBUJO GENERAL
       ===================================================== */

    function drawAim() {
        if (!drag || !selected) return;

        const dx = drag.startX - drag.x;
        const dy = drag.startY - drag.y;

        const length = Math.hypot(dx, dy);

        if (length < 3) return;

        const dir = normalize(dx, dy);

        const power = Math.min(length, 100);

        ctx.strokeStyle = "#fff34d";
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.moveTo(selected.x, selected.y);
        ctx.lineTo(
            selected.x + dir.x * power,
            selected.y + dir.y * power
        );
        ctx.stroke();

        ctx.fillStyle = "#fff34d";
        ctx.font = "bold 16px Arial";
        ctx.fillText(
            Math.round(power) + "%",
            selected.x + 15,
            selected.y - 35
        );
    }

    function drawInterface() {
        if (messageTime > 0) {
            ctx.save();

            ctx.fillStyle = "#071a38dd";
            ctx.fillRect(250, 10, 400, 42);

            ctx.fillStyle = "#ffe34e";
            ctx.font = "bold 21px Arial";
            ctx.textAlign = "center";
            ctx.fillText(message, W / 2, 38);

            ctx.restore();
        }

        if (currentTeam === "home" && matchActive) {
            ctx.fillStyle = "#fff";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "left";
            ctx.fillText(
                "ACCIONES: " + actions + "/" + CONFIG.maxActions,
                35,
                H - 5
            );
        }
    }

    function render() {
        drawPitch();

        players.forEach(drawCharacter);

        drawBall();
        drawAim();
        drawInterface();
    }

    /* =====================================================
       FÍSICA
       ===================================================== */

    function movePhysics() {
        for (const p of players) {
            p.x += p.vx;
            p.y += p.vy;

            p.vx *= CONFIG.friction;
            p.vy *= CONFIG.friction;

            if (Math.abs(p.vx) < 0.03) p.vx = 0;
            if (Math.abs(p.vy) < 0.03) p.vy = 0;

            p.x = clamp(p.x, 48, W - 48);
            p.y = clamp(p.y, 48, H - 48);
        }

        if (!ball.owner) {
            ball.x += ball.vx;
            ball.y += ball.vy;

            ball.vx *= CONFIG.friction;
            ball.vy *= CONFIG.friction;

            if (Math.abs(ball.vx) < 0.05) ball.vx = 0;
            if (Math.abs(ball.vy) < 0.05) ball.vy = 0;
        } else {
            const owner = ball.owner;

            ball.x = owner.x;
            ball.y = owner.y;
        }

        // Colisiones entre jugadores.
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                const a = players[i];
                const b = players[j];

                const dx = b.x - a.x;
                const dy = b.y - a.y;

                const dist = Math.hypot(dx, dy);

                const minDist = a.radius + b.radius;

                if (dist > 0 && dist < minDist) {
                    const overlap = (minDist - dist) / 2;
                    const n = normalize(dx, dy);

                    a.x -= n.x * overlap;
                    a.y -= n.y * overlap;

                    b.x += n.x * overlap;
                    b.y += n.y * overlap;

                    const relative = (a.vx - b.vx) * n.x +
                        (a.vy - b.vy) * n.y;

                    if (relative > 0) {
                        a.vx -= relative * n.x * 0.35;
                        a.vy -= relative * n.y * 0.35;

                        b.vx += relative * n.x * 0.35;
                        b.vy += relative * n.y * 0.35;
                    }
                }
            }
        }

        // El balón puede ser interceptado.
        if (!ball.owner && Math.hypot(ball.vx, ball.vy) < 5) {
            for (const p of players) {
                if (distance(p, ball) < 24) {
                    giveBall(p);
                    break;
                }
            }
        }

        checkGoal();
    }

    function checkGoal() {
        if (ball.y < 205 || ball.y > 355) return;

        if (ball.x < 20) {
            if (ball.lastTouch === "away") {
                awayScore++;
            } else {
                homeScore++;
            }

            updateScore();
            goalReset("home");
        }

        if (ball.x > W - 20) {
            if (ball.lastTouch === "home") {
                homeScore++;
            } else {
                awayScore++;
            }

            updateScore();
            goalReset("away");
        }
    }

    function updateScore() {
        if ($("homeScore")) $("homeScore").textContent = homeScore;
        if ($("awayScore")) $("awayScore").textContent = awayScore;
    }

    function goalReset(team) {
        releaseBall();

        players.forEach(p => {
            p.vx = 0;
            p.vy = 0;
        });

        positionPlayers();

        if (team === "home") {
            giveBall(homePlayers[1] || homePlayers[0]);
        } else {
            giveBall(awayPlayers[1] || awayPlayers[0]);
        }

        setMessage(
            team === "home"
                ? "¡GOL DEL RAIMON!"
                : "¡GOL DEL RIVAL!",
            2200
        );

        currentTeam = "home";
        actions = CONFIG.maxActions;
        turnTime = CONFIG.turnDuration;
        updateTurnUI();
    }

    /* =====================================================
       ACCIONES DEL JUGADOR
       ===================================================== */

    function spendAction() {
        if (currentTeam !== "home" || !matchActive) return false;

        if (actions <= 0) {
            setMessage("¡No te quedan acciones!");
            return false;
        }

        actions--;

        updateTurnUI();

        if (actions <= 0) {
            setTimeout(endHomeTurn, 700);
        }

        return true;
    }

    function launchPlayer(player, dx, dy, power) {
        const dir = normalize(dx, dy);
        const strength = clamp(power, 0, 100) / 100;

        player.vx += dir.x * strength * CONFIG.maxSpeed;
        player.vy += dir.y * strength * CONFIG.maxSpeed;

        if (player.hasBall) {
            ball.vx = player.vx;
            ball.vy = player.vy;
        }
    }

    function performMovement(player, dx, dy, power) {
        if (!player || player.team !== "home") return;
        if (!spendAction()) return;

        launchPlayer(player, dx, dy, power);
        setMessage("Movimiento");
    }

    function performPass() {
        if (!selected || selected.team !== "home") {
            setMessage("Selecciona un jugador");
            return;
        }

        if (ball.owner !== selected) {
            setMessage("Este jugador no tiene el balón");
            return;
        }

        const teammates = homePlayers.filter(p => p !== selected);

        let nearest = null;
        let bestScore = Infinity;

        for (const mate of teammates) {
            const d = distance(selected, mate);

            const forwardPenalty = mate.x < selected.x
                ? 100
                : 0;

            const score = d + forwardPenalty;

            if (score < bestScore) {
                bestScore = score;
                nearest = mate;
            }
        }

        if (!nearest) return;
        if (!spendAction()) return;

        releaseBall();

        const dir = normalize(
            nearest.x - selected.x,
            nearest.y - selected.y
        );

        ball.vx = dir.x * 11;
        ball.vy = dir.y * 11;

        ball.lastTouch = "home";

        setMessage("¡Pase!");
        actionMode = "move";
    }

    function performShot() {
        if (!selected || ball.owner !== selected) {
            setMessage("Necesitas tener el balón");
            return;
        }

        if (!spendAction()) return;

        const goal = { x: W - 10, y: H / 2 };

        const dir = normalize(
            goal.x - ball.x,
            goal.y - ball.y + randomBetween(-45, 45)
        );

        releaseBall();

        const accuracy = getRating(selected.data) / 100;

        ball.vx = dir.x * (13 + accuracy * 3);
        ball.vy = dir.y * (13 + accuracy * 3);

        ball.lastTouch = "home";

        selected.energy = Math.max(0, selected.energy - 8);

        setMessage("¡Disparo a puerta!");
        actionMode = "move";
    }

    function performDribble() {
        if (!selected || ball.owner !== selected) {
            setMessage("Selecciona al jugador que tiene el balón");
            return;
        }

        if (!spendAction()) return;

        const nearestEnemy = awayPlayers
            .slice()
            .sort((a, b) => distance(a, selected) - distance(b, selected))[0];

        let dir = { x: 1, y: 0 };

        if (nearestEnemy) {
            dir = normalize(
                selected.x - nearestEnemy.x + 35,
                selected.y - nearestEnemy.y
            );
        }

        selected.vx += dir.x * 8;
        selected.vy += dir.y * 8;

        selected.energy = Math.max(0, selected.energy - 5);

        setMessage("¡Regate!");
    }

    function performTackle() {
        if (!selected || selected.team !== "home") {
            setMessage("Selecciona un defensor");
            return;
        }

        if (!ball.owner || ball.owner.team !== "away") {
            setMessage("El rival no tiene el balón");
            return;
        }

        const enemy = ball.owner;

        if (!spendAction()) return;

        const d = distance(selected, enemy);

        if (d > 100) {
            setMessage("Estás demasiado lejos para robar");
            return;
        }

        const rating = getRating(selected.data);
        const enemyRating = getRating(enemy.data);

        const chance = clamp(
            0.45 + (rating - enemyRating) * 0.015,
            0.15,
            0.85
        );

        if (Math.random() < chance) {
            giveBall(selected);
            setMessage("¡ROBO DE BALÓN!");
        } else {
            setMessage("¡El rival esquiva la entrada!");
            selected.vx -= 3;
        }
    }

    function performTechnique() {
        if (!selected || ball.owner !== selected) {
            setMessage("Necesitas tener el balón");
            return;
        }

        if (techniqueEnergy < 30) {
            setMessage("No tienes energía suficiente");
            return;
        }

        if (!spendAction()) return;

        techniqueEnergy -= 30;

        const rating = getRating(selected.data);
        const dir = normalize(W - ball.x, H / 2 - ball.y);

        releaseBall();

        const power = 17 + rating * 0.035;

        ball.vx = dir.x * power;
        ball.vy = dir.y * power;

        ball.lastTouch = "home";

        setMessage("⚡ ¡TÉCNICA ESPECIAL!");

        if (typeof showTechniqueBanner === "function") {
            try {
                showTechniqueBanner(selected);
            } catch (e) {
                console.warn(e);
            }
        }
    }

    /* =====================================================
       INTELIGENCIA ARTIFICIAL
       ===================================================== */

    function enemyMoveToward(player, x, y, strength = 0.65) {
        const dir = normalize(x - player.x, y - player.y);

        player.vx += dir.x * strength;
        player.vy += dir.y * strength;
    }

    function enemyTurn() {
        if (!matchActive || aiRunning) return;

        aiRunning = true;
        currentTeam = "away";

        updateTurnUI();
        setMessage("Turno del rival");

        let step = 0;

        function aiStep() {
            if (!matchActive) {
                aiRunning = false;
                return;
            }

            if (step >= 3) {
                finishEnemyTurn();
                return;
            }

            step++;

            const carrier = ball.owner;

            if (carrier && carrier.team === "away") {
                const enemy = carrier;

                const goalDistance = W - enemy.x;

                if (goalDistance < 250) {
                    enemyShoot(enemy);
                } else {
                    enemyMoveToward(
                        enemy,
                        W - 110,
                        H / 2 + randomBetween(-65, 65),
                        1.5
                    );
                }
            } else if (carrier && carrier.team === "home") {
                const defender = awayPlayers
                    .slice()
                    .sort((a, b) => distance(a, carrier) - distance(b, carrier))[0];

                if (defender) {
                    enemyMoveToward(
                        defender,
                        carrier.x,
                        carrier.y,
                        2.5
                    );

                    if (distance(defender, carrier) < 30) {
                        const chance = 0.4 +
                            (getRating(defender.data) - getRating(carrier.data)) * 0.012;

                        if (Math.random() < clamp(chance, 0.1, 0.8)) {
                            giveBall(defender);
                            setMessage("¡El rival te ha robado el balón!");
                        }
                    }
                }
            } else {
                const nearest = awayPlayers
                    .slice()
                    .sort((a, b) => distance(a, ball) - distance(b, ball))[0];

                if (nearest) {
                    enemyMoveToward(
                        nearest,
                        ball.x,
                        ball.y,
                        2.5
                    );
                }
            }

            // Los compañeros de la IA buscan posiciones.
            awayPlayers.forEach(p => {
                if (p !== ball.owner && p !== carrier) {
                    const offset = (p.index - 2) * 65;

                    enemyMoveToward(
                        p,
                        W - 190,
                        H / 2 + offset,
                        0.55
                    );
                }
            });

            setTimeout(aiStep, 650);
        }

        aiStep();
    }

    function enemyShoot(player) {
        const dir = normalize(
            10 - ball.x,
            H / 2 - ball.y + randomBetween(-50, 50)
        );

        releaseBall();

        ball.vx = dir.x * 15;
        ball.vy = dir.y * 15;

        ball.lastTouch = "away";

        setMessage("¡El rival dispara!");
    }

    function finishEnemyTurn() {
        currentTeam = "home";
        actions = CONFIG.maxActions;
        turnTime = CONFIG.turnDuration;

        aiRunning = false;

        updateTurnUI();
        setMessage("¡Tu turno!");
    }

    function endHomeTurn() {
        if (!matchActive || currentTeam !== "home") return;

        currentTeam = "away";
        updateTurnUI();

        setTimeout(enemyTurn, 500);
    }

    /* =====================================================
       TURNOS Y CONTROLES
       ===================================================== */

    function updateTurnUI() {
        const turn = $("turnText");

        if (turn) {
            turn.textContent = currentTeam === "home"
                ? "Tu turno · Acciones: " + actions
                : "Turno del rival";
        }
    }

    function updateClockUI() {
        const clock = $("matchClock");

        if (!clock) return;

        const min = Math.floor(matchTime / 60);
        const sec = matchTime % 60;

        clock.textContent =
            String(min).padStart(2, "0") +
            ":" +
            String(sec).padStart(2, "0");
    }

    function getCanvasPosition(event) {
        const rect = canvas.getBoundingClientRect();

        return {
            x: (event.clientX - rect.left) * W / rect.width,
            y: (event.clientY - rect.top) * H / rect.height
        };
    }

    function findPlayerAt(x, y) {
        return players
            .slice()
            .reverse()
            .find(p => Math.hypot(p.x - x, p.y - y) < 27);
    }

    function pointerDown(event) {
        if (!matchActive || currentTeam !== "home") return;

        const pos = getCanvasPosition(event);
        const player = findPlayerAt(pos.x, pos.y);

        if (!player || player.team !== "home") return;

        selected = player;

        drag = {
            startX: pos.x,
            startY: pos.y,
            x: pos.x,
            y: pos.y
        };

        canvas.setPointerCapture(event.pointerId);
        render();
    }

    function pointerMove(event) {
        if (!drag) return;

        const pos = getCanvasPosition(event);

        drag.x = pos.x;
        drag.y = pos.y;

        render();
    }

    function pointerUp(event) {
        if (!drag || !selected) return;

        const pos = getCanvasPosition(event);

        const dx = drag.startX - pos.x;
        const dy = drag.startY - pos.y;

        const power = Math.min(100, Math.hypot(dx, dy));

        drag = null;

        if (power < 5) {
            render();
            return;
        }

        if (actionMode === "tackle") {
            performTackle();
        } else if (actionMode === "pass") {
            performPass();
        } else if (actionMode === "shoot") {
            performShot();
        } else {
            performMovement(selected, dx, dy, power);
        }

        render();
    }

    /* =====================================================
       BOTONES
       ===================================================== */

    function bindButtons() {
        $("passButton")?.addEventListener("click", () => {
            performPass();
        });

        $("dribbleButton")?.addEventListener("click", () => {
            performDribble();
        });

        $("shootButton")?.addEventListener("click", () => {
            performShot();
        });

        $("techButton")?.addEventListener("click", () => {
            performTechnique();
        });

        $("restartMatch")?.addEventListener("click", () => {
            if (typeof showModal === "function") {
                showModal(
                    "Reiniciar partido",
                    "¿Quieres comenzar un partido nuevo?",
                    [
                        {
                            text: "Cancelar",
                            action: () => {}
                        },
                        {
                            text: "Reiniciar",
                            action: resetMatch
                        }
                    ]
                );
            } else {
                if (confirm("¿Reiniciar partido?")) {
                    resetMatch();
                }
            }
        });

        canvas.addEventListener("pointerdown", pointerDown);
        canvas.addEventListener("pointermove", pointerMove);
        canvas.addEventListener("pointerup", pointerUp);
        canvas.addEventListener("pointercancel", () => {
            drag = null;
            render();
        });

        // Botón de pasar y disparar también permite seleccionar modo.
        $("passButton")?.addEventListener("contextmenu", e => {
            e.preventDefault();
            actionMode = "pass";
        });
    }

    /* =====================================================
       RELOJ Y FINAL DEL PARTIDO
       ===================================================== */

    function updateTime(delta) {
        if (!matchActive) return;

        lastSecond += delta;

        if (lastSecond >= 1000) {
            lastSecond -= 1000;

            matchTime = Math.max(0, matchTime - 1);

            if (currentTeam === "home") {
                turnTime--;

                if (turnTime <= 0) {
                    endHomeTurn();
                }
            }

            updateClockUI();

            if (matchTime <= 0) {
                finishMatch();
            }
        }
    }

    function finishMatch() {
        if (!matchActive) return;

        matchActive = false;

        let reward = 20;
        let result = "Derrota";

        if (homeScore > awayScore) {
            reward = 50;
            result = "¡Victoria!";
            if (typeof addWin === "function") {
                addWin();
            } else if (typeof wins !== "undefined") {
                wins++;
            }
        } else if (homeScore === awayScore) {
            reward = 30;
            result = "Empate";
        }

        if (typeof addCoins === "function") {
            addCoins(reward);
        } else if (typeof coins !== "undefined") {
            coins += reward;
        }

        if (typeof updateResources === "function") {
            updateResources();
        }

        const text =
            result +
            "\nResultado: " +
            homeScore +
            " - " +
            awayScore +
            "\nRecompensa: " +
            reward +
            " monedas.";

        setTimeout(() => {
            if (typeof showModal === "function") {
                showModal(
                    "Final del partido",
                    text,
                    [{
                        text: "Volver a jugar",
                        action: resetMatch
                    }]
                );
            } else {
                alert(text);
            }
        }, 300);
    }

    /* =====================================================
       BUCLE PRINCIPAL
       ===================================================== */

    function update(delta) {
        if (matchActive) {
            movePhysics();

            techniqueEnergy = Math.min(
                100,
                techniqueEnergy + delta * 0.001
            );

            updateTime(delta);
        }

        if (messageTime > 0) {
            messageTime -= delta;
        }
    }

    function gameLoop(timestamp) {
        const delta = Math.min(timestamp - lastFrame || 16, 50);

        lastFrame = timestamp;

        update(delta);
        render();

        animation = requestAnimationFrame(gameLoop);
    }

    /* =====================================================
       INICIALIZACIÓN
       ===================================================== */

    function setupGame() {
        createTeams();
        createBall();

        giveBall(homePlayers[1] || homePlayers[0]);

        currentTeam = "home";
        actions = CONFIG.maxActions;
        turnTime = CONFIG.turnDuration;

        matchTime = CONFIG.matchDuration;

        homeScore = 0;
        awayScore = 0;

        techniqueEnergy = 100;

        matchActive = true;
        aiRunning = false;

        selected = homePlayers[1] || homePlayers[0];

        updateScore();
        updateClockUI();
        updateTurnUI();

        setMessage("¡Comienza el partido!");

        render();
    }

    function resetMatch() {
        setupGame();
    }

    function initializeInazumaGame() {
        if (animation) {
            cancelAnimationFrame(animation);
        }

        bindButtons();
        setupGame();

        lastFrame = performance.now();
        animation = requestAnimationFrame(gameLoop);
    }

    // Permite que la interfaz inicie el juego.
    window.initializeInazumaGame = initializeInazumaGame;
    window.resetInazumaMatch = resetMatch;

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeInazumaGame,
            { once: true }
        );
    } else {
        initializeInazumaGame();
    }

})();