/* ======================================================
   DOM
====================================================== */

const DOM = {

    // Pager

    timer: document.getElementById("timer"),

    currentTask: document.getElementById("currentTask"),

    breaks: document.querySelector(".breaks"),

    startBtn: document.getElementById("startBtn"),

    pauseBtn: document.getElementById("pauseBtn"),

    endBtn: document.getElementById("endBtn"),


    // Tasks

    taskInput: document.getElementById("taskName"),

    taskList: document.getElementById("taskList"),

    ongoingTab: document.getElementById("ongoingTab"),

    doneTab: document.getElementById("doneTab"),


    // Printer

    printer: document.querySelector(".printer"),

    receiptFeed: document.querySelector(".receipt-feed"),

    receiptContainer: document.getElementById("receiptContainer"),

    receiptTemplate: document.getElementById("receiptTemplate"),


    // Report

    reportBtn: document.getElementById("reportBtn"),

    reportModal: document.getElementById("reportModal"),

    reportReceipt: document.getElementById("reportReceipt"),

    closeReport: document.getElementById("closeReport"),

    addTaskBtn: document.getElementById("addTaskBtn")
};

/* ======================================================
   STATE
====================================================== */

const state = {

    tasks: [],

    receipts: [],

    currentTask: null,

    currentTab: "ongoing",

    timer: {

        running: false,

        seconds: 0,

        interval: null,

        startedAt: null,

        breakCount: 0

    }

};

/* ======================================================
   HELPERS
====================================================== */

const Helpers = {

    formatTime(seconds){

        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;

        return (
            String(min).padStart(2,"0") +
            ":" +
            String(sec).padStart(2,"0")
        );

    },

    formatClock(date){

        return date.toLocaleTimeString([],{

            hour:"2-digit",

            minute:"2-digit"

        });

    },

    formatDate(date){

        return date.toLocaleDateString("en-GB",{

            day:"2-digit",

            month:"short",

            year:"numeric"

        });

    }

};

/* ======================================================
   STORAGE
====================================================== */

const Storage = {

    keys: {

        tasks: "task_receipts_tasks",

        receipts: "task_receipts_receipts"

    },

    save(){

        localStorage.setItem(

            this.keys.tasks,

            JSON.stringify(state.tasks)

        );

        localStorage.setItem(

            this.keys.receipts,

            JSON.stringify(state.receipts)

        );

    },

    load(){

        const savedTasks = localStorage.getItem(

            this.keys.tasks

        );

        const savedReceipts = localStorage.getItem(

            this.keys.receipts

        );

        try {

        state.tasks = savedTasks
            ? JSON.parse(savedTasks)
            : [];

        state.receipts = savedReceipts
            ? JSON.parse(savedReceipts)
            : [];

        } catch (error) {

            console.error("Storage corrupted:", error);

            state.tasks = [];

            state.receipts = [];

        }

    },

    clear(){

        localStorage.removeItem(

            this.keys.tasks

        );

        localStorage.removeItem(

            this.keys.receipts

        );

    }

};

/* ======================================================
   AUTO SAVE
====================================================== */

function save(){

    Storage.save();

}

/* ======================================================
   TASK MANAGER
====================================================== */

const TaskManager = {

add(){

    console.log("ADD CALLED");

    const title = DOM.taskInput.value.trim();

    const title = DOM.taskInput.value.trim();

    if(title === "") return;

    const task = {

        id: Date.now(),

        title,

        status: "ongoing",

        duration: 0,

        worker: "You",

        startedAt: null,

        finishedAt: null

    };

    state.tasks.push(task);
    state.currentTask = task;

    DOM.currentTask.textContent =
        task.title.toUpperCase();

    save();

    this.render();

    DOM.taskInput.value = "";

    DOM.taskInput.focus();

},

render(){

    DOM.taskList.innerHTML = "";

    const tasks = state.tasks.filter(task=>{

        return task.status === state.currentTab;

    });

    if(tasks.length === 0){

        DOM.taskList.innerHTML = `

            <div class="empty">

                No tasks.

            </div>

        `;

        return;

    }

    tasks.forEach(task=>{

        const div = document.createElement("div");

        div.className = "task";

        if(
            state.currentTask &&
            state.currentTask.id === task.id
        ){

            div.classList.add("active");

        }

        if(task.status === "done"){

            div.classList.add("done");

        }

        div.innerHTML = `

        <div class="task-left">

            <div class="task-circle"></div>

            <span class="task-name">

                ${task.title}

            </span>

        </div>

        <button class="delete-task">

            ×

        </button>

        `;

        const deleteBtn = div.querySelector(".delete-task");

        deleteBtn.onclick = (e)=>{

            e.stopPropagation();

            this.remove(task.id);

        };

        div.onclick = ()=>{

            this.select(task.id);

        };

        DOM.taskList.appendChild(div);

    });

},

select(id){

    if(state.timer.running){

        return;

    }

    state.currentTask = state.tasks.find(

        task => task.id === id

    );

    DOM.currentTask.textContent =
        state.currentTask.title.toUpperCase();

    this.render();

},

finish(){

    if(!state.currentTask) return;

    state.currentTask.status="done";

    state.currentTask.duration=
        state.timer.seconds;

    state.currentTask.finishedAt=
        new Date();

    DOM.currentTask.textContent="NONE";

    state.currentTask=null;

    save();

    this.render();

},

switchTab(tab){

    state.currentTab = tab;

    DOM.ongoingTab.classList.remove("active");

    DOM.doneTab.classList.remove("active");

    if(tab === "ongoing"){

        DOM.ongoingTab.classList.add("active");

    }

    else{

        DOM.doneTab.classList.add("active");

    }

    this.render();

},

remove(id){

    if(state.currentTask &&
       state.currentTask.id === id){

        Timer.reset();

        state.currentTask = null;

        DOM.currentTask.textContent = "NONE";

    }

    state.tasks = state.tasks.filter(

        task => task.id !== id

    );

    save();

    this.render();

}

};

/* ======================================================
   TASK EVENTS
====================================================== */

DOM.ongoingTab.onclick=()=>{

    TaskManager.switchTab("ongoing");

};

DOM.doneTab.onclick=()=>{

    TaskManager.switchTab("done");

};

/* ======================================================
   TIMER
====================================================== */

const Timer = {

    start(){

        if(state.timer.running) return;

        if(!state.currentTask){

            alert("Select a task first.");

            return;

        }

        state.timer.running = true;

        if(state.timer.startedAt === null){

            state.timer.startedAt = new Date();

        }

        state.timer.interval = setInterval(()=>{

            state.timer.seconds++;

            this.render();

        },1000);

    },

    pause(){

        if(!state.timer.running) return;

        clearInterval(state.timer.interval);

        state.timer.running = false;

        state.timer.breakCount++;

        DOM.breaks.textContent =
            `${state.timer.breakCount} breaks taken`;

    },

    stop(){

        clearInterval(state.timer.interval);

        state.timer.running = false;

    },

    reset(){

        this.stop();

        state.timer.seconds = 0;

        state.timer.startedAt = null;

        state.timer.breakCount = 0;

        DOM.breaks.textContent = "0 breaks taken";

        this.render();

    },

    render(){

        DOM.timer.textContent =
            Helpers.formatTime(state.timer.seconds);

    }

};

/* ======================================================
   TIMER EVENTS
====================================================== */

DOM.pauseBtn.onclick = ()=>{

    Timer.pause();

};

DOM.endBtn.onclick = ()=>{

    if(!state.currentTask) return;

    Receipt.print();

};

/* ======================================================
   RECEIPT
====================================================== */

const Receipt = {

    print(){

        if(!state.currentTask) return;

        Timer.stop();

        const now = new Date();

        const receipt = {

            id: Date.now(),

            task: state.currentTask.title,

            worker: state.currentTask.worker,

            date: Helpers.formatDate(now),

            start: state.timer.startedAt
                ? Helpers.formatClock(state.timer.startedAt)
                : "--:--",

            end: Helpers.formatClock(now),

            duration: Helpers.formatTime(state.timer.seconds),

            seconds: state.timer.seconds

        };

        state.receipts.unshift(receipt);

        save();

        this.animateFeed();

        setTimeout(()=>{

            this.render(receipt);

            TaskManager.finish();

            Timer.reset();

        },700);

    },

    render(receipt){

        const clone =
            DOM.receiptTemplate.content.cloneNode(true);

        clone.querySelector(".receipt-date").textContent =
            receipt.date;

        clone.querySelector(".receipt-task").textContent =
            receipt.task;

        clone.querySelector(".receipt-worker").textContent =
            receipt.worker;

        clone.querySelector(".receipt-start").textContent =
            receipt.start;

        clone.querySelector(".receipt-end").textContent =
            receipt.end;

        clone.querySelector(".receipt-duration").textContent =
            receipt.duration;

        clone.querySelector(".receipt-squares").innerHTML =
            this.generateSquares(receipt.seconds);

        DOM.receiptContainer.innerHTML = "";

        DOM.receiptContainer.appendChild(clone);

    },

    generateSquares(seconds){

        const minutes =
            Math.max(1,Math.ceil(seconds/60));

        let html="";

        for(let i=1;i<=minutes;i++){

            html+="■";

            if(i%24===0){

                html+="<br>";

            }

        }

        return html;

    },

    animateFeed(){

        DOM.printer.classList.add("printing");

        setTimeout(()=>{

            DOM.printer.classList.remove("printing");

        },900);

    }

};

/* ======================================================
   REPORT
====================================================== */

const Report = {

    open(){

        this.render();

        DOM.reportModal.style.display = "flex";

    },

    close(){

        DOM.reportModal.style.display = "none";

    },

    render(){

        const done = state.tasks.filter(

            task => task.status === "done"

        );

        const totalSeconds = done.reduce(

            (sum, task)=>sum + task.duration,

            0

        );

        const average = done.length

            ? Math.floor(totalSeconds / done.length)

            : 0;

        let html = `

        <div class="receipt">

            <div class="receipt-top">

                <strong>SESSION SUMMARY</strong>

                <span>${Helpers.formatDate(new Date())}</span>

            </div>

            <div class="receipt-line"></div>

            <div class="receipt-row">

                <span>Completed</span>

                <strong>${done.length}</strong>

            </div>

            <div class="receipt-row">

                <span>Total Focus</span>

                <strong>${Helpers.formatTime(totalSeconds)}</strong>

            </div>

            <div class="receipt-row">

                <span>Average</span>

                <strong>${Helpers.formatTime(average)}</strong>

            </div>

            <div class="receipt-line"></div>

        `;

        done.forEach(task=>{

            html += `

                <div class="receipt-row">

                    <span>${task.title}</span>

                    <strong>${Helpers.formatTime(task.duration)}</strong>

                </div>

            `;

        });

        html += `

            <div class="receipt-line"></div>

            <div class="receipt-footer">

                END OF REPORT

            </div>

        </div>

        `;

        DOM.reportReceipt.innerHTML = html;

    }

};

/* ======================================================
   LAST RECEIPT
====================================================== */

Receipt.renderLast = function(){

    if(state.receipts.length===0) return;

    this.render(state.receipts[0]);

};

/* ======================================================
   EVENT LISTENERS
====================================================== */

// Add task with button

DOM.addTaskBtn.onclick = () => {

    TaskManager.add();

};

// Add task with Enter

DOM.taskInput.addEventListener("keydown", e => {

    if(e.key !== "Enter") return;

    e.preventDefault();

    TaskManager.add();

});

// Tabs

DOM.ongoingTab.onclick = () => {

    TaskManager.switchTab("ongoing");

};

DOM.doneTab.onclick = () => {

    TaskManager.switchTab("done");

};

// Timer

DOM.startBtn.onclick = () => {

    Timer.start();

};

DOM.pauseBtn.onclick = () => {

    Timer.pause();

};

DOM.endBtn.onclick = () => {

    Receipt.print();

};

DOM.reportBtn.onclick = () => {

    Report.open();

};

DOM.closeReport.onclick = () => {

    Report.close();

};

DOM.reportModal.onclick = e => {

    if(e.target === DOM.reportModal){

        Report.close();

    }

};

/* ======================================================
   INIT
====================================================== */

function init(){

    // Load local data

    Storage.load();

    // Draw UI

    TaskManager.render();

    Receipt.renderLast();

    Timer.render();

    // Default tab

    TaskManager.switchTab("ongoing");

    // Focus input

    DOM.taskInput.focus();

    console.log("✓ Task Receipts Ready");

    console.table(state.tasks);

    console.table(state.receipts);

}

init();