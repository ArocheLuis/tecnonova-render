import express from "express";
import dotenv from "dotenv";
import { getConnection } from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
;


dotenv.config();
const app=express();
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

