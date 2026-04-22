import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

function Spinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

export default function ConfirmDialog({
  open,
  title = '¿Estás seguro?',
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onCancel}
      size="sm"
      mobileDrawer
    >
      <div className="flex items-start gap-3 mb-5 -mt-2">
        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
          <AlertTriangle size={17} className={danger ? 'text-red-600' : 'text-amber-600'} />
        </div>
        <div className="pt-0.5">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {message && <p className="text-sm text-gray-500 mt-1">{message}</p>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row-reverse gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
          }`}
        >
          {loading && <Spinner />}
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
      </div>
    </Modal>
  )
}
