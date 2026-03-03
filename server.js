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

async function crearTablas() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        correo VARCHAR(150) UNIQUE NOT NULL,
        telefono VARCHAR(20),
        direccion TEXT,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(20) DEFAULT 'cliente',
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mascotas (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        especie VARCHAR(50) NOT NULL,
        raza VARCHAR(100),
        edad INT,
        peso DECIMAL(5,2),
        usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS citas (
        id SERIAL PRIMARY KEY,
        mascota_id INT REFERENCES mascotas(id) ON DELETE CASCADE,
        fecha DATE NOT NULL,
        hora TIME NOT NULL,
        motivo TEXT NOT NULL,
        estado VARCHAR(30) DEFAULT 'pendiente',
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Tablas verificadas correctamente ✅");
  } catch (error) {
    console.error("Error creando tablas:", error);
  }
}
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
app.get("/hacer-admin", async (req, res) => {
  await pool.query(
    "UPDATE usuarios SET rol='admin' WHERE correo=$1",
    [""]
  );

  res.send("Usuario convertido en admin");
});
crearTablas();