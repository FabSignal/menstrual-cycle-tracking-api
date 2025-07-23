//const Cycle = require("../models/Cycle");
let Cycle;
try {
  Cycle = require("../models/Cycle");
  console.log("✅ Modelo Cycle importado correctamente");
  console.log("Modelo Cycle:", typeof Cycle);
} catch (error) {
  console.error("❌ Error importando modelo Cycle:", error.message);
  console.error("Ruta esperada: ../models/Cycle.js");
  console.error("Directorio actual:", __dirname);
  process.exit(1); // Detener la aplicación si no se puede importar
}
const moment = require("moment");

// Configurar moment en español
moment.locale("es");

console.log("✅ Modelo Cycle importado correctamente en controlador");

// Funciones de cálculo optimizadas
// Helper: suma días a una fecha
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Obtener día actual del ciclo
function getCurrentCycleDay(lastStartDate) {
  const today = new Date();
  const startDate = new Date(lastStartDate);
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Calcular días hasta evento
function getDaysUntilEvent(eventDate) {
  const today = new Date();
  const event = new Date(eventDate);
  const diffTime = event.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Validar que los ciclos son consecutivos (opcional pero recomendado)
function validateConsecutiveCycles(cycles) {
  if (cycles.length < 2) return true;

  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate)
  );

  for (let i = 1; i < sortedCycles.length; i++) {
    const prevEnd = addDays(
      sortedCycles[i - 1].startDate,
      sortedCycles[i - 1].duration
    );
    const currentStart = new Date(sortedCycles[i].startDate);
    const daysBetween = Math.abs(
      (currentStart - prevEnd) / (1000 * 60 * 60 * 24)
    );

    // Si hay más de 45 días entre ciclos, podrían no ser consecutivos
    if (daysBetween > 45) {
      console.warn(`Posible gap entre ciclos: ${daysBetween} días`);
    }
  }
  return true;
}

// Determinar fase del ciclo con mayor precisión
function getCurrentPhase(currentCycleDay, avgCycleLength, avgDuration) {
  const ovulationDay = avgCycleLength - 14; // Ovulación típicamente 14 días antes del próximo período
  const fertileWindowStart = ovulationDay - 5; // Ventana fértil: 5 días antes de ovulación
  const fertileWindowEnd = ovulationDay + 1; // Hasta 1 día después de ovulación

  if (currentCycleDay <= avgDuration) {
    return {
      phase: "menstruation",
      description: "Menstruación",
    };
  } else if (currentCycleDay < fertileWindowStart) {
    return {
      phase: "follicular",
      description: "Fase folicular",
    };
  } else if (
    currentCycleDay >= fertileWindowStart &&
    currentCycleDay <= fertileWindowEnd
  ) {
    return {
      phase: "fertile",
      description: "Ventana fértil",
    };
  } else if (currentCycleDay > fertileWindowEnd) {
    return {
      phase: "luteal",
      description: "Fase lútea",
    };
  } else {
    return {
      phase: "unknown",
      description: "Fase incierta",
    };
  }
}

// Calcular probabilidad de embarazo de forma más responsable
function getPregnancyProbability(currentCycleDay, avgCycleLength) {
  const ovulationDay = avgCycleLength - 14;
  const fertileWindowStart = ovulationDay - 5;
  const fertileWindowEnd = ovulationDay + 1;

  if (
    currentCycleDay >= fertileWindowStart &&
    currentCycleDay <= fertileWindowEnd
  ) {
    return {
      level: "high",
      description: "Alta",
      percentage: "Alta fertilidad",
      message: "Alta probabilidad de quedar embarazada",
    };
  } else if (Math.abs(currentCycleDay - ovulationDay) <= 3) {
    return {
      level: "moderate",
      description: "Media",
      percentage: "Fertilidad moderada",
      message: "Probabilidad de quedar embarazada en aumento",
    };
  } else {
    return {
      level: "low",
      description: "Baja",
      percentage: "Fertilidad baja",
      message: "Baja probabilidad de quedar embarazada",
    };
  }
}

// Obtener información detallada de ovulación (siempre muestra la próxima)
function getOvulationInfo(currentCycleDay, avgCycleLength, nextPeriodDate) {
  const ovulationDay = avgCycleLength - 14;
  const daysToOvulation = ovulationDay - currentCycleDay;
  const nextOvulationDate = moment(nextPeriodDate).subtract(14, "days");

  if (daysToOvulation > 7) {
    return {
      status: "distant",
      message: `Tu próxima ovulación será en ${daysToOvulation} días`,
      date: nextOvulationDate.format("YYYY-MM-DD"),
      friendlyDate: nextOvulationDate.format("DD [de] MMMM"),
    };
  } else if (daysToOvulation > 2) {
    return {
      status: "approaching",
      message: `Tu ovulación se acerca, será en ${daysToOvulation} días`,
      date: nextOvulationDate.format("YYYY-MM-DD"),
      friendlyDate: nextOvulationDate.format("DD [de] MMMM"),
    };
  } else if (daysToOvulation >= 0 && daysToOvulation <= 2) {
    return {
      status: "imminent",
      message:
        daysToOvulation === 0
          ? "¡Estás ovulando hoy!"
          : `¡Tu ovulación será ${
              daysToOvulation === 1 ? "mañana" : `en ${daysToOvulation} días`
            }!`,
      date: nextOvulationDate.format("YYYY-MM-DD"),
      friendlyDate: nextOvulationDate.format("DD [de] MMMM"),
    };
  } else {
    // Si ya pasó la ovulación de este ciclo, calcular la del próximo ciclo
    const nextCycleOvulation = moment(nextPeriodDate).add(
      avgCycleLength - 14,
      "days"
    );
    const daysToNextOvulation = nextCycleOvulation.diff(moment(), "days");

    return {
      status: "next_cycle",
      message: `Tu próxima ovulación será en ${daysToNextOvulation} días`,
      date: nextCycleOvulation.format("YYYY-MM-DD"),
      friendlyDate: nextCycleOvulation.format("DD [de] MMMM"),
    };
  }
}

// Función principal optimizada para generar predicciones
function generatePredictions(cycles) {
  if (cycles.length === 0) {
    return {
      status: "no_cycles",
      message: "No se encontraron ciclos registrados",
    };
  }

  const today = new Date();

  // Filtrar y ordenar ciclos pasados
  const pastCycles = cycles
    .map((c) => ({
      startDate: new Date(c.startDate),
      duration: c.duration,
    }))
    .filter((c) => c.startDate <= today)
    .sort((a, b) => a.startDate - b.startDate);

  if (pastCycles.length === 0) {
    return {
      status: "no_past_cycles",
      message: "No se encontraron ciclos pasados para calcular predicciones",
    };
  }

  // VALIDACIÓN MEJORADA: Requiere mínimo 2 ciclos para predicciones confiables
  if (pastCycles.length < 2) {
    return {
      status: "insufficient_data",
      message:
        "Se necesitan al menos 2 ciclos para calcular predicciones confiables",
      ciclosRegistrados: pastCycles.length,
      ciclosNecesarios: 2,
    };
  }

  // Validar consecutividad (opcional)
  validateConsecutiveCycles(pastCycles);

  // Calcular intervalos entre ciclos
  const intervals = [];
  for (let i = 1; i < pastCycles.length; i++) {
    const prev = pastCycles[i - 1].startDate;
    const curr = pastCycles[i].startDate;
    intervals.push((curr - prev) / (1000 * 60 * 60 * 24));
  }

  // Estadísticas del ciclo
  const avgCycleLength =
    intervals.length > 0
      ? Math.round(intervals.reduce((sum, x) => sum + x, 0) / intervals.length)
      : 28; // Default si solo hay un ciclo

  const avgDuration = Math.round(
    cycles.reduce((sum, c) => sum + c.duration, 0) / cycles.length
  );

  // Calcular confiabilidad basada en número de ciclos
  const getReliability = (cycleCount) => {
    if (cycleCount >= 6) return "Alta";
    if (cycleCount >= 3) return "Moderada";
    return "Baja";
  };

  // Información del ciclo actual
  const lastStart = pastCycles[pastCycles.length - 1].startDate;
  const currentCycleDay = getCurrentCycleDay(lastStart);
  const nextPeriodDate = addDays(lastStart, avgCycleLength);
  const daysUntilPeriod = getDaysUntilEvent(nextPeriodDate);

  // Análisis de fase actual
  const currentPhase = getCurrentPhase(
    currentCycleDay,
    avgCycleLength,
    avgDuration
  );

  // Información de ovulación
  const ovulationInfo = getOvulationInfo(
    currentCycleDay,
    avgCycleLength,
    nextPeriodDate
  );

  // Probabilidad de embarazo
  const pregnancyChance = getPregnancyProbability(
    currentCycleDay,
    avgCycleLength
  );

  return {
    status: "success",

    // Información del período
    proximoPeriodo: {
      fecha: moment(nextPeriodDate).format("YYYY-MM-DD"),
      diasRestantes: Math.max(0, daysUntilPeriod),
      mensaje:
        daysUntilPeriod <= 0
          ? "Período iniciado o próximo a iniciar"
          : daysUntilPeriod === 1
          ? "Tu período debería comenzar mañana"
          : `Tu período debería comenzar en ${daysUntilPeriod} días`,
    },

    // Información de ovulación
    ovulacion: {
      estado: ovulationInfo.status,
      fecha: ovulationInfo.date,
      fechaAmigable: ovulationInfo.friendlyDate,
      mensaje: ovulationInfo.message,
      ventanaFertil:
        ovulationInfo.status === "imminent" ||
        ovulationInfo.status === "approaching",
    },

    // Probabilidad de embarazo
    fertilidad: {
      probabilidad: pregnancyChance.description,
      nivel: pregnancyChance.level,
      porcentaje: pregnancyChance.percentage,
      mensaje: pregnancyChance.message,
    },

    // Fase actual del ciclo
    faseActual: {
      fase: currentPhase.phase,
      nombre: currentPhase.description,
      diaDelCiclo: currentCycleDay,
      duracionCiclo: avgCycleLength,
    },

    // Estadísticas mejoradas
    estadisticas: {
      ciclo: {
        duracionPromedio: avgCycleLength,
        variabilidad:
          intervals.length > 0
            ? Math.round(
                Math.sqrt(
                  intervals.reduce(
                    (sum, x) => sum + Math.pow(x - avgCycleLength, 2),
                    0
                  ) / intervals.length
                )
              )
            : 0,
        regularidad:
          getReliability(pastCycles.length) === "Alta"
            ? "Regular"
            : "En análisis",
        ultimoPeriodo: moment(lastStart).format("YYYY-MM-DD"),
        siguientePrediccion: moment(nextPeriodDate).format("YYYY-MM-DD"),
      },
      menstruacion: {
        duracionPromedio: avgDuration,
        ultimaDuracion: pastCycles[pastCycles.length - 1].duration,
      },
      precision: {
        ciclosAnalizados: pastCycles.length,
        confiabilidad: getReliability(pastCycles.length),
        intervalosCalculados: intervals.length,
      },
    },

    // Insights adicionales con síntomas
    insights: {
      mensaje: generateInsightMessage(
        currentPhase.phase,
        ovulationInfo.status,
        pregnancyChance.level,
        currentCycleDay
      ),
      consejo: generateAdvice(
        currentPhase.phase,
        pastCycles.length >= 3,
        avgCycleLength,
        currentCycleDay
      ),
      sintomas: {
        fisicos: getPhaseSymptoms(currentPhase.phase).physical,
        emocionales: getPhaseSymptoms(currentPhase.phase).emotional,
        consejos: getPhaseSymptoms(currentPhase.phase).tips,
      },
    },
  };
}

// Obtener síntomas comunes por fase del ciclo
function getPhaseSymptoms(phase) {
  const symptoms = {
    menstruation: {
      physical: [
        "Cólicos menstruales",
        "Dolor de espalda baja",
        "Sensibilidad en los senos",
        "Fatiga",
        "Dolores de cabeza",
      ],
      emotional: ["Irritabilidad", "Cambios de humor", "Necesidad de descanso"],
      tips: [
        "Usa calor para aliviar cólicos",
        "Mantente hidratada",
        "Descansa lo necesario",
      ],
    },
    follicular: {
      physical: [
        "Más energía",
        "Piel más clara",
        "Aumento de la libido",
        "Mejor recuperación del ejercicio",
      ],
      emotional: [
        "Estado de ánimo positivo",
        "Mayor motivación",
        "Sensación de bienestar",
      ],
      tips: [
        "Aprovecha tu energía para ejercitarte",
        "Es un buen momento para nuevos proyectos",
        "Tu piel se ve radiante",
      ],
    },
    fertile: {
      physical: [
        "Flujo cervical transparente y elástico",
        "Ligero aumento de temperatura",
        "Posible dolor pélvico leve",
        "Mayor sensibilidad",
      ],
      emotional: [
        "Aumento del deseo sexual",
        "Mayor sociabilidad",
        "Confianza elevada",
      ],
      tips: [
        "Es tu momento más fértil",
        "Presta atención a las señales de tu cuerpo",
        "Mantén buenos hábitos de higiene",
      ],
    },
    luteal: {
      physical: [
        "Posible hinchazón",
        "Cambios en el apetito",
        "Sensibilidad en los senos",
        "Menor energía",
        "Cambios en la piel",
      ],
      emotional: [
        "Posibles cambios de humor",
        "Mayor sensibilidad emocional",
        "Necesidad de más descanso",
        "Antojos alimentarios",
      ],
      tips: [
        "Come alimentos ricos en magnesio",
        "Practica relajación",
        "Escucha las necesidades de tu cuerpo",
      ],
    },
  };

  return (
    symptoms[phase] || {
      physical: ["Varía según cada persona"],
      emotional: ["Escucha a tu cuerpo"],
      tips: ["Mantén un registro de tus síntomas"],
    }
  );
}

// Generar mensaje informativo personalizado con síntomas
function generateInsightMessage(
  phase,
  ovulationStatus,
  fertilityLevel,
  currentCycleDay
) {
  const phaseMessages = {
    menstruation:
      "Tu cuerpo se está renovando. Es normal sentir algo de cansancio y necesitar más descanso.",
    follicular:
      "¡Tu energía está aumentando! Es un momento perfecto para nuevos proyectos y ejercicio.",
    fertile:
      "Estás en tu momento más fértil. Tu cuerpo está enviando señales claras de ovulación.",
    luteal:
      "Tu cuerpo está en una fase de preparación. Es normal experimentar algunos cambios físicos y emocionales.",
  };

  return (
    phaseMessages[phase] ||
    "Conoce mejor tu ciclo registrando síntomas regularmente."
  );
}

// Generar consejos personalizados más cálidos
function generateAdvice(phase, hasEnoughData, cycleLength, currentCycleDay) {
  if (!hasEnoughData) {
    return "Registra algunos ciclos más para obtener predicciones más precisas y personalizadas.";
  }

  if (phase === "fertile") {
    return "Si buscas embarazo, ¡estos son tus días estrella! Si no, asegúrate de usar protección.";
  } else if (phase === "luteal" && currentCycleDay > 25) {
    return "Si sientes síntomas premenstruales, es completamente normal. Cuídate extra en estos días.";
  } else if (phase === "menstruation") {
    return "Date el cariño que mereces durante tu período. Descansa, hidrátate y escucha a tu cuerpo.";
  }
  return "Tu ciclo se ve saludable. ¡Sigue registrando para conocerte mejor!";
}

// Controlador para guardar un ciclo
/* exports.createCycle = async (req, res) => {
  try {
    const { userId, startDate, duration, symptoms } = req.body;

    // Validar que la fecha no sea futura
    const today = new Date();
    const cycleDate = new Date(startDate);
    if (cycleDate > today) {
      return res.status(400).json({
        error: "La fecha del ciclo no puede ser en el futuro.",
      });
    }

    const existingCycle = await Cycle.findOne({ userId, startDate });
    if (existingCycle) {
      return res
        .status(400)
        .json({ error: "Ya existe un ciclo con esa fecha." });
    }

    const newCycle = new Cycle({
      userId,
      startDate,
      duration,
      symptoms,
    });

    const savedCycle = await newCycle.save();
    res.status(201).json(savedCycle);
  } catch (error) {
    console.error("Error en createCycle:", error);
    res.status(400).json({ error: error.message });
  }
}; */

exports.createCycle = async (req, res) => {
  try {
    const { userId, cycles, startDate, duration, symptoms } = req.body;
    const today = new Date();

    // 1️⃣ Si vienen varios ciclos en un array:
    if (Array.isArray(cycles)) {
      const saved = [];

      for (const c of cycles) {
        const cycleDate = new Date(c.startDate);
        if (cycleDate > today) {
          return res.status(400).json({
            error: `La fecha ${
              c.startDate
            } no puede ser futura. Sólo fechas ≤ hoy (${today
              .toISOString()
              .slice(0, 10)}).`,
          });
        }
        // Crear y guardar cada ciclo
        const existing = await Cycle.findOne({
          userId,
          startDate: c.startDate,
        });
        if (existing) {
          return res.status(400).json({
            error: `Ya existe un ciclo con fecha ${c.startDate}.`,
          });
        }
        const newCycle = new Cycle({
          userId,
          startDate: c.startDate,
          duration: c.duration,
          symptoms: c.symptoms || "",
        });
        const savedCycle = await newCycle.save();
        saved.push(savedCycle);
      }

      return res.status(201).json({
        success: true,
        message: `${saved.length} ciclos guardados correctamente`,
        cycles: saved,
      });
    }

    // 2️⃣ Si viene un solo ciclo como antes:
    if (!userId || !startDate || duration == null) {
      return res.status(400).json({
        error: "Se requieren userId, startDate y duration",
      });
    }

    const cycleDate = new Date(startDate);
    if (cycleDate > today) {
      return res.status(400).json({
        error: `La fecha ${startDate} no puede ser futura. Sólo fechas ≤ hoy (${today
          .toISOString()
          .slice(0, 10)}).`,
      });
    }

    const existingCycle = await Cycle.findOne({ userId, startDate });
    if (existingCycle) {
      return res.status(400).json({
        error: `Ya existe un ciclo con fecha ${startDate}.`,
      });
    }

    const newCycle = new Cycle({ userId, startDate, duration, symptoms });
    const savedCycle = await newCycle.save();
    return res.status(201).json(savedCycle);
  } catch (error) {
    console.error("Error en createCycle:", error);
    return res.status(500).json({ error: "Error interno al guardar ciclo" });
  }
};

// Controlador para obtener todos los ciclos de un usuario
exports.getUserCycles = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId es requerido" });
    }

    const cycles = await Cycle.find({ userId }).sort({ startDate: -1 });

    console.log(`Encontrados ${cycles.length} ciclos para usuario ${userId}`);

    res.json({
      success: true,
      count: cycles.length,
      cycles: cycles,
    });
  } catch (error) {
    console.error("Error en getUserCycles:", error);
    res.status(500).json({
      error: error.message,
      message: "Error al obtener ciclos del usuario",
    });
  }
};

// Controlador para obtener predicciones optimizado
exports.getPredictions = async (req, res) => {
  console.log(">>> getPredictions llamado con userId =", req.params.userId);
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId es requerido" });
    }

    const cycles = await Cycle.find({ userId }).sort({ startDate: 1 }); // Ordenar ascendente para cálculos

    console.log(`Encontrados ${cycles.length} ciclos para predicciones`);

    // Convertir a formato compatible
    const formattedCycles = cycles.map((cycle) => ({
      startDate: moment(cycle.startDate).format("YYYY-MM-DD"),
      duration: cycle.duration,
    }));

    const predictions = generatePredictions(formattedCycles);
    res.json(predictions);
  } catch (error) {
    console.error("Error en getPredictions:", error);
    res.status(500).json({
      error: error.message,
      status: "error",
      message: "Error interno del servidor al calcular predicciones",
    });
  }
};
