import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import {
  createUser,
  getUserByIdentificador,
  getUserById,
  enableTwoFactorForUser
} from "../models/user.model.js";


export const login = async (req, res) => {
  try {
    const { identificador, password } = req.body;

    if (!identificador || !password) {
      return res.status(400).json({
        message: "Debe ingresar usuario/email y contraseña"
      });
    }

    const user = await getUserByIdentificador(identificador);

    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const hashString = user.PasswordHash.toString("utf8");
    const passwordValida = await bcrypt.compare(password, hashString);

    if (!passwordValida) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }


    if (!user.TwoFactorHabilitado) {
      const token = jwt.sign(
        {
          sub: user.UsuarioId,
          username: user.Username,
          email: user.Email,
          rolId: user.RolId
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.json({
        message: "Login exitoso",
        token,
        user: {
          id: user.UsuarioId,
          username: user.Username,
          email: user.Email,
          rolId: user.RolId
        }
      });
    }

  
    const tempToken = jwt.sign(
      {
        sub: user.UsuarioId,
        twoFactorStage: true
      },
      process.env.JWT_SECRET,
      { expiresIn: "5m" } 
    );

    return res.json({
      message: "Código 2FA requerido",
      require2fa: true,
      tempToken
    });

  } catch (error) {
    console.error("Error en /auth/login:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};



export const register = async (req, res) => {
  try {
    const { username, email, password, rolId } = req.body;

    if (!username || !email || !password || !rolId) {
      return res.status(400).json({
        message: "Todos los campos son requeridos"
      });
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    const hashBuffer = Buffer.from(hash, "utf8");


    let nuevoId;
    try {
      nuevoId = await createUser({
        username,
        email,
        passwordHashBuffer: hashBuffer,
        rolId
      });
    } catch (err) {
      if (err.message?.includes("EMAIL_EXISTS")) {
        return res.status(400).json({ message: "El correo ya está registrado" });
      }
      if (err.message?.includes("USERNAME_EXISTS")) {
        return res.status(400).json({ message: "El nombre de usuario ya existe" });
      }

      console.error("Error ejecutando createUser:", err);
      return res.status(500).json({ message: "Error al registrar el usuario" });
    }

    // 2) Generar secreto 2FA para este usuario
    const secret = speakeasy.generateSecret({
      name: "TecnoNova App (2FA)",
      length: 20
    });


    await enableTwoFactorForUser(nuevoId, secret.base32);

  
    return res.status(201).json({
      message: "Usuario creado correctamente. Configure su 2FA con los datos enviados.",
      usuarioId: nuevoId,
      twoFactor: {
        base32: secret.base32,
        otpauth_url: secret.otpauth_url
      }
    });

  } catch (error) {
    console.error("Error en /auth/register:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};


export const verify2FA = async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({
        message: "Token temporal y código 2FA son requeridos"
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Token temporal inválido o expirado" });
    }

    if (!decoded.twoFactorStage || !decoded.sub) {
      return res.status(400).json({ message: "Token temporal no es válido para 2FA" });
    }

    const user = await getUserById(decoded.sub);

    if (!user || !user.TwoFactorHabilitado || !user.TwoFactorSecret) {
      return res.status(400).json({ message: "2FA no está configurado para este usuario" });
    }

    const secretBase32 = user.TwoFactorSecret.toString("utf8");

    const verified = speakeasy.totp.verify({
      secret: secretBase32,
      encoding: "base32",
      token: code,
      window: 1
    });

    if (!verified) {
      return res.status(401).json({ message: "Código 2FA inválido o expirado" });
    }

    const finalToken = jwt.sign(
      {
        sub: user.UsuarioId,
        username: user.Username,
        email: user.Email,
        rolId: user.RolId
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Autenticación 2FA exitosa",
      token: finalToken,
      user: {
        id: user.UsuarioId,
        username: user.Username,
        email: user.Email,
        rolId: user.RolId
      }
    });

  } catch (error) {
    console.error("Error en /auth/verify-2fa:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
