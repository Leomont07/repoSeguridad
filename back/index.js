const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
const PORT = 3000;

const admin = require("firebase-admin");
const serviceAccount = require("./seguridad-83867-firebase-adminsdk-fbsvc-25c92b171e.json");

// Configurar BD
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://seguirdad-83867-default-rdb.firebasedo.com",
});

const db = admin.firestore();

// Configura CORS
app.use(cors({
  origin: "http://localhost:5173",
  methods: "GET,POST",
  credentials: true,
}));

app.use(bodyParser.json());

// Función para logib
app.post("/login", async (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({
      statusCode: 400,
      intDataMessage: [{ error: "Usuario y contraseña son requeridos" }],
    });
  }

  try {
    const userSnapshot = await db.collection("users") .where("username", "==", usuario).get();

    if (userSnapshot.empty) {
      return res.status(401).json({
        statusCode: 401,
        intDataMessage: [{ error: "Credenciales inválidas" }],
      });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    const compararPassword = await bcrypt.compare(contrasena, userData.password);

    if (!compararPassword) {
      return res.status(401).json({
        statusCode: 401,
        intDataMessage: [{ error: "Credenciales inválidas" }],
      });
    }

    const roleSnapshot = await db.collection("roles").where("role_name", "==", userData.role).get();

    if (roleSnapshot.empty) {
      return res.status(404).json({
        statusCode: 404,
        intDataMessage: [{ error: "Rol no encontrado" }],
      });
    }

    const roleData = roleSnapshot.docs[0].data();
    const permissions = roleData.permissions || [];

    const token = jwt.sign(
      { userId: userDoc.id, username: userData.username, role: userData.role, permissions },
      "secretooo",
      { expiresIn: "1h" }
    );

    await db.collection("users").doc(userDoc.id).update({
      last_login: new Date(),
    });

    return res.status(200).json({
      statusCode: 200,
      intDataMessage: [{ credentials: token }],
    });
  } catch (err) {
    console.error("Error en el login:", err);
    return res.status(500).json({
      statusCode: 500,
      intDataMessage: [{ error: "Error en el servidor" }],
    });
  }
});

//Funcion para el registro
app.post("/registro", async (req, res) => {
  const { usuario, correo, contrasena } = req.body;

  if (!usuario || !correo || !contrasena) {
    return res.status(400).json({
      statusCode: 400,
      intDataMessage: [{ error: "Todos los campos son requeridos" }],
    });
  }

  try {
    const correoRepetido = await db
      .collection("users")
      .where("email", "==", correo)
      .get();

    if (!correoRepetido.empty) {
      return res.status(400).json({
        statusCode: 400,
        intDataMessage: [{ error: "El correo ya está registrado" }],
      });
    }

    const userRepetido = await db
      .collection("users")
      .where("username", "==", usuario)
      .get();

    if (!userRepetido.empty) {
      return res.status(400).json({
        statusCode: 400,
        intDataMessage: [{ error: "Este nombre de usuario ya está registrado" }],
      });
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const newUser = {
      username: usuario,
      email: correo,
      password: hashedPassword,
      role: "common_user",
      date_register: new Date(),
      last_login: null,
    };

    await db.collection("users").add(newUser);

    return res.status(200).json({
      statusCode: 200,
      intDataMessage: [{ message: "Usuario registrado exitosamente" }],
    });
  } catch (err) {
    console.error("Error en el registro:", err);
    return res.status(500).json({
      statusCode: 500,
      intDataMessage: [{ error: "Error en el servidor" }],
    });
  }
});

// Funcion para verificar permisos
const verifyToken = (requiredPermissions) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        statusCode: 401,
        intDataMessage: [{ error: "Token no proporcionado" }],
      });
    }

    try {
      const decoded = jwt.verify(token, "secretooo"); // Verificar el token
      req.user = decoded; // Adjuntar la información del usuario al request

      // Verificar permisos
      const userPermissions = decoded.permissions || [];
      const hasPermission = requiredPermissions.every((perm) =>
        userPermissions.includes(perm)
      );

      if (!hasPermission) {
        return res.status(403).json({
          statusCode: 403,
          intDataMessage: [{ error: "No tienes permisos para realizar esta acción" }],
        });
      }

      next(); // Continuar si todo está bien
    } catch (err) {
      return res.status(401).json({
        statusCode: 401,
        intDataMessage: [{ error: "Token inválido o expirado" }],
      });
    }
  };
};

//Funcion para obtener usuarios
app.get("/getUsers", verifyToken(["get_user"]), async (req, res) => {
  try {
    const usersSnapshot = await db.collection("users").get();
    const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json({
      statusCode: 200,
      intDataMessage: users,
    });
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    return res.status(500).json({
      statusCode: 500,
      intDataMessage: [{ error: "Error en el servidor" }],
    });
  }
});

app.put("/updateUser/:userId", verifyToken(["update_user"]), async (req, res) => {
  const { userId } = req.params;
  const { username, email, role } = req.body;

  try {
    await db.collection("users").doc(userId).update({ username, email, role });

    return res.status(200).json({
      statusCode: 200,
      intDataMessage: [{ message: "Usuario actualizado exitosamente" }],
    });
  } catch (err) {
    console.error("Error al actualizar usuario:", err);
    return res.status(500).json({
      statusCode: 500,
      intDataMessage: [{ error: "Error en el servidor" }],
    });
  }
});

app.delete("/deleteUser/:userId", verifyToken(["delete_user"]), async (req, res) => {
  const { userId } = req.params;
  console.log("ID del usuario a eliminar:", userId);

  try {
    await db.collection("users").doc(userId).delete();

    return res.status(200).json({
      statusCode: 200,
      intDataMessage: [{ message: "Usuario eliminado exitosamente" }],
    });
  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    return res.status(500).json({
      statusCode: 500,
      intDataMessage: [{ error: "Error en el servidor" }],
    });
  }
});

app.post("/addPermissions", verifyToken(["add_permissions"]), async (req, res) => {
    const { role_name, permissions } = req.body;

    try {
      await db.collection("roles").add({ role_name, permissions });

      return res.status(200).json({
        statusCode: 200,
        intDataMessage: [{ message: "Rol agregado exitosamente" }],
      });
    } catch (err) {
      console.error("Error al agregar rol:", err);
      return res.status(500).json({
        statusCode: 500,
        intDataMessage: [{ error: "Error en el servidor" }],
      });
    }
  }
);

app.put("/updatePermissions/:roleId", verifyToken(["update_permissions"]), async (req, res) => {
  const { roleId } = req.params;
  const { role_name } = req.body;
  const { permissions } = req.body;

  try {
    await db.collection("roles").doc(roleId).update({ role_name, permissions });

    return res.status(200).json({
      statusCode: 200,
      intDataMessage: [{ message: "Rol actualizado exitosamente" }],
    });
  } catch (err) {
    console.error("Error al actualizar rol:", err);
    return res.status(500).json({
      statusCode: 500,
      intDataMessage: [{ error: "Error en el servidor" }],
    });
  }
});

app.delete("/deletePermissions/:roleId", verifyToken(["delete_permissions"]), async (req, res) => {
  const { roleId } = req.params;

  try {
    await db.collection("roles").doc(roleId).delete();

    return res.status(200).json({
      statusCode: 200,
      intDataMessage: [{ message: "Rol eliminado exitosamente" }],
    });
  } catch (err) {
    console.error("Error al eliminar rol:", err);
    return res.status(500).json({
      statusCode: 500,
      intDataMessage: [{ error: "Error en el servidor" }],
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
