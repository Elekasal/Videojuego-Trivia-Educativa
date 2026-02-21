/* ==========================================================
   services/supabase.js
   ADAPTADOR V5.1: GESTIÓN DE PACIENTES ÚNICOS (DNI) Y TRADUCCIÓN DB
   ========================================================== */
(() => {
  // CONFIGURACIÓN (TUS CREDENCIALES)
  const SUPABASE_URL = 'https://gddpceumixxwrbejgotd.supabase.co'; 
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZHBjZXVtaXh4d3JiZWpnb3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MzI1MzEsImV4cCI6MjA3NzAwODUzMX0._dy0jD4uVE0fMCkfeQfrGoPSPPIh3PbnoDoQPAoGbQA';
  
  let SB = null;
  if (typeof window !== 'undefined' && window.supabase) {
    SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      db: { schema: 'app' }
    });
  }

  const _ok = (data = null) => ({ ok: true, data });
  const _fail = (error = {}) => ({ ok: false, error });

  async function getSession() {
    if (!SB) return null;
    const { data } = await SB.auth.getSession();
    return data?.session ?? null;
  }

  // --- AUTENTICACIÓN (DOCENTE) ---
  async function login(email, password) {
    if (!SB) return _fail({ message: 'No DB' });
    const { data, error } = await SB.auth.signInWithPassword({ email, password });
    return error ? _fail(error) : _ok(data.user);
  }

  async function reauthenticate(email, password) {
    // Reutilizamos login para confirmar contraseña
    return await login(email, password);
  }

  async function register(email, password) {
    if (!SB) return _fail({ message: 'No DB' });
    const { data, error } = await SB.auth.signUp({ email, password });
    return error ? _fail(error) : _ok(data.user);
  }

  async function logout() {
    if (!SB) return;
    await SB.auth.signOut();
  }

  // --- MATERIAS (Tabla: 'materias') ---
  async function getSubjects() {
    // TRADUCCIÓN: id_materia -> id, nombre -> name
    const { data, error } = await SB.from('materias')
      .select('id:id_materia, name:nombre, is_public:es_publica')
      .order('fecha_creacion');
    
    return error ? _fail(error) : _ok(data);
  }

  async function createSubject(name) {
    const session = await getSession();
    if (!session) return _fail({ message: 'Debes iniciar sesión' });
    
    const { data, error } = await SB.from('materias')
      .insert({ 
        nombre: name, 
        creado_por: session.user.id 
      })
      .select('id:id_materia, name:nombre, is_public:es_publica')
      .single();
      
    return error ? _fail(error) : _ok(data);
  }

  async function deleteSubject(id) {
    const { error } = await SB.from('materias').delete().eq('id_materia', id);
    return error ? _fail(error) : _ok();
  }

  // --- PREGUNTAS (Tabla: 'preguntas') ---
  async function createQuestion(subjectId, cycle, text, answersArray) {
    const session = await getSession();
    if (!session) return _fail({ message: 'Sin sesión' });
    
    // 1. Insertar Pregunta
    const { data: qData, error: qError } = await SB.from('preguntas')
      .insert({
        id_materia: subjectId,
        texto_pregunta: text,
        ciclo: cycle,
        creado_por: session.user.id
      })
      .select('id:id_pregunta, question_text:texto_pregunta')
      .single();

    if (qError) return _fail(qError);
    
    // 2. Insertar Respuestas
    const answersToInsert = answersArray.map(a => ({
      id_pregunta: qData.id,
      texto_respuesta: a.text,
      es_correcta: a.isCorrect
    }));

    const { error: aError } = await SB.from('respuestas').insert(answersToInsert);
    return aError ? _fail(aError) : _ok(qData);
  }

  // --- GESTIÓN DE PREGUNTAS (CRUD COMPLETO) ---
  async function getAllQuestionsForSubject(subjectId) {
    // Obtener datos crudos en español
    const { data, error } = await SB.from('preguntas')
      .select(`
        id_pregunta, texto_pregunta, ciclo,
        respuestas ( id_respuesta, texto_respuesta, es_correcta )
      `)
      .eq('id_materia', subjectId)
      .order('fecha_creacion', { ascending: false });

    if (error) return _fail(error);

    // Mapear a estructura en Inglés para la App
    const mapped = data.map(q => ({
      id: q.id_pregunta,
      question_text: q.texto_pregunta,
      cycle: q.ciclo,
      answers: q.respuestas.map(r => ({
        id: r.id_respuesta,
        answer_text: r.texto_respuesta,
        is_correct: r.es_correcta
      }))
    }));

    return _ok(mapped);
  }

  async function updateQuestion(qId, text, cycle, answersArray) {
    // 1. Actualizar texto de pregunta
    const { error: qError } = await SB.from('preguntas')
      .update({ texto_pregunta: text, ciclo: cycle })
      .eq('id_pregunta', qId);
    
    if (qError) return _fail(qError);

    // 2. Reemplazar respuestas (Estrategia simple: borrar y recrear)
    await SB.from('respuestas').delete().eq('id_pregunta', qId);
    
    const answersToInsert = answersArray.map(a => ({
      id_pregunta: qId,
      texto_respuesta: a.text,
      es_correcta: a.isCorrect
    }));
    
    const { error: aError } = await SB.from('respuestas').insert(answersToInsert);
    return aError ? _fail(aError) : _ok();
  }

  async function deleteQuestion(id) {
    const { error } = await SB.from('preguntas').delete().eq('id_pregunta', id);
    return error ? _fail(error) : _ok();
  }

  // --- JUEGO (LECTURA DE PREGUNTAS) ---
  async function getQuestionsForGame(subjectId, cycle) {
    const { data, error } = await SB.from('preguntas')
      .select(`
        id_pregunta, texto_pregunta, ciclo,
        respuestas ( id_respuesta, texto_respuesta, es_correcta )
      `)
      .eq('id_materia', subjectId)
      .eq('ciclo', cycle);

    if (error) return _fail(error);
    
    // Filtrar preguntas válidas (mínimo 2 respuestas) y traducir
    const validQuestions = data
      .filter(q => q.respuestas && q.respuestas.length >= 2)
      .map(q => ({
        id: q.id_pregunta, 
        question_text: q.texto_pregunta, 
        cycle: q.ciclo,
        answers: q.respuestas.map(r => ({
          id: r.id_respuesta,
          answer_text: r.texto_respuesta,
          is_correct: r.es_correcta
        }))
      }));

    return _ok(validQuestions);
  }

  // --- PACIENTES (NUEVO SISTEMA ÚNICO POR DNI) ---
  async function registerOrGetPatient(name, dni) {
    const session = await getSession();
    if (!session) return _fail({message: "No hay sesión docente activa"});
    
    // 1. Buscar si ya existe este alumno para este docente (por DNI)
    const { data, error } = await SB.from('pacientes')
      .select('id_paciente, nombre, dni')
      .eq('dni', dni)
      .eq('creado_por', session.user.id)
      .maybeSingle(); // No tira error si está vacío, devuelve null

    if (data) {
        // Si existe, actualizamos el nombre por si hubo corrección
        await SB.from('pacientes').update({ nombre: name }).eq('id_paciente', data.id_paciente);
        return _ok(data); // Devolvemos el paciente existente
    }

    // 2. Si no existe, lo creamos
    const { data: newData, error: newError } = await SB.from('pacientes')
      .insert({ 
        nombre: name, 
        dni: dni, 
        creado_por: session.user.id 
      })
      .select('id_paciente, nombre, dni')
      .single();
      
    return newError ? _fail(newError) : _ok(newData);
  }

  // --- INTENTOS Y RESULTADOS (HISTORIAL) ---
  async function saveAttempt(d) {
    // Guardamos el intento vinculándolo al ID único del paciente
    const payload = {
      id_paciente: d.patientId, // Clave foránea real
      nombre_materia: d.subject_name,
      ciclo: d.cycle,
      respuestas_correctas: d.correct_count,
      respuestas_incorrectas: d.incorrect_count,
      puntaje_total: d.score_total
    };

    const { error } = await SB.from('intentos').insert(payload);
    return error ? _fail(error) : _ok();
  }

  // Obtener lista de pacientes (Agrupada)
  async function getPatientsList() {
    // Obtenemos pacientes y contamos sus intentos
    // Requiere que la relación FK esté bien definida en Supabase
    const { data, error } = await SB.from('pacientes')
      .select(`
        id_paciente, nombre, dni, 
        intentos (count)
      `)
      .order('nombre');
    
    if (error) return _fail(error);
    
    // Mapeo simple para la tabla
    const mapped = data.map(p => ({
        id: p.id_paciente,
        name: p.nombre,
        dni: p.dni,
        attempts_count: p.intentos[0]?.count || 0
    }));
    return _ok(mapped);
  }

  // Obtener historial detallado de UN paciente
  async function getPatientHistory(patientId) {
    const { data, error } = await SB.from('intentos')
      .select('*')
      .eq('id_paciente', patientId)
      .order('fecha_creacion', { ascending: false });
      
    if(error) return _fail(error);
    
    // Mapeo a inglés para la vista
    return _ok(data.map(i => ({
        date: i.fecha_creacion,
        subject: i.nombre_materia,
        cycle: i.ciclo,
        score: i.puntaje_total
    })));
  }

  // EXPOSICIÓN DE API PÚBLICA
  window.DB = {
    login, register, logout, getSession, reauthenticate,
    getSubjects, createSubject, deleteSubject,
    createQuestion, getAllQuestionsForSubject, updateQuestion, deleteQuestion,
    getQuestionsForGame,
    // Nuevas funciones V5.1
    registerOrGetPatient, saveAttempt, getPatientsList, getPatientHistory
  };
})();