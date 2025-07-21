const express = require("express");
const router = express.Router();
const cycleController = require("../controllers/cycleController");

// Ruta para crear un nuevo ciclo
router.post("/", cycleController.createCycle);

// Ruta para obtener todos los ciclos de un usuario
router.get("/:userId", cycleController.getUserCycles);

// Ruta para obtener predicciones (DEBE ir ANTES de /:userId para evitar conflictos)
router.get("/predictions/:userId", cycleController.getPredictions);

module.exports = router;
