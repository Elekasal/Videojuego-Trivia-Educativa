// src/pages/Patients.js
import {
  getPatientsList,
  createPatient,
  updatePatientAvatar,
} from "../services/supabase.js";
import { uploadImageToCloudinary } from "../services/cloudinary.js";
import { setPatient, state } from "../state.js";
import { navigateTo } from "../router/index.js";
import { requireTeacherAuth } from "../components/ReAuthModal.js";

export const Patients = {
  render: async () => {
    return `
      <div class="min-h-screen bg-bg">
        <nav class="bg-white shadow-sm p-4 flex justify-between items-center">
          <div class="flex items-center gap-4">
            <button id="btnVolver" class="text-gray-500 hover:text-primary transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>
            <h1 class="text-xl font-bold text-primary">Gestión de Pacientes</h1>
          </div>
        </nav>

        <div class="p-8 max-w-5xl mx-auto">
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <h2 class="text-lg font-bold text-gray-800 mb-4">Agregar Nuevo Alumno</h2>
            <form id="addPatientForm" class="flex flex-col sm:flex-row gap-4">
              <input type="text" id="patientName" required placeholder="Nombre completo del alumno" 
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
              <button type="submit" id="btnAdd" class="bg-primary text-white font-semibold py-2 px-8 rounded-lg hover:bg-blue-600 transition-colors">
                Guardar
              </button>
            </form>
            <div id="patientError" class="hidden text-accent text-sm mt-2"></div>
          </div>

          <h2 class="text-lg font-bold text-gray-800 mb-4">Lista de Alumnos</h2>
          <div id="patientsList" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="text-gray-500 text-sm">Cargando alumnos...</div>
          </div>
        </div>
      </div>
    `;
  },

  init: async () => {
    document.getElementById("btnVolver").addEventListener("click", () => {
      requireTeacherAuth(() => navigateTo("/dashboard"));
    });

    const loadPatients = async () => {
      const listContainer = document.getElementById("patientsList");
      const result = await getPatientsList();

      if (!result.ok) {
        listContainer.innerHTML = `<div class="text-accent">Error al cargar la lista.</div>`;
        return;
      }

      const patients = result.data;
      if (patients.length === 0) {
        listContainer.innerHTML = `<div class="text-gray-500 col-span-full">Aún no hay alumnos registrados.</div>`;
        return;
      }

      listContainer.innerHTML = patients
        .map((p) => {
          // Fallback: robots felices (bottts) en lugar de caritas tristes
          const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(p.patient_name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;
          const avatarToUse = p.avatar_url || defaultAvatar;

          return `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-center gap-4">
          
          <div class="flex items-center gap-4 w-full xl:w-auto">
            <img src="${avatarToUse}" class="w-14 h-14 rounded-full border-2 border-gray-200 object-cover shadow-sm bg-gray-50">
            <div class="text-left">
              <h3 class="font-bold text-gray-800 text-lg">${p.patient_name}</h3>
              <p class="text-xs text-gray-400">Registrado el: ${new Date(p.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div class="flex flex-wrap justify-center gap-2 w-full xl:w-auto">
            <input type="file" id="file-${p.id}" class="hidden" accept="image/*">
            <button data-id="${p.id}" class="btn-photo bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              📷 Foto
            </button>
            <button data-id="${p.id}" data-name="${p.patient_name}" class="btn-history bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              📋 Historial
            </button>
            <button data-id="${p.id}" data-name="${p.patient_name}" class="btn-paint bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              🎨 Dibujar
            </button>
            <button data-id="${p.id}" data-name="${p.patient_name}" class="btn-select-patient bg-secondary/10 text-secondary hover:bg-secondary hover:text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              ▶ Jugar
            </button>
          </div>

        </div>
      `;
        })
        .join("");

      // Lógica de navegación
      document.querySelectorAll(".btn-history").forEach((btn) =>
        btn.addEventListener("click", (e) => {
          setPatient({
            id: e.currentTarget.dataset.id,
            name: e.currentTarget.dataset.name,
          });
          navigateTo("/history");
        }),
      );

      document.querySelectorAll(".btn-select-patient").forEach((btn) =>
        btn.addEventListener("click", (e) => {
          setPatient({
            id: e.currentTarget.dataset.id,
            name: e.currentTarget.dataset.name,
          });
          navigateTo("/subjects");
        }),
      );

      document.querySelectorAll(".btn-paint").forEach((btn) =>
        btn.addEventListener("click", (e) => {
          setPatient({
            id: e.currentTarget.dataset.id,
            name: e.currentTarget.dataset.name,
          });
          navigateTo("/recreation");
        }),
      );

      // --- LÓGICA PARA SUBIR FOTO ---
      document.querySelectorAll(".btn-photo").forEach((btn) =>
        btn.addEventListener("click", (e) => {
          document.getElementById(`file-${e.currentTarget.dataset.id}`).click();
        }),
      );

      patients.forEach((p) => {
        const fileInput = document.getElementById(`file-${p.id}`);
        if (fileInput) {
          fileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const btn = document.querySelector(`.btn-photo[data-id="${p.id}"]`);
            const originalText = btn.innerHTML;
            btn.innerHTML = "⏳...";
            btn.disabled = true;

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
              const cloudRes = await uploadImageToCloudinary(reader.result);
              if (cloudRes.ok) {
                await updatePatientAvatar(p.id, cloudRes.url);
                loadPatients(); // Recargamos para ver la foto nueva
              } else {
                alert("Error al subir foto: " + cloudRes.error);
                btn.innerHTML = originalText;
                btn.disabled = false;
              }
            };
          });
        }
      });
    };

    await loadPatients();

    // Formulario crear nuevo
    const form = document.getElementById("addPatientForm");
    const errorMsg = document.getElementById("patientError");
    const btnAdd = document.getElementById("btnAdd");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("patientName").value.trim();
      errorMsg.classList.add("hidden");
      btnAdd.disabled = true;
      btnAdd.textContent = "Guardando...";

      const result = await createPatient(name);
      if (result.ok) {
        document.getElementById("patientName").value = "";
        await loadPatients();
      } else {
        errorMsg.textContent = "Error al guardar el alumno.";
        errorMsg.classList.remove("hidden");
      }
      btnAdd.disabled = false;
      btnAdd.textContent = "Guardar";
    });
  },
};
