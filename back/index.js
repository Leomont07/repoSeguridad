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
      intDataMessage: [{ error: "El usuario y contraseña son requeridos" }],
    });
  }

  try {
    const user = await db
      .collection("users")
      .where("username", "==", usuario)
      .get();

    if (user.empty) {
      return res.status(401).json({
        statusCode: 401,
        intDataMessage: [{ error: "Credenciales inválidas" }],
      });
    }

    const userDoc = user.docs[0];
    const userData = userDoc.data();

    const compararPassword = await bcrypt.compare(contrasena, userData.password);

    if (!compararPassword) {
      return res.status(401).json({
        statusCode: 401,
        intDataMessage: [{ error: "Credenciales inválidas" }],
      });
    }

    await db.collection("users").doc(userDoc.id).update({
      last_login: new Date(),
    });

    const token = jwt.sign({ userId: userDoc.id }, "secretooo", { expiresIn: "1m" });

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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
