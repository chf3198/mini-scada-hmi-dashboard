// Utility functions

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString();
}

function formatAgo(timestamp) {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    return seconds + 's ago';
}

function getSeverityColor(severity) {
    switch (severity) {
        case 'INFO': return 'text-blue-600';
        case 'WARN': return 'text-yellow-600';
        case 'ALARM': return 'text-red-600';
        default: return 'text-gray-600';
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'RUN': return 'bg-green-500';
        case 'IDLE': return 'bg-yellow-500';
        case 'DOWN': return 'bg-red-500';
        default: return 'bg-gray-500';
    }
}

function calculateDowntimeToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return downtimeEntries.filter(d => d.end >= today.getTime()).reduce((sum, d) => sum + (d.end - d.start) / 60000, 0);
}

function updateMetrics() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    alarmsLast24h = events.filter(e => e.timestamp >= last24h && e.severity === 'ALARM').length;
    machinesDown = machines.filter(m => m.status === 'DOWN').length;
    downtimeMinutesToday = calculateDowntimeToday();
}

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
    if (events.length > 100) events.pop(); // Keep only last 100
    updateMetrics();
}

function acknowledgeAlarm(eventId) {
    const event = events.find(e => e.id === eventId);
    if (event) {
        event.acknowledged = true;
        generateEvent(event.machineId, 'INFO', `Alarm acknowledged: ${event.message}`);
    }
}

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

function startSimulation() {
    simulationRunning = true;
    lastSimulated = Date.now();
    if (!simBar) {
        simBar = new ProgressBar.Circle('#sim-progress', {
            strokeWidth: 6,
            color: '#3B82F6',
            trailColor: '#d1d5db',
            trailWidth: 2,
            duration: 3000,
            easing: 'easeInOut'
        });
    }
    document.getElementById('sim-progress').classList.remove('hidden');
    animateSimBar();
    simulationInterval = setInterval(() => {
        machines.forEach(machine => {
            machine.lastHeartbeat = Date.now();
            const rand = Math.random();
            if (rand < 0.1) { // 10% chance to change status
                const statuses = ['RUN', 'IDLE', 'DOWN'];
                const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
                if (newStatus !== machine.status) {
                    machine.status = newStatus;
                    if (newStatus === 'DOWN') {
                        generateEvent(machine.id, 'ALARM', `${machine.name} went down`);
                    } else if (newStatus === 'IDLE') {
                        generateEvent(machine.id, 'WARN', `${machine.name} idle`);
                    } else {
                        generateEvent(machine.id, 'INFO', `${machine.name} running`);
                    }
                }
            }
            // Simulate units/min
            machine.unitsPerMin = Math.floor(Math.random() * 50) + 10;
        });
        lastSimulated = Date.now();
        renderCurrentView();
    }, 2000 + Math.random() * 1000); // 2-3 seconds
    renderCurrentView();
}

function animateSimBar() {
    if (simulationRunning && simBar) {
        simBar.animate(1, { duration: 3000 }, () => {
            if (simulationRunning) {
                simBar.set(0);
                animateSimBar();
            }
        });
    }
}

function stopSimulation() {
    simulationRunning = false;
    clearInterval(simulationInterval);
    if (simBar) {
        simBar.set(0);
        document.getElementById('sim-progress').classList.add('hidden');
    }
    renderCurrentView();
}

function runRateTest(machineId) {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;
    const startTime = Date.now();
    let totalUnits = 0;
    const testInterval = setInterval(() => {
        totalUnits += machine.unitsPerMin;
    }, 1000);
    setTimeout(() => {
        clearInterval(testInterval);
        const duration = (Date.now() - startTime) / 60000; // minutes
        const rate = totalUnits / duration;
        const target = 30; // example target
        const pass = rate >= target;
        alert(`Rate test for ${machine.name}: ${rate.toFixed(2)} units/min. ${pass ? 'PASS' : 'FAIL'} (target: ${target})`);
    }, 60000);
}

function saveChecklistToLocalStorage() {
    localStorage.setItem('commissioningChecklist', JSON.stringify(commissioningChecklist));
}

function loadChecklistFromLocalStorage() {
    const saved = localStorage.getItem('commissioningChecklist');
    if (saved) {
        commissioningChecklist = JSON.parse(saved);
    }
}

function exportChecklist() {
    const dataStr = JSON.stringify(commissioningChecklist, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'commissioning-checklist.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Load checklist on start
loadChecklistFromLocalStorage();