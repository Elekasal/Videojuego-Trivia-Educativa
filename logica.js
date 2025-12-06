document.addEventListener('DOMContentLoaded', async () => {
  
  // --- ESTADO GLOBAL ---
  const state = {
    user: null,
    currentScreen: 'login-screen',
    patientName: '',
    selectedSubject: null, 
    selectedCycle: null,
    questions: [],
    currentQuestionIndex: 0,
    score: { correct: 0, incorrect: 0 },
    editingQuestionId: null, // Para saber si editamos o creamos
    motivationalPhrases: [
      "¡Tú puedes!", "¡Sigue así!", "¡Lo estás haciendo genial!", 
      "¡No te rindas!", "¡Eres muy inteligente!", "¡Casi lo tienes!"
    ]
  };

  const $ = (id) => document.getElementById(id);

  // --- NAVEGACIÓN ---
  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    
    const target = $(screenId);
    if (target) {
      target.classList.remove('hidden');
      state.currentScreen = screenId;
    }

    if (screenId === 'paint-screen') initPaint();
    if (screenId === 'results-screen') loadResultsTable();
    if (screenId === 'docente-panel') loadSubjectsForCRUD();
    if (screenId === 'subject-selection') loadSubjectsForPatient();
  }

  window.showScreen = showScreen;
  window.toggleModal = (id, show) => {
    const el = $(id);
    if(show) el.classList.remove('hidden');
    else el.classList.add('hidden');
  };

  // --- AUTENTICACIÓN ---
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
    const email = $('new-email').value;
    const pass = $('new-password').value;
    const res = await window.DB.register(email, pass);
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

  const session = await window.DB.getSession();
  if (session) {
    state.user = session.user;
    showScreen('main-menu');
  } else {
    showScreen('login-screen');
  }

  // --- SEGURIDAD: RE-AUTENTICACIÓN (NUEVO) ---
  $('btn-docente-panel').onclick = () => {
    if(!state.user) { showScreen('login-screen'); return; }
    // En vez de entrar directo, pedimos contraseña
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

  // --- MENÚ Y NAVEGACIÓN ---
  $('btn-paciente-section').onclick = () => {
    $('patient-name-input').value = '';
    showScreen('patient-welcome');
  };

  $('btn-confirm-patient').onclick = () => {
    const name = $('patient-name-input').value.trim();
    if (!name) { alert("Por favor ingresa un nombre"); return; }
    state.patientName = name;
    $('display-patient-name').textContent = name;
    showScreen('subject-selection');
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

  document.querySelectorAll('.cycle-select-btn').forEach(btn => {
    btn.onclick = async (e) => {
      state.selectedCycle = e.target.dataset.cycle;
      window.toggleModal('modal-cycle-patient', false);
      await startGame();
    };
  });

  // --- TRIVIA GAME ---
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

    state.questions = res.data.sort(() => Math.random() - 0.5);
    state.currentQuestionIndex = 0;
    state.score = { correct: 0, incorrect: 0 };
    renderQuestion();
  }

  function renderQuestion() {
    const q = state.questions[state.currentQuestionIndex];
    $('game-question-text').textContent = q.question_text;
    $('motivational-msg').textContent = state.motivationalPhrases[Math.floor(Math.random() * state.motivationalPhrases.length)];

    const pct = ((state.currentQuestionIndex) / state.questions.length) * 100;
    $('game-progress').style.width = `${pct}%`;

    const grid = $('game-answers-grid');
    grid.innerHTML = '';

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
    const allBtns = document.querySelectorAll('.answer-btn');
    allBtns.forEach(b => b.disabled = true);
    if (isCorrect) {
      btn.classList.add('bg-green-200', 'border-green-500');
      state.score.correct++;
    } else {
      btn.classList.add('bg-red-200', 'border-red-500');
      state.score.incorrect++;
    }
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
    if (state.user) {
        await window.DB.saveAttempt({
            patient_name: state.patientName,
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

  // --- CRUD GESTOR (MATERIAS Y PREGUNTAS) ---
  $('btn-add-subject-modal').onclick = () => {
    loadSubjectsForCRUD();
    window.toggleModal('modal-crud', true);
    $('selected-subject-questions').classList.add('hidden'); // Ocultar panel preguntas
    switchToTab('tab-materia');
  };

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

  // Crear Materia
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

  // Cargar lista con opciones de Borrar y Expandir
  async function loadSubjectsForCRUD() {
    const res = await window.DB.getSubjects();
    const list = $('subjects-list-crud');
    const select = $('select-subject-crud');
    
    list.innerHTML = '';
    select.innerHTML = '';

    if (res.ok) {
      res.data.forEach(sub => {
        // Opción en Select
        const opt = document.createElement('option');
        opt.value = sub.id;
        opt.textContent = sub.name;
        select.appendChild(opt);

        // Item en Lista
        const div = document.createElement('div');
        div.className = 'p-3 border rounded bg-white flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors';
        
        // Al hacer click en el texto, carga preguntas
        const info = document.createElement('div');
        info.className = 'flex-1';
        info.innerHTML = `<span class="font-bold">${sub.name}</span> <span class="text-xs text-gray-400 ml-2">${sub.is_public ? '(NAP)' : '(Propia)'}</span>`;
        // *** USO CORRECTO DE LA FUNCIÓN ***
        info.onclick = () => loadQuestionsForManager(sub);

        const actions = document.createElement('div');
        
        // Botón Borrar (Solo si no es pública)
        if (!sub.is_public) {
            const btnDelete = document.createElement('button');
            btnDelete.innerHTML = '<i class="fas fa-trash text-red-500 hover:text-red-700"></i>';
            btnDelete.className = 'ml-3 p-1';
            btnDelete.title = "Eliminar materia";
            btnDelete.onclick = (e) => {
                e.stopPropagation(); // Evitar que se abra la lista de preguntas
                deleteSubject(sub.id, sub.name);
            };
            actions.appendChild(btnDelete);
        } else {
            actions.innerHTML = '<i class="fas fa-lock text-gray-300 ml-3" title="No editable"></i>';
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

  // Cargar preguntas para editar
  async function loadQuestionsForManager(subject) {
    $('selected-subject-questions').classList.remove('hidden');
    $('lbl-selected-subject').textContent = subject.name;
    const container = $('questions-list-container');
    container.innerHTML = '<p class="text-xs text-center p-2">Cargando...</p>';

    // *** AQUÍ ESTABA EL PROBLEMA, AHORA CORREGIDO ***
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
            
            // Botón Editar
            const btnEdit = document.createElement('button');
            btnEdit.innerHTML = '<i class="fas fa-pen text-blue-500"></i>';
            btnEdit.onclick = () => startEditQuestion(subject.id, q);

            // Botón Borrar
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
        container.innerHTML = '<p class="text-xs text-gray-500 p-2 text-center">No hay preguntas.</p>';
    }
  }

  // Editar Pregunta
  function startEditQuestion(subjectId, questionData) {
    switchToTab('tab-pregunta');
    
    state.editingQuestionId = questionData.id;
    $('form-question-title').textContent = "Editar Pregunta";
    $('btn-tab-pregunta').textContent = "Editando...";
    $('btn-cancel-edit').classList.remove('hidden');
    $('btn-save-question').textContent = "Actualizar Pregunta";

    $('select-subject-crud').value = subjectId;
    $('select-subject-crud').disabled = true; // Bloquear materia al editar
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

  $('btn-save-question').onclick = async () => {
    const subjectId = $('select-subject-crud').value;
    const cycle = $('select-cycle-crud').value;
    const qText = $('input-question-text').value.trim();
    
    const ansInputs = document.querySelectorAll('.input-answer');
    const answers = [];
    let hasEmpty = false;
    ansInputs.forEach(inp => {
        const val = inp.value.trim();
        if(!val) hasEmpty = true;
        answers.push({ text: val, isCorrect: inp.dataset.correct === 'true' });
    });

    if (!qText || hasEmpty) {
        alert("Completa todos los campos.");
        return;
    }

    let res;
    if (state.editingQuestionId) {
        // ACTUALIZAR
        res = await window.DB.updateQuestion(state.editingQuestionId, qText, cycle, answers);
    } else {
        // CREAR NUEVA
        res = await window.DB.createQuestion(subjectId, cycle, qText, answers);
    }

    if (res.ok) {
        alert(state.editingQuestionId ? "Actualizado correctamente" : "Pregunta guardada");
        resetQuestionForm();
        switchToTab('tab-materia');
        // Recargar lista si está abierta
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

  // --- RESULTADOS Y EXPORTACIÓN ---
  $('btn-view-results').onclick = () => showScreen('results-screen');
  async function loadResultsTable() {
    const tbody = $('results-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Cargando...</td></tr>';
    const res = await window.DB.getAttempts();
    tbody.innerHTML = '';
    if (res.ok && res.data.length > 0) {
      $('no-data-msg').classList.add('hidden');
      res.data.forEach(r => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
          <td class="p-3 font-bold">${r.patient_name}</td>
          <td class="p-3">${r.subject_name}</td>
          <td class="p-3">${r.cycle}</td>
          <td class="p-3 text-blue-600 font-bold">${r.correct_count} / ${r.correct_count + r.incorrect_count}</td>
          <td class="p-3 text-gray-500 text-xs">${new Date(r.created_at).toLocaleDateString()}</td>
        `;
        tbody.appendChild(row);
      });
    } else {
      $('no-data-msg').classList.remove('hidden');
    }
  }

  $('btn-export-csv').onclick = () => {
    const rows = Array.from(document.querySelectorAll('#results-table-body tr'));
    if (rows.length === 0) { alert("No hay datos para exportar"); return; }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Paciente,Materia,Ciclo,Puntaje,Fecha\r\n";
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        const rowData = Array.from(cols).map(c => c.innerText).join(",");
        csvContent += rowData + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "resultados_trivia.csv");
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
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = currentColor;
    canvas.onmousedown = startDraw;
    canvas.onmousemove = draw;
    canvas.onmouseup = stopDraw;
    canvas.onmouseleave = stopDraw;
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
        document.querySelectorAll('.color-btn').forEach(b => b.style.transform = 'scale(1)');
        e.target.style.transform = 'scale(1.2)';
    };
  });
  $('btn-clear-canvas').onclick = () => {
    if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
});