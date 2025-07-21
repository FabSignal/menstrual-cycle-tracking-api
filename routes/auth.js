// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Registro de nueva usuaria
router.post("/register", authController.register);

// Login de usuaria existente
router.post("/login", authController.login);

module.exports = router;
