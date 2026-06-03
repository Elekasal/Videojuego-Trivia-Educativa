// src/pages/ProfileSelect.js
import { getPatientsList } from "../services/supabase.js";
import { setPatient } from "../state.js";
import { navigateTo } from "../router/index.js";
import { requireTeacherAuth } from "../components/ReAuthModal.js";

export const ProfileSelect = {
  render: async () => {
    return `
      <div class="min-h-screen bg-gray-900 flex flex-col items-center pt-12 pb-24 px-4 relative">
        <button id="btnExitProfiles" class="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors p-2 flex items-center gap-2 font-bold" title="Salir del Modo Alumno">
          <span class="hidden md:block">Panel de Control</span>
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        </button>

        <div class="w-full max-w-6xl flex justify-center items-center mb-16 mt-8">
          <h1 class="text-4xl md:text-6xl font-black text-white text-center tracking-wide">¿Quién eres?</h1>
        </div>

        <div id="profiles-container" class="flex flex-wrap justify-center gap-8 md:gap-16 max-w-5xl">
          <div class="text-white text-xl animate-pulse">Cargando alumnos...</div>
        </div>
      </div>
    `;
  },

  init: async () => {
    document.getElementById("btnExitProfiles").addEventListener("click", () => {
      requireTeacherAuth(() => navigateTo("/dashboard"));
    });

    const container = document.getElementById("profiles-container");
    const result = await getPatientsList();

    if (!result.ok) {
      container.innerHTML = `<div class="text-red-400">Error al cargar perfiles</div>`;
      return;
    }

    if (result.data.length === 0) {
      container.innerHTML = `<div class="text-gray-400 text-center">No hay alumnos. Vuelve al panel para agregarlos.</div>`;
      return;
    }

    container.innerHTML = result.data
      .map((p) => {
        // Usamos la foto real, o un robot lindo (bottts) si no tiene foto subida.
        const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(p.patient_name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;
        const avatarUrl = p.avatar_url || defaultAvatar;
        const firstName = p.patient_name.split(" ")[0];

        return `
         <div class="profile-card flex flex-col items-center cursor-pointer group w-32 md:w-44" data-id="${p.id}" data-name="${p.patient_name}" data-avatar="${avatarUrl}">
            <div class="w-28 h-28 md:w-40 md:h-40 rounded-3xl overflow-hidden border-4 border-gray-700 group-hover:border-white transition-all transform group-hover:scale-110 shadow-2xl bg-white flex items-center justify-center">
              <img src="${avatarUrl}" alt="${p.patient_name}" class="w-full h-full object-cover">
            </div>
            <span class="mt-6 text-gray-500 group-hover:text-white font-black text-2xl md:text-3xl transition-colors text-center w-full truncate">${firstName}</span>
         </div>
       `;
      })
      .join("");

    document.querySelectorAll(".profile-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;
        const name = e.currentTarget.dataset.name;
        const avatarUrl = e.currentTarget.dataset.avatar;
        // Guardamos también la foto en el estado para que el Hub la use
        setPatient({ id, name, avatarUrl });
        navigateTo("/student-hub");
      });
    });
  },
};
