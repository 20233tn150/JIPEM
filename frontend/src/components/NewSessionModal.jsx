import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Loader2, CheckCircle } from 'lucide-react'
import api from '../api/axios'
import Modal from './Modal'
import SearchableSelect from './SearchableSelect'
import DatePicker from './DatePicker'

export default function NewSessionModal({ open, onClose, preselectedClassroom = '' }) {
  const navigate = useNavigate()
  const [classrooms, setClassrooms] = useState([])
  const [form, setForm] = useState({ classroom: preselectedClassroom, date: '' })
  const [session, setSession] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const pollingRef = useRef(null)

  useEffect(() => {
    api.get('/classrooms/').then(r => setClassrooms(r.data.results || r.data))
    return () => clearInterval(pollingRef.current)
  }, [])

  // Reset state every time the modal opens
  useEffect(() => {
    if (open) {
      setForm({
        classroom: preselectedClassroom,
        date: new Date().toISOString().split('T')[0],
      })
      setSession(null)
      setVideoFile(null)
      setStatus('')
      setError('')
      setLoading(false)
      clearInterval(pollingRef.current)
    }
  }, [open, preselectedClassroom])

  const isProcessing = status === 'processing'

  const handleClose = () => {
    if (isProcessing) return
    clearInterval(pollingRef.current)
    onClose()
  }

  const createSession = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/attendance/sessions/', {
        classroom: form.classroom,
        date: form.date,
      })
      setSession(res.data)
    } catch (err) {
      setError(
        err.response?.data?.classroom?.[0] ||
        err.response?.data?.detail ||
        'Error al crear sesión.'
      )
    } finally {
      setLoading(false)
    }
  }

  const uploadVideo = async () => {
    if (!videoFile || !session) return
    setError('')
    setLoading(true)
    const formData = new FormData()
    formData.append('video', videoFile)
    try {
      await api.post(`/attendance/sessions/${session.id}/upload-video/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setStatus('processing')
      startPolling(session.id)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir video.')
    } finally {
      setLoading(false)
    }
  }

  const startPolling = (sessionId) => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/attendance/sessions/${sessionId}/status/`)
        setStatus(res.data.status)
        if (res.data.status === 'completed') {
          clearInterval(pollingRef.current)
          navigate(`/attendance/${sessionId}`)
        } else if (res.data.status === 'error') {
          clearInterval(pollingRef.current)
          setError(res.data.error_message || 'Error en el procesamiento.')
          setStatus('')
        }
      } catch {}
    }, 3000)
  }

  const classroomOptions = classrooms.map(c => ({
    value: String(c.id),
    label: `${c.name} — ${c.subject}`,
  }))

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nueva Sesión de Asistencia"
      size="sm"
      mobileDrawer
    >
      {/* Step 3 — procesando */}
      {isProcessing && (
        <div className="text-center space-y-4 py-4 -mt-2">
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
              <Loader2 size={28} className="text-blue-500 animate-spin" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-800">Procesando asistencia...</p>
            <p className="text-sm text-gray-500 mt-1">Esto puede tardar varios minutos según la duración del video</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="h-1.5 bg-blue-500 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* Step 2 — subir video */}
      {!isProcessing && session && (
        <div className="space-y-4 -mt-2">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle size={18} className="text-green-600 shrink-0" />
            <p className="text-green-800 font-medium text-sm">Sesión creada correctamente</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Video de clase</label>
            <input
              type="file"
              accept=".mp4,.avi,.mov,.mkv"
              onChange={(e) => setVideoFile(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">MP4, AVI, MOV, MKV — Máx 500MB</p>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex flex-col sm:flex-row-reverse gap-2">
            <button
              onClick={uploadVideo}
              disabled={!videoFile || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Upload size={15} />
              {loading ? 'Subiendo...' : 'Subir Video y Procesar'}
            </button>
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Step 1 — crear sesión */}
      {!isProcessing && !session && (
        <form onSubmit={createSession} className="space-y-4 -mt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Grupo</label>
            {preselectedClassroom ? (
              <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600">
                {classroomOptions.find(c => c.value === String(preselectedClassroom))?.label || `Grupo ${preselectedClassroom}`}
              </div>
            ) : (
              <>
                <SearchableSelect
                  value={form.classroom}
                  onChange={val => setForm(f => ({ ...f, classroom: val }))}
                  options={classroomOptions}
                  placeholder="Seleccionar grupo..."
                />
                <input
                  type="text"
                  value={form.classroom}
                  onChange={() => {}}
                  required
                  tabIndex={-1}
                  className="sr-only"
                />
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha</label>
            <DatePicker
              value={form.date}
              onChange={(val) => setForm(f => ({ ...f, date: val }))}
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex flex-col sm:flex-row-reverse gap-2 pt-1">
            <button
              type="submit"
              disabled={loading || !form.classroom}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Creando...' : 'Crear Sesión'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
