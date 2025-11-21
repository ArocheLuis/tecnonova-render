import express from "express";
import dotenv from "dotenv";
import { getConnection } from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import cors from "cors";


dotenv.config();
const app=express();
app.use(cors({
  origin: [
    'http://localhost:5173',           
    'https://tecnonova-render.onrender.com/api/auth/register' 
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);

  try {
    const pool = await getConnection();
    console.log("Conectado a SQL Server desde el servidor");
  } catch (err) {
    console.error("Error al conectar a la base de datos:", err.message);
  }
});

