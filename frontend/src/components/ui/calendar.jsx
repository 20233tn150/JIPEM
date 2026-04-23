import * as React from "react"
import { DayPicker } from "react-day-picker"
import { es } from "react-day-picker/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={es}
      className={cn("p-3 select-none", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "flex flex-col gap-3",
        month_caption: "flex justify-center items-center h-9",
        caption_label: "text-sm font-semibold text-gray-800 capitalize",
        nav: "flex items-center gap-1",
        button_previous: cn(
          "absolute left-3 flex items-center justify-center w-7 h-7 rounded-lg",
          "text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors",
          "disabled:opacity-30 disabled:pointer-events-none"
        ),
        button_next: cn(
          "absolute right-3 flex items-center justify-center w-7 h-7 rounded-lg",
          "text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors",
          "disabled:opacity-30 disabled:pointer-events-none"
        ),
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
        Chevron: ({ orientation }) =>
          orientation === 'left'
            ? <ChevronLeft className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}

export { Calendar }
