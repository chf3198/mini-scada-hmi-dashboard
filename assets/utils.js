// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Curtis Franks <curtisfranks@gmail.com>

'use strict';

/**
 * @file Utility functions for formatting, calculations, simulation, and persistence.
 * @module utils
 * @description Contains both pure utility functions and side-effect functions for state management.
 * @requires config/constants
 * @requires data
 * @author Curtis Franks <curtisfranks@gmail.com>
 * @copyright 2026 Curtis Franks
 * @license MIT
 * @see {@link https://github.com/chf3198/mini-scada-hmi-dashboard}
 */

// ============================================================================
// PURE FORMATTING FUNCTIONS
// ============================================================================

/**
 * Formats a Unix timestamp to a locale-specific date/time string.
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date/time string (e.g., "1/20/2026, 3:45:00 PM")
 * @example formatTime(1705776300000) // => "1/20/2026, 3:45:00 PM"
 * @pure
 */
function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString();
}

/**
 * Formats a timestamp as a relative "X seconds ago" string.
 * @param {number|null} timestamp - Unix timestamp in milliseconds, or null
 * @returns {string} Relative time string (e.g., "45s ago") or "Never" if null
 * @example formatAgo(Date.now() - 5000) // => "5s ago"
 * @pure
 */
function formatAgo(timestamp) {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    return seconds + 's ago';
}

/**
 * Returns the CSS color class for a given event severity level.
 * @param {string} severity - Severity level (INFO, WARN, ALARM)
 * @returns {string} Tailwind CSS text color class
 * @example getSeverityColor('ALARM') // => "text-red-600"
 * @pure
 */
function getSeverityColor(severity) {
    return SEVERITY_COLORS[severity] || SEVERITY_COLORS.DEFAULT;
}

/**
 * Returns the CSS color class for a given machine status.
 * @param {string} status - Machine status (RUN, IDLE, DOWN)
 * @returns {string} Tailwind CSS background color class
 * @example getStatusColor('RUN') // => "bg-green-500"
 * @pure
 */
function getStatusColor(status) {
    return STATUS_COLORS[status] || STATUS_COLORS.DEFAULT;
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculates total downtime in minutes for the current day.
 * @returns {number} Total downtime minutes since midnight
 * @example calculateDowntimeToday() // => 45.5
 */
function calculateDowntimeToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    
    return downtimeEntries
        .filter(entry => entry.end >= todayStart)
        .reduce((sum, entry) => sum + (entry.end - entry.start) / TIME.MS_PER_MINUTE, 0);
}

/**
 * Updates global metrics based on current state.
 * Calculates alarms in last 24h, machines down, and downtime today.
 * @sideeffect Modifies global alarmsLast24h, machinesDown, downtimeMinutesToday
 */
function updateMetrics() {
    const now = Date.now();
    const last24h = now - TIME.MS_PER_DAY;
    
    alarmsLast24h = events
        .filter(event => event.timestamp >= last24h && event.severity === SEVERITY.ALARM)
        .length;
    
    machinesDown = machines
        .filter(machine => machine.status === MACHINE_STATUS.DOWN)
        .length;
    
    downtimeMinutesToday = calculateDowntimeToday();
}

// ============================================================================
// EVENT MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Generates a new event and adds it to the events array.
 * @param {number} machineId - ID of the machine generating the event
 * @param {string} severity - Event severity (INFO, WARN, ALARM)
 * @param {string} message - Event message/description
 * @sideeffect Modifies global events array and triggers metrics update
 */
function generateEvent(machineId, severity, message) {
    const event = {
        id: events.length + 1,
        machineId,
        timestamp: Date.now(),
        severity,
        message,
        acknowledged: false
    };
    events.unshift(event);
    
    // Keep only the configured maximum number of events
    if (events.length > SIMULATION.MAX_EVENTS) {
        events.pop();
    }
    
    updateMetrics();
}

/**
 * Acknowledges an alarm event by ID.
 * @param {number} eventId - ID of the event to acknowledge
 * @sideeffect Modifies event's acknowledged status and generates acknowledgment event
 */
function acknowledgeAlarm(eventId) {
    const event = events.find(evt => evt.id === eventId);
    if (event) {
        event.acknowledged = true;
        generateEvent(event.machineId, SEVERITY.INFO, `Alarm acknowledged: ${event.message}`);
    }
}

/**
 * Adds a new downtime entry for a machine.
 * @param {number} machineId - ID of the machine
 * @param {string} reason - Reason for downtime (Maintenance, Failure, Setup)
 * @param {string} notes - Additional notes about the downtime
 * @param {string} start - Start datetime string
 * @param {string} end - End datetime string
 * @sideeffect Modifies global downtimeEntries array and triggers metrics update
 */
function addDowntimeEntry(machineId, reason, notes, start, end) {
    const entry = {
        id: downtimeEntries.length + 1,
        machineId,
        start: new Date(start).getTime(),
        end: new Date(end).getTime(),
        reason,
        notes
    };
    downtimeEntries.push(entry);
    updateMetrics();
}

// ============================================================================
// SIMULATION FUNCTIONS
// ============================================================================

/**
 * Starts the simulation mode, generating random machine events.
 * Updates machine statuses and generates events at regular intervals.
 * @sideeffect Modifies global simulation state and machine data
 */
function startSimulation() {
    simulationRunning = true;
    lastSimulated = Date.now();
    
    // Update UI to show simulation is running
    renderCurrentView();
    
    simulationInterval = setInterval(() => {
        // Update each machine's data
        machines.forEach(machine => {
            machine.lastHeartbeat = Date.now();
            
            const randomValue = Math.random();
            if (randomValue < SIMULATION.STATUS_CHANGE_PROBABILITY) {
                const statuses = [MACHINE_STATUS.RUNNING, MACHINE_STATUS.IDLE, MACHINE_STATUS.DOWN];
                const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
                
                if (newStatus !== machine.status) {
                    machine.status = newStatus;
                    
                    // Generate appropriate event for status change
                    if (newStatus === MACHINE_STATUS.DOWN) {
                        generateEvent(machine.id, SEVERITY.ALARM, `${machine.name} went down`);
                    } else if (newStatus === MACHINE_STATUS.IDLE) {
                        generateEvent(machine.id, SEVERITY.WARNING, `${machine.name} idle`);
                    } else {
                        generateEvent(machine.id, SEVERITY.INFO, `${machine.name} running`);
                    }
                }
            }
            
            // Simulate random units per minute
            const range = SIMULATION.MAX_UNITS_PER_MIN - SIMULATION.MIN_UNITS_PER_MIN;
            machine.unitsPerMin = Math.floor(Math.random() * range) + SIMULATION.MIN_UNITS_PER_MIN;
        });
        
        lastSimulated = Date.now();
        
        // Only update the ticker element, not the full view
        const ticker = document.getElementById('sim-ticker');
        if (ticker) {
            ticker.textContent = 'Last simulated: ' + formatAgo(lastSimulated);
        }
    }, SIMULATION.INTERVAL_MS);
}

/**
 * Stops the simulation mode.
 * @sideeffect Clears simulation interval and updates UI
 */
function stopSimulation() {
    simulationRunning = false;
    clearInterval(simulationInterval);
    renderCurrentView();
}

/**
 * Runs a 60-second rate test for a machine.
 * Measures average units per minute and compares to target.
 * @param {number} machineId - ID of the machine to test
 * @sideeffect Displays alert with test results
 */
function runRateTest(machineId) {
    const machine = machines.find(mach => mach.id === machineId);
    if (!machine) return;
    
    const startTime = Date.now();
    let totalUnits = 0;
    
    const testInterval = setInterval(() => {
        totalUnits += machine.unitsPerMin || 0;
    }, RATE_TEST.SAMPLE_INTERVAL_MS);
    
    setTimeout(() => {
        clearInterval(testInterval);
        const durationMinutes = (Date.now() - startTime) / TIME.MS_PER_MINUTE;
        const rate = totalUnits / durationMinutes;
        const pass = rate >= RATE_TEST.TARGET_UNITS_PER_MIN;
        
        alert(`Rate test for ${machine.name}: ${rate.toFixed(2)} units/min. ${pass ? 'PASS' : 'FAIL'} (target: ${RATE_TEST.TARGET_UNITS_PER_MIN})`);
    }, RATE_TEST.DURATION_MS);
}

// ============================================================================
// PERSISTENCE FUNCTIONS
// ============================================================================

/**
 * Saves the commissioning checklist to localStorage.
 * @sideeffect Writes to localStorage
 */
function saveChecklistToLocalStorage() {
    localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(commissioningChecklist));
}

/**
 * Loads the commissioning checklist from localStorage if available.
 * @sideeffect Modifies global commissioningChecklist
 */
function loadChecklistFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEYS.CHECKLIST);
    if (saved) {
        commissioningChecklist = JSON.parse(saved);
    }
}

/**
 * Exports the commissioning checklist as a downloadable JSON file.
 * @sideeffect Triggers file download in browser
 */
function exportChecklist() {
    const dataStr = JSON.stringify(commissioningChecklist, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'commissioning-checklist.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates imported checklist JSON structure.
 * Checks for required sections and proper item format.
 * @param {*} data - Data to validate (should be an object)
 * @returns {{valid: boolean, errors: string[]}} Validation result with error messages
 * @example
 * validateChecklistJSON({ Safety: [{ item: 'Test', checked: true }] })
 * // => { valid: false, errors: ['Missing required section: "IO"', ...] }
 * @pure
 */
function validateChecklistJSON(data) {
    const errors = [];
    
    // Check if data is an object
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        errors.push('Invalid format: expected an object with section keys');
        return { valid: false, errors };
    }
    
    // Check for required sections
    for (const section of REQUIRED_CHECKLIST_SECTIONS) {
        if (!(section in data)) {
            errors.push(`Missing required section: "${section}"`);
        }
    }
    
    // Validate each section's items
    for (const [sectionName, items] of Object.entries(data)) {
        if (!Array.isArray(items)) {
            errors.push(`Section "${sectionName}" must be an array`);
            continue;
        }
        
        for (let index = 0; index < items.length; index++) {
            const checklistItem = items[index];
            
            if (typeof checklistItem !== 'object' || checklistItem === null) {
                errors.push(`Section "${sectionName}" item ${index + 1} must be an object`);
                continue;
            }
            if (typeof checklistItem.item !== 'string' || checklistItem.item.trim() === '') {
                errors.push(`Section "${sectionName}" item ${index + 1} missing valid "item" property`);
            }
            if (typeof checklistItem.checked !== 'boolean') {
                errors.push(`Section "${sectionName}" item ${index + 1} "checked" must be a boolean`);
            }
        }
    }
    
    return { valid: errors.length === 0, errors };
}

/**
 * Imports a checklist from a JSON file selected by the user.
 * Validates structure before importing.
 * @param {Event} event - File input change event
 * @sideeffect Modifies global commissioningChecklist and updates UI
 */
function importChecklist(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const statusDiv = document.getElementById('import-status');
    
    const reader = new FileReader();
    reader.onload = function(fileEvent) {
        try {
            const data = JSON.parse(fileEvent.target.result);
            const validation = validateChecklistJSON(data);
            
            if (!validation.valid) {
                statusDiv.innerHTML = `
                    <div class="bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 p-4 rounded-lg">
                        <strong>⚠️ Import Failed - Invalid JSON structure:</strong>
                        <ul class="list-disc list-inside mt-2">
                            ${validation.errors.map(errorMsg => `<li>${errorMsg}</li>`).join('')}
                        </ul>
                    </div>
                `;
                statusDiv.classList.remove('hidden');
                return;
            }
            
            // Confirm before overwriting
            if (!confirm('This will replace your current checklist. Continue?')) {
                event.target.value = '';
                return;
            }
            
            commissioningChecklist = data;
            saveChecklistToLocalStorage();
            renderCurrentView();
            
            statusDiv.innerHTML = `
                <div class="bg-green-100 dark:bg-green-900/50 border border-green-400 text-green-700 dark:text-green-300 p-4 rounded-lg">
                    <strong>✅ Import Successful!</strong> Checklist has been updated.
                </div>
            `;
            statusDiv.classList.remove('hidden');
            setTimeout(() => statusDiv.classList.add('hidden'), TIME.SUCCESS_MESSAGE_DURATION_MS);
            
        } catch (parseError) {
            statusDiv.innerHTML = `
                <div class="bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 p-4 rounded-lg">
                    <strong>⚠️ Import Failed:</strong> ${parseError.message}. Ensure the file is valid JSON.
                </div>
            `;
            statusDiv.classList.remove('hidden');
        }
        
        // Reset file input
        event.target.value = '';
    };
    reader.readAsText(file);
}

/**
 * Resets all checklist items to unchecked state.
 * Requires user confirmation before proceeding.
 * @sideeffect Modifies global commissioningChecklist and updates UI
 */
function resetChecklist() {
    if (!confirm('Are you sure you want to reset ALL checklist items to unchecked?')) {
        return;
    }
    
    for (const sectionName of Object.keys(commissioningChecklist)) {
        commissioningChecklist[sectionName].forEach(checklistItem => {
            checklistItem.checked = false;
        });
    }
    
    saveChecklistToLocalStorage();
    renderCurrentView();
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Load saved checklist on module load
loadChecklistFromLocalStorage();