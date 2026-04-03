import { Shield, Lock, UserCheck, FileText, AlertTriangle, Mail } from 'lucide-react'
import PageHeader from '../components/PageHeader'

function Article({ number, title, children }) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Art. {number}</span>
        {title}
      </h2>
      <div className="text-sm text-gray-600 space-y-2 leading-relaxed">
        {children}
      </div>
    </div>
  )
}

export default function TermsAndConditions() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Términos y Condiciones"
        subtitle="Uso de datos biométricos y tratamiento de información"
      />

      <div className="bg-slate-800 text-white rounded-xl px-5 py-4 mb-6 flex gap-3">
        <Shield size={18} className="text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">Presentia — Plataforma de Asistencia Inteligente</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Última actualización: abril 2026 · Universidad Tecnológica Emiliano Zapata (UTEZ)
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Article number="1" title="Aceptación de los términos">
          <p>
            El uso de la plataforma Presentia por parte de docentes, coordinadores y personal
            administrativo implica la aceptación plena de los presentes Términos y Condiciones.
            Si no está de acuerdo con alguna de las disposiciones aquí establecidas, deberá
            abstenerse de utilizar el sistema.
          </p>
          <p>
            La institución educativa que implemente esta plataforma asume la responsabilidad de
            informar a los estudiantes y tutores sobre el uso de tecnología de reconocimiento facial
            dentro del entorno académico, de conformidad con la normativa aplicable.
          </p>
        </Article>

        <Article number="2" title="Finalidad del tratamiento de datos biométricos">
          <p>
            Las muestras faciales recopiladas de los estudiantes tienen como <span className="font-medium text-gray-800">única finalidad</span> el
            reconocimiento de identidad dentro de la plataforma para los procesos de:
          </p>
          <ul className="mt-2 space-y-1 ml-4">
            {[
              'Registro automático de asistencia a clases mediante análisis de video.',
              'Análisis individual de atención y fatiga durante sesiones académicas.',
              'Generación de reportes de seguimiento para uso exclusivo del docente.',
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-blue-500 shrink-0">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2">
            Queda estrictamente prohibido el uso de estos datos para cualquier finalidad distinta
            a las señaladas, incluyendo la comercialización, perfilamiento conductual o transferencia
            a terceros no autorizados.
          </p>
        </Article>

        <Article number="3" title="Recopilación y almacenamiento de datos">
          <p>
            La plataforma recopila y almacena los siguientes datos de los estudiantes:
          </p>
          <ul className="mt-2 space-y-1 ml-4">
            {[
              'Nombre completo y matrícula (datos de identificación institucional).',
              'Representaciones matemáticas del rostro (embeddings faciales), no fotografías directas.',
              'Resultados de análisis de atención asociados a fechas y sesiones específicas.',
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-blue-500 shrink-0">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2">
            Los videos subidos para análisis son procesados en el servidor y <span className="font-medium text-gray-800">eliminados permanentemente</span> de
            forma automática una vez concluido el procesamiento. En ningún momento se retienen
            grabaciones de clases en el sistema.
          </p>
        </Article>

        <Article number="4" title="Consentimiento informado">
          <p>
            La institución educativa es responsable de obtener el consentimiento informado de los
            estudiantes o, en caso de menores de edad, de sus padres o tutores legales, antes de
            registrar muestras faciales en la plataforma.
          </p>
          <p>
            Dicho consentimiento debe indicar claramente:
          </p>
          <ul className="mt-2 space-y-1 ml-4">
            {[
              'Qué datos se recopilan y con qué propósito.',
              'Quién tiene acceso a los resultados del análisis.',
              'El derecho a solicitar la eliminación de sus datos en cualquier momento.',
              'Que la participación en los análisis no afecta calificaciones ni evaluaciones formales.',
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-blue-500 shrink-0">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Article>

        <Article number="5" title="Acceso y confidencialidad">
          <p>
            El acceso a los datos de los estudiantes está restringido exclusivamente al docente
            titular del grupo y al personal administrativo autorizado. Cada usuario del sistema
            accede únicamente a la información correspondiente a sus grupos asignados.
          </p>
          <p>
            Los resultados de los análisis de atención y asistencia son de carácter <span className="font-medium text-gray-800">estrictamente
            confidencial</span> y no deben ser divulgados públicamente ni compartidos con personas
            ajenas a la institución sin autorización expresa del titular del dato.
          </p>
        </Article>

        <Article number="6" title="Limitaciones del sistema y responsabilidad">
          <p>
            Los resultados generados por Presentia son <span className="font-medium text-gray-800">herramientas de apoyo pedagógico</span> y
            no constituyen un diagnóstico clínico, psicológico o evaluación oficial del desempeño
            académico del estudiante. El sistema puede presentar imprecisiones derivadas de
            condiciones de iluminación, ángulo de cámara u otros factores técnicos.
          </p>
          <p>
            El docente es el único responsable de las decisiones académicas tomadas con base en
            la información proporcionada por la plataforma. La institución y los desarrolladores
            de Presentia no se responsabilizan por el uso indebido de los resultados generados.
          </p>
        </Article>

        <Article number="7" title="Derechos de los estudiantes">
          <p>
            De conformidad con la Ley Federal de Protección de Datos Personales en Posesión de
            los Particulares (LFPDPPP) y demás normativa aplicable, los estudiantes o sus
            representantes tienen derecho a:
          </p>
          <ul className="mt-2 space-y-1 ml-4">
            {[
              'Acceder a los datos que el sistema tiene registrados sobre ellos.',
              'Solicitar la rectificación de datos incorrectos o desactualizados.',
              'Solicitar la eliminación de sus muestras faciales y registros del sistema.',
              'Oponerse al tratamiento de sus datos biométricos en cualquier momento.',
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-blue-500 shrink-0">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2">
            Estas solicitudes deberán canalizarse a través del responsable institucional del sistema
            o directamente con el docente titular del grupo.
          </p>
        </Article>

        <Article number="8" title="Seguridad de la información">
          <p>
            La plataforma implementa medidas técnicas y organizativas para proteger los datos
            almacenados, incluyendo autenticación con tokens de acceso de corta duración,
            comunicación cifrada mediante HTTPS y acceso controlado por roles.
          </p>
          <p>
            No obstante, ningún sistema es infalible. En caso de detectar un incidente de
            seguridad que afecte datos personales, la institución deberá notificarlo a los
            afectados en el menor tiempo posible.
          </p>
        </Article>

        <Article number="9" title="Modificaciones a estos términos">
          <p>
            Los presentes Términos y Condiciones podrán ser actualizados para reflejar cambios
            normativos, técnicos o institucionales. Cualquier modificación relevante será
            comunicada a los usuarios del sistema con anticipación razonable. El uso continuado
            de la plataforma tras la publicación de cambios implica su aceptación.
          </p>
        </Article>

        {/* Contact footer */}
        <div className="bg-gray-50 border rounded-xl p-5 flex gap-3 items-start">
          <Mail size={17} className="text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700">¿Dudas o solicitudes?</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Para ejercer tus derechos ARCO o plantear cualquier consulta sobre el tratamiento
              de datos personales, comunícate con el responsable institucional del sistema o
              con la coordinación académica correspondiente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
