import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

/**
 * SearchableSelect — drop-in replacement for <select> with a built-in search input.
 *
 * Props:
 *  value       — currently selected value (string / number)
 *  onChange    — (value: string) => void
 *  options     — [{ value, label }]
 *  placeholder — text shown when nothing is selected (also acts as "clear" option)
 *  disabled    — boolean
 *  ringColor   — tailwind ring class, e.g. 'focus-within:ring-purple-500'
 *  required    — boolean (used for native form validation hint)
 */
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  disabled = false,
  ringColor = 'ring-blue-500',
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const selected = options.find(o => String(o.value) === String(value))
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const handleSelect = (val) => {
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={[
          'w-full px-4 py-2.5 border rounded-lg text-sm text-left flex items-center justify-between gap-2 bg-white outline-none transition-colors',
          disabled
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-300'
            : 'border-gray-300 hover:border-gray-400',
          open ? `ring-2 ${ringColor} border-transparent` : '',
        ].join(' ')}
      >
        <span className={selected ? 'text-gray-900 truncate' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2.5 py-1.5 border border-gray-200 rounded-md bg-gray-50">
              <Search size={13} className="text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full text-left px-4 py-2 text-sm ${
                value
                  ? 'text-gray-400 hover:bg-gray-50'
                  : 'bg-blue-50 text-blue-600 font-medium'
              }`}
            >
              {placeholder}
            </button>

            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400 text-center">
                Sin resultados
              </p>
            ) : (
              filtered.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleSelect(String(o.value))}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    String(value) === String(o.value)
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
