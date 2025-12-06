/* ==========================================================
   services/supabase.js
   ADAPTADOR V5: APP (Inglés/V4) <---> BASE DE DATOS (Español/Universitaria)
   
   Este archivo traduce las peticiones de la App (que espera inglés)
   a la estructura de la Base de Datos universitaria (que está en español
   y usa claves primarias únicas como id_materia, id_pregunta, etc).
   ========================================================== */
(() => {
  // CONFIGURACIÓN
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

  // --- AUTH (Supabase Auth usa sus propias tablas internas, no se tocan) ---
  async function login(email, password) {
    if (!SB) return _fail({ message: 'No DB' });
    const { data, error } = await SB.auth.signInWithPassword({ email, password });
    return error ? _fail(error) : _ok(data.user);
  }

  // Función de re-autenticación para zonas seguras
  async function reauthenticate(email, password) {
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

  // --- MATERIAS (Tabla DB: 'materias') ---
  async function getSubjects() {
    // TRADUCCIÓN: DB(español) -> APP(inglés)
    // id_materia se convierte en 'id' para que el JS lo entienda
    const { data, error } = await SB.from('materias')
      .select('id:id_materia, name:nombre, is_public:es_publica')
      .order('fecha_creacion');
    
    return error ? _fail(error) : _ok(data);
  }

  async function createSubject(name) {
    const session = await getSession();
    if (!session) return _fail({ message: 'Debes iniciar sesión' });
    
    // Insertamos en español (nombre)
    const { data, error } = await SB.from('materias')
      .insert({ 
        nombre: name, 
        creado_por: session.user.id 
      })
      .select('id:id_materia, name:nombre, is_public:es_publica') // Retornamos traducido
      .single();
      
    return error ? _fail(error) : _ok(data);
  }

  async function deleteSubject(id) {
    // Usamos la PK correcta: id_materia
    const { error } = await SB.from('materias').delete().eq('id_materia', id);
    return error ? _fail(error) : _ok();
  }

  // --- PREGUNTAS (Tabla DB: 'preguntas') ---
  async function createQuestion(subjectId, cycle, text, answersArray) {
    const session = await getSession();
    if (!session) return _fail({ message: 'Sin sesión' });
    
    // 1. Insertar Pregunta (Traduciendo: subjectId -> id_materia)
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
    
    // 2. Insertar Respuestas (Tabla DB: 'respuestas')
    // Traduciendo: question_id -> id_pregunta
    const answersToInsert = answersArray.map(a => ({
      id_pregunta: qData.id,
      texto_respuesta: a.text,
      es_correcta: a.isCorrect
    }));

    const { error: aError } = await SB.from('respuestas').insert(answersToInsert);
    return aError ? _fail(aError) : _ok(qData);
  }

  // Obtener preguntas para el GESTOR (Edición)
  async function getAllQuestionsForSubject(subjectId) {
    // Traemos los datos crudos en español
    const { data, error } = await SB.from('preguntas')
      .select(`
        id_pregunta, texto_pregunta, ciclo,
        respuestas ( id_respuesta, texto_respuesta, es_correcta )
      `)
      .eq('id_materia', subjectId)
      .order('fecha_creacion', { ascending: false });

    if (error) return _fail(error);

    // MAPEO MANUAL: Convertimos la estructura español -> estructura inglés de la App
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
    // 1. Actualizar pregunta (usando id_pregunta y texto_pregunta)
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
    // Borrar usando PK única id_pregunta
    const { error } = await SB.from('preguntas').delete().eq('id_pregunta', id);
    return error ? _fail(error) : _ok();
  }

  // --- JUEGO (Lectura para Trivia) ---
  async function getQuestionsForGame(subjectId, cycle) {
    const { data, error } = await SB.from('preguntas')
      .select(`
        id_pregunta, texto_pregunta, ciclo,
        respuestas ( id_respuesta, texto_respuesta, es_correcta )
      `)
      .eq('id_materia', subjectId)
      .eq('ciclo', cycle);

    if (error) return _fail(error);
    
    // Filtrar válidas y traducir
    const validQuestions = data
      .filter(q => q.respuestas && q.respuestas.length >= 2)
      .map(q => ({
        id: q.id_pregunta, // La App espera 'id'
        question_text: q.texto_pregunta, // La App espera 'question_text'
        cycle: q.ciclo,
        answers: q.respuestas.map(r => ({
          id: r.id_respuesta,
          answer_text: r.texto_respuesta,
          is_correct: r.es_correcta
        }))
      }));

    return _ok(validQuestions);
  }

  // --- RESULTADOS (Tabla DB: 'intentos') ---
  async function saveAttempt(d) {
    // Traducir objeto App (Inglés) -> Columnas DB (Español)
    const payload = {
      nombre_paciente: d.patient_name,
      nombre_materia: d.subject_name,
      ciclo: d.cycle,
      respuestas_correctas: d.correct_count,
      respuestas_incorrectas: d.incorrect_count,
      puntaje_total: d.score_total,
      creado_por: d.created_by
    };

    const { error } = await SB.from('intentos').insert(payload);
    return error ? _fail(error) : _ok();
  }

  async function getAttempts() {
    const { data, error } = await SB.from('intentos')
      .select(`
        id_intento, nombre_paciente, nombre_materia, ciclo, 
        respuestas_correctas, respuestas_incorrectas, puntaje_total, fecha_creacion
      `)
      .order('fecha_creacion', { ascending: false });

    if (error) return _fail(error);

    // Traducir DB (Español) -> App (Inglés) para la tabla de resultados
    const mapped = data.map(r => ({
      id: r.id_intento,
      patient_name: r.nombre_paciente,
      subject_name: r.nombre_materia,
      cycle: r.ciclo,
      correct_count: r.respuestas_correctas,
      incorrect_count: r.respuestas_incorrectas,
      score_total: r.puntaje_total,
      created_at: r.fecha_creacion
    }));

    return _ok(mapped);
  }

  // Exponer API (Mantiene los mismos nombres de funciones que usa logica.js)
  window.DB = {
    login, register, logout, getSession, reauthenticate,
    getSubjects, createSubject, deleteSubject,
    createQuestion, getAllQuestionsForSubject, updateQuestion, deleteQuestion,
    getQuestionsForGame,
    saveAttempt, getAttempts
  };
})();