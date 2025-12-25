document.addEventListener("DOMContentLoaded", () => {
    loadTasks();
    loadActivity();
});

// --- MAIN TASK LOGIC ---

function addTask() {
    let input = document.getElementById("taskInput");
    let categorySelect = document.getElementById("categorySelect");
    let text = input.value;

    if (text === "") return;

    // NEW: Status is now a string ('todo'), not a boolean
    const task = {
        id: Date.now(),
        text: text,
        category: categorySelect.value,
        status: 'todo' // Default status
    };

    saveTask(task);
    logActivity(`Created task "${text}"`);
    input.value = "";
    refreshDashboard();
}

// NEW: Function to handle the Dropdown Change
function updateStatus(id, newStatus) {
    let tasks = getTasks();
    let task = tasks.find(t => t.id === id);
    
    if (task) {
        let oldStatus = task.status;
        task.status = newStatus; // Update status
        localStorage.setItem("tasks", JSON.stringify(tasks));
        
        // Log nice messages
        if(newStatus === 'done') logActivity(`Completed "${task.text}"`);
        else if(newStatus === 'doing') logActivity(`Started "${task.text}"`);
        else logActivity(`Reset "${task.text}" to To Do`);

        refreshDashboard();
    }
}

function deleteTask(id) {
    let tasks = getTasks();
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    refreshDashboard();
}

// --- RENDERING & CALCULATIONS ---

function refreshDashboard() {
    renderList();
    updateStats();
    updateCharts();
}

function renderList() {
    let tasks = getTasks();
    let ul = document.getElementById("taskList");
    ul.innerHTML = "";

    tasks.forEach(task => {
        let li = document.createElement("li");
        
        // Determine class for styling based on status
        let statusClass = 'status-' + task.status; 
        
        li.innerHTML = `
            <div class="task-left">
                <select 
                    class="status-select ${statusClass}" 
                    onchange="updateStatus(${task.id}, this.value)"
                >
                    <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
                    <option value="doing" ${task.status === 'doing' ? 'selected' : ''}>In Progress</option>
                    <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
                </select>

                <span class="task-text text-${task.status}">${task.text}</span>
                <span class="tag tag-${task.category}">${task.category}</span>
            </div>
            
            <button onclick="deleteTask(${task.id})" class="delete-btn">
                <i class="fas fa-times"></i>
            </button>
        `;
        ul.appendChild(li);
    });
}

function updateStats() {
    let tasks = getTasks();
    let total = tasks.length;
    
    // Count based on the new string status
    let completed = tasks.filter(t => t.status === 'done').length;
    let progress = tasks.filter(t => t.status === 'doing').length;
    let urgent = tasks.filter(t => t.category === 'urgent' && t.status !== 'done').length;

    document.getElementById("statTotal").innerText = total;
    document.getElementById("statCompleted").innerText = completed;
    document.getElementById("statProgress").innerText = progress;
    document.getElementById("statUrgent").innerText = urgent;
    document.getElementById("listCount").innerText = `${total} total`;
}

function updateCharts() {
    let tasks = getTasks();
    let total = tasks.length;
    let completed = tasks.filter(t => t.status === 'done').length;
    let percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    let chart = document.getElementById("donutChart");
    if(chart) {
        chart.style.background = `conic-gradient(#1f2937 0% ${percent}%, #e5e7eb ${percent}% 100%)`;
        document.getElementById("percentText").innerText = `${percent}%`;
        document.getElementById("progressText").innerText = `${completed} of ${total} completed`;
    }

    let categories = ["work", "personal", "school", "urgent"];
    let catContainer = document.getElementById("categoryList");
    if(catContainer) {
        catContainer.innerHTML = "";
        categories.forEach(cat => {
            let count = tasks.filter(t => t.category === cat).length;
            let catPercent = total === 0 ? 0 : (count / total) * 100;
            let color = getCategoryColor(cat);

            catContainer.innerHTML += `
                <div class="cat-item">
                    <div class="cat-header">
                        <span style="text-transform:uppercase; font-weight:600; color:${color}">${cat}</span>
                        <span>${count}</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width:${catPercent}%; background:${color}"></div>
                    </div>
                </div>
            `;
        });
    }
}

// --- ACTIVITY & HELPERS ---

function logActivity(message) {
    let activities = JSON.parse(localStorage.getItem("activity")) || [];
    let time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    activities.unshift({ time, message });
    if (activities.length > 5) activities.pop();
    localStorage.setItem("activity", JSON.stringify(activities));
    loadActivity();
}

function loadActivity() {
    let activities = JSON.parse(localStorage.getItem("activity")) || [];
    let list = document.getElementById("activityList");
    if(list) {
        list.innerHTML = "";
        activities.forEach(act => {
            list.innerHTML += `<div class="activity-item"><span class="activity-time">${act.time}</span> ${act.message}</div>`;
        });
    }
}

function getTasks() { return JSON.parse(localStorage.getItem("tasks")) || []; }

function saveTask(task) {
    let tasks = getTasks();
    tasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function getCategoryColor(cat) {
    if(cat === "work") return "#1e40af";
    if(cat === "personal") return "#86198f";
    if(cat === "school") return "#854d0e";
    if(cat === "urgent") return "#991b1b";
    return "#ccc";
}

function loadTasks() { refreshDashboard(); }

// --- MODAL FUNCTIONS (Updated for new status) ---
function openModal(filterType) {
    let tasks = getTasks();
    let modal = document.getElementById("taskModal");
    let modalList = document.getElementById("modalList");
    let modalTitle = document.getElementById("modalTitle");

    modalList.innerHTML = "";
    let filteredTasks = [];

    // Filter Logic using new 'status' string
    if (filterType === 'all') {
        filteredTasks = tasks;
        modalTitle.innerText = "All Tasks";
    } else if (filterType === 'completed') {
        filteredTasks = tasks.filter(t => t.status === 'done');
        modalTitle.innerText = "Completed Tasks";
    } else if (filterType === 'progress') {
        filteredTasks = tasks.filter(t => t.status === 'doing');
        modalTitle.innerText = "In Progress";
    } else if (filterType === 'urgent') {
        filteredTasks = tasks.filter(t => t.category === 'urgent' && t.status !== 'done');
        modalTitle.innerText = "Urgent Tasks";
    }

    if (filteredTasks.length === 0) modalList.innerHTML = "<p style='color:#888; text-align:center;'>No tasks found.</p>";

    filteredTasks.forEach(task => {
        let li = document.createElement("li");
        li.style.borderBottom = "1px solid #eee";
        li.style.padding = "10px";
        li.innerHTML = `
            <div class="task-left">
                <span class="status-select status-${task.status}" style="font-size:10px; width:auto; margin-right:10px;">${task.status}</span>
                <span class="task-text">${task.text}</span>
            </div>`;
        modalList.appendChild(li);
    });
    modal.style.display = "block";
}

function closeModal() { document.getElementById("taskModal").style.display = "none"; }
window.onclick = function(event) {
    if (event.target === document.getElementById("taskModal")) closeModal();
}