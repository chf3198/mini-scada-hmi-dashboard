// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Curtis Franks <curtisfranks@gmail.com>

'use strict';

/**
 * @file Immutable state management with pure reducer functions.
 * @module state
 * @description Centralized state container following Redux-like patterns.
 * State is immutable - all updates return new state objects.
 * @requires fp
 * @author Curtis Franks <curtisfranks@gmail.com>
 * @copyright 2026 Curtis Franks
 * @license MIT
 * @see {@link https://github.com/chf3198/mini-scada-hmi-dashboard}
 */

// ============================================================================
// ACTION TYPES
// ============================================================================

/**
 * Action type constants for state mutations.
 * @constant
 * @type {Object<string, string>}
 */
const ActionTypes = Object.freeze({
    // Event actions
    ADD_EVENT: 'ADD_EVENT',
    ACKNOWLEDGE_EVENT: 'ACKNOWLEDGE_EVENT',
    
    // Machine actions
    UPDATE_MACHINE: 'UPDATE_MACHINE',
    SET_MACHINE_STATUS: 'SET_MACHINE_STATUS',
    
    // Downtime actions
    ADD_DOWNTIME: 'ADD_DOWNTIME',
    
    // Simulation actions
    START_SIMULATION: 'START_SIMULATION',
    STOP_SIMULATION: 'STOP_SIMULATION',
    TICK_SIMULATION: 'TICK_SIMULATION',
    
    // Checklist actions
    TOGGLE_CHECKLIST_ITEM: 'TOGGLE_CHECKLIST_ITEM',
    LOAD_CHECKLIST: 'LOAD_CHECKLIST',
    
    // Metrics actions
    UPDATE_METRICS: 'UPDATE_METRICS'
});

// ============================================================================
// ACTION CREATORS (Pure Functions)
// ============================================================================

/**
 * Creates an ADD_EVENT action.
 * @param {number} machineId - ID of the machine generating the event
 * @param {string} severity - Event severity (INFO, WARN, ALARM)
 * @param {string} message - Event message
 * @param {number} timestamp - Event timestamp (defaults to Date.now())
 * @returns {Object} Action object
 * @pure
 */
const createAddEventAction = (machineId, severity, message, timestamp = Date.now()) => ({
    type: ActionTypes.ADD_EVENT,
    payload: { machineId, severity, message, timestamp }
});

/**
 * Creates an ACKNOWLEDGE_EVENT action.
 * @param {number} eventId - ID of the event to acknowledge
 * @returns {Object} Action object
 * @pure
 */
const createAcknowledgeEventAction = (eventId) => ({
    type: ActionTypes.ACKNOWLEDGE_EVENT,
    payload: { eventId }
});

/**
 * Creates an UPDATE_MACHINE action.
 * @param {number} machineId - ID of the machine to update
 * @param {Object} updates - Object with properties to update
 * @returns {Object} Action object
 * @pure
 */
const createUpdateMachineAction = (machineId, updates) => ({
    type: ActionTypes.UPDATE_MACHINE,
    payload: { machineId, updates }
});

/**
 * Creates a SET_MACHINE_STATUS action.
 * @param {number} machineId - ID of the machine
 * @param {string} status - New status (RUN, IDLE, DOWN)
 * @returns {Object} Action object
 * @pure
 */
const createSetMachineStatusAction = (machineId, status) => ({
    type: ActionTypes.SET_MACHINE_STATUS,
    payload: { machineId, status }
});

/**
 * Creates an ADD_DOWNTIME action.
 * @param {number} machineId - ID of the machine
 * @param {string} reason - Reason for downtime
 * @param {string} notes - Additional notes
 * @param {number} start - Start timestamp
 * @param {number} end - End timestamp
 * @returns {Object} Action object
 * @pure
 */
const createAddDowntimeAction = (machineId, reason, notes, start, end) => ({
    type: ActionTypes.ADD_DOWNTIME,
    payload: { machineId, reason, notes, start, end }
});

/**
 * Creates a TOGGLE_CHECKLIST_ITEM action.
 * @param {string} section - Checklist section name
 * @param {string} itemName - Name of the item to toggle
 * @returns {Object} Action object
 * @pure
 */
const createToggleChecklistAction = (section, itemName) => ({
    type: ActionTypes.TOGGLE_CHECKLIST_ITEM,
    payload: { section, itemName }
});

/**
 * Creates a TICK_SIMULATION action with current timestamp.
 * @param {number} timestamp - Current timestamp
 * @returns {Object} Action object
 * @pure
 */
const createTickSimulationAction = (timestamp = Date.now()) => ({
    type: ActionTypes.TICK_SIMULATION,
    payload: { timestamp }
});

// ============================================================================
// PURE REDUCER FUNCTIONS
// ============================================================================

/**
 * Reducer for events state.
 * @param {Array} events - Current events array
 * @param {Object} action - Action object
 * @param {number} maxEvents - Maximum events to keep
 * @returns {Array} New events array
 * @pure
 */
function eventsReducer(events, action, maxEvents = 1000) {
    switch (action.type) {
        case ActionTypes.ADD_EVENT: {
            const { machineId, severity, message, timestamp } = action.payload;
            const newEvent = {
                id: events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1,
                machineId,
                timestamp,
                severity,
                message,
                acknowledged: false
            };
            // Immutably prepend and limit size
            return [newEvent, ...events].slice(0, maxEvents);
        }
        
        case ActionTypes.ACKNOWLEDGE_EVENT: {
            const { eventId } = action.payload;
            return events.map(event =>
                event.id === eventId
                    ? { ...event, acknowledged: true }
                    : event
            );
        }
        
        default:
            return events;
    }
}

/**
 * Reducer for machines state.
 * @param {Array} machines - Current machines array
 * @param {Object} action - Action object
 * @returns {Array} New machines array
 * @pure
 */
function machinesReducer(machines, action) {
    switch (action.type) {
        case ActionTypes.UPDATE_MACHINE: {
            const { machineId, updates } = action.payload;
            return machines.map(machine =>
                machine.id === machineId
                    ? { ...machine, ...updates }
                    : machine
            );
        }
        
        case ActionTypes.SET_MACHINE_STATUS: {
            const { machineId, status } = action.payload;
            return machines.map(machine =>
                machine.id === machineId
                    ? { ...machine, status }
                    : machine
            );
        }
        
        case ActionTypes.TICK_SIMULATION: {
            const { timestamp } = action.payload;
            return machines.map(machine => ({
                ...machine,
                lastHeartbeat: timestamp
            }));
        }
        
        default:
            return machines;
    }
}

/**
 * Reducer for downtime entries state.
 * @param {Array} downtimeEntries - Current downtime entries array
 * @param {Object} action - Action object
 * @returns {Array} New downtime entries array
 * @pure
 */
function downtimeReducer(downtimeEntries, action) {
    switch (action.type) {
        case ActionTypes.ADD_DOWNTIME: {
            const { machineId, reason, notes, start, end } = action.payload;
            const newEntry = {
                id: downtimeEntries.length > 0 
                    ? Math.max(...downtimeEntries.map(d => d.id)) + 1 
                    : 1,
                machineId,
                start,
                end,
                reason,
                notes
            };
            return [...downtimeEntries, newEntry];
        }
        
        default:
            return downtimeEntries;
    }
}

/**
 * Reducer for commissioning checklist state.
 * @param {Object} checklist - Current checklist object
 * @param {Object} action - Action object
 * @returns {Object} New checklist object
 * @pure
 */
function checklistReducer(checklist, action) {
    switch (action.type) {
        case ActionTypes.TOGGLE_CHECKLIST_ITEM: {
            const { section, itemName } = action.payload;
            if (!checklist[section]) {
                return checklist;
            }
            return {
                ...checklist,
                [section]: checklist[section].map(item =>
                    item.item === itemName
                        ? { ...item, checked: !item.checked }
                        : item
                )
            };
        }
        
        case ActionTypes.LOAD_CHECKLIST: {
            return { ...action.payload.checklist };
        }
        
        default:
            return checklist;
    }
}

/**
 * Reducer for simulation state.
 * @param {Object} simulation - Current simulation state
 * @param {Object} action - Action object
 * @returns {Object} New simulation state
 * @pure
 */
function simulationReducer(simulation, action) {
    switch (action.type) {
        case ActionTypes.START_SIMULATION:
            return { ...simulation, running: true, lastTick: Date.now() };
        
        case ActionTypes.STOP_SIMULATION:
            return { ...simulation, running: false };
        
        case ActionTypes.TICK_SIMULATION:
            return { ...simulation, lastTick: action.payload.timestamp };
        
        default:
            return simulation;
    }
}

// ============================================================================
// PURE METRIC CALCULATORS
// ============================================================================

/**
 * Calculates all dashboard metrics from current state.
 * This is a pure function - same inputs always produce same outputs.
 * @param {Array} events - Events array
 * @param {Array} machines - Machines array
 * @param {Array} downtimeEntries - Downtime entries array
 * @param {number} currentTime - Current timestamp for calculations
 * @returns {Object} Calculated metrics
 * @pure
 */
function calculateMetrics(events, machines, downtimeEntries, currentTime = Date.now()) {
    const last24h = currentTime - TIME.MS_PER_DAY;
    const todayStart = new Date(currentTime);
    todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();
    
    // Pure functional calculations using pipe
    const alarmsLast24h = pipe(
        events,
        filter(e => e.timestamp >= last24h && e.severity === SEVERITY.ALARM),
        arr => arr.length
    );
    
    const machinesDown = pipe(
        machines,
        filter(m => m.status === MACHINE_STATUS.DOWN),
        arr => arr.length
    );
    
    const downtimeMinutesToday = pipe(
        downtimeEntries,
        filter(entry => entry.end >= todayStartMs),
        reduce((sum, entry) => sum + (entry.end - entry.start) / TIME.MS_PER_MINUTE, 0),
        Math.floor
    );
    
    return freezeShallow({
        alarmsLast24h,
        machinesDown,
        downtimeMinutesToday
    });
}

/**
 * Calculates downtime by machine for charts.
 * @param {Array} machines - Machines array
 * @param {Array} downtimeEntries - Downtime entries array
 * @returns {Array<{name: string, downtime: number}>} Downtime per machine
 * @pure
 */
function calculateDowntimeByMachine(machines, downtimeEntries) {
    return machines.map(machine => {
        const machineDowntime = pipe(
            downtimeEntries,
            filter(entry => entry.machineId === machine.id),
            reduce((total, entry) => 
                total + (entry.end - entry.start) / TIME.MS_PER_MINUTE, 0
            )
        );
        return { name: machine.name, downtime: machineDowntime };
    });
}

/**
 * Calculates event counts by severity.
 * @param {Array} events - Events array
 * @returns {Object<string, number>} Count per severity level
 * @pure
 */
function calculateEventsBySeverity(events) {
    return pipe(
        events,
        reduce((counts, event) => ({
            ...counts,
            [event.severity]: (counts[event.severity] || 0) + 1
        }), {})
    );
}

// ============================================================================
// COMBINED ROOT REDUCER
// ============================================================================

/**
 * Root reducer that combines all sub-reducers.
 * Takes the entire state and an action, returns new state.
 * @param {Object} state - Current application state
 * @param {Object} action - Action to apply
 * @returns {Object} New application state
 * @pure
 */
function rootReducer(state, action) {
    const newEvents = eventsReducer(state.events, action, SIMULATION.MAX_EVENTS);
    const newMachines = machinesReducer(state.machines, action);
    const newDowntime = downtimeReducer(state.downtimeEntries, action);
    const newChecklist = checklistReducer(state.checklist, action);
    const newSimulation = simulationReducer(state.simulation, action);
    
    // Calculate derived metrics whenever source data changes
    const metrics = calculateMetrics(newEvents, newMachines, newDowntime);
    
    return {
        events: newEvents,
        machines: newMachines,
        downtimeEntries: newDowntime,
        checklist: newChecklist,
        simulation: newSimulation,
        metrics
    };
}

// ============================================================================
// STATE SELECTORS (Pure Functions)
// ============================================================================

/**
 * Selects a machine by ID from state.
 * @param {Object} state - Application state
 * @param {number} machineId - Machine ID to find
 * @returns {Object|undefined} The machine or undefined
 * @pure
 */
const selectMachineById = (state, machineId) => 
    state.machines.find(m => m.id === machineId);

/**
 * Selects events for a specific machine.
 * @param {Object} state - Application state
 * @param {number} machineId - Machine ID
 * @param {number} limit - Maximum events to return
 * @returns {Array} Events for the machine
 * @pure
 */
const selectEventsByMachine = (state, machineId, limit = 20) =>
    pipe(
        state.events,
        filter(e => e.machineId === machineId),
        take(limit)
    );

/**
 * Selects downtime entries for a specific machine.
 * @param {Object} state - Application state
 * @param {number} machineId - Machine ID
 * @returns {Array} Downtime entries for the machine
 * @pure
 */
const selectDowntimeByMachine = (state, machineId) =>
    state.downtimeEntries.filter(d => d.machineId === machineId);

/**
 * Selects checklist completion status.
 * @param {Object} state - Application state
 * @returns {Object} Completion stats per section
 * @pure
 */
const selectChecklistProgress = (state) => {
    const sections = Object.entries(state.checklist);
    return sections.reduce((acc, [section, items]) => {
        const total = items.length;
        const checked = items.filter(item => item.checked).length;
        const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
        return {
            ...acc,
            [section]: { checked, total, percentage }
        };
    }, {});
};

/**
 * Selects overall checklist completion percentage.
 * @param {Object} state - Application state
 * @returns {number} Overall percentage complete
 * @pure
 */
const selectOverallProgress = (state) => {
    const allItems = Object.values(state.checklist).flat();
    const total = allItems.length;
    const checked = allItems.filter(item => item.checked).length;
    return total > 0 ? Math.round((checked / total) * 100) : 0;
};
