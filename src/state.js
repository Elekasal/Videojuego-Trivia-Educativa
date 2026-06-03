// src/state.js
export const state = {
  user: null,
  patient: null,
  subject: null, // Guardará la materia elegida
  cycle: null,   // Guardará el ciclo (Primer Ciclo o Segundo Ciclo)
  score: { correct: 0, incorrect: 0 },
};

export const setUser = (user) => { state.user = user; };
export const setPatient = (patient) => { state.patient = patient; };
export const setSubject = (subject) => { state.subject = subject; };
export const setCycle = (cycle) => { state.cycle = cycle; };

export const clearSession = () => { 
  state.user = null; 
  state.patient = null; 
  state.subject = null;
  state.cycle = null;
};