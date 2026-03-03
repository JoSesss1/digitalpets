require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const citasRoutes = require("./routes/citas.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/admin", adminRoutes);

app.listen(process.env.PORT, () => {
    console.log("Servidor corriendo en http://localhost:" + process.env.PORT);
});