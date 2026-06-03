// src/router/index.js
import { Login } from "../pages/Login.js";
import { Dashboard } from "../pages/Dashboard.js";
import { getSession } from "../services/supabase.js";
import { setUser } from "../state.js";
import { Patients } from "../pages/Patients.js";
import { SubjectSelect } from "../pages/SubjectSelect.js";
import { Game } from "../pages/Game.js";
import { QuestionManager } from "../pages/QuestionManager.js";
import { QuestionForm } from "../pages/QuestionForm.js";
import { RecreationZone } from "../pages/RecreationZone.js";
import { Results } from "../pages/Results.js";
import { PatientHistory } from "../pages/PatientHistory.js";
import { ProfileSelect } from "../pages/ProfileSelect.js";
import { StudentHub } from "../pages/StudentHub.js";
import { SubjectManager } from "../pages/SubjectManager.js";
import { TeacherManager } from "../pages/TeacherManager.js"; // <- Nuevo

const routes = {
  "/": Login,
  "/dashboard": Dashboard,
  "/patients": Patients,
  "/subjects": SubjectSelect,
  "/game": Game,
  "/questions": QuestionManager,
  "/question-form": QuestionForm,
  "/recreation": RecreationZone,
  "/results": Results,
  "/history": PatientHistory,
  "/profiles": ProfileSelect,
  "/student-hub": StudentHub,
  "/subject-manager": SubjectManager,
  "/teacher-manager": TeacherManager, // <- Nueva ruta
};

export const navigateTo = (pathname) => {
  window.history.pushState({}, pathname, window.location.origin + pathname);
  renderRoute();
};

export const renderRoute = async () => {
  const app = document.getElementById("app");
  const path = window.location.pathname;

  const session = await getSession();
  if (session) {
    setUser(session.user);
  }

  let targetPath = path;

  if (!session && path !== "/") {
    targetPath = "/";
    window.history.replaceState({}, "/", window.location.origin + "/");
  } else if (session && path === "/") {
    targetPath = "/dashboard";
    window.history.replaceState(
      {},
      "/dashboard",
      window.location.origin + "/dashboard",
    );
  }

  const route = routes[targetPath] || routes["/"];

  app.innerHTML = await route.render();
  if (route.init) {
    route.init();
  }
};

window.addEventListener("popstate", renderRoute);
