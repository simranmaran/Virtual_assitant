// Enhanced Xavier AI - Professional Assistant
// Advanced features with improved responsiveness

class XavierAI {
    constructor() {
        this.recognition = null;
        this.synth = window.speechSynthesis;
        this.isListening = false;
        this.todos = this.loadTodos();
        this.activities = this.loadActivities();
        this.chatCount = 0;
        this.currentFilter = 'all';
        this.editingTodoIndex = -1;
        
        this.initElements();
        this.initSpeech();
        this.initEventListeners();
        this.renderTodos();
        this.renderActivities();
        this.updateStats();
        this.initWelcome();
    }
    
    initElements() {
        // Header elements
        this.aiAvatar = document.getElementById('aiAvatar');
        this.status = document.getElementById('status');
        this.themeToggle = document.getElementById('themeToggle');
        this.menuToggle = document.getElementById('menuToggle');
        
        // Voice control
        this.micBtn = document.getElementById('micBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        
        // Chat elements
        this.chatBox = document.getElementById('chatBox');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.clearChat = document.getElementById('clearChat');
        
        // Todo elements
        this.todoInput = document.getElementById('todoInput');
        this.todoPriority = document.getElementById('todoPriority');
        this.todoDueDate = document.getElementById('todoDueDate');
        this.addTodoBtn = document.getElementById('addTodoBtn');
        this.todoList = document.getElementById('todoList');
        this.todoCount = document.getElementById('todoCount');
        this.clearCompleted = document.getElementById('clearCompleted');
        this.exportTodos = document.getElementById('exportTodos');
        
        // Filter buttons
        this.filterBtns = document.querySelectorAll('.filter-btn');
        
        // Stats elements
        this.completedTasks = document.getElementById('completedTasks');
        this.pendingTasks = document.getElementById('pendingTasks');
        this.chatCountEl = document.getElementById('chatCount');
        this.streakCount = document.getElementById('streakCount');
        
        // Modal elements
        this.editModal = document.getElementById('editModal');
        this.editTodoText = document.getElementById('editTodoText');
        this.editTodoPriority = document.getElementById('editTodoPriority');
        this.editTodoDueDate = document.getElementById('editTodoDueDate');
        this.editTodoCategory = document.getElementById('editTodoCategory');
        this.modalClose = document.getElementById('modalClose');
        this.cancelEdit = document.getElementById('cancelEdit');
        this.saveEdit = document.getElementById('saveEdit');
        
        // Quick action buttons
        this.actionBtns = document.querySelectorAll('.action-btn');
        
        // Activity list
        this.activityList = document.getElementById('activityList');
        
        // Loading and toast
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.toastContainer = document.getElementById('toastContainer');
    }
    
    initSpeech() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => this.onSpeechStart();
            this.recognition.onresult = (event) => this.onSpeechResult(event);
            this.recognition.onend = () => this.onSpeechEnd();
            this.recognition.onerror = (event) => this.onSpeechError(event);
        }
    }
    
    initEventListeners() {
        // Voice controls
        this.micBtn?.addEventListener('click', () => this.startListening());
        this.voiceBtn?.addEventListener('click', () => this.startListening());
        
        // Chat controls
        this.sendBtn?.addEventListener('click', () => this.sendMessage());
        this.chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.clearChat?.addEventListener('click', () => this.clearChatHistory());
        
        // Todo controls
        this.addTodoBtn?.addEventListener('click', () => this.addTodo());
        this.todoInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        this.clearCompleted?.addEventListener('click', () => this.clearCompletedTodos());
        this.exportTodos?.addEventListener('click', () => this.exportTodoList());
        
        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => this.setFilter(btn.dataset.filter));
        });
        
        // Todo list events (delegation)
        this.todoList?.addEventListener('click', (e) => this.handleTodoAction(e));
        
        // Modal controls
        this.modalClose?.addEventListener('click', () => this.closeModal());
        this.cancelEdit?.addEventListener('click', () => this.closeModal());
        this.saveEdit?.addEventListener('click', () => this.saveEditedTodo());
        
        // Quick actions
        this.actionBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleQuickAction(btn.dataset.cmd));
        });
        
        // Theme toggle
        this.themeToggle?.addEventListener('click', () => this.toggleTheme());
        
        // Menu toggle for mobile
        this.menuToggle?.addEventListener('click', () => this.toggleMobileMenu());
        
        // AI Avatar click
        this.aiAvatar?.addEventListener('click', () => this.greetUser());
        
        // Modal overlay click to close
        this.editModal?.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.closeModal();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Auto-save todos on page unload
        window.addEventListener('beforeunload', () => this.saveTodos());
    }
    
    initWelcome() {
        setTimeout(() => {
            this.speak("Xavier AI is ready to assist you!");
            this.updateStatus("Ready to help!");
        }, 1000);
    }
    
    // Speech Recognition Methods
    onSpeechStart() {
        this.isListening = true;
        this.updateStatus("Listening...");
        this.micBtn?.classList.add('active');
        this.voiceBtn?.classList.add('active');
    }
    
    onSpeechResult(event) {
        const transcript = event.results[0][0].transcript.trim();
        this.processVoiceCommand(transcript);
    }
    
    onSpeechEnd() {
        this.isListening = false;
        this.updateStatus("Ready to help!");
        this.micBtn?.classList.remove('active');
        this.voiceBtn?.classList.remove('active');
    }
    
    onSpeechError(event) {
        this.isListening = false;
        this.updateStatus("Could not hear clearly");
        this.micBtn?.classList.remove('active');
        this.voiceBtn?.classList.remove('active');
        this.showToast(`Speech error: ${event.error}`, 'error');
    }
    
    startListening() {
        if (!this.recognition) {
            this.showToast('Speech recognition not supported', 'error');
            return;
        }
        
        if (this.isListening) {
            this.recognition.stop();
            return;
        }
        
        try {
            this.recognition.start();
        } catch (error) {
            this.showToast('Microphone access denied', 'error');
        }
    }
    
    // Voice Command Processing
    processVoiceCommand(command) {
        this.addChatMessage(command, 'user');
        this.addActivity(`Voice command: "${command}"`);
        this.processCommand(command);
    }
    
    // Enhanced Command Processing
    async processCommand(input) {
        if (!input.trim()) return;
        
        const command = input.toLowerCase().trim();
        this.chatCount++;
        this.updateStats();
        
        this.showLoading(true);
        
        try {
            // Todo commands
            if (this.handleTodoCommands(command, input)) return;
            
            // Calculator commands
            if (this.handleCalculatorCommands(command)) return;
            
            // System commands
            if (this.handleSystemCommands(command)) return;
            
            // Web commands
            if (this.handleWebCommands(command, input)) return;
            
            // Greeting commands
            if (this.handleGreetingCommands(command)) return;
            
            // Default: search the web
            this.handleWebSearch(input);
            
        } catch (error) {
            this.addChatMessage("I encountered an error processing your request.", 'bot');
            this.speak("I encountered an error processing your request.");
        } finally {
            this.showLoading(false);
        }
    }
    
    handleTodoCommands(command, input) {
        // Add task commands
        const addPatterns = [
            /^add task (.+)/i,
            /^add todo (.+)/i,
            /^create task (.+)/i,
            /^new task (.+)/i,
            /^add (.+)/i
        ];
        
        for (const pattern of addPatterns) {
            const match = input.match(pattern);
            if (match) {
                this.addTodoFromVoice(match[1]);
                return true;
            }
        }
        
        // Complete task commands
        if (command.includes('complete task') || command.includes('mark done') || command.includes('finish task')) {
            const taskNumber = this.extractNumber(command);
            if (taskNumber) {
                this.completeTodoByNumber(taskNumber - 1);
                return true;
            }
        }
        
        // Delete task commands
        if (command.includes('delete task') || command.includes('remove task')) {
            const taskNumber = this.extractNumber(command);
            if (taskNumber) {
                this.deleteTodoByNumber(taskNumber - 1);
                return true;
            }
        }
        
        // List tasks commands
        if (command.includes('list tasks') || command.includes('show tasks') || command.includes('my tasks')) {
            this.listAllTasks();
            return true;
        }
        
        return false;
    }
    
    handleCalculatorCommands(command) {
        const calcPatterns = [
            /calculate (.+)/i,
            /what is (.+)/i,
            /what's (.+)/i,
            /compute (.+)/i,
            /solve (.+)/i
        ];
        
        for (const pattern of calcPatterns) {
            const match = command.match(pattern);
            if (match) {
                const result = this.evaluateExpression(match[1]);
                if (result !== null) {
                    this.addChatMessage(`Result: ${result}`, 'bot');
                    this.speak(`The result is ${result}`);
                    this.addActivity(`Calculated: ${match[1]} = ${result}`);
                    return true;
                }
            }
        }
        
        return false;
    }
    
    handleSystemCommands(command) {
        if (command.includes('time') || command === 'what time is it') {
            const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            this.addChatMessage(`Current time: ${time}`, 'bot');
            this.speak(`The current time is ${time}`);
            return true;
        }
        
        if (command.includes('date') || command === 'what date is it') {
            const date = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            this.addChatMessage(`Today is ${date}`, 'bot');
            this.speak(`Today is ${date}`);
            return true;
        }
        
        if (command.includes('weather')) {
            this.getWeather();
            return true;
        }
        
        return false;
    }
    
    handleWebCommands(command, input) {
        if (command.includes('youtube') || command.includes('open youtube')) {
            this.addChatMessage('Opening YouTube...', 'bot');
            this.speak('Opening YouTube');
            this.openWebsite('https://youtube.com');
            this.addActivity('Opened YouTube');
            return true;
        }
        
        if (command.includes('google') || command.startsWith('search for') || command.startsWith('search')) {
            const query = input.replace(/^(google|search for|search)\s*/i, '').trim() || input;
            this.performWebSearch(query);
            return true;
        }
        
        if (command.includes('news') || command.includes('latest news')) {
            this.addChatMessage('Opening latest news...', 'bot');
            this.speak('Opening latest news');
            this.openWebsite('https://news.google.com');
            this.addActivity('Checked latest news');
            return true;
        }
        
        return false;
    }
    
    handleGreetingCommands(command) {
        const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
        
        if (greetings.some(greeting => command.includes(greeting))) {
            const responses = [
                "Hello! How can I assist you today?",
                "Hi there! What would you like to do?",
                "Hey! I'm ready to help you with anything.",
                "Good to see you! How can I make your day better?"
            ];
            const response = responses[Math.floor(Math.random() * responses.length)];
            this.addChatMessage(response, 'bot');
            this.speak(response);
            return true;
        }
        
        if (command.includes('how are you') || command.includes('how do you do')) {
            const response = "I'm doing great and ready to help you! What can I do for you today?";
            this.addChatMessage(response, 'bot');
            this.speak(response);
            return true;
        }
        
        return false;
    }
    
    // Utility Methods
    extractNumber(text) {
        const match = text.match(/\d+/);
        return match ? parseInt(match[0]) : null;
    }
    
    evaluateExpression(expr) {
        try {
            // Clean the expression to prevent code injection
            const cleaned = expr.replace(/[^0-9+\-*/().% ]/g, '');
            if (!cleaned) return null;
            
            // Use Function constructor for safer evaluation
            const result = Function('"use strict"; return (' + cleaned + ')')();
            return isFinite(result) ? parseFloat(result.toFixed(10)) : null;
        } catch (error) {
            return null;
        }
    }
    
    performWebSearch(query) {
        this.addChatMessage(`Searching for: "${query}"`, 'bot');
        this.speak(`Searching for ${query}`);
        this.openWebsite(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
        this.addActivity(`Searched: ${query}`);
    }
    
    openWebsite(url) {
        window.open(url, '_blank');
    }
    
    async getWeather() {
        // Placeholder for weather functionality
        // In a real implementation, you would use a weather API
        const weatherResponse = "Weather information requires API integration. Please add your weather API key.";
        this.addChatMessage(weatherResponse, 'bot');
        this.speak("Weather information is not configured yet.");
    }
    
    // Todo Management Methods
    addTodo() {
        const text = this.todoInput.value.trim();
        const priority = this.todoPriority.value;
        const dueDate = this.todoDueDate.value;
        
        if (!text) {
            this.showToast('Please enter a task description', 'warning');
            return;
        }
        
        const todo = {
            id: Date.now(),
            text: text,
            priority: priority,
            dueDate: dueDate,
            completed: false,
            createdAt: new Date().toISOString(),
            category: 'personal'
        };
        
        this.todos.push(todo);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
        
        // Clear inputs
        this.todoInput.value = '';
        this.todoDueDate.value = '';
        
        this.showToast(`Task added: ${text}`, 'success');
        this.addActivity(`Added task: ${text}`);
        this.addChatMessage(`Task added: ${text}`, 'bot');
    }
    
    addTodoFromVoice(text) {
        const todo = {
            id: Date.now(),
            text: text,
            priority: 'medium',
            dueDate: '',
            completed: false,
            createdAt: new Date().toISOString(),
            category: 'personal'
        };
        
        this.todos.push(todo);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
        
        this.addChatMessage(`Task added: ${text}`, 'bot');
        this.speak(`Task added: ${text}`);
        this.addActivity(`Added task via voice: ${text}`);
        this.showToast(`Task added: ${text}`, 'success');
    }
    
    completeTodoByNumber(index) {
        if (index >= 0 && index < this.todos.length) {
            this.todos[index].completed = !this.todos[index].completed;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            const status = this.todos[index].completed ? 'completed' : 'reopened';
            const message = `Task ${status}: ${this.todos[index].text}`;
            this.addChatMessage(message, 'bot');
            this.speak(message);
            this.addActivity(message);
        }
    }
    
    deleteTodoByNumber(index) {
        if (index >= 0 && index < this.todos.length) {
            const deletedTodo = this.todos.splice(index, 1)[0];
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            const message = `Task deleted: ${deletedTodo.text}`;
            this.addChatMessage(message, 'bot');
            this.speak(message);
            this.addActivity(message);
            this.showToast(message, 'success');
        }
    }
    
    listAllTasks() {
        const pendingTasks = this.todos.filter(todo => !todo.completed);
        
        if (pendingTasks.length === 0) {
            const message = "You have no pending tasks. Great job!";
            this.addChatMessage(message, 'bot');
            this.speak(message);
            return;
        }
        
        let taskList = "Your pending tasks:\n";
        pendingTasks.forEach((todo, index) => {
            taskList += `${index + 1}. ${todo.text}`;
            if (todo.priority === 'high' || todo.priority === 'urgent') {
                taskList += ` (${todo.priority} priority)`;
            }
            taskList += "\n";
        });
        
        this.addChatMessage(taskList, 'bot');
        this.speak(`You have ${pendingTasks.length} pending tasks.`);
    }
    
    handleTodoAction(event) {
        const target = event.target;
        const todoItem = target.closest('.todo-item');
        if (!todoItem) return;
        
        const todoId = parseInt(todoItem.dataset.id);
        const todoIndex = this.todos.findIndex(todo => todo.id === todoId);
        
        if (target.classList.contains('todo-checkbox')) {
            this.toggleTodo(todoIndex);
        } else if (target.classList.contains('todo-edit-btn')) {
            this.editTodo(todoIndex);
        } else if (target.classList.contains('todo-delete-btn')) {
            this.deleteTodo(todoIndex);
        }
    }
    
    toggleTodo(index) {
        if (index >= 0 && index < this.todos.length) {
            this.todos[index].completed = !this.todos[index].completed;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            const status = this.todos[index].completed ? 'completed' : 'reopened';
            this.addActivity(`Task ${status}: ${this.todos[index].text}`);
            
            if (this.todos[index].completed) {
                this.showToast('Task completed! 🎉', 'success');
            }
        }
    }
    
    editTodo(index) {
        if (index >= 0 && index < this.todos.length) {
            this.editingTodoIndex = index;
            const todo = this.todos[index];
            
            this.editTodoText.value = todo.text;
            this.editTodoPriority.value = todo.priority;
            this.editTodoDueDate.value = todo.dueDate;
            this.editTodoCategory.value = todo.category || 'personal';
            
            this.showModal();
        }
    }
    
    deleteTodo(index) {
        if (index >= 0 && index < this.todos.length && confirm('Delete this task?')) {
            const deletedTodo = this.todos.splice(index, 1)[0];
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            this.showToast(`Task deleted: ${deletedTodo.text}`, 'success');
            this.addActivity(`Deleted task: ${deletedTodo.text}`);
        }
    }
    
    saveEditedTodo() {
        if (this.editingTodoIndex >= 0 && this.editingTodoIndex < this.todos.length) {
            const todo = this.todos[this.editingTodoIndex];
            todo.text = this.editTodoText.value.trim();
            todo.priority = this.editTodoPriority.value;
            todo.dueDate = this.editTodoDueDate.value;
            todo.category = this.editTodoCategory.value;
            
            this.saveTodos();
            this.renderTodos();
            this.closeModal();
            
            this.showToast('Task updated successfully', 'success');
            this.addActivity(`Updated task: ${todo.text}`);
        }
    }
    
    clearCompletedTodos() {
        const completedCount = this.todos.filter(todo => todo.completed).length;
        
        if (completedCount === 0) {
            this.showToast('No completed tasks to clear', 'info');
            return;
        }
        
        if (confirm(`Clear ${completedCount} completed tasks?`)) {
            this.todos = this.todos.filter(todo => !todo.completed);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            this.showToast(`Cleared ${completedCount} completed tasks`, 'success');
            this.addActivity(`Cleared ${completedCount} completed tasks`);
        }
    }
    
    exportTodoList() {
        const todoData = {
            exported: new Date().toISOString(),
            totalTasks: this.todos.length,
            completedTasks: this.todos.filter(todo => todo.completed).length,
            pendingTasks: this.todos.filter(todo => !todo.completed).length,
            tasks: this.todos
        };
        
        const dataStr = JSON.stringify(todoData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `xavier-tasks-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showToast('Tasks exported successfully', 'success');
        this.addActivity('Exported task list');
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderTodos();
    }
    
    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            case 'pending':
                return this.todos.filter(todo => !todo.completed);
            case 'priority':
                return this.todos
                    .filter(todo => !todo.completed)
                    .sort((a, b) => {
                        const priorities = { urgent: 4, high: 3, medium: 2, low: 1 };
                        return priorities[b.priority] - priorities[a.priority];
                    });
            default:
                return this.todos;
        }
    }
    
    renderTodos() {
        if (!this.todoList) return;
        
        const filteredTodos = this.getFilteredTodos();
        this.todoList.innerHTML = '';
        
        if (filteredTodos.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            emptyMessage.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-tasks" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No ${this.currentFilter === 'all' ? '' : this.currentFilter} tasks found</p>
                </div>
            `;
            this.todoList.appendChild(emptyMessage);
            return;
        }
        
        filteredTodos.forEach((todo, index) => {
            const todoItem = this.createTodoElement(todo, index);
            this.todoList.appendChild(todoItem);
        });
        
        this.updateTodoCount();
    }
    
    createTodoElement(todo, index) {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''} ${todo.priority}-priority`;
        li.dataset.id = todo.id;
        
        const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;
        
        li.innerHTML = `
            <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" title="${todo.completed ? 'Mark as pending' : 'Mark as complete'}"></div>
            <div class="todo-content">
                <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                <div class="todo-meta">
                    <span class="todo-priority ${todo.priority}">${todo.priority}</span>
                    ${todo.dueDate ? `<span class="todo-due ${isOverdue ? 'overdue' : ''}">${this.formatDate(todo.dueDate)}</span>` : ''}
                    ${todo.category ? `<span class="todo-category">${todo.category}</span>` : ''}
                </div>
            </div>
            <div class="todo-actions">
                <button class="todo-edit-btn" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="todo-delete-btn" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return li;
    }
    
    updateTodoCount() {
        if (this.todoCount) {
            this.todoCount.textContent = this.todos.length;
        }
    }
    
    // Chat Methods
    sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;
        
        this.chatInput.value = '';
        this.processCommand(message);
    }
    
    addChatMessage(text, sender = 'bot') {
        if (!this.chatBox) return;
        
        // Remove welcome message if it exists
        const welcomeMessage = this.chatBox.querySelector('.welcome-message');
        if (welcomeMessage && sender === 'user') {
            welcomeMessage.style.display = 'none';
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        
        this.chatBox.appendChild(messageDiv);
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
        
        // Add to activity if it's a bot message
        if (sender === 'bot' && !text.includes('Task') && !text.includes('Searching')) {
            this.addActivity(`Xavier: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
        }
    }
    
    clearChatHistory() {
        if (!this.chatBox) return;
        
        const messages = this.chatBox.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        
        // Show welcome message again
        const welcomeMessage = this.chatBox.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'block';
        }
        
        this.chatCount = 0;
        this.updateStats();
        this.addActivity('Chat history cleared');
    }
    
    // Quick Action Handlers
    handleQuickAction(action) {
        switch (action) {
            case 'time':
                this.processCommand('what time is it');
                break;
            case 'date':
                this.processCommand('what date is it');
                break;
            case 'weather':
                this.processCommand('weather');
                break;
            case 'youtube':
                this.processCommand('open youtube');
                break;
            case 'google':
                this.processCommand('google');
                break;
            case 'calculator':
                this.openCalculator();
                break;
            case 'music':
                this.openMusic();
                break;
            case 'news':
                this.processCommand('latest news');
                break;
            default:
                this.processCommand(action);
        }
    }
    
    openCalculator() {
        this.addChatMessage('Calculator opened. You can ask me to calculate anything!', 'bot');
        this.speak('Calculator is ready. What would you like me to calculate?');
        this.addActivity('Opened calculator');
    }
    
    openMusic() {
        this.addChatMessage('Opening music service...', 'bot');
        this.speak('Opening music service');
        this.openWebsite('https://music.youtube.com');
        this.addActivity('Opened music service');
    }
    
    // Activity Management
    addActivity(activity) {
        const activityItem = {
            text: activity,
            timestamp: new Date().toISOString()
        };
        
        this.activities.unshift(activityItem);
        this.activities = this.activities.slice(0, 50); // Keep only last 50 activities
        
        this.saveActivities();
        this.renderActivities();
    }
    
    renderActivities() {
        if (!this.activityList) return;
        
        this.activityList.innerHTML = '';
        
        this.activities.slice(0, 10).forEach(activity => {
            const activityDiv = document.createElement('div');
            activityDiv.className = 'activity-item';
            
            const timeAgo = this.getTimeAgo(activity.timestamp);
            
            activityDiv.innerHTML = `
                <div class="activity-icon">
                    <i class="fas fa-circle"></i>
                </div>
                <div class="activity-content">
                    <span class="activity-text">${this.escapeHtml(activity.text)}</span>
                    <span class="activity-time">${timeAgo}</span>
                </div>
            `;
            
            this.activityList.appendChild(activityDiv);
        });
    }
    
    // Stats Management
    updateStats() {
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = this.todos.filter(todo => !todo.completed).length;
        
        if (this.completedTasks) this.completedTasks.textContent = completed;
        if (this.pendingTasks) this.pendingTasks.textContent = pending;
        if (this.chatCountEl) this.chatCountEl.textContent = this.chatCount;
        
        // Update streak (simplified - could be enhanced with actual streak logic)
        const streak = Math.max(1, completed);
        if (this.streakCount) this.streakCount.textContent = streak;
    }
    
    // UI Helper Methods
    updateStatus(status) {
        if (this.status) {
            this.status.textContent = status;
        }
    }
    
    speak(text) {
        if (this.synth.speaking) {
            this.synth.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        utterance.onstart = () => this.updateStatus('Speaking...');
        utterance.onend = () => this.updateStatus('Ready to help!');
        
        this.synth.speak(utterance);
    }
    
    showModal() {
        if (this.editModal) {
            this.editModal.classList.add('active');
            this.editTodoText.focus();
        }
    }
    
    closeModal() {
        if (this.editModal) {
            this.editModal.classList.remove('active');
            this.editingTodoIndex = -1;
        }
    }
    
    showLoading(show = true) {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.toggle('active', show);
        }
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            ${message}
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }
    
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    toggleTheme() {
        document.body.classList.toggle('light-theme');
        const isDark = !document.body.classList.contains('light-theme');
        
        if (this.themeToggle) {
            this.themeToggle.innerHTML = `<i class="fas fa-${isDark ? 'sun' : 'moon'}"></i>`;
        }
        
        // Save theme preference
        localStorage.setItem('xavier-theme', isDark ? 'dark' : 'light');
    }
    
    toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const rightSidebar = document.getElementById('rightSidebar');
        
        sidebar?.classList.toggle('mobile-open');
        rightSidebar?.classList.toggle('mobile-open');
    }
    
    greetUser() {
        const greetings = [
            "Hello! How can I assist you today?",
            "Hi there! What would you like to accomplish?",
            "Hey! I'm here to help you stay productive.",
            "Greetings! Ready to tackle your tasks together?"
        ];
        
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        this.addChatMessage(greeting, 'bot');
        this.speak(greeting);
        this.addActivity('Xavier greeted user');
    }
    
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + Enter to send message
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            if (document.activeElement === this.chatInput) {
                this.sendMessage();
            }
        }
        
        // Ctrl/Cmd + K to focus chat input
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            this.chatInput?.focus();
        }
        
        // Ctrl/Cmd + N to add new task
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
            event.preventDefault();
            this.todoInput?.focus();
        }
        
        // Escape to close modal
        if (event.key === 'Escape') {
            this.closeModal();
        }
    }
    
    // Utility Functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
        if (diffDays <= 7) return `In ${diffDays} days`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Local Storage Methods
    loadTodos() {
        try {
            const stored = localStorage.getItem('xavier-todos');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading todos:', error);
            return [];
        }
    }
    
    saveTodos() {
        try {
            localStorage.setItem('xavier-todos', JSON.stringify(this.todos));
        } catch (error) {
            console.error('Error saving todos:', error);
        }
    }
    
    loadActivities() {
        try {
            const stored = localStorage.getItem('xavier-activities');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading activities:', error);
            return [];
        }
    }
    
    saveActivities() {
        try {
            localStorage.setItem('xavier-activities', JSON.stringify(this.activities));
        } catch (error) {
            console.error('Error saving activities:', error);
        }
    }
    
    // Initialize theme
    initTheme() {
        const savedTheme = localStorage.getItem('xavier-theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            if (this.themeToggle) {
                this.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.xavier = new XavierAI();
    window.xavier.initTheme();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause any ongoing speech
        if (window.xavier && window.xavier.synth.speaking) {
            window.xavier.synth.pause();
        }
    } else {
        // Page is visible, resume speech if needed
        if (window.xavier && window.xavier.synth.paused) {
            window.xavier.synth.resume();
        }
    }
});

// Add PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker registration would go here for PWA functionality
    });
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XavierAI;
}