import { useMobileDetection } from '../hooks/useMobileDetection'

const sizeVariants = {
  sm: 'max-w-md w-full',
  md: 'max-w-lg w-full',
  lg: 'max-w-2xl w-full',
  xl: 'max-w-4xl w-full',
  '6xl': 'max-w-6xl w-[95vw] max-h-[90vh]',
}

export default function Modal({
  open,
  onClose,
  children,
  size = 'md',
  className = '',
  title,
  mobileDrawer = false,
}) {
  const isMobile = useMobileDetection(640)

  if (!open) return null

  const isDrawerMode = mobileDrawer && isMobile

  return (
    <div
      className={`fixed inset-0 z-[9999] flex ${isDrawerMode ? 'items-end' : 'items-center'} justify-center ${isDrawerMode ? 'p-0' : 'p-4'}`}
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 transition-all"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`relative ${
          isDrawerMode
            ? 'w-full rounded-t-2xl rounded-b-none mb-0 pb-safe shadow-2xl'
            : `${sizeVariants[size] || sizeVariants.md} rounded-3xl shadow-xl`
        } mx-auto bg-white p-0 overflow-visible ${className}`}
        style={{
          animation: isDrawerMode
            ? 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'fadeIn 0.2s',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 focus:outline-none hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors text-2xl"
          aria-label="Cerrar"
        >
          ×
        </button>

        {/* Drawer handle — solo visible en modo drawer */}
        {isDrawerMode && (
          <div className="mx-auto mt-3 mb-1 w-10 h-1 bg-gray-300 rounded-full" />
        )}

        {title && (
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
        )}

        <div className="p-6 max-h-full overflow-y-auto">{children}</div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
