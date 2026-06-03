import "./styles/style.css";
import { renderRoute } from "./router/index.js";

// Cuando el documento cargue por primera vez, renderizamos la ruta actual
document.addEventListener("DOMContentLoaded", () => {
  renderRoute();
});
