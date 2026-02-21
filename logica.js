document.addEventListener('DOMContentLoaded', async () => {
  
  // --- ESTADO GLOBAL ---
  const state = {
    user: null, // Docente logueado
    currentScreen: 'login-screen',
    patient: null, // Alumno actual { id, name, dni }
    selectedSubject: null, 
    selectedCycle: null,
    questions: [],
    currentQuestionIndex: 0,
    score: { correct: 0, incorrect: 0 },
    editingQuestionId: null, // ID para edición
    motivationalPhrases: [
      "¡Tú puedes!", "¡Sigue así!", "¡Lo estás haciendo genial!", 
      "¡No te rindas!", "¡Eres muy inteligente!", "¡Casi lo tienes!"
    ]
  };

  const $ = (id) => document.getElementById(id);

  // --- NAVEGACIÓN Y PANTALLAS ---
  function showScreen(screenId) {
    // Ocultar todas las pantallas y modales
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    
    const target = $(screenId);
    if (target) {
      target.classList.remove('hidden');
      state.currentScreen = screenId;
    }

    // Inicializar lógica específica de cada pantalla
    if (screenId === 'paint-screen') initPaint();
    if (screenId === 'results-screen') loadPatientsTable(); // Cargar lista de alumnos
    if (screenId === 'docente-panel') loadSubjectsForCRUD();
    if (screenId === 'subject-selection') loadSubjectsForPatient();
  }

  window.showScreen = showScreen;
  window.toggleModal = (id, show) => {
    const el = $(id);
    if(show) el.classList.remove('hidden');
    else el.classList.add('hidden');
  };

  // --- AUTENTICACIÓN (DOCENTE) ---
  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('username').value;
    const pass = $('password').value;
    
    const res = await window.DB.login(email, pass);
    if (res.ok) {
      state.user = res.data;
      $('login-msg').classList.add('hidden');
      showScreen('main-menu');
    } else {
      $('login-msg').textContent = "Credenciales incorrectas.";
      $('login-msg').classList.remove('hidden');
    }
  });

  $('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await window.DB.register($('new-email').value, $('new-password').value);
    if (res.ok) {
      alert("Cuenta creada. Por favor inicia sesión.");
      showScreen('login-screen');
    } else {
      alert("Error: " + res.error.message);
    }
  });

  $('signup-link').onclick = () => showScreen('signup-screen');
  $('login-link').onclick = () => showScreen('login-screen');
  
  $('logout-btn').onclick = async () => {
    await window.DB.logout();
    state.user = null;
    showScreen('login-screen');
  };

  // Verificar sesión al cargar
  const session = await window.DB.getSession();
  if (session) {
    state.user = session.user;
    showScreen('main-menu');
  } else {
    showScreen('login-screen');
  }

  // --- SEGURIDAD: RE-AUTENTICACIÓN ---
  $('btn-docente-panel').onclick = () => {
    if(!state.user) { showScreen('login-screen'); return; }
    // Limpiar y mostrar modal de contraseña
    $('reauth-password').value = '';
    window.toggleModal('modal-reauth', true);
  };

  $('btn-confirm-reauth').onclick = async () => {
    const pwd = $('reauth-password').value;
    if(!pwd) return;
    
    const res = await window.DB.reauthenticate(state.user.email, pwd);
    if (res.ok) {
        window.toggleModal('modal-reauth', false);
        showScreen('docente-panel');
    } else {
        alert("Contraseña incorrecta.");
    }
  };

  // --- NAVEGACIÓN MENÚ ---
  $('btn-paciente-section').onclick = () => {
    $('patient-name-input').value = '';
    $('patient-dni-input').value = '';
    showScreen('patient-welcome');
  };

  // --- FLUJO PACIENTE (REGISTRO POR DNI) ---
  $('btn-confirm-patient').onclick = async () => {
    const name = $('patient-name-input').value.trim();
    const dni = $('patient-dni-input').value.trim();
    
    if (!name || !dni) { alert("Por favor ingresa un nombre y DNI"); return; }
    
    // Validar que el docente haya iniciado sesión antes (para asociar el alumno)
    if (!state.user) { alert("El docente debe iniciar sesión primero."); return; }

    // Registrar o recuperar alumno existente
    const res = await window.DB.registerOrGetPatient(name, dni);
    
    if(res.ok) {
        // Guardamos los datos del alumno en el estado
        state.patient = { 
            id: res.data.id_paciente || res.data.id, // ID único de la DB
            name: res.data.nombre, 
            dni: res.data.dni 
        };
        $('display-patient-name').textContent = name;
        showScreen('subject-selection');
    } else {
        alert("Error al ingresar: " + (res.error.message || "Intente nuevamente"));
    }
  };

  async function loadSubjectsForPatient() {
    const container = $('subjects-grid');
    container.innerHTML = '<p class="text-center">Cargando materias...</p>';
    
    const res = await window.DB.getSubjects();
    container.innerHTML = '';
    
    if (res.ok && res.data.length > 0) {
      res.data.forEach(sub => {
        const btn = document.createElement('button');
        btn.className = 'btn w-full py-4 text-xl font-bold shadow-md transform hover:scale-105 transition-transform mb-2';
        btn.textContent = sub.name;
        // Color aleatorio para hacerlo lúdico
        const hue = Math.floor(Math.random() * 360);
        btn.style.background = `hsl(${hue}, 70%, 50%)`;
        btn.style.color = 'white';
        
        btn.onclick = () => {
          state.selectedSubject = sub;
          window.toggleModal('modal-cycle-patient', true);
        };
        container.appendChild(btn);
      });
    } else {
      container.innerHTML = '<p class="text-center text-gray-500">No hay materias disponibles.</p>';
    }
  }

  $('btn-go-paint').onclick = () => showScreen('paint-screen');

  // Selección de Ciclo
  document.querySelectorAll('.cycle-select-btn').forEach(btn => {
    btn.onclick = async (e) => {
      state.selectedCycle = e.target.dataset.cycle; // 'Primer Ciclo' o 'Segundo Ciclo'
      window.toggleModal('modal-cycle-patient', false);
      await startGame();
    };
  });

  // --- MOTOR DE JUEGO (TRIVIA) ---
  async function startGame() {
    showScreen('trivia-game');
    $('game-subject-title').textContent = `${state.selectedSubject.name} - ${state.selectedCycle}`;
    $('game-question-text').textContent = "Cargando preguntas...";
    $('game-answers-grid').innerHTML = '';

    const res = await window.DB.getQuestionsForGame(state.selectedSubject.id, state.selectedCycle);
    
    if (!res.ok || res.data.length === 0) {
      alert("Esta materia no tiene preguntas válidas para este ciclo aún.");
      showScreen('subject-selection');
      return;
    }

    // Mezclar preguntas aleatoriamente
    state.questions = res.data.sort(() => Math.random() - 0.5);
    state.currentQuestionIndex = 0;
    state.score = { correct: 0, incorrect: 0 };
    renderQuestion();
  }

  function renderQuestion() {
    const q = state.questions[state.currentQuestionIndex];
    $('game-question-text').textContent = q.question_text;
    
    // Frase motivacional aleatoria
    $('motivational-msg').textContent = state.motivationalPhrases[Math.floor(Math.random() * state.motivationalPhrases.length)];

    // Actualizar barra de progreso
    const pct = ((state.currentQuestionIndex) / state.questions.length) * 100;
    $('game-progress').style.width = `${pct}%`;

    const grid = $('game-answers-grid');
    grid.innerHTML = '';

    // Mezclar respuestas
    const answers = [...q.answers].sort(() => Math.random() - 0.5);
    
    answers.forEach(ans => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn w-full p-4 text-left border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors';
      btn.textContent = ans.answer_text;
      btn.onclick = () => handleAnswer(ans.is_correct, btn);
      grid.appendChild(btn);
    });
  }

  function handleAnswer(isCorrect, btn) {
    // Bloquear botones para evitar doble click
    const allBtns = document.querySelectorAll('.answer-btn');
    allBtns.forEach(b => b.disabled = true);
    
    if (isCorrect) {
      btn.classList.add('bg-green-200', 'border-green-500');
      state.score.correct++;
    } else {
      btn.classList.add('bg-red-200', 'border-red-500');
      state.score.incorrect++;
    }
    
    // Esperar un momento antes de pasar a la siguiente
    setTimeout(() => {
      state.currentQuestionIndex++;
      if (state.currentQuestionIndex < state.questions.length) {
        renderQuestion();
      } else {
        finishGame();
      }
    }, 1500);
  }

  async function finishGame() {
    const total = state.questions.length;
    const finalScore = state.score.correct;
    
    // GUARDAR INTENTO EN BD (Vinculado al ID del alumno)
    if (state.user && state.patient) {
        await window.DB.saveAttempt({
            patientId: state.patient.id, // ID real de la tabla pacientes
            subject_name: state.selectedSubject.name,
            cycle: state.selectedCycle,
            correct_count: state.score.correct,
            incorrect_count: state.score.incorrect,
            score_total: finalScore,
            created_by: state.user.id
        });
    }
    
    $('score-subject-name').textContent = state.selectedSubject.name;
    $('score-number').textContent = `${finalScore}/${total}`;
    
    let feedback = "";
    if (finalScore === total) feedback = "¡Perfecto! ¡Eres un genio!";
    else if (finalScore > total / 2) feedback = "¡Muy buen trabajo!";
    else feedback = "¡Sigue practicando, tú puedes!";
    $('score-feedback').textContent = feedback;
    
    showScreen('level-score');
  }

  window.endTriviaEarly = () => {
    if(confirm("¿Quieres salir de la trivia?")) showScreen('subject-selection');
  };

  // --- CRUD GESTOR (DOCENTE) ---
  $('btn-add-subject-modal').onclick = () => {
    loadSubjectsForCRUD();
    window.toggleModal('modal-crud', true);
    $('selected-subject-questions').classList.add('hidden'); // Resetear vista
    switchToTab('tab-materia');
  };

  // Cambio de pestañas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = (e) => switchToTab(e.target.dataset.tab);
  });

  function switchToTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active', 'border-primary', 'text-primary');
      b.classList.add('text-gray-500');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if(activeBtn) {
        activeBtn.classList.add('active', 'border-primary', 'text-primary');
        activeBtn.classList.remove('text-gray-500');
    }
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    $(tabId).classList.remove('hidden');
  }

  // Guardar Materia Nueva
  $('btn-save-subject').onclick = async () => {
    const name = $('input-subject-name').value.trim();
    if (!name) return;
    const res = await window.DB.createSubject(name);
    if (res.ok) {
      alert("Materia creada");
      $('input-subject-name').value = '';
      loadSubjectsForCRUD();
    } else {
      alert("Error al crear materia");
    }
  };

  // Cargar lista de materias para el gestor
  async function loadSubjectsForCRUD() {
    const res = await window.DB.getSubjects();
    const list = $('subjects-list-crud');
    const select = $('select-subject-crud');
    
    list.innerHTML = '';
    select.innerHTML = '';

    if (res.ok) {
      res.data.forEach(sub => {
        // Llenar select de creación de preguntas
        const opt = document.createElement('option');
        opt.value = sub.id;
        opt.textContent = sub.name;
        select.appendChild(opt);

        // Llenar lista visual
        const div = document.createElement('div');
        div.className = 'p-3 border rounded bg-white flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors';
        
        const info = document.createElement('div');
        info.className = 'flex-1';
        info.innerHTML = `<span class="font-bold">${sub.name}</span> <span class="text-xs text-gray-400 ml-2">${sub.is_public ? '(NAP)' : '(Propia)'}</span>`;
        // Al hacer click, cargamos las preguntas de esta materia
        info.onclick = () => loadQuestionsForManager(sub);

        const actions = document.createElement('div');
        
        // Botón Eliminar (Solo si no es pública)
        if (!sub.is_public) {
            const btnDelete = document.createElement('button');
            btnDelete.innerHTML = '<i class="fas fa-trash text-red-500 hover:text-red-700"></i>';
            btnDelete.className = 'ml-3 p-1';
            btnDelete.title = "Eliminar materia";
            btnDelete.onclick = (e) => {
                e.stopPropagation();
                deleteSubject(sub.id, sub.name);
            };
            actions.appendChild(btnDelete);
        } else {
            actions.innerHTML = '<i class="fas fa-lock text-gray-300 ml-3" title="Materia Base (No editable)"></i>';
        }

        div.appendChild(info);
        div.appendChild(actions);
        list.appendChild(div);
      });
    }
  }

  async function deleteSubject(id, name) {
    if (!confirm(`¿Estás seguro de ELIMINAR la materia "${name}" y todas sus preguntas?`)) return;
    const res = await window.DB.deleteSubject(id);
    if (res.ok) {
        loadSubjectsForCRUD();
        $('selected-subject-questions').classList.add('hidden');
    } else {
        alert("Error al eliminar.");
    }
  }

  // Cargar preguntas de una materia para editar
  async function loadQuestionsForManager(subject) {
    $('selected-subject-questions').classList.remove('hidden');
    $('lbl-selected-subject').textContent = subject.name;
    const container = $('questions-list-container');
    container.innerHTML = '<p class="text-xs text-center p-2">Cargando...</p>';

    const res = await window.DB.getAllQuestionsForSubject(subject.id);
    container.innerHTML = '';

    if (res.ok && res.data.length > 0) {
        res.data.forEach(q => {
            const div = document.createElement('div');
            div.className = 'bg-white border rounded p-2 text-sm flex justify-between items-start';
            div.innerHTML = `
                <div><span class="font-bold text-gray-700">[${q.cycle}]</span> ${q.question_text}</div>
            `;
            
            const btns = document.createElement('div');
            btns.className = 'flex gap-2 ml-2 shrink-0';
            
            // Botón Editar Pregunta
            const btnEdit = document.createElement('button');
            btnEdit.innerHTML = '<i class="fas fa-pen text-blue-500"></i>';
            btnEdit.onclick = () => startEditQuestion(subject.id, q);

            // Botón Borrar Pregunta
            const btnDel = document.createElement('button');
            btnDel.innerHTML = '<i class="fas fa-trash text-red-500"></i>';
            btnDel.onclick = async () => {
                if(confirm("¿Borrar esta pregunta?")) {
                    await window.DB.deleteQuestion(q.id);
                    loadQuestionsForManager(subject); // Recargar lista
                }
            };
            btns.appendChild(btnEdit);
            btns.appendChild(btnDel);
            div.appendChild(btns);
            container.appendChild(div);
        });
    } else {
        container.innerHTML = '<p class="text-xs text-gray-500 p-2 text-center">No hay preguntas registradas.</p>';
    }
  }

  // Preparar formulario para edición
  function startEditQuestion(subjectId, questionData) {
    switchToTab('tab-pregunta');
    
    state.editingQuestionId = questionData.id;
    $('form-question-title').textContent = "Editar Pregunta";
    $('btn-tab-pregunta').textContent = "Editando...";
    $('btn-cancel-edit').classList.remove('hidden');
    $('btn-save-question').textContent = "Actualizar Pregunta";

    $('select-subject-crud').value = subjectId;
    $('select-subject-crud').disabled = true; // Bloquear cambio de materia
    $('select-cycle-crud').value = questionData.cycle;
    $('input-question-text').value = questionData.question_text;

    const inputs = document.querySelectorAll('.input-answer');
    inputs.forEach(i => i.value = '');
    
    const correct = questionData.answers.find(a => a.is_correct);
    const incorrects = questionData.answers.filter(a => !a.is_correct);

    if(correct) inputs[0].value = correct.answer_text;
    if(incorrects[0]) inputs[1].value = incorrects[0].answer_text;
    if(incorrects[1]) inputs[2].value = incorrects[1].answer_text;
    if(incorrects[2]) inputs[3].value = incorrects[2].answer_text;
  }

  function resetQuestionForm() {
    state.editingQuestionId = null;
    $('form-question-title').textContent = "Nueva Pregunta";
    $('btn-tab-pregunta').textContent = "Nueva Pregunta";
    $('btn-cancel-edit').classList.add('hidden');
    $('btn-save-question').textContent = "Guardar Pregunta";
    $('select-subject-crud').disabled = false;
    $('input-question-text').value = '';
    document.querySelectorAll('.input-answer').forEach(i => i.value = '');
  }

  $('btn-cancel-edit').onclick = () => {
    resetQuestionForm();
    switchToTab('tab-materia');
  };

  // Guardar o Actualizar Pregunta
  $('btn-save-question').onclick = async () => {
    const subjectId = $('select-subject-crud').value;
    const cycle = $('select-cycle-crud').value;
    const qText = $('input-question-text').value.trim();
    
    const ansInputs = document.querySelectorAll('.input-answer');
    const answers = [];
    let hasEmpty = false;
    
    // La primera siempre es la correcta por diseño en el form
    ansInputs.forEach(inp => {
        const val = inp.value.trim();
        if(!val) hasEmpty = true;
        answers.push({ text: val, isCorrect: inp.dataset.correct === 'true' });
    });

    if (!qText || hasEmpty) {
        alert("Por favor completa la pregunta y todas las respuestas.");
        return;
    }

    let res;
    if (state.editingQuestionId) {
        // MODO EDICIÓN
        res = await window.DB.updateQuestion(state.editingQuestionId, qText, cycle, answers);
    } else {
        // MODO CREACIÓN
        res = await window.DB.createQuestion(subjectId, cycle, qText, answers);
    }

    if (res.ok) {
        alert(state.editingQuestionId ? "Actualizado correctamente" : "Pregunta guardada");
        resetQuestionForm();
        switchToTab('tab-materia');
        
        // Si estábamos editando, recargar la lista para ver cambios
        const subName = $('lbl-selected-subject').textContent;
        if(subName !== "Materia") {
             window.DB.getSubjects().then(r => {
                 const sub = r.data.find(s => s.id === subjectId);
                 if(sub) loadQuestionsForManager(sub);
             });
        }
    } else {
        alert("Error al guardar.");
    }
  };

  // --- RESULTADOS Y LISTADO DE ALUMNOS ---
  $('btn-view-results').onclick = () => showScreen('results-screen');
  
  // Carga lista de pacientes ÚNICOS
  async function loadPatientsTable() {
    const tbody = $('results-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Cargando alumnos...</td></tr>';
    
    const res = await window.DB.getPatientsList();
    tbody.innerHTML = '';
    
    if (res.ok && res.data.length > 0) {
      $('no-data-msg').classList.add('hidden');
      res.data.forEach(p => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50 cursor-pointer';
        row.innerHTML = `
          <td class="p-3 font-bold text-left">${p.name}</td>
          <td class="p-3 text-left">${p.dni}</td>
          <td class="p-3 font-bold text-center">${p.attempts_count}</td>
          <td class="p-3 text-center">
             <button class="text-blue-500 hover:text-blue-700 font-medium hover:underline text-sm px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition">
               Ver Historial
             </button>
          </td>
        `;
        // Click en la fila abre el modal de historial
        row.onclick = () => showPatientHistory(p);
        tbody.appendChild(row);
      });
    } else {
      $('no-data-msg').classList.remove('hidden');
    }
  }

  // Mostrar historial detallado de un alumno
  async function showPatientHistory(patient) {
      $('history-patient-name').textContent = patient.name;
      $('history-patient-dni').textContent = patient.dni;
      const tbody = $('history-table-body');
      tbody.innerHTML = '<tr><td colspan="4" class="text-center p-2">Cargando...</td></tr>';
      
      window.toggleModal('modal-history', true);
      
      const res = await window.DB.getPatientHistory(patient.id);
      tbody.innerHTML = '';
      
      if(res.ok && res.data.length > 0) {
          res.data.forEach(h => {
              const tr = document.createElement('tr');
              tr.className = 'border-b';
              tr.innerHTML = `
                <td class="p-2 text-left text-xs">${new Date(h.date).toLocaleDateString()}</td>
                <td class="p-2 text-left">${h.subject}</td>
                <td class="p-2 text-left text-xs">${h.cycle}</td>
                <td class="p-2 text-center font-bold text-blue-600">${h.score}</td>
              `;
              tbody.appendChild(tr);
          });
      } else {
          tbody.innerHTML = '<tr><td colspan="4" class="text-center p-2 text-gray-500">Sin actividad registrada.</td></tr>';
      }
  }

  $('btn-export-csv').onclick = () => {
    const rows = Array.from(document.querySelectorAll('#results-table-body tr'));
    if (rows.length === 0) { alert("No hay datos para exportar"); return; }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Alumno,DNI,Total Intentos\r\n";
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        // Tomamos solo las primeras 3 columnas (Nombre, DNI, Intentos)
        const rowData = Array.from(cols).slice(0, 3).map(c => c.innerText).join(",");
        csvContent += rowData + "\r\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "listado_alumnos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- ZONA RECREATIVA (PAINT) ---
  let canvas, ctx, isDrawing = false;
  let currentColor = '#000000';

  function initPaint() {
    canvas = $('drawing-board');
    ctx = canvas.getContext('2d');
    
    // Ajustar al tamaño real del contenedor
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = currentColor;

    // Eventos Mouse
    canvas.onmousedown = startDraw;
    canvas.onmousemove = draw;
    canvas.onmouseup = stopDraw;
    canvas.onmouseleave = stopDraw;
    
    // Eventos Touch (Tablets)
    canvas.ontouchstart = (e) => { e.preventDefault(); startDraw(e.touches[0]); };
    canvas.ontouchmove = (e) => { e.preventDefault(); draw(e.touches[0]); };
    canvas.ontouchend = stopDraw;
  }

  function startDraw(e) {
    isDrawing = true;
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function stopDraw() {
    isDrawing = false;
    ctx.closePath();
  }

  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.onclick = (e) => {
        currentColor = e.target.dataset.color;
        if(ctx) ctx.strokeStyle = currentColor;
        
        // Feedback visual de selección
        document.querySelectorAll('.color-btn').forEach(b => b.style.transform = 'scale(1)');
        e.target.style.transform = 'scale(1.2)';
    };
  });

  $('btn-clear-canvas').onclick = () => {
    if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

});