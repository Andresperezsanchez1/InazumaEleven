import {
  collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc,
  onSnapshot, deleteDoc, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const db = window.__firebaseDb;
const $ = id => document.getElementById(id);
let roomId = null;
let roomRole = null;
let stopRoom = null;
let stopQueue = null;
let stateTimer = null;
let inputTimer = null;
let queueId = null;
let lastActionSeq = 0;
let actionSeq = 0;
let lastAwardedRoom = null;
let pendingAction = null;
let pvpActive = false;

function status(text) { const el = $("pvpStatus"); if (el) el.textContent = text; }
function cleanFirestore(value) {
  if (Array.isArray(value)) return value.map(cleanFirestore);
  if (value && typeof value === "object") {
    const out = {};
    Object.entries(value).forEach(([key, val]) => { if (val !== undefined && typeof val !== "function") out[key] = cleanFirestore(val); });
    return out;
  }
  return value;
}
function roomInfo(text) { const el = $("pvpRoomInfo"); if (el) { el.style.display = "block"; el.textContent = text; } }
function currentUser() { return window.__getFirebaseUser?.() || null; }
function careerSquad() {
  const data = window.__getCareerSnapshot?.();
  return Array.isArray(data?.squad) ? data.squad.slice(0, 5).map(p => ({
    id: p.id || null, name: p.name, role: p.role, rating: p.rating, speed: p.speed,
    shot: p.shot, maxPt: p.maxPt, pt: p.pt, ptCost: p.ptCost, techName: p.techName,
    techType: p.techType, techniques: p.techniques || [], selectedTechniqueName: p.selectedTechniqueName,
    equippedTechniques: p.equippedTechniques || [], team: p.team, emoji: p.emoji, image: p.image || null
  })) : [];
}
function showPvpMatch() {
  const nav = $("navPvp");
  if (typeof window.showTab === "function") window.showTab("match", $("navMatch"));
  if (nav) nav.classList.remove("active");
  pvpActive = true;
  $("pvpCancelBtn").style.display = "inline-block";
}
function clearLoops() {
  if (stateTimer) clearInterval(stateTimer); stateTimer = null;
  if (inputTimer) clearInterval(inputTimer); inputTimer = null;
}
function stopListening() {
  if (stopRoom) stopRoom(); stopRoom = null;
  if (stopQueue) stopQueue(); stopQueue = null;
  clearLoops();
}
function resetPvp() {
  stopListening();
  pvpActive = false; roomId = null; roomRole = null; queueId = null;
  window.__pvpReset?.();
  $("pvpCancelBtn").style.display = "none";
  $("pvpRoomInfo").style.display = "none";
}
function makeRoomCode() { return String(Math.floor(100000 + Math.random() * 900000)); }
function validSquad(squad) { return Array.isArray(squad) && squad.length >= 5 && ["POR","DEF","MC","DEL","DEL"].every((r,i) => squad[i]?.role === r); }

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
    hostUid: user.uid, guestUid: null, hostName: user.displayName || user.email || "Entrenador",
    guestName: null, hostSquad: squad, guestSquad: null, code, privateRoom,
    status: "waiting", createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    guestInput: { x: 0, y: 0, sprint: false }, guestAction: null, guestActionSeq: 0, state: null
  });
  if (privateRoom) {
    status("Sala privada creada. Comparte este código con tu rival.");
    roomInfo(`CÓDIGO DE SALA: ${code}`);
  } else status("Buscando rival… No cierres esta pantalla.");
  $("pvpCancelBtn").style.display = "inline-block";
  listenAsHost();
}

function listenAsHost() {
  if (!roomId) return;
  stopRoom = onSnapshot(doc(db, "pvpRooms", roomId), async snap => {
    if (!snap.exists()) return status("La sala ya no existe.");
    const room = snap.data();
    if (room.status === "waiting") return;
    if (room.status === "active" && !pvpActive) {
      status("¡Rival encontrado! Preparando el partido…");
      window.__pvpStartHost?.(room.guestSquad, roomId);
      pvpActive = true;
      startHostLoops();
      status("Partida JcJ en curso. ¡A jugar!");
    }
    if (room.status === "active" && pvpActive) {
      const seq = Number(room.guestActionSeq || 0);
      if (seq > lastActionSeq && room.guestAction) {
        lastActionSeq = seq;
        window.__pvpDoAction?.(room.guestAction);
      }
      window.__pvpSetRemoteInput?.(room.guestInput || {});
    }
    if (room.status === "finished") handleFinished(room);
    if (room.status === "cancelled") { clearLoops(); pvpActive = false; window.__pvpAbort?.(); status("La sala se ha cerrado."); }
  }, error => status(`Error de conexión JcJ: ${error.message}`));
}

function startHostLoops() {
  clearLoops();
  stateTimer = setInterval(async () => {
    if (!roomId || roomRole !== "host" || !pvpActive) return;
    const state = window.__pvpGetState?.();
    if (!state) return;
    try { await updateDoc(doc(db, "pvpRooms", roomId), { state: cleanFirestore(state), updatedAt: serverTimestamp() }); }
    catch (e) { console.warn("No se pudo sincronizar el partido", e); }
  }, 110);
}

async function joinRoom(roomIdToJoin, room) {
  const user = currentUser();
  if (!user) return status("Inicia sesión antes de jugar online.");
  const squad = careerSquad();
  if (!validSquad(squad)) return status("Tu plantilla titular no está completa. Revisa el equipo.");
  roomId = roomIdToJoin;
  roomRole = "guest";
  window.__pvpGuestMode = true;
  const kickoffButton = document.querySelector(".startKickoffBtn"); if (kickoffButton) kickoffButton.style.display = "none";
  await updateDoc(doc(db, "pvpRooms", roomId), {
    guestUid: user.uid, guestName: user.displayName || user.email || "Entrenador",
    guestSquad: squad, status: "active", updatedAt: serverTimestamp()
  });
  if (queueId) { try { await deleteDoc(doc(db, "pvpQueue", queueId)); } catch (_) {} }
  status("¡Conectado! Esperando la sincronización del partido…");
  showPvpMatch();
  listenAsGuest();
}

function listenAsGuest() {
  stopRoom = onSnapshot(doc(db, "pvpRooms", roomId), snap => {
    if (!snap.exists()) return status("El anfitrión ha cerrado la sala.");
    const room = snap.data();
    if (room.status === "active" && room.state) {
      window.__pvpApplyState?.(room.state);
      status("Partida JcJ en curso. ¡A jugar!");
    }
    if (room.status === "finished") handleFinished(room);
    if (room.status === "cancelled") { clearLoops(); pvpActive = false; window.__pvpAbort?.(); status("La partida ha sido cancelada."); }
  }, error => status(`Error de conexión JcJ: ${error.message}`));
  inputTimer = setInterval(async () => {
    if (!roomId || roomRole !== "guest" || !pvpActive) return;
    const joystick = window.__getPvpInput?.() || { x: 0, y: 0, sprint: false };
    const update = { guestInput: joystick, updatedAt: serverTimestamp() };
    if (pendingAction) {
      update.guestAction = pendingAction;
      update.guestActionSeq = ++actionSeq;
      pendingAction = null;
    }
    try { await updateDoc(doc(db, "pvpRooms", roomId), update); }
    catch (e) { console.warn("No se pudo enviar el control JcJ", e); }
  }, 100);
}

function handleFinished(room) {
  clearLoops();
  status(`Partida terminada: ${room.result?.home ?? "?"} - ${room.result?.away ?? "?"}.`);
  if (lastAwardedRoom !== roomId) {
    lastAwardedRoom = roomId;
    // Un ticket y monedas de participación para cada entrenador.
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

window.__pvpSendAction = action => { if (roomRole === "guest" && pvpActive) pendingAction = action; };
window.__pvpFinishMatch = async (home, away) => {
  if (roomRole !== "host" || !roomId) return;
  try { await updateDoc(doc(db, "pvpRooms", roomId), { status: "finished", result: { home, away }, updatedAt: serverTimestamp() }); }
  catch (e) { console.error("No se pudo cerrar la partida JcJ", e); }
};
window.__getPvpInput = () => ({ x: -(window.__gameJoystick?.x || 0), y: window.__gameJoystick?.y || 0, sprint: !!window.__pvpGuestSprint });

$("pvpQuickBtn")?.addEventListener("click", async () => {
  try {
    const user = currentUser();
    if (!user) return status("Inicia sesión antes de jugar online.");
    resetPvp();
    queueId = user.uid;
    await setDoc(doc(db, "pvpQueue", queueId), { uid: user.uid, name: user.displayName || user.email || "Entrenador", squad: careerSquad(), status: "waiting", createdAt: serverTimestamp() });
    status("Buscando un entrenador disponible…");
    stopQueue = onSnapshot(doc(db, "pvpQueue", queueId), async snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.status === "matched" && data.roomId) {
        stopQueue?.(); stopQueue = null;
        const roomSnap = await getDoc(doc(db, "pvpRooms", data.roomId));
        if (roomSnap.exists()) {
          const room = roomSnap.data();
          if (room.hostUid === user.uid) { roomId = data.roomId; roomRole = "host"; listenAsHost(); }
          else await joinRoom(data.roomId, room);
        }
      }
    });
    const candidates = await getDocs(query(collection(db, "pvpQueue"), where("status", "==", "waiting")));
    for (const candidate of candidates.docs) {
      if (candidate.id === user.uid) continue;
      const other = candidate.data();
      const newRoomId = doc(collection(db, "pvpRooms")).id;
      await setDoc(doc(db, "pvpRooms", newRoomId), {
        hostUid: user.uid, guestUid: other.uid, hostName: user.displayName || user.email || "Entrenador",
        guestName: other.name || "Entrenador", hostSquad: careerSquad(), guestSquad: other.squad,
        code: null, privateRoom: false, status: "active", createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        guestInput: { x: 0, y: 0, sprint: false }, guestAction: null, guestActionSeq: 0, state: null
      });
      let claimed = false;
      await runTransaction(db, async tx => {
        const ref = doc(db, "pvpQueue", candidate.id);
        const latest = await tx.get(ref);
        if (latest.exists() && latest.data().status === "waiting") {
          tx.update(ref, { status: "matched", roomId: newRoomId, matchedBy: user.uid });
          claimed = true;
        }
      });
      if (claimed) {
        if (stopQueue) stopQueue(); stopQueue = null;
        await updateDoc(doc(db, "pvpQueue", user.uid), { status: "matched", roomId: newRoomId });
        roomId = newRoomId; roomRole = "host"; listenAsHost();
        status("¡Rival encontrado! Preparando el partido…");
        return;
      }
      await deleteDoc(doc(db, "pvpRooms", newRoomId));
    }
  } catch (error) { console.error(error); status(`No se pudo buscar partida: ${error.message}`); }
});

$("pvpCreateBtn")?.addEventListener("click", async () => {
  try { await createRoom(true); } catch (e) { status(`No se pudo crear la sala: ${e.message}`); }
});
$("pvpJoinBtn")?.addEventListener("click", async () => {
  try {
    const code = $("pvpCode").value.trim();
    if (!/^\d{6}$/.test(code)) return status("Escribe un código de sala de 6 cifras.");
    const matches = await getDocs(query(collection(db, "pvpRooms"), where("code", "==", code)));
    if (matches.empty) return status("No existe ninguna sala disponible con ese código.");
    const found = matches.docs.find(item => item.data().status === "waiting");
    if (!found) return status("No existe ninguna sala disponible con ese código.");
    const room = found.data();
    if (room.hostUid === currentUser()?.uid) return status("No puedes unirte a tu propia sala.");
    await joinRoom(found.id, room);
  } catch (e) { status(`No se pudo entrar en la sala: ${e.message}`); }
});
$("pvpCancelBtn")?.addEventListener("click", async () => {
  const oldRoom = roomId, oldQueue = queueId, role = roomRole;
  resetPvp();
  try {
    if (oldRoom) await updateDoc(doc(db, "pvpRooms", oldRoom), { status: "cancelled", updatedAt: serverTimestamp() });
    if (oldQueue) await deleteDoc(doc(db, "pvpQueue", oldQueue));
  } catch (_) {}
  status("Has salido del modo JcJ.");
  if (typeof window.showTab === "function") window.showTab("mainMenu", $("navHome"));
});

// Expone el estado del joystick y sprint del motor clásico sin acoplarlo al módulo Firebase.
