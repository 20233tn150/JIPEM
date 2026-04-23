import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FileSpreadsheet, ChevronLeft, Plus, ClipboardList, Upload, ArrowRight, Search, X, Trash2, RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'
import NewSessionModal from '../../components/NewSessionModal'

export default function ClassroomSessions() {
  const { classroomId } = useParams()
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [classroomName, setClassroomName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadingId, setUploadingId] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [excelLoading, setExcelLoading] = useState(false)
  const [showNewSession, setShowNewSession] = useState(false)


  useEffect(() => {
    fetchSessions()
  }, [classroomId])

  const fetchSessions = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/attendance/sessions/')
      const all = res.data.results || res.data
      const filtered = all
        .filter(s => String(s.classroom) === String(classroomId))
        .sort((a, b) => b.date.localeCompare(a.date))
      setSessions(filtered)
      if (filtered.length > 0) {
        setClassroomName(filtered[0].classroom_name || `Grupo ${classroomId}`)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar sesiones.')
    } finally {
      setLoading(false)
      setDeletingId(null)
    }
  }

  const confirmDelete = (session) => {
    setUploadError('')
    setConfirm({ session })
  }

  const handleDelete = async () => {
    const session = confirm.session
    setDeletingId(session.id)
    try {
      await api.delete(`/attendance/sessions/${session.id}/delete/`)
      setConfirm(null)
      fetchSessions()
    } catch (err) {
      setUploadError(err.response?.data?.error || err.response?.data?.detail || 'Error al eliminar la sesión.')
      setConfirm(null)
      setDeletingId(null)
    }
  }

  const handleVideoUpload = async (sessionId, file) => {
    if (!file) return
    setUploadError('')
    setUploadingId(sessionId)
    const formData = new FormData()
    formData.append('video', file)
    try {
      await api.post(`/attendance/sessions/${sessionId}/upload-video/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      fetchSessions()
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Error al subir video.')
    } finally {
      setUploadingId(null)
    }
  }

  const downloadExcel = async () => {
    setExcelLoading(true)
    try {
      const res = await api.get(`/attendance/attendance/excel/`, {
        params: { classroom_id: classroomId },
        responseType: 'blob',
      })

      const url = globalThis.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url

      const fileName = classroomName ? classroomName.replaceAll(/\s+/g, '_') : classroomId
      link.setAttribute('download', `Asistencia_${fileName}.xlsx`)

      document.body.appendChild(link)
      link.click()
      link.remove()
      globalThis.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error al descargar Excel", err)
      alert("Error al generar el Excel. Verifica que el grupo tenga sesiones completadas.")
    } finally {
      setExcelLoading(false)
    }
  }

  const q = search.toLowerCase()
  const visible = sessions.filter(s =>
    s.date.includes(q) ||
    (s.status || '').toLowerCase().includes(q)
  )

  console.log("Estado de auth:", { user });

  const noResultsContent = visible.length === 0 ? (
    <div className="p-8 text-center text-gray-400">
      <Search size={28} className="mx-auto mb-3 opacity-30" />
      <p className="text-sm">Sin resultados para "<strong>{search}</strong>"</p>
    </div>
  ) : (
    <>
      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {visible.map(session => (
          <div key={session.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-900">{session.date}</p>
              <StatusBadge status={session.status} />
            </div>
            {session.status === 'completed' && session.present_count !== undefined && (
              <p className="text-sm text-gray-500 mb-3">
                <span className="font-medium text-gray-800">{session.present_count}</span>
                {' / '}{session.total_students} presentes
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <Link
                to={`/attendance/${session.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 text-blue-600 border border-blue-200 hover:bg-blue-50 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              >
                Ver detalle <ArrowRight size={12} />
              </Link>
              {session.status === 'pending' && (
                <label className="flex-1 flex items-center justify-center gap-1.5 cursor-pointer text-green-600 border border-green-200 hover:bg-green-50 text-xs font-medium px-3 py-2 rounded-lg transition-colors">
                  <Upload size={12} />
                  {uploadingId === session.id ? 'Subiendo...' : 'Subir video'}
                  <input
                    type="file"
                    accept=".mp4,.avi,.mov,.mkv"
                    className="hidden"
                    disabled={uploadingId === session.id}
                    onChange={e => { if (e.target.files[0]) handleVideoUpload(session.id, e.target.files[0]) }}
                  />
                </label>
              )}
              {session.status !== 'processing' && (
                <button
                  onClick={() => confirmDelete(session)}
                  disabled={deletingId === session.id}
                  className="flex items-center justify-center gap-1.5 text-red-500 border border-red-200 hover:bg-red-50 text-xs font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asistencia</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.map(session => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{session.date}</td>
                <td className="px-6 py-4"><StatusBadge status={session.status} /></td>
                <td className="px-6 py-4 text-gray-600">
                  {session.status === 'completed' && session.present_count !== undefined ? (
                    <span className="font-medium">
                      {session.present_count}
                      <span className="text-gray-400 font-normal"> / {session.total_students} presentes</span>
                    </span>
                  ) : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <Link to={`/attendance/${session.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium px-2.5 py-1.5 rounded hover:bg-blue-50 transition-colors">
                      Ver <ArrowRight size={12} />
                    </Link>
                    {session.status === 'pending' && (
                      <label className="inline-flex items-center gap-1 cursor-pointer text-green-600 hover:text-green-800 text-xs font-medium px-2.5 py-1.5 rounded hover:bg-green-50 transition-colors border border-green-200">
                        <Upload size={12} />
                        {uploadingId === session.id ? 'Subiendo...' : 'Video'}
                        <input
                          type="file"
                          accept=".mp4,.avi,.mov,.mkv"
                          className="hidden"
                          disabled={uploadingId === session.id}
                          onChange={e => { if (e.target.files[0]) handleVideoUpload(session.id, e.target.files[0]) }}
                        />
                      </label>
                    )}
                    {session.status !== 'processing' && (
                      <button
                        onClick={() => confirmDelete(session)}
                        disabled={deletingId === session.id}
                        className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-medium px-2.5 py-1.5 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )

  const emptySessionsContent = sessions.length === 0 ? (
    <div className="p-12 text-center">
      <ClipboardList size={40} className="mx-auto mb-4 text-gray-300" />
      <p className="text-lg font-medium text-gray-600 mb-1">Sin sesiones para este grupo</p>
      <p className="text-sm text-gray-400 mb-6">Crea una nueva sesión de asistencia</p>
      <button
        onClick={() => setShowNewSession(true)}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        <Plus size={14} /> Nueva Sesión
      </button>
    </div>
  ) : noResultsContent

  const sessionsContent = loading ? (
    <div className="p-8 text-center text-gray-400">
      <ClipboardList size={32} className="mx-auto mb-3 animate-pulse opacity-40" />
      <p className="text-sm">Cargando sesiones...</p>
    </div>
  ) : emptySessionsContent

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-3">
        <Link to="/attendance" className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 w-fit">
          <ChevronLeft size={14} /> Asistencia
        </Link>
      </div>

      <PageHeader
        title={classroomName || `Grupo ${classroomId}`}
        subtitle="Sesiones de asistencia ordenadas por fecha"
        mobileSubtitle="Sesiones por fecha"
        action={
          <div className="hidden md:flex gap-2">
            {user?.role === 'admin' && (
              <button
                onClick={downloadExcel}
                disabled={excelLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow font-semibold transition-colors flex items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {excelLoading ? <RefreshCw size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
                {excelLoading ? 'Generando...' : 'Descargar Reporte Excel'}
              </button>
            )}
            <button
              onClick={() => setShowNewSession(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow font-semibold transition-colors flex items-center gap-2 text-sm"
            >
              <Plus size={15} /> Nueva Sesión
            </button>
          </div>
        }
      />

      {/* Mobile: botones en grid debajo del título */}
      <div className={`md:hidden grid gap-3 mb-6 ${user?.role === 'admin' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {user?.role === 'admin' && (
          <button
            onClick={downloadExcel}
            disabled={excelLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow font-semibold transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {excelLoading ? <RefreshCw size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
            {excelLoading ? 'Generando...' : 'Excel'}
          </button>
        )}
        <button
          onClick={() => setShowNewSession(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow font-semibold transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Plus size={15} /> Nueva Sesión
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {uploadError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {uploadError}
        </div>
      )}

      {/* Search bar */}
      {!loading && sessions.length > 0 && (
        <div className="mb-4 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filtrar por fecha o estado..."
            className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        {sessionsContent}
      </div>

      <NewSessionModal
        open={showNewSession}
        onClose={() => { setShowNewSession(false); fetchSessions() }}
        preselectedClassroom={classroomId}
      />

      <ConfirmDialog
        open={!!confirm}
        title="Eliminar sesión"
        message={
          confirm?.session.status === 'completed'
            ? `Se eliminará la sesión del ${confirm.session.date} junto con todos sus registros de asistencia.`
            : `Se eliminará la sesión del ${confirm?.session.date}.`
        }
        confirmLabel="Eliminar"
        loading={deletingId === confirm?.session?.id}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
