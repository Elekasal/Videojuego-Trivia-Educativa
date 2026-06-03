// src/pages/Dashboard.js
import {
  logout,
  getTeacherMetrics,
  getPatientsList,
  supabase,
  getSession,
} from "../services/supabase.js";
import { clearSession, state } from "../state.js";
import { navigateTo } from "../router/index.js";

export const Dashboard = {
  render: async () => {
    const emailStr = state.user ? state.user.email : "Docente";

    // DEFINIMOS EL CORREO DEL SUPER ADMIN AQUÍ:
    const SUPER_ADMIN_EMAIL = "admin@trivia.com";
    const isSuperAdmin = emailStr === SUPER_ADMIN_EMAIL;

    return `
      <div class="min-h-screen bg-bg pb-12">
        <nav class="bg-white shadow-sm p-4 flex justify-between items-center mb-8">
          <h1 class="text-xl font-bold text-primary">Trivia Educativa</h1>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600 hidden md:block">
              ${emailStr} ${isSuperAdmin ? '<span class="ml-2 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md font-bold text-xs">👑 ADMIN</span>' : ""}
            </span>
            <button id="btnSalir" class="bg-accent text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
              Cerrar Sesión
            </button>
          </div>
        </nav>

        <div class="px-4 max-w-7xl mx-auto">
          
          <div id="btnModoAlumno" class="mb-8 w-full bg-gradient-to-r from-primary to-blue-500 rounded-2xl p-6 md:p-8 shadow-lg border border-blue-400 flex flex-col md:flex-row items-center justify-between cursor-pointer transform hover:scale-[1.01] transition-transform group">
            <div class="text-white text-center md:text-left mb-6 md:mb-0">
              <h2 class="text-3xl md:text-4xl font-black mb-2 flex items-center justify-center md:justify-start gap-3">
                <span class="text-4xl md:text-5xl group-hover:animate-bounce">🚀</span> Modo Alumno
              </h2>
              <p class="text-blue-100 text-lg font-semibold">Inicia la experiencia interactiva, segura y visual para los chicos.</p>
            </div>
            <button class="bg-white text-primary font-black py-4 px-8 rounded-xl shadow-md hover:bg-gray-50 transition-colors text-xl w-full md:w-auto">
              Iniciar Tablet
            </button>
          </div>

          <h2 class="text-2xl font-bold text-secondary mb-6">Panel de Administración</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div class="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl shadow-inner">👦</div>
              <div>
                <p class="text-sm text-gray-500 font-bold uppercase tracking-wide">Total Alumnos</p>
                <p class="text-3xl font-black text-gray-800" id="dash-total-students">-</p>
              </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div class="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl shadow-inner">🎮</div>
              <div>
                <p class="text-sm text-gray-500 font-bold uppercase tracking-wide">Partidas Jugadas</p>
                <p class="text-3xl font-black text-gray-800" id="dash-total-games">-</p>
              </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div class="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-3xl shadow-inner">⭐</div>
              <div>
                <p class="text-sm text-gray-500 font-bold uppercase tracking-wide">Efectividad Global</p>
                <p class="text-3xl font-black text-gray-800" id="dash-effectiveness">-</p>
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 flex flex-col gap-8">
              
              <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Accesos Rápidos</h3>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button id="btnVerPacientes" class="bg-primary/10 text-primary font-bold py-3 rounded-lg hover:bg-primary hover:text-white transition-colors flex flex-col items-center gap-2">
                    <span class="text-2xl">📋</span> Alumnos
                  </button>
                  <button id="btnGestorM" class="bg-green-100 text-green-700 font-bold py-3 rounded-lg hover:bg-green-600 hover:text-white transition-colors flex flex-col items-center gap-2">
                    <span class="text-2xl">📚</span> Materias
                  </button>
                  <button id="btnGestorQ" class="bg-accent/10 text-accent font-bold py-3 rounded-lg hover:bg-accent hover:text-white transition-colors flex flex-col items-center gap-2">
                    <span class="text-2xl">❓</span> Preguntas
                  </button>
                </div>
              </div>

              ${
                isSuperAdmin
                  ? `
              <div class="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-sm border border-yellow-200">
                <h3 class="text-lg font-bold text-yellow-800 mb-2 flex items-center gap-2">
                  <span>👑</span> Gestión de Docentes (Super Admin)
                </h3>
                <p class="text-yellow-700 text-sm mb-4">Como administrador principal, puedes dar de alta a nuevos profesionales en el sistema.</p>
                <button id="btnAdminPanel" class="w-full bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm">
                  Registrar Nuevo Docente
                </button>
              </div>
              `
                  : ""
              }

              <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1">
                <div class="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 class="text-lg font-bold text-gray-800">Últimos Alumnos Registrados</h3>
                  <button id="btnVerTodos" class="text-sm font-bold text-primary hover:underline">Ver todos &rarr;</button>
                </div>
                <div id="latest-students" class="flex flex-col gap-3">
                  <span class="text-gray-400 text-sm animate-pulse">Cargando alumnos...</span>
                </div>
              </div>

            </div>

            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-between h-full">
              <div class="w-full">
                <h3 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2 w-full text-left">Rendimiento Gráfico</h3>
                <div id="chart-container" class="w-full relative flex justify-center items-center mb-6" style="min-height: 240px;">
                  <span id="chart-loading" class="text-gray-400 text-sm animate-pulse">Cargando métricas...</span>
                  <canvas id="metricsChart" class="hidden"></canvas>
                </div>
              </div>
              
              <div class="w-full mt-4">
                <p class="text-xs text-gray-500 text-center mb-3">Descarga una copia completa de todas las partidas jugadas en formato Excel (CSV).</p>
                <button id="btnExportGlobal" class="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 active:scale-95 transition-all shadow-md flex justify-center items-center gap-2">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Descargar Reporte Global
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  },

  init: () => {
    document.getElementById("btnSalir").addEventListener("click", async () => {
      await logout();
      clearSession();
      navigateTo("/");
    });

    document
      .getElementById("btnModoAlumno")
      .addEventListener("click", () => navigateTo("/profiles"));
    document
      .getElementById("btnVerPacientes")
      .addEventListener("click", () => navigateTo("/patients"));
    document
      .getElementById("btnVerTodos")
      .addEventListener("click", () => navigateTo("/patients"));
    document
      .getElementById("btnGestorM")
      .addEventListener("click", () => navigateTo("/subject-manager"));
    document
      .getElementById("btnGestorQ")
      .addEventListener("click", () => navigateTo("/questions"));

    const btnAdminPanel = document.getElementById("btnAdminPanel");
    if (btnAdminPanel) {
      btnAdminPanel.addEventListener("click", () =>
        navigateTo("/teacher-manager"),
      );
    }

    const loadDashboardData = async () => {
      const [metricsRes, patientsRes] = await Promise.all([
        getTeacherMetrics(),
        getPatientsList(),
      ]);

      if (patientsRes.ok) {
        const patients = patientsRes.data;
        document.getElementById("dash-total-students").textContent =
          patients.length;

        const latestContainer = document.getElementById("latest-students");
        if (patients.length === 0) {
          latestContainer.innerHTML =
            '<span class="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg block text-center">Aún no hay alumnos registrados.</span>';
        } else {
          const latest = patients.slice(0, 4);
          latestContainer.innerHTML = latest
            .map((p) => {
              const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(p.patient_name)}&backgroundColor=b6e3f4`;
              const avatarUrl = p.avatar_url || defaultAvatar;
              return `
              <div class="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 transition-colors rounded-xl border border-gray-100 cursor-pointer" onclick="document.getElementById('btnVerPacientes').click()">
                <div class="flex items-center gap-3">
                  <img src="${avatarUrl}" class="w-10 h-10 rounded-full border border-gray-200 object-cover bg-white shadow-sm">
                  <span class="font-bold text-gray-700">${p.patient_name}</span>
                </div>
                <span class="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">${new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            `;
            })
            .join("");
        }
      }

      const loadingEl = document.getElementById("chart-loading");
      const canvasEl = document.getElementById("metricsChart");

      if (!metricsRes.ok) {
        loadingEl.textContent = "Error al cargar";
        loadingEl.classList.remove("animate-pulse");
        loadingEl.classList.add("text-accent");
        return;
      }

      const { totalCorrect, totalIncorrect, totalAttempts } = metricsRes.data;
      loadingEl.classList.add("hidden");

      document.getElementById("dash-total-games").textContent = totalAttempts;
      const totalAnswers = totalCorrect + totalIncorrect;
      const efectividad =
        totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
      document.getElementById("dash-effectiveness").textContent =
        `${efectividad}%`;

      if (totalAttempts === 0) {
        loadingEl.textContent = "Gráfico no disponible";
        loadingEl.classList.remove("hidden", "animate-pulse");
        return;
      }

      canvasEl.classList.remove("hidden");
      new window.Chart(canvasEl, {
        type: "doughnut",
        data: {
          labels: ["Correctas", "Incorrectas"],
          datasets: [
            {
              data: [totalCorrect, totalIncorrect],
              backgroundColor: ["#22c55e", "#ef4444"],
              borderWidth: 0,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                font: { family: "Nunito", weight: "bold" },
                padding: 20,
              },
            },
          },
          cutout: "70%",
        },
      });
    };

    if (!window.Chart) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      script.onload = () => loadDashboardData();
      document.head.appendChild(script);
    } else {
      loadDashboardData();
    }

    document
      .getElementById("btnExportGlobal")
      .addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Generando...";
        btn.disabled = true;
        const session = await getSession();
        if (!session) return;
        const { data, error } = await supabase
          .from("intentos")
          .select(
            `fecha_creacion, nombre_materia, ciclo, respuestas_correctas, respuestas_incorrectas, puntaje_total, pacientes (nombre)`,
          )
          .eq("creado_por", session.user.id)
          .order("fecha_creacion", { ascending: false });
        btn.innerHTML = originalText;
        btn.disabled = false;
        if (error || !data || data.length === 0) {
          alert("Aún no hay partidas.");
          return;
        }
        let csvContent =
          "Fecha,Alumno,Materia,Ciclo,Respuestas Correctas,Respuestas Incorrectas,Puntaje Total\n";
        data.forEach((row) => {
          const fecha = new Date(row.fecha_creacion).toLocaleDateString();
          const alumno = row.pacientes ? row.pacientes.nombre : "Desconocido";
          csvContent += `${fecha},${alumno},${row.nombre_materia},${row.ciclo},${row.respuestas_correctas},${row.respuestas_incorrectas},${row.puntaje_total}\n`;
        });
        const blob = new Blob(["\uFEFF" + csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `Reporte_Global_${new Date().toLocaleDateString().replace(/\//g, "-")}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  },
};
