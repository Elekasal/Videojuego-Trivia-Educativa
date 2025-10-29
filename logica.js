/* ==========================================================
🧠 LÓGICA PRINCIPAL (V4.1)
- Mantiene el flujo y almacenamiento del V4
- Añade botones “Volver al Menú” y ajusta navegación
========================================================== */
document.addEventListener('DOMContentLoaded', function () {
  const estado = {
    usuarioActual: null,
    pantallaActual: 'login-screen',
    pacienteActual: null,
    materiaActual: null,
    indicePregunta: 0,
    materias: ['Lengua', 'Matemática', 'Ciencias Naturales'],
    indiceMateria: 0,
    ciclo: null,
    puntajes: { 'Lengua': 0, 'Matemática': 0, 'Ciencias Naturales': 0 }
  };

  /* --------------------- Banco de preguntas (V4) --------------------- */
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
        { question: "¿De dónde sale el pollito?", answers: [{ text: "Del huevo", correct: true }, { text: "De la flor", correct: false }, { text: "De la semilla", correct: false }, { text: "Del árbol", correct: false }] },
        { question: "¿Cuál es un alimento saludable?", answers: [{ text: "Manzana", correct: true }, { text: "Caramelo", correct: false }, { text: "Refresco", correct: false }, { text: "Papas fritas", correct: false }] },
        { question: "¿Cuál es un recurso natural?", answers: [{ text: "Agua", correct: true }, { text: "Plástico", correct: false }, { text: "Televisor", correct: false }, { text: "Teléfono", correct: false }] }
      ],
      segundoCiclo: [
        { question: "¿Cuál es la función del corazón?", answers: [{ text: "Bombear la sangre", correct: true }, { text: "Filtrar el aire", correct: false }, { text: "Digerir alimentos", correct: false }, { text: "Controlar pensamientos", correct: false }] },
        { question: "¿Qué lugar ocupa la Tierra en el sistema solar?", answers: [{ text: "Tercer planeta", correct: true }, { text: "Primer planeta", correct: false }, { text: "Quinto planeta", correct: false }, { text: "Segundo planeta", correct: false }] },
        { question: "¿Qué seres vivos pueden producir su propio alimento?", answers: [{ text: "Las plantas", correct: true }, { text: "Los perros", correct: false }, { text: "Las personas", correct: false }, { text: "Los peces", correct: false }] },
        { question: "¿Qué es la erosión?", answers: [{ text: "Desgaste del suelo", correct: true }, { text: "Formación de montañas", correct: false }, { text: "Creación de nubes", correct: false }, { text: "Crecimiento de plantas", correct: false }] },
        { question: "¿Por qué es importante separar los residuos?", answers: [{ text: "Para reciclar", correct: true }, { text: "Para ensuciar más", correct: false }, { text: "Para gastar más dinero", correct: false }, { text: "Para ocupar más espacio", correct: false }] }
      ]
    }
  };

  /* --------------------- Cache de elementos --------------------- */
  const pantallas = {
    login: document.getElementById('login-screen'),
    registro: document.getElementById('signup-screen'),
    menu: document.getElementById('main-menu'),
    paciente: document.getElementById('patient-name-form'),
    ciclo: document.getElementById('cycle-modal'),
    trivia: document.getElementById('trivia-game'),
    puntajeMateria: document.getElementById('subject-score'),
    puntajeFinal: document.getElementById('final-score'),
    tablaPuntajes: document.getElementById('score-table-screen')
  };

  const elTituloMateria = document.getElementById('subject-title');
  const elContador = document.getElementById('question-counter');
  const elBarraProgreso = document.getElementById('progress-fill');
  const elTextoPregunta = document.getElementById('question-text');
  const elContenedorRespuestas = document.getElementById('answers-container');

  const elTituloPuntajeMateria = document.getElementById('subject-score-title');
  const elValorPuntajeMateria = document.getElementById('subject-score-value');
  const elMensajePuntajeMateria = document.getElementById('subject-score-message');

  const elNombreFinal = document.getElementById('final-patient-name');
  const elLenguaFinal = document.getElementById('language-score');
  const elMatematicaFinal = document.getElementById('math-score');
  const elCienciasFinal = document.getElementById('science-score');
  const elTotalFinal = document.getElementById('total-score');

  /* --------------------- Navegación de pantallas --------------------- */
  function mostrarPantalla(idPantalla) {
    Object.values(pantallas).forEach(seccion => seccion.classList.add('hidden'));
    const seccion = document.getElementById(idPantalla);
    if (seccion) seccion.classList.remove('hidden');
    estado.pantallaActual = idPantalla;
    if (idPantalla !== 'cycle-modal') pantallas.ciclo.classList.add('hidden');
  }

  /* --------------------- Usuarios (LocalStorage) --------------------- */
  function obtenerUsuarios() {
    const str = localStorage.getItem('users');
    return str ? JSON.parse(str) : [];
  }
  function guardarUsuarios(usuarios) { localStorage.setItem('users', JSON.stringify(usuarios)); }
  function existeUsuario(username) {
    return obtenerUsuarios().some(u => u.username.toLowerCase() === username.toLowerCase());
  }
  function autenticarUsuario(username, password) {
    return obtenerUsuarios().find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  }
  function registrarUsuario(username, email, password) {
    if (existeUsuario(username)) return false;
    const lista = obtenerUsuarios(); lista.push({ username, email, password });
    guardarUsuarios(lista); return true;
  }

  /* --------------------- Puntajes (LocalStorage) --------------------- */
  function obtenerPuntajes() {
    const str = localStorage.getItem('scores');
    return str ? JSON.parse(str) : [];
  }
  function guardarPuntaje(registro) {
    const lista = obtenerPuntajes(); lista.push(registro);
    localStorage.setItem('scores', JSON.stringify(lista));
  }
  function renderizarTablaPuntajes() {
    const cuerpo = document.getElementById('scores-table-body');
    const vacio = document.getElementById('no-scores-message');
    const lista = obtenerPuntajes();

    if (!lista.length) {
      cuerpo.innerHTML = '';
      vacio.classList.remove('hidden');
      return;
    }
    vacio.classList.add('hidden');
    cuerpo.innerHTML = '';

    lista.forEach((item, idx) => {
      const fila = document.createElement('tr');

      const celNombre = document.createElement('td'); celNombre.textContent = item.patientName;
      const celCiclo = document.createElement('td'); celCiclo.textContent = item.cycle || 'Primer Ciclo';
      const celLen = document.createElement('td'); celLen.textContent = item.scores['Lengua'] + '/5';
      const celMat = document.createElement('td'); celMat.textContent = item.scores['Matemática'] + '/5';
      const celCie = document.createElement('td'); celCie.textContent = item.scores['Ciencias Naturales'] + '/5';
      const celTotal = document.createElement('td');
      const total = item.scores['Lengua'] + item.scores['Matemática'] + item.scores['Ciencias Naturales'];
      celTotal.textContent = total + '/15';

      const celAccion = document.createElement('td');
      const btnBorrar = document.createElement('button');
      btnBorrar.className = 'delete-score-btn';
      btnBorrar.innerHTML = '<i class="fas fa-trash"></i>';
      btnBorrar.addEventListener('click', () => {
        if (confirm('¿Eliminar este puntaje?')) {
          const nueva = obtenerPuntajes().filter((_, i) => i !== idx);
          localStorage.setItem('scores', JSON.stringify(nueva));
          renderizarTablaPuntajes();
        }
      });
      celAccion.appendChild(btnBorrar);

      fila.appendChild(celNombre);
      fila.appendChild(celCiclo);
      fila.appendChild(celLen);
      fila.appendChild(celMat);
      fila.appendChild(celCie);
      fila.appendChild(celTotal);
      fila.appendChild(celAccion);

      cuerpo.appendChild(fila);
    });
  }

  /* --------------------- Flujo de Trivia --------------------- */
  function iniciarFlujoTrivia() {
    estado.indicePregunta = 0;
    estado.indiceMateria = 0;
    estado.puntajes = { 'Lengua': 0, 'Matemática': 0, 'Ciencias Naturales': 0 };
    cargarMateria(estado.materias[estado.indiceMateria]);
    mostrarPantalla('trivia-game');
  }
  function cargarMateria(nombreMateria) {
    estado.materiaActual = nombreMateria;
    estado.indicePregunta = 0;
    elTituloMateria.textContent = nombreMateria;
    cargarPregunta();
  }
  function cargarPregunta() {
    const tipoCiclo = (estado.ciclo === 'Primer Ciclo') ? 'primerCiclo' : 'segundoCiclo';
    const pregunta = bancoPreguntas[estado.materiaActual][tipoCiclo][estado.indicePregunta];

    elContador.textContent = `Pregunta ${estado.indicePregunta + 1} de 5`;
    elBarraProgreso.style.width = `${((estado.indicePregunta + 1) / 5) * 100}%`;
    elTextoPregunta.textContent = pregunta.question;

    elContenedorRespuestas.innerHTML = '';
    const mezcladas = [...pregunta.answers].sort(() => Math.random() - 0.5);

    mezcladas.forEach(ans => {
      const btn = document.createElement('button');
      btn.classList.add('answer-btn');
      btn.textContent = ans.text;
      btn.dataset.correct = ans.correct; // "true"/"false"
      btn.addEventListener('click', () => procesarRespuesta(btn));
      elContenedorRespuestas.appendChild(btn);
    });
  }
  function procesarRespuesta(botonSeleccionado) {
    const esCorrecta = (botonSeleccionado.dataset.correct === 'true');
    const botones = elContenedorRespuestas.querySelectorAll('.answer-btn');

    botones.forEach(b => {
      b.disabled = true;
      if (b.dataset.correct === 'true') b.classList.add('correct');
      else if (b === botonSeleccionado && !esCorrecta) b.classList.add('incorrect');
    });

    if (esCorrecta) estado.puntajes[estado.materiaActual]++;

    setTimeout(() => {
      estado.indicePregunta++;
      if (estado.indicePregunta >= 5) {
        mostrarPuntajeMateria();
      } else {
        cargarPregunta();
      }
    }, 1200);
  }

  /* --------------------- Resúmenes --------------------- */
  function mostrarPuntajeMateria() {
    elTituloPuntajeMateria.textContent = `Puntaje en ${estado.materiaActual}`;
    elValorPuntajeMateria.textContent = `${estado.puntajes[estado.materiaActual]}/5`;

    const s = estado.puntajes[estado.materiaActual];
    if (s === 5) { elMensajePuntajeMateria.textContent = '¡Perfecto! ¡Eres increíble!'; crearConfeti(); }
    else if (s >= 4) elMensajePuntajeMateria.textContent = '¡Excelente trabajo!';
    else if (s >= 3) elMensajePuntajeMateria.textContent = '¡Buen trabajo!';
    else if (s >= 2) elMensajePuntajeMateria.textContent = '¡Sigue practicando!';
    else elMensajePuntajeMateria.textContent = '¡No te rindas, puedes mejorar!';

    estado.indiceMateria++;
    const btnSiguiente = document.getElementById('next-subject-btn');
    if (estado.indiceMateria >= estado.materias.length) btnSiguiente.textContent = 'Ver Resultado Final';
    else btnSiguiente.textContent = `Siguiente: ${estado.materias[estado.indiceMateria]}`;

    mostrarPantalla('subject-score');
  }

  function mostrarPuntajeFinal() {
    elNombreFinal.textContent = estado.pacienteActual;
    elLenguaFinal.textContent = `${estado.puntajes['Lengua']}/5`;
    elMatematicaFinal.textContent = `${estado.puntajes['Matemática']}/5`;
    elCienciasFinal.textContent = `${estado.puntajes['Ciencias Naturales']}/5`;
    const total = estado.puntajes['Lengua'] + estado.puntajes['Matemática'] + estado.puntajes['Ciencias Naturales'];
    elTotalFinal.textContent = `${total}/15`;

    guardarPuntaje({
      patientName: estado.pacienteActual,
      cycle: estado.ciclo || 'Primer Ciclo',
      scores: { ...estado.puntajes },
      date: new Date().toISOString()
    });

    if (total === 15) crearConfeti();
    mostrarPantalla('final-score');
  }

  /* --------------------- Confeti & Lottie --------------------- */
  function crearConfeti() {
    const contenedor = document.querySelector('.app-container');
    const colores = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#7BE495', '#6CCCF9'];
    for (let i = 0; i < 80; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      const posX = Math.random() * contenedor.offsetWidth;
      const color = colores[Math.floor(Math.random() * colores.length)];
      const size = Math.random() * 10 + 4;
      const rot = Math.random() * 360;
      const dur = Math.random() * 1.8 + 0.9;

      c.style.left = posX + 'px';
      c.style.backgroundColor = color;
      c.style.width = size + 'px';
      c.style.height = size + 'px';
      c.style.transform = `rotate(${rot}deg)`;
      c.style.animationDuration = dur + 's';

      contenedor.appendChild(c);
      setTimeout(() => c.remove(), dur * 1000);
    }
  }

  function inicializarAnimacionesLottie() {
    lottie.loadAnimation({
      container: document.getElementById('login-mascot-animation'),
      renderer: 'svg', loop: true, autoplay: true,
      path: 'https://assets2.lottiefiles.com/packages/lf20_m9zragkd.json'
    });
    lottie.loadAnimation({
      container: document.getElementById('signup-user-animation'),
      renderer: 'svg', loop: true, autoplay: true,
      path: 'https://assets9.lottiefiles.com/packages/lf20_xl3i2mkd.json'
    });
    lottie.loadAnimation({
      container: document.getElementById('menu-book-animation'),
      renderer: 'svg', loop: true, autoplay: true,
      path: 'https://assets9.lottiefiles.com/packages/lf20_qm8ufib7.json'
    });
    lottie.loadAnimation({
      container: document.getElementById('score-rocket-animation'),
      renderer: 'svg', loop: true, autoplay: true,
      path: 'https://assets3.lottiefiles.com/packages/lf20_obkemuop.json'
    });
    lottie.loadAnimation({
      container: document.getElementById('trophy-animation'),
      renderer: 'svg', loop: false, autoplay: true,
      path: 'https://assets8.lottiefiles.com/packages/lf20_rc5d0f61.json'
    });
    lottie.loadAnimation({
      container: document.getElementById('score-trophy-animation'),
      renderer: 'svg', loop: true, autoplay: true,
      path: 'https://assets8.lottiefiles.com/packages/lf20_rc5d0f61.json'
    });
    lottie.loadAnimation({
      container: document.getElementById('cycle-animation'),
      renderer: 'svg', loop: true, autoplay: true,
      path: 'https://assets5.lottiefiles.com/packages/lf20_eijrtwvm.json'
    });
  }
  if (window.lottie) inicializarAnimacionesLottie();

  /* --------------------- Listeners de navegación --------------------- */

  // Login
  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value;
    const error = document.getElementById('login-error');
    const auth = autenticarUsuario(user, pass);

    if (auth) {
      estado.usuarioActual = auth;
      document.getElementById('user-name').textContent = auth.username;
      error.classList.add('hidden');
      mostrarPantalla('main-menu');
    } else {
      error.classList.remove('hidden');
    }
  });

  // Registro
  document.getElementById('signup-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const user = document.getElementById('new-username').value.trim();
    const email = document.getElementById('new-email').value.trim();
    const pass = document.getElementById('new-password').value;
    const error = document.getElementById('signup-error');
    const ok = document.getElementById('signup-success');

    if (!user || !email || !pass) { error.classList.remove('hidden'); ok.classList.add('hidden'); return; }
    const creado = registrarUsuario(user, email, pass);
    if (creado) {
      error.classList.add('hidden'); ok.classList.remove('hidden');
      document.getElementById('new-username').value = '';
      document.getElementById('new-email').value = '';
      document.getElementById('new-password').value = '';
      setTimeout(() => mostrarPantalla('login-screen'), 1500);
    } else {
      error.textContent = 'Este nombre de usuario ya está en uso. Por favor elige otro.';
      error.classList.remove('hidden'); ok.classList.add('hidden');
    }
  });

  // Cambios de pantalla login/registro
  document.getElementById('signup-link').addEventListener('click', () => mostrarPantalla('signup-screen'));
  document.getElementById('login-link').addEventListener('click', () => mostrarPantalla('login-screen'));

  // Menú principal
  document.getElementById('trivia-menu-btn').addEventListener('click', () => mostrarPantalla('patient-name-form'));
  document.getElementById('scores-menu-btn').addEventListener('click', () => {
    renderizarTablaPuntajes();
    mostrarPantalla('score-table-screen');
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    estado.usuarioActual = null;
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    mostrarPantalla('login-screen');
  });

  // Paciente
  document.getElementById('patient-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const nombre = document.getElementById('patient-name').value.trim();
    if (nombre) {
      estado.pacienteActual = nombre;
      mostrarPantalla('cycle-modal');
    }
  });
  document.getElementById('back-to-menu-from-patient').addEventListener('click', () => mostrarPantalla('main-menu'));

  // Selección de ciclo
  document.getElementById('primer-ciclo-btn').addEventListener('click', () => { estado.ciclo = 'Primer Ciclo'; iniciarFlujoTrivia(); });
  document.getElementById('segundo-ciclo-btn').addEventListener('click', () => { estado.ciclo = 'Segundo Ciclo'; iniciarFlujoTrivia(); });

  // Trivia: salir (flecha) y nuevo botón “Volver al menú”
  document.getElementById('back-from-trivia').addEventListener('click', () => {
    if (confirm('¿Salir de la trivia? Se perderá tu progreso actual.')) mostrarPantalla('main-menu');
  });
  document.getElementById('go-menu-from-trivia').addEventListener('click', () => {
    if (confirm('¿Volver al Menú Principal? Se perderá tu progreso actual.')) mostrarPantalla('main-menu');
  });

  // Puntaje por materia: continuar o volver al menú
  document.getElementById('next-subject-btn').addEventListener('click', () => {
    if (estado.indiceMateria < estado.materias.length) {
      cargarMateria(estado.materias[estado.indiceMateria]);
      mostrarPantalla('trivia-game');
    } else {
      mostrarPuntajeFinal();
    }
  });
  document.getElementById('go-menu-from-subject').addEventListener('click', () => mostrarPantalla('main-menu'));

  // Puntaje final → menú
  document.getElementById('back-to-menu-btn').addEventListener('click', () => mostrarPantalla('main-menu'));

  // Tabla de puntajes → menú
  document.getElementById('back-from-scores').addEventListener('click', () => mostrarPantalla('main-menu'));

  /* --------------------- Usuario demo (primera vez) --------------------- */
  if (!obtenerUsuarios().length) registrarUsuario('demo', 'demo@example.com', 'demo123');
});
