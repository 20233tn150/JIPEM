import { useState } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from './ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover'
import { cn } from '../lib/utils'

function parseDate(str) {
  if (!str) return undefined
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toISOLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function DatePicker({ value, onChange, id, required }) {
  const [open, setOpen] = useState(false)
  const selected = parseDate(value)

  const displayText = selected
    ? selected.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Seleccionar fecha'

  const handleSelect = (date) => {
    if (!date) return
    onChange(toISOLocal(date))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Hidden native input for form required validation */}
      {required && (
        <input
          type="text"
          value={value || ''}
          onChange={() => {}}
          required
          tabIndex={-1}
          className="sr-only"
          aria-hidden="true"
        />
      )}

      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          className={cn(
            "w-full flex items-center gap-2.5 px-4 py-2.5 border rounded-lg text-sm text-left bg-white transition-colors focus:outline-none",
            open
              ? "border-blue-500 ring-2 ring-blue-500/20"
              : "border-gray-300 hover:border-gray-400"
          )}
        >
          <CalendarIcon size={15} className="text-gray-400 shrink-0" />
          <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
            {displayText}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected || new Date()}
          disabled={{ before: new Date() }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
