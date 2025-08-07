"use client"

import type React from "react"

import { useState, useEffect } from "react"


// --- Interfaces ---
interface UserProfile {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  avatarUrl?: string
  bio?: string
}

interface LoginResponse {
  success: boolean
  message: string
  access_token: string
  user: {
    id: string
    nom: string
    prenom: string
    email: string
    telephone: string
  }
}

interface RegisterResponse {
  success: boolean
  message: string
  access_token: string
  user: {
    id: string
    nom: string
    prenom: string
    email: string
    telephone: string
  }
}

// --- Main Page Component ---
export default function AuthProfilePage() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [view, setView] = useState<"login" | "signup" | "profile">("login")



  useEffect(() => {
    // Check for a token in localStorage when the component loads
    const storedToken = localStorage.getItem("authToken")
    const storedUser = localStorage.getItem("userData")

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      setView("profile")
    }
  }, [])

  const handleLoginSuccess = (newToken: string, userData: UserProfile) => {
    localStorage.setItem("authToken", newToken)
    localStorage.setItem("userData", JSON.stringify(userData))
    setToken(newToken)
    setUser(userData)
    setView("profile")
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userData")
    setToken(null)
    setUser(null)
    setView("login")
  }

  // Conditionally render the correct component
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      {view === "login" && <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignUp={() => setView("signup")} />}
      {view === "signup" && (
        <SignUpPage onSignUpSuccess={handleLoginSuccess} onSwitchToLogin={() => setView("login")} />
      )}
      {view === "profile" && token && user && (
        <ProfilePage token={token} user={user} onLogout={handleLogout} onUserUpdate={setUser} />
      )}
    </div>
  )
}

// --- LoginPage Component ---
const LoginPage = ({
  onLoginSuccess,
  onSwitchToSignUp,
}: {
  onLoginSuccess: (token: string, user: UserProfile) => void
  onSwitchToSignUp: () => void
}) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError("")
  setLoading(true)

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data: LoginResponse = await res.json()

    if (!res.ok) {
      throw new Error(data.message || "Échec de la connexion")
    }

    const userProfile: UserProfile = {
      id: data.user.id,
      nom: data.user.nom,
      prenom: data.user.prenom,
      email: data.user.email,
      telephone: data.user.telephone,
    }

    // ✅ Stocke dans localStorage
    localStorage.setItem("authToken", data.access_token)
    localStorage.setItem("userData", JSON.stringify(userProfile))

    // ✅ Appelle le callback
    onLoginSuccess(data.access_token, userProfile)

    // ✅ Redirige vers la page principale
    window.location.href = "/"
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}


  function HandleNavigation(arg0: string): void {
    throw new Error("Function not implemented.")
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm">
      <h1 className="text-2xl font-bold mb-4 text-center text-black">Connexion</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="px-3 py-2 border rounded text-black placeholder:text-gray-400 disabled:bg-gray-100"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className="px-3 py-2 border rounded text-black placeholder:text-gray-400 disabled:bg-gray-100"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-blue-400"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Pas de compte ?{" "}
          <button type="button" onClick={onSwitchToSignUp} className="text-blue-600 hover:underline" disabled={loading}>
            S'inscrire
          </button>
        </p>
      </form>
    </div>
  )
}

// --- SignUpPage Component ---
const SignUpPage = ({
  onSignUpSuccess,
  onSwitchToLogin,
}: {
  onSignUpSuccess: (token: string, user: UserProfile) => void
  onSwitchToLogin: () => void
}) => {
  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [email, setEmail] = useState("")
  const [telephone, setTelephone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation côté client
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: email.trim().toLowerCase(),
          telephone: telephone.trim(),
          password,
        }),
      })

      const data: RegisterResponse = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Échec de l'inscription")
      }

      const userProfile: UserProfile = {
        id: data.user.id,
        nom: data.user.nom,
        prenom: data.user.prenom,
        email: data.user.email,
        telephone: data.user.telephone,
      }

      // Connexion automatique après inscription réussie
      onSignUpSuccess(data.access_token, userProfile)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm">
      <h1 className="text-2xl font-bold mb-4 text-center text-black">Créer un compte</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
          disabled={loading}
          className="px-3 py-2 border rounded text-black placeholder:text-gray-400 disabled:bg-gray-100"
        />
        <input
          type="text"
          placeholder="Prénom"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          required
          disabled={loading}
          className="px-3 py-2 border rounded text-black placeholder:text-gray-400 disabled:bg-gray-100"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="px-3 py-2 border rounded text-black placeholder:text-gray-400 disabled:bg-gray-100"
        />
        <input
          type="tel"
          placeholder="Téléphone"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          required
          disabled={loading}
          className="px-3 py-2 border rounded text-black placeholder:text-gray-400 disabled:bg-gray-100"
        />
        <input
          type="password"
          placeholder="Mot de passe (min. 6 caractères)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className="px-3 py-2 border rounded text-black placeholder:text-gray-400 disabled:bg-gray-100"
        />
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          className="px-3 py-2 border rounded text-black placeholder:text-gray-400 disabled:bg-gray-100"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-blue-400"
        >
          {loading ? "Inscription..." : "S'inscrire"}
        </button>
        <p className="text-center text-sm text-gray-600">
          Déjà un compte ?{" "}
          <button type="button" onClick={onSwitchToLogin} className="text-blue-600 hover:underline" disabled={loading}>
            Se connecter
          </button>
        </p>
      </form>
    </div>
  )
}

// --- ProfilePage Component ---
const ProfilePage = ({
  token,
  user,
  onLogout,
  onUserUpdate,
}: {
  token: string
  user: UserProfile
  onLogout: () => void
  onUserUpdate: (user: UserProfile) => void
}) => {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<UserProfile>(user)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setError("")
    setLoading(true)

    try {
      // Note: Vous devrez implémenter cette route dans votre backend
      const res = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nom: form.nom.trim(),
          prenom: form.prenom.trim(),
          telephone: form.telephone.trim(),
          bio: form.bio?.trim(),
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Échec de la mise à jour du profil")
      }

      const updatedUser = { ...form }
      onUserUpdate(updatedUser)
      localStorage.setItem("userData", JSON.stringify(updatedUser))
      setEditing(false)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Appel optionnel à l'endpoint de déconnexion
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    } finally {
      onLogout()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center">
      {editing ? (
        <>
          <h2 className="text-xl font-bold mb-4 text-black">Modifier le profil</h2>
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <input
            type="text"
            name="nom"
            placeholder="Nom"
            value={form.nom}
            onChange={handleChange}
            disabled={loading}
            className="mb-2 px-3 py-2 border rounded w-full text-black placeholder:text-gray-400 disabled:bg-gray-100"
          />
          <input
            type="text"
            name="prenom"
            placeholder="Prénom"
            value={form.prenom}
            onChange={handleChange}
            disabled={loading}
            className="mb-2 px-3 py-2 border rounded w-full text-black placeholder:text-gray-400 disabled:bg-gray-100"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            disabled
            className="mb-2 px-3 py-2 border rounded w-full text-gray-500 bg-gray-100"
          />
          <input
            type="tel"
            name="telephone"
            placeholder="Téléphone"
            value={form.telephone}
            onChange={handleChange}
            disabled={loading}
            className="mb-2 px-3 py-2 border rounded w-full text-black placeholder:text-gray-400 disabled:bg-gray-100"
          />
          <textarea
            name="bio"
            placeholder="Bio (optionnel)"
            value={form.bio || ""}
            onChange={handleChange}
            disabled={loading}
            className="mb-2 px-3 py-2 border rounded w-full text-black placeholder:text-gray-400 disabled:bg-gray-100"
            rows={3}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400"
            >
              {loading ? "Sauvegarde..." : "Sauvegarder"}
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setForm(user)
                setError("")
              }}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:bg-gray-200"
            >
              Annuler
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">
              {user.prenom.charAt(0)}
              {user.nom.charAt(0)}
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-1 text-black">
            {user.prenom} {user.nom}
          </h1>
          <p className="text-gray-600 mb-1">{user.email}</p>
          <p className="text-gray-600 mb-2">{user.telephone}</p>
          {user.bio && <p className="text-center text-black mb-4 italic">"{user.bio}"</p>}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Modifier le profil
            </button>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Se déconnecter
            </button>
          </div>
        </>
      )}
    </div>
  )
}
