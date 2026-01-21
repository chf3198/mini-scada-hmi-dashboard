'use strict';

/**
 * @module templates
 * @description HTML template functions for the Mini SCADA HMI Dashboard.
 * Separates presentation from logic for maintainability.
 * All functions are pure - they return HTML strings based on input data.
 * @requires config/constants
 * @author Mini SCADA HMI Team
 * @license MIT
 */

// ============================================================================
// COMPONENT TEMPLATES
// ============================================================================

/**
 * Renders a machine card for the overview dashboard.
 * @param {Object} machine - The machine object
 * @param {number} machine.id - Machine ID
 * @param {string} machine.name - Machine display name
 * @param {string} machine.status - Current status (RUN/IDLE/DOWN)
 * @param {number} machine.healthScore - Health percentage 0-100
 * @param {number} machine.lastHeartbeat - Last heartbeat timestamp
 * @returns {string} HTML string for machine card
 * @pure
 */
function templateMachineCard(machine) {
    const secondsSinceHeartbeat = Math.floor((Date.now() - machine.lastHeartbeat) / 1000);
    return `
        <div class="bg-white dark:bg-gray-800 p-4 rounded shadow" data-tippy-content="Equipment asset card showing real-time status from PLC/RTU data">
            <h3 class="text-lg font-bold">${machine.name}</h3>
            <div class="flex items-center mt-2" data-tippy-content="RUN=producing, IDLE=standby, DOWN=faulted or stopped">
                <div class="w-4 h-4 rounded-full ${getStatusColor(machine.status)} mr-2"></div>
                <span>${machine.status}</span>
            </div>
            <p data-tippy-content="Overall Equipment Effectiveness (OEE) health indicator derived from availability, performance, and quality">Health: ${machine.healthScore}%</p>
            <p data-tippy-content="Time since last heartbeat signal from the machine's PLC or controller - monitors communication health">Last HB: ${secondsSinceHeartbeat}s ago</p>
            <a href="#/machine/${machine.id}" class="text-blue-600 hover:underline" data-tippy-content="View detailed event log, downtime entries, and diagnostic data for this machine">Details</a>
        </div>
    `;
}

/**
 * Renders an event row for the event log table.
 * @param {Object} eventEntry - The event object
 * @param {number} eventEntry.id - Event ID
 * @param {number} eventEntry.timestamp - Event timestamp
 * @param {string} eventEntry.severity - Event severity (INFO/WARN/ALARM)
 * @param {string} eventEntry.message - Event message
 * @param {boolean} eventEntry.acknowledged - Whether event is acknowledged
 * @returns {string} HTML string for table row
 * @pure
 */
function templateEventRow(eventEntry) {
    const ackCell = eventEntry.acknowledged 
        ? 'Yes' 
        : `<button onclick="acknowledgeAlarm(${eventEntry.id})" class="text-blue-600">Ack</button>`;
    
    return `
        <tr class="${eventEntry.acknowledged ? 'opacity-50' : ''}">
            <td>${formatTime(eventEntry.timestamp)}</td>
            <td class="${getSeverityColor(eventEntry.severity)}">${eventEntry.severity}</td>
            <td>${eventEntry.message}</td>
            <td>${ackCell}</td>
        </tr>
    `;
}

/**
 * Renders a downtime entry row for the downtime table.
 * @param {Object} downtimeEntry - The downtime object
 * @param {number} downtimeEntry.start - Start timestamp
 * @param {number} downtimeEntry.end - End timestamp
 * @param {string} downtimeEntry.reason - Downtime reason
 * @param {string} downtimeEntry.notes - Additional notes
 * @returns {string} HTML string for table row
 * @pure
 */
function templateDowntimeRow(downtimeEntry) {
    return `
        <tr>
            <td>${formatTime(downtimeEntry.start)}</td>
            <td>${formatTime(downtimeEntry.end)}</td>
            <td>${downtimeEntry.reason}</td>
            <td>${downtimeEntry.notes}</td>
        </tr>
    `;
}

/**
 * Renders a runbook card with expandable steps.
 * @param {Object} runbook - The runbook object
 * @param {string} runbook.code - Runbook code (e.g., 'ALRM-001')
 * @param {string} runbook.title - Runbook title
 * @param {string[]} runbook.steps - Array of procedure steps
 * @returns {string} HTML string for runbook card
 * @pure
 */
function templateRunbookCard(runbook) {
    const stepsHtml = runbook.steps
        .map(step => `<li class="pl-2">${step}</li>`)
        .join('');
    
    return `
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
                            ${stepsHtml}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders a checklist item with checkbox.
 * @param {string} section - The section name
 * @param {Object} checklistItem - The checklist item
 * @param {string} checklistItem.item - Item text
 * @param {boolean} checklistItem.checked - Whether item is checked
 * @returns {string} HTML string for checklist item
 * @pure
 */
function templateChecklistItem(section, checklistItem) {
    const checkedClass = checklistItem.checked ? 'bg-green-50 dark:bg-green-900/20' : '';
    const textClass = checklistItem.checked ? 'line-through text-gray-400' : '';
    const checkmark = checklistItem.checked ? '<span class="ml-auto text-green-600">✓</span>' : '';
    
    return `
        <label class="flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${checkedClass}">
            <input type="checkbox" ${checklistItem.checked ? 'checked' : ''} onchange="toggleChecklist('${section}', '${checklistItem.item}')" class="w-5 h-5 mr-3 accent-green-600" data-tippy-content="Check when this item has been verified and documented">
            <span class="${textClass}">${checklistItem.item}</span>
            ${checkmark}
        </label>
    `;
}

/**
 * Renders a commissioning section with progress bar.
 * @param {string} section - Section name (e.g., 'Safety')
 * @param {Object[]} sectionItems - Array of checklist items
 * @returns {string} HTML string for section
 * @pure
 */
function templateCommissioningSection(section, sectionItems) {
    const sectionChecked = sectionItems.filter(item => item.checked).length;
    const sectionTotal = sectionItems.length;
    const sectionProgress = sectionTotal > 0 ? Math.round((sectionChecked / sectionTotal) * 100) : 0;
    const isComplete = sectionProgress === 100;
    
    const itemsHtml = sectionItems
        .map(item => templateChecklistItem(section, item))
        .join('');
    
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
                ${itemsHtml}
            </div>
        </div>
    `;
}

// ============================================================================
// METRIC CARDS
// ============================================================================

/**
 * Renders a metric card for the overview dashboard.
 * @param {string} title - Card title
 * @param {string|number} value - Metric value
 * @param {string} colorClass - Tailwind color class (e.g., 'text-red-600')
 * @param {string} tooltip - Tooltip content
 * @returns {string} HTML string for metric card
 * @pure
 */
function templateMetricCard(title, value, colorClass, tooltip) {
    return `
        <div class="bg-white dark:bg-gray-800 p-4 rounded shadow" data-tippy-content="${tooltip}">
            <h3>${title}</h3>
            <p class="text-2xl font-bold ${colorClass}">${value}</p>
        </div>
    `;
}

// ============================================================================
// HELP PAGE SECTIONS
// ============================================================================

/**
 * Renders a help section card.
 * @param {string} title - Section title
 * @param {string} colorClass - Title color class
 * @param {string} icon - Emoji icon
 * @param {string} content - HTML content for the section
 * @returns {string} HTML string for help section
 * @pure
 */
function templateHelpSection(title, colorClass, icon, content) {
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 class="text-xl font-bold mb-3 ${colorClass}">${icon} ${title}</h3>
            ${content}
        </div>
    `;
}

/**
 * Returns the complete Help/User Manual page content.
 * This is a static template with no dynamic data.
 * @returns {string} HTML string for the help page
 * @pure
 */
function templateHelpPage() {
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
// OVERVIEW PAGE
// ============================================================================

/**
 * Renders the simulation controls for the overview page.
 * @param {boolean} isRunning - Whether simulation is currently running
 * @param {number} lastSimulatedTime - Timestamp of last simulation tick
 * @returns {string} HTML string for simulation controls
 * @pure
 */
function templateSimulationControls(isRunning, lastSimulatedTime) {
    const buttonClass = isRunning ? 'animate-pulse' : '';
    const buttonText = isRunning ? 'Stop' : 'Start';
    const statusIndicator = isRunning 
        ? '<span class="flex items-center gap-2"><span class="w-3 h-3 bg-green-500 rounded-full animate-ping"></span><span class="text-green-600 font-medium">Running...</span></span>' 
        : '';
    
    return `
        <div class="mt-4 flex items-center gap-4">
            <button onclick="simulationRunning ? stopSimulation() : startSimulation()" id="sim-btn" class="bg-blue-600 text-white px-4 py-2 rounded ${buttonClass}" data-tippy-content="Demo mode: simulates real-time data from PLCs/RTUs including status changes, alarms, and events">
                ${buttonText} Simulation
            </button>
            <span id="sim-status">${statusIndicator}</span>
            <span id="sim-ticker" class="text-sm text-gray-600 dark:text-gray-400" data-tippy-content="Timestamp of last data poll - in production this would be real-time updates via OPC-UA or MQTT">Last simulated: ${formatAgo(lastSimulatedTime)}</span>
        </div>
    `;
}

// ============================================================================
// MACHINE DETAIL PAGE
// ============================================================================

/**
 * Renders the machine health card.
 * @param {Object} machine - The machine object
 * @returns {string} HTML string for health card
 * @pure
 */
function templateMachineHealthCard(machine) {
    const secondsSinceHeartbeat = Math.floor((Date.now() - machine.lastHeartbeat) / 1000);
    
    return `
        <div class="bg-white dark:bg-gray-800 p-4 rounded shadow" data-tippy-content="Real-time health metrics from PLC/controller - used for predictive maintenance and performance monitoring">
            <h3>Machine Health</h3>
            <p data-tippy-content="Current operating state: RUN (producing), IDLE (standby), DOWN (stopped/faulted)">Status: <span class="font-bold ${getStatusColor(machine.status)} text-white px-2 py-1 rounded">${machine.status}</span></p>
            <p data-tippy-content="Watchdog timer - if this exceeds threshold, communication with PLC may be lost">Last Heartbeat: ${secondsSinceHeartbeat}s ago</p>
            <p data-tippy-content="Composite score based on availability, performance, and quality metrics (OEE factors)">Health Score: ${machine.healthScore}%</p>
            <p data-tippy-content="Current throughput rate - used for production tracking and bottleneck analysis">Units/min: ${machine.unitsPerMin || 0}</p>
            <button onclick="runRateTest(${machine.id})" class="bg-green-600 text-white px-4 py-2 rounded mt-2" data-tippy-content="Proof of Rate test: validates machine meets production targets over 60 seconds - used during commissioning and qualification">Run 60s Rate Test</button>
        </div>
    `;
}

/**
 * Renders the downtime entry form.
 * @param {number} machineId - The machine ID for the form
 * @returns {string} HTML string for downtime form
 * @pure
 */
function templateDowntimeForm(machineId) {
    return `
        <div class="bg-white dark:bg-gray-800 p-4 rounded shadow" data-tippy-content="Manual downtime logging for events not automatically captured - enables accurate OEE tracking">
            <h3>Create Downtime Entry</h3>
            <form onsubmit="addDowntime(event, ${machineId})">
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
    `;
}

/**
 * Renders the event log table.
 * @param {Object[]} eventList - Array of event objects
 * @returns {string} HTML string for event log
 * @pure
 */
function templateEventLog(eventList) {
    const eventRows = eventList.map(templateEventRow).join('');
    
    return `
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
    `;
}

/**
 * Renders the downtime entries table.
 * @param {Object[]} downtimeList - Array of downtime objects
 * @returns {string} HTML string for downtime table
 * @pure
 */
function templateDowntimeTable(downtimeList) {
    const downtimeRows = downtimeList.map(templateDowntimeRow).join('');
    
    return `
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
// COMMISSIONING PAGE
// ============================================================================

/**
 * Renders the overall progress card for commissioning.
 * @param {number} checkedItems - Number of completed items
 * @param {number} totalItems - Total number of items
 * @returns {string} HTML string for progress card
 * @pure
 */
function templateProgressCard(checkedItems, totalItems) {
    const overallProgress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
    const gradientClass = overallProgress === 100 ? 'from-green-500 to-green-600' : 'from-blue-500 to-blue-600';
    const completionText = overallProgress === 100 ? '<span class="text-sm">✅ Ready for handoff!</span>' : '';
    
    return `
        <div class="bg-gradient-to-r ${gradientClass} text-white p-6 rounded-lg shadow-lg mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-medium opacity-90">Overall Progress</h3>
                    <p class="text-3xl font-bold">${checkedItems} of ${totalItems} items complete</p>
                </div>
                <div class="text-right">
                    <div class="text-5xl font-bold">${overallProgress}%</div>
                    ${completionText}
                </div>
            </div>
            <div class="mt-4 h-3 bg-white/30 rounded-full overflow-hidden">
                <div class="h-full bg-white transition-all duration-500" style="width: ${overallProgress}%"></div>
            </div>
        </div>
    `;
}

/**
 * Renders the import/export action buttons.
 * @returns {string} HTML string for action buttons
 * @pure
 */
function templateCommissioningActions() {
    return `
        <div class="flex gap-3 mt-6">
            <button onclick="exportChecklist()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors" data-tippy-content="Download checklist as JSON file for documentation and audit trail">
                <span>📤</span> Export to JSON
            </button>
            <button onclick="document.getElementById('import-file').click()" class="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors" data-tippy-content="Import a previously exported checklist JSON file">
                <span>📥</span> Import from JSON
            </button>
            <input type="file" id="import-file" accept=".json" onchange="importChecklist(event)" class="hidden">
        </div>
    `;
}
