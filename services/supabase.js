/* ==========================================================
   services/supabase.js — Supabase (schema 'app')
   - Upsert por (created_by, patient_name, cycle)
   - Delete por id
   - API usada por logica.js
   ========================================================== */
(() => {
  const SUPABASE_URL      = 'https://gddpceumixxwrbejgotd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZHBjZXVtaXh4d3JiZWpnb3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MzI1MzEsImV4cCI6MjA3NzAwODUzMX0._dy0jD4uVE0fMCkfeQfrGoPSPPIh3PbnoDoQPAoGbQA';

  let SB = null;
  if (typeof window !== 'undefined' && window.supabase) {
    SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      db: { schema: 'app' }
    });
  }

  const _ok   = (data=null) => ({ ok:true,  data,  mode:'supabase' });
  const _fail = (error={})  => ({ ok:false, error, mode:'supabase' });

  async function _getSession() {
    if (!SB) return null;
    const { data } = await SB.auth.getSession();
    return data?.session ?? null;
  }

  // -------- AUTH --------
  async function signUpDocente({ email, password, username }) {
    if (!SB) return _ok();
    try {
      const { error } = await SB.auth.signUp({
        email, password, options: { data: { username } }
      });
      if (error) return _fail(error);
      return _ok();
    } catch (e) { console.error(e); return _fail(e); }
  }

  async function signInDocente({ email, password }) {
    if (!SB) return _ok();
    try {
      const { data, error } = await SB.auth.signInWithPassword({ email, password });
      if (error) return _fail(error);
      return _ok(data?.user ?? null);
    } catch (e) { console.error(e); return _fail(e); }
  }

  async function signOutDocente() {
    if (!SB) return _ok();
    try {
      const { error } = await SB.auth.signOut();
      if (error) return _fail(error);
      return _ok();
    } catch (e) { console.error(e); return _fail(e); }
  }

  // -------- PACIENTES --------
  async function savePatient({ patientName }) {
    if (!SB) return _ok();
    try {
      const session = await _getSession();
      if (!session) return _fail({ message:'No hay sesión de Supabase.' });

      const { error } = await SB
        .from('patients')
        .insert({ patient_name: patientName, created_by: session.user.id });

      if (error) return _fail(error);
      return _ok();
    } catch (e) { console.error(e); return _fail(e); }
  }

  // -------- INTENTOS --------
  async function saveAttempt({ patientName, cycle, scores }) {
    if (!SB) return _ok();
    try {
      const session = await _getSession();
      if (!session) return _fail({ message:'No hay sesión de Supabase.' });

      const total =
        (scores['Lengua']||0) +
        (scores['Matemática']||0) +
        (scores['Ciencias Naturales']||0);

      const payload = {
        created_by       : session.user.id,
        patient_name     : patientName,
        cycle            : cycle,
        score_lengua     : scores['Lengua']||0,
        score_matematica : scores['Matemática']||0,
        score_ciencias   : scores['Ciencias Naturales']||0,
        total
      };

      // UPSERT por (created_by, patient_name, cycle)
      const { error } = await SB
        .from('quiz_attempts')
        .upsert(payload, { onConflict: 'created_by,patient_name,cycle' });

      if (error) return _fail(error);
      return _ok();
    } catch (e) { console.error(e); return _fail(e); }
  }

  async function fetchAttempts({ limit = 200 } = {}) {
    if (!SB) return _ok([]);
    try {
      const session = await _getSession();
      if (!session) return _fail({ message:'No hay sesión de Supabase.' });

      const { data, error } = await SB
        .from('quiz_attempts')
        .select('id, patient_name, cycle, score_lengua, score_matematica, score_ciencias, total, created_at')
        .order('created_at', { ascending:false })
        .limit(limit);

      if (error) return _fail(error);

      const mapped = (data||[]).map(r => ({
        id         : r.id,
        patientName: r.patient_name,
        cycle      : r.cycle,
        scores     : {
          'Lengua'             : r.score_lengua||0,
          'Matemática'         : r.score_matematica||0,
          'Ciencias Naturales' : r.score_ciencias||0,
        },
        total      : r.total||0,
        created_at : r.created_at,
      }));
      return _ok(mapped);
    } catch (e) { console.error(e); return _fail(e); }
  }

  async function deleteAttempt(id) {
    if (!SB) return _ok();
    try {
      const session = await _getSession();
      if (!session) return _fail({ message:'No hay sesión de Supabase.' });

      const { error } = await SB.from('quiz_attempts').delete().eq('id', id);
      if (error) return _fail(error);
      return _ok();
    } catch (e) { console.error(e); return _fail(e); }
  }

  // Exposición global
  window.SB = SB;
  window.DB = {
    USE_SUPABASE: !!SB,
    signUpDocente, signInDocente, signOutDocente,
    savePatient, saveAttempt, fetchAttempts, deleteAttempt
  };

  console.info('[services/supabase.js] cargado → USE_SUPABASE:', !!SB);
})();
