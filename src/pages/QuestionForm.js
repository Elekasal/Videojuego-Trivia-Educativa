// src/pages/QuestionForm.js
import {
  getSubjectsList,
  createQuestionWithAnswers,
} from "../services/supabase.js";
import { navigateTo } from "../router/index.js";
import { showModal } from "../components/Modal.js";

export const QuestionForm = {
  render: async () => {
    return `
      <div class="min-h-screen bg-bg p-4">
        <div class="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 mt-8">
          <div class="flex items-center gap-4 mb-6">
             <button id="btnVolverQF" class="text-gray-500 hover:text-primary"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></button>
             <h2 class="text-2xl font-bold text-primary">Crear Nueva Pregunta</h2>
          </div>

          <form id="qForm" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Materia</label>
                <select id="qSubject" required class="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary outline-none">
                  <option value="">Cargando...</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Ciclo Escolar</label>
                <select id="qCycle" required class="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary outline-none">
                  <option value="">Seleccione...</option>
                  <option value="Primer Ciclo">Primer Ciclo</option>
                  <option value="Segundo Ciclo">Segundo Ciclo</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Texto de la Pregunta</label>
              <textarea id="qText" required rows="2" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Ej: ¿Cuánto es 2 + 2?"></textarea>
            </div>

            <div class="space-y-4 pt-4 border-t border-gray-200">
              <h3 class="font-bold text-gray-800">Respuestas (1 Correcta, 3 Incorrectas)</h3>
              
              <div>
                <label class="text-sm font-bold text-green-600">Respuesta Correcta</label>
                <input type="text" id="ansCorrect" required class="w-full p-3 border border-green-300 bg-green-50 rounded-lg outline-none focus:border-green-500" placeholder="Ej: 4">
              </div>

              <div>
                <label class="text-sm font-bold text-red-500">Respuesta Incorrecta 1</label>
                <input type="text" id="ansWrong1" required class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-red-400">
              </div>
              
              <div>
                <label class="text-sm font-bold text-red-500">Respuesta Incorrecta 2</label>
                <input type="text" id="ansWrong2" required class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-red-400">
              </div>

              <div>
                <label class="text-sm font-bold text-red-500">Respuesta Incorrecta 3</label>
                <input type="text" id="ansWrong3" required class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-red-400">
              </div>
            </div>

            <button type="submit" id="btnSaveQ" class="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-md mt-6">
              Guardar Pregunta
            </button>
          </form>
        </div>
      </div>
    `;
  },

  init: async () => {
    document
      .getElementById("btnVolverQF")
      .addEventListener("click", () => navigateTo("/questions"));

    // Cargar materias en el select
    const subjectSelect = document.getElementById("qSubject");
    const resultSubj = await getSubjectsList();
    if (resultSubj.ok && resultSubj.data.length > 0) {
      subjectSelect.innerHTML =
        `<option value="">Seleccione materia...</option>` +
        resultSubj.data
          .map((s) => `<option value="${s.id}">${s.name}</option>`)
          .join("");
    } else {
      subjectSelect.innerHTML = `<option value="">No hay materias creadas</option>`;
    }

    // Manejar el formulario
    document.getElementById("qForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btnSave = document.getElementById("btnSaveQ");

      const subjectId = document.getElementById("qSubject").value;
      const cycle = document.getElementById("qCycle").value;
      const text = document.getElementById("qText").value.trim();

      const answers = [
        {
          text: document.getElementById("ansCorrect").value.trim(),
          isCorrect: true,
        },
        {
          text: document.getElementById("ansWrong1").value.trim(),
          isCorrect: false,
        },
        {
          text: document.getElementById("ansWrong2").value.trim(),
          isCorrect: false,
        },
        {
          text: document.getElementById("ansWrong3").value.trim(),
          isCorrect: false,
        },
      ];

      btnSave.disabled = true;
      btnSave.textContent = "Guardando...";

      const result = await createQuestionWithAnswers(
        subjectId,
        text,
        cycle,
        answers,
      );

      if (result.ok) {
        showModal("¡Éxito!", "La pregunta se guardó correctamente.", () => {
          navigateTo("/questions");
        });
      } else {
        showModal("Error", "No se pudo guardar la pregunta.");
        btnSave.disabled = false;
        btnSave.textContent = "Guardar Pregunta";
      }
    });
  },
};
