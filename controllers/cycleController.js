const Cycle = require("../models/Cycle");
const moment = require("moment");

// Funciones de cálculo (las que proporcionaste)
// Helper: suma días a una fecha
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// 1. Fecha estimada de inicio del próximo período
function getNextPeriod(startDate, cycleLength) {
  return moment(startDate).add(cycleLength, "days").format("YYYY-MM-DD");
}

// 2. Día actual del ciclo
function getCurrentDay(startDate) {
  const today = moment();
  const start = moment(startDate);
  return today.diff(start, "days") + 1;
}

// 3. Estado de ovulación
function getOvulationStatus(startDate, cycleLength) {
  const currentDay = getCurrentDay(startDate);
  const daysToOvulation = 14 - (currentDay % cycleLength);

  if (daysToOvulation > 3) return "Ovulation not soon";
  if (daysToOvulation > 0) return "Ovulation approaching";
  if (daysToOvulation === 0) return "Ovulating today";
  return "Ovulation passed";
}

// 4. Probabilidad de embarazo
function getPregnancyChance(startDate, cycleLength) {
  const currentDay = getCurrentDay(startDate);
  const fertileWindowStart = cycleLength - 18;
  const fertileWindowEnd = cycleLength - 11;

  if (currentDay >= fertileWindowStart && currentDay <= fertileWindowEnd) {
    return "High";
  }
  return "Low";
}

// 5. Días antes del período
function getDaysBeforePeriod(startDate, cycleLength) {
  const currentDay = getCurrentDay(startDate);
  const daysRemaining = cycleLength - currentDay;

  if (daysRemaining <= 0) return "Period started";
  if (daysRemaining <= 3) return "Period starting soon";
  return `${daysRemaining} days until period`;
}

// 6. Fase del ciclo
function getPhase(startDate, cycleLength) {
  const currentDay = getCurrentDay(startDate);

  if (currentDay <= 5) return "Menstruation";
  if (currentDay <= 13) return "Follicular Phase";
  if (currentDay <= 16) return "Ovulation Window";
  return "Luteal Phase";
}

// Función principal para generar predicciones
function generatePredictions(cycles) {
  if (cycles.length < 3) {
    return { status: "insufficient_data" };
  }

  // Calcular promedio de duración del ciclo
  const totalDays = cycles.reduce((sum, cycle) => sum + cycle.duration, 0);
  const avgCycleLength = Math.round(totalDays / cycles.length);

  // Último ciclo registrado
  const lastCycle = cycles[cycles.length - 1];
  const lastStartDate = lastCycle.startDate;

  return {
    nextPeriod: getNextPeriod(lastStartDate, avgCycleLength),
    ovulationStatus: getOvulationStatus(lastStartDate, avgCycleLength),
    pregnancyChance: getPregnancyChance(lastStartDate, avgCycleLength),
    daysBeforePeriod: getDaysBeforePeriod(lastStartDate, avgCycleLength),
    currentPhase: getPhase(lastStartDate, avgCycleLength),
    cycleStatistics: {
      averageLength: avgCycleLength,
      lastPeriod: lastStartDate,
      nextPredicted: getNextPeriod(lastStartDate, avgCycleLength),
    },
  };
}

// Controlador para guardar un ciclo
exports.createCycle = async (req, res) => {
  try {
    const { userId, startDate, duration, symptoms } = req.body;

    const newCycle = new Cycle({
      userId,
      startDate,
      duration,
      symptoms,
    });

    const savedCycle = await newCycle.save();
    res.status(201).json(savedCycle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Controlador para obtener todos los ciclos de un usuario
exports.getUserCycles = async (req, res) => {
  try {
    const { userId } = req.params;
    const cycles = await Cycle.find({ userId }).sort({ startDate: -1 });
    res.json(cycles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controlador para obtener predicciones
exports.getPredictions = async (req, res) => {
  try {
    const { userId } = req.params;
    const cycles = await Cycle.find({ userId }).sort({ startDate: -1 });

    if (cycles.length < 3) {
      return res.json({ status: "insufficient_data" });
    }

    // Convertir a formato compatible con tu función
    const formattedCycles = cycles.map((cycle) => ({
      startDate: moment(cycle.startDate).format("YYYY-MM-DD"),
      duration: cycle.duration,
    }));

    const predictions = generatePredictions(formattedCycles);
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
