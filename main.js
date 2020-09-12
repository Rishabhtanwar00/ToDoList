
const input = document.getElementById("task-input");
const totalTasks = document.getElementById("total");
const completedTasks = document.getElementById("completed");
const modal = document.getElementById("modal");
const maxRecentlyDeleted = 4;


loadData("TotalTasks") || saveData("TotalTasks", 0);
loadData("CompletedTasks") || saveData("CompletedTasks", 0);
loadData("ToDoTheme") || saveData("ToDoTheme", "light");

totalTasks.innerHTML = loadData("TotalTasks");
completedTasks.innerHTML = loadData("CompletedTasks");

input.addEventListener("keydown", function(e) {
    if(e.keyCode === 13) {
        let task = new Task(input.value);
        input.value = "";
        if(task.title.length === 0) { return }
        addTask(taskStore, task, function() {
            let amountOfTasks = Number(loadData("TotalTasks")) + 1;
            saveData("TotalTasks", amountOfTasks);
            totalTasks.innerHTML = loadData("TotalTasks");
            updateTasks();
        });
    }
});


function updateTasks() {
    readTasks(taskStore, function(tasks) {
        let list = document.getElementById("task-list");
        let innerHTML = "";
        for(let i = 0; i < tasks.length; i++) {
            innerHTML += `
                <li data-id='${tasks[i].id}' onclick='deleteTaskOnClick(this)'>
                    ${tasks[i].title}
                </li>
            `;
        }
        list.innerHTML = innerHTML;
    });
    
    
    readTasks(completedTaskStore, function(tasks) {
        let list = document.getElementById("completed-task-list");
        let innerHTML = "";
        tasks.reverse();
        for(let i = 0; i < Math.min(tasks.length, maxRecentlyDeleted); i++) {
            innerHTML += `<li class='invert'>${tasks[i].title}: <span>${tasks[i].completedDate}</span></li>`;
        }
        list.innerHTML = innerHTML;
    });
}


function onLoad() {
    updateTasks();
    updateTheme(loadData("ToDoTheme"));
    document.body.style.display = "flex";
}


function deleteTaskOnClick(elem) {
    let id = Number(elem.dataset.id);
    
    let task = readOneTask(taskStore, id, function(task) {
        
        let completedTask = new CompletedTask(task.title);
        addTask(completedTaskStore, completedTask, function() {
            elem.classList.add("exit");
            
            elem.addEventListener("animationend", function() {
                deleteTask(taskStore, id, function() {
                    let amountOfTasks = Number(loadData("TotalTasks")) - 1;
                    saveData("TotalTasks", amountOfTasks);
                    totalTasks.innerHTML = loadData("TotalTasks");
                    
                    let amountOfCompleted = Number(loadData("CompletedTasks")) + 1;
                    saveData("CompletedTasks", amountOfCompleted);
                    completedTasks.innerHTML = loadData("CompletedTasks");
                    updateTasks();
                });
            });
        });
    });
    
    
    
    
}


function updateTheme(theme) {
    let bgColor = theme == 'light' ? "255, 255, 255" : "19, 19, 19";
    let textColor = theme == 'light' ? "12, 12, 12" : "255, 255, 255";
    let shadowColor = theme == 'light' ? "0, 0, 0" : "255, 255, 255";
    let grad1 = theme == 'light' ? "108, 29, 103" : "34, 208, 163";
    let grad2 = theme == 'light' ? "100, 25, 148" : "32, 173, 211";
    let sideGrad1 = theme == 'light' ? "255, 255, 255" : "35, 35, 35";
    let sideGrad2 = theme == 'light' ? "251, 247, 247" : "46, 46, 46";
    
    let root = document.documentElement;
    
    root.style.setProperty("--bg-color", bgColor);
    root.style.setProperty("--text-color", textColor);
    root.style.setProperty("--shadow-color", shadowColor);
    root.style.setProperty("--gradient-1", grad1);
    root.style.setProperty("--gradient-2",grad2);
    root.style.setProperty("--sidebar-gradient-1", sideGrad1);
    root.style.setProperty("--sidebar-gradient-2", sideGrad2);
    
    document.getElementsByClassName("current-theme")[0].classList.remove("current-theme");;
    
    let activateClass = theme == "light" ? "light" : "dark";
    document.getElementById(activateClass).classList.add("current-theme");
    
    saveData("ToDoTheme", theme);
    
    let invertStrength = theme == "light" ? "0%" : "100%";
    let icons = document.getElementsByClassName("icon");
    for(let i = 0; i < icons.length; i++) {
        icons[i].style.filter = `brightness(100%) invert(${invertStrength})`;
    }
}


function attemptReset() {
    modal.showModal();
}


function closeModal() {
    modal.close();
}


function reset() {
    saveData("TotalTasks", 0);
    totalTasks.innerHTML = "0";
    saveData("CompletedTasks", 0);
    completedTasks.innerHTML = "0";

    deleteAllTasks(taskStore);
    deleteAllTasks(completedTaskStore);
    updateTasks();
}

//Date format
function getCurrentDate() {
    let date = new Date();
    let months = [
        "Jan.",
        "Feb.",
        "Mar.",
        "Apr.",
        "May",
        "June",
        "July",
        "Aug.",
        "Sept.",
        "Oct.",
        "Nov.",
        "Dec.",
    ]
    
    let month = months[date.getMonth()];
    let day = addOrdinalIndicator(date.getDate());
    
    function addOrdinalIndicator(day) {
        switch (day) {
            case 1:
            case 21:
            case 31:
                day = day + "st";
                break;
            case 2:
            case 22:
                day = day + "nd";
                break;
            case 3:
            case 23:
                day = day + "rd";
                break;
            default: day = day + "th";
        }
        return day;
    }
    
    
    fullDate = `${month} ${day}`;
    return fullDate;
}

//storage
function saveData(key, value) {
    if(localStorage) {
        localStorage.setItem(key, value);
    } else {
        alert("You browser does not support localStorage API");
    }
}

function loadData(key) {
    if(localStorage) {
        if(key in localStorage) {
            return localStorage.getItem(key);
        }
    } else {
        alert("You browser does not support localStorage API");
    }
}


//tasks
let database;

const taskStore = "Tasks";
const completedTaskStore = "CompletedTasks";

function Task(title) {
    this.title = title;
}

function CompletedTask(title) {
    this.title = title;
    this.completedDate = getCurrentDate();
}


window.onload = function() {
    let req = window.indexedDB.open("GetItDoneAppDB", 1);

    req.onsuccess = function() {
        database = req.result;
        onLoad();
    }

    req.onerror = function(event) {
        alert("There was an error", event);
    }

    req.onupgradeneeded = function(event) {
        let db = req.result;
        console.log("Created Stores");
        let objectStore = db.createObjectStore(taskStore, { keyPath: "id", autoIncrement: true });
        let objectStore2 = db.createObjectStore(completedTaskStore, { keyPath: "id", autoIncrement: true });
    }
}



let defaultError = function() {
    console.log("Something went wrong");
}

function addTask(store, task, success, error = defaultError) {
    let transaction = database.transaction([store], "readwrite");
    let objectStore = transaction.objectStore(store);
    let request = objectStore.add(task);
    request.onerror = error;
    request.onsuccess = success;
}

function readTasks(store, success, error = defaultError) {
    let transaction = database.transaction([store], "readonly");
    let objectStore = transaction.objectStore(store);
    let request = objectStore.openCursor();
    request.onerror = error;
    let tasks = [];
    request.onsuccess = function(event) {
        let cursor = event.target.result;
        if(cursor) {
            let task = cursor.value;
            tasks.push(task);
            cursor.continue();
        } else {
            success(tasks);
        }
    };
}

function readOneTask(store, id, success, error = defaultError) {
    let transaction = database.transaction([store], "readonly");
    let objectStore = transaction.objectStore(store);
    let request = objectStore.get(id);
    request.onerror = error;
    request.onsuccess = function() {
        success(request.result);
    };
}

function deleteTask(store, id, success, error = defaultError) {
    let transaction = database.transaction([store], "readwrite");
    let objectStore = transaction.objectStore(store);
    let request = objectStore.delete(id);
    request.onerror = error;
    request.onsuccess = success;
}

function deleteAllTasks(store, success, error = defaultError) {
    success = success || function() { console.log("Deleted All Tasks"); }
    let transaction = database.transaction([store], "readwrite");
    let objectStore = transaction.objectStore(store);
    let request = objectStore.clear();
    request.onerror = error;
    request.onsuccess = success;
}














