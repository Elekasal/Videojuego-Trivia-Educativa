// src/pages/StudentHub.js
import { state } from "../state.js";
import { navigateTo } from "../router/index.js";
import { requireTeacherAuth } from "../components/ReAuthModal.js";

export const StudentHub = {
  render: async () => {
    if (!state.patient) {
      return `<div class="p-8 text-center text-white bg-gray-900 min-h-screen">Falta seleccionar perfil. <button id="btnVolverErrorHub" class="underline text-primary">Volver</button></div>`;
    }

    const avatarUrl = state.patient.avatarUrl;
    const firstName = state.patient.name.split(" ")[0];

    return `
       <div class="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
         
         <button id="btnBackToProfiles" class="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2 text-lg font-bold transition-colors">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"></path></svg>
            <span class="hidden md:block">Cambiar Perfil</span>
         </button>
         
         <button id="btnExitHub" class="absolute top-6 right-6 text-gray-500 hover:text-red-400 flex items-center gap-2 text-lg font-bold transition-colors" title="Panel de Control">
            <span class="hidden md:block">Salir</span> 
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
         </button>

         <div class="text-center mb-12 animate-fade-in">
           <div class="w-32 h-32 md:w-48 md:h-48 rounded-full mx-auto mb-6 border-8 border-gray-700 shadow-2xl overflow-hidden bg-white">
             <img src="${avatarUrl}" class="w-full h-full object-cover">
           </div>
           <h1 class="text-5xl md:text-7xl font-black text-white">¡Hola, ${firstName}!</h1>
           <p class="text-2xl text-gray-400 mt-4 font-bold">¿Qué quieres hacer hoy?</p>
         </div>

         <div class="flex flex-col md:flex-row gap-6 w-full max-w-4xl px-4">
           <button id="hub-jugar" class="flex-1 bg-gradient-to-br from-green-400 to-green-600 rounded-[3rem] p-10 shadow-[0_12px_0_0_#16a34a] hover:translate-y-3 hover:shadow-[0_2px_0_0_#16a34a] active:translate-y-4 active:shadow-none transition-all flex flex-col items-center justify-center group border-4 border-green-300">
              <span class="text-8xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform">🎮</span>
              <span class="text-4xl font-black text-white tracking-wide">Jugar</span>
           </button>
           
           <button id="hub-dibujar" class="flex-1 bg-gradient-to-br from-purple-400 to-purple-600 rounded-[3rem] p-10 shadow-[0_12px_0_0_#9333ea] hover:translate-y-3 hover:shadow-[0_2px_0_0_#9333ea] active:translate-y-4 active:shadow-none transition-all flex flex-col items-center justify-center group border-4 border-purple-300">
              <span class="text-8xl mb-4 group-hover:scale-110 group-hover:-rotate-6 transition-transform">🎨</span>
              <span class="text-4xl font-black text-white tracking-wide">Dibujar</span>
           </button>
         </div>
       </div>
     `;
  },

  init: () => {
    document
      .getElementById("btnVolverErrorHub")
      ?.addEventListener("click", () => navigateTo("/profiles"));
    if (!state.patient) return;

    document
      .getElementById("btnBackToProfiles")
      .addEventListener("click", () => {
        state.patient = null;
        navigateTo("/profiles");
      });

    document.getElementById("btnExitHub").addEventListener("click", () => {
      requireTeacherAuth(() => navigateTo("/dashboard"));
    });

    document
      .getElementById("hub-jugar")
      .addEventListener("click", () => navigateTo("/subjects"));
    document
      .getElementById("hub-dibujar")
      .addEventListener("click", () => navigateTo("/recreation"));
  },
};
