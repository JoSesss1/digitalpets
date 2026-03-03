require("dotenv").config();

const express = require("express");
const session = require("express-session");
const { Pool } = require("pg");
const path = require("path");

const app = express();

// ==========================
// CONFIGURACIÓN GENERAL
// ==========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: process.env.SESSION_SECRET || "digitalpets_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// ==========================
// CONEXIÓN A POSTGRESQL (PRODUCCIÓN)
// ==========================

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

// ==========================
// RUTA DE PRUEBA
// ==========================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================
// LOGIN
// ==========================

app.post("/api/auth/login", async (req, res) => {
    const { correo, password } = req.body;

    try {
        const result = await pool.query(
            "SELECT * FROM usuarios WHERE correo = $1 AND password = $2",
            [correo, password]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false });
        }

        req.session.usuario = result.rows[0];

        res.json({
            success: true,
            rol: result.rows[0].rol
        });

    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// ==========================
// LOGOUT
// ==========================

app.get("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

// ==========================
// VERIFICAR SESIÓN
// ==========================

app.get("/api/auth/verificar", (req, res) => {
    if (!req.session.usuario) {
        return res.json({ autenticado: false });
    }
    res.json({ autenticado: true, usuario: req.session.usuario });
});

// ==========================
// PUERTO DINÁMICO
// ==========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto", PORT);
});