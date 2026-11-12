import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup,
  sendPasswordResetEmail, signOut
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const authScreen = document.getElementById("authScreen");
const gameApp = document.getElementById("app");
const form = document.getElementById("authForm");
const emailInput = document.getElementById("authEmail");
const passwordInput = document.getElementById("authPassword");
const messageEl = document.getElementById("authMessage");
const submitBtn = document.getElementById("authSubmit");
const loginTab = document.getElementById("authLoginTab");
const registerTab = document.getElementById("authRegisterTab");
let isRegisterMode = false;
let currentUser = null;
window.__firebaseDb = db;
window.__getFirebaseUser = () => currentUser;
let saveTimer = null;
let lastSavedJson = "";

function showMessage(message, success = false) {
  messageEl.textContent = message;
  messageEl.classList.toggle("success", success);
}
function friendlyError(error) {
  const code = error?.code || "";
  const messages = {
    "auth/email-already-in-use": "Ese correo ya tiene una cuenta. Inicia sesión.",
    "auth/invalid-email": "El correo electrónico no es válido.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/user-disabled": "Esta cuenta está deshabilitada.",
    "auth/popup-closed-by-user": "Se cerró la ventana de Google antes de terminar.",
    "auth/popup-blocked": "El navegador bloqueó la ventana. Permite las ventanas emergentes.",
    "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase Authentication.",
    "auth/operation-not-allowed": "Este método de acceso no está habilitado en Firebase Authentication.",
    "auth/network-request-failed": "Error de conexión. Comprueba tu internet e inténtalo de nuevo."
  };
  return messages[code] || "No se pudo completar la operación. Revisa la configuración de Firebase e inténtalo otra vez.";
}
function setMode(register) {
  isRegisterMode = register;
  loginTab.classList.toggle("selected", !register);
  registerTab.classList.toggle("selected", register);
  submitBtn.textContent = register ? "CREAR CUENTA" : "ENTRAR";
  passwordInput.autocomplete = register ? "new-password" : "current-password";
  showMessage("");
}
loginTab.addEventListener("click", () => setMode(false));
registerTab.addEventListener("click", () => setMode(true));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  submitBtn.disabled = true;
  showMessage(isRegisterMode ? "Creando tu cuenta…" : "Iniciando sesión…");
  try {
    if (isRegisterMode) await createUserWithEmailAndPassword(auth, email, password);
    else await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    showMessage(friendlyError(error));
  } finally {
    submitBtn.disabled = false;
  }
});

document.getElementById("authGoogle").addEventListener("click", async () => {
  showMessage("Conectando con Google…");
  try { await signInWithPopup(auth, googleProvider); }
  catch (error) { showMessage(friendlyError(error)); }
});

document.getElementById("authReset").addEventListener("click", async () => {
  const email = emailInput.value.trim();
  if (!email) { showMessage("Escribe tu correo y vuelve a pulsar para recibir el enlace de recuperación."); emailInput.focus(); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    showMessage("Te hemos enviado un correo para restablecer la contraseña.", true);
  } catch (error) { showMessage(friendlyError(error)); }
});

// Se puede llamar desde el menú del juego si se añade un botón de cerrar sesión.
window.inazumaSignOut = () => signOut(auth);
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  if (confirm("¿Quieres cerrar sesión? Tu progreso ya está sincronizado en la nube.")) {
    try { await signOut(auth); } catch (error) { console.error(error); }
  }
});

function showGame(user) {
  currentUser = user;
  authScreen.style.display = "none";
  gameApp.classList.remove("auth-locked");
  gameApp.style.display = "";
  document.body.classList.add("authenticated");
  window.dispatchEvent(new Event("resize"));
}
function showLogin() {
  currentUser = null;
  gameApp.classList.add("auth-locked");
  gameApp.style.display = "none";
  authScreen.style.display = "flex";
}

function isBrandNewAccount(user) {
  // Firebase asigna la misma fecha de creación y último acceso al primer acceso
  // de una cuenta nueva (incluido el primer acceso mediante Google).
  const created = user?.metadata?.creationTime;
  const lastSignIn = user?.metadata?.lastSignInTime;
  return Boolean(created && lastSignIn && created === lastSignIn);
}

async function loadCloudCareer(user) {
  const ref = doc(db, "players", user.uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists() && snapshot.data()?.career) {
    const cloudCareer = snapshot.data().career;
    if (typeof window.__applyCareerSnapshot === "function") {
      window.__applyCareerSnapshot(cloudCareer);
      lastSavedJson = JSON.stringify(cloudCareer);
    }
  } else if (isBrandNewAccount(user) && typeof window.__createFreshCareerSnapshot === "function") {
    // Una cuenta recién creada empieza limpia: nunca hereda todos los personajes
    // que pudieran existir en el almacenamiento local de ese móvil/ordenador.
    const starterCareer = window.__createFreshCareerSnapshot();
    await setDoc(ref, {
      career: starterCareer,
      email: user.email || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    lastSavedJson = JSON.stringify(starterCareer);
  } else {
    // Para cuentas antiguas sin documento, conserva su partida local existente.
    const localCareer = typeof window.__getCareerSnapshot === "function" ? window.__getCareerSnapshot() : null;
    if (localCareer) await setDoc(ref, { career: localCareer, email: user.email || null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    lastSavedJson = JSON.stringify(localCareer || {});
  }
}

window.__firebaseSaveCareer = (careerData) => {
  if (!currentUser || !careerData) return;
  const json = JSON.stringify(careerData);
  if (json === lastSavedJson) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const userAtStart = currentUser;
    if (!userAtStart) return;
    try {
      await setDoc(doc(db, "players", userAtStart.uid), {
        career: careerData,
        email: userAtStart.email || null,
        updatedAt: serverTimestamp()
      }, { merge: true });
      lastSavedJson = json;
    } catch (error) {
      console.error("No se pudo guardar la partida en Firestore:", error);
      showMessage("No se ha podido sincronizar tu partida. Comprueba las reglas de Firestore y tu conexión.");
    }
  }, 700);
};

onAuthStateChanged(auth, async (user) => {
  if (!user) { showLogin(); return; }
  showGame(user);
  showMessage("Cargando tu equipo…");
  try {
    await loadCloudCareer(user);
    showMessage(`Sesión iniciada: ${user.email || "Google"}`, true);
    setTimeout(() => { if (messageEl.textContent.startsWith("Sesión iniciada:")) showMessage(""); }, 3500);
  } catch (error) {
    console.error("Error cargando la partida:", error);
    showMessage("Has iniciado sesión, pero no se pudo cargar Firestore. Revisa las reglas de seguridad.");
  }
});
