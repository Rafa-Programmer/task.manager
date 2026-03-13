const API_URL = "http://localhost:3000";

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    alert(data.message || data.error);

    if (res.ok) {
      window.location.href = "login.html";
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("name", data.name);
      window.location.href = "index.html";
    } else {
      alert(data.error);
    }
  });
}

if (taskForm) {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
  } else {
    loadTasks();
  }

  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("taskTitle").value;

    const res = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
    });

    if (res.ok) {
      document.getElementById("taskTitle").value = "";
      loadTasks();
    }
  });
}

async function loadTasks() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/tasks`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const tasks = await res.json();
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = task.title;

    if (task.completed) {
      span.classList.add("completed");
    }

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const doneBtn = document.createElement("button");
    doneBtn.textContent = task.completed ? "Desfazer" : "Concluir";
    doneBtn.onclick = () => updateTask(task.id, task.title, !task.completed);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Apagar";
    deleteBtn.onclick = () => deleteTask(task.id);

    actions.appendChild(doneBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(span);
    li.appendChild(actions);
    taskList.appendChild(li);
  });
}

async function updateTask(id, title, completed) {
  const token = localStorage.getItem("token");

  await fetch(`${API_URL}/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, completed }),
  });

  loadTasks();
}

async function deleteTask(id) {
  const token = localStorage.getItem("token");

  await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  loadTasks();
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("name");
  window.location.href = "login.html";
}