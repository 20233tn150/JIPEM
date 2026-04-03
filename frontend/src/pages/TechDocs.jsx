/**
 * TechDocs.jsx — Documentación técnica interna del proyecto Presentia/JIPEM
 * Ruta: /tech-docs  (no aparece en sidebar, solo para consulta del equipo)
 */

import { useState } from 'react'
import {
  ChevronDown, ChevronRight, Code2, Database, Cpu, Globe, Lock,
  Camera, Eye, Video, Layers, Package, GitBranch, Terminal,
} from 'lucide-react'

// ─── Primitivos de diseño ──────────────────────────────────────────────────

function Badge({ children, color = 'gray' }) {
  const colors = {
    blue:   'bg-blue-100 text-blue-800',
    green:  'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    amber:  'bg-amber-100 text-amber-800',
    red:    'bg-red-100 text-red-800',
    gray:   'bg-gray-100 text-gray-700',
    slate:  'bg-slate-100 text-slate-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium ${colors[color]}`}>
      {children}
    </span>
  )
}

function CodeBlock({ children, lang = '' }) {
  return (
    <div className="bg-slate-900 rounded-lg overflow-x-auto mt-2 mb-1">
      {lang && (
        <div className="px-4 pt-2.5 pb-0 text-xs text-slate-500 font-mono"># {lang}</div>
      )}
      <pre className="px-4 py-3 text-sm text-slate-200 font-mono leading-relaxed whitespace-pre">{children}</pre>
    </div>
  )
}

function KV({ k, v, mono = false }) {
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-mono text-gray-400 w-52 shrink-0">{k}</span>
      <span className={`text-sm text-gray-800 ${mono ? 'font-mono' : ''}`}>{v}</span>
    </div>
  )
}

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border mt-3">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {headers.map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-2.5 text-gray-700 ${j === 0 ? 'font-mono text-xs' : ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Collapsible({ title, icon: Icon, color, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
            <Icon size={16} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6 pt-1 border-t">{children}</div>}
    </div>
  )
}

function Step({ n, title, desc, code, codeLang }) {
  return (
    <div className="flex gap-4 mt-4">
      <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
        {n}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
        {code && <CodeBlock lang={codeLang}>{code}</CodeBlock>}
      </div>
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────

export default function TechDocs() {
  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Terminal size={20} className="text-slate-600" />
          <h1 className="text-2xl font-bold text-gray-900">Documentación Técnica</h1>
          <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Uso interno</span>
        </div>
        <p className="text-sm text-gray-500">
          Presentia · JIPEM · UTEZ 8vo semestre — Referencia técnica para defensa del proyecto
        </p>
      </div>

      <div className="space-y-4">

        {/* ── 1. Stack tecnológico ──────────────────────────────────────────── */}
        <Collapsible title="Stack tecnológico" icon={Layers} color="bg-slate-700" defaultOpen>
          <p className="text-sm text-gray-500 mb-4 mt-3">
            Arquitectura cliente–servidor. Backend REST en Django, frontend SPA en React, base de datos relacional MySQL.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Backend</p>
              <Table
                headers={['Librería', 'Versión', 'Rol']}
                rows={[
                  ['Django', '6.0.3', 'Framework principal'],
                  ['djangorestframework', '3.17.0', 'API REST'],
                  ['simplejwt', '5.5.1', 'Autenticación JWT'],
                  ['opencv-contrib-python', '4.13.0.92', 'Visión computacional'],
                  ['numpy', '2.4.3', 'Álgebra lineal / arrays'],
                  ['mysqlclient', '2.2.8', 'Driver MySQL'],
                  ['python-decouple', '3.8', 'Variables de entorno'],
                  ['django-cors-headers', '4.9.0', 'Política CORS'],
                  ['Pillow', '12.1.1', 'Procesamiento de imagen'],
                ]}
              />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Frontend</p>
              <Table
                headers={['Paquete', 'Versión', 'Rol']}
                rows={[
                  ['React', '19.0.0', 'UI framework'],
                  ['react-router-dom', '7.1.1', 'Enrutamiento SPA'],
                  ['axios', '1.7.9', 'Cliente HTTP'],
                  ['lucide-react', '0.577.0', 'Iconos SVG'],
                  ['Tailwind CSS', '4.0.0', 'Estilos utilitarios'],
                  ['Vite', '6.0.5', 'Bundler / dev server'],
                ]}
              />
            </div>
          </div>
        </Collapsible>

        {/* ── 2. Autenticación ─────────────────────────────────────────────── */}
        <Collapsible title="Autenticación — JWT con doble token" icon={Lock} color="bg-slate-800">
          <p className="text-sm text-gray-600 mt-3 mb-4">
            Se usa <strong>JSON Web Tokens (JWT)</strong> con una estrategia de dos tokens para balancear seguridad y experiencia de usuario.
          </p>
          <div className="space-y-1 mb-4">
            <KV k="access token lifetime" v="15 minutos — viaja en cada request como Bearer header" />
            <KV k="refresh token lifetime" v="1 día — almacenado en sessionStorage del navegador" />
            <KV k="algoritmo de firma" v="HS256 (HMAC-SHA256)" mono />
            <KV k="rotación de tokens" v="ROTATE_REFRESH_TOKENS = True — cada refresh emite un nuevo par" />
            <KV k="blacklist" v="BLACKLIST_AFTER_ROTATION = True — tokens usados quedan revocados" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Flujo en el frontend (axios.js)</p>
          <CodeBlock lang="JavaScript — interceptor de respuesta">
{`// Si la respuesta es 401, se intenta refrescar automáticamente
// Los requests que lleguen mientras se refresca se ponen en cola
api.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true
      // Si ya hay un refresh en curso → encolar, no disparar otro
      if (isRefreshing) return new Promise((res, rej) => failedQueue.push({res, rej}))
      isRefreshing = true
      const rt = sessionStorage.getItem('rt')
      const { data } = await api.post('/auth/token/refresh/', { refresh: rt })
      setTokens(data.access, data.refresh)
      // Reintentar todos los requests encolados
      failedQueue.forEach(p => p.res())
      return api(error.config)
    }
  }
)`}
          </CodeBlock>
          <p className="text-sm text-gray-500 mt-3">
            El access token vive solo en memoria RAM (variable JS) — nunca se escribe en localStorage — para proteger contra ataques XSS.
          </p>
        </Collapsible>

        {/* ── 3. Captura de rostros ────────────────────────────────────────── */}
        <Collapsible title="Captura y registro de rostros" icon={Camera} color="bg-blue-600">
          <p className="text-sm text-gray-600 mt-3 mb-4">
            Antes de analizar asistencia o fatiga, cada alumno necesita al menos <strong>5 muestras faciales</strong>.
            Se toman desde el navegador con la cámara web.
          </p>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Pipeline del frontend</p>
          <Step n="1" title="Captura desde cámara" desc="MediaDevices.getUserMedia() activa la cámara. Un canvas captura el fotograma actual como imagen JPEG codificada en base64." />
          <Step n="2" title="Envío al backend" desc="La imagen base64 se envía vía POST a /classrooms/students/:id/capture-face/ en el campo image_base64." />

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-5 mb-1">Pipeline del backend (classrooms/views.py)</p>
          <Step
            n="1"
            title="Decodificación de la imagen"
            desc="El string base64 se decodifica a bytes, se convierte en un array numpy, luego a imagen BGR (OpenCV) y finalmente a RGB."
            code={`img_bytes = base64.b64decode(b64_string)
np_arr = np.frombuffer(img_bytes, np.uint8)
img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)`}
            codeLang="Python"
          />
          <Step
            n="2"
            title="Detección del rostro con Haarcascade"
            desc="Se convierte a escala de grises y se aplica el clasificador Haarcascade frontalface para localizar caras."
            code={`gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
faces = _FACE_CASCADE.detectMultiScale(
    gray,
    scaleFactor=1.1,   # cada escala reduce la imagen 10%
    minNeighbors=5,    # detecciones vecinas requeridas para confirmar
    minSize=(60, 60)   # tamaño mínimo del rostro en px
)
# Se selecciona la cara más grande por área (w*h)`}
            codeLang="Python — detect_and_crop_face()"
          />
          <Step
            n="3"
            title="Recorte y normalización"
            desc="Se aplica un padding del 10% alrededor del rostro detectado y se redimensiona a 128×128 píxeles en escala de grises."
            code={`pad = int(0.1 * min(w, h))
x1, y1 = max(0, x-pad), max(0, y-pad)
x2, y2 = min(W, x+w+pad), min(H, y+h+pad)
face_crop = gray[y1:y2, x1:x2]
face_crop = cv2.resize(face_crop, (128, 128))`}
            codeLang="Python"
          />
          <Step
            n="4"
            title="Almacenamiento en base de datos"
            desc="La imagen recortada se serializa con numpy.save() en un buffer en memoria y se guarda como BinaryField en la tabla FaceEncoding."
            code={`buf = io.BytesIO()
np.save(buf, face_crop)        # serialización numpy nativa
FaceEncoding.objects.create(
    student=student,
    encoding_data=buf.getvalue()  # bytes guardados en DB
)`}
            codeLang="Python"
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mt-4 text-sm text-blue-800">
            <strong>¿Por qué numpy.save() y no pickle?</strong> numpy.save genera un formato binario
            estandarizado (.npy) que puede cargarse de forma segura con numpy.load(). pickle puede
            ejecutar código arbitrario al deserializar — es un vector de seguridad. numpy.load es
            determinístico y seguro para datos numéricos.
          </div>
        </Collapsible>

        {/* ── 4. Análisis de asistencia ────────────────────────────────────── */}
        <Collapsible title="Análisis de asistencia por video" icon={Video} color="bg-green-600">
          <p className="text-sm text-gray-600 mt-3 mb-4">
            El docente sube un video de clase. El sistema identifica a cada alumno del grupo y
            determina si estuvo presente según el porcentaje de fotogramas en que fue detectado.
          </p>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Constantes del algoritmo</p>
          <div className="space-y-1 mb-4">
            <KV k="FRAMES_TO_SKIP" v="5 — solo se procesa 1 de cada 5 fotogramas (optimización de velocidad)" mono />
            <KV k="FACE_SIZE" v="(128, 128) — tamaño estándar del recorte facial" mono />
            <KV k="LBPH_CONFIDENCE_THRESHOLD" v="100 — confianza máxima para aceptar un match (menor = más similar)" mono />
            <KV k="PRESENCE_THRESHOLD_PCT" v="0.10 — el alumno debe aparecer en ≥10% de los fotogramas procesados" mono />
          </div>

          <Step
            n="1"
            title="Entrenamiento del reconocedor LBPH"
            desc="Se cargan las muestras faciales de todos los alumnos del grupo desde la DB y se entrena un reconocedor LBPH (Local Binary Pattern Histogram)."
            code={`for idx, student in enumerate(students):
    for fe in student.face_encodings.all():
        img = np.load(io.BytesIO(bytes(fe.encoding_data)))
        face_images.append(img)
        labels.append(idx)          # índice numérico del alumno

recognizer = cv2.face.LBPHFaceRecognizer_create()
recognizer.train(face_images, np.array(labels, dtype=np.int32))`}
            codeLang="Python — _build_recognizer()"
          />
          <Step
            n="2"
            title="Procesamiento del video frame a frame"
            desc="Se lee el video con OpenCV. Por cada fotograma procesado: resize 50%, escala de grises, ecualización de histograma (mejora contraste)."
            code={`while True:
    ret, frame = cap.read()
    if not ret: break
    total_frames += 1
    if total_frames % FRAMES_TO_SKIP != 0: continue  # saltar 4 de cada 5
    small = cv2.resize(frame, (0,0), fx=0.5, fy=0.5)  # mitad de resolución
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)`}
            codeLang="Python — loop principal"
          />
          <Step
            n="3"
            title="Detección y reconocimiento"
            desc="Para cada cara detectada en el fotograma, el reconocedor LBPH devuelve un label (índice de alumno) y un confidence score."
            code={`label, confidence = recognizer.predict(face_crop_128x128)
# confidence < 100 → match válido
# confidence más bajo = más parecido al alumno entrenado
if confidence < LBPH_CONFIDENCE_THRESHOLD:
    sid = label_to_student_id[label]
    frame_count_map[sid] += 1  # contar apariciones`}
            codeLang="Python — _recognize_face()"
          />
          <Step
            n="4"
            title="Decisión de presencia"
            desc="Al finalizar el video, se calcula qué fracción de fotogramas procesados apareció cada alumno. Si supera el 10%, se marca como presente."
            code={`for sid, count in frame_count_map.items():
    presence_map[sid] = count / processed_frames  # ratio 0.0 – 1.0

is_present = presence_map.get(student.id, 0.0) >= 0.10`}
            codeLang="Python — _finalize_session()"
          />

          <div className="bg-gray-50 border rounded-lg px-4 py-3 mt-4 text-sm text-gray-600">
            <strong>¿Qué es LBPH?</strong> Local Binary Pattern Histogram. Describe la textura local
            de cada píxel comparando con sus 8 vecinos, genera un histograma por región y los concatena.
            Es rápido, no requiere GPU, funciona bien con variaciones de iluminación y es el método
            de reconocimiento facial clásico disponible en <code className="bg-gray-200 px-1 rounded text-xs">cv2.face</code>.
          </div>
        </Collapsible>

        {/* ── 5. Análisis de fatiga ────────────────────────────────────────── */}
        <Collapsible title="Análisis de fatiga y atención (PERCLOS)" icon={Eye} color="bg-purple-600">
          <p className="text-sm text-gray-600 mt-3 mb-4">
            Se sube un video individual de un alumno. El sistema mide qué porcentaje del tiempo
            sus ojos estuvieron cerrados usando el indicador <strong>PERCLOS</strong>, estándar
            en investigación de somnolencia al volante.
          </p>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Constantes del algoritmo</p>
          <div className="space-y-1 mb-4">
            <KV k="FRAMES_TO_SKIP" v="5 — procesa 1 de cada 5 fotogramas" mono />
            <KV k="EYE_CLOSED_CONSEC_SECS" v="0.5 segundos — tiempo mínimo de cierre para contar episodio" mono />
            <KV k="eye_closed_frames" v="max(1, int(0.5 × fps / 5)) — con 25fps resultan ~2-3 frames" mono />
            <KV k="PRESENCE_THRESHOLD_PCT" v="0.10 — cara debe aparecer ≥10% del video" mono />
            <KV k="LBPH_CONFIDENCE_THRESHOLD" v="100 — umbral para identificar al alumno correcto" mono />
          </div>

          <Step
            n="1"
            title="Identificar al alumno en el video"
            desc="Igual que en asistencia, se entrena un reconocedor LBPH pero solo con las muestras del alumno analizado. Se selecciona la cara que más se parece (confidence más bajo)."
            code={`# Solo las muestras del alumno específico
recognizer.train(face_images, np.zeros(len(face_images), dtype=np.int32))
# label=0 para todos → cualquier detección válida es el alumno`}
            codeLang="Python — _build_student_recognizer()"
          />
          <Step
            n="2"
            title="Análisis de ojos por fotograma"
            desc="Detectada la cara, se toma el 60% superior (zona de ojos), se escala al doble (mejora detección de ojos pequeños) y se aplica haarcascade_eye."
            code={`top = face_crop[:int(face_crop.shape[0] * 0.6), :]  # 60% superior
top_resized = cv2.resize(top, (0,0), fx=2.0, fy=2.0)   # x2 resolución

eyes = _EYE_CASCADE.detectMultiScale(
    top_resized,
    scaleFactor=1.1,
    minNeighbors=3,
    minSize=(15, 15)
)`}
            codeLang="Python — _analyze_eyes()"
          />
          <Step
            n="3"
            title="Conteo de episodios de cierre"
            desc="Si no se detectan ojos en frames consecutivos equivalentes a 0.5s, se cuenta como un episodio. Se diferencia así el parpadeo normal del cierre sostenido."
            code={`if len(eyes) == 0:
    state['no_eye_counter'] += 1
    if state['no_eye_counter'] >= eye_closed_frames:
        state['eyes_closed_secs'] += FRAMES_TO_SKIP / fps
        if state['no_eye_counter'] == eye_closed_frames:  # primer frame que cruza el umbral
            state['closure_episodes'] += 1                # contar episodio solo una vez
else:
    state['eye_detected_frames'] += 1
    state['no_eye_counter'] = 0  # reiniciar al detectar ojos`}
            codeLang="Python"
          />
          <Step
            n="4"
            title="Cálculo de PERCLOS y puntuaciones"
            desc="PERCLOS = fracción de frames con cara visible donde NO se detectaron ojos. Se convierte en fatigue score y attention score."
            code={`perclos = 1.0 - (eye_detected_frames / face_frames)
# PERCLOS 0.0 = ojos siempre abiertos | 1.0 = ojos siempre cerrados

fatigue = min(100.0, perclos * 200.0 + closure_episodes * 5.0)
# × 200 → PERCLOS 0.50 ya da fatigue=100 (muy agresivo con somnolencia)
# + episodios × 5 → penaliza patrones repetidos de cierre

attention = max(0.0, 100.0 - fatigue)`}
            codeLang="Python — _compute_scores()"
          />
          <Step
            n="5"
            title="Clasificación final"
            desc="La attention score determina el label que se almacena junto a los scores en la base de datos."
            code={`if attention >= 70:   return 'atento'     # PERCLOS < ~0.15
elif attention >= 40: return 'distraido'  # PERCLOS 0.15 – 0.30
else:                 return 'fatigado'   # PERCLOS > 0.30`}
            codeLang="Python — _classify()"
          />

          <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 mt-4 text-sm text-purple-900">
            <strong>¿Por qué PERCLOS y no detección de bostezos?</strong> El método anterior usaba
            <code className="bg-purple-100 px-1 rounded text-xs mx-1">haarcascade_smile</code>
            para detectar bostezos, pero contaba cualquier apertura de boca (hablar, toser, sonreír).
            PERCLOS está validado científicamente como el indicador más robusto de somnolencia porque
            el cierre de ojos es involuntario y directamente correlacionado con el estado de alerta.
          </div>
        </Collapsible>

        {/* ── 6. Modelos de base de datos ──────────────────────────────────── */}
        <Collapsible title="Modelos de base de datos" icon={Database} color="bg-amber-600">
          <p className="text-sm text-gray-600 mt-3 mb-4">MySQL como motor. ORM de Django gestiona todas las migraciones.</p>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">classrooms_classroom</p>
          <Table
            headers={['Campo', 'Tipo', 'Notas']}
            rows={[
              ['name', 'VARCHAR(100)', ''],
              ['subject', 'VARCHAR(100)', ''],
              ['maestro_id', 'FK → users_user', 'on_delete=PROTECT'],
              ['is_active', 'BOOL', 'default=True — soft delete'],
              ['created_at', 'DATETIME', 'auto_now_add'],
            ]}
          />

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-4 mb-2">classrooms_student</p>
          <Table
            headers={['Campo', 'Tipo', 'Notas']}
            rows={[
              ['name', 'VARCHAR(255)', ''],
              ['matricula', 'VARCHAR(20)', 'unique, index'],
              ['age', 'SMALLINT UNSIGNED', ''],
              ['sex', "CHAR(1)", "'M' | 'F'"],
              ['wears_glasses', 'BOOL', 'default=False'],
              ['classroom_id', 'FK → classroom', 'on_delete=CASCADE'],
              ['is_active', 'BOOL', 'soft delete'],
            ]}
          />

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-4 mb-2">classrooms_faceencoding</p>
          <Table
            headers={['Campo', 'Tipo', 'Notas']}
            rows={[
              ['student_id', 'FK → student', 'on_delete=CASCADE'],
              ['encoding_data', 'LONGBLOB', 'numpy array 128×128 float64 serializado con np.save()'],
              ['created_at', 'DATETIME', ''],
            ]}
          />

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-4 mb-2">attendance_session / attendance_record</p>
          <Table
            headers={['Campo', 'Tipo', 'Notas']}
            rows={[
              ['classroom_id / maestro_id', 'FK', ''],
              ['date', 'DATE', ''],
              ['status', 'VARCHAR', "'pending' | 'processing' | 'completed' | 'error'"],
              ['error_message', 'TEXT', 'vacío si no hay error'],
              ['— record: student_id', 'FK → student', 'unique_together (session, student)'],
              ['— record: is_present', 'BOOL', ''],
              ['— record: minutes_present', 'SMALLINT', 'almacena ratio × 100 (0–100)'],
            ]}
          />

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-4 mb-2">fatigue_individual_analysis</p>
          <Table
            headers={['Campo', 'Tipo', 'Notas']}
            rows={[
              ['student_id / maestro_id', 'FK', ''],
              ['date', 'DATE', ''],
              ['status', 'VARCHAR', "'pending' | 'processing' | 'completed' | 'error'"],
              ['attention_score', 'FLOAT', '0.0 – 100.0'],
              ['fatigue_score', 'FLOAT', '0.0 – 100.0'],
              ['yawn_count', 'SMALLINT', 'reutilizado: almacena closure_episodes'],
              ['eyes_closed_secs', 'FLOAT', 'segundos acumulados con ojos cerrados'],
              ['result_label', 'VARCHAR', "'atento' | 'distraido' | 'fatigado' | ''"],
            ]}
          />
        </Collapsible>

        {/* ── 7. Estructura del proyecto ───────────────────────────────────── */}
        <Collapsible title="Estructura del proyecto" icon={GitBranch} color="bg-gray-600">
          <CodeBlock lang="Árbol de directorios (simplificado)">
{`JIPEM/
├── backend/
│   ├── config/
│   │   ├── settings.py        ← Configuración Django (JWT, CORS, DB, media)
│   │   └── urls.py            ← Router raíz: /api/...
│   ├── apps/
│   │   ├── users/             ← Modelo User, login, register, perfil
│   │   ├── classrooms/        ← Grupos, alumnos, captura de rostros
│   │   │   ├── models.py      ← Classroom, Student, FaceEncoding
│   │   │   ├── views.py       ← CRUD + CaptureFaceView
│   │   │   └── serializers.py
│   │   ├── attendance/        ← Sesiones de asistencia
│   │   │   ├── models.py      ← AttendanceSession, AttendanceRecord
│   │   │   ├── views.py       ← Upload video, status, delete, toggle
│   │   │   └── tasks.py       ← Algoritmo LBPH en hilo daemon
│   │   ├── fatigue/           ← Análisis individual de fatiga
│   │   │   ├── models.py      ← IndividualFatigueAnalysis
│   │   │   ├── views.py       ← Upload video, status
│   │   │   └── tasks.py       ← Algoritmo PERCLOS en hilo daemon
│   │   ├── reports/           ← Generación de reportes HTML
│   │   └── logs/              ← Registro de actividad
│   └── tmp_media/tmp/         ← Videos temporales (se eliminan tras análisis)
└── frontend/
    └── src/
        ├── api/axios.js       ← Cliente HTTP con interceptores JWT
        ├── context/AuthContext.jsx
        ├── components/
        │   ├── Layout.jsx     ← Sidebar + Outlet
        │   ├── PageHeader.jsx
        │   └── StatusBadge.jsx
        └── pages/
            ├── classrooms/    ← Lista, detalle, formulario alumno, FaceCapture
            ├── attendance/    ← Lista sesiones, nueva sesión, detalle
            └── fatigue/       ← Lista análisis, nuevo análisis, detalle`}
          </CodeBlock>
        </Collapsible>

        {/* ── 8. Flujo de datos end-to-end ─────────────────────────────────── */}
        <Collapsible title="Flujos de datos end-to-end" icon={Cpu} color="bg-blue-700">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-3 mb-2">Captura de rostro</p>
          <CodeBlock>
{`Cámara web (MediaDevices API)
  → canvas.toDataURL('image/jpeg')
  → POST /api/classrooms/students/:id/capture-face/  { image_base64 }
  → base64 → numpy array → BGR → RGB
  → Haarcascade detect (scaleFactor=1.1, minNeighbors=5, minSize=60px)
  → Recorte + padding 10% + resize 128×128
  → np.save(buf) → FaceEncoding.encoding_data (BinaryField)
  → Respuesta: { count, has_enough_samples: count >= 5 }`}
          </CodeBlock>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-4 mb-2">Asistencia por video</p>
          <CodeBlock>
{`POST /api/attendance/sessions/:id/upload-video/  (multipart/form-data)
  → Validar extensión (.mp4 .avi .mov .mkv) y tamaño (≤ 500 MB)
  → Guardar en MEDIA_ROOT/tmp/session_{id}_{uuid}.ext
  → threading.Thread(target=process_attendance_video, daemon=True).start()
  → 202 Accepted (polling frontend cada 3s a /sessions/:id/status/)

  [Hilo daemon]
  → Cargar FaceEncodings de todos los alumnos del grupo
  → Entrenar LBPHFaceRecognizer con labels por alumno
  → cap = cv2.VideoCapture(video_path)
  → Por cada 5° frame: resize 50% → grayscale → Haarcascade faces
  → Por cada cara: LBPH.predict() → si confidence < 100 → frame_count_map[sid]++
  → presence = frame_count_map[sid] / processed_frames
  → AttendanceRecord.is_present = presence >= 0.10
  → os.remove(video_path)`}
          </CodeBlock>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-4 mb-2">Fatiga individual</p>
          <CodeBlock>
{`POST /api/fatigue/individual/  (multipart/form-data)
  → Validar video → guardar tmp → crear IndividualFatigueAnalysis (status=pending)
  → threading.Thread(target=process_individual_fatigue, daemon=True).start()
  → 202 Accepted

  [Hilo daemon]
  → Cargar FaceEncodings del alumno → LBPHFaceRecognizer con label=0
  → fps = cap.get(CAP_PROP_FPS) || 25.0
  → eye_closed_frames = max(1, int(0.5 * fps / 5))
  → Por cada 5° frame:
      → Haarcascade face → LBPH identify → mejor cara (confidence mínimo)
      → face_crop = 60% superior → resize x2
      → Haarcascade eyes (minSize=15px)
      → sin ojos: no_eye_counter++ ; si cruza umbral → closure_episodes++
      → con ojos: eye_detected_frames++ ; no_eye_counter = 0
  → PERCLOS = 1 - eye_detected_frames / face_frames
  → fatigue = min(100, PERCLOS×200 + closure_episodes×5)
  → attention = 100 - fatigue
  → label: ≥70→atento | ≥40→distraido | <40→fatigado
  → Guardar scores → os.remove(video_path)`}
          </CodeBlock>
        </Collapsible>

        {/* ── 9. API endpoints ─────────────────────────────────────────────── */}
        <Collapsible title="Endpoints de la API" icon={Globe} color="bg-teal-600">
          <p className="text-sm text-gray-500 mt-3 mb-3">Todos requieren <Badge color="blue">Authorization: Bearer &lt;token&gt;</Badge> salvo los de autenticación.</p>
          <Table
            headers={['Método', 'Ruta', 'Descripción']}
            rows={[
              ['POST', '/api/auth/login/', 'Obtener par access/refresh token'],
              ['POST', '/api/auth/token/refresh/', 'Renovar access token'],
              ['POST', '/api/auth/register/', 'Registro (solo admin)'],
              ['GET/POST', '/api/classrooms/', 'Listar / crear grupos'],
              ['GET/PUT/DELETE', '/api/classrooms/:id/', 'Detalle / editar / soft-delete grupo'],
              ['GET/POST', '/api/classrooms/:id/students/', 'Alumnos del grupo'],
              ['POST', '/api/classrooms/students/:id/capture-face/', 'Guardar muestra facial'],
              ['GET', '/api/classrooms/students/:id/face-status/', 'Cantidad de muestras'],
              ['GET/POST', '/api/attendance/sessions/', 'Sesiones de asistencia'],
              ['GET', '/api/attendance/sessions/:id/', 'Detalle sesión + registros'],
              ['POST', '/api/attendance/sessions/:id/upload-video/', 'Subir video para procesar'],
              ['GET', '/api/attendance/sessions/:id/status/', 'Polling de estado'],
              ['DELETE', '/api/attendance/sessions/:id/delete/', 'Eliminar sesión (pending/error)'],
              ['PATCH', '/api/attendance/records/:id/toggle/', 'Corrección manual de asistencia'],
              ['POST', '/api/fatigue/individual/', 'Crear análisis individual + subir video'],
              ['GET', '/api/fatigue/individual/:id/', 'Resultado del análisis'],
              ['GET', '/api/fatigue/individual/:id/status/', 'Polling de estado'],
              ['GET', '/api/reports/attendance/', 'Reporte HTML de sesión'],
              ['GET', '/api/reports/fatigue/individual/', 'Reporte HTML de análisis'],
            ]}
          />
        </Collapsible>

        {/* ── 10. Preguntas frecuentes técnicas ───────────────────────────── */}
        <Collapsible title="Preguntas técnicas frecuentes" icon={Code2} color="bg-rose-600">
          {[
            {
              q: '¿Por qué se procesan solo 1 de cada 5 fotogramas?',
              a: 'Un video a 25fps tiene 25 fotogramas por segundo — procesar todos es innecesario (los rostros no cambian tan rápido) y muy costoso en CPU. Con FRAMES_TO_SKIP=5 procesamos ~5fps efectivos, suficiente para detectar presencia y ojos, a una fracción del tiempo de cómputo.',
            },
            {
              q: '¿Por qué se reduce la imagen al 50% antes de procesar?',
              a: 'El resize 0.5x reduce los píxeles a la cuarta parte (½ ancho × ½ alto). Haarcascade es O(n²) en tamaño de imagen. A resoluciones típicas de video (1280×720) procesar cada frame en tamaño original sería muy lento. A 640×360 la detección sigue siendo precisa para distancias de clase.',
            },
            {
              q: '¿Qué pasa si el alumno no tiene muestras faciales registradas?',
              a: 'En asistencia: no se le crea AttendanceRecord y queda ausente. En fatiga: se usa la cara dominante (más grande) del video sin verificación de identidad, y se notifica en logs.',
            },
            {
              q: '¿Por qué se usa threading en lugar de Celery/queue?',
              a: 'El proyecto es académico, no de producción. threading.Thread(daemon=True) es suficiente para procesar videos en segundo plano sin infraestructura adicional (Redis, worker). La desventaja es que si el proceso Django muere, el hilo muere con él — aceptable para este contexto.',
            },
            {
              q: '¿Cómo funciona el campo yawn_count para closure_episodes?',
              a: 'El modelo IndividualFatigueAnalysis tiene un campo yawn_count heredado del diseño original (contaba bostezos). Al migrar a PERCLOS se reutilizó ese campo para almacenar los episodios de cierre prolongado en lugar de crear una migración nueva. En la UI se muestra como "Episodios de cierre prolongado".',
            },
            {
              q: '¿Por qué PERCLOS × 200 en la fórmula de fatiga?',
              a: 'PERCLOS varía entre 0 y 1. Un PERCLOS de 0.50 (ojos cerrados la mitad del tiempo) ya es severamente anormal. Multiplicar por 200 hace que ese caso resulte en fatigue=100. Si multiplicáramos por 100, necesitaríamos PERCLOS=1.0 (ojos cerrados todo el tiempo) para llegar a 100, que es un umbral demasiado laxo.',
            },
            {
              q: '¿Qué significa confidence en LBPH?',
              a: 'En LBPH el confidence NO es una probabilidad (0-100%). Es una distancia de histograma — cuanto menor, más similar. Un confidence de 0 sería imagen idéntica. El umbral de 100 es empírico: valores menores indican que la cara es suficientemente similar al entrenamiento como para ser el mismo alumno.',
            },
          ].map(({ q, a }, i) => (
            <div key={i} className="mt-4 border-b pb-4 last:border-0">
              <p className="text-sm font-semibold text-gray-800">❓ {q}</p>
              <p className="text-sm text-gray-600 mt-1.5">{a}</p>
            </div>
          ))}
        </Collapsible>

      </div>

      <p className="text-xs text-center text-gray-300 mt-8 pb-4">
        Presentia · JIPEM · UTEZ · Ingeniería en Tecnologías de la Información — 8vo semestre 2026
      </p>
    </div>
  )
}
