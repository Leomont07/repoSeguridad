import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "bootstrap/dist/css/bootstrap.min.css";

const Home = () => {
  const navigate = useNavigate();
  const [showExpiredMessage, setShowExpiredMessage] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const validarToken = () => {
      try {
        const tokenReal = jwtDecode(token);
        if (tokenReal.exp * 1000 < Date.now()) {
          setShowExpiredMessage(true);
          localStorage.removeItem("token");
          setTimeout(() => {
            navigate("/login");
          }, 5000);
        }
      } catch (err) {
        console.error("Error decodificando:", err);
      }
    };

    const interval = setInterval(validarToken, 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="container mt-5">
      <div className="text-center">
        <h1 className="display-4">Bienvenido, estas en el Home</h1>
        <p className="lead">Tu sesión esta activa.</p>
        {showExpiredMessage && (
          <div className="alert alert-warning mt-4">
            Tu sesión ha expirado. Redireccionando al Login...
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;