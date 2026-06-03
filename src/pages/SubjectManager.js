// src/pages/SubjectManager.js
import {
  getSubjectsList,
  createSubject,
  deleteSubject,
} from "../services/supabase.js";
import { navigateTo } from "../router/index.js";

export const SubjectManager = {
  render: async () => {
    return `
      <div class="min-h-screen bg-bg">
        <nav class="bg-white shadow-sm p-4 flex justify-between items-center">
          <div class="flex items-center gap-4">
            <button id="btnVolverSM" class="text-gray-500 hover:text-primary transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>
            <h1 class="text-xl font-bold text-primary">Gestor de Materias</h1>
          </div>
        </nav>

        <div class="p-8 max-w-4xl mx-auto">
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <h2 class="text-lg font-bold text-gray-800 mb-4">Crear Nueva Materia</h2>
            <form id="addSubjectForm" class="flex flex-col sm:flex-row gap-4">
              <input type="text" id="subjectName" required placeholder="Ej: Ciencias Sociales" 
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
              <button type="submit" id="btnAddSubject" class="bg-primary text-white font-semibold py-2 px-8 rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
                Guardar
              </button>
            </form>
            <div id="subjectError" class="hidden text-accent text-sm mt-2"></div>
          </div>

          <h2 class="text-lg font-bold text-gray-800 mb-4">Materias Existentes</h2>
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="p-4 text-sm font-bold text-gray-700">Nombre de la Materia</th>
                  <th class="p-4 text-sm font-bold text-gray-700 text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody id="subjects-tbody" class="divide-y divide-gray-100">
                <tr><td colspan="2" class="p-4 text-center text-gray-500">Cargando materias...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  init: async () => {
    document
      .getElementById("btnVolverSM")
      .addEventListener("click", () => navigateTo("/dashboard"));

    const loadSubjects = async () => {
      const tbody = document.getElementById("subjects-tbody");
      const result = await getSubjectsList();

      if (!result.ok) {
        tbody.innerHTML = `<tr><td colspan="2" class="p-4 text-center text-accent">Error al cargar materias.</td></tr>`;
        return;
      }

      if (result.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" class="p-4 text-center text-gray-500">No hay materias registradas.</td></tr>`;
        return;
      }

      tbody.innerHTML = result.data
        .map(
          (m) => `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="p-4 text-sm text-gray-800 font-bold">${m.name}</td>
          <td class="p-4 text-center">
            <button data-id="${m.id}" class="btn-delete-subj text-accent hover:bg-red-50 p-2 rounded transition-colors" title="Eliminar">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </td>
        </tr>
      `,
        )
        .join("");

      document.querySelectorAll(".btn-delete-subj").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          if (
            confirm(
              "¿Estás seguro de eliminar esta materia? (También se eliminarán sus preguntas).",
            )
          ) {
            const id = e.currentTarget.dataset.id;
            await deleteSubject(id);
            await loadSubjects();
          }
        });
      });
    };

    await loadSubjects();

    const form = document.getElementById("addSubjectForm");
    const errorMsg = document.getElementById("subjectError");
    const btnAdd = document.getElementById("btnAddSubject");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("subjectName").value.trim();
      errorMsg.classList.add("hidden");
      btnAdd.disabled = true;
      btnAdd.textContent = "Guardando...";

      const result = await createSubject(name);
      if (result.ok) {
        document.getElementById("subjectName").value = "";
        await loadSubjects();
      } else {
        errorMsg.textContent = "Error al crear la materia.";
        errorMsg.classList.remove("hidden");
      }
      btnAdd.disabled = false;
      btnAdd.textContent = "Guardar";
    });
  },
};
