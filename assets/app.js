'use strict';

/**
 * @module app
 * @description Main application logic for the Mini SCADA HMI Dashboard.
 * Handles routing, view rendering, and user interactions.
 * @requires config/constants
 * @requires data
 * @requires utils
 * @author Mini SCADA HMI Team
 * @license MIT
 */

// ============================================================================
// APPLICATION STATE
// ============================================================================

/** @type {string} Currently active view */
let currentView = VIEWS.OVERVIEW;

/** @type {Chart|null} Chart.js instance for downtime chart */
let downtimeChartInstance = null;

/** @type {Chart|null} Chart.js instance for events chart */
let eventsChartInstance = null;

// ============================================================================
// CORE RENDERING
// ============================================================================

/**
 * Renders the current view based on the currentView state.
 * Handles view switching, icon initialization, and tooltip setup.
 * @sideeffect Updates DOM, initializes Lucide icons and Tippy tooltips
 */
function renderCurrentView() {
    const content = document.getElementById('content');
    if (!content) {
        console.error('Content element not found');
        return;
    }
    
    switch (currentView) {
        case VIEWS.OVERVIEW:
            content.innerHTML = renderOverview();
            setTimeout(renderCharts, TIME.CHART_RENDER_DELAY_MS);
            break;
        case VIEWS.MACHINE:
            content.innerHTML = renderMachineDetail(window.location.hash.split('/')[2]);
            break;
        case VIEWS.RUNBOOKS:
            content.innerHTML = renderRunbooks();
            break;
        case VIEWS.COMMISSIONING:
            content.innerHTML = renderCommissioning();
            break;
        case VIEWS.HELP:
            content.innerHTML = renderHelp();
            break;
        default:
            content.innerHTML = renderOverview();
            setTimeout(renderCharts, TIME.CHART_RENDER_DELAY_MS);
    }
    
    // Re-initialize Lucide icons for new content
    lucide.createIcons();
    
    // Re-initialize tooltips for new elements
    if (typeof tippy !== 'undefined') {
        tippy('[data-tippy-content]', { 
            theme: 'light-border', 
            placement: 'bottom', 
            delay: [200, 0] 
        });
    }
    
    // Update navigation highlight
    updateNavHighlight();
}

// ============================================================================
// NAVIGATION
// ============================================================================

/**
 * Updates navigation link highlighting based on current view.
 * Machine detail view highlights Overview as its parent.
 * @sideeffect Modifies CSS classes on navigation elements
 */
function updateNavHighlight() {
    const navLinks = document.querySelectorAll('[data-route]');
    // Machine detail shows Overview as active (parent view)
    const activeRoute = currentView === VIEWS.MACHINE ? VIEWS.OVERVIEW : currentView;
    
    navLinks.forEach(link => {
        const route = link.getAttribute('data-route');
        if (route === activeRoute) {
            link.classList.add('bg-blue-700', 'font-bold', 'shadow-inner');
            link.classList.remove('hover:bg-blue-500');
        } else {
            link.classList.remove('bg-blue-700', 'font-bold', 'shadow-inner');
            link.classList.add('hover:bg-blue-500');
        }
    });
}

// ============================================================================
// OVERVIEW VIEW
// ============================================================================

/**
 * Renders the overview dashboard with machine cards, metrics, and charts.
 * @returns {string} HTML string for the overview view
 */
function renderOverview() {
    updateMetrics();
    
    const machineCards = machines.map(machine => `
        <div class="bg-white dark:bg-gray-800 p-4 rounded shadow" data-tippy-content="Equipment asset card showing real-time status from PLC/RTU data">
            <h3 class="text-lg font-bold">${machine.name}</h3>
            <div class="flex items-center mt-2" data-tippy-content="RUN=producing, IDLE=standby, DOWN=faulted or stopped">
                <div class="w-4 h-4 rounded-full ${getStatusColor(machine.status)} mr-2"></div>
                <span>${machine.status}</span>
            </div>
            <p data-tippy-content="Overall Equipment Effectiveness (OEE) health indicator derived from availability, performance, and quality">Health: ${machine.healthScore}%</p>
            <p data-tippy-content="Time since last heartbeat signal from the machine's PLC or controller - monitors communication health">Last HB: ${Math.floor((Date.now() - machine.lastHeartbeat) / 1000)}s ago</p>
            <a href="#/machine/${machine.id}" class="text-blue-600 hover:underline" data-tippy-content="View detailed event log, downtime entries, and diagnostic data for this machine">Details</a>
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

// ============================================================================
// MACHINE DETAIL VIEW
// ============================================================================

/**
 * Renders detailed view for a specific machine with events and downtime.
 * @param {string} machineId - The machine ID from the route parameter
 * @returns {string} HTML string for the machine detail view
 */
function renderMachineDetail(machineId) {
    const parsedMachineId = parseInt(machineId);
    const machine = machines.find(targetMachine => targetMachine.id === parsedMachineId);
    if (!machine) return '<p>Machine not found</p>';

    const machineEvents = events
        .filter(eventEntry => eventEntry.machineId === parsedMachineId)
        .slice(0, 20);
    
    const eventRows = machineEvents.map(eventEntry => `
        <tr class="${eventEntry.acknowledged ? 'opacity-50' : ''}">
            <td>${formatTime(eventEntry.timestamp)}</td>
            <td class="${getSeverityColor(eventEntry.severity)}">${eventEntry.severity}</td>
            <td>${eventEntry.message}</td>
            <td>${eventEntry.acknowledged ? 'Yes' : `<button onclick="acknowledgeAlarm(${eventEntry.id})" class="text-blue-600">Ack</button>`}</td>
        </tr>
    `).join('');

    const downtimeRows = downtimeEntries
        .filter(downtimeEntry => downtimeEntry.machineId === parsedMachineId)
        .map(downtimeEntry => `
            <tr>
                <td>${formatTime(downtimeEntry.start)}</td>
                <td>${formatTime(downtimeEntry.end)}</td>
                <td>${downtimeEntry.reason}</td>
                <td>${downtimeEntry.notes}</td>
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

// ============================================================================
// RUNBOOKS VIEW
// ============================================================================

/**
 * Renders the runbooks page with searchable procedure list.
 * @returns {string} HTML string for the runbooks view
 */
function renderRunbooks() {
    const runbookList = runbooks.map(runbook => `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-3 overflow-hidden" data-runbook="${runbook.code}" data-tippy-content="Standard Operating Procedure for handling specific alarm or fault conditions">
            <div class="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" onclick="showRunbook('${runbook.code}')">
                <div>
                    <span class="inline-block px-2 py-1 text-xs font-mono font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded mr-2">${runbook.code}</span>
                    <span class="text-lg font-semibold">${runbook.title}</span>
                </div>
                <span class="text-gray-400 text-xl" id="chevron-${runbook.code}">▶</span>
            </div>
            <div id="detail-${runbook.code}" class="hidden border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-1 bg-blue-500 rounded self-stretch"></div>
                    <div>
                        <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-3">📋 Procedure Steps:</h4>
                        <ol class="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
                            ${runbook.steps.map(step => `<li class="pl-2">${step}</li>`).join('')}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    return `
        <h2 class="text-2xl font-bold mb-4" data-tippy-content="Runbooks are standardized procedures for responding to alarms and equipment issues - ensures consistent operator response">Runbooks</h2>
        <input type="text" id="runbook-search" placeholder="Search by code (e.g., ALRM-001)" class="block w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:border-blue-500 focus:outline-none" oninput="filterRunbooks()" data-tippy-content="Filter runbooks by alarm code for quick access during emergencies">
        <div id="runbook-list">${runbookList}</div>
    `;
}

// ============================================================================
// COMMISSIONING VIEW
// ============================================================================

/**
 * Renders the commissioning checklist with progress tracking.
 * Uses constants for section icons and tooltips.
 * @returns {string} HTML string for the commissioning view
 */
function renderCommissioning() {
    // Calculate overall progress
    let totalItems = 0;
    let checkedItems = 0;
    Object.values(commissioningChecklist).forEach(sectionItems => {
        totalItems += sectionItems.length;
        checkedItems += sectionItems.filter(checklistItem => checklistItem.checked).length;
    });
    const overallProgress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
    
    const sections = Object.keys(commissioningChecklist).map(section => {
        const sectionItems = commissioningChecklist[section];
        const sectionChecked = sectionItems.filter(checklistItem => checklistItem.checked).length;
        const sectionTotal = sectionItems.length;
        const sectionProgress = sectionTotal > 0 ? Math.round((sectionChecked / sectionTotal) * 100) : 0;
        const isComplete = sectionProgress === 100;
        
        const items = sectionItems.map(checklistItem => `
            <label class="flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${checklistItem.checked ? 'bg-green-50 dark:bg-green-900/20' : ''}">
                <input type="checkbox" ${checklistItem.checked ? 'checked' : ''} onchange="toggleChecklist('${section}', '${checklistItem.item}')" class="w-5 h-5 mr-3 accent-green-600" data-tippy-content="Check when this item has been verified and documented">
                <span class="${checklistItem.checked ? 'line-through text-gray-400' : ''}">${checklistItem.item}</span>
                ${checklistItem.checked ? '<span class="ml-auto text-green-600">✓</span>' : ''}
            </label>
        `).join('');
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4" data-tippy-content="${SECTION_TOOLTIPS[section] || 'Commissioning section'}">
                <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between ${isComplete ? 'bg-green-50 dark:bg-green-900/30' : ''}">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${SECTION_ICONS[section] || '📋'}</span>
                        <div>
                            <h3 class="text-lg font-bold">${section}</h3>
                            <span class="text-sm text-gray-500">${sectionChecked}/${sectionTotal} complete</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div class="h-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'} transition-all" style="width: ${sectionProgress}%"></div>
                        </div>
                        <span class="text-sm font-bold ${isComplete ? 'text-green-600' : 'text-blue-600'}">${sectionProgress}%</span>
                    </div>
                </div>
                <div class="p-3 space-y-1">
                    ${items}
                </div>
            </div>
        `;
    }).join('');

    return `
        <h2 class="text-2xl font-bold mb-4" data-tippy-content="Factory Acceptance Test (FAT) and Site Acceptance Test (SAT) checklist - systematic validation before production handoff">Commissioning Checklist</h2>
        
        <!-- Overall Progress Card -->
        <div class="bg-gradient-to-r ${overallProgress === 100 ? 'from-green-500 to-green-600' : 'from-blue-500 to-blue-600'} text-white p-6 rounded-lg shadow-lg mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-medium opacity-90">Overall Progress</h3>
                    <p class="text-3xl font-bold">${checkedItems} of ${totalItems} items complete</p>
                </div>
                <div class="text-right">
                    <div class="text-5xl font-bold">${overallProgress}%</div>
                    ${overallProgress === 100 ? '<span class="text-sm">✅ Ready for handoff!</span>' : ''}
                </div>
            </div>
            <div class="mt-4 h-3 bg-white/30 rounded-full overflow-hidden">
                <div class="h-full bg-white transition-all duration-500" style="width: ${overallProgress}%"></div>
            </div>
        </div>
        
        ${sections}
        
        <!-- Action Buttons -->
        <div class="flex gap-3 mt-6">
            <button onclick="exportChecklist()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors" data-tippy-content="Download checklist as JSON file for documentation and audit trail">
                <span>📤</span> Export to JSON
            </button>
            <button onclick="document.getElementById('import-file').click()" class="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors" data-tippy-content="Import a previously exported checklist JSON file">
                <span>📥</span> Import from JSON
            </button>
            <input type="file" id="import-file" accept=".json" onchange="importChecklist(event)" class="hidden">
            <button onclick="resetChecklist()" class="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors" data-tippy-content="Reset all checklist items to unchecked - use with caution!">
                <span>🔄</span> Reset All
            </button>
        </div>
        
        <div id="import-status" class="mt-4 hidden"></div>
    `;
}

// ============================================================================
// HELP VIEW
// ============================================================================

/**
 * Renders the user manual / help page.
 * Static content explaining SCADA concepts and application usage.
 * @returns {string} HTML string for the help view
 */
function renderHelp() {
    return `
        <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold mb-6">📖 User Manual</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-8">Welcome to the Mini SCADA HMI Dashboard! This guide will help you understand how to use this application effectively, even if you're new to industrial automation terminology.</p>

            <div class="space-y-6">
                <!-- What is SCADA/HMI -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-bold mb-3 text-blue-600">🏭 What is SCADA & HMI?</h3>
                    <p class="mb-3"><strong>SCADA</strong> (Supervisory Control and Data Acquisition) is a system used to monitor and control industrial equipment like machines, pumps, and sensors from a central location.</p>
                    <p class="mb-3"><strong>HMI</strong> (Human-Machine Interface) is the visual dashboard that operators use to interact with SCADA systems—this application is an example of an HMI.</p>
                    <p class="text-sm text-gray-500">Think of it like a car dashboard: you can see your speed (monitoring) and control the AC (control) from one place.</p>
                </div>

                <!-- Overview Dashboard -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-bold mb-3 text-green-600">📊 Overview Dashboard</h3>
                    <p class="mb-3">The main screen shows the health of your entire operation at a glance.</p>
                    <ul class="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Alarms last 24h:</strong> Critical issues requiring attention. Red = urgent.</li>
                        <li><strong>Machines down:</strong> Equipment currently not producing.</li>
                        <li><strong>Downtime minutes:</strong> Total lost production time today.</li>
                    </ul>
                    <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded">
                        <strong>Machine Status Colors:</strong>
                        <div class="flex gap-4 mt-2">
                            <span class="flex items-center gap-1"><span class="w-3 h-3 bg-green-500 rounded-full"></span> RUN = Producing</span>
                            <span class="flex items-center gap-1"><span class="w-3 h-3 bg-yellow-500 rounded-full"></span> IDLE = Standby</span>
                            <span class="flex items-center gap-1"><span class="w-3 h-3 bg-red-500 rounded-full"></span> DOWN = Stopped/Faulted</span>
                        </div>
                    </div>
                </div>

                <!-- Machine Details -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-bold mb-3 text-purple-600">🔧 Machine Details</h3>
                    <p class="mb-3">Click "Details" on any machine card to see in-depth information.</p>
                    <ul class="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Health Score:</strong> Overall equipment effectiveness (0-100%). Higher is better.</li>
                        <li><strong>Last Heartbeat:</strong> Time since the machine last sent data. If too old, check connectivity.</li>
                        <li><strong>Units/min:</strong> Current production rate.</li>
                        <li><strong>Event Log:</strong> History of everything that happened—alarms, status changes, operator actions.</li>
                    </ul>
                    <div class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded">
                        <strong>Workflow: Acknowledging Alarms</strong>
                        <ol class="list-decimal list-inside mt-2 space-y-1">
                            <li>See an unacknowledged alarm in the Event Log</li>
                            <li>Click "Ack" to acknowledge you've seen it</li>
                            <li>This logs who saw the alarm and when</li>
                            <li>Investigate and resolve the underlying issue</li>
                        </ol>
                    </div>
                </div>

                <!-- Downtime Tracking -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-bold mb-3 text-orange-600">⏱️ Downtime Tracking</h3>
                    <p class="mb-3">Recording why machines stop helps identify improvement opportunities.</p>
                    <div class="mt-4 p-3 bg-orange-50 dark:bg-orange-900 rounded">
                        <strong>Workflow: Logging Downtime</strong>
                        <ol class="list-decimal list-inside mt-2 space-y-1">
                            <li>Go to Machine Details page</li>
                            <li>Fill in the "Create Downtime Entry" form</li>
                            <li>Select reason: Maintenance, Failure, or Setup</li>
                            <li>Add notes explaining what happened</li>
                            <li>Enter start and end times</li>
                            <li>Click "Add" to log the entry</li>
                        </ol>
                    </div>
                    <p class="mt-3 text-sm text-gray-500">This data feeds into reports showing which machines have the most problems.</p>
                </div>

                <!-- Runbooks -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-bold mb-3 text-red-600">📋 Runbooks</h3>
                    <p class="mb-3">Runbooks are step-by-step guides for handling specific problems. They ensure every operator responds consistently.</p>
                    <div class="mt-4 p-3 bg-red-50 dark:bg-red-900 rounded">
                        <strong>Workflow: Using a Runbook</strong>
                        <ol class="list-decimal list-inside mt-2 space-y-1">
                            <li>When you see an alarm, note the alarm code (e.g., ALRM-001)</li>
                            <li>Go to the Runbooks page</li>
                            <li>Search for the code in the search box</li>
                            <li>Click "View Details" to see the procedure</li>
                            <li>Follow each step in order</li>
                            <li>Document any issues in the machine's downtime notes</li>
                        </ol>
                    </div>
                </div>

                <!-- Commissioning -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-bold mb-3 text-teal-600">✅ Commissioning Checklist</h3>
                    <p class="mb-3">Used when setting up new equipment or validating existing systems. Ensures nothing is missed.</p>
                    <ul class="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Safety:</strong> Emergency stops, guards, and interlocks</li>
                        <li><strong>IO:</strong> Inputs/outputs correctly wired and responding</li>
                        <li><strong>Network:</strong> All devices communicating properly</li>
                        <li><strong>Sensors:</strong> Calibrated and accurate</li>
                        <li><strong>Throughput:</strong> Meeting production targets</li>
                        <li><strong>Handoff:</strong> Documentation and training complete</li>
                    </ul>
                    <p class="mt-3 text-sm text-gray-500">Checklist state is saved automatically. Click "Export to JSON" to download for records.</p>
                </div>

                <!-- Simulation -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-bold mb-3 text-indigo-600">🎮 Simulation Mode</h3>
                    <p class="mb-3">This demo includes a simulation to show how the dashboard behaves with live data.</p>
                    <div class="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900 rounded">
                        <strong>How to Use:</strong>
                        <ol class="list-decimal list-inside mt-2 space-y-1">
                            <li>Click "Start Simulation" on the Overview page</li>
                            <li>Watch the ticker update every 2-3 seconds</li>
                            <li>Data accumulates in the background (status changes, events)</li>
                            <li>Click "Stop Simulation" to see final results</li>
                            <li>All metrics, charts, and machine cards update with simulated data</li>
                        </ol>
                    </div>
                    <p class="mt-3 text-sm text-gray-500">In a real factory, this data would come from PLCs via OPC-UA or MQTT protocols.</p>
                </div>

                <!-- Key Terms -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-bold mb-3 text-gray-600">📚 Key Terms Glossary</h3>
                    <dl class="space-y-3">
                        <div><dt class="font-bold">PLC (Programmable Logic Controller)</dt><dd class="ml-4 text-gray-600 dark:text-gray-400">The computer that controls individual machines</dd></div>
                        <div><dt class="font-bold">OEE (Overall Equipment Effectiveness)</dt><dd class="ml-4 text-gray-600 dark:text-gray-400">A percentage measuring how well equipment is performing (availability × performance × quality)</dd></div>
                        <div><dt class="font-bold">Heartbeat</dt><dd class="ml-4 text-gray-600 dark:text-gray-400">A regular signal from equipment confirming it's connected and working</dd></div>
                        <div><dt class="font-bold">FAT (Factory Acceptance Test)</dt><dd class="ml-4 text-gray-600 dark:text-gray-400">Testing done at the equipment manufacturer before shipping</dd></div>
                        <div><dt class="font-bold">SAT (Site Acceptance Test)</dt><dd class="ml-4 text-gray-600 dark:text-gray-400">Testing done at your facility after installation</dd></div>
                        <div><dt class="font-bold">Historian</dt><dd class="ml-4 text-gray-600 dark:text-gray-400">Database that stores historical process data for analysis and compliance</dd></div>
                    </dl>
                </div>

                <!-- Tips -->
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow">
                    <h3 class="text-xl font-bold mb-3">💡 Pro Tips</h3>
                    <ul class="list-disc list-inside space-y-2">
                        <li>Hover over any element to see a tooltip explaining what it does</li>
                        <li>Use Dark Mode (🌙 button) for night shift work</li>
                        <li>Check the Event Log regularly for unacknowledged alarms</li>
                        <li>Export your Commissioning Checklist before handoff meetings</li>
                        <li>Use Runbooks before troubleshooting—don't reinvent the wheel!</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Handles downtime form submission for a machine.
 * @param {Event} formEvent - The form submit event
 * @param {number} machineId - The machine ID to add downtime for
 * @sideeffect Adds downtime entry, resets form, re-renders view
 */
function addDowntime(formEvent, machineId) {
    formEvent.preventDefault();
    const form = formEvent.target;
    const reason = form.reason.value;
    const notes = form.notes.value;
    const start = form.start.value;
    const end = form.end.value;
    addDowntimeEntry(machineId, reason, notes, start, end);
    form.reset();
    renderCurrentView();
}

/**
 * Toggles visibility of a runbook's procedure steps.
 * Closes all other open runbooks for accordion behavior.
 * @param {string} runbookCode - The runbook code to toggle (e.g., 'ALRM-001')
 * @sideeffect Modifies DOM classes for visibility
 */
function showRunbook(runbookCode) {
    const runbook = runbooks.find(targetRunbook => targetRunbook.code === runbookCode);
    if (!runbook) return;
    
    // Close all other open runbooks (accordion behavior)
    runbooks.forEach(otherRunbook => {
        if (otherRunbook.code !== runbookCode) {
            const otherDetail = document.getElementById(`detail-${otherRunbook.code}`);
            const otherChevron = document.getElementById(`chevron-${otherRunbook.code}`);
            if (otherDetail) otherDetail.classList.add('hidden');
            if (otherChevron) otherChevron.textContent = '▶';
        }
    });
    
    // Toggle the clicked runbook
    const detailElement = document.getElementById(`detail-${runbookCode}`);
    const chevronElement = document.getElementById(`chevron-${runbookCode}`);
    if (detailElement.classList.contains('hidden')) {
        detailElement.classList.remove('hidden');
        chevronElement.textContent = '▼';
    } else {
        detailElement.classList.add('hidden');
        chevronElement.textContent = '▶';
    }
}

/**
 * Filters the runbook list based on search input.
 * Matches against runbook code or title (case-insensitive).
 * @sideeffect Re-renders the runbook list in the DOM
 */
function filterRunbooks() {
    const searchQuery = document.getElementById('runbook-search').value.toLowerCase();
    const listContainer = document.getElementById('runbook-list');
    
    const filteredRunbooks = runbooks.filter(runbook => 
        runbook.code.toLowerCase().includes(searchQuery) || 
        runbook.title.toLowerCase().includes(searchQuery)
    );
    
    listContainer.innerHTML = filteredRunbooks.map(runbook => `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-3 overflow-hidden" data-runbook="${runbook.code}">
            <div class="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" onclick="showRunbook('${runbook.code}')">
                <div>
                    <span class="inline-block px-2 py-1 text-xs font-mono font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded mr-2">${runbook.code}</span>
                    <span class="text-lg font-semibold">${runbook.title}</span>
                </div>
                <span class="text-gray-400 text-xl" id="chevron-${runbook.code}">▶</span>
            </div>
            <div id="detail-${runbook.code}" class="hidden border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-1 bg-blue-500 rounded self-stretch"></div>
                    <div>
                        <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-3">📋 Procedure Steps:</h4>
                        <ol class="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
                            ${runbook.steps.map(step => `<li class="pl-2">${step}</li>`).join('')}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Toggles a checklist item's checked state and persists to localStorage.
 * @param {string} section - The checklist section name (e.g., 'Safety')
 * @param {string} itemName - The checklist item text to toggle
 * @sideeffect Modifies commissioningChecklist, persists to localStorage
 */
function toggleChecklist(section, itemName) {
    const checklistItem = commissioningChecklist[section].find(
        targetItem => targetItem.item === itemName
    );
    if (checklistItem) {
        checklistItem.checked = !checklistItem.checked;
        saveChecklistToLocalStorage();
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Dark mode toggle button handler.
 * Toggles the 'dark' class on the document root and updates button icon.
 */
document.getElementById('dark-mode-toggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const toggleButton = document.getElementById('dark-mode-toggle');
    toggleButton.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
});

/**
 * Hash-based routing handler.
 * Parses the URL hash and updates the current view accordingly.
 */
window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash.startsWith('#/machine/')) {
        currentView = VIEWS.MACHINE;
    } else if (hash === '#/runbooks') {
        currentView = VIEWS.RUNBOOKS;
    } else if (hash === '#/commissioning') {
        currentView = VIEWS.COMMISSIONING;
    } else if (hash === '#/help') {
        currentView = VIEWS.HELP;
    } else {
        currentView = VIEWS.OVERVIEW;
    }
    renderCurrentView();
});

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initial render on page load
renderCurrentView();

// ============================================================================
// CHART RENDERING
// ============================================================================

/**
 * Renders Chart.js charts for downtime and event severity.
 * Destroys existing chart instances before creating new ones.
 * @sideeffect Creates/replaces chart instances on canvas elements
 */
function renderCharts() {
    // Destroy existing charts to prevent memory leaks and duplicates
    if (downtimeChartInstance) {
        downtimeChartInstance.destroy();
    }
    if (eventsChartInstance) {
        eventsChartInstance.destroy();
    }

    // Downtime by machine bar chart
    const downtimeCanvas = document.getElementById('downtimeChart');
    if (!downtimeCanvas) return;
    
    const downtimeContext = downtimeCanvas.getContext('2d');
    const downtimeByMachine = machines.map(machine => {
        const machineDowntime = downtimeEntries
            .filter(entry => entry.machineId === machine.id)
            .reduce((totalMinutes, entry) => 
                totalMinutes + (entry.end - entry.start) / TIME.MS_PER_MINUTE, 0
            );
        return machineDowntime;
    });
    
    downtimeChartInstance = new Chart(downtimeContext, {
        type: 'bar',
        data: {
            labels: machines.map(machine => machine.name),
            datasets: [{
                label: 'Downtime (min)',
                data: downtimeByMachine,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        }
    });

    // Events by severity pie chart
    const eventsCanvas = document.getElementById('eventsChart');
    if (!eventsCanvas) return;
    
    const eventsContext = eventsCanvas.getContext('2d');
    const severityCounts = { 
        [SEVERITY.INFO]: 0, 
        [SEVERITY.WARNING]: 0, 
        [SEVERITY.ALARM]: 0 
    };
    events.forEach(eventEntry => severityCounts[eventEntry.severity]++);
    
    eventsChartInstance = new Chart(eventsContext, {
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