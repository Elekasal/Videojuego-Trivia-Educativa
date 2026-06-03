// src/components/ReAuthModal.js
import { login } from "../services/supabase.js";
import { state } from "../state.js";

export const requireTeacherAuth = (onSuccess) => {
  if (!state.user) {
    window.location.href = "/";
    return;
  }

  const modalHtml = `
    <div id="reauth-modal" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-sm text-center relative transform transition-all animate-fade-in">
        <button id="btn-close-reauth" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <div class="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4 text-yellow-500 text-3xl">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        
        <h3 class="text-xl font-bold text-gray-800 mb-2">Seguridad Docente</h3>
        <p class="text-sm text-gray-500 mb-6">Confirma tu contraseña para volver al Panel de Control.</p>
        
        <input type="password" id="reauth-password" class="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-primary text-center font-bold tracking-widest" placeholder="Contraseña">
        
        <p id="reauth-error" class="hidden text-accent text-sm mb-4 font-bold">Contraseña incorrecta.</p>
        
        <button id="btn-confirm-reauth" class="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors shadow-md">
          Verificar Acceso
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);

  const modalEl = document.getElementById("reauth-modal");
  const btnClose = document.getElementById("btn-close-reauth");
  const btnConfirm = document.getElementById("btn-confirm-reauth");
  const inputPwd = document.getElementById("reauth-password");
  const errorMsg = document.getElementById("reauth-error");

  const handleConfirm = async () => {
    const pwd = inputPwd.value;
    if (!pwd) return;

    btnConfirm.disabled = true;
    btnConfirm.textContent = "Verificando...";
    errorMsg.classList.add("hidden");

    // Reutilizamos el login de Supabase para validar la contraseña actual
    const res = await login(state.user.email, pwd);

    if (res.ok) {
      modalEl.remove();
      onSuccess(); // Ejecuta la navegación
    } else {
      errorMsg.classList.remove("hidden");
      btnConfirm.disabled = false;
      btnConfirm.textContent = "Verificar Acceso";
      inputPwd.value = "";
      inputPwd.focus();
    }
  };

  btnConfirm.addEventListener("click", handleConfirm);
  inputPwd.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleConfirm();
  });

  btnClose.addEventListener("click", () => {
    modalEl.remove();
  });

  inputPwd.focus();
};
