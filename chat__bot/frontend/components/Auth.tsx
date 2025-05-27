/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import axios from "axios";

const AUTH_API_URL = "http://localhost:5000"; // Flask authentication backend

const Auth: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");

  const handleAuth = async () => {
    try {
      const endpoint = isLogin ? "/login" : "/signup";
      const response = await axios.post(`${AUTH_API_URL}${endpoint}`, { username, password });

      setMessage(response.data.message);
      
      if (isLogin) {
        localStorage.setItem("token", response.data.token); // Store JWT
        onLogin();
      }
    } catch (error: any) {
      setMessage(error.response?.data?.error || "Erreur lors de l'authentification");
    }
  };

  return (
    <div className="p-4 bg-gray-100 h-screen flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">{isLogin ? "Connexion" : "Inscription"}</h2>
      <input type="text" placeholder="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} className="p-2 border rounded mb-2 w-80" />
      <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="p-2 border rounded mb-2 w-80" />
      <button onClick={handleAuth} className="p-2 bg-blue-500 text-white rounded w-80">{isLogin ? "Se connecter" : "S'inscrire"}</button>
      <p className="mt-2 cursor-pointer text-blue-600" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Créer un compte" : "Déjà un compte ? Se connecter"}
      </p>
      {message && <p className="mt-4 text-red-500">{message}</p>}
    </div>
  );
};

export default Auth;
