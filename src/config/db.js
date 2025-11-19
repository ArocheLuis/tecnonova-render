
import dotenv from "dotenv";
import sql from "mssql";


dotenv.config();



const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  server: process.env.DB_SERVER, 
  port: parseInt(process.env.DB_PORT || "1433", 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

console.log("Tipo de server en sqlConfig =>", typeof sqlConfig.server, sqlConfig.server);

let poolPromise;

export const getConnection = async () => {
  try {
    if (!sqlConfig.server) {
      throw new Error("sqlConfig.server está vacío o indefinido");
    }

    if (!poolPromise) {
      poolPromise = sql.connect(sqlConfig);
      console.log("Pool inicializado");
    }

    const pool = await poolPromise;
    return pool;
  } catch (err) {
    console.error("Error conectando al pool:", err);
    throw err;
  }
};
