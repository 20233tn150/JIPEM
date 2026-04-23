import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import api, { setTokens, clearTokens, getStoredRefresh } from '../api/axios'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL
const AuthContext = createContext(null)

/**
 * Proveedor global de autenticación. Gestiona el usuario en sesión y expone
 * las acciones login, register y logout a través del contexto.
 *
 * Al montar, intenta restaurar la sesión desde el refresh token en sessionStorage
 * (para sobrevivir recargas). Mientras resuelve, `loading` es true — úsalo para
 * evitar redirigir a /login antes de que la sesión esté lista.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)  // true until session is restored

  // On mount: try to restore session from sessionStorage refresh token
  useEffect(() => {
    const refresh = getStoredRefresh()
    if (!refresh) {
      setLoading(false)
      return
    }

    axios.post(`${BASE_URL}/auth/refresh/`, { refresh })
      .then(({ data }) => {
        setTokens(data.access, refresh)
        return api.get('/auth/me/')
      })
      .then(({ data }) => setUser(data))
      .catch(() => clearTokens())
      .finally(() => setLoading(false))
  }, [])

  /**
   * Autentica al usuario con sus credenciales.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<object>} Datos del usuario autenticado.
   * @throws {AxiosError} Si las credenciales son incorrectas.
   */
  const login = useCallback(async (username, password) => {
    const response = await api.post('/auth/login/', { username, password })
    const { access, refresh, user: userData } = response.data
    setTokens(access, refresh)
    setUser(userData)
    return userData
  }, [])

  /**
   * Crea una nueva cuenta de maestro e inicia sesión automáticamente.
   * @param {{ username: string, name: string, password: string, password2: string }} data
   * @returns {Promise<object>} Datos del usuario recién creado.
   * @throws {AxiosError} Si los datos son inválidos o el usuario ya existe.
   */
  const register = useCallback(async (data) => {
    const response = await api.post('/auth/register/', data)
    const { access, refresh, user: userData } = response.data
    setTokens(access, refresh)
    setUser(userData)
    return userData
  }, [])

  /** Cierra la sesión: borra tokens de memoria y sessionStorage y limpia el estado. */
  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  const contextValue = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook para consumir el contexto de autenticación.
 * @returns {{ user: object|null, loading: boolean, login: Function, register: Function, logout: Function }}
 * @throws {Error} Si se usa fuera de un AuthProvider.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
