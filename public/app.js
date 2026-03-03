// ======================
// VERIFICAR SESIÓN GLOBAL
// ======================
async function verificarSesion() {
    const response = await fetch("/api/auth/verificar");
    return await response.json();
}

// ======================
// BLOQUEAR SI NO HAY SESIÓN
// ======================
async function protegerPagina() {
    const data = await verificarSesion();

    if (!data.autenticado) {
        alert("Debes iniciar sesión para acceder.");
        window.location.href = "/iniciosesion.html";
    }
}

// ======================
// BLOQUEAR LOGIN SI YA HAY SESIÓN
// ======================
async function bloquearLogin() {
    const data = await verificarSesion();

    if (data.autenticado) {
        window.location.href = "/index.html";
    }
}

// ======================
// LOGIN
// ======================
const loginForm = document.getElementById("loginForm");

if (loginForm) {

    bloquearLogin();

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const correo = loginForm.correo.value;
        const password = loginForm.password.value;

        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, password })
        });

        const data = await response.json();

        if (data.success) {
            if (data.rol === "admin") {
                window.location.href = "/admin.html";
            } else {
                window.location.href = "/index.html";
            }
        } else {
            alert("Credenciales incorrectas");
        }
    });
}

// ======================
// LOGOUT
// ======================
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await fetch("/api/auth/logout");
        window.location.href = "/iniciosesion.html";
    });
}

// ======================
// PROTEGER CITAS
// ======================
if (window.location.pathname.includes("citas.html")) {
    protegerPagina();
}

// ======================
// PROTEGER PERFIL
// ======================
if (window.location.pathname.includes("perfil.html")) {
    protegerPagina();
}

// ======================
// PROTEGER ADMIN
// ======================
if (window.location.pathname.includes("admin.html")) {
    protegerPagina();
}