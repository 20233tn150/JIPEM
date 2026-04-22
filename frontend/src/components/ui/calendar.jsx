import * as React from "react"
import { DayPicker } from "react-day-picker"
import { es } from "react-day-picker/locale"
import * as SelectPrimitive from "@radix-ui/react-select"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "../../lib/utils"

/* Dropdown estilizado con Radix Select */
function CalendarDropdown({ value, onChange, options, 'aria-label': ariaLabel }) {
  const handleValueChange = (newValue) => {
    onChange?.({ target: { value: newValue } })
  }

  return (
    <SelectPrimitive.Root value={String(value)} onValueChange={handleValueChange}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white",
          "px-2.5 py-1.5 text-sm font-semibold text-gray-800",
          "hover:border-gray-300 hover:bg-gray-50 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        )}
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "z-[10001] min-w-[7rem] max-h-60 overflow-hidden",
            "rounded-xl border border-gray-200 bg-white shadow-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          )}
        >
          <SelectPrimitive.Viewport className="p-1 max-h-60 overflow-y-auto">
            {options?.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={String(opt.value)}
                disabled={opt.disabled}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-lg",
                  "py-1.5 pl-7 pr-3 text-sm text-gray-700 outline-none capitalize",
                  "focus:bg-gray-100 focus:text-gray-900",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
                  "data-[state=checked]:font-semibold data-[state=checked]:text-blue-600"
                )}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <svg className="h-3 w-3 text-blue-600" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={es}
      captionLayout="dropdown"
      className={cn("p-3 select-none", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "flex flex-col gap-3",
        month_caption: "flex justify-center items-center h-9",
        caption_label: "hidden",
        dropdowns: "flex items-center gap-2",
        dropdown_root: "",
        /* Flechas ocultas */
        nav: "hidden",
        month_grid: "w-full border-collapse mt-1",
        weekdays: "flex",
        weekday: "flex-1 text-center text-xs font-medium text-gray-400 pb-1 capitalize",
        week: "flex mt-1",
        day: "flex-1 p-0 text-center",
        day_button: cn(
          "h-9 w-9 mx-auto flex items-center justify-center rounded-lg text-sm",
          "transition-colors hover:bg-gray-100 text-gray-700 cursor-pointer",
          "disabled:opacity-30 disabled:pointer-events-none"
        ),
        selected: "[&>button]:bg-blue-600 [&>button]:text-white [&>button]:hover:bg-blue-700 [&>button]:font-semibold",
        today: "[&>button]:text-blue-600 [&>button]:font-bold",
        outside: "[&>button]:text-gray-300 [&>button]:hover:bg-transparent",
        disabled: "[&>button]:opacity-30 [&>button]:pointer-events-none",
        ...classNames,
      }}
      components={{
        Dropdown: CalendarDropdown,
      }}
      {...props}
    />
  )
}

export { Calendar }
