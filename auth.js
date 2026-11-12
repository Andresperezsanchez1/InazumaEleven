import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, GoogleAuthProvider, signInWithRedirect,
  getRedirectResult, sendPasswordResetEmail, signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const $ = id => document.getElementById(id);
const authScreen = $("authScreen");
const appScreen = $("app");
const authForm = $("authForm");
const authMessage = $("authMessage");
const submitBtn = $("authSubmitBtn");
let authMode = "login";
let auth = null;
let db = null;
let loadedUid = null;
let saveQueue = Promise.resolve();
let gameScriptsLoaded = false;

function setMessage(message, kind = "info") {
  authMessage.textContent = message;
  authMessage.dataset.kind = kind;
}
function setBusy(busy, message = "Conectando...") {
  [submitBtn, $("googleSignInBtn"), $("showLoginBtn"), $("showRegisterBtn")].forEach(b => b.disabled = busy);
  if (busy) setMessage(message);
}
function firebaseConfigured() {
  return firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PEGA_AQUI") &&
    firebaseConfig.authDomain && !firebaseConfig.authDomain.startsWith("PEGA_AQUI") &&
    firebaseConfig.projectId && !firebaseConfig.projectId.startsWith("PEGA_AQUI") &&
    firebaseConfig.appId && !firebaseConfig.appId.startsWith("PEGA_AQUI");
}
function authError(error) {
  const messages = {
    "auth/invalid-email": "El correo electrónico no es válido.",
    "auth/missing-password": "Escribe tu contraseña.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo. Inicia sesión.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "No existe una cuenta con ese correo.",
    "auth/wrong-password": "La contraseña no es correcta.",
    "auth/popup-blocked": "El navegador bloqueó la ventana de Google. Inténtalo otra vez.",
    "auth/unauthorized-domain": "Añade el dominio de esta web a los dominios autorizados de Firebase Authentication.",
    "auth/network-request-failed": "No hay conexión. Comprueba tu internet e inténtalo de nuevo."
  };
  return messages[error?.code] || `No se pudo completar la operación (${error?.code || "error"}).`;
}
function setMode(mode) {
  authMode = mode;
  $("showLoginBtn").classList.toggle("selected", mode === "login");
  $("showRegisterBtn").classList.toggle("selected", mode === "register");
  submitBtn.textContent = mode === "login" ? "ENTRAR" : "CREAR CUENTA";
  $("resetPasswordBtn").style.display = mode === "login" ? "block" : "none";
  $("authPassword").autocomplete = mode === "login" ? "current-password" : "new-password";
  setMessage(mode === "login" ? "Inicia sesión para recuperar tu progreso." : "Crea tu cuenta para empezar a guardar tu equipo.");
}
$("showLoginBtn").addEventListener("click", () => setMode("login"));
$("showRegisterBtn").addEventListener("click", () => setMode("register"));

async function loadClassicScript(src) {
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.body.appendChild(script);
  });
}
async function loadGameForUser(user, career) {
  const key = `inazumaCareerV2_${user.uid}`;
  window.INAZUMA_STORAGE_KEY = key;
  window.saveCareerCloud = data => {
    // Encadena escrituras para que una actualización antigua no sobrescriba otra reciente.
    saveQueue = saveQueue.then(() => setDoc(doc(db, "users", user.uid), {
      email: user.email || null,
      displayName: user.displayName || null,
      career: data,
      updatedAt: serverTimestamp()
    }, { merge: true }));
    return saveQueue;
  };
  window.showCloudSaveWarning = () => {
    const label = $("userLabel");
    if (label) label.title = "No se ha podido sincronizar el último cambio con la nube.";
  };

  if (career) {
    localStorage.setItem(key, JSON.stringify(career));
  } else if (!localStorage.getItem(key)) {
    // Migración: si había una carrera local antigua en este navegador, se importa
    // a la primera cuenta que inicia sesión en él, sin perder equipo ni progreso.
    const legacy = localStorage.getItem("inazumaCareerV2");
    if (legacy) localStorage.setItem(key, legacy);
  }

  $("userLabel").textContent = user.displayName || user.email || "Jugador";
  authScreen.hidden = true;
  appScreen.hidden = false;
  if (!gameScriptsLoaded) {
    try {
      window.__INAZUMA_AUTH_BOOTSTRAP__ = true;
      await loadClassicScript("game.js");
      await loadClassicScript("team.js");
      await loadClassicScript("gacha.js");
      gameScriptsLoaded = true;
      loadedUid = user.uid;
      window.initInazumaGame();
      window.__INAZUMA_AUTH_BOOTSTRAP__ = false;
    } catch (error) {
      appScreen.hidden = true;
      authScreen.hidden = false;
      setMessage(`No se pudieron cargar los archivos del juego: ${error.message}`, "error");
    }
  } else if (loadedUid !== user.uid) {
    // Evita que una segunda cuenta herede en memoria la plantilla de la primera.
    window.location.reload();
  }
  // Crea el documento cloud en cuentas nuevas o sincroniza la carrera migrada.
  if (!career) {
    try {
      const cached = localStorage.getItem(key);
      if (cached) await window.saveCareerCloud(JSON.parse(cached));
    } catch (error) { console.warn("No se pudo crear el perfil inicial", error); }
  }
}

if (!firebaseConfigured()) {
  setMessage("Falta conectar Firebase. Abre firebase-config.js y pega la configuración de tu aplicación web para activar las cuentas.", "error");
  submitBtn.disabled = true;
  $("googleSignInBtn").disabled = true;
} else {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });

    authForm.addEventListener("submit", async event => {
      event.preventDefault();
      const email = $("authEmail").value.trim();
      const password = $("authPassword").value;
      setBusy(true, authMode === "login" ? "Iniciando sesión..." : "Creando cuenta...");
      try {
        if (authMode === "register") await createUserWithEmailAndPassword(auth, email, password);
        else await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        setMessage(authError(error), "error");
      } finally { setBusy(false); }
    });

    $("googleSignInBtn").addEventListener("click", async () => {
      try {
        setBusy(true, "Abriendo el acceso de Google...");
        await signInWithRedirect(auth, googleProvider);
      } catch (error) {
        setBusy(false);
        setMessage(authError(error), "error");
      }
    });

    $("resetPasswordBtn").addEventListener("click", async () => {
      const email = $("authEmail").value.trim();
      if (!email) { setMessage("Escribe tu correo y vuelve a pulsar recuperar contraseña.", "error"); return; }
      try {
        await sendPasswordResetEmail(auth, email);
        setMessage("Te hemos enviado un correo para restablecer la contraseña.", "success");
      } catch (error) { setMessage(authError(error), "error"); }
    });

    $("logoutBtn").addEventListener("click", async () => {
      if (!confirm("¿Quieres cerrar sesión?")) return;
      await signOut(auth);
      window.location.reload();
    });

    getRedirectResult(auth).catch(error => setMessage(authError(error), "error"));
    onAuthStateChanged(auth, async user => {
      if (!user) {
        appScreen.hidden = true;
        authScreen.hidden = false;
        loadedUid = null;
        setMessage("Inicia sesión para jugar. No hay acceso como invitado.");
        return;
      }
      setBusy(true, "Cargando tu equipo guardado...");
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        const career = snapshot.exists() ? snapshot.data().career || null : null;
        await loadGameForUser(user, career);
      } catch (error) {
        appScreen.hidden = true;
        authScreen.hidden = false;
        setMessage(`No se pudo cargar tu partida en la nube: ${error.message}. Comprueba que Firestore esté creado y sus reglas instaladas.`, "error");
      } finally { setBusy(false); }
    });
  } catch (error) {
    setMessage(`Error al conectar Firebase: ${error.message}`, "error");
    submitBtn.disabled = true;
    $("googleSignInBtn").disabled = true;
  }
}
