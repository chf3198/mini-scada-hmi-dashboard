// Seed data for the demo
const machines = [
    { id: 1, name: 'Machine A', status: 'RUN', lastHeartbeat: Date.now(), healthScore: 95 },
    { id: 2, name: 'Machine B', status: 'IDLE', lastHeartbeat: Date.now(), healthScore: 88 },
    { id: 3, name: 'Machine C', status: 'DOWN', lastHeartbeat: Date.now() - 300000, healthScore: 70 },
];

let events = [
    { id: 1, machineId: 1, timestamp: Date.now() - 3600000, severity: 'INFO', message: 'Started production', acknowledged: false },
    { id: 2, machineId: 2, timestamp: Date.now() - 1800000, severity: 'WARN', message: 'Low throughput', acknowledged: false },
    { id: 3, machineId: 3, timestamp: Date.now() - 900000, severity: 'ALARM', message: 'Motor failure', acknowledged: false },
];

let downtimeEntries = [
    { id: 1, machineId: 3, start: Date.now() - 3600000, end: Date.now() - 1800000, reason: 'Maintenance', notes: 'Replaced belt' },
];

const runbooks = [
    { code: 'ALRM-001', title: 'Motor Failure Response', steps: ['1. Stop machine', '2. Check power', '3. Inspect motor', '4. Replace if needed'] },
    { code: 'WARN-002', title: 'Low Throughput Handling', steps: ['1. Check input feed', '2. Adjust settings', '3. Monitor for 10 min'] },
];

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

// Simulation state
let simulationRunning = false;
let simulationInterval;

// Metrics
let alarmsLast24h = 1;
let machinesDown = 1;
let downtimeMinutesToday = 60;