require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cycleRoutes = require("./routes/cycles");

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración CORS
const allowedOrigins = [
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://127.0.0.1:3002",
  // Agrega aquí la URL de tu frontend cuando lo despliegues
  // Por ejemplo: 'https://tu-app-frontend.vercel.app'
  "https://fabsignal.github.io/Human_Resources_Project/",
  "https://fabsignal.github.io",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir solicitudes sin 'origin' (como aplicaciones móviles o curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Bloqueado por política CORS"));
    }
  },
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
};

// Middleware
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error conectando a MongoDB:", err));

// Rutas : Eliminar por redundancia
/* app.use("/api/cycles", cycleRoutes);

app.get("/", (req, res) => {
  res.send("API de seguimiento menstrual funcionando correctamente");
}); */

// server.js (añade esto antes de app.listen)

// Ruta de verificación de estado
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date(),
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// Ruta raíz
app.get("/", (req, res) => {
  res.send(`
    <h1>API de Seguimiento Menstrual</h1>
    <p>Endpoints disponibles:</p>
    <ul>
      <li>GET /api/cycles/:userId - Obtener ciclos de usuario</li>
      <li>POST /api/cycles - Crear nuevo ciclo</li>
      <li>GET /api/cycles/predictions/:userId - Obtener predicciones</li>
      <li>GET /health - Verificar estado del servicio</li>
      <li>POST /api/auth/register - Registrar usuario</li>
      <li>POST /api/auth/login - Iniciar sesión</li>
    </ul>
  `);
});

// Middleware para autenticación : NO SE USARA JWT
/* app.use((req, res, next) => {
  if (req.path.startsWith("/api") && !req.path.includes("/auth")) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Acceso no autorizado" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Token inválido" });
    }
  } else {
    next();
  }
});
 */
// Usa las rutas de autenticación
/* app.use("/api/auth", authRoutes);*/

// Nueva ruta para predicciones
app.get("/api/cycles/predictions/:userId", async (req, res) => {
  try {
    const cycles = await Cycle.find({ userId: req.params.userId }).sort({
      startDate: -1,
    });

    if (cycles.length < 3) {
      return res.status(400).json({
        status: "insufficient_data",
        message: "Se necesitan al menos 3 ciclos registrados",
      });
    }

    const predictions = generatePredictions(cycles);
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

// Middleware para errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Algo salió mal!");
});
