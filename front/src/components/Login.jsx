import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!usuario || !contrasena) {
      setError("usuario and contrasena are required");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/login", {
        usuario,
        contrasena,
      });

      if (response.data.statusCode === 200) {
        const token = response.data.intDataMessage[0].credentials;
        localStorage.setItem("token", token);
        navigate("/home");
      }
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ height: "100vh", backgroundColor: "#f8f9fa" }}
    >
      <div
        className="border p-4 rounded"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          borderColor: "#007bff",
          width: "300px",
        }}
      >
        <h1 className="text-center mb-4">Login</h1>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="usuario" className="form-label">
              Usuario:
            </label>
            <input
              type="text"
              className="form-control"
              id="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="contrasena" className="form-label">
              Contraseña:
            </label>
            <input
              type="password"
              className="form-control"
              id="contrasena"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
          </div>
          {error && <div className="text-danger mb-3">{error}</div>}
          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;