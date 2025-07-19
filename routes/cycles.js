const express = require("express");
const router = express.Router();
const cycleController = require("../controllers/cycleController");

// POST /api/cycles - Crear nuevo ciclo
router.post("/", cycleController.createCycle);

// GET /api/cycles/:userId - Obtener ciclos de usuario
router.get("/:userId", cycleController.getUserCycles);

// GET /api/cycles/predictions/:userId - Obtener predicciones
router.get("/predictions/:userId", cycleController.getPredictions);

module.exports = router;
