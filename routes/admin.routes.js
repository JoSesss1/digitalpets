const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/verificar", (req, res) => {
    if (!req.session.usuario || req.session.usuario.rol !== "admin") {
        return res.status(401).json({ autorizado: false });
    }
    res.json({ autorizado: true });
});

// VER TODAS LAS CITAS
router.get("/citas", async (req, res) => {

    if (!req.session.usuario || req.session.usuario.rol !== "admin") {
        return res.status(401).json({ error: "No autorizado" });
    }

    try {
        const result = await pool.query(`
            SELECT c.id, m.nombre AS mascota, c.fecha, c.hora, c.motivo, c.estado
            FROM citas c
            JOIN mascotas m ON c.mascota_id = m.id
            ORDER BY c.fecha
        `);

        res.json(result.rows);

    } catch (error) {
        res.status(500).json({ error: "Error al obtener citas" });
    }
});

module.exports = router;