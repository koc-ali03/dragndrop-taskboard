const defaultColumnIds = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

document.addEventListener("DOMContentLoaded", function() {
    loadColumnsFromLocalStorage();

    document.getElementById('arrow-container').addEventListener('mouseenter', showPanel);

    document.getElementById('control-panel').addEventListener('mouseenter', showPanel);
    
    document.getElementById('control-panel').addEventListener('mouseleave', slideOut);
    
    document.querySelectorAll('.column').forEach(addColumnGlow);
});

function showPanel() {
    document.getElementById('control-panel').classList.add('show-panel');
    document.getElementById('arrow-container').classList.add('slide-out');
}

function slideOut() {
    document.getElementById('control-panel').classList.remove('show-panel');
    document.getElementById('arrow-container').classList.remove('slide-out');
}

function resetButton() {
    if (confirm("Are you sure you want to delete all columns and tasks?")) {
        localStorage.clear();
        location.reload();
    }
}

function resetTasksButton() {
    if (confirm("Are you sure you want to delete all tasks?")) {
        let savedColumns = JSON.parse(localStorage.getItem('columns'));
        
        savedColumns.forEach(column => {
            document.getElementById(`${column.id}-tasks`).innerHTML = "";
            localStorage.removeItem(column.id);
        });
    }
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const task = document.getElementById(data);

    const oldColumn = task.parentElement.id;

    if (ev.target.className === "task") {
        ev.target.parentElement.insertBefore(task, ev.target);
    }
    else if (ev.target.parentElement.className === "task") {
        ev.target.parentElement.parentElement.insertBefore(task, ev.target.parentElement);
    }
    else if (ev.target.className === "task-list") {
        ev.target.appendChild(task);
    }

    const newColumn = task.parentElement.id;
    if (oldColumn !== newColumn) { saveTasks(oldColumn.replace('-tasks', '')); }
    saveTasks(newColumn.replace('-tasks', ''));
}

function addColumnGlow(column) {
    column.addEventListener('mousemove', function(e) {
        let rect = column.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        column.style.setProperty('--mouse-x', `${x}px`);
        column.style.setProperty('--mouse-y', `${y}px`);
    });

    column.addEventListener('mouseleave', function() {
        column.classList.remove('glow');
        column.classList.add('no-glow');
    });

    column.addEventListener('mouseenter', function() {
        column.classList.add('glow');
        column.classList.remove('no-glow');
    });
}

function addTask(columnId) {
    const input = document.getElementById(`${columnId}-input`);
    const taskText = input.value.trim();

    if (taskText !== "") {
        const taskList = document.getElementById(`${columnId}-tasks`);
        const newTask = document.createElement("div");

        newTask.className = "task";
        newTask.id = `task-${new Date().getTime()}`;
        newTask.draggable = true;
        newTask.ondragstart = drag;

        const taskContent = document.createElement("span");
        taskContent.textContent = taskText;

        const saveBtn = document.createElement("button");
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
        saveBtn.className = "save-btn";
        saveBtn.style.display = 'none';

        const editBtn = document.createElement("button");
        editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
        editBtn.className = "edit-btn";
        editBtn.onclick = function () {
            editTask(saveBtn, editBtn, taskContent, columnId);
        };
        editBtn.style.display = 'inline-block';

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        deleteBtn.className = "delete-btn";
        deleteBtn.onclick = function () {
            newTask.parentElement.removeChild(newTask);
            saveTasks(columnId);
        };
        deleteBtn.style.display = 'inline-block';

        newTask.appendChild(taskContent);
        newTask.appendChild(saveBtn);
        newTask.appendChild(editBtn);
        newTask.appendChild(deleteBtn);
        taskList.appendChild(newTask);

        input.value = "";
        saveTasks(columnId);
    }
}

function editTask(saveBtn, editBtn, taskContent, columnId) {
    saveBtn.style.display = 'inline-block';
    editBtn.style.display = 'none';

    const currentText = taskContent.textContent;
    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.value = currentText;
    inputField.className = "edit-input";

    saveBtn.onclick = function () {
        saveTask(saveBtn, editBtn, taskContent, inputField.value.trim(), columnId);
    };

    taskContent.textContent = "";
    taskContent.appendChild(inputField);

    inputField.focus();

    inputField.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            saveTask(saveBtn, editBtn, taskContent, inputField.value.trim(), columnId);
            event.preventDefault();
        }
    });
}

function saveTask(saveBtn, editBtn, taskContent, newText, columnId) {
    saveBtn.style.display = 'none';
    editBtn.style.display = 'inline-block';

    taskContent.textContent = newText;
    saveTasks(columnId);
}

function saveTasks(columnId) {
    const taskList = document.getElementById(`${columnId}-tasks`);
    const tasks = Array.from(taskList.children).map(task => ({
        id: task.id,
        text: task.querySelector('span').textContent,
    }));

    localStorage.setItem(columnId, JSON.stringify(tasks));

    saveColumnsToLocalStorage();
}

function loadTasks(columnId) {
    const tasks = JSON.parse(localStorage.getItem(columnId)) || [];
    const taskList = document.getElementById(`${columnId}-tasks`);

    tasks.forEach(task => {
        const taskList = document.getElementById(`${columnId}-tasks`);
        const newTask = document.createElement("div");

        newTask.className = "task";
        newTask.id = task.id;
        newTask.draggable = true;
        newTask.ondragstart = drag;

        const taskContent = document.createElement("span");
        taskContent.textContent = task.text;

        const saveBtn = document.createElement("button");
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
        saveBtn.className = "save-btn";
        saveBtn.style.display = 'none';

        const editBtn = document.createElement("button");
        editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
        editBtn.className = "edit-btn";
        editBtn.onclick = function () {
            editTask(saveBtn, editBtn, taskContent, columnId);
        };
        editBtn.style.display = 'inline-block';

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        deleteBtn.className = "delete-btn";
        deleteBtn.onclick = function () {
            newTask.parentElement.removeChild(newTask);
            saveTasks(columnId);
        };
        deleteBtn.style.display = 'inline-block';

        newTask.appendChild(taskContent);
        newTask.appendChild(saveBtn);
        newTask.appendChild(editBtn);
        newTask.appendChild(deleteBtn);
        taskList.appendChild(newTask);
    });
}

document.getElementById('add-column').addEventListener('click', function() {
    let deletedDefaultColumns = JSON.parse(localStorage.getItem('deletedDefaultColumns')) || [];
    let columnTitle = prompt("Enter the title for the new column:");

    if (columnTitle) {
        let columnId = columnTitle.trim().toLowerCase().replace(/\s+/g, '-');

        if (columnId === "add-column") {
            alert("This title is reserved for the column creator. Please choose a different title.");
            return;
        }

        if (document.getElementById(columnId)) {
            alert("A column with this title already exists. Please choose a different title.");
            return;
        }

        if (deletedDefaultColumns.includes(columnId)) {
            deletedDefaultColumns.splice(deletedDefaultColumns.indexOf(columnId), 1);
            localStorage.setItem('deletedDefaultColumns', JSON.stringify(deletedDefaultColumns));
        }

        createColumnElement(columnId, columnTitle);
    }
});

function createColumnElement(columnId, columnTitle) {
    let deletedDefaultColumns = JSON.parse(localStorage.getItem('deletedDefaultColumns')) || [];
    
    if (document.getElementById(columnId) || deletedDefaultColumns.includes(columnId)) return;

    let newColumn = document.createElement('div');
    newColumn.classList.add('column');
    newColumn.setAttribute('id', columnId);

    newColumn.innerHTML = `
        <h2>${columnTitle}</h2>
        <button class="delete-column-btn" onclick="deleteColumn('${columnId}')"><i class="fa-solid fa-xmark"></i></button>
        <div class="task-list" id="${columnId}-tasks" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
        <input type="text" placeholder="New task..." id="${columnId}-input" onkeypress="handleKeyPress(event, '${columnId}')">
        <button class="add-task-btn" onclick="addTask('${columnId}')"><i class="fas fa-plus"></i> Add Task</button>
    `;

    document.getElementById('task-board').insertBefore(newColumn, document.getElementById('add-column'));

    addColumnGlow(newColumn);

    saveColumnsToLocalStorage();
}

function saveColumnsToLocalStorage() {
    let columns = [];
    
    document.querySelectorAll('.column').forEach((column) => {
        let columnId = column.getAttribute('id');
        if (columnId !== 'add-column') {
            let columnTitle = column.querySelector('h2').textContent;

            columns.push({ id: columnId, title: columnTitle});
        }
    });

    localStorage.setItem('columns', JSON.stringify(columns));
}

function loadColumnsFromLocalStorage() {
    let savedColumns = JSON.parse(localStorage.getItem('columns'));
    let deletedDefaultColumns = JSON.parse(localStorage.getItem('deletedDefaultColumns')) || [];

    defaultColumnIds.forEach(columnId => {
        if (!savedColumns || !savedColumns.some(column => column.id === columnId)) {
            if (!deletedDefaultColumns.includes(columnId)) {
                createColumnElement(columnId, capitalizeFirstLetter(columnId));
            }
        }
    });

    if (savedColumns && Array.isArray(savedColumns)) {
        savedColumns.forEach((column) => {
            createColumnElement(column.id, column.title);

            loadTasks(column.id);
        });
    }
}

function deleteColumn(columnId) {
    if (confirm("Are you sure you want to delete this column and all tasks within it?")) {
        document.getElementById(`${columnId}-tasks`).innerHTML = "";
        localStorage.removeItem(columnId);

        document.getElementById(columnId).parentNode.removeChild(document.getElementById(columnId));

        if (defaultColumnIds.includes(columnId)) {
            let deletedDefaultColumns = JSON.parse(localStorage.getItem('deletedDefaultColumns')) || [];
            deletedDefaultColumns.push(columnId);
            localStorage.setItem('deletedDefaultColumns', JSON.stringify(deletedDefaultColumns));
        }

        saveColumnsToLocalStorage();
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function handleKeyPress(event, columnId) {
    if (event.key === 'Enter') {
        addTask(columnId);
        event.preventDefault();
    }
}