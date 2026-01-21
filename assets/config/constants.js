// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Curtis Franks <curtisfranks@gmail.com>

'use strict';

/**
 * @file Central configuration constants for the Mini SCADA HMI Dashboard.
 * @module config/constants
 * @description All magic numbers and configuration values are defined here for maintainability.
 * @author Curtis Franks <curtisfranks@gmail.com>
 * @copyright 2026 Curtis Franks
 * @license MIT
 * @see {@link https://github.com/chf3198/mini-scada-hmi-dashboard}
 */

/**
 * Simulation configuration
 * @constant {Object}
 */
const SIMULATION = Object.freeze({
    /** Interval between simulation ticks in milliseconds */
    INTERVAL_MS: 2500,
    /** Probability (0-1) of machine status changing per tick */
    STATUS_CHANGE_PROBABILITY: 0.1,
    /** Maximum number of events to retain in memory */
    MAX_EVENTS: 100,
    /** Minimum units per minute for random generation */
    MIN_UNITS_PER_MIN: 10,
    /** Maximum units per minute for random generation */
    MAX_UNITS_PER_MIN: 60
});

/**
 * Rate test configuration
 * @constant {Object}
 */
const RATE_TEST = Object.freeze({
    /** Duration of rate test in milliseconds */
    DURATION_MS: 60000,
    /** Sample interval for rate test in milliseconds */
    SAMPLE_INTERVAL_MS: 1000,
    /** Target units per minute for pass/fail determination */
    TARGET_UNITS_PER_MIN: 30
});

/**
 * Time constants
 * @constant {Object}
 */
const TIME = Object.freeze({
    /** Milliseconds in one minute */
    MS_PER_MINUTE: 60000,
    /** Milliseconds in one hour */
    MS_PER_HOUR: 3600000,
    /** Milliseconds in 24 hours */
    MS_PER_DAY: 86400000,
    /** Delay before rendering charts (allows DOM to settle) */
    CHART_RENDER_DELAY_MS: 50,
    /** Duration to show success messages */
    SUCCESS_MESSAGE_DURATION_MS: 3000
});

/**
 * Machine status values
 * @constant {Object}
 */
const MACHINE_STATUS = Object.freeze({
    RUNNING: 'RUN',
    IDLE: 'IDLE',
    DOWN: 'DOWN'
});

/**
 * Event severity levels
 * @constant {Object}
 */
const SEVERITY = Object.freeze({
    INFO: 'INFO',
    WARNING: 'WARN',
    ALARM: 'ALARM'
});

/**
 * CSS color classes for machine status
 * @constant {Object}
 */
const STATUS_COLORS = Object.freeze({
    [MACHINE_STATUS.RUNNING]: 'bg-green-500',
    [MACHINE_STATUS.IDLE]: 'bg-yellow-500',
    [MACHINE_STATUS.DOWN]: 'bg-red-500',
    DEFAULT: 'bg-gray-500'
});

/**
 * CSS color classes for event severity
 * @constant {Object}
 */
const SEVERITY_COLORS = Object.freeze({
    [SEVERITY.INFO]: 'text-blue-600',
    [SEVERITY.WARNING]: 'text-yellow-600',
    [SEVERITY.ALARM]: 'text-red-600',
    DEFAULT: 'text-gray-600'
});

/**
 * View/route identifiers
 * @constant {Object}
 */
const VIEWS = Object.freeze({
    OVERVIEW: 'overview',
    MACHINE: 'machine',
    RUNBOOKS: 'runbooks',
    COMMISSIONING: 'commissioning',
    HELP: 'help'
});

/**
 * LocalStorage keys
 * @constant {Object}
 */
const STORAGE_KEYS = Object.freeze({
    CHECKLIST: 'commissioningChecklist'
});

/**
 * Required commissioning checklist sections
 * @constant {string[]}
 */
const REQUIRED_CHECKLIST_SECTIONS = Object.freeze([
    'Safety',
    'IO',
    'Network',
    'Sensors',
    'Throughput',
    'Handoff'
]);

/**
 * Section icons for commissioning checklist
 * @constant {Object}
 */
const SECTION_ICONS = Object.freeze({
    Safety: '🛡️',
    IO: '🔌',
    Network: '🌐',
    Sensors: '📡',
    Throughput: '📊',
    Handoff: '🤝',
    DEFAULT: '📋'
});

/**
 * Section tooltips for commissioning checklist
 * @constant {Object}
 */
const SECTION_TOOLTIPS = Object.freeze({
    Safety: 'Verify all safety systems including E-stops, guards, and interlocks are functioning properly',
    IO: 'Validate all input/output signals between PLC and field devices are correctly wired and configured',
    Network: 'Confirm network connectivity between all system components including PLCs, HMIs, and SCADA servers',
    Sensors: 'Calibrate and verify accuracy of all sensors including temperature, pressure, and position',
    Throughput: 'Validate production rate meets design specifications under normal operating conditions',
    Handoff: 'Complete all documentation and training before transferring system to operations team'
});
