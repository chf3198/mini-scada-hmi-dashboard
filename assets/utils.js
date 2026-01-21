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
 * Time is injectable for true purity and testability.
 * @param {number|null} timestamp - Unix timestamp in milliseconds, or null
 * @param {number} currentTime - Current timestamp (injectable, defaults to Date.now())
 * @returns {string} Relative time string (e.g., "45s ago") or "Never" if null
 * @example formatAgo(Date.now() - 5000) // => "5s ago"
 * @pure (when currentTime is provided)
 */
function formatAgo(timestamp, currentTime = Date.now()) {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((currentTime - timestamp) / 1000);
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
 * Uses pure functional pipeline with injected time.
 * @param {number} currentTime - Current timestamp (injectable for testing)
 * @returns {number} Total downtime minutes since midnight
 * @example calculateDowntimeToday(Date.now()) // => 45.5
 * @pure (when currentTime is provided)
 */
function calculateDowntimeToday(currentTime = Date.now()) {
    const today = new Date(currentTime);
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    
    return pipe(
        downtimeEntries,
        filter(entry => entry.end >= todayStart),
        reduce((sum, entry) => sum + (entry.end - entry.start) / TIME.MS_PER_MINUTE, 0)
    );
}

/**
 * Pure function to calculate metrics from current data.
 * Does NOT mutate global state.
 * @param {number} currentTime - Current timestamp
 * @returns {Object} Calculated metrics object
 * @pure
 */
function computeMetrics(currentTime = Date.now()) {
    const last24h = currentTime - TIME.MS_PER_DAY;
    
    const alarmsCount = pipe(
        events,
        filter(event => event.timestamp >= last24h && event.severity === SEVERITY.ALARM),
        arr => arr.length
    );
    
    const downCount = pipe(
        machines,
        filter(machine => machine.status === MACHINE_STATUS.DOWN),
        arr => arr.length
    );
    
    const downtimeMinutes = calculateDowntimeToday(currentTime);
    
    return freezeShallow({
        alarmsLast24h: alarmsCount,
        machinesDown: downCount,
        downtimeMinutesToday: downtimeMinutes
    });
}

/**
 * Updates global metrics based on current state.
 * This is a bridge function that applies pure calculations to mutable globals.
 * @sideeffect Modifies global alarmsLast24h, machinesDown, downtimeMinutesToday
 * @deprecated Use computeMetrics() for pure calculations
 */
function updateMetrics() {
    const metrics = computeMetrics(Date.now());
    alarmsLast24h = metrics.alarmsLast24h;
    machinesDown = metrics.machinesDown;
    downtimeMinutesToday = metrics.downtimeMinutesToday;
}

// ============================================================================
// EVENT MANAGEMENT FUNCTIONS (with Immutable Patterns)
// ============================================================================

/**
 * Pure function to create a new event object.
 * @param {Array} currentEvents - Current events array
 * @param {number} machineId - ID of the machine generating the event
 * @param {string} severity - Event severity (INFO, WARN, ALARM)
 * @param {string} message - Event message/description
 * @param {number} timestamp - Event timestamp
 * @returns {Object} New event object
 * @pure
 */
function createEvent(currentEvents, machineId, severity, message, timestamp = Date.now()) {
    const maxId = currentEvents.length > 0 
        ? Math.max(...currentEvents.map(e => e.id)) 
        : 0;
    
    return freezeShallow({
        id: maxId + 1,
        machineId,
        timestamp,
        severity,
        message,
        acknowledged: false
    });
}

/**
 * Pure function to add event to events array immutably.
 * @param {Array} currentEvents - Current events array
 * @param {Object} newEvent - New event to add
 * @param {number} maxEvents - Maximum events to keep
 * @returns {Array} New events array with event prepended
 * @pure
 */
function addEventImmutable(currentEvents, newEvent, maxEvents = SIMULATION.MAX_EVENTS) {
    return [newEvent, ...currentEvents].slice(0, maxEvents);
}

/**
 * Generates a new event and adds it to the events array.
 * Bridge function that applies pure operations to mutable global.
 * @param {number} machineId - ID of the machine generating the event
 * @param {string} severity - Event severity (INFO, WARN, ALARM)
 * @param {string} message - Event message/description
 * @sideeffect Modifies global events array and triggers metrics update
 */
function generateEvent(machineId, severity, message) {
    const newEvent = createEvent(events, machineId, severity, message, Date.now());
    events = addEventImmutable(events, newEvent);
    updateMetrics();
}

/**
 * Pure function to acknowledge an event immutably.
 * @param {Array} currentEvents - Current events array
 * @param {number} eventId - ID of the event to acknowledge
 * @returns {Array} New events array with event acknowledged
 * @pure
 */
function acknowledgeEventImmutable(currentEvents, eventId) {
    return currentEvents.map(event =>
        event.id === eventId
            ? { ...event, acknowledged: true }
            : event
    );
}

/**
 * Acknowledges an alarm event by ID.
 * Bridge function that applies pure operations to mutable global.
 * @param {number} eventId - ID of the event to acknowledge
 * @sideeffect Modifies event's acknowledged status and generates acknowledgment event
 */
function acknowledgeAlarm(eventId) {
    const event = events.find(evt => evt.id === eventId);
    if (event) {
        events = acknowledgeEventImmutable(events, eventId);
        generateEvent(event.machineId, SEVERITY.INFO, `Alarm acknowledged: ${event.message}`);
    }
}

/**
 * Pure function to create a downtime entry object.
 * @param {Array} currentEntries - Current downtime entries
 * @param {number} machineId - ID of the machine
 * @param {string} reason - Reason for downtime
 * @param {string} notes - Additional notes
 * @param {number} start - Start timestamp
 * @param {number} end - End timestamp
 * @returns {Object} New downtime entry object
 * @pure
 */
function createDowntimeEntry(currentEntries, machineId, reason, notes, start, end) {
    const maxId = currentEntries.length > 0 
        ? Math.max(...currentEntries.map(d => d.id)) 
        : 0;
    
    return freezeShallow({
        id: maxId + 1,
        machineId,
        start,
        end,
        reason,
        notes
    });
}

/**
 * Adds a new downtime entry for a machine.
 * Bridge function that applies pure operations to mutable global.
 * @param {number} machineId - ID of the machine
 * @param {string} reason - Reason for downtime (Maintenance, Failure, Setup)
 * @param {string} notes - Additional notes about the downtime
 * @param {string} startStr - Start datetime string
 * @param {string} endStr - End datetime string
 * @sideeffect Modifies global downtimeEntries array and triggers metrics update
 */
function addDowntimeEntry(machineId, reason, notes, startStr, endStr) {
    const entry = createDowntimeEntry(
        downtimeEntries,
        machineId,
        reason,
        notes,
        new Date(startStr).getTime(),
        new Date(endStr).getTime()
    );
    downtimeEntries = [...downtimeEntries, entry];
    updateMetrics();
}

// ============================================================================
// SIMULATION FUNCTIONS (with Immutable Patterns)
// ============================================================================

/**
 * Pure function to update a machine immutably.
 * @param {Array} currentMachines - Current machines array
 * @param {number} machineId - ID of machine to update
 * @param {Object} updates - Properties to update
 * @returns {Array} New machines array
 * @pure
 */
function updateMachineImmutable(currentMachines, machineId, updates) {
    return currentMachines.map(machine =>
        machine.id === machineId
            ? { ...machine, ...updates }
            : machine
    );
}

/**
 * Pure function to simulate one tick for all machines.
 * Returns new machines array without mutating the original.
 * @param {Array} currentMachines - Current machines array
 * @param {number} currentTime - Current timestamp
 * @returns {{machines: Array, events: Array<Object>}} New machines and generated events
 * @pure
 */
function simulateTick(currentMachines, currentTime) {
    const generatedEvents = [];
    
    const newMachines = currentMachines.map(machine => {
        // Update heartbeat
        let updatedMachine = { ...machine, lastHeartbeat: currentTime };
        
        // Random status change
        const randomValue = Math.random();
        if (randomValue < SIMULATION.STATUS_CHANGE_PROBABILITY) {
            const statuses = [MACHINE_STATUS.RUNNING, MACHINE_STATUS.IDLE, MACHINE_STATUS.DOWN];
            const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            if (newStatus !== machine.status) {
                updatedMachine = { ...updatedMachine, status: newStatus };
                
                // Create event for status change
                let severity, message;
                if (newStatus === MACHINE_STATUS.DOWN) {
                    severity = SEVERITY.ALARM;
                    message = `${machine.name} went down`;
                } else if (newStatus === MACHINE_STATUS.IDLE) {
                    severity = SEVERITY.WARNING;
                    message = `${machine.name} idle`;
                } else {
                    severity = SEVERITY.INFO;
                    message = `${machine.name} running`;
                }
                generatedEvents.push({ machineId: machine.id, severity, message });
            }
        }
        
        // Random units per minute
        const range = SIMULATION.MAX_UNITS_PER_MIN - SIMULATION.MIN_UNITS_PER_MIN;
        updatedMachine = {
            ...updatedMachine,
            unitsPerMin: Math.floor(Math.random() * range) + SIMULATION.MIN_UNITS_PER_MIN
        };
        
        return updatedMachine;
    });
    
    return { machines: newMachines, events: generatedEvents };
}

/**
 * Starts the simulation mode, generating random machine events.
 * Uses immutable patterns internally.
 * @sideeffect Modifies global simulation state and machine data
 */
function startSimulation() {
    simulationRunning = true;
    lastSimulated = Date.now();
    
    // Update UI to show simulation is running
    renderCurrentView();
    
    simulationInterval = setInterval(() => {
        const currentTime = Date.now();
        
        // Get immutable simulation result
        const tickResult = simulateTick(machines, currentTime);
        
        // Apply immutable result to global (bridge pattern)
        machines.length = 0;
        machines.push(...tickResult.machines);
        
        // Generate events from simulation
        tickResult.events.forEach(evt => {
            generateEvent(evt.machineId, evt.severity, evt.message);
        });
        
        lastSimulated = currentTime;
        
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
 * Pure function to reset all checklist items to unchecked.
 * @param {Object} checklist - Current checklist object
 * @returns {Object} New checklist with all items unchecked
 * @pure
 */
function resetChecklistImmutable(checklist) {
    return Object.keys(checklist).reduce((acc, sectionName) => ({
        ...acc,
        [sectionName]: checklist[sectionName].map(item => ({
            ...item,
            checked: false
        }))
    }), {});
}

/**
 * Resets all checklist items to unchecked state.
 * Uses immutable update pattern internally.
 * Requires user confirmation before proceeding.
 * @sideeffect Modifies global commissioningChecklist and updates UI
 */
function resetChecklist() {
    if (!confirm('Are you sure you want to reset ALL checklist items to unchecked?')) {
        return;
    }
    
    // Apply immutable reset
    commissioningChecklist = resetChecklistImmutable(commissioningChecklist);
    
    saveChecklistToLocalStorage();
    renderCurrentView();
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Load saved checklist on module load
loadChecklistFromLocalStorage();