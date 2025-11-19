import sql from "mssql";
import { getConnection } from "../config/db.js";


export const createUser = async ({ username, email, passwordHashBuffer, rolId }) => {
  const pool = await getConnection();

  const result = await pool
    .request()
    .input("Username", sql.NVarChar(50), username)
    .input("Email", sql.NVarChar(255), email)
    .input("PasswordHash", sql.VarBinary(256), passwordHashBuffer)
    .input("RolId", sql.Int, rolId)
    .execute("sp_UsuariosSeguridad_Registrar");

  return result.recordset[0]?.UsuarioId || null;
};

export const getUserByIdentificador = async (identificador) => {
  const pool = await getConnection();

  const result = await pool
    .request()
    .input("Identificador", sql.NVarChar(255), identificador)
    .execute("sp_UsuariosSeguridad_ObtenerPorIdentificador");

  return result.recordset[0] || null;
};


export const getUserById = async (usuarioId) => {
  const pool = await getConnection();

  const result = await pool
    .request()
    .input("UsuarioId", sql.Int, usuarioId)
    .execute("sp_UsuariosSeguridad_ObtenerPorId");

  return result.recordset[0] || null;
};


export const enableTwoFactorForUser = async (usuarioId, secretBase32) => {
  const pool = await getConnection();

  const secretBuffer = Buffer.from(secretBase32, "utf8");

  await pool
    .request()
    .input("UsuarioId", sql.Int, usuarioId)
    .input("TwoFactorSecret", sql.VarBinary(256), secretBuffer)
    .execute("sp_UsuariosSeguridad_Habilitar2FA");
};
