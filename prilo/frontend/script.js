document.addEventListener('DOMContentLoaded', () => {
    // Назначаем обработчики событий
    document.getElementById('registerBtn').addEventListener('click', handleRegister);
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('addTaskBtn').addEventListener('click', handleCreateTask);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    checkAuthStatus();
});

let token = localStorage.getItem('token') || '';

async function checkAuthStatus() {
    if (!token) {
        showAuthSection();
        return;
    }

    try {
        const response = await fetch('/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showTaskSection();
            await loadTasks();
        } else {
            handleLogout();
        }
    } catch (error) {
        handleLogout();
    }
}

async function handleRegister() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert('Please fill all fields');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please login.');
            clearInputs();
        } else {
            alert(data.detail || 'Registration failed');
        }
    } catch (error) {
        alert('Connection error');
    }
}

async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert('Please fill all fields');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
        }

        const { access_token } = await response.json();
        token = access_token;
        localStorage.setItem('token', token);

        showTaskSection();
        await loadTasks();
        clearInputs();
    } catch (error) {
        alert(error.message);
    }
}

async function loadTasks() {
    try {
        const response = await fetch('/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load tasks');

        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        alert(error.message);
        handleLogout();
    }
}

function renderTasks(tasks) {
    const ul = document.getElementById('tasks');
    ul.innerHTML = '';

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${task.title}</strong>
            ${task.description ? `<p>${task.description}</p>` : ''}
        `;
        ul.appendChild(li);
    });
}

async function handleCreateTask() {
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-desc').value.trim();

    if (!title) {
        alert('Task title is required');
        return;
    }

    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to create task');
        }

        document.getElementById('task-title').value = '';
        document.getElementById('task-desc').value = '';
        await loadTasks();
    } catch (error) {
        alert(error.message);
    }
}

function handleLogout() {
    token = '';
    localStorage.removeItem('token');
    showAuthSection();
    clearInputs();
}

function showAuthSection() {
    document.getElementById('auth').style.display = 'block';
    document.getElementById('task-section').style.display = 'none';
}

function showTaskSection() {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('task-section').style.display = 'block';
}

function clearInputs() {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';
}