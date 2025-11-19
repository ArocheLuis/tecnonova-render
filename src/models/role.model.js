import sql from "mssql";
import { getConnection } from "../config/db.js";

export const getAllRoles = async () => {
  const pool = await getConnection();

  const result = await pool
    .request()
    .query(`SELECT RolId, NombreRol, Descripcion, Estado FROM Roles WHERE Estado = 'A'`);

  return result.recordset;
};

export const getRoleById = async (rolId) => {
  const pool = await getConnection();

  const result = await pool
    .request()
    .input("RolId", sql.Int, rolId)
    .query(`SELECT RolId, NombreRol, Descripcion, Estado FROM Roles WHERE RolId = @RolId`);

  return result.recordset[0] || null;
};
