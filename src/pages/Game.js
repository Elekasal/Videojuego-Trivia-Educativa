// src/pages/Game.js
import { getQuestionsForGame } from "../services/supabase.js";
import { state } from "../state.js";
import { navigateTo } from "../router/index.js";
import { showModal } from "../components/Modal.js";

export const Game = {
  render: async () => {
    // Protección de ruta
    if (!state.patient || !state.subject || !state.cycle) {
      return `<div class="p-8 text-center">Faltan datos para jugar. <button id="btnVolverG" class="text-primary underline">Volver</button></div>`;
    }

    return `
      <div class="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
        <div id="game-container" class="w-full max-w-2xl bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
          <div class="text-center text-gray-500 animate-pulse">Cargando preguntas...</div>
        </div>
      </div>
    `;
  },

  init: async () => {
    // Si entró por error sin datos
    document
      .getElementById("btnVolverG")
      ?.addEventListener("click", () => navigateTo("/patients"));
    if (!state.subject) return;

    const container = document.getElementById("game-container");

    // 1. Reiniciamos el estado del juego
    state.currentQuestionIndex = 0;
    state.score = { correct: 0, incorrect: 0 };

    // 2. Traemos las preguntas de Supabase
    const result = await getQuestionsForGame(state.subject.id, state.cycle);

    if (!result.ok || result.data.length === 0) {
      container.innerHTML = `
        <h2 class="text-xl font-bold text-accent text-center mb-4">No hay preguntas disponibles para esta materia y ciclo.</h2>
        <button id="btnVolverEmpty" class="w-full btn">Elegir otra materia</button>
      `;
      document
        .getElementById("btnVolverEmpty")
        .addEventListener("click", () => navigateTo("/subjects"));
      return;
    }

    state.questions = result.data; // Guardamos las preguntas en el estado global

    // 3. Motor interno de dibujado de preguntas
    const renderQuestion = () => {
      const qIndex = state.currentQuestionIndex;
      const question = state.questions[qIndex];

      // Barajar respuestas para que no salgan siempre en el mismo orden
      const shuffledAnswers = [...question.answers].sort(
        () => Math.random() - 0.5,
      );

      container.innerHTML = `
        <div class="flex justify-between items-center mb-6 text-sm text-gray-500 font-bold">
          <span>${state.subject.name} - ${state.cycle}</span>
          <span>Pregunta ${qIndex + 1} de ${state.questions.length}</span>
        </div>
        
        <h2 class="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-8">
          ${question.text}
        </h2>

        <div class="flex flex-col gap-4 mb-8" id="answers-container">
          ${shuffledAnswers
            .map(
              (ans) => `
            <button data-correct="${ans.isCorrect}" class="btn-answer w-full py-4 px-6 text-left border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-primary hover:bg-primary/5 transition-all">
              ${ans.text}
            </button>
          `,
            )
            .join("")}
        </div>

        <div class="hidden text-center" id="next-action">
           <button id="btn-next" class="btn w-full">Continuar</button>
        </div>
      `;

      // Lógica al hacer clic en una respuesta
      const answerButtons = document.querySelectorAll(".btn-answer");
      const nextAction = document.getElementById("next-action");
      const btnNext = document.getElementById("btn-next");

      answerButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          // Bloquear todos los botones después de elegir
          answerButtons.forEach((b) => {
            b.disabled = true;
            b.classList.add("opacity-70", "cursor-not-allowed");
          });

          const isCorrect = e.currentTarget.dataset.correct === "true";

          if (isCorrect) {
            e.currentTarget.classList.replace(
              "border-gray-200",
              "border-green-500",
            );
            e.currentTarget.classList.add("bg-green-100", "text-green-800");
            state.score.correct++;
          } else {
            e.currentTarget.classList.replace(
              "border-gray-200",
              "border-red-500",
            );
            e.currentTarget.classList.add("bg-red-100", "text-red-800");
            state.score.incorrect++;

            // Pintar la correcta de verde para que el alumno aprenda
            const correctBtn = Array.from(answerButtons).find(
              (b) => b.dataset.correct === "true",
            );
            if (correctBtn) {
              correctBtn.classList.replace(
                "border-gray-200",
                "border-green-500",
              );
            }
          }

          nextAction.classList.remove("hidden"); // Mostrar botón Continuar
        });
      });

      // Lógica de Continuar
      btnNext.addEventListener("click", () => {
        if (state.currentQuestionIndex + 1 < state.questions.length) {
          state.currentQuestionIndex++;
          renderQuestion(); // Dibujamos la siguiente
        } else {
          // Navegamos a la pantalla de resultados
          navigateTo("/results");
        }
      });
    };

    // Iniciamos la primera pregunta
    renderQuestion();
  },
};
