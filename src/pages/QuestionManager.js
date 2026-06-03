// src/pages/QuestionManager.js
import {
  getAllQuestions,
  deleteQuestion,
  getSubjectsList,
} from "../services/supabase.js";
import { navigateTo } from "../router/index.js";

export const QuestionManager = {
  render: async () => {
    return `
      <div class="min-h-screen bg-bg">
        <nav class="bg-white shadow-sm p-4 flex justify-between items-center">
          <div class="flex items-center gap-4">
            <button id="btnVolverQM" class="text-gray-500 hover:text-primary transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>
            <h1 class="text-xl font-bold text-primary">Gestor de Preguntas</h1>
          </div>
          <button id="btnNuevaPregunta" class="bg-primary text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
            + Nueva Pregunta
          </button>
        </nav>

        <div class="p-4 md:p-8 max-w-6xl mx-auto">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <th class="p-4 text-sm font-bold text-gray-700">Materia</th>
                    <th class="p-4 text-sm font-bold text-gray-700">Ciclo</th>
                    <th class="p-4 text-sm font-bold text-gray-700">Pregunta</th>
                    <th class="p-4 text-sm font-bold text-gray-700 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody id="questions-tbody" class="divide-y divide-gray-100">
                  <tr><td colspan="4" class="p-4 text-center text-gray-500">Cargando preguntas...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  init: async () => {
    document
      .getElementById("btnVolverQM")
      .addEventListener("click", () => navigateTo("/dashboard"));

    const tbody = document.getElementById("questions-tbody");

    // Función para dibujar la tabla
    const loadTable = async () => {
      const result = await getAllQuestions();

      if (!result.ok) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-accent">Error al cargar datos.</td></tr>`;
        return;
      }

      if (result.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-500">No hay preguntas registradas.</td></tr>`;
        return;
      }

      tbody.innerHTML = result.data
        .map(
          (q) => `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="p-4 text-sm text-gray-800 font-semibold">${q.subjectName}</td>
          <td class="p-4 text-sm text-gray-600">${q.cycle}</td>
          <td class="p-4 text-sm text-gray-800">${q.text}</td>
          <td class="p-4 text-center">
            <button data-id="${q.id}" class="btn-delete-q text-accent hover:bg-red-50 p-2 rounded transition-colors" title="Eliminar">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </td>
        </tr>
      `,
        )
        .join("");

      // Evento para borrar
      document.querySelectorAll(".btn-delete-q").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          if (confirm("¿Estás seguro de eliminar esta pregunta?")) {
            const id = e.currentTarget.dataset.id;
            await deleteQuestion(id);
            await loadTable(); // Recargar la tabla
          }
        });
      });
    };

    await loadTable();

    // Evento para Nueva Pregunta (Navegar al formulario)
    document
      .getElementById("btnNuevaPregunta")
      .addEventListener("click", () => {
        navigateTo("/question-form");
      });
  },
};
