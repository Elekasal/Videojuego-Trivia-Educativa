// src/pages/TeacherManager.js
import { registerTeacher, logout } from "../services/supabase.js";
import { clearSession } from "../state.js";
import { navigateTo } from "../router/index.js";

export const TeacherManager = {
  render: async () => {
    return `
      <div class="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
        
        <div class="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div class="flex items-center gap-4 mb-6">
            <button id="btnVolverTM" class="text-gray-500 hover:text-primary transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>
            <h1 class="text-2xl font-black text-gray-800">Registrar Docente</h1>
          </div>

          <p class="text-gray-500 text-sm mb-6 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
            ⚠️ <strong>Atención Admin:</strong> Al crear una nueva cuenta, tu sesión actual se cerrará automáticamente por seguridad.
          </p>

          <form id="teacherForm" class="space-y-5">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
              <input type="email" id="t-email" required class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" placeholder="docente@escuela.com">
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
              <input type="password" id="t-password" required minlength="6" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Mínimo 6 caracteres">
            </div>

            <div id="t-error" class="hidden text-accent text-sm font-bold"></div>
            
            <button type="submit" id="btnRegisterT" class="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors shadow-md mt-4">
              Crear Cuenta
            </button>
          </form>
        </div>

      </div>
    `;
  },

  init: () => {
    document
      .getElementById("btnVolverTM")
      .addEventListener("click", () => navigateTo("/dashboard"));

    document
      .getElementById("teacherForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("t-email").value.trim();
        const password = document.getElementById("t-password").value.trim();
        const btn = document.getElementById("btnRegisterT");
        const errorMsg = document.getElementById("t-error");

        btn.disabled = true;
        btn.textContent = "Creando...";
        errorMsg.classList.add("hidden");

        const result = await registerTeacher(email, password);

        if (result.ok) {
          // Al registrar un usuario, Supabase inicia sesión automáticamente con el nuevo.
          // Para evitar confusiones, deslogueamos a todos y los mandamos al login.
          alert(
            "¡Docente creado con éxito! Por favor, inicia sesión nuevamente.",
          );
          await logout();
          clearSession();
          navigateTo("/");
        } else {
          errorMsg.textContent =
            "Error: " + (result.error.message || "No se pudo crear la cuenta.");
          errorMsg.classList.remove("hidden");
          btn.disabled = false;
          btn.textContent = "Crear Cuenta";
        }
      });
  },
};
