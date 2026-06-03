// src/pages/SubjectSelect.js
import { getSubjectsList } from "../services/supabase.js";
import { state, setSubject, setCycle } from "../state.js";
import { navigateTo } from "../router/index.js";
import { showModal } from "../components/Modal.js";

export const SubjectSelect = {
  render: async () => {
    // Protección: si entran a esta pantalla sin elegir paciente, les avisamos
    if (!state.patient) {
      return `
        <div class="min-h-screen flex items-center justify-center bg-bg">
          <div class="bg-white p-8 rounded-xl text-center shadow-md">
            <h2 class="text-2xl font-bold text-accent mb-4">No hay paciente seleccionado</h2>
            <button id="btnVolverError" class="bg-primary text-white py-2 px-6 rounded-lg font-semibold">Volver a Pacientes</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="min-h-screen bg-bg">
        <nav class="bg-white shadow-sm p-4 flex items-center gap-4">
          <button id="btnVolver" class="text-gray-500 hover:text-primary transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <h1 class="text-xl font-bold text-primary">Configuración de la Partida</h1>
        </nav>

        <div class="p-8 max-w-4xl mx-auto">
          <p class="text-lg text-gray-600 mb-8">Jugador activo: <span class="font-bold text-secondary text-xl">${state.patient.name}</span></p>

          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">1. Selecciona el Ciclo Escolar</h3>
            <div class="flex gap-4">
              <button class="btn-cycle flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-lg font-bold hover:border-primary transition-colors" data-cycle="Primer Ciclo">Primer Ciclo</button>
              <button class="btn-cycle flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-lg font-bold hover:border-primary transition-colors" data-cycle="Segundo Ciclo">Segundo Ciclo</button>
            </div>
            <p id="cycleError" class="hidden text-accent text-sm mt-2">Debes elegir un ciclo primero.</p>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 class="text-lg font-bold text-gray-800 mb-4">2. Selecciona la Materia</h3>
            <div id="subjectsList" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <span class="text-gray-500">Cargando materias...</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  init: async () => {
    // Si no hay paciente, configuramos el botón de volver y salimos
    if (!state.patient) {
      document
        .getElementById("btnVolverError")
        ?.addEventListener("click", () => navigateTo("/patients"));
      return;
    }

    document
      .getElementById("btnVolver")
      .addEventListener("click", () => navigateTo("/patients"));

    // Lógica de Ciclos
    let localCycle = null;
    const cycleButtons = document.querySelectorAll(".btn-cycle");
    const cycleError = document.getElementById("cycleError");

    cycleButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // Quitar estilos a todos
        cycleButtons.forEach((b) => {
          b.classList.remove("border-primary", "bg-primary/10", "text-primary");
          b.classList.add("border-gray-200", "text-gray-600");
        });
        // Dar estilo al seleccionado
        const clickedBtn = e.currentTarget;
        clickedBtn.classList.remove("border-gray-200", "text-gray-600");
        clickedBtn.classList.add(
          "border-primary",
          "bg-primary/10",
          "text-primary",
        );

        localCycle = clickedBtn.dataset.cycle;
        cycleError.classList.add("hidden");
      });
    });

    // Lógica de Materias
    const listContainer = document.getElementById("subjectsList");
    const result = await getSubjectsList();

    if (!result.ok) {
      listContainer.innerHTML = `<span class="text-accent">Error al cargar materias.</span>`;
      return;
    }

    if (result.data.length === 0) {
      listContainer.innerHTML = `<span class="text-gray-500">No hay materias creadas en la base de datos.</span>`;
      return;
    }

    // Dibujamos los botones de materia
    listContainer.innerHTML = result.data
      .map(
        (m) => `
      <button data-id="${m.id}" data-name="${m.name}" class="btn-subject bg-gray-50 hover:bg-secondary hover:text-white text-gray-800 border border-gray-200 py-4 px-6 rounded-lg font-bold text-left transition-colors shadow-sm">
        ${m.name}
      </button>
    `,
      )
      .join("");

    // Evento al hacer clic en una materia
    document.querySelectorAll(".btn-subject").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (!localCycle) {
          cycleError.classList.remove("hidden");
          return;
        }

        const subjectId = e.currentTarget.dataset.id;
        const subjectName = e.currentTarget.dataset.name;

        // Guardamos todo en el estado global
        setCycle(localCycle);
        setSubject({ id: subjectId, name: subjectName });

        // Guardamos todo en el estado global
        setCycle(localCycle);
        setSubject({ id: subjectId, name: subjectName });

        // Usamos nuestro modal bonito en lugar del alert nativo
        showModal(
          "¡Todo listo!",
          `Materia: <b>${subjectName}</b><br>Ciclo: <b>${localCycle}</b>`,
          async () => {
            const { navigateTo } = await import("../router/index.js");
            navigateTo("/game"); // Vamos al juego real
          },
        );
        // navigateTo('/game');
      });
    });
  },
};
