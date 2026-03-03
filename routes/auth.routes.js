const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ======================
// LOGIN
// ======================
router.post("/login", async (req, res) => {
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

// ======================
// LOGOUT
// ======================
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

// ======================
// VERIFICAR SESIÓN
// ======================
router.get("/verificar", (req, res) => {
    if (!req.session.usuario) {
        return res.json({ autenticado: false });
    }
    res.json({ autenticado: true, usuario: req.session.usuario });
});

module.exports = router;