// src/pages/RecreationZone.js
import {
  saveDrawingUrl,
  checkAndAwardAchievement,
} from "../services/supabase.js";
import { uploadImageToCloudinary } from "../services/cloudinary.js";
import { state } from "../state.js";
import { navigateTo } from "../router/index.js";
import { showModal } from "../components/Modal.js";

export const RecreationZone = {
  render: async () => {
    if (!state.patient)
      return `<div class="p-8 text-center">Falta paciente. <button id="btnVolverRZ" class="text-primary underline">Volver</button></div>`;
    return `
      <div class="min-h-screen bg-bg flex flex-col">
        <nav class="bg-white shadow-sm p-4 flex justify-between items-center z-10">
          <div class="flex items-center gap-4">
            <button id="btnVolverPaint" class="text-gray-500 hover:text-primary transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>
            <h1 class="text-xl font-bold text-primary truncate hidden sm:block">Zona Recreativa - ${state.patient.name}</h1>
          </div>
          <button id="btnGuardarDibujo" class="bg-primary text-white text-sm font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
            Guardar Dibujo
          </button>
        </nav>
        <div class="flex-1 flex flex-col p-4 items-center justify-center">
          <div class="w-full max-w-4xl bg-white p-3 rounded-t-2xl shadow-sm border border-gray-200 flex justify-between items-center overflow-x-auto gap-4">
            <div class="flex gap-3">
              <button class="color-btn w-10 h-10 rounded-full bg-black ring-2 ring-offset-2 ring-gray-400" data-color="#000000"></button>
              <button class="color-btn w-10 h-10 rounded-full bg-red-500 hover:scale-110" data-color="#ef4444"></button>
              <button class="color-btn w-10 h-10 rounded-full bg-blue-500 hover:scale-110" data-color="#3b82f6"></button>
              <button class="color-btn w-10 h-10 rounded-full bg-green-500 hover:scale-110" data-color="#22c55e"></button>
              <button class="color-btn w-10 h-10 rounded-full bg-yellow-400 hover:scale-110" data-color="#facc15"></button>
              <button class="color-btn w-10 h-10 rounded-full bg-purple-500 hover:scale-110" data-color="#a855f7"></button>
              <button class="color-btn w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:scale-110" data-color="#ffffff" title="Goma"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
            </div>
            <button id="btnLimpiar" class="text-accent font-bold px-4 py-2 hover:bg-red-50 rounded-lg whitespace-nowrap">Limpiar</button>
          </div>
          <div class="w-full max-w-4xl flex-1 bg-white rounded-b-2xl shadow-md border-x border-b border-gray-200 overflow-hidden relative touch-none" style="min-height: 50vh;">
            <canvas id="paintCanvas" class="w-full h-full cursor-crosshair block"></canvas>
          </div>
        </div>
      </div>
    `;
  },
  init: () => {
    if (!state.patient) {
      document
        .getElementById("btnVolverRZ")
        ?.addEventListener("click", () => navigateTo("/patients"));
      return;
    }
    document
      .getElementById("btnVolverPaint")
      .addEventListener("click", () => navigateTo("/patients"));

    const canvas = document.getElementById("paintCanvas");
    const ctx = canvas.getContext("2d");
    let isDrawing = false,
      currentColor = "#000000";

    const resizeCanvas = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    setTimeout(resizeCanvas, 50);

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.touches ? e.touches[0].clientX : e.clientX) - rect.left,
        y: (e.touches ? e.touches[0].clientY : e.clientY) - rect.top,
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      isDrawing = true;
      const p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    };
    const draw = (e) => {
      e.preventDefault();
      if (!isDrawing) return;
      const p = getPos(e);
      ctx.lineTo(p.x, p.y);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = currentColor === "#ffffff" ? 20 : 5;
      ctx.strokeStyle = currentColor;
      ctx.stroke();
    };
    const stopDraw = () => {
      isDrawing = false;
      ctx.closePath();
    };

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("mouseleave", stopDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDraw);

    const colorBtns = document.querySelectorAll(".color-btn");
    colorBtns.forEach((btn) =>
      btn.addEventListener("click", (e) => {
        colorBtns.forEach((b) =>
          b.classList.remove("ring-2", "ring-offset-2", "ring-gray-400"),
        );
        e.currentTarget.classList.add(
          "ring-2",
          "ring-offset-2",
          "ring-gray-400",
        );
        currentColor = e.currentTarget.dataset.color;
      }),
    );
    document
      .getElementById("btnLimpiar")
      .addEventListener("click", resizeCanvas);

    const btnGuardar = document.getElementById("btnGuardarDibujo");
    btnGuardar.addEventListener("click", async () => {
      btnGuardar.disabled = true;
      btnGuardar.textContent = "Subiendo imagen...";
      const cloudResult = await uploadImageToCloudinary(
        canvas.toDataURL("image/png"),
      );
      if (!cloudResult.ok) {
        showModal("Error", cloudResult.error);
        btnGuardar.disabled = false;
        btnGuardar.textContent = "Guardar Dibujo";
        return;
      }

      btnGuardar.textContent = "Guardando...";
      const dbResult = await saveDrawingUrl(state.patient.id, cloudResult.url);
      if (dbResult.ok) {
        // SISTEMA DE LOGROS
        await checkAndAwardAchievement(state.patient.id, "Pequeño Artista");
        showModal("¡Arte Guardado!", "El dibujo se guardó exitosamente.", () =>
          navigateTo("/patients"),
        );
      } else {
        showModal("Error", "No se pudo guardar el registro.");
        btnGuardar.disabled = false;
        btnGuardar.textContent = "Guardar Dibujo";
      }
    });
  },
};
