// src/pages/Login.js
import { login, getSession } from "../services/supabase.js";
import { setUser } from "../state.js";
import { navigateTo } from "../router/index.js";

export const Login = {
  render: async () => {
    return `
      <div class="min-h-screen flex flex-col items-center justify-center bg-bg px-4">
        <div class="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <div class="text-center mb-6">
            <h2 class="text-3xl font-bold text-primary mb-2">Trivia Educativa</h2>
            <p class="text-gray-500">Acceso Exclusivo Docentes</p>
          </div>
          
          <form id="loginForm" class="space-y-4">
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
              <input type="email" id="email" required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="docente@escuela.com">
            </div>
            
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2" for="password">Contraseña</label>
              <input type="password" id="password" required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="********">
            </div>

            <div id="errorMessage" class="hidden text-accent text-sm text-center font-semibold"></div>

            <button type="submit" id="btnSubmit" class="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-colors flex justify-center items-center">
              <span>Ingresar</span>
            </button>
          </form>
        </div>
      </div>
    `;
  },

  init: async () => {
    // 1. Verificar si ya hay una sesión activa al cargar la página
    const session = await getSession();
    if (session) {
      setUser(session.user);
      navigateTo("/dashboard");
      return; // Detenemos la ejecución si ya está logueado
    }

    // 2. Manejar el formulario de login
    const form = document.getElementById("loginForm");
    const errorMsg = document.getElementById("errorMessage");
    const btnSubmit = document.getElementById("btnSubmit");

    form.addEventListener("submit", async (e) => {
      e.preventDefault(); // Evita que la página se recargue

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      // Estado de carga visual
      errorMsg.classList.add("hidden");
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<span class="opacity-75">Ingresando...</span>`;

      // Llamada a tu servicio de Supabase
      const result = await login(email, password);

      if (result.ok) {
        setUser(result.data); // Guardamos el usuario en nuestro estado
        navigateTo("/dashboard"); // Vamos al panel
      } else {
        // Mostramos el error si falla
        errorMsg.textContent =
          result.error.message ||
          "Error al iniciar sesión. Verifica tus credenciales.";
        errorMsg.classList.remove("hidden");
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span>Ingresar</span>`;
      }
    });
  },
};
