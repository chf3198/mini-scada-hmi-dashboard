// Main app logic
console.log('App.js loaded at', new Date());

let currentView = 'overview';
let downtimeChartInstance = null;
let eventsChartInstance = null;

function renderCurrentView() {
    console.log('Rendering view:', currentView);
    const content = document.getElementById('content');
    console.log('Content element:', content);
    if (!content) {
        console.error('Content element not found');
        return;
    }
    switch (currentView) {
        case 'overview':
            content.innerHTML = renderOverview();
            setTimeout(renderCharts, 50);
            break;
        case 'machine':
            content.innerHTML = renderMachineDetail(window.location.hash.split('/')[2]);
            break;
        case 'runbooks':
            content.innerHTML = renderRunbooks();
            break;
        case 'commissioning':
            content.innerHTML = renderCommissioning();
            break;
        default:
            content.innerHTML = renderOverview();
            setTimeout(renderCharts, 50);
    }
    console.log('InnerHTML set for view:', currentView);
    // Re-initialize Lucide icons
    lucide.createIcons();
}

function renderOverview() {
    updateMetrics();
    const machineCards = machines.map(m => `
        <div class="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h3 class="text-lg font-bold">${m.name}</h3>
            <div class="flex items-center mt-2">
                <div class="w-4 h-4 rounded-full ${getStatusColor(m.status)} mr-2"></div>
                <span>${m.status}</span>
            </div>
            <p>Health: ${m.healthScore}%</p>
            <p>Last HB: ${Math.floor((Date.now() - m.lastHeartbeat) / 1000)}s ago</p>
            <a href="#/machine/${m.id}" class="text-blue-600 hover:underline">Details</a>
        </div>
    `).join('');

    return `
        <h2 class="text-2xl font-bold mb-4">Overview Dashboard</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow">
                <h3>Alarms last 24h</h3>
                <p class="text-2xl font-bold text-red-600">${alarmsLast24h}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow">
                <h3>Machines down</h3>
                <p class="text-2xl font-bold text-red-600">${machinesDown}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow">
                <h3>Downtime minutes today</h3>
                <p class="text-2xl font-bold text-yellow-600">${Math.floor(downtimeMinutesToday)}</p>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            ${machineCards}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow">
                <h3>Downtime by Machine</h3>
                <canvas id="downtimeChart"></canvas>
            </div>
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow">
                <h3>Events by Severity</h3>
                <canvas id="eventsChart"></canvas>
            </div>
        </div>
        <div class="mt-4 flex items-center gap-4">
            <button onclick="simulationRunning ? stopSimulation() : startSimulation()" id="sim-btn" class="bg-blue-600 text-white px-4 py-2 rounded ${simulationRunning ? 'animate-pulse' : ''}">
                ${simulationRunning ? 'Stop' : 'Start'} Simulation
            </button>
            <span id="sim-status">${simulationRunning ? '<span class="flex items-center gap-2"><span class="w-3 h-3 bg-green-500 rounded-full animate-ping"></span><span class="text-green-600 font-medium">Running...</span></span>' : ''}</span>
            <span id="sim-ticker" class="text-sm text-gray-600 dark:text-gray-400">Last simulated: ${formatAgo(lastSimulated)}</span>
        </div>
    `;
}

function renderMachineDetail(machineId) {
    const id = parseInt(machineId);
    const machine = machines.find(m => m.id === id);
    if (!machine) return '<p>Machine not found</p>';

    const machineEvents = events.filter(e => e.machineId === id).slice(0, 20);
    const eventRows = machineEvents.map(e => `
        <tr class="${e.acknowledged ? 'opacity-50' : ''}">
            <td>${formatTime(e.timestamp)}</td>
            <td class="${getSeverityColor(e.severity)}">${e.severity}</td>
            <td>${e.message}</td>
            <td>${e.acknowledged ? 'Yes' : `<button onclick="acknowledgeAlarm(${e.id})" class="text-blue-600">Ack</button>`}</td>
        </tr>
    `).join('');

    const downtimeRows = downtimeEntries.filter(d => d.machineId === id).map(d => `
        <tr>
            <td>${formatTime(d.start)}</td>
            <td>${formatTime(d.end)}</td>
            <td>${d.reason}</td>
            <td>${d.notes}</td>
        </tr>
    `).join('');

    return `
        <h2 class="text-2xl font-bold mb-4">${machine.name} Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow">
                <h3>Machine Health</h3>
                <p>Status: <span class="font-bold ${getStatusColor(machine.status)} text-white px-2 py-1 rounded">${machine.status}</span></p>
                <p>Last Heartbeat: ${Math.floor((Date.now() - machine.lastHeartbeat) / 1000)}s ago</p>
                <p>Health Score: ${machine.healthScore}%</p>
                <p>Units/min: ${machine.unitsPerMin || 0}</p>
                <button onclick="runRateTest(${machine.id})" class="bg-green-600 text-white px-4 py-2 rounded mt-2">Run 60s Rate Test</button>
            </div>
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow">
                <h3>Create Downtime Entry</h3>
                <form onsubmit="addDowntime(event, ${machine.id})">
                    <select name="reason" required class="block w-full p-2 border rounded mb-2">
                        <option>Maintenance</option>
                        <option>Failure</option>
                        <option>Setup</option>
                    </select>
                    <textarea name="notes" placeholder="Notes" class="block w-full p-2 border rounded mb-2"></textarea>
                    <input type="datetime-local" name="start" required class="block w-full p-2 border rounded mb-2">
                    <input type="datetime-local" name="end" required class="block w-full p-2 border rounded mb-2">
                    <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
                </form>
            </div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded shadow mb-4">
            <h3>Event Log</h3>
            <table class="w-full">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Severity</th>
                        <th>Message</th>
                        <th>Ack</th>
                    </tr>
                </thead>
                <tbody>${eventRows}</tbody>
            </table>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h3>Downtime Entries</h3>
            <table class="w-full">
                <thead>
                    <tr>
                        <th>Start</th>
                        <th>End</th>
                        <th>Reason</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>${downtimeRows}</tbody>
            </table>
        </div>
    `;
}

function renderRunbooks() {
    const runbookList = runbooks.map(r => `
        <div class="bg-white dark:bg-gray-800 p-4 rounded shadow mb-2">
            <h3 class="text-lg font-bold">${r.code}: ${r.title}</h3>
            <button onclick="showRunbook('${r.code}')" class="text-blue-600 hover:underline">View Details</button>
        </div>
    `).join('');

    return `
        <h2 class="text-2xl font-bold mb-4">Runbooks</h2>
        <input type="text" id="runbook-search" placeholder="Search by code" class="block w-full p-2 border rounded mb-4" oninput="filterRunbooks()">
        <div id="runbook-list">${runbookList}</div>
        <div id="runbook-detail" class="hidden bg-white dark:bg-gray-800 p-4 rounded shadow mt-4"></div>
    `;
}

function renderCommissioning() {
    const sections = Object.keys(commissioningChecklist).map(section => {
        const items = commissioningChecklist[section].map(item => `
            <div class="flex items-center mb-2">
                <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleChecklist('${section}', '${item.item}')" class="mr-2">
                <label>${item.item}</label>
            </div>
        `).join('');
        return `
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow mb-4">
                <h3 class="text-lg font-bold">${section}</h3>
                ${items}
            </div>
        `;
    }).join('');

    return `
        <h2 class="text-2xl font-bold mb-4">Commissioning Checklist</h2>
        ${sections}
        <button onclick="exportChecklist()" class="bg-blue-600 text-white px-4 py-2 rounded">Export to JSON</button>
    `;
}

function addDowntime(event, machineId) {
    event.preventDefault();
    const form = event.target;
    const reason = form.reason.value;
    const notes = form.notes.value;
    const start = form.start.value;
    const end = form.end.value;
    addDowntimeEntry(machineId, reason, notes, start, end);
    form.reset();
    renderCurrentView();
}

function showRunbook(code) {
    const runbook = runbooks.find(r => r.code === code);
    if (!runbook) return;
    const detail = document.getElementById('runbook-detail');
    detail.innerHTML = `
        <h3 class="text-xl font-bold">${runbook.title}</h3>
        <ol class="list-decimal list-inside">
            ${runbook.steps.map(s => `<li>${s}</li>`).join('')}
        </ol>
    `;
    detail.classList.remove('hidden');
}

function filterRunbooks() {
    const query = document.getElementById('runbook-search').value.toLowerCase();
    const list = document.getElementById('runbook-list');
    list.innerHTML = runbooks.filter(r => r.code.toLowerCase().includes(query)).map(r => `
        <div class="bg-white dark:bg-gray-800 p-4 rounded shadow mb-2">
            <h3 class="text-lg font-bold">${r.code}: ${r.title}</h3>
            <button onclick="showRunbook('${r.code}')" class="text-blue-600 hover:underline">View Details</button>
        </div>
    `).join('');
}

function toggleChecklist(section, item) {
    const checklistItem = commissioningChecklist[section].find(i => i.item === item);
    if (checklistItem) {
        checklistItem.checked = !checklistItem.checked;
        saveChecklistToLocalStorage();
    }
}

// Dark mode toggle
document.getElementById('dark-mode-toggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const toggle = document.getElementById('dark-mode-toggle');
    toggle.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
});

// Routing
window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash.startsWith('#/machine/')) {
        currentView = 'machine';
    } else if (hash === '#/runbooks') {
        currentView = 'runbooks';
    } else if (hash === '#/commissioning') {
        currentView = 'commissioning';
    } else {
        currentView = 'overview';
    }
    renderCurrentView();
});

// Initial render
renderCurrentView();

function renderCharts() {
    // Destroy existing charts to prevent duplicates
    if (downtimeChartInstance) {
        downtimeChartInstance.destroy();
    }
    if (eventsChartInstance) {
        eventsChartInstance.destroy();
    }

    // Downtime chart
    const downtimeCanvas = document.getElementById('downtimeChart');
    if (!downtimeCanvas) return;
    const downtimeCtx = downtimeCanvas.getContext('2d');
    const downtimeData = machines.map(m => {
        const total = downtimeEntries.filter(d => d.machineId === m.id).reduce((sum, d) => sum + (d.end - d.start) / 60000, 0);
        return total;
    });
    downtimeChartInstance = new Chart(downtimeCtx, {
        type: 'bar',
        data: {
            labels: machines.map(m => m.name),
            datasets: [{
                label: 'Downtime (min)',
                data: downtimeData,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        }
    });

    // Events chart
    const eventsCanvas = document.getElementById('eventsChart');
    if (!eventsCanvas) return;
    const eventsCtx = eventsCanvas.getContext('2d');
    const severityCounts = { INFO: 0, WARN: 0, ALARM: 0 };
    events.forEach(e => severityCounts[e.severity]++);
    eventsChartInstance = new Chart(eventsCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(severityCounts),
            datasets: [{
                data: Object.values(severityCounts),
                backgroundColor: ['#3B82F6', '#F59E0B', '#EF4444']
            }]
        }
    });
}