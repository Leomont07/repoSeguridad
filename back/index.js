const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Configura CORS
app.use(cors({
  origin: "http://localhost:5173",
  methods: "GET,POST",
  credentials: true,
}));

app.use(bodyParser.json());

// Lista de Usuarios registrados
const users = [
  { id: 1, usuario: "leonardo", contrasena: "leo12345" }
];

// Función para logib
app.post("/login", (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({
      statusCode: 400,
      intDataMessage: [{ error: "El usuario y contrasena son requeridos" }],
    });
  }

  const user = users.find((u) => u.usuario === usuario && u.contrasena === contrasena);

  if (user) {
    const token = jwt.sign({ userId: user.id }, "secretooo", { expiresIn: "1m" });

    return res.status(200).json({
      statusCode: 200,
      intDataMessage: [{ credentials: token }],
    });
  } else {
    return res.status(401).json({
      statusCode: 401,
      intDataMessage: [{ error: "Credenciales inválidas" }],
    });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});