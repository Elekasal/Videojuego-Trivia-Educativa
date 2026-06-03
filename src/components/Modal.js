// src/components/Modal.js

export const showModal = (title, message, onConfirm = null) => {
  // 1. Anti-apilamiento: Si ya existe un modal en la pantalla, lo destruimos primero
  const existingModal = document.getElementById("custom-modal");
  if (existingModal) existingModal.remove();

  // 2. Creamos el HTML usando 100% utilidades de Tailwind para forzar el diseño superpuesto
  const modalHtml = `
    <div id="custom-modal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-sm text-center transform transition-all">
        <h3 class="text-2xl font-bold text-primary mb-3">${title}</h3>
        
        <p class="text-gray-700 mb-8 text-lg leading-relaxed">${message}</p>
        
        <button id="btn-modal-confirm" class="w-full bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-600 active:scale-95 transition-all shadow-md">
          Aceptar
        </button>
      </div>
    </div>
  `;

  // 3. Lo inyectamos directamente en el body (por encima de nuestra app)
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // 4. Capturamos los elementos para darle vida al botón
  const modalEl = document.getElementById("custom-modal");
  const btn = document.getElementById("btn-modal-confirm");

  btn.addEventListener("click", () => {
    modalEl.remove(); // Destruye el modal visualmente
    if (onConfirm) onConfirm(); // Ejecuta la función (ej: ir al juego, o ir al dashboard)
  });
};
