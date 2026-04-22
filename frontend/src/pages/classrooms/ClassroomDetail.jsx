import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Camera, ChevronLeft, CheckCircle, AlertTriangle, GraduationCap, Search, X } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function ClassroomDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [classroom, setClassroom] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [search, setSearch] = useState('')

  const visibleStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.matricula?.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [classRes, studentsRes] = await Promise.all([
        api.get(`/classrooms/${id}/`),
        api.get(`/classrooms/${id}/students/`),
      ])
      setClassroom(classRes.data)
      setStudents(studentsRes.data.results || studentsRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar el grupo.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStudent = async (studentId) => {
    try {
      await api.delete(`/classrooms/${id}/students/${studentId}/`)
      setDeleteConfirm(null)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al eliminar alumno.')
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-100 rounded w-32" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        <button onClick={() => navigate('/classrooms')} className="text-blue-600 hover:underline text-sm flex items-center gap-1">
          <ChevronLeft size={14} /> Volver a grupos
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-3">
        <Link to="/classrooms" className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 w-fit">
          <ChevronLeft size={14} /> Grupos
        </Link>
      </div>

      <PageHeader
        title={classroom?.name || 'Grupo'}
        subtitle={classroom?.subject}
        action={
          <Link
            to={`/classrooms/${id}/students/new`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={15} /> Agregar Alumno
          </Link>
        }
      />

      {/* Search */}
      {students.length > 0 && (
        <div className="mb-4 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o matrícula..."
            className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Grupo</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{classroom?.name}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Materia</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{classroom?.subject}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total de Alumnos</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{students.length}</p>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">Alumnos</h2>
        </div>
        {visibleStudents.length === 0 ? (
          <div className="p-10 text-center">
            <GraduationCap size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Sin alumnos en este grupo</p>
            <p className="text-sm mt-1 mb-4 text-gray-400">Agrega el primer alumno para comenzar</p>
            <Link
              to={`/classrooms/${id}/students/new`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} /> Agregar Alumno
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {visibleStudents.map(student => {
                const sexLabel = student.sex === 'M' ? 'Masculino' : student.sex === 'F' ? 'Femenino' : '—'
                return (
                  <div key={student.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{student.name}</p>
                        <p className="text-xs font-mono text-gray-500 mt-0.5">{student.matricula}</p>
                      </div>
                      {student.face_sample_count > 0 ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          student.has_enough_face_samples ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {student.has_enough_face_samples ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                          {student.face_sample_count} muestras
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          Sin registro
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{sexLabel}{student.age ? ` · ${student.age} años` : ''}</p>
                    <div className="flex gap-2">
                      <Link
                        to={`/classrooms/${id}/students/${student.id}/edit`}
                        className="flex-1 flex items-center justify-center gap-1.5 text-blue-600 border border-blue-200 hover:bg-blue-50 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                      >
                        <Pencil size={13} /> Editar
                      </Link>
                      <Link
                        to={`/classrooms/students/${student.id}/face-capture`}
                        className="flex-1 flex items-center justify-center gap-1.5 text-purple-600 border border-purple-200 hover:bg-purple-50 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                      >
                        <Camera size={13} /> Rostro
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm(student)}
                        className="flex items-center justify-center gap-1.5 text-red-500 border border-red-200 hover:bg-red-50 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matrícula</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sexo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reconocimiento Facial</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleStudents.map(student => {
                    let sexLabel
                    if (student.sex === 'M') { sexLabel = 'Masculino' }
                    else if (student.sex === 'F') { sexLabel = 'Femenino' }
                    else { sexLabel = '—' }
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 font-mono text-gray-600 text-xs">{student.matricula}</td>
                        <td className="px-6 py-4 text-gray-600">{student.age || '—'}</td>
                        <td className="px-6 py-4 text-gray-600">{sexLabel}</td>
                        <td className="px-6 py-4">
                          {student.face_sample_count > 0 ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              student.has_enough_face_samples ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {student.has_enough_face_samples ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                              {student.face_sample_count} muestras
                              {!student.has_enough_face_samples && ' (insuficiente)'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              Sin registro
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/classrooms/${id}/students/${student.id}/edit`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium px-2.5 py-1.5 rounded hover:bg-blue-50 transition-colors">
                              <Pencil size={13} /> Editar
                            </Link>
                            <Link to={`/classrooms/students/${student.id}/face-capture`} className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 text-xs font-medium px-2.5 py-1.5 rounded hover:bg-purple-50 transition-colors">
                              <Camera size={13} /> Rostro
                            </Link>
                            <button onClick={() => setDeleteConfirm(student)} className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-medium px-2.5 py-1.5 rounded hover:bg-red-50 transition-colors">
                              <Trash2 size={13} /> Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Eliminar alumno"
        message={deleteConfirm ? `¿Estás seguro de eliminar a ${deleteConfirm.name}? Se eliminarán también sus registros de asistencia y análisis.` : ''}
        confirmLabel="Eliminar"
        onConfirm={() => handleDeleteStudent(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
