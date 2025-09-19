// Professional Xavier AI — Chatbot + Voice + ToDo
// Save as script.js

/* ---------- Elements ---------- */
const aiCircle = document.getElementById('aiCircle');
const micBtn = document.getElementById('micBtn');
const textInput = document.getElementById('textInput');
const status = document.getElementById('status');

const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

const todoInput = document.getElementById('todoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoList = document.getElementById('todoList');
const clearTodos = document.getElementById('clearTodos');

const historyList = document.getElementById('historyList');
const quickBtns = document.querySelectorAll('.quick-menu button');

/* ---------- Speech ---------- */
let recognition = null;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
}
const synth = window.speechSynthesis;

/* ---------- Local storage keys ---------- */
const HISTORY_KEY = 'xavier_history_v1';
const TODO_KEY = 'xavier_todos_v1';

/* ---------- Helpers ---------- */
function speak(text, lang = 'en-IN') {
  if (synth.speaking) synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang; u.rate = 1; u.pitch = 1;
  u.onstart = () => status.textContent = 'Speaking...';
  u.onend = () => status.textContent = 'Ready to help!';
  synth.speak(u);
}

function addChat(text, who = 'bot') {
  const div = document.createElement('div');
  div.className = 'message ' + (who === 'user' ? 'user' : 'bot');
  div.innerText = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addHistory(entry) {
  const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  arr.unshift({ text: entry, t: new Date().toISOString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 200)));
  renderHistory();
}

function renderHistory() {
  const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  historyList.innerHTML = '';
  arr.forEach(it => {
    const li = document.createElement('li');
    const time = new Date(it.t).toLocaleString();
    li.innerText = `${it.text} — ${time}`;
    historyList.appendChild(li);
  });
}

/* ---------- ToDo functions ---------- */
function readTodos() {
  return JSON.parse(localStorage.getItem(TODO_KEY) || '[]');
}
function saveTodos(arr) {
  localStorage.setItem(TODO_KEY, JSON.stringify(arr));
  renderTodos();
}
function renderTodos() {
  const arr = readTodos();
  todoList.innerHTML = '';
  arr.forEach((t, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${t}</span><div><button data-i="${i}" class="del">Delete</button></div>`;
    todoList.appendChild(li);
  });
}
function addTodo(text) {
  if (!text) return;
  const arr = readTodos();
  arr.push(text);
  saveTodos(arr);
  addHistory(`Added todo: ${text}`);
  addChat(`Task added: ${text}`, 'bot');
  speak(`Task added: ${text}`);
}
function deleteTodo(index) {
  const arr = readTodos();
  if (index >= 0 && index < arr.length) {
    const removed = arr.splice(index, 1)[0];
    saveTodos(arr);
    addHistory(`Deleted todo: ${removed}`);
    addChat(`Deleted task: ${removed}`, 'bot');
    speak(`Deleted task: ${removed}`);
  }
}
function clearAllTodos() {
  if (!confirm('Clear all tasks?')) return;
  localStorage.removeItem(TODO_KEY);
  renderTodos();
  addHistory('Cleared all todos');
  addChat('All tasks cleared', 'bot');
  speak('All tasks cleared');
}

/* ---------- NLU / Commands ---------- */
const jokes = [
  "Why don't programmers like nature? It has too many bugs!",
  "How do you comfort a JavaScript bug? You console it!",
  "Why did the developer go broke? Because he used up all his cache!"
];

function safeEvalMath(expr) {
  const cleaned = expr.replace(/[^0-9\+\-\*\/\.\(\)\s]/g, '');
  try { return Function(`return (${cleaned})`)(); } catch { return null; }
}

async function processCommand(raw) {
  const command = raw.trim();
  if (!command) return;
  addChat(command, 'user');
  addHistory(command);

  const cmd = command.toLowerCase();

  // ToDo voice commands
  if (cmd.startsWith('add task') || cmd.startsWith('add todo') || cmd.startsWith('add')) {
    // patterns: "add task buy milk", "add buy milk"
    const text = command.replace(/^(add task|add todo|add)\s*/i, '').trim();
    if (text) { addTodo(text); return; }
  }
  if (cmd.startsWith('delete task') || cmd.startsWith('remove task') || cmd.startsWith('delete')) {
    // allow "delete task 2" or "delete buy milk"
    const after = command.replace(/^(delete task|remove task|delete)\s*/i, '').trim();
    // if numeric
    if (/^\d+$/.test(after)) {
      deleteTodo(parseInt(after) - 1);
      return;
    } else if (after) {
      // find index by text
      const arr = readTodos(); const idx = arr.findIndex(x => x.toLowerCase().includes(after.toLowerCase()));
      if (idx !== -1) { deleteTodo(idx); return; }
    }
  }
  if (cmd.includes('list tasks') || cmd.includes('show tasks') || cmd.includes('list todos') || cmd.includes('show todos')) {
    const arr = readTodos();
    if (!arr.length) {
      addChat('No tasks found.', 'bot'); speak('You have no tasks.');
    } else {
      addChat('Your tasks:\n' + arr.map((t, i) => `${i+1}. ${t}`).join('\n'), 'bot');
      speak(`You have ${arr.length} tasks.`);
    }
    return;
  }

  // Calculator
  const calcMatch = cmd.match(/(?:calculate|what is|what's|evaluate)\s+(.+)/i);
  if (calcMatch) {
    const res = safeEvalMath(calcMatch[1]);
    if (res !== null) { addChat(`Result: ${res}`, 'bot'); speak(`Result is ${res}`); return; }
    else { addChat("Couldn't calculate that.", 'bot'); speak("I couldn't calculate that."); return; }
  }

  // Basic intents
  if (/\b(hi|hello|hey)\b/i.test(cmd)) {
    addChat("Hello! How can I help you today?", 'bot'); speak("Hello! How can I help you today?");
  } else if (cmd.includes('time')) {
    const t = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    addChat(`Time: ${t}`, 'bot'); speak(`Current time is ${t}`);
  } else if (cmd.includes('date')) {
    const d = new Date().toLocaleDateString();
    addChat(`Date: ${d}`, 'bot'); speak(`Today's date is ${d}`);
  } else if (cmd.includes('youtube')) {
    addChat('Opening YouTube', 'bot'); speak('Opening YouTube'); window.open('https://youtube.com','_blank');
  } else if (cmd.includes('google') || cmd.startsWith('search')) {
    const q = command.replace(/^(search for|search)\s*/i,'').trim() || command;
    addChat(`Searching: ${q}`, 'bot'); speak(`Searching for ${q}`); window.open(`https://google.com/search?q=${encodeURIComponent(q)}`,'_blank');
  } else if (cmd.includes('wikipedia')) {
    const q = command.replace(/wikipedia/i,'').trim() || command;
    addChat(`Opening Wikipedia for ${q}`, 'bot'); speak(`Opening Wikipedia for ${q}`); window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(q)}`,'_blank');
  } else if (cmd.includes('weather')) {
    // Example: To enable real weather, uncomment below and add API key.
    /* 
    const city = 'Delhi';
    const key = 'YOUR_OPENWEATHER_API_KEY';
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${key}`);
      const data = await res.json();
      if (data && data.main) {
        const txt = `${data.weather[0].description}, ${data.main.temp} °C`;
        addChat(`Weather in ${city}: ${txt}`, 'bot'); speak(`Weather in ${city} is ${txt}`);
      } else { addChat('Could not fetch weather.', 'bot'); speak('Could not fetch weather'); }
    } catch(e) { addChat('Weather error', 'bot'); speak('Error fetching weather'); }
    */
    addChat("Weather module not configured. Add OpenWeather API key in script.js to enable.", 'bot');
    speak("Weather is not configured. You can add an API key to get live weather.");
  } else if (cmd.includes('joke')) {
    const j = jokes[Math.floor(Math.random()*jokes.length)];
    addChat(j,'bot'); speak(j);
  } else if (cmd.includes('who are you')) {
    addChat("I'm Xavier, your smart assistant. I can manage tasks, open websites, tell time and more.", 'bot'); speak("I'm Xavier, your smart assistant.");
  } else {
    // Fallback: open google search, or optionally send to backend AI (ChatGPT)
    addChat(`I searched the web for: ${command}`, 'bot'); speak('I found some results on web.');
    window.open(`https://google.com/search?q=${encodeURIComponent(command)}`, '_blank');
  }
}

/* ---------- Events ---------- */
// Voice recognition
if (recognition) {
  recognition.onstart = () => { status.textContent = 'Listening...'; micBtn.classList.add('active'); };
  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    processCommand(text);
  };
  recognition.onend = () => { status.textContent = 'Ready to help!'; micBtn.classList.remove('active'); };
  recognition.onerror = () => { status.textContent = 'Could not hear you clearly'; micBtn.classList.remove('active'); };
}

micBtn.addEventListener('click', () => {
  if (!recognition) { alert('Speech recognition not supported in this browser.'); return; }
  try { recognition.start(); } catch(e){ recognition.stop(); recognition.start(); }
});

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') { const v = chatInput.value.trim(); if (v) { processCommand(v); chatInput.value=''; } }
});
sendBtn.addEventListener('click', () => { const v = chatInput.value.trim(); if (v) { processCommand(v); chatInput.value=''; } });

// Quick buttons
quickBtns.forEach(b => b.addEventListener('click', () => processCommand(b.dataset.cmd)));

// ToDo UI
addTodoBtn.addEventListener('click', () => { const v = todoInput.value.trim(); if (v) { addTodo(v); todoInput.value=''; } });
todoInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { addTodoBtn.click(); } });

todoList.addEventListener('click', (e) => {
  if (e.target.classList.contains('del')) {
    const idx = parseInt(e.target.dataset.i,10);
    deleteTodo(idx);
  }
});
clearTodos.addEventListener('click', () => clearAllTodos());

aiCircle.addEventListener('click', () => {
  const greetings = ["Hello! How can I assist you?", "Hi there! Ready to help!", "Hey! What would you like to do?"];
  const g = greetings[Math.floor(Math.random()*greetings.length)];
  addChat(g,'bot'); speak(g);
});

// render on load
renderHistory();
renderTodos();
status.textContent = 'Ready to help!';
setTimeout(()=> speak('Xavier is ready'),900);

// expose some functions for inline use (optional)
window.addTodo = addTodo;
window.deleteTodo = deleteTodo;
window.listTodos = () => addChat(readTodos().join('\n') || 'No tasks','bot');
