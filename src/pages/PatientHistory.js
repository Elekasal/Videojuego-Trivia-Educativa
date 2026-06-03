// src/pages/PatientHistory.js
import {
  getPatientHistory,
  getPatientDrawings,
  getPatientAchievements,
} from "../services/supabase.js";
import { state } from "../state.js";
import { navigateTo } from "../router/index.js";

export const PatientHistory = {
  render: async () => {
    if (!state.patient)
      return `<div class="p-8 text-center">Falta seleccionar paciente. <button id="btnVolverError" class="text-primary underline">Volver</button></div>`;

    return `
      <div class="min-h-screen bg-bg pb-12">
        <nav class="bg-white shadow-sm p-4 flex items-center gap-4 mb-8">
          <button id="btnVolverHistory" class="text-gray-500 hover:text-primary transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <h1 class="text-xl font-bold text-primary">Historial del Alumno</h1>
        </nav>

        <div class="max-w-5xl mx-auto px-4">
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 class="text-3xl font-bold text-gray-800">${state.patient.name}</h2>
              <p class="text-gray-500">Revisá las partidas, dibujos y logros obtenidos.</p>
            </div>
            <div class="flex gap-2 w-full md:w-auto">
              <button id="btnExportarExcel" class="bg-green-600 text-white font-bold py-2 px-6 rounded-lg shadow-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 flex-1 md:flex-none">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Exportar Excel
              </button>
              <button id="btnJugarDesdeHistorial" class="bg-secondary text-white font-bold py-2 px-6 rounded-lg shadow-sm hover:bg-yellow-500 transition-colors flex-1 md:flex-none">
                ▶ Jugar Partida
              </button>
            </div>
          </div>

          <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span class="text-2xl">🏆</span> Medallas y Logros
          </h3>
          <div id="achievements-container" class="flex flex-wrap gap-4 mb-8">
            <span class="text-sm text-gray-500">Cargando medallas...</span>
          </div>

          <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span class="text-2xl">🎮</span> Partidas Jugadas
          </h3>
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-12">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <th class="p-4 text-sm font-bold text-gray-700">Fecha</th>
                    <th class="p-4 text-sm font-bold text-gray-700">Materia</th>
                    <th class="p-4 text-sm font-bold text-gray-700">Ciclo</th>
                    <th class="p-4 text-sm font-bold text-gray-700 text-center">Correctas</th>
                    <th class="p-4 text-sm font-bold text-gray-700 text-center">Incorrectas</th>
                  </tr>
                </thead>
                <tbody id="history-tbody" class="divide-y divide-gray-100">
                  <tr><td colspan="5" class="p-4 text-center text-gray-500">Cargando historial...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span class="text-2xl">🎨</span> Galería de Dibujos
          </h3>
          <div id="drawings-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="col-span-full text-center text-gray-500 py-8">Cargando dibujos...</div>
          </div>
        </div>
      </div>
    `;
  },

  init: async () => {
    if (!state.patient) {
      document
        .getElementById("btnVolverError")
        ?.addEventListener("click", () => navigateTo("/patients"));
      return;
    }
    document
      .getElementById("btnVolverHistory")
      .addEventListener("click", () => navigateTo("/patients"));
    document
      .getElementById("btnJugarDesdeHistorial")
      .addEventListener("click", () => navigateTo("/subjects"));

    let globalAttemptsData = []; // Guardamos los datos acá para el Excel

    // 1. Cargar Logros
    const loadAchievements = async () => {
      const container = document.getElementById("achievements-container");
      const result = await getPatientAchievements(state.patient.id);

      if (!result.ok) {
        container.innerHTML = `<span class="text-accent text-sm">Error cargando logros.</span>`;
        return;
      }
      if (result.data.length === 0) {
        container.innerHTML = `<span class="text-gray-500 text-sm bg-gray-100 px-4 py-2 rounded-lg">Aún no tiene medallas.</span>`;
        return;
      }

      container.innerHTML = result.data
        .map(
          (ach) => `
        <div class="flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-white border border-yellow-200 py-2 px-4 rounded-xl shadow-sm hover:scale-105 transition-transform" title="${ach.logros.descripcion}">
          <span class="text-3xl">${ach.logros.imagen_url}</span>
          <div>
            <p class="font-bold text-yellow-800 text-sm">${ach.logros.nombre}</p>
            <p class="text-[10px] text-gray-500 uppercase font-bold">${new Date(ach.fecha_obtencion).toLocaleDateString()}</p>
          </div>
        </div>
      `,
        )
        .join("");
    };

    // 2. Cargar Partidas
    const loadAttempts = async () => {
      const tbody = document.getElementById("history-tbody");
      const result = await getPatientHistory(state.patient.id);
      if (!result.ok) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-accent">Error al cargar historial.</td></tr>`;
        return;
      }

      globalAttemptsData = result.data; // Guardamos para exportar

      if (result.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">Aún no ha jugado.</td></tr>`;
        return;
      }

      tbody.innerHTML = result.data
        .map(
          (h) => `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="p-4 text-sm text-gray-600">${new Date(h.fecha_creacion).toLocaleDateString()}</td>
          <td class="p-4 text-sm text-gray-800 font-bold">${h.nombre_materia}</td>
          <td class="p-4 text-sm text-gray-600">${h.ciclo}</td>
          <td class="p-4 text-center text-sm font-bold text-green-600">${h.respuestas_correctas}</td>
          <td class="p-4 text-center text-sm font-bold text-red-500">${h.respuestas_incorrectas}</td>
        </tr>
      `,
        )
        .join("");
    };

    // 3. Cargar Dibujos
    const loadDrawings = async () => {
      const grid = document.getElementById("drawings-grid");
      const result = await getPatientDrawings(state.patient.id);
      if (!result.ok) {
        grid.innerHTML = `<div class="col-span-full text-center text-accent">Error al cargar dibujos.</div>`;
        return;
      }
      if (result.data.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-gray-500 py-8 bg-white rounded-xl border border-gray-100">Aún no hay dibujos guardados.</div>`;
        return;
      }

      grid.innerHTML = result.data
        .map(
          (d) => `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transform hover:-translate-y-1 transition-transform">
          <div class="h-48 bg-gray-100 relative">
            <img src="${d.imagen_b64}" alt="Dibujo del alumno" class="w-full h-full object-contain absolute inset-0" loading="lazy">
          </div>
          <div class="p-3 border-t border-gray-100 text-xs text-gray-500 text-center bg-gray-50">
            Guardado el: ${new Date(d.fecha_creacion).toLocaleDateString()}
          </div>
        </div>
      `,
        )
        .join("");
    };

    // 4. Lógica Exportar Excel
    document
      .getElementById("btnExportarExcel")
      .addEventListener("click", () => {
        if (globalAttemptsData.length === 0) {
          alert("El alumno no tiene partidas jugadas para exportar.");
          return;
        }

        let csvContent =
          "Fecha,Materia,Ciclo,Respuestas Correctas,Respuestas Incorrectas,Puntaje Total\n";
        globalAttemptsData.forEach((row) => {
          const fecha = new Date(row.fecha_creacion).toLocaleDateString();
          csvContent += `${fecha},${row.nombre_materia},${row.ciclo},${row.respuestas_correctas},${row.respuestas_incorrectas},${row.puntaje_total}\n`;
        });

        // El prefijo \uFEFF ayuda a que Excel reconozca correctamente los acentos
        const blob = new Blob(["\uFEFF" + csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `Reporte_${state.patient.name.replace(/\s+/g, "_")}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });

    await Promise.all([loadAchievements(), loadAttempts(), loadDrawings()]);
  },
};
