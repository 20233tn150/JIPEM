import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ScanFace, User, Lock, BadgeCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      return 'El nombre completo debe tener al menos 2 caracteres.'
    }
    if (!form.username.trim() || form.username.trim().length < 3) {
      return 'El usuario debe tener al menos 3 caracteres.'
    }
    if (form.username.includes(' ')) {
      return 'El usuario no puede contener espacios.'
    }
    if (form.password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.'
    }
    if (!/[A-Z]/.test(form.password)) {
      return 'La contraseña debe incluir al menos una letra mayúscula.'
    }
    if (!/[a-z]/.test(form.password)) {
      return 'La contraseña debe incluir al menos una letra minúscula.'
    }
    if (!/\d/.test(form.password)) {
      return 'La contraseña debe incluir al menos un número.'
    }
    if (!/[^A-Za-z0-9]/.test(form.password)) {
      return 'La contraseña debe incluir al menos un símbolo especial (ej. @, #, !, %).'
    }
    if (form.password !== form.confirmPassword) {
      return 'Las contraseñas no coinciden.'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await register({
        username: form.username.trim(),
        name: form.name.trim(),
        password: form.password,
        password2: form.confirmPassword,
      })
      navigate('/classrooms')
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const FIELD_LABELS = {
          username: 'Usuario',
          name: 'Nombre',
          password: 'Contraseña', // NOSONAR — etiqueta de UI, no credencial
          password2: 'Confirmar contraseña', // NOSONAR
          email: 'Correo',
          non_field_errors: '',
        }
        const messages = Object.entries(data).flatMap(([field, errors]) => {
          const label = FIELD_LABELS[field] ?? field
          const msgs = Array.isArray(errors) ? errors : [errors]
          return label ? msgs.map(m => `${label}: ${m}`) : msgs
        })
        setError(messages[0] || 'No se pudo crear la cuenta. Verifica los datos e intenta de nuevo.')
      } else {
        setError('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <ScanFace size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Presentia</h1>
          <p className="text-slate-400 text-sm mt-1">Plataforma de asistencia inteligente</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Crear cuenta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
              <div className="relative">
                <BadgeCheck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="reg-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                  placeholder="Ej. Juan García"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700 mb-1.5">Usuario</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="reg-username"
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                  placeholder="Ej. jgarcia"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="reg-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="reg-confirm"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          <p className="text-center mt-5 text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
