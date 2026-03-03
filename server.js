require("dotenv").config();

const express = require("express");
const session = require("express-session");
const { Pool } = require("pg");
const path = require("path");

const app = express();

// ==========================
// CONFIG GENERAL
// ==========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: "digitalpets_secret",
    resave: false,
    saveUninitialized: false
}));

// ==========================
// CONEXIÓN RENDER
// ==========================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ==========================
// CREAR TABLAS AUTOMÁTICO
// ==========================

async function crearTablas() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100),
            correo VARCHAR(150) UNIQUE,
            telefono VARCHAR(20),
            direccion TEXT,
            password VARCHAR(100),
            rol VARCHAR(20) DEFAULT 'cliente'
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS mascotas (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100),
            especie VARCHAR(50),
            edad INT,
            usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS citas (
            id SERIAL PRIMARY KEY,
            fecha DATE,
            hora TIME,
            motivo TEXT,
            estado VARCHAR(30) DEFAULT 'pendiente',
            mascota_id INT REFERENCES mascotas(id) ON DELETE CASCADE
        );
    `);

    console.log("Tablas listas ✅");
}

crearTablas();

// ==========================
// REGISTRO
// ==========================

app.post("/registro", async (req, res) => {
    const { nombre, correo, telefono, direccion, password } = req.body;

    try {
        await pool.query(
            "INSERT INTO usuarios (nombre, correo, telefono, direccion, password) VALUES ($1,$2,$3,$4,$5)",
            [nombre, correo, telefono, direccion, password]
        );
        res.redirect("/login.html");
    } catch (err) {
        console.error(err);
        res.send("Error al registrar");
    }
});

// ==========================
// LOGIN
// ==========================

app.post("/login", async (req, res) => {
    const { correo, password } = req.body;

    const result = await pool.query(
        "SELECT * FROM usuarios WHERE correo=$1 AND password=$2",
        [correo, password]
    );

    if (result.rows.length === 0) {
        return res.send("Credenciales incorrectas");
    }

    req.session.usuario = result.rows[0];

    if (result.rows[0].rol === "admin") {
        res.redirect("/admin.html");
    } else {
        res.redirect("/perfil.html");
    }
});

// ==========================
// CREAR MASCOTA
// ==========================

app.post("/crear-mascota", async (req, res) => {
    if (!req.session.usuario) return res.redirect("/login.html");

    const { nombre, especie, edad } = req.body;

    await pool.query(
        "INSERT INTO mascotas (nombre, especie, edad, usuario_id) VALUES ($1,$2,$3,$4)",
        [nombre, especie, edad, req.session.usuario.id]
    );

    res.redirect("/perfil.html");
});

// ==========================
// CREAR CITA
// ==========================

app.post("/crear-cita", async (req, res) => {
    if (!req.session.usuario) return res.redirect("/login.html");

    const { mascota_id, fecha, hora, motivo } = req.body;

    await pool.query(
        "INSERT INTO citas (fecha, hora, motivo, mascota_id) VALUES ($1,$2,$3,$4)",
        [fecha, hora, motivo, mascota_id]
    );

    res.redirect("/citas.html");
});

// ==========================
// VER CITAS ADMIN
// ==========================

app.get("/admin-citas", async (req, res) => {
    const result = await pool.query(`
        SELECT c.*, m.nombre AS mascota
        FROM citas c
        JOIN mascotas m ON c.mascota_id = m.id
    `);

    res.json(result.rows);
});

// ==========================
// LOGOUT
// ==========================

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login.html");
    });
});

// ==========================
// PUERTO RENDER
// ==========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto", PORT);
});