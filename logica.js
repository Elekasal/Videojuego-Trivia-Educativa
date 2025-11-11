/* ==========================================================
  LÓGICA PRINCIPAL V4
  - Mantiene flujo de trabajo
  - Arregla Lotties (no se duplican)
  - Guarda/actualiza puntajes en Supabase (upsert)
  - Elimina puntajes en Supabase (delete)
  - preguntas y respuestas en orden aleatorio
  - feedback visual verde/rojo en opciones
========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // ------------------ Estado ------------------
  const estado = {
    usuarioActual: null,
    pantallaActual: 'login-screen',
    pacienteActual: null,
    materiaActual: null,
    materias: ['Lengua', 'Matemática', 'Ciencias Naturales'],
    indiceMateria: 0,
    indicePregunta: 0,
    ciclo: null,
    puntajes: { 'Lengua': 0, 'Matemática': 0, 'Ciencias Naturales': 0 },
    // cache por materia (para no remezclar en cada render)
    cachePreguntas: {} // { [materia]: [ {question, answers:[...]} ] }
  };

  // ------------------ Banco de preguntas  ------------------
  const bancoPreguntas = {
    'Lengua': {
      primerCiclo: [
        { question: "¿Qué palabra rima con sol?", answers: [{ text: "Farol", correct: true }, { text: "Casa", correct: false }, { text: "Árbol", correct: false }, { text: "Mesa", correct: false }] },
        { question: "¿Con qué letra comienza la palabra zapato?", answers: [{ text: "Z", correct: true }, { text: "S", correct: false }, { text: "C", correct: false }, { text: "X", correct: false }] },
        { question: "¿Cuál es un nombre de cosa?", answers: [{ text: "Lápiz", correct: true }, { text: "Correr", correct: false }, { text: "Feliz", correct: false }, { text: "Rápido", correct: false }] },
        { question: "¿Con qué signo termina una oración interrogativa?", answers: [{ text: "?", correct: true }, { text: ".", correct: false }, { text: "!", correct: false }, { text: ",", correct: false }] },
        { question: "¿Cuál es una oración completa?", answers: [{ text: "El niño juega con la pelota", correct: true }, { text: "Casa grande", correct: false }, { text: "Muy feliz", correct: false }, { text: "Corriendo rápido", correct: false }] }
      ],
      segundoCiclo: [
        { question: "¿Qué tipo de texto narra una historia con personajes?", answers: [{ text: "Narrativo", correct: true }, { text: "Informativo", correct: false }, { text: "Instructivo", correct: false }, { text: "Poético", correct: false }] },
        { question: "¿Cuál de estas palabras está mal escrita?", answers: [{ text: "Acer", correct: true }, { text: "Hacer", correct: false }, { text: "Casa", correct: false }, { text: "Perro", correct: false }] },
        { question: "¿Para qué sirve el punto y seguido?", answers: [{ text: "Para separar oraciones en un mismo párrafo", correct: true }, { text: "Para terminar un párrafo", correct: false }, { text: "Para hacer una pregunta", correct: false }, { text: "Para indicar sorpresa", correct: false }] },
        { question: "¿Qué es un protagonista?", answers: [{ text: "El personaje principal de una historia", correct: true }, { text: "Un tipo de verbo", correct: false }, { text: "Un signo de puntuación", correct: false }, { text: "Una figura literaria", correct: false }] },
        { question: "¿Cuál es un adjetivo en la oración 'El perro grande ladra'?", answers: [{ text: "Grande", correct: true }, { text: "El", correct: false }, { text: "Perro", correct: false }, { text: "Ladra", correct: false }] }
      ]
    },
    'Matemática': {
      primerCiclo: [
        { question: "¿Cuánto es 7 + 5?", answers: [{ text: "12", correct: true }, { text: "11", correct: false }, { text: "13", correct: false }, { text: "10", correct: false }] },
        { question: "¿Cuál es el mayor número?", answers: [{ text: "27", correct: true }, { text: "18", correct: false }, { text: "21", correct: false }, { text: "16", correct: false }] },
        { question: "¿Qué día viene después del martes?", answers: [{ text: "Miércoles", correct: true }, { text: "Jueves", correct: false }, { text: "Lunes", correct: false }, { text: "Domingo", correct: false }] },
        { question: "¿Cuántos lados tiene un cuadrado?", answers: [{ text: "4", correct: true }, { text: "3", correct: false }, { text: "5", correct: false }, { text: "6", correct: false }] },
        { question: "¿Qué objeto tiene forma de círculo?", answers: [{ text: "Pelota", correct: true }, { text: "Libro", correct: false }, { text: "Cuaderno", correct: false }, { text: "Puerta", correct: false }] }
      ],
      segundoCiclo: [
        { question: "¿Cuánto es 45 ÷ 5?", answers: [{ text: "9", correct: true }, { text: "8", correct: false }, { text: "7", correct: false }, { text: "10", correct: false }] },
        { question: "¿Cuál es la mitad de 60?", answers: [{ text: "30", correct: true }, { text: "25", correct: false }, { text: "35", correct: false }, { text: "40", correct: false }] },
        { question: "¿Cuánto es 7 × 8?", answers: [{ text: "56", correct: true }, { text: "54", correct: false }, { text: "48", correct: false }, { text: "64", correct: false }] },
        { question: "¿Cuál de estos números es par?", answers: [{ text: "14", correct: true }, { text: "21", correct: false }, { text: "35", correct: false }, { text: "49", correct: false }] },
        { question: "¿Qué instrumento se usa para medir ángulos?", answers: [{ text: "Transportador", correct: true }, { text: "Regla", correct: false }, { text: "Compás", correct: false }, { text: "Calculadora", correct: false }] }
      ]
    },
    'Ciencias Naturales': {
      primerCiclo: [
        { question: "¿Con qué vemos?", answers: [{ text: "Con los ojos", correct: true }, { text: "Con las manos", correct: false }, { text: "Con los pies", correct: false }, { text: "Con la nariz", correct: false }] },
        { question: "¿Qué necesitan las plantas para crecer?", answers: [{ text: "Agua y sol", correct: true }, { text: "Chocolate", correct: false }, { text: "Leche", correct: false }, { text: "Juguetes", correct: false }] },
        { question: "¿De dónde sale el pollito?", answers: [{ text: "Del huevo", correct: true }, { text: "De la piedra", correct: false }, { text: "De la tierra", correct: false }, { text: "De la lluvia", correct: false }] },
        { question: "¿Qué parte del cuerpo late?", answers: [{ text: "El corazón", correct: true }, { text: "La oreja", correct: false }, { text: "El hombro", correct: false }, { text: "El estómago", correct: false }] },
        { question: "¿Qué se respira para vivir?", answers: [{ text: "Aire", correct: true }, { text: "Jugo", correct: false }, { text: "Agua", correct: false }, { text: "Tierra", correct: false }] }
      ],
      segundoCiclo: [
        { question: "¿Qué es un ecosistema?", answers: [{ text: "Conjunto de seres vivos y su ambiente", correct: true }, { text: "Sólo animales", correct: false }, { text: "Sólo plantas", correct: false }, { text: "Sólo rocas", correct: false }] },
        { question: "¿Qué estrella está más cerca de la Tierra?", answers: [{ text: "El Sol", correct: true }, { text: "Sirio", correct: false }, { text: "Betelgeuse", correct: false }, { text: "Antares", correct: false }] },
        { question: "Los pulmones forman parte del sistema…", answers: [{ text: "Respiratorio", correct: true }, { text: "Digestivo", correct: false }, { text: "Circulatorio", correct: false }, { text: "Nervioso", correct: false }] },
        { question: "¿Qué gas es fundamental para la fotosíntesis?", answers: [{ text: "Dióxido de carbono", correct: true }, { text: "Nitrógeno", correct: false }, { text: "Ozono", correct: false }, { text: "Helio", correct: false }] },
        { question: "¿Qué órgano bombea la sangre?", answers: [{ text: "Corazón", correct: true }, { text: "Riñón", correct: false }, { text: "Hígado", correct: false }, { text: "Estómago", correct: false }] }
      ]
    }
  };

  // ------------------ Utilidades de mezcla ------------------
  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ------------------ DOM helpers ------------------
  const $ = (id) => document.getElementById(id);
  const screens = [
    'login-screen', 'signup-screen', 'main-menu',
    'patient-name-form', 'trivia-game', 'subject-score',
    'final-score', 'score-table-screen', 'cycle-modal'
  ];

  function showScreen(id) {
    screens.forEach(s => {
      const el = $(s);
      if (!el) return;
      if (s === id) { el.classList.remove('hidden'); }
      else { el.classList.add('hidden'); }
    });
    estado.pantallaActual = id;
  }

  // ------------------ Lotties: sin duplicados ------------------
  const lotties = {};
  const LOTTIE_JSON = {
    login  : 'https://assets2.lottiefiles.com/packages/lf20_x62chJ.json',
    signup : 'https://assets4.lottiefiles.com/packages/lf20_06a6pf9i.json',
    book   : 'https://assets4.lottiefiles.com/packages/lf20_3rwasyjy.json',
    cycle  : 'https://assets4.lottiefiles.com/private_files/lf30_yjxp5z.json',
    rocket : 'https://assets4.lottiefiles.com/packages/lf20_rsa9yofm.json',
    trophy : 'https://assets7.lottiefiles.com/packages/lf20_jbrw3hcz.json',
    medal  : 'https://assets9.lottiefiles.com/packages/lf20_ydo1amjm.json'
  };

  function loadLottieOnce(id, path, loop=true) {
    if (lotties[id]) return; // ya cargada
    const container = $(id);
    if (!container) return;
    lotties[id] = lottie.loadAnimation({
      container, renderer: 'svg', loop, autoplay: true, path
    });
  }
  function destroyLotties() {
    Object.values(lotties).forEach(anim => anim.destroy());
    Object.keys(lotties).forEach(k => delete lotties[k]);
  }
  function initLotties() {
    loadLottieOnce('login-mascot-animation',  LOTTIE_JSON.login);
    loadLottieOnce('signup-user-animation',   LOTTIE_JSON.signup);
    loadLottieOnce('menu-book-animation',     LOTTIE_JSON.book);
    loadLottieOnce('cycle-animation',         LOTTIE_JSON.cycle);
    loadLottieOnce('score-rocket-animation',  LOTTIE_JSON.rocket);
    loadLottieOnce('trophy-animation',        LOTTIE_JSON.trophy);
    loadLottieOnce('score-trophy-animation',  LOTTIE_JSON.medal);
  }

  // ------------------ Acceso banco preguntas ------------------
  function preguntasDe(materia, ciclo) {
    const key = ciclo === 'Primer Ciclo' ? 'primerCiclo' : 'segundoCiclo';
    return bancoPreguntas[materia][key];
  }

  function obtenerSetMezclado(materia) {
    if (estado.cachePreguntas[materia]) return estado.cachePreguntas[materia];
    // Mezcla el orden de preguntas y el de respuestas de cada pregunta (copia segura)
    const base = preguntasDe(materia, estado.ciclo);
    const mezcladas = shuffleInPlace([...base]).map(q => ({
      question: q.question,
      answers : shuffleInPlace([...q.answers].map(a => ({ ...a })))
    }));
    estado.cachePreguntas[materia] = mezcladas;
    return mezcladas;
  }

  // ------------------ Render de una pregunta ------------------
  function setPreguntaActual() {
    const materia = estado.materias[estado.indiceMateria];
    const set = obtenerSetMezclado(materia);
    const p = set[estado.indicePregunta];

    $('subject-title').textContent = materia;
    $('question-text').textContent = p.question;

    const cont = $('answers-container');
    cont.innerHTML = '';

    // crear botones con feedback visual
    p.answers.forEach((a, idx) => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = `${idx + 1}. ${a.text}`;
      btn.dataset.correct = a.correct ? '1' : '0';
      btn.addEventListener('click', () => handleRespuesta(a.correct, btn));
      cont.appendChild(btn);
    });

    const progreso = Math.round(((estado.indicePregunta + 1) / set.length) * 100);
    $('question-counter').textContent = `Pregunta ${estado.indicePregunta + 1} de ${set.length}`;
    $('progress-fill').style.width = `${progreso}%`;
  }

  function handleRespuesta(correcta, btnClickeado) {
    const materia = estado.materias[estado.indiceMateria];

    // deshabilitar todas para evitar doble click
    const botones = Array.from(document.querySelectorAll('#answers-container .answer-btn'));
    botones.forEach(b => b.disabled = true);

    // marcar visual
    if (correcta) {
      btnClickeado.classList.add('is-correct');
      estado.puntajes[materia]++;
    } else {
      btnClickeado.classList.add('is-wrong');
      // remarcar cuál era la correcta
      const correcto = botones.find(b => b.dataset.correct === '1');
      if (correcto) correcto.classList.add('is-correct');
    }

    // avanzar con pequeña pausa
    setTimeout(() => {
      const set = obtenerSetMezclado(materia);
      if (estado.indicePregunta < set.length - 1) {
        estado.indicePregunta++;
        setPreguntaActual();
      } else {
        mostrarPuntajeMateria(materia);
      }
    }, 650);
  }

  function mostrarPuntajeMateria(materia) {
    $('subject-score-title').textContent = `Puntaje en ${materia}`;
    $('subject-score-value').textContent = `${estado.puntajes[materia]}/5`;
    $('subject-score-message').textContent =
      estado.puntajes[materia] >= 4 ? '¡Excelente!' :
      estado.puntajes[materia] === 3 ? '¡Muy bien!' : '¡Sigue practicando!';

    showScreen('subject-score');

    $('next-subject-btn').onclick = () => {
      if (estado.indiceMateria < estado.materias.length - 1) {
        estado.indiceMateria++;
        estado.indicePregunta = 0;
        setPreguntaActual();
        showScreen('trivia-game');
      } else {
        mostrarPuntajeFinal();
      }
    };
  }

  async function mostrarPuntajeFinal() {
    $('final-patient-name').textContent = estado.pacienteActual;
    $('language-score').textContent = `${estado.puntajes['Lengua']}/5`;
    $('math-score').textContent     = `${estado.puntajes['Matemática']}/5`;
    $('science-score').textContent  = `${estado.puntajes['Ciencias Naturales']}/5`;
    const total = estado.puntajes['Lengua'] + estado.puntajes['Matemática'] + estado.puntajes['Ciencias Naturales'];
    $('total-score').textContent = `${total}/15`;
    showScreen('final-score');

    // Guardar/actualizar en BD
    const save = await window.DB.saveAttempt({
      patientName: estado.pacienteActual,
      cycle: estado.ciclo,
      scores: { ...estado.puntajes }
    });
    if (!save.ok) console.error('Error guardando intento:', save.error);
  }

  // ------------------ Render tabla de puntajes ------------------
  async function renderScores() {
    const body = $('scores-table-body');
    body.innerHTML = '';
    const res = await window.DB.fetchAttempts();
    if (!res.ok) {
      console.error(res.error);
      $('no-scores-message').classList.remove('hidden');
      return;
    }
    const rows = res.data;
    if (!rows.length) {
      $('no-scores-message').classList.remove('hidden');
      return;
    }
    $('no-scores-message').classList.add('hidden');

    for (const r of rows) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.patientName}</td>
        <td>${r.cycle}</td>
        <td>${r.scores['Lengua']}/5</td>
        <td>${r.scores['Matemática']}/5</td>
        <td>${r.scores['Ciencias Naturales']}/5</td>
        <td>${r.total}/15</td>
        <td>
          <button class="delete-row" data-id="${r.id}" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </td>`;
      body.appendChild(tr);
    }

    body.querySelectorAll('.delete-row').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        if (!confirm('¿Eliminar este puntaje de la base de datos?')) return;
        const del = await window.DB.deleteAttempt(id);
        if (!del.ok) { alert('No se pudo eliminar.'); return; }
        await renderScores();
      });
    });
  }

  // ------------------ Binding de eventos (una sola vez) ------------------
  let eventosAtados = false;
  function bindEventos() {
    if (eventosAtados) return;
    eventosAtados = true;

    // Login
    $('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('username').value.trim();
      const password = $('password').value.trim();
      const r = await window.DB.signInDocente({ email, password });
      if (!r.ok) {
        $('login-error').classList.remove('hidden');
        return;
      }
      $('login-error').classList.add('hidden');
      estado.usuarioActual = email;
      $('user-name').textContent = email.split('@')[0] || 'Docente';
      showScreen('main-menu');
    });

    // Ir a registro
    $('signup-link').addEventListener('click', () => showScreen('signup-screen'));
    $('login-link').addEventListener('click', () => showScreen('login-screen'));

    // Registro
    $('signup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('new-email').value.trim();
      const password = $('new-password').value.trim();
      const username = $('new-username').value.trim();
      const r = await window.DB.signUpDocente({ email, password, username });
      if (!r.ok) {
        $('signup-error').classList.remove('hidden');
        $('signup-success').classList.add('hidden');
        return;
      }
      $('signup-error').classList.add('hidden');
      $('signup-success').classList.remove('hidden');
    });

    // Menú principal
    $('trivia-menu-btn').addEventListener('click', () => {
      showScreen('patient-name-form');
    });
    $('scores-menu-btn').addEventListener('click', async () => {
      await renderScores();
      showScreen('score-table-screen');
    });
    $('logout-btn').addEventListener('click', async () => {
      await window.DB.signOutDocente();
      destroyLotties();
      initLotties();
      showScreen('login-screen');
    });

    // Nombre paciente
    $('patient-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('patient-name').value.trim();
      if (!name) return;
      estado.pacienteActual = name;

      // opcional: registrar paciente
      await window.DB.savePatient({ patientName: name });

      // elegir ciclo
      showScreen('cycle-modal');
    });
    $('back-to-menu-from-patient').addEventListener('click', () => showScreen('main-menu'));

    // Selección de ciclo
    $('primer-ciclo-btn').addEventListener('click', () => {
      estado.ciclo = 'Primer Ciclo';
      empezarTrivia();
    });
    $('segundo-ciclo-btn').addEventListener('click', () => {
      estado.ciclo = 'Segundo Ciclo';
      empezarTrivia();
    });

    // Botones de navegación
    $('back-from-trivia').addEventListener('click', () => showScreen('main-menu'));
    $('go-menu-from-trivia').addEventListener('click', () => showScreen('main-menu'));
    $('go-menu-from-subject').addEventListener('click', () => showScreen('main-menu'));
    $('back-to-menu-btn').addEventListener('click', () => showScreen('main-menu'));
    $('back-from-scores').addEventListener('click', () => showScreen('main-menu'));
  }

  function empezarTrivia() {
    estado.puntajes = { 'Lengua':0, 'Matemática':0, 'Ciencias Naturales':0 };
    estado.indiceMateria = 0;
    estado.indicePregunta = 0;
    estado.cachePreguntas = {}; // reset de mezclas por si cambia ciclo o paciente
    setPreguntaActual();
    showScreen('trivia-game');
  }

  // ------------------ Inicio ------------------
  initLotties();
  bindEventos();
  showScreen('login-screen');
});
