import { Eye, Camera, BrainCircuit, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'
import PageHeader from '../components/PageHeader'

function Section({ icon: Icon, color, title, children }) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Step({ number, title, description }) {
  return (
    <div className="flex gap-4">
      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

function LevelBadge({ label, color, textColor, description }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border">
      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${color} ${textColor}`}>
        {label}
      </span>
      <p className="text-sm text-gray-600 mt-0.5">{description}</p>
    </div>
  )
}

export default function HowItWorks() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title="¿Cómo se mide la atención?"
        subtitle="Metodología del análisis de fatiga y atención"
      />

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-6 flex gap-3">
        <Info size={17} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Esta sección explica de forma clara cómo el sistema analiza la atención de los estudiantes.
          No se utilizan técnicas invasivas ni se almacena información biométrica sensible más allá
          de las muestras faciales necesarias para el reconocimiento.
        </p>
      </div>

      <div className="space-y-5">
        {/* What is measured */}
        <Section icon={Eye} color="bg-blue-500" title="¿Qué se mide?">
          <p className="text-sm text-gray-600 mb-4">
            El sistema usa <span className="font-semibold text-gray-800">PERCLOS</span> (Percentage
            of Eye Closure), un indicador científico ampliamente utilizado en investigación de
            seguridad vial y ergonomía cognitiva para detectar somnolencia. Mide qué porcentaje
            del tiempo de grabación el estudiante tuvo los ojos cerrados o no visibles.
          </p>
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700 font-mono border">
            PERCLOS = frames sin ojos detectados ÷ frames con cara visible
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Un PERCLOS alto indica que los ojos estuvieron cerrados durante gran parte del video,
            lo que se asocia a baja atención o fatiga.
          </p>
        </Section>

        {/* How it works step by step */}
        <Section icon={Camera} color="bg-slate-600" title="Proceso paso a paso">
          <div className="space-y-4">
            <Step
              number="1"
              title="Identificación del estudiante"
              description="Al subir el video, el sistema localiza el rostro del alumno fotograma a fotograma usando reconocimiento facial entrenado con sus muestras registradas."
            />
            <Step
              number="2"
              title="Detección de ojos"
              description="En cada fotograma donde se detecta la cara, el sistema analiza la zona superior del rostro para determinar si los ojos están abiertos o cerrados."
            />
            <Step
              number="3"
              title="Conteo de cierre sostenido"
              description="Si los ojos permanecen cerrados por más de medio segundo consecutivo, se cuenta como un episodio de cierre prolongado. Esto distingue parpadeos normales de adormecimiento."
            />
            <Step
              number="4"
              title="Cálculo de puntuaciones"
              description="Se calculan dos puntuaciones (0–100): Atención, que refleja qué tan despierto estuvo el alumno; y Fatiga, que cuantifica los indicadores de somnolencia detectados."
            />
          </div>
        </Section>

        {/* Classification levels */}
        <Section icon={BrainCircuit} color="bg-purple-500" title="Niveles de clasificación">
          <p className="text-sm text-gray-600 mb-4">
            Al finalizar el análisis, el sistema asigna una de tres clasificaciones según la
            puntuación de atención obtenida:
          </p>
          <div className="space-y-2.5">
            <LevelBadge
              label="Atento"
              color="bg-green-100"
              textColor="text-green-800"
              description="Puntuación de atención ≥ 70. El alumno mantuvo los ojos abiertos la mayor parte del tiempo. Se considera un nivel adecuado de atención durante la clase."
            />
            <LevelBadge
              label="Distraído"
              color="bg-amber-100"
              textColor="text-amber-800"
              description="Puntuación entre 40 y 69. Se detectaron episodios moderados de cierre de ojos. Puede indicar cansancio parcial o distracción intermitente."
            />
            <LevelBadge
              label="Fatigado"
              color="bg-red-100"
              textColor="text-red-800"
              description="Puntuación menor a 40. El alumno tuvo los ojos cerrados durante una fracción significativa del video. Indica fatiga elevada o adormecimiento."
            />
          </div>
        </Section>

        {/* Limitations */}
        <Section icon={AlertTriangle} color="bg-amber-500" title="Consideraciones importantes">
          <ul className="space-y-2.5 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="text-amber-500 shrink-0 mt-0.5">•</span>
              <span>El análisis es una <span className="font-medium text-gray-800">herramienta de apoyo</span>, no un diagnóstico definitivo. Factores como mala iluminación, ángulo de cámara o gafas pueden afectar los resultados.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 shrink-0 mt-0.5">•</span>
              <span>Para obtener resultados precisos, el video debe mostrar claramente el rostro del estudiante y haber sido grabado en condiciones de <span className="font-medium text-gray-800">buena iluminación</span>.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 shrink-0 mt-0.5">•</span>
              <span>El sistema requiere que el alumno tenga <span className="font-medium text-gray-800">muestras faciales registradas</span> previamente para poder identificarlo en el video.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 shrink-0 mt-0.5">•</span>
              <span>Una clasificación de "Fatigado" no implica necesariamente negligencia del alumno — puede reflejar causas externas como trasnoche, enfermedad o factores personales.</span>
            </li>
          </ul>
        </Section>

        {/* What it does NOT do */}
        <Section icon={XCircle} color="bg-gray-500" title="Lo que el sistema NO hace">
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              'No graba ni almacena los videos de clase — el archivo se elimina automáticamente tras el análisis.',
              'No analiza expresiones faciales, emociones ni lenguaje corporal.',
              'No comparte datos con terceros ni servicios externos.',
              'No toma decisiones automáticas — toda acción requiere la revisión del maestro.',
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <CheckCircle size={14} className="text-gray-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  )
}
