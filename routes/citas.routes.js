const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// CREAR CITA
router.post("/crear", async (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({ error: "No autorizado" });
    }

    const { mascota_id, fecha, hora, motivo } = req.body;

    try {
        await pool.query(
            "INSERT INTO citas (usuario_id, mascota_id, fecha, hora, motivo) VALUES ($1,$2,$3,$4,$5)",
            [
                req.session.usuario.id,
                mascota_id,
                fecha,
                hora,
                motivo
            ]
        );

        res.json({ success: true });

    } catch (error) {
        res.status(500).json({ error: "Error al crear cita" });
    }
});

module.exports = router;