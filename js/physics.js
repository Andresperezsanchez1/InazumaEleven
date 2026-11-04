
"use strict";

/* ==========================================
   INAZUMA SD - MOTOR DE FÍSICAS
   ========================================== */

const FIELD = {
    width: 900,
    height: 560
};

const BALL_RADIUS = 9;
const FIGURE_RADIUS = 22;

// Masas aproximadas para las colisiones
const PLAYER_MASS = 2.5;
const BALL_MASS = 0.45;

// Velocidades máximas
const MAX_PLAYER_SPEED = 9;
const MAX_BALL_SPEED = 15;

// Fricción
const PLAYER_FRICTION = 0.975;
const BALL_FRICTION = 0.992;

// Rebote
const WALL_RESTITUTION = 0.65;

/* ==========================================
   UTILIDADES
   ========================================== */

function vectorLength(x, y) {
    return Math.hypot(x, y);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function normalizeVector(x, y) {
    const length = Math.hypot(x, y);

    if (length === 0) {
        return { x: 0, y: 0 };
    }

    return {
        x: x / length,
        y: y / length
    };
}

/* ==========================================
   LIMITAR VELOCIDAD
   ========================================== */

function limitVelocity(obj, maxSpeed) {
    const speed = Math.hypot(obj.vx, obj.vy);

    if (speed > maxSpeed) {
        const factor = maxSpeed / speed;

        obj.vx *= factor;
        obj.vy *= factor;
    }
}

/* ==========================================
   FRICCIÓN
   ========================================== */

function applyFriction(obj, friction = 0.985) {
    obj.vx *= friction;
    obj.vy *= friction;

    if (Math.abs(obj.vx) < 0.035) {
        obj.vx = 0;
    }

    if (Math.abs(obj.vy) < 0.035) {
        obj.vy = 0;
    }
}

/* ==========================================
   MOVIMIENTO
   ========================================== */

function physicsMove(obj) {
    if (!obj) return;

    obj.x += obj.vx;
    obj.y += obj.vy;

    const friction = obj.team
        ? PLAYER_FRICTION
        : BALL_FRICTION;

    applyFriction(obj, friction);

    limitVelocity(
        obj,
        obj.team ? MAX_PLAYER_SPEED : MAX_BALL_SPEED
    );
}

/* ==========================================
   COLISIONES ENTRE OBJETOS
   ========================================== */

function physicsCollision(
    a,
    b,
    ra,
    rb,
    restitution = 0.8
) {
    if (!a || !b) return;

    let dx = b.x - a.x;
    let dy = b.y - a.y;

    let dist = Math.hypot(dx, dy);

    const minDistance = ra + rb;

    if (dist >= minDistance) return;

    // Evitar divisiones por cero
    if (dist < 0.001) {
        dx = 0.01;
        dy = 0.01;
        dist = Math.hypot(dx, dy);
    }

    const nx = dx / dist;
    const ny = dy / dist;

    const overlap = minDistance - dist;

    // Determinar las masas
    const massA = a.team ? PLAYER_MASS : BALL_MASS;
    const massB = b.team ? PLAYER_MASS : BALL_MASS;

    const invMassA = 1 / massA;
    const invMassB = 1 / massB;

    const totalInverseMass = invMassA + invMassB;

    // Separar objetos para evitar que se atraviesen
    const correction = overlap / totalInverseMass;

    a.x -= nx * correction * invMassA;
    a.y -= ny * correction * invMassA;

    b.x += nx * correction * invMassB;
    b.y += ny * correction * invMassB;

    // Velocidad relativa
    const relativeVelocityX = b.vx - a.vx;
    const relativeVelocityY = b.vy - a.vy;

    const velocityAlongNormal =
        relativeVelocityX * nx +
        relativeVelocityY * ny;

    // Si se están separando, no aplicar impulso
    if (velocityAlongNormal > 0) return;

    // Impulso de colisión
    const impulse =
        -(1 + restitution) *
        velocityAlongNormal /
        totalInverseMass;

    const impulseX = impulse * nx;
    const impulseY = impulse * ny;

    a.vx -= impulseX * invMassA;
    a.vy -= impulseY * invMassA;

    b.vx += impulseX * invMassB;
    b.vy += impulseY * invMassB;

    limitVelocity(a, a.team ? MAX_PLAYER_SPEED : MAX_BALL_SPEED);
    limitVelocity(b, b.team ? MAX_PLAYER_SPEED : MAX_BALL_SPEED);
}

/* ==========================================
   LÍMITES DEL CAMPO
   ========================================== */

function isInsideGoalOpening(obj) {
    return (
        obj.y > 220 + BALL_RADIUS &&
        obj.y < 340 - BALL_RADIUS
    );
}

function keepInField(obj, radius, goalOpening = false) {
    if (!obj) return;

    // Límites superior e inferior
    if (obj.y < radius) {
        obj.y = radius;
        obj.vy = Math.abs(obj.vy) * WALL_RESTITUTION;
    }

    if (obj.y > FIELD.height - radius) {
        obj.y = FIELD.height - radius;
        obj.vy = -Math.abs(obj.vy) * WALL_RESTITUTION;
    }

    const inGoal = isInsideGoalOpening(obj);

    // Límite izquierdo
    if (
        obj.x < radius &&
        !(goalOpening && inGoal)
    ) {
        obj.x = radius;
        obj.vx = Math.abs(obj.vx) * WALL_RESTITUTION;
    }

    // Límite derecho
    if (
        obj.x > FIELD.width - radius &&
        !(goalOpening && inGoal)
    ) {
        obj.x = FIELD.width - radius;
        obj.vx = -Math.abs(obj.vx) * WALL_RESTITUTION;
    }
}

/* ==========================================
   COLISIONES CON LOS POSTES
   ========================================== */

function collideWithGoalPosts(ball) {
    const postRadius = 5;

    const posts = [
        { x: 0, y: 220 },
        { x: 0, y: 340 },
        { x: FIELD.width, y: 220 },
        { x: FIELD.width, y: 340 }
    ];

    posts.forEach(post => {
        let dx = ball.x - post.x;
        let dy = ball.y - post.y;

        let dist = Math.hypot(dx, dy);
        const minDistance = BALL_RADIUS + postRadius;

        if (dist >= minDistance || dist === 0) {
            return;
        }

        const nx = dx / dist;
        const ny = dy / dist;

        const overlap = minDistance - dist;

        ball.x += nx * overlap;
        ball.y += ny * overlap;

        const velocity = ball.vx * nx + ball.vy * ny;

        if (velocity < 0) {
            ball.vx -= 1.7 * velocity * nx;
            ball.vy -= 1.7 * velocity * ny;
        }
    });
}

/* ==========================================
   COLISIONES ENTRE JUGADORES
   ========================================== */

function resolvePlayerCollisions(players) {
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            const a = players[i];
            const b = players[j];

            physicsCollision(
                a,
                b,
                FIGURE_RADIUS,
                FIGURE_RADIUS,
                0.55
            );
        }
    }
}

/* ==========================================
   COLISIONES JUGADORES Y BALÓN
   ========================================== */

function resolveBallCollisions(players, ball) {
    players.forEach(player => {
        physicsCollision(
            player,
            ball,
            FIGURE_RADIUS,
            BALL_RADIUS,
            0.82
        );
    });
}

/* ==========================================
   MOTOR PRINCIPAL
   ========================================== */

function resolveFieldPhysics(players, ball) {
    if (!ball || !Array.isArray(players)) return;

    // Movimiento de todos los objetos
    physicsMove(ball);

    players.forEach(player => {
        physicsMove(player);
    });

    // Colisiones entre jugadores
    resolvePlayerCollisions(players);

    // Colisiones con el balón
    resolveBallCollisions(players, ball);

    // Límites de los jugadores
    players.forEach(player => {
        keepInField(
            player,
            FIGURE_RADIUS,
            false
        );
    });

    // Límites del balón
    keepInField(
        ball,
        BALL_RADIUS,
        true
    );

    // Postes de las porterías
    collideWithGoalPosts(ball);

    // Evitar velocidades excesivas
    limitVelocity(ball, MAX_BALL_SPEED);

    players.forEach(player => {
        limitVelocity(player, MAX_PLAYER_SPEED);
    });
}

/* ==========================================
   DETECTAR GOL
   ========================================== */

function isGoal(ball) {
    if (!ball) return false;

    const insideGoal =
        ball.y > 220 + BALL_RADIUS &&
        ball.y < 340 - BALL_RADIUS;

    if (!insideGoal) return false;

    const crossedLeft =
        ball.x < -BALL_RADIUS;

    const crossedRight =
        ball.x > FIELD.width + BALL_RADIUS;

    return crossedLeft || crossedRight;
}

/* ==========================================
   REINICIAR VELOCIDADES
   ========================================== */

function stopPhysics(obj) {
    if (!obj) return;

    obj.vx = 0;
    obj.vy = 0;
}

/* ==========================================
   APLICAR IMPULSO
   ========================================== */

function applyImpulse(obj, angle, power) {
    if (!obj) return;

    const force = clamp(power, 0, MAX_BALL_SPEED);

    obj.vx += Math.cos(angle) * force;
    obj.vy += Math.sin(angle) * force;

    limitVelocity(
        obj,
        obj.team ? MAX_PLAYER_SPEED : MAX_BALL_SPEED
    );
}

/* ==========================================
   DETECTAR CONTACTO
   ========================================== */

function areTouching(a, b, radiusA, radiusB) {
    if (!a || !b) return false;

    return distanceBetween(a, b) <= radiusA + radiusB;
}

function distanceBetween(a, b) {
    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );
}
