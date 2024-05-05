let db;

document.addEventListener("DOMContentLoaded", () => {
    const request = indexedDB.open("tasksDatabase", 1);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains('tasks')) {
            db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        loadTasks();
    };

    const form = document.getElementById('task-form');
    form.onsubmit = addTask;
});

function addTask(e) {
    e.preventDefault();
    const content = document.getElementById('task-content').value;
    document.getElementById('task-content').value = '';
    const transaction = db.transaction(["tasks"], "readwrite");
    const store = transaction.objectStore("tasks");
    store.add({ content, status: 1 }).onsuccess = () => {
        loadTasks();
    };
}

function loadTasks() {
    const transaction = db.transaction(["tasks"], "readonly");
    const store = transaction.objectStore("tasks");
    const cursor = store.openCursor();
    const tasksList = document.getElementById('task-list');
    tasksList.innerHTML = '';

    cursor.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            if (cursor.value.status === 1) {  // Solo mostrar tareas con estado 1
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.textContent = cursor.value.content;

                const actionContainer = document.createElement('div');

                const editButton = document.createElement('button');
                editButton.textContent = 'Editar';
                editButton.className = 'btn btn-outline-primary btn-sm';
                editButton.onclick = () => showEditTask(cursor.key, cursor.value.content);
                actionContainer.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Eliminar';
                deleteButton.className = 'btn btn-outline-danger btn-sm';
                deleteButton.onclick = () => deleteTask(cursor.key);
                actionContainer.appendChild(deleteButton);

                li.appendChild(actionContainer);
                tasksList.appendChild(li);
            }
            cursor.continue();
        }
    };
}


function showEditTask(id, content) {
    document.getElementById('edit-task-id').value = id;
    document.getElementById('edit-task-content').value = content;
    toggleEditCard(true);
}

function updateTask() {
    const id = parseInt(document.getElementById('edit-task-id').value, 10);
    const content = document.getElementById('edit-task-content').value;
    const transaction = db.transaction(["tasks"], "readwrite");
    const store = transaction.objectStore("tasks");
    const request = store.get(id);

    request.onsuccess = () => {
        const data = request.result;
        data.content = content;  // Actualizar el contenido
        // El estado (status) se mantiene, no necesitamos modificarlo aquí
        store.put(data).onsuccess = () => {
            loadTasks();
            toggleEditCard(false);
        };
    };
}


function deleteTask(id) {
    const transaction = db.transaction(["tasks"], "readwrite");
    const store = transaction.objectStore("tasks");
    const request = store.get(id);
    request.onsuccess = () => {
        const data = request.result;
        data.status = 0;  // Cambiar el estado a "eliminado"
        store.put(data).onsuccess = () => {
            loadTasks();
        };
    };
}

function toggleEditCard(show) {
    const card = document.getElementById('edit-task-card');
    const overlay = document.getElementById('overlay'); // Obtener referencia al overlay
    if (show) {
        card.style.display = 'block';
        overlay.style.display = 'block'; // Mostrar el overlay
    } else {
        card.style.display = 'none';
        overlay.style.display = 'none'; // Ocultar el overlay
    }
}
