// src/services/supabase.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gddpceumixxwrbejgotd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZHBjZXVtaXh4d3JiZWpnb3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MzI1MzEsImV4cCI6MjA3NzAwODUzMX0._dy0jD4uVE0fMCkfeQfrGoPSPPIh3PbnoDoQPAoGbQA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: "app" },
});

export const _ok = (data = null) => ({ ok: true, data });
export const _fail = (error = {}) => ({ ok: false, error });

export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) return null;
  return session;
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return error ? _fail(error) : _ok(data.user);
}

export async function registerTeacher(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return error ? _fail(error) : _ok(data);
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  return error ? _fail(error) : _ok();
}

// ==========================================
// PACIENTES
// ==========================================
export async function getPatientsList() {
  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .order("nombre");
  if (error) return _fail(error);
  const mapped = data.map((p) => ({
    id: p.id_paciente || p.id,
    patient_name: p.nombre,
    avatar_url: p.avatar_url,
    created_at: p.fecha_creacion || p.created_at || new Date().toISOString(),
  }));
  return _ok(mapped);
}

export async function createPatient(patientName) {
  const session = await getSession();
  if (!session) return _fail({ message: "No hay sesión activa." });
  const { data, error } = await supabase
    .from("pacientes")
    .insert([
      {
        nombre: patientName,
        dni: Math.floor(Math.random() * 100000000).toString(),
        creado_por: session.user.id,
      },
    ])
    .select()
    .single();
  if (error) return _fail(error);
  return _ok({
    id: data.id_paciente || data.id,
    patient_name: data.nombre,
    avatar_url: data.avatar_url,
    created_at:
      data.fecha_creacion || data.created_at || new Date().toISOString(),
  });
}

export async function updatePatientAvatar(patientId, avatarUrl) {
  const { error } = await supabase
    .from("pacientes")
    .update({ avatar_url: avatarUrl })
    .eq("id_paciente", patientId);
  return error ? _fail(error) : _ok();
}

// ==========================================
// MATERIAS (Nuevas Funciones Agregadas)
// ==========================================
export async function getSubjectsList() {
  const { data, error } = await supabase
    .from("materias")
    .select("*")
    .order("fecha_creacion");
  if (error) return _fail(error);
  const mapped = data.map((m) => ({ id: m.id_materia, name: m.nombre }));
  return _ok(mapped);
}

export async function createSubject(name) {
  const session = await getSession();
  if (!session) return _fail({ message: "No hay sesión activa." });
  const { data, error } = await supabase
    .from("materias")
    .insert([{ nombre: name }])
    .select()
    .single();
  return error ? _fail(error) : _ok(data);
}

export async function deleteSubject(subjectId) {
  const { error } = await supabase
    .from("materias")
    .delete()
    .eq("id_materia", subjectId);
  return error ? _fail(error) : _ok();
}

// ==========================================
// GESTIÓN DE PREGUNTAS
// ==========================================
export async function getAllQuestions() {
  const { data, error } = await supabase
    .from("preguntas")
    .select(
      `id_pregunta, texto_pregunta, ciclo, materias (nombre), respuestas ( id_respuesta, texto_respuesta, es_correcta )`,
    )
    .order("fecha_creacion", { ascending: false });
  if (error) return _fail(error);
  const mapped = data.map((q) => ({
    id: q.id_pregunta,
    text: q.texto_pregunta,
    cycle: q.ciclo,
    subjectName: q.materias ? q.materias.nombre : "Sin Materia",
    answers: q.respuestas.map((r) => ({
      id: r.id_respuesta,
      text: r.texto_respuesta,
      isCorrect: r.es_correcta,
    })),
  }));
  return _ok(mapped);
}

export async function createQuestionWithAnswers(
  subjectId,
  questionText,
  cycle,
  answers,
) {
  const session = await getSession();
  if (!session) return _fail({ message: "No hay sesión activa." });
  const { data: qData, error: qError } = await supabase
    .from("preguntas")
    .insert([
      {
        id_materia: subjectId,
        texto_pregunta: questionText,
        ciclo: cycle,
        creado_por: session.user.id,
      },
    ])
    .select()
    .single();
  if (qError) return _fail(qError);
  const answersToInsert = answers.map((ans) => ({
    id_pregunta: qData.id_pregunta,
    texto_respuesta: ans.text,
    es_correcta: ans.isCorrect,
  }));
  const { error: aError } = await supabase
    .from("respuestas")
    .insert(answersToInsert);
  if (aError) {
    await supabase
      .from("preguntas")
      .delete()
      .eq("id_pregunta", qData.id_pregunta);
    return _fail(aError);
  }
  return _ok(qData);
}

export async function deleteQuestion(questionId) {
  const { error } = await supabase
    .from("preguntas")
    .delete()
    .eq("id_pregunta", questionId);
  return error ? _fail(error) : _ok();
}

// ==========================================
// JUEGO (PREGUNTAS Y RESPUESTAS)
// ==========================================
export async function getQuestionsForGame(subjectId, cycle) {
  const { data, error } = await supabase
    .from("preguntas")
    .select(
      `id_pregunta, texto_pregunta, ciclo, respuestas ( id_respuesta, texto_respuesta, es_correcta )`,
    )
    .eq("id_materia", subjectId)
    .eq("ciclo", cycle);
  if (error) return _fail(error);
  const validQuestions = data
    .filter((q) => q.respuestas && q.respuestas.length >= 2)
    .map((q) => ({
      id: q.id_pregunta,
      text: q.texto_pregunta,
      answers: q.respuestas.map((r) => ({
        id: r.id_respuesta,
        text: r.texto_respuesta,
        isCorrect: r.es_correcta,
      })),
    }));
  return _ok(validQuestions);
}

export async function saveGameAttempt(
  patientId,
  subjectName,
  cycle,
  correct,
  incorrect,
) {
  const session = await getSession();
  if (!session) return _fail({ message: "No hay sesión activa." });
  const { error } = await supabase
    .from("intentos")
    .insert([
      {
        id_paciente: patientId,
        nombre_materia: subjectName,
        ciclo: cycle,
        respuestas_correctas: correct,
        respuestas_incorrectas: incorrect,
        puntaje_total: correct,
        creado_por: session.user.id,
      },
    ]);
  return error ? _fail(error) : _ok();
}

export async function getTeacherMetrics() {
  const session = await getSession();
  if (!session) return _fail({ message: "No hay sesión activa." });
  const { data, error } = await supabase
    .from("intentos")
    .select("respuestas_correctas, respuestas_incorrectas")
    .eq("creado_por", session.user.id);
  if (error) return _fail(error);
  let totalCorrect = 0;
  let totalIncorrect = 0;
  data.forEach((row) => {
    totalCorrect += row.respuestas_correctas || 0;
    totalIncorrect += row.respuestas_incorrectas || 0;
  });
  return _ok({ totalCorrect, totalIncorrect, totalAttempts: data.length });
}

// ==========================================
// ZONA RECREATIVA
// ==========================================
export async function saveDrawingUrl(patientId, imageUrl) {
  const { error } = await supabase
    .from("dibujos")
    .insert([{ id_paciente: patientId, imagen_b64: imageUrl }]);
  return error ? _fail(error) : _ok();
}

// ==========================================
// HISTORIAL DEL ALUMNO
// ==========================================
export async function getPatientHistory(patientId) {
  const { data, error } = await supabase
    .from("intentos")
    .select("*")
    .eq("id_paciente", patientId)
    .order("fecha_creacion", { ascending: false });
  if (error) return _fail(error);
  return _ok(data);
}

export async function getPatientDrawings(patientId) {
  const { data, error } = await supabase
    .from("dibujos")
    .select("*")
    .eq("id_paciente", patientId)
    .order("fecha_creacion", { ascending: false });
  if (error) return _fail(error);
  return _ok(data);
}

// ==========================================
// SISTEMA DE LOGROS
// ==========================================
export async function checkAndAwardAchievement(patientId, logroNombre) {
  const { data: logroData, error: err1 } = await supabase
    .from("logros")
    .select("id_logro")
    .eq("nombre", logroNombre)
    .single();
  if (err1 || !logroData) return false;
  const { data: existing, error: err2 } = await supabase
    .from("paciente_logros")
    .select("id_paciente_logro")
    .eq("id_paciente", patientId)
    .eq("id_logro", logroData.id_logro);
  if (existing && existing.length > 0) return false;
  await supabase
    .from("paciente_logros")
    .insert([{ id_paciente: patientId, id_logro: logroData.id_logro }]);
  return true;
}

export async function getPatientAchievements(patientId) {
  const { data, error } = await supabase
    .from("paciente_logros")
    .select(`fecha_obtencion, logros (nombre, descripcion, imagen_url)`)
    .eq("id_paciente", patientId)
    .order("fecha_obtencion", { ascending: false });
  if (error) return _fail(error);
  return _ok(data);
}
