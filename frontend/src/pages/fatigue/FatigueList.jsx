import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, BrainCircuit, ArrowRight, User, Calendar, Search, X, Trash2 } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import SearchableSelect from '../../components/SearchableSelect'
import ConfirmDialog from '../../components/ConfirmDialog'

const LABEL_STYLE = {
  atento:    { bg: 'bg-green-100',  text: 'text-green-700'  },
  fatigado:  { bg: 'bg-red-100',    text: 'text-red-700'    },
  distraido: { bg: 'bg-amber-100',  text: 'text-amber-700'  },
}

export default function FatigueList() {
  const [analyses, setAnalyses] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [filterClassroom, setFilterClassroom] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [confirm, setConfirm] = useState(null) // analysis object

  useEffect(() => {
    Promise.all([
      api.get('/fatigue/individual/'),
      api.get('/classrooms/'),
    ])
      .then(([aRes, cRes]) => {
        setAnalyses(aRes.data.results || aRes.data)
        setClassrooms(cRes.data.results || cRes.data)
      })
      .catch(err => setError(err.response?.data?.detail || 'Error al cargar análisis.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async () => {
    const a = confirm
    setDeletingId(a.id)
    try {
      await api.delete(`/fatigue/individual/${a.id}/delete/`)
      setAnalyses(prev => prev.filter(x => x.id !== a.id))
      setConfirm(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el análisis.')
      setConfirm(null)
    } finally {
      setDeletingId(null)
    }
  }

  const classroomOptions = classrooms.map(c => ({ value: String(c.id), label: c.name }))

  const q = search.toLowerCase()
  const filtered = analyses.filter(a => {
    const matchGroup = filterClassroom ? String(a.classroom_id) === filterClassroom : true
    const matchSearch = !q ||
      (a.student_name || '').toLowerCase().includes(q) ||
      (a.student_matricula || '').toLowerCase().includes(q) ||
      (a.classroom_name || '').toLowerCase().includes(q) ||
      (a.date || '').includes(q) ||
      (a.result_label || '').toLowerCase().includes(q) ||
      (a.status || '').toLowerCase().includes(q)
    return matchGroup && matchSearch
  })

  let listContent
  if (loading) { listContent = 'loading' }
  else if (analyses.length === 0) { listContent = 'empty' }
  else if (filtered.length === 0) { listContent = 'no-results' }
  else { listContent = 'table' }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Fatiga y Atención"
        subtitle="Análisis individuales por alumno"
        action={
          <Link
            to="/fatigue/new"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={15} /> Nuevo Análisis
          </Link>
        }
      />

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      {!loading && analyses.length > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row gap-2">
          {/* Text search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por alumno, matrícula, grupo, fecha..."
              className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
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

          {/* Group filter */}
          {classrooms.length > 0 && (
            <div className="w-full sm:w-56">
              <SearchableSelect
                value={filterClassroom}
                onChange={setFilterClassroom}
                options={classroomOptions}
                placeholder="Todos los grupos"
                ringColor="ring-purple-500"
              />
            </div>
          )}
        </div>
      )}

      {listContent === 'loading' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="divide-y">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-48" />
                  <div className="h-2.5 bg-gray-100 rounded w-32" />
                </div>
                <div className="h-6 w-20 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}
      {listContent === 'empty' && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <BrainCircuit size={40} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-600 mb-1">Sin análisis registrados</p>
          <p className="text-sm text-gray-400 mb-6">Crea el primer análisis individual de un alumno</p>
          <Link
            to="/fatigue/new"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
          >
            <Plus size={14} /> Nuevo Análisis
          </Link>
        </div>
      )}
      {listContent === 'no-results' && (
        <div className="bg-white rounded-xl border p-10 text-center text-gray-400">
          <Search size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin resultados para los filtros aplicados</p>
          <button
            onClick={() => { setSearch(''); setFilterClassroom('') }}
            className="mt-2 text-xs text-purple-600 hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}
      {listContent === 'table' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atención</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resultado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(a => {
                  const labelStyle = LABEL_STYLE[a.result_label] || {}
                  const attPct = Math.round(a.attention_score)
                  let attColor
                  if (attPct >= 70) { attColor = 'bg-green-500' }
                  else if (attPct >= 40) { attColor = 'bg-amber-500' }
                  else { attColor = 'bg-red-500' }

                  let attTextColor
                  if (attPct >= 70) { attTextColor = 'text-green-600' }
                  else if (attPct >= 40) { attTextColor = 'text-amber-600' }
                  else { attTextColor = 'text-red-600' }
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <User size={13} className="text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{a.student_name}</p>
                            <p className="text-xs text-gray-400 font-mono">{a.student_matricula}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs">{a.classroom_name || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-gray-600 text-xs">
                          <Calendar size={11} />
                          {a.date}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-6 py-4 min-w-28">
                        {a.status === 'completed' && a.result_label ? (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold w-8 text-right ${attTextColor}`}>
                              {attPct}%
                            </span>
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${attColor}`} style={{ width: `${attPct}%` }} />
                            </div>
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        {a.result_label ? (
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${labelStyle.bg} ${labelStyle.text}`}>
                            {a.result_label}
                          </span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/fatigue/individual/${a.id}`}
                            className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 text-xs font-medium px-2.5 py-1.5 rounded hover:bg-purple-50 transition-colors"
                          >
                            Ver <ArrowRight size={12} />
                          </Link>
                          {a.status !== 'processing' && (
                            <button
                              onClick={() => setConfirm(a)}
                              disabled={deletingId === a.id}
                              className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-medium px-2.5 py-1.5 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Eliminar análisis"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="Eliminar análisis"
        message={confirm ? `Se eliminará el análisis de ${confirm.student_name} del ${confirm.date}.` : ''}
        confirmLabel="Eliminar"
        loading={deletingId === confirm?.id}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
