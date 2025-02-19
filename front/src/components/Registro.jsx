import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Registro = () => {
  const [usuario, setUsuario] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
  
    if (!usuario || !correo || !contrasena) {
      setError("Todos los campos son requeridos");
      return;
    }
  
    try {
      const response = await axios.post("http://localhost:3000/registro", {
        usuario,
        correo,
        contrasena,
      });
  
      if (response.data.statusCode === 200) {
        navigate("/login");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.intDataMessage[0]?.error || "Error en el registro";
      setError(errorMessage);
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
        <h1 className="text-center mb-4">Registro</h1>
        <form onSubmit={handleRegistro}>
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
            <label htmlFor="correo" className="form-label">
              Correo:
            </label>
            <input
              type="email"
              className="form-control"
              id="correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
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
            Registrarse
          </button>
          <hr />
          <Link className="btn btn-primary m-10}}} w-100" to={'/login'}>
            Login
          </Link>
        </form>
      </div>
    </div>
  );
};

export default Registro;