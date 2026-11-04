
"use strict";

/* ==========================================
   INAZUMA SD - SISTEMA DE SUPERTÉCNICAS
   ========================================== */

const TECH_COLORS = {
    fire: "#ff7024",
    ice: "#a8f4ff",
    wind: "#79ffcf",
    earth: "#d9ae62",
    dark: "#b68aff",
    light: "#fff18a"
};

let techniqueAnimation = null;
let techniqueParticles = [];

/* ==========================================
   UTILIDADES
   ========================================== */

function getTechniquePlayerData(player) {
    return player && player.data ? player.data : player;
}

function getTechniqueRating(player) {
    const data = getTechniquePlayerData(player);

    return Number(data && data.rating) || 50;
}

function getTechniqueName(player) {
    const data = getTechniquePlayerData(player);

    return data && data.technique
        ? data.technique
        : "Super técnica";
}

/* ==========================================
   BANNER DE TÉCNICA
   ========================================== */

function showTechniqueBanner(name, element) {
    const layer = document.getElementById("effectLayer");

    if (!layer) return;

    const banner = document.createElement("div");

    banner.className = "tech-banner " + (element || "");
    banner.textContent = String(name).toUpperCase();

    layer.appendChild(banner);

    setTimeout(() => {
        if (banner.parentNode) {
            banner.remove();
        }
    }, 1650);
}

/* ==========================================
   CREAR PARTÍCULAS
   ========================================== */

function createTechniqueParticles(x, y, color, amount = 22) {
    for (let i = 0; i < amount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;

        techniqueParticles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3 + Math.random() * 6,
            life: 25 + Math.random() * 25,
            maxLife: 50,
            color
        });
    }
}

/* ==========================================
   EJECUTAR SUPERTÉCNICA
   ========================================== */

function useTechnique(player, ball) {
    if (!player || !ball) return false;

    const data = getTechniquePlayerData(player);

    if (!data) return false;

    const techniqueName = getTechniqueName(player);

    if (typeof TECHNIQUE_DATA === "undefined") {
        return false;
    }

    const info = TECHNIQUE_DATA[techniqueName];

    if (!info) {
        return false;
    }

    const element = info.element || "light";
    const color = TECH_COLORS[element] || "#ffffff";

    const rating = getTechniqueRating(player);

    const direction =
        player.team === "home" ? 1 : -1;

    const targetX = direction > 0
        ? FIELD.width
        : 0;

    const targetY = FIELD.height / 2;

    const dx = targetX - ball.x;
    const dy = targetY - ball.y;

    const angle = Math.atan2(dy, dx);

    const power = Math.min(
        13,
        4.5 + rating * 0.075
    );

    // Mostrar nombre de la técnica
    showTechniqueBanner(techniqueName, element);

    // Crear efecto visual
    techniqueAnimation = {
        x: ball.x,
        y: ball.y,
        life: 55,
        maxLife: 55,
        color,
        element,
        angle
    };

    createTechniqueParticles(
        ball.x,
        ball.y,
        color,
        element === "fire" ? 35 : 24
    );

    /* --------------------------------------
       TÉCNICA DE DISPARO
       -------------------------------------- */

    if (info.type === "shot") {
        ball.vx = Math.cos(angle) * power;
        ball.vy = Math.sin(angle) * power;
    }

    /* --------------------------------------
       TÉCNICA DE REGATE
       -------------------------------------- */

    else if (info.type === "dribble") {
        player.vx = Math.cos(angle) * power * 0.7;
        player.vy = Math.sin(angle) * power * 0.7;

        ball.vx = player.vx * 1.1;
        ball.vy = player.vy * 1.1;
    }

    /* --------------------------------------
       TÉCNICA DE BLOQUEO
       -------------------------------------- */

    else if (info.type === "block") {
        player.vx = -Math.cos(angle) * power * 0.4;
        player.vy = -Math.sin(angle) * power * 0.4;

        // Crear una onda defensiva
        techniqueAnimation.defensive = true;
    }

    /* --------------------------------------
       TÉCNICA DE PARADA
       -------------------------------------- */

    else if (info.type === "save") {
        ball.vx = -ball.vx * 1.5;
        ball.vy = -ball.vy * 0.8;

        techniqueAnimation.defensive = true;
    }

    return true;
}

/* ==========================================
   ACTUALIZAR PARTÍCULAS
   ========================================== */

function updateTechniqueParticles() {
    techniqueParticles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        particle.vx *= 0.96;
        particle.vy *= 0.96;

        particle.life--;
    });

    techniqueParticles = techniqueParticles.filter(
        particle => particle.life > 0
    );
}

/* ==========================================
   DIBUJAR PARTÍCULAS
   ========================================== */

function drawTechniqueParticles(ctx) {
    techniqueParticles.forEach(particle => {
        ctx.save();

        ctx.globalAlpha = Math.max(
            0,
            particle.life / particle.maxLife
        );

        ctx.fillStyle = particle.color;

        ctx.fillRect(
            particle.x,
            particle.y,
            particle.size,
            particle.size
        );

        ctx.restore();
    });
}

/* ==========================================
   EFECTO DE FUEGO
   ========================================== */

function drawFireEffect(ctx, t, radius, progress) {
    ctx.save();

    ctx.fillStyle = "#ff7024";

    for (let i = 0; i < 9; i++) {
        const angle = i * Math.PI * 2 / 9 + progress * 3;

        const x = t.x + Math.cos(angle) * radius * 0.65;
        const y = t.y + Math.sin(angle) * radius * 0.65;

        ctx.beginPath();

        ctx.ellipse(
            x,
            y - 8,
            6,
            14 + Math.sin(progress * 10 + i) * 4,
            angle,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.restore();
}

/* ==========================================
   EFECTO DE HIELO
   ========================================== */

function drawIceEffect(ctx, t, radius) {
    ctx.save();

    ctx.strokeStyle = "#eaffff";
    ctx.lineWidth = 3;

    for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;

        const x = t.x + Math.cos(angle) * radius;
        const y = t.y + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(
            x,
            y
        );

        ctx.lineTo(
            x - Math.cos(angle - 0.5) * 12,
            y - Math.sin(angle - 0.5) * 12
        );

        ctx.stroke();

        ctx.beginPath();

        ctx.moveTo(x, y);

        ctx.lineTo(
            x - Math.cos(angle + 0.5) * 12,
            y - Math.sin(angle + 0.5) * 12
        );

        ctx.stroke();
    }

    ctx.restore();
}

/* ==========================================
   EFECTO DE VIENTO
   ========================================== */

function drawWindEffect(ctx, t, radius, progress) {
    ctx.save();

    ctx.strokeStyle = "#79ffcf";
    ctx.lineWidth = 4;

    for (let i = 0; i < 5; i++) {
        ctx.beginPath();

        const offset = i * 12;

        ctx.ellipse(
            t.x,
            t.y,
            radius + offset,
            radius * 0.35 + offset * 0.2,
            progress * 2 + i * 0.3,
            0,
            Math.PI * 1.5
        );

        ctx.stroke();
    }

    ctx.restore();
}

/* ==========================================
   EFECTO DE TIERRA
   ========================================== */

function drawEarthEffect(ctx, t, radius) {
    ctx.save();

    ctx.fillStyle = "#d9ae62";

    for (let i = 0; i < 10; i++) {
        const angle = i * Math.PI * 2 / 10;

        const x = t.x + Math.cos(angle) * radius;
        const y = t.y + Math.sin(angle) * radius;

        ctx.beginPath();

        ctx.moveTo(x, y);
        ctx.lineTo(x - 8, y - 12);
        ctx.lineTo(x + 7, y - 18);
        ctx.closePath();

        ctx.fill();
    }

    ctx.restore();
}

/* ==========================================
   EFECTO DE OSCURIDAD
   ========================================== */

function drawDarkEffect(ctx, t, radius, progress) {
    ctx.save();

    ctx.strokeStyle = "#b68aff";
    ctx.lineWidth = 5;

    for (let i = 0; i < 3; i++) {
        ctx.beginPath();

        ctx.arc(
            t.x,
            t.y,
            radius + i * 13,
            progress * 3 + i,
            progress * 3 + i + Math.PI * 1.5
        );

        ctx.stroke();
    }

    ctx.restore();
}

/* ==========================================
   EFECTO DE LUZ
   ========================================== */

function drawLightEffect(ctx, t, radius) {
    ctx.save();

    ctx.strokeStyle = "#fff18a";
    ctx.fillStyle = "#fff18a";

    ctx.lineWidth = 4;

    for (let i = 0; i < 12; i++) {
        const angle = i * Math.PI / 6;

        const x = t.x + Math.cos(angle) * radius;
        const y = t.y + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

/* ==========================================
   DIBUJAR EFECTO PRINCIPAL
   ========================================== */

function drawTechniqueEffect(ctx) {
    if (!ctx) return;

    updateTechniqueParticles();
    drawTechniqueParticles(ctx);

    if (!techniqueAnimation) return;

    const t = techniqueAnimation;

    const progress = 1 - t.life / t.maxLife;
    const radius = 20 + progress * 100;

    ctx.save();

    ctx.globalAlpha = Math.max(
        0,
        t.life / t.maxLife
    );

    ctx.strokeStyle = t.color;
    ctx.lineWidth = 7;

    ctx.beginPath();

    ctx.arc(
        t.x,
        t.y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.arc(
        t.x,
        t.y,
        radius * 0.65,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    // Efectos según el elemento
    switch (t.element) {
        case "fire":
            drawFireEffect(ctx, t, radius, progress);
            break;

        case "ice":
            drawIceEffect(ctx, t, radius);
            break;

        case "wind":
            drawWindEffect(ctx, t, radius, progress);
            break;

        case "earth":
            drawEarthEffect(ctx, t, radius);
            break;

        case "dark":
            drawDarkEffect(ctx, t, radius, progress);
            break;

        case "light":
            drawLightEffect(ctx, t, radius);
            break;
    }

    // Onda defensiva
    if (t.defensive) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 6;

        ctx.beginPath();

        ctx.arc(
            t.x,
            t.y,
            radius * 0.8,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }

    ctx.restore();

    t.life--;

    if (t.life <= 0) {
        techniqueAnimation = null;
    }
}

/* ==========================================
   LIMPIAR EFECTOS
   ========================================== */

function clearTechniqueEffects() {
    techniqueAnimation = null;
    techniqueParticles = [];
}
