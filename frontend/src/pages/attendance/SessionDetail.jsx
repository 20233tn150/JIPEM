import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, CheckCircle, XCircle, ClipboardList, ExternalLink, RefreshCw, Upload, Trash2, AlertTriangle, Download } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toggling, setToggling] = useState(null)
  const [retryFile, setRetryFile] = useState(null)
  const [retryLoading, setRetryLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [retryError, setRetryError] = useState('')
  const pollingRef = useRef(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    fetchData()
    return () => clearInterval(pollingRef.current)
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/attendance/sessions/${id}/`)
      setSession(res.data)
      setRecords(res.data.records || [])
      if (res.data.status === 'processing') {
        startPolling()
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar la sesión.')
    } finally {
      setLoading(false)
    }
  }

  const startPolling = () => {
    clearInterval(pollingRef.current)
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/attendance/sessions/${id}/status/`)
        if (res.data.status !== 'processing') {
          clearInterval(pollingRef.current)
          fetchData()
        }
      } catch {
        clearInterval(pollingRef.current)
      }
    }, 3000)
  }

  const openReport = async () => {
    try {
      const res = await api.get(`/reports/attendance/?session_id=${id}`, { responseType: 'text' })
      const blob = new Blob([res.data], { type: 'text/html' })
      window.open(URL.createObjectURL(blob), '_blank')
    } catch {
    }
  }

  const handleToggle = async (record) => {
    setToggling(record.id)
    try {
      const res = await api.patch(`/attendance/records/${record.id}/`)
      setRecords(prev =>
        prev.map(r => r.id === record.id ? { ...r, is_present: res.data.is_present } : r)
      )
    } catch {
    } finally {
      setToggling(null)
    }
  }

  const downloadPDF = async () => {
    setPdfLoading(true)
    try {
      const res = await api.get(`/reports/attendance/pdf/`, {
        params: { session_id: id },
        responseType: 'blob'
      });

      const url = globalThis.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Asistencia_${session.classroom_name || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar PDF:", err);
      alert("No se pudo generar el archivo PDF.");
    } finally {
      setPdfLoading(false)
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-32 bg-gray-100 rounded-xl" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        <Link to="/attendance" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
          <ChevronLeft size={14} /> Volver
        </Link>
      </div>
    )
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await api.delete(`/attendance/sessions/${id}/`)
      navigate('/attendance')
    } catch (err) {
      setRetryError(err.response?.data?.error || 'Error al eliminar la sesión.')
      setDeleteLoading(false)
      setDeleteConfirm(false)
    }
  }

  const handleRetry = async () => {
    if (!retryFile) {
      setRetryError('Selecciona un archivo de video.')
      return
    }
    setRetryLoading(true)
    setRetryError('')
    try {
      const formData = new FormData()
      formData.append('video', retryFile)
      await api.post(`/attendance/sessions/${id}/upload-video/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setRetryFile(null)
      setSession(prev => ({ ...prev, status: 'processing' }))
      startPolling()
    } catch (err) {
      setRetryError(err.response?.data?.error || 'Error al subir el video.')
    } finally {
      setRetryLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-100 rounded-xl" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        <Link to="/attendance" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
          <ChevronLeft size={14} /> Volver a sesiones
        </Link>
      </div>
    )
  }

  const presentCount = records.filter(r => r.is_present).length
  const totalCount = records.length
  const attendancePct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
  const isCompleted = session?.status === 'completed'
  const isError = session?.status === 'error'
  const isPending = session?.status === 'pending'
  const isProcessing = session?.status === 'processing'
  const canDelete = !isProcessing

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-3 flex items-center gap-1 text-sm text-gray-400">
        <Link to="/attendance" className="hover:text-blue-600 transition-colors">Asistencia</Link>
        <ChevronLeft size={12} className="rotate-180" />
        {session?.classroom && (
          <>
            <Link to={`/attendance/classroom/${session.classroom}`} className="hover:text-blue-600 transition-colors">
              {session.classroom_name || `Grupo ${session.classroom}`}
            </Link>
            <ChevronLeft size={12} className="rotate-180" />
          </>
        )}
        <span className="text-gray-600">Sesión</span>
      </div>

      <PageHeader
        title={`Sesión del ${session?.date}`}
        subtitle={session?.classroom_name || `Grupo ${session?.classroom}`}
        action={
          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                onClick={() => setDeleteConfirm(true)}
                disabled={deleteLoading}
                className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Trash2 size={15} />
                Eliminar sesión
              </button>
            )}
            {isCompleted && (
              <div className="flex items-center gap-2">
                <button
                  onClick={openReport}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <ExternalLink size={15} /> Ver HTML
                </button>

              </div>
            )}
          </div>
        }
      />

      {retryError && !isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0" />
          {retryError}
        </div>
      )}

      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 text-sm">
          <RefreshCw size={16} className="animate-spin flex-shrink-0" />
          <span>Procesando video de asistencia... Los resultados aparecerán automáticamente.</span>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Error en el procesamiento</p>
              <p className="text-sm text-red-600 mt-0.5">{session.error_message || 'Ocurrió un error al procesar el video.'}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept=".mp4,.avi,.mov,.mkv"
                className="hidden"
                onChange={e => { setRetryFile(e.target.files[0]); setRetryError('') }}
              />
              <div className="flex items-center gap-2 border border-dashed border-red-300 rounded-lg px-4 py-2.5 text-sm text-red-600 hover:bg-red-100 transition-colors">
                <Upload size={15} />
                {retryFile ? retryFile.name : 'Seleccionar nuevo video'}
              </div>
            </label>
            <button
              onClick={handleRetry}
              disabled={retryLoading || !retryFile}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {retryLoading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Reintentar
            </button>
          </div>
          {retryError && (
            <p className="text-xs text-red-600 mt-2">{retryError}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Grupo</p>
          <p className="text-base font-bold text-gray-900 mt-1">
            {session?.classroom_name || `Grupo ${session?.classroom}`}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha</p>
          <p className="text-base font-bold text-gray-900 mt-1">{session?.date}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</p>
          <div className="mt-2">
            <StatusBadge status={session?.status} />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Presentes</p>
          <p className="text-base font-bold mt-1">
            <span className="text-green-600">{presentCount}</span>
            <span className="text-gray-400"> / {totalCount}</span>
          </p>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Resumen de asistencia</p>
            <p className="text-sm text-gray-500">
              {presentCount} presentes — {totalCount - presentCount} ausentes
            </p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="h-2.5 bg-green-500 rounded-full transition-all"
              style={{ width: `${attendancePct}%` }}
            />
          </div>
          <p className="text-xs text-green-600 font-medium mt-1.5">{attendancePct}% de asistencia</p>
        </div>
      )}


      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Registro de Asistencia</h2>
          {isCompleted && records.length > 0 && (
            <p className="text-xs text-gray-400">Haz clic en el estado para corregir manualmente</p>
          )}
        </div>
        {records.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardList size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Sin registros de asistencia</p>
            {isPending && (
              <p className="text-sm mt-2 text-gray-400">Sube un video para procesar la asistencia automáticamente</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matrícula</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asistencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map(record => {
                  const presentIcon = record.is_present ? <CheckCircle size={11} /> : <XCircle size={11} />
                  const toggleIcon = toggling === record.id
                    ? <RefreshCw size={11} className="animate-spin" />
                    : presentIcon

                  const staticBadge = record.is_present ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle size={12} /> Presente
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle size={12} /> Ausente
                    </span>
                  )

                  return (
                    <tr key={record.id} className={`hover:bg-gray-50 transition-colors ${record.is_present ? '' : 'opacity-60'}`}>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {record.student_name || record.student?.name || '—'}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-600 text-xs">
                        {record.student_matricula || record.student?.matricula || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {isCompleted ? (
                          <button
                            onClick={() => handleToggle(record)}
                            disabled={toggling === record.id}
                            title="Haz clic para cambiar manualmente"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:ring-2 hover:ring-offset-1 disabled:opacity-50 ${record.is_present
                              ? 'bg-green-100 text-green-800 hover:ring-green-400'
                              : 'bg-red-100 text-red-800 hover:ring-red-400'
                              }`}
                          >
                            {toggleIcon}
                            {record.is_present ? 'Presente' : 'Ausente'}
                          </button>
                        ) : staticBadge}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirm}
        title="Eliminar sesión"
        message={
          isCompleted
            ? `Se eliminará la sesión del ${session?.date} junto con todos sus registros de asistencia.`
            : `Se eliminará la sesión del ${session?.date}.`
        }
        confirmLabel="Eliminar"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
      />
    </div>
  )
}
