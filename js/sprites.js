
"use strict";

/* ==========================================
   INAZUMA SD - SISTEMA DE SPRITES
   ========================================== */

const CHARACTER_SPRITES = {
    "mark evans": "mark.png",
    "mark": "mark.png",

    "axel blaze": "axel.png",
    "axel": "axel.png",

    "jude sharp": "jude.png",
    "jude": "jude.png",

    "jack wallside": "jack.png",
    "jack": "jack.png",

    "nathan swift": "nathan.png",
    "nathan": "nathan.png",

    "kevin dragonfly": "kevin.png",
    "shawn froste": "shawn.png",
    "erik eagle": "erik.png",
    "bobby shearer": "bobby.png",
    "silvia woods": "silvia.png",

    "arion sherwind": "arion.png",
    "victor blade": "victor.png",
    "riccardo di rigo": "riccardo.png",
    "gabriel garcia": "gabriel.png",
    "goldie lemmon": "goldie.png",

    "david samford": "david.png",
    "joseph king": "joseph.png",

    "reize": "reize.png",
    "aphrodi": "aphrodi.png",
    "burn": "burn.png"
};

const spriteCache = {};

/* ==========================================
   NORMALIZAR NOMBRES
   ========================================== */

function normalizeCharacterName(name) {
    return String(name || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

/* ==========================================
   OBTENER RUTA DEL SPRITE
   ========================================== */

function getCharacterSpritePath(player) {
    if (!player) return null;

    if (player.sprite) {
        return player.sprite;
    }

    const name = normalizeCharacterName(player.name);
    const file = CHARACTER_SPRITES[name];

    if (!file) return null;

    return "assets/characters/" + file;
}

/* ==========================================
   CARGAR SPRITE
   ========================================== */

function loadCharacterSprite(player) {
    const path = getCharacterSpritePath(player);

    if (!path) return null;

    if (!spriteCache[path]) {
        const image = new Image();

        spriteCache[path] = {
            image: image,
            loaded: false,
            failed: false,
            loading: true
        };

        image.onload = function() {
            spriteCache[path].loaded = true;
            spriteCache[path].loading = false;
        };

        image.onerror = function() {
            spriteCache[path].failed = true;
            spriteCache[path].loading = false;
        };

        image.src = path;
    }

    const sprite = spriteCache[path];

    if (sprite.loaded && !sprite.failed) {
        return sprite.image;
    }

    return null;
}

/* ==========================================
   DIBUJAR PERSONAJE
   ========================================== */

function drawPixelCharacter(
    ctx,
    player,
    x,
    y,
    scale = 1,
    selected = false
) {
    if (!ctx || !player) return;

    ctx.save();

    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Sombra
    ctx.fillStyle = "#06152b66";

    ctx.beginPath();
    ctx.ellipse(0, 22, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Selección
    if (selected) {
        ctx.strokeStyle = "#ffe34d";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.ellipse(0, 17, 24, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Sprite PNG
    const sprite = loadCharacterSprite(player);

    if (sprite) {
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(
            sprite,
            -22,
            -34,
            44,
            62
        );

        ctx.restore();
        return;
    }

    // Dibujo alternativo
    drawFallbackCharacter(ctx, player);

    ctx.restore();
}

/* ==========================================
   PERSONAJE ALTERNATIVO
   ========================================== */

function drawFallbackCharacter(ctx, player) {

    const color = player.color || "#2366bb";
    const skin = player.skin || "#efc39b";
    const hair = player.hair || "#342b25";

    // Piernas
    ctx.fillStyle = "#e6eaf0";

    ctx.fillRect(-9, 12, 7, 12);
    ctx.fillRect(3, 12, 7, 12);

    // Botas
    ctx.fillStyle = "#26334b";

    ctx.fillRect(-11, 22, 9, 5);
    ctx.fillRect(3, 22, 9, 5);

    // Cuerpo
    ctx.fillStyle = color;

    ctx.fillRect(-12, -5, 24, 20);
    ctx.fillRect(-17, -2, 6, 13);
    ctx.fillRect(11, -2, 6, 13);

    // Detalles del uniforme
    ctx.fillStyle = "#f7f3e7";
    ctx.fillRect(-3, -4, 6, 18);

    ctx.fillStyle = "#172e58";
    ctx.fillRect(-10, 3, 20, 3);

    // Cuello
    ctx.fillStyle = skin;
    ctx.fillRect(-4, -9, 8, 6);

    // Cabeza
    ctx.fillStyle = skin;

    ctx.fillRect(-10, -26, 20, 19);
    ctx.fillRect(-12, -20, 3, 7);
    ctx.fillRect(9, -20, 3, 7);

    // Pelo
    ctx.fillStyle = hair;

    ctx.fillRect(-11, -29, 22, 8);
    ctx.fillRect(-12, -26, 5, 10);
    ctx.fillRect(-7, -34, 7, 8);
    ctx.fillRect(0, -33, 6, 9);
    ctx.fillRect(6, -29, 7, 8);
    ctx.fillRect(-4, -24, 7, 4);

    // Ojos
    ctx.fillStyle = "#211c27";

    ctx.fillRect(-6, -20, 4, 4);
    ctx.fillRect(3, -20, 4, 4);

    // Cejas
    ctx.fillRect(-7, -23, 5, 2);
    ctx.fillRect(3, -23, 5, 2);

    // Boca
    ctx.fillStyle = "#8c3c38";
    ctx.fillRect(-2, -12, 5, 2);

    // Insignia
    ctx.fillStyle = "#fff3c0";
    ctx.fillRect(-2, -1, 4, 4);
}

/* ==========================================
   RETRATOS PARA LAS CARTAS
   ========================================== */

function createPlayerPortrait(player, canvas) {
    if (!player || !canvas) return;

    canvas.width = 120;
    canvas.height = 130;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const gradient = ctx.createLinearGradient(
        0, 0, 0, 130
    );

    gradient.addColorStop(
        0,
        player.color || "#2366bb"
    );

    gradient.addColorStop(
        1,
        "#0a1b39"
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 120, 130);

    drawPixelCharacter(
        ctx,
        player,
        60,
        75,
        1.8,
        false
    );
}

/* ==========================================
   FIGURAS DEL CAMPO
   ========================================== */

function drawPlayerFigure(
    ctx,
    player,
    x,
    y,
    radius,
    selected = false
) {
    if (!ctx || !player) return;

    ctx.save();

    // Sombra
    ctx.fillStyle = "#0005";

    ctx.beginPath();

    ctx.ellipse(
        x,
        y + radius * 0.7,
        radius * 0.9,
        radius * 0.35,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Personaje
    drawPixelCharacter(
        ctx,
        player,
        x,
        y,
        radius / 25,
        selected
    );

    ctx.restore();
}

/* ==========================================
   PRECARGAR PERSONAJES
   ========================================== */

function preloadCharacterSprites(players = []) {
    if (!Array.isArray(players)) return;

    players.forEach(player => {
        loadCharacterSprite(player);
    });
}

/* ==========================================
   COMPROBAR SPRITES
   ========================================== */

function getSpriteStatus(player) {
    const path = getCharacterSpritePath(player);

    if (!path) {
        return {
            available: false,
            status: "fallback"
        };
    }

    const sprite = spriteCache[path];

    if (!sprite) {
        return {
            available: false,
            status: "not-loaded"
        };
    }

    if (sprite.failed) {
        return {
            available: false,
            status: "failed"
        };
    }

    if (sprite.loaded) {
        return {
            available: true,
            status: "loaded"
        };
    }

    return {
        available: false,
        status: "loading"
    };
}

/* ==========================================
   PRECARGA DE TODA LA PLANTILLA
   ========================================== */

function preloadAllCharacterSprites() {
    if (typeof PLAYER_DATA === "undefined") return;

    preloadCharacterSprites(PLAYER_DATA);
}
