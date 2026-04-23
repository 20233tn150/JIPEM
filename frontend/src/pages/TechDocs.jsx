/**
 * TechDocs.jsx — Documentación técnica interna del proyecto Presentia/JIPEM
 * Ruta: /tech-docs  (no aparece en sidebar, solo para consulta del equipo)
 */

import { useState } from 'react'
import {
  ChevronDown, ChevronRight, Code2, Database, Cpu, Globe, Lock,
  Camera, Eye, Video, Layers, GitBranch, Terminal,
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

function Kv({ k, v, mono = false }) {
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
          {rows.map((row) => (
            <tr key={row[0]} className="hover:bg-gray-50">
              {row.map((cell) => (
                <td key={cell} className={`px-4 py-2.5 text-gray-700 ${row.indexOf(cell) === 0 ? 'font-mono text-xs' : ''}`}>
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
                  ['Django', '5.2.13', 'Framework principal'],
                  ['djangorestframework', '3.17.1', 'API REST'],
                  ['simplejwt', '5.5.1', 'Autenticación JWT'],
                  ['insightface', '0.7.3', 'Detección y reconocimiento facial (ArcFace)'],
                  ['onnxruntime', '1.23.2', 'Inferencia del modelo InsightFace en CPU'],
                  ['opencv-contrib-python', '4.13.0.92', 'Análisis de ojos (PERCLOS) y decodificación de video'], // NOSONAR
                  ['numpy', '2.2.6', 'Álgebra lineal / arrays'],
                  ['PyMySQL', '1.1.2', 'Driver MySQL'],
                  ['python-decouple', '3.8', 'Variables de entorno'],
                  ['django-cors-headers', '4.9.0', 'Política CORS'],
                  ['loguru', '0.7.3', 'Logging estructurado con niveles y contexto'],
                  ['Pillow', '12.2.0', 'Procesamiento de imagen'],
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
            <Kv k="access token lifetime" v="15 minutos — viaja en cada request como Bearer header" />
            <Kv k="refresh token lifetime" v="1 día — almacenado en sessionStorage del navegador" />
            <Kv k="algoritmo de firma" v="HS256 (HMAC-SHA256)" mono />
            <Kv k="rotación de tokens" v="ROTATE_REFRESH_TOKENS = True — cada refresh emite un nuevo par" />
            <Kv k="blacklist" v="BLACKLIST_AFTER_ROTATION = True — tokens usados quedan revocados" />
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
            desc="El string base64 se decodifica a bytes y se convierte en un array numpy BGR mediante OpenCV."
            code={`img_bytes = base64.b64decode(b64_string)
np_arr = np.frombuffer(img_bytes, np.uint8)
img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)`}
            codeLang="Python"
          />
          <Step
            n="2"
            title="Detección y embedding con InsightFace"
            desc="Se inicializa el modelo buffalo_l (singleton thread-safe). InsightFace detecta caras y extrae el embedding ArcFace de 512 dimensiones en un solo paso."
            code={`face_app = _get_face_app()           # singleton thread-safe
faces = face_app.get(img_bgr)        # detección + landmarks + embedding
if not faces:
    return Response({'error': 'No se detectó ningún rostro'}, status=400)
# Seleccionar la cara con mayor score de detección
face = max(faces, key=lambda f: f.det_score)`}
            codeLang="Python — CaptureFaceView"
          />
          <Step
            n="3"
            title="Normalización del vector ArcFace"
            desc="El embedding de 512 dimensiones se normaliza a norma unitaria (L2) para que la similitud de coseno sea válida en el reconocimiento posterior."
            code={`embedding = face.embedding.astype(np.float32)   # shape: (512,)
norm = np.linalg.norm(embedding)
if norm > 1e-10:
    embedding = embedding / norm                 # vector unitario`}
            codeLang="Python"
          />
          <Step
            n="4"
            title="Almacenamiento en base de datos"
            desc="El vector normalizado se serializa con numpy.save() y se guarda como BinaryField en la tabla FaceEncoding."
            code={`buf = io.BytesIO()
np.save(buf, embedding)           # serialización numpy nativa (.npy)
FaceEncoding.objects.create(
    student=student,
    encoding_data=buf.getvalue()  # 512 float32 × 4 bytes = ~2 KB por muestra
)`}
            codeLang="Python"
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mt-4 text-sm text-blue-800">
            <strong>¿Qué es ArcFace?</strong> ArcFace (Additive Angular Margin) es una red neuronal profunda
            entrenada con millones de rostros. Produce un vector de 512 números (embedding) que representa
            la identidad facial de forma robusta ante cambios de iluminación, ángulo y oclusión parcial.
            Dos fotos de la misma persona tendrán embeddings con similitud de coseno alta (&gt;0.35);
            personas distintas tendrán similitud baja (&lt;0.25).
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
            <Kv k="FRAMES_TO_SKIP" v="10 — solo se procesa 1 de cada 10 fotogramas (optimización de velocidad)" mono />
            <Kv k="COSINE_THRESHOLD" v="0.35 — similitud de coseno mínima para aceptar un match ArcFace" mono />
            <Kv k="PRESENCE_THRESHOLD_PCT" v="0.10 — el alumno debe aparecer en ≥10% de los fotogramas procesados" mono />
          </div>

          <Step
            n="1"
            title="Construcción del banco de embeddings ArcFace"
            desc="Se cargan los vectores 512-d de cada alumno desde la DB, se normalizan y se calcula el centroide (media normalizada) como vector de referencia."
            code={`for student in students:
    vecs = []
    for fe in student.face_encodings.all():
        arr = np.load(io.BytesIO(bytes(fe.encoding_data)))
        arr = arr.flatten().astype(np.float32)
        norm = np.linalg.norm(arr)
        if norm > 1e-10:
            vecs.append(arr / norm)          # normalizar cada muestra
    if vecs:
        mean_vec = np.mean(vecs, axis=0)
        n = np.linalg.norm(mean_vec)
        student_embeddings[student.id] = mean_vec / n  # centroide unitario`}
            codeLang="Python — _build_recognizer()"
          />
          <Step
            n="2"
            title="Procesamiento del video frame a frame"
            desc="Se lee el video con OpenCV. Por cada 10° fotograma, InsightFace detecta todas las caras y extrae sus embeddings ArcFace en un solo pase."
            code={`while True:
    ret, frame = cap.read()
    if not ret: break
    total_frames += 1
    if total_frames % FRAMES_TO_SKIP != 0: continue
    faces = face_app.get(frame)   # detección + embeddings ArcFace`}
            codeLang="Python — loop principal"
          />
          <Step
            n="3"
            title="Identificación por similitud de coseno"
            desc="Para cada cara detectada se calcula la similitud de coseno con cada alumno. Si el mejor match supera 0.35, se cuenta la aparición."
            code={`for face in faces:
    query = face.embedding.astype(np.float32)
    query = query / np.linalg.norm(query)      # normalizar
    best_id, best_score = None, -1.0
    for sid, ref in student_embeddings.items():
        score = float(np.dot(query, ref))      # similitud coseno [-1, 1]
        if score > best_score:
            best_score, best_id = score, sid
    if best_score >= COSINE_THRESHOLD:
        frame_count_map[best_id] += 1`}
            codeLang="Python — _recognize_faces_in_frame()"
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
            <strong>¿Por qué similitud de coseno y no distancia euclidiana?</strong> El embedding ArcFace
            está entrenado específicamente con pérdida de margen angular — la métrica natural es el ángulo
            entre vectores, que equivale a la similitud de coseno. Con vectores normalizados, cosine ∈ [-1, 1]:
            la misma persona suele dar &gt;0.35, personas distintas &lt;0.25. La distancia euclidiana
            funcionaría también, pero coseno es más estable ante variaciones de norma.
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
            <Kv k="FRAMES_TO_SKIP" v="5 — procesa 1 de cada 5 fotogramas" mono />
            <Kv k="EYE_CLOSED_CONSEC_SECS" v="0.5 segundos — tiempo mínimo de cierre para contar episodio" mono />
            <Kv k="eye_closed_frames" v="max(1, int(0.5 × fps / 5)) — con 25fps resultan ~2-3 frames" mono />
            <Kv k="PRESENCE_THRESHOLD_PCT" v="0.10 — cara debe aparecer ≥10% del video" mono />
            <Kv k="COSINE_THRESHOLD" v="0.35 — similitud de coseno mínima para identificar al alumno" mono />
          </div>

          <Step
            n="1"
            title="Construir embedding de referencia del alumno"
            desc="Se cargan todas las muestras ArcFace del alumno desde la DB y se calcula su centroide normalizado como vector de referencia."
            code={`# Solo muestras del alumno específico
vecs = [np.load(...) for fe in student.face_encodings.all()]
vecs = [v / np.linalg.norm(v) for v in vecs]   # normalizar
mean_vec = np.mean(vecs, axis=0)
student_ref = mean_vec / np.linalg.norm(mean_vec)  # centroide unitario`}
            codeLang="Python — _build_student_embedding()"
          />
          <Step
            n="2"
            title="Identificar la cara del alumno en el frame"
            desc="InsightFace detecta todas las caras. Se selecciona la que tenga mayor similitud de coseno con el embedding de referencia del alumno (debe superar 0.35)."
            code={`faces = face_app.get(frame)
best_face = _find_student_face(faces, student_ref)
# _find_student_face: cosine(query, student_ref) >= 0.35 → match`}
            codeLang="Python — loop principal"
          />
          <Step
            n="3"
            title="Análisis de ojos por fotograma (PERCLOS)"
            desc="Identificada la cara, se recorta la región BGR del rostro. Se toma el 60% superior (zona de ojos), se escala al doble y se aplica haarcascade_eye."
            code={`# Recortar cara usando bounding box de InsightFace
x1,y1,x2,y2 = face.bbox.astype(int)
face_bgr = frame[y1:y2, x1:x2]
# Analizar ojos en el 60% superior
top = face_bgr[:int(face_bgr.shape[0] * 0.6), :]
top_x2 = cv2.resize(top, (0,0), fx=2.0, fy=2.0)
eyes = _EYE_CASCADE.detectMultiScale(top_x2, scaleFactor=1.1,
                                      minNeighbors=3, minSize=(15,15))`}
            codeLang="Python — _analyze_eyes()"
          />
          <Step
            n="4"
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
            n="5"
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
            n="6"
            title="Clasificación final"
            desc="La attention score determina el label que se almacena junto a los scores en la base de datos."
            code={`if attention >= 70:   return 'atento'     # PERCLOS < ~0.15
elif attention >= 40: return 'distraido'  # PERCLOS 0.15 – 0.30
else:                 return 'fatigado'   # PERCLOS > 0.30`}
            codeLang="Python — _classify()"
          />

          <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 mt-4 text-sm text-purple-900">
            <strong>¿Por qué PERCLOS y no detección de bostezos?</strong> El método anterior usaba{' '}
            <code className="bg-purple-100 px-1 rounded text-xs mx-1">haarcascade_smile</code>
            {' '}para detectar bostezos, pero contaba cualquier apertura de boca (hablar, toser, sonreír).
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
              ['matricula', 'VARCHAR(20)', 'unique_together(matricula, classroom), index'],
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
              ['encoding_data', 'LONGBLOB', 'vector ArcFace 512-d float32 L2-normalizado, serializado con np.save()'],
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
  → base64 → numpy array → img_bgr (cv2.imdecode)
  → InsightFace buffalo_l → detectar cara + extraer embedding ArcFace 512-d
  → embedding / ||embedding|| → vector L2-normalizado
  → np.save(buf, embedding) → FaceEncoding.encoding_data (BinaryField)
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
  → Cargar embeddings ArcFace 512-d de todos los alumnos del grupo
  → Calcular centroide L2-normalizado por alumno → student_embeddings{id: vec}
  → cap = cv2.VideoCapture(video_path)
  → Por cada 10° frame:
      → InsightFace.get(frame) → lista de faces con embedding
      → Por cada cara: cosine(face.embedding, student_ref) → si ≥ 0.35 → match
      → frame_count_map[best_match_id]++
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
  → Cargar embeddings ArcFace del alumno → centroide L2-normalizado (student_ref)
  → fps = cap.get(CAP_PROP_FPS) || 25.0
  → eye_closed_frames = max(1, int(0.5 * fps / 5))
  → Por cada 5° frame:
      → InsightFace.get(frame) → face con cosine(embedding, student_ref) ≥ 0.35
      → face_bgr = frame[bbox] → 60% superior → resize x2
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
              q: '¿Por qué se procesan solo 1 de cada N fotogramas?',
              a: 'En asistencia se usa FRAMES_TO_SKIP=10 (procesa ~3fps en un video de 30fps) y en fatiga FRAMES_TO_SKIP=5 (~5fps). Procesar todos los frames sería innecesario —los rostros no cambian tan rápido— y muy costoso: InsightFace con ArcFace es más pesado que Haarcascade, por lo que el skip es esencial para terminar en tiempo razonable.',
            },
            {
              q: '¿Qué es InsightFace buffalo_l y por qué se eligió sobre LBPH?',
              a: 'buffalo_l es un modelo preentrenado de InsightFace que combina un detector RetinaFace con ArcFace para reconocimiento. LBPH funcionaba comparando texturas locales (histogramas) y era sensible a variaciones de iluminación y ángulo. ArcFace produce embeddings de 512 dimensiones entrenados con pérdida de margen angular, que son mucho más robustos. La precisión de reconocimiento mejora significativamente con apenas 5 muestras por alumno.',
            },
            {
              q: '¿Qué significa el umbral COSINE_THRESHOLD = 0.35?',
              a: 'La similitud de coseno entre dos vectores va de -1 (opuesto) a +1 (idéntico). En embeddings ArcFace de la misma persona suele estar entre 0.35 y 0.85; entre personas distintas, por debajo de 0.25. El umbral de 0.35 es empírico y conservador: evita falsos positivos a costa de posibles falsos negativos en condiciones difíciles (iluminación muy baja, perfil extremo).',
            },
            {
              q: '¿Qué pasa si el alumno no tiene muestras faciales registradas?',
              a: 'En asistencia: se omite al alumno del banco de embeddings y nunca obtendrá un match — queda marcado como ausente. En fatiga: si no hay encodings, el proceso falla con error y lo notifica en logs con loguru.',
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
              q: '¿Por qué la fatiga usa Haarcascade para los ojos si ya tiene InsightFace?',
              a: 'InsightFace detecta y reconoce personas, pero no estima el estado de apertura de ojos. Para PERCLOS necesitamos saber fotograma a fotograma si los ojos están abiertos o cerrados. Haarcascade eye sobre la región del rostro ya localizada es rápido y suficientemente preciso para esta tarea puntual, sin necesidad de un modelo adicional.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="mt-4 border-b pb-4 last:border-0">
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
