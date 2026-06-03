// src/pages/Results.js
import { state } from "../state.js";
import { navigateTo } from "../router/index.js";
import {
  saveGameAttempt,
  checkAndAwardAchievement,
} from "../services/supabase.js";

export const Results = {
  render: async () => {
    if (!state.patient || !state.subject) {
      return `<div class="p-8 text-center">No hay resultados disponibles. <button id="btnVolverR" class="text-primary underline">Volver</button></div>`;
    }

    const total = state.score.correct + state.score.incorrect;
    const finalScore = state.score.correct;

    let feedback = "¡Sigue practicando, tú puedes!";
    if (finalScore === total && total > 0)
      feedback = "¡Perfecto! ¡Eres un genio!";
    else if (finalScore > total / 2) feedback = "¡Muy buen trabajo!";

    return `
      <div class="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
        <div class="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border border-gray-100 transform transition-all animate-fade-in">
          <div id="confetti-container" class="w-40 h-40 mx-auto mb-2"></div>
          <h2 class="text-3xl font-bold text-primary mb-2">¡Felicitaciones!</h2>
          <p class="text-gray-600 mb-6">Has completado <span class="font-bold text-gray-800">${state.subject.name}</span></p>
          <div class="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-100">
            <div class="text-5xl font-black text-secondary mb-2">${finalScore}/${total}</div>
            <p class="text-sm font-bold text-gray-500">${feedback}</p>
          </div>
          <div class="space-y-3">
            <button id="btnJugarOtra" class="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors shadow-md">
              Jugar otra materia
            </button>
            <button id="btnIrDibujar" class="w-full bg-purple-100 text-purple-700 font-bold py-3 rounded-xl hover:bg-purple-200 transition-colors">
              Ir a Dibujar
            </button>
          </div>
        </div>
      </div>
    `;
  },

  init: async () => {
    if (!state.patient || !state.subject) {
      document
        .getElementById("btnVolverR")
        ?.addEventListener("click", () => navigateTo("/patients"));
      return;
    }

    // Guardar intento
    await saveGameAttempt(
      state.patient.id,
      state.subject.name,
      state.cycle,
      state.score.correct,
      state.score.incorrect,
    );

    // SISTEMA DE LOGROS
    await checkAndAwardAchievement(state.patient.id, "Primeros Pasos");
    const total = state.score.correct + state.score.incorrect;
    if (state.score.correct === total && total > 0) {
      await checkAndAwardAchievement(state.patient.id, "Puntaje Perfecto");
    }

    // Confeti
    if (window.lottie) {
      window.lottie.loadAnimation({
        container: document.getElementById("confetti-container"),
        renderer: "svg",
        loop: false,
        autoplay: true,
        path: "https://assets3.lottiefiles.com/packages/lf20_obhph3sh.json",
      });
    }

    document
      .getElementById("btnJugarOtra")
      .addEventListener("click", () => navigateTo("/subjects"));
    document
      .getElementById("btnIrDibujar")
      .addEventListener("click", () => navigateTo("/recreation"));
  },
};
