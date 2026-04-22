/**
 * Cliente HTTP de Presentia — axios preconfigurado con autenticación JWT automática.
 *
 * Estrategia de tokens:
 *  - access token  → solo en memoria RAM (no localStorage) para proteger contra XSS.
 *  - refresh token → en sessionStorage para sobrevivir recargas de página.
 *
 * Interceptores:
 *  - Request:  adjunta el access token como Bearer header en cada petición.
 *  - Response: si llega un 401, intenta refrescar el token automáticamente.
 *              Las peticiones que llegan mientras se refresca se encolan y se
 *              reintentan una vez que el nuevo access token esté disponible.
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL

// Access token stays in memory (XSS protection).
// Refresh token goes to sessionStorage so page reloads don't kill the session.
let accessToken = null
let isRefreshing = false
let failedQueue = []

/**
 * Guarda el par de tokens tras un login o refresh exitoso.
 * @param {string} access  - Nuevo access token JWT (15 min de vida).
 * @param {string|null} refresh - Refresh token (1 día); null para no actualizar sessionStorage.
 */
export function setTokens(access, refresh) {
  accessToken = access
  if (refresh) sessionStorage.setItem('rt', refresh)
}

/** Elimina ambos tokens de memoria y sessionStorage. Llama en logout o 401 irrecuperable. */
export function clearTokens() {
  accessToken = null
  sessionStorage.removeItem('rt')
}

/** Devuelve el access token en memoria, o null si no hay sesión activa. */
export function getAccessToken() {
  return accessToken
}

/** Devuelve el refresh token de sessionStorage, o null si no existe. */
export function getStoredRefresh() {
  return sessionStorage.getItem('rt')
}

/**
 * Resuelve o rechaza todas las peticiones encoladas durante un refresh en curso.
 * @param {Error|null} error - Error del refresh; null si fue exitoso.
 * @param {string|null} token - Nuevo access token si el refresh fue exitoso.
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach access token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor: auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const storedRefresh = getStoredRefresh()

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (!storedRefresh) {
        clearTokens()
        globalThis.location.href = '/login'
        throw error
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh/`, {
          refresh: storedRefresh,
        })
        const newAccess = response.data.access
        accessToken = newAccess
        processQueue(null, newAccess)
        originalRequest.headers['Authorization'] = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        globalThis.location.href = '/login'
        throw refreshError
      } finally {
        isRefreshing = false
      }
    }

    throw error
  },
)

export default api
