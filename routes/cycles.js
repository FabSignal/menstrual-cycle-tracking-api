const express = require("express");
const router = express.Router();
const cycleController = require("../controllers/cycleController");

router.post("/", cycleController.createCycle);
router.get("/:userId", cycleController.getUserCycles);
router.get("/predictions/:userId", cycleController.getPredictions);

module.exports = router;
