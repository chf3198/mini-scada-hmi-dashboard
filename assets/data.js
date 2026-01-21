// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Curtis Franks <curtisfranks@gmail.com>

'use strict';

/**
 * @file Seed data and application state for the Mini SCADA HMI Dashboard.
 * @module data
 * @description Contains machine definitions, events, downtime entries, runbooks, and checklists.
 * @requires config/constants
 * @author Curtis Franks <curtisfranks@gmail.com>
 * @copyright 2026 Curtis Franks
 * @license MIT
 * @see {@link https://github.com/chf3198/mini-scada-hmi-dashboard}
 */

// ============================================================================
// MACHINE DATA
// ============================================================================

/**
 * Array of machine objects representing monitored equipment
 * @type {Array<{id: number, name: string, status: string, lastHeartbeat: number, healthScore: number, unitsPerMin?: number}>}
 */
const machines = [
    { id: 1, name: 'Machine A', status: MACHINE_STATUS.RUNNING, lastHeartbeat: Date.now(), healthScore: 95 },
    { id: 2, name: 'Machine B', status: MACHINE_STATUS.IDLE, lastHeartbeat: Date.now(), healthScore: 88 },
    { id: 3, name: 'Machine C', status: MACHINE_STATUS.DOWN, lastHeartbeat: Date.now() - 300000, healthScore: 70 },
];

// ============================================================================
// EVENT DATA
// ============================================================================

/**
 * Array of event/alarm objects from machine operations
 * @type {Array<{id: number, machineId: number, timestamp: number, severity: string, message: string, acknowledged: boolean}>}
 */
let events = [
    { id: 1, machineId: 1, timestamp: Date.now() - TIME.MS_PER_HOUR, severity: SEVERITY.INFO, message: 'Started production', acknowledged: false },
    { id: 2, machineId: 2, timestamp: Date.now() - (TIME.MS_PER_HOUR / 2), severity: SEVERITY.WARNING, message: 'Low throughput', acknowledged: false },
    { id: 3, machineId: 3, timestamp: Date.now() - (TIME.MS_PER_HOUR / 4), severity: SEVERITY.ALARM, message: 'Motor failure', acknowledged: false },
];

// ============================================================================
// DOWNTIME DATA
// ============================================================================

/**
 * Array of downtime entry objects for tracking machine unavailability
 * @type {Array<{id: number, machineId: number, start: number, end: number, reason: string, notes: string}>}
 */
let downtimeEntries = [
    { id: 1, machineId: 3, start: Date.now() - TIME.MS_PER_HOUR, end: Date.now() - (TIME.MS_PER_HOUR / 2), reason: 'Maintenance', notes: 'Replaced belt' },
];

// ============================================================================
// RUNBOOKS
// ============================================================================

/**
 * Array of runbook objects containing standard operating procedures
 * @type {Array<{code: string, title: string, steps: string[]}>}
 */
const runbooks = [
    { code: 'ALRM-001', title: 'Motor Failure Response', steps: ['Stop machine immediately', 'Check power supply', 'Inspect motor for damage', 'Replace motor if needed'] },
    { code: 'WARN-002', title: 'Low Throughput Handling', steps: ['Check input feed rate', 'Adjust machine settings', 'Monitor output for 10 minutes'] },
];

// ============================================================================
// COMMISSIONING CHECKLIST
// ============================================================================

/**
 * Commissioning checklist organized by section
 * @type {Object<string, Array<{item: string, checked: boolean}>>}
 */
let commissioningChecklist = {
    Safety: [
        { item: 'Emergency stops tested', checked: false },
        { item: 'Guards in place', checked: true },
    ],
    IO: [
        { item: 'Inputs calibrated', checked: false },
        { item: 'Outputs verified', checked: true },
    ],
    Network: [
        { item: 'IP configured', checked: true },
        { item: 'Connectivity tested', checked: false },
    ],
    Sensors: [
        { item: 'Sensors zeroed', checked: false },
        { item: 'Accuracy checked', checked: true },
    ],
    Throughput: [
        { item: 'Baseline test run', checked: false },
        { item: 'Target met', checked: true },
    ],
    Handoff: [
        { item: 'Documentation provided', checked: false },
        { item: 'Training completed', checked: true },
    ],
};

// ============================================================================
// APPLICATION STATE
// ============================================================================

/** @type {boolean} Whether simulation is currently running */
let simulationRunning = false;

/** @type {number|null} Interval ID for the simulation timer */
let simulationInterval = null;

/** @type {number} Count of alarms in the last 24 hours */
let alarmsLast24h = 1;

/** @type {number} Count of machines currently in DOWN status */
let machinesDown = 1;

/** @type {number} Total downtime minutes accumulated today */
let downtimeMinutesToday = 60;

/** @type {number|null} Timestamp of last simulation tick */
let lastSimulated = null;