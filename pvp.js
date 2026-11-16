import {
  collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc,
  onSnapshot, deleteDoc, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

import {
  ref as rtdbRef,
  set as rtdbSet,
  onValue as rtdbOnValue
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-database.js";

const db = window.__firebaseDb;
const realtimeDb = window.__firebaseRtdb;
const $ = id => document.getElementById(id);

let roomId = null;
let roomRole = null;
let stopRoom = null;
let stopQueue = null;
let stopRtdbState = null;
let stopRtdbInput = null;
let stopRtdbActions = null;
let stateTimer = null;
let inputTimer = null;
let queueId = null;
let lastActionSeq = 0;
let actionSeq = 0;
let lastAwardedRoom = null;
let pendingAction = null;
let pvpActive = false;
let hostStateSeq = 0;
let lastStateSeq = 0;
let inputWriteInFlight = false;
let stateWriteInFlight = false;

function status(text) {
  const el = $("pvpStatus");
  if (el) el.textContent = text;
}

function cleanFirestore(value) {
  if (Array.isArray(value)) return value.map(cleanFirestore);
  if (value && typeof value === "object") {
    const out = {};
    Object.entries(value).forEach(([key, val]) => {
      if (val !== undefined && typeof val !== "function") out[key] = cleanFirestore(val);
    });
    return out;
  }
  return value;
}

// Realtime Database no admite undefined, funciones ni números no finitos.
function cleanRealtime(value) {
  if (value === undefined || typeof value === "function") return null;
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map(cleanRealtime);
  if (typeof value === "object") {
    const out = {};
    Object.entries(value).forEach(([key, val]) => {
      if (val !== undefined && typeof val !== "function") out[key] = cleanRealtime(val);
    });
    return out;
  }
  return null;
}

function realtimeRoomPath(path) {
  if (!realtimeDb || !roomId) throw new Error("Realtime Database no está inicializada o falta la sala.");
  return rtdbRef(realtimeDb, `pvpRooms/${roomId}/${path}`);
}

function roomInfo(text) {
  const el = $("pvpRoomInfo");
  if (el) {
    el.style.display = "block";
    el.textContent = text;
  }
}

function currentUser() {
  return window.__getFirebaseUser?.() || null;
}

function careerSquad() {
  const data = window.__getCareerSnapshot?.();
  if (!Array.isArray(data?.squad)) return [];
  return cleanFirestore(data.squad.slice(0, 5).map(p => ({
    id: p.id || null,
    name: p.name || "Jugador",
    role: p.role || "MC",
    rating: Number(p.rating) || 0,
    speed: Number(p.speed) || 0,
    shot: Number(p.shot) || 0,
    maxPt: Number(p.maxPt) || 0,
    pt: Number(p.pt) || 0,
    ptCost: Number(p.ptCost) || 0,
    techName: p.techName || null,
    techType: p.techType || null,
    techniques: Array.isArray(p.techniques) ? p.techniques : [],
    selectedTechniqueName: p.selectedTechniqueName || null,
    equippedTechniques: Array.isArray(p.equippedTechniques) ? p.equippedTechniques : [],
    team: p.team || null,
    emoji: p.emoji || null,
    image: p.image || null
  })));
}

function showPvpMatch() {
  const nav = $("navPvp");
  if (typeof window.showTab === "function") window.showTab("match", $("navMatch"));
  if (nav) nav.classList.remove("active");
  pvpActive = true;
  const cancel = $("pvpCancelBtn");
  if (cancel) cancel.style.display = "inline-block";
}

function clearLoops() {
  if (stateTimer) clearInterval(stateTimer);
  if (inputTimer) clearInterval(inputTimer);
  stateTimer = null;
  inputTimer = null;
  stateWriteInFlight = false;
  inputWriteInFlight = false;
}

function stopListening() {
  if (stopRoom) stopRoom();
  if (stopQueue) stopQueue();
  if (stopRtdbState) stopRtdbState();
  if (stopRtdbInput) stopRtdbInput();
  if (stopRtdbActions) stopRtdbActions();

  stopRoom = null;
  stopQueue = null;
  stopRtdbState = null;
  stopRtdbInput = null;
  stopRtdbActions = null;
  clearLoops();
}

function resetPvp() {
  stopListening();
  pvpActive = false;
  roomId = null;
  roomRole = null;
  queueId = null;
  lastActionSeq = 0;
  actionSeq = 0;
  pendingAction = null;
  hostStateSeq = 0;
  lastStateSeq = 0;
  window.__pvpReset?.();

  const cancel = $("pvpCancelBtn");
  if (cancel) cancel.style.display = "none";
  const info = $("pvpRoomInfo");
  if (info) info.style.display = "none";
}

function makeRoomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function validSquad(squad) {
  return Array.isArray(squad) && squad.length >= 5 &&
    ["POR", "DEF", "MC", "DEL", "DEL"].every((role, i) => squad[i]?.role === role);
}

async function initializeRealtimeRoom(id) {
  if (!realtimeDb) throw new Error("Realtime Database no está inicializada. Revisa auth.js y firebase-config.js.");
  const base = rtdbRef(realtimeDb, `pvpRooms/${id}`);
  await rtdbSet(base, {
    guestInput: { x: 0, y: 0, sprint: false, sentAt: Date.now() },
    guestAction: { action: null, seq: 0, sentAt: Date.now() },
    state: null
  });
}

async function createRoom(privateRoom) {
  const user = currentUser();
  if (!user) return status("Inicia sesión antes de jugar online.");

  const squad = careerSquad();
  if (!validSquad(squad)) return status("Tu plantilla titular no está completa. Revisa el equipo.");

  resetPvp();
  roomId = doc(collection(db, "pvpRooms")).id;
  roomRole = "host";
  const code = privateRoom ? makeRoomCode() : null;

  await setDoc(doc(db, "pvpRooms", roomId), {
    hostUid: user.uid,
    guestUid: null,
    hostName: user.displayName || user.email || "Entrenador",
    guestName: null,
    hostSquad: cleanFirestore(squad),
    guestSquad: null,
    code,
    privateRoom: !!privateRoom,
    status: "waiting",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await initializeRealtimeRoom(roomId);

  if (privateRoom) {
    status("Sala privada creada. Comparte este código con tu rival.");
    roomInfo(`CÓDIGO DE SALA: ${code}`);
  } else {
    status("Buscando rival… No cierres esta pantalla.");
  }

  const cancel = $("pvpCancelBtn");
  if (cancel) cancel.style.display = "inline-block";
  listenAsHost();
}

function listenAsHost() {
  if (!roomId) return;

  stopRoom?.();
  stopRoom = onSnapshot(doc(db, "pvpRooms", roomId), snap => {
    if (!snap.exists()) {
      status("La sala ya no existe.");
      return;
    }

    const room = snap.data();

    if (room.status === "waiting") return;

    if (room.status === "active" && !pvpActive) {
      status("¡Rival encontrado! Preparando el partido…");
      window.__pvpStartHost?.(room.guestSquad, roomId);
      pvpActive = true;
      startHostLoops();
      listenForGuestData();
      status("Partida JcJ en curso. ¡A jugar!");
    }

    if (room.status === "finished") handleFinished(room);

    if (room.status === "cancelled") {
      clearLoops();
      pvpActive = false;
      window.__pvpAbort?.();
      status("La sala se ha cerrado.");
    }
  }, error => status(`Error de conexión JcJ: ${error.message}`));
}

function listenForGuestData() {
  if (!roomId || !realtimeDb) return;

  stopRtdbInput?.();
  stopRtdbActions?.();

  stopRtdbInput = rtdbOnValue(realtimeRoomPath("guestInput"), snapshot => {
    if (!pvpActive || roomRole !== "host") return;
    window.__pvpSetRemoteInput?.(snapshot.val() || { x: 0, y: 0, sprint: false });
  }, error => console.error("Error recibiendo los controles del invitado:", error));

  stopRtdbActions = rtdbOnValue(realtimeRoomPath("guestAction"), snapshot => {
    if (!pvpActive || roomRole !== "host") return;
    const data = snapshot.val();
    if (!data || !data.action) return;

    const seq = Number(data.seq || 0);
    if (seq <= lastActionSeq) return;
    lastActionSeq = seq;
    window.__pvpDoAction?.(data.action);
  }, error => console.error("Error recibiendo acciones del invitado:", error));
}

function startHostLoops() {
  clearLoops();
  if (!realtimeDb) {
    status("Realtime Database no está inicializada. Revisa auth.js y firebase-config.js.");
    return;
  }

  // 15 actualizaciones por segundo. Evita acumular escrituras si la red va lenta.
  stateTimer = setInterval(async () => {
    if (!roomId || roomRole !== "host" || !pvpActive || stateWriteInFlight) return;

    const state = window.__pvpGetState?.();
    if (!state) return;

    stateWriteInFlight = true;
    try {
      await rtdbSet(realtimeRoomPath("state"), cleanRealtime({
        ...state,
        seq: ++hostStateSeq,
        sentAt: Date.now()
      }));
    } catch (error) {
      console.warn("No se pudo sincronizar el partido:", error);
    } finally {
      stateWriteInFlight = false;
    }
  }, 66);
}

async function joinRoom(roomIdToJoin) {
  const user = currentUser();
  if (!user) return status("Inicia sesión antes de jugar online.");

  const squad = careerSquad();
  if (!validSquad(squad)) return status("Tu plantilla titular no está completa. Revisa el equipo.");
  if (!realtimeDb) throw new Error("Realtime Database no está inicializada. Revisa auth.js y firebase-config.js.");

  roomId = roomIdToJoin;
  roomRole = "guest";
  window.__pvpGuestMode = true;

  const kickoffButton = document.querySelector(".startKickoffBtn");
  if (kickoffButton) kickoffButton.style.display = "none";

  await runTransaction(db, async tx => {
    const roomRef = doc(db, "pvpRooms", roomId);
    const latest = await tx.get(roomRef);
    if (!latest.exists()) throw new Error("La sala ya no existe.");

    const fresh = latest.data();
    if (fresh.status !== "waiting" || fresh.guestUid) {
      throw new Error("La sala ya está ocupada o la partida ha comenzado.");
    }
    if (fresh.hostUid === user.uid) throw new Error("No puedes unirte a tu propia sala.");

    tx.update(roomRef, {
      guestUid: user.uid,
      guestName: user.displayName || user.email || "Entrenador",
      guestSquad: cleanFirestore(squad),
      status: "active",
      updatedAt: serverTimestamp()
    });
  });

  if (queueId) {
    try { await deleteDoc(doc(db, "pvpQueue", queueId)); } catch (_) {}
  }

  status("¡Conectado! Esperando la sincronización del partido…");
  showPvpMatch();
  listenAsGuest();
}

function listenAsGuest() {
  if (!roomId || !realtimeDb) {
    status("No se ha podido conectar con Realtime Database.");
    return;
  }

  stopRoom?.();
  stopRoom = onSnapshot(doc(db, "pvpRooms", roomId), snap => {
    if (!snap.exists()) {
      status("El anfitrión ha cerrado la sala.");
      return;
    }

    const room = snap.data();
    if (room.status === "finished") handleFinished(room);
    if (room.status === "cancelled") {
      clearLoops();
      pvpActive = false;
      window.__pvpAbort?.();
      status("La partida ha sido cancelada.");
    }
  }, error => status(`Error de conexión JcJ: ${error.message}`));

  stopRtdbState?.();
  stopRtdbState = rtdbOnValue(realtimeRoomPath("state"), snapshot => {
    if (!pvpActive || roomRole !== "guest") return;

    const state = snapshot.val();
    if (!state || !Array.isArray(state.players)) return;

    const seq = Number(state.seq || 0);
    if (seq <= lastStateSeq) return;
    lastStateSeq = seq;

    window.__pvpApplyState?.(state);
    status("Partida JcJ en curso. ¡A jugar!");
  }, error => {
    console.error("Error recibiendo el estado del partido:", error);
    status(`Error de sincronización: ${error.message}`);
  });

  clearLoops();
  inputTimer = setInterval(async () => {
    if (!roomId || roomRole !== "guest" || !pvpActive || inputWriteInFlight) return;

    const joystick = window.__getPvpInput?.() || { x: 0, y: 0, sprint: false };
    inputWriteInFlight = true;

    try {
      await rtdbSet(realtimeRoomPath("guestInput"), cleanRealtime({
        x: Number(joystick.x) || 0,
        y: Number(joystick.y) || 0,
        sprint: !!joystick.sprint,
        sentAt: Date.now()
      }));

      if (pendingAction) {
        const action = pendingAction;
        pendingAction = null;
        await rtdbSet(realtimeRoomPath("guestAction"), {
          action,
          seq: ++actionSeq,
          sentAt: Date.now()
        });
      }
    } catch (error) {
      console.warn("No se pudo enviar el control JcJ:", error);
    } finally {
      inputWriteInFlight = false;
    }
  }, 50);
}

function handleFinished(room) {
  clearLoops();
  status(`Partida terminada: ${room.result?.home ?? "?"} - ${room.result?.away ?? "?"}.`);

  if (lastAwardedRoom !== roomId) {
    lastAwardedRoom = roomId;

    if (roomRole === "guest") {
      const home = Number(room.result?.away || 0);
      const away = Number(room.result?.home || 0);
      const reward = home > away ? 100 : home === away ? 70 : 50;
      if (typeof window.__pvpAddCoins === "function") window.__pvpAddCoins(reward);
    }

    if (typeof window.__pvpAddTicket === "function") window.__pvpAddTicket();
  }

  roomInfo("🎟️ Has recibido 1 ticket por participar en el JcJ.");
}

window.__pvpSendAction = action => {
  if (roomRole === "guest" && pvpActive) pendingAction = action;
};

window.__pvpFinishMatch = async (home, away) => {
  if (roomRole !== "host" || !roomId) return;
  try {
    await updateDoc(doc(db, "pvpRooms", roomId), {
      status: "finished",
      result: { home, away },
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("No se pudo cerrar la partida JcJ:", error);
  }
};

window.__getPvpInput = () => ({
  x: -(window.__gameJoystick?.x || 0),
  y: window.__gameJoystick?.y || 0,
  sprint: !!window.__pvpGuestSprint
});

$("pvpQuickBtn")?.addEventListener("click", async () => {
  try {
    if (roomId || queueId) return status("Ya estás buscando o jugando una partida JcJ.");

    const user = currentUser();
    if (!user) return status("Inicia sesión antes de jugar online.");

    const squad = careerSquad();
    if (!validSquad(squad)) return status("Tu plantilla titular no está completa. Revisa el equipo.");

    if (!realtimeDb) return status("Realtime Database no está inicializada. Revisa auth.js y firebase-config.js.");

    resetPvp();
    queueId = user.uid;
    await setDoc(doc(db, "pvpQueue", queueId), {
      uid: user.uid,
      name: user.displayName || user.email || "Entrenador",
      squad: cleanFirestore(squad),
      status: "waiting",
      createdAt: serverTimestamp()
    });

    status("Buscando un entrenador disponible…");

    stopQueue = onSnapshot(doc(db, "pvpQueue", queueId), async snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.status !== "matched" || !data.roomId) return;

      stopQueue?.();
      stopQueue = null;

      try {
        const roomSnap = await getDoc(doc(db, "pvpRooms", data.roomId));
        if (!roomSnap.exists()) return status("La sala creada ya no existe.");

        const room = roomSnap.data();
        if (room.hostUid === user.uid) {
          roomId = data.roomId;
          roomRole = "host";
          status("¡Rival encontrado! Preparando el partido…");
          listenAsHost();
        } else if (room.guestUid === user.uid && room.status === "active") {
          roomId = data.roomId;
          roomRole = "guest";
          window.__pvpGuestMode = true;
          const kickoffButton = document.querySelector(".startKickoffBtn");
          if (kickoffButton) kickoffButton.style.display = "none";
          showPvpMatch();
          status("¡Rival encontrado! Conectando los dos equipos…");
          listenAsGuest();
          try { await deleteDoc(doc(db, "pvpQueue", user.uid)); } catch (_) {}
        }
      } catch (error) {
        console.error("No se pudo abrir la sala encontrada:", error);
        status(`No se pudo conectar con el rival: ${error.message}`);
      }
    });

    const candidates = await getDocs(query(
      collection(db, "pvpQueue"),
      where("status", "==", "waiting")
    ));

    for (const candidate of candidates.docs) {
      if (candidate.id === user.uid) continue;

      const other = candidate.data();
      const newRoomId = doc(collection(db, "pvpRooms")).id;

      await setDoc(doc(db, "pvpRooms", newRoomId), {
        hostUid: user.uid,
        guestUid: other.uid,
        hostName: user.displayName || user.email || "Entrenador",
        guestName: other.name || "Entrenador",
        hostSquad: cleanFirestore(careerSquad()),
        guestSquad: cleanFirestore(other.squad),
        code: null,
        privateRoom: false,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await initializeRealtimeRoom(newRoomId);

      let claimed = false;
      await runTransaction(db, async tx => {
        const queueRef = doc(db, "pvpQueue", candidate.id);
        const latest = await tx.get(queueRef);
        if (latest.exists() && latest.data().status === "waiting") {
          tx.update(queueRef, {
            status: "matched",
            roomId: newRoomId,
            matchedBy: user.uid
          });
          claimed = true;
        }
      });

      if (claimed) {
        if (stopQueue) stopQueue();
        stopQueue = null;

        await updateDoc(doc(db, "pvpQueue", user.uid), {
          status: "matched",
          roomId: newRoomId
        });
        try { await deleteDoc(doc(db, "pvpQueue", user.uid)); } catch (_) {}

        roomId = newRoomId;
        roomRole = "host";
        listenAsHost();
        status("¡Rival encontrado! Preparando el partido…");
        return;
      }

      await deleteDoc(doc(db, "pvpRooms", newRoomId));
      try { await rtdbSet(rtdbRef(realtimeDb, `pvpRooms/${newRoomId}`), null); } catch (_) {}
    }
  } catch (error) {
    console.error(error);
    status(`No se pudo buscar partida: ${error.message}`);
  }
});

$("pvpCreateBtn")?.addEventListener("click", async () => {
  try {
    await createRoom(true);
  } catch (error) {
    console.error("Error al crear la sala privada:", error);
    status(`No se pudo crear la sala: ${error.message || "Error de Firestore/Realtime Database"}`);
  }
});

$("pvpJoinBtn")?.addEventListener("click", async () => {
  try {
    const codeInput = $("pvpCode");
    const code = codeInput?.value.trim() || "";
    if (!/^\d{6}$/.test(code)) return status("Escribe un código de sala de 6 cifras.");

    const user = currentUser();
    if (!user) return status("Inicia sesión antes de jugar online.");

    const matches = await getDocs(query(
      collection(db, "pvpRooms"),
      where("code", "==", String(code))
    ));

    if (matches.empty) return status("No existe ninguna sala disponible con ese código.");

    const found = matches.docs.find(item => {
      const data = item.data();
      return data.privateRoom === true && data.status === "waiting" && !data.guestUid;
    });

    if (!found) return status("La sala no existe, ya está ocupada o la partida ha comenzado.");
    await joinRoom(found.id);
  } catch (error) {
    console.error("Error al unirse a la sala privada:", error);
    status(`No se pudo entrar en la sala: ${error.message || "Error de Firestore/Realtime Database"}`);
  }
});

$("pvpCancelBtn")?.addEventListener("click", async () => {
  const oldRoom = roomId;
  const oldQueue = queueId;
  resetPvp();

  try {
    if (oldRoom) {
      await updateDoc(doc(db, "pvpRooms", oldRoom), {
        status: "cancelled",
        updatedAt: serverTimestamp()
      });
    }
    if (oldQueue) await deleteDoc(doc(db, "pvpQueue", oldQueue));
  } catch (error) {
    console.warn("No se pudo cerrar la sala JcJ:", error);
  }

  status("Has salido del modo JcJ.");
  if (typeof window.showTab === "function") window.showTab("mainMenu", $("navHome"));
});

// El motor de juego lee estos controles para mover al equipo del invitado.
