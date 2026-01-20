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
    // Re-initialize tooltips for new elements
    if (typeof tippy !== 'undefined') {
        tippy('[data-tippy-content]', { theme: 'light-border', placement: 'bottom', delay: [200, 0] });
    }
}

function renderOverview() {
    updateMetrics();
    const machineCards = machines.map(m => `
        <div class="bg-white dark:bg-gray-800 p-4 rounded shadow" data-tippy-content="Equipment asset card showing real-time status from PLC/RTU data">
            <h3 class="text-lg font-bold">${m.name}</h3>
            <div class="flex items-center mt-2" data-tippy-content="RUN=producing, IDLE=standby, DOWN=faulted or stopped">
                <div class="w-4 h-4 rounded-full ${getStatusColor(m.status)} mr-2"></div>
                <span>${m.status}</span>
            </div>
            <p data-tippy-content="Overall Equipment Effectiveness (OEE) health indicator derived from availability, performance, and quality">Health: ${m.healthScore}%</p>
            <p data-tippy-content="Time since last heartbeat signal from the machine's PLC or controller - monitors communication health">Last HB: ${Math.floor((Date.now() - m.lastHeartbeat) / 1000)}s ago</p>
            <a href="#/machine/${m.id}" class="text-blue-600 hover:underline" data-tippy-content="View detailed event log, downtime entries, and diagnostic data for this machine">Details</a>
        </div>
    `).join('');

    return `
        <h2 class="text-2xl font-bold mb-4" data-tippy-content="SCADA HMI Overview: Supervisory Control and Data Acquisition Human-Machine Interface for monitoring plant operations">Overview Dashboard</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow" data-tippy-content="Critical alarms requiring operator attention - high priority events that may indicate equipment failure or safety issues">
                <h3>Alarms last 24h</h3>
                <p class="text-2xl font-bold text-red-600">${alarmsLast24h}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow" data-tippy-content="Count of machines currently in DOWN state - indicates production capacity loss">
                <h3>Machines down</h3>
                <p class="text-2xl font-bold text-red-600">${machinesDown}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow" data-tippy-content="Total unplanned and planned downtime accumulated today - key metric for OEE calculations">
                <h3>Downtime minutes today</h3>
                <p class="text-2xl font-bold text-yellow-600">${Math.floor(downtimeMinutesToday)}</p>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            ${machineCards}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow" data-tippy-content="Pareto analysis of downtime by equipment - helps identify worst-performing assets for maintenance prioritization">
                <h3>Downtime by Machine</h3>
                <canvas id="downtimeChart"></canvas>
            </div>
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow" data-tippy-content="Event distribution by severity level - INFO (normal), WARN (attention needed), ALARM (immediate action required)">
                <h3>Events by Severity</h3>
                <canvas id="eventsChart"></canvas>
            </div>
        </div>
        <div class="mt-4 flex items-center gap-4">
            <button onclick="simulationRunning ? stopSimulation() : startSimulation()" id="sim-btn" class="bg-blue-600 text-white px-4 py-2 rounded ${simulationRunning ? 'animate-pulse' : ''}" data-tippy-content="Demo mode: simulates real-time data from PLCs/RTUs including status changes, alarms, and events">
                ${simulationRunning ? 'Stop' : 'Start'} Simulation
            </button>
            <span id="sim-status">${simulationRunning ? '<span class="flex items-center gap-2"><span class="w-3 h-3 bg-green-500 rounded-full animate-ping"></span><span class="text-green-600 font-medium">Running...</span></span>' : ''}</span>
            <span id="sim-ticker" class="text-sm text-gray-600 dark:text-gray-400" data-tippy-content="Timestamp of last data poll - in production this would be real-time updates via OPC-UA or MQTT">Last simulated: ${formatAgo(lastSimulated)}</span>
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
        <h2 class="text-2xl font-bold mb-4" data-tippy-content="Detailed view of individual equipment asset - drill-down from overview for diagnostics and maintenance">${machine.name} Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow" data-tippy-content="Real-time health metrics from PLC/controller - used for predictive maintenance and performance monitoring">
                <h3>Machine Health</h3>
                <p data-tippy-content="Current operating state: RUN (producing), IDLE (standby), DOWN (stopped/faulted)">Status: <span class="font-bold ${getStatusColor(machine.status)} text-white px-2 py-1 rounded">${machine.status}</span></p>
                <p data-tippy-content="Watchdog timer - if this exceeds threshold, communication with PLC may be lost">Last Heartbeat: ${Math.floor((Date.now() - machine.lastHeartbeat) / 1000)}s ago</p>
                <p data-tippy-content="Composite score based on availability, performance, and quality metrics (OEE factors)">Health Score: ${machine.healthScore}%</p>
                <p data-tippy-content="Current throughput rate - used for production tracking and bottleneck analysis">Units/min: ${machine.unitsPerMin || 0}</p>
                <button onclick="runRateTest(${machine.id})" class="bg-green-600 text-white px-4 py-2 rounded mt-2" data-tippy-content="Proof of Rate test: validates machine meets production targets over 60 seconds - used during commissioning and qualification">Run 60s Rate Test</button>
            </div>
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow" data-tippy-content="Manual downtime logging for events not automatically captured - enables accurate OEE tracking">
                <h3>Create Downtime Entry</h3>
                <form onsubmit="addDowntime(event, ${machine.id})">
                    <select name="reason" required class="block w-full p-2 border rounded mb-2" data-tippy-content="Standardized reason codes for downtime categorization - enables Pareto analysis">
                        <option>Maintenance</option>
                        <option>Failure</option>
                        <option>Setup</option>
                    </select>
                    <textarea name="notes" placeholder="Notes" class="block w-full p-2 border rounded mb-2" data-tippy-content="Free-text field for additional context - captured for shift handoff and root cause analysis"></textarea>
                    <input type="datetime-local" name="start" required class="block w-full p-2 border rounded mb-2" data-tippy-content="Downtime start timestamp - when the machine stopped producing">
                    <input type="datetime-local" name="end" required class="block w-full p-2 border rounded mb-2" data-tippy-content="Downtime end timestamp - when production resumed">
                    <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded" data-tippy-content="Submit downtime entry to the historian database">Add</button>
                </form>
            </div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded shadow mb-4" data-tippy-content="Chronological event log from SCADA historian - shows all machine state changes, alarms, and operator actions">
            <h3>Event Log</h3>
            <table class="w-full">
                <thead>
                    <tr>
                        <th data-tippy-content="Event timestamp from PLC or SCADA server">Time</th>
                        <th data-tippy-content="INFO=informational, WARN=warning, ALARM=critical requiring action">Severity</th>
                        <th data-tippy-content="Event description from PLC alarm configuration">Message</th>
                        <th data-tippy-content="Alarm acknowledgement status - operator must acknowledge critical alarms">Ack</th>
                    </tr>
                </thead>
                <tbody>${eventRows}</tbody>
            </table>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded shadow" data-tippy-content="Downtime history for this machine - used for availability calculations and maintenance planning">
            <h3>Downtime Entries</h3>
            <table class="w-full">
                <thead>
                    <tr>
                        <th data-tippy-content="When downtime began">Start</th>
                        <th data-tippy-content="When production resumed">End</th>
                        <th data-tippy-content="Categorized reason code for reporting">Reason</th>
                        <th data-tippy-content="Operator notes and context">Notes</th>
                    </tr>
                </thead>
                <tbody>${downtimeRows}</tbody>
            </table>
        </div>
    `;
}

function renderRunbooks() {
    const runbookList = runbooks.map(r => `
        <div class="bg-white dark:bg-gray-800 p-4 rounded shadow mb-2" data-tippy-content="Standard Operating Procedure for handling specific alarm or fault conditions">
            <h3 class="text-lg font-bold">${r.code}: ${r.title}</h3>
            <button onclick="showRunbook('${r.code}')" class="text-blue-600 hover:underline" data-tippy-content="View step-by-step troubleshooting instructions">View Details</button>
        </div>
    `).join('');

    return `
        <h2 class="text-2xl font-bold mb-4" data-tippy-content="Runbooks are standardized procedures for responding to alarms and equipment issues - ensures consistent operator response">Runbooks</h2>
        <input type="text" id="runbook-search" placeholder="Search by code" class="block w-full p-2 border rounded mb-4" oninput="filterRunbooks()" data-tippy-content="Filter runbooks by alarm code (e.g., ALRM-001) for quick access during emergencies">
        <div id="runbook-list">${runbookList}</div>
        <div id="runbook-detail" class="hidden bg-white dark:bg-gray-800 p-4 rounded shadow mt-4" data-tippy-content="Detailed procedure steps - follow in order for safe troubleshooting"></div>
    `;
}

function renderCommissioning() {
    const sectionTooltips = {
        Safety: 'Verify all safety systems including E-stops, guards, and interlocks are functioning properly',
        IO: 'Validate all input/output signals between PLC and field devices are correctly wired and configured',
        Network: 'Confirm network connectivity between all system components including PLCs, HMIs, and SCADA servers',
        Sensors: 'Calibrate and verify accuracy of all sensors including temperature, pressure, and position',
        Throughput: 'Validate production rate meets design specifications under normal operating conditions',
        Handoff: 'Complete all documentation and training before transferring system to operations team'
    };
    const sections = Object.keys(commissioningChecklist).map(section => {
        const items = commissioningChecklist[section].map(item => `
            <div class="flex items-center mb-2">
                <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleChecklist('${section}', '${item.item}')" class="mr-2" data-tippy-content="Check when this item has been verified and documented">
                <label>${item.item}</label>
            </div>
        `).join('');
        return `
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow mb-4" data-tippy-content="${sectionTooltips[section] || 'Commissioning section'}">
                <h3 class="text-lg font-bold">${section}</h3>
                ${items}
            </div>
        `;
    }).join('');

    return `
        <h2 class="text-2xl font-bold mb-4" data-tippy-content="Factory Acceptance Test (FAT) and Site Acceptance Test (SAT) checklist - systematic validation before production handoff">Commissioning Checklist</h2>
        ${sections}
        <button onclick="exportChecklist()" class="bg-blue-600 text-white px-4 py-2 rounded" data-tippy-content="Download checklist as JSON file for documentation and audit trail">Export to JSON</button>
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