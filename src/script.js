/* This file is part of Drag-and-Drop Taskboard

Drag-and-Drop Taskboard is licensed under the GNU General Public License v3. 
See the LICENSE file for details. */

const defaultColumnIds = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

document.addEventListener("DOMContentLoaded", function() {
    loadColumnsFromLocalStorage();

    document.getElementById('arrow-container').addEventListener('mouseenter', showPanel);

    document.getElementById('control-panel').addEventListener('mouseenter', showPanel);
    
    document.getElementById('control-panel').addEventListener('mouseleave', slideOut);
    
    document.querySelectorAll('.column').forEach(addColumnGlow);
});

function showOnHover(event) {
    const column = event.target.closest('.column');
    const task = event.target.closest('.task');

    if (task) {
        const saveBtn = task.querySelector('.save-btn');
        const editBtn = task.querySelector('.edit-btn');
        const deleteBtn = task.querySelector('.delete-btn');

        if (task.querySelector('.edit-input') && saveBtn) {
            saveBtn.style.display = 'inline-block';
        }
        else if (editBtn) {
            editBtn.style.display = 'inline-block';
        }

        if (deleteBtn) {
            deleteBtn.style.display = 'inline-block';
        }
    }
    
    if (column) {
        const swapLeftButton = column.querySelector('.move-column-left');
        const swapRightButton = column.querySelector('.move-column-right');
        const deleteColumnButton = column.querySelector('.delete-column-btn');

        if (swapLeftButton) swapLeftButton.style.display = 'flex';
        if (swapRightButton) swapRightButton.style.display = 'flex';
        if (deleteColumnButton) deleteColumnButton.style.display = 'flex';
    }
}

function hideAfterHover(event) {
    const column = event.target.closest('.column');
    const task = event.target.closest('.task');
    
    if (task) {
        const saveBtn = task.querySelector('.save-btn');
        const editBtn = task.querySelector('.edit-btn');
        const deleteBtn = task.querySelector('.delete-btn');

        if (saveBtn) saveBtn.style.display = 'none';
        if (editBtn) editBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
    }

    if (column) {
        const swapLeftButton = column.querySelector('.move-column-left');
        const swapRightButton = column.querySelector('.move-column-right');
        const deleteColumnButton = column.querySelector('.delete-column-btn');

        if (swapLeftButton) swapLeftButton.style.display = 'none';
        if (swapRightButton) swapRightButton.style.display = 'none';
        if (deleteColumnButton) deleteColumnButton.style.display = 'none';
    }
}

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

let isCurrentlySwapping = false;

function swapColumns(column1, column2) {
    if (isCurrentlySwapping) return;
    isCurrentlySwapping = true;

    const container = column1.parentNode;

    const column1Rect = column1.getBoundingClientRect();
    const column2Rect = column2.getBoundingClientRect();

    const distance = column2Rect.left - column1Rect.left;

    column1.style.transition = 'transform 0.4s ease';
    column2.style.transition = 'transform 0.4s ease';

    column1.style.transform = `translateX(${distance}px)`;
    column2.style.transform = `translateX(${-distance}px)`;

    setTimeout(function() {
        column1.style.transition = '';
        column2.style.transition = '';
        column1.style.transform = '';
        column2.style.transform = '';

        if (column1.nextElementSibling === column2) {
            container.insertBefore(column2, column1);
        }
        else {
            container.insertBefore(column1, column2);
        }

        column1.dispatchEvent(new Event('mouseout'));
        column1.dispatchEvent(new Event('mouseleave'));

        saveColumnsToLocalStorage();
        isCurrentlySwapping = false;
    }, 400);
}

function swapLeft() {
    const currentColumn = this.closest('.column');
    const prevColumn = currentColumn.previousElementSibling;

    if (prevColumn && prevColumn.classList.contains('column') && !prevColumn.classList.contains('add-column')) {
        swapColumns(currentColumn, prevColumn);
    }
}

function swapRight() {
    const currentColumn = this.closest('.column');
    const nextColumn = currentColumn.nextElementSibling;
    
    if (nextColumn && nextColumn.classList.contains('column') && !nextColumn.classList.contains('add-column')) {
        swapColumns(nextColumn, currentColumn);
    }
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
        if (navigator.maxTouchPoints > 0) {
            editBtn.style.display = 'inline-block';
        }
        else {
            editBtn.style.display = 'none';
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        deleteBtn.className = "delete-btn";
        deleteBtn.onclick = function () {
            newTask.parentElement.removeChild(newTask);
            saveTasks(columnId);
        };
        if (navigator.maxTouchPoints > 0) {
            deleteBtn.style.display = 'inline-block';
        }
        else {
            deleteBtn.style.display = 'none';
        }

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
            if (saveBtn.style.display === 'none') {
                editBtn.style.display = 'none';
            }
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
        if (navigator.maxTouchPoints > 0) {
            editBtn.style.display = 'inline-block';
        }
        else {
            editBtn.style.display = 'none';
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        deleteBtn.className = "delete-btn";
        deleteBtn.onclick = function () {
            newTask.parentElement.removeChild(newTask);
            saveTasks(columnId);
        };
        if (navigator.maxTouchPoints > 0) {
            deleteBtn.style.display = 'inline-block';
        }
        else {
            deleteBtn.style.display = 'none';
        }

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
        <div class="column-header">
            <button class="move-column-left"><i class="fa-solid fa-arrow-left"></i></button>
            <h2 id="column-title">${columnTitle}</h2>
            <button class="move-column-right"><i class="fa-solid fa-arrow-right"></i></button>
        </div>
        <button class="delete-column-btn" onclick="deleteColumn('${columnId}')"><i class="fa-solid fa-xmark"></i></button>
        <div class="task-list" id="${columnId}-tasks" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
        <input type="text" placeholder="New task..." id="${columnId}-input" onkeypress="handleKeyPress(event, '${columnId}')">
        <button class="add-task-btn" onclick="addTask('${columnId}')"><i class="fas fa-plus"></i> Add Task</button>
    `;

    document.getElementById('task-board').insertBefore(newColumn, document.getElementById('add-column'));

    if (navigator.maxTouchPoints > 0) {
        newColumn.querySelector('.move-column-right').style.display = 'flex';
        newColumn.querySelector('.move-column-left').style.display = 'flex';
        newColumn.querySelector('.delete-column-btn').style.display = 'flex';
    }
    else {
        newColumn.addEventListener('mouseover', showOnHover);
        newColumn.addEventListener('mouseout', hideAfterHover);
    }

    newColumn.querySelector('.move-column-right').addEventListener('click', swapRight);
    newColumn.querySelector('.move-column-left').addEventListener('click', swapLeft);

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