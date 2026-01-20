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
    // Update UI to show simulation is running
    renderCurrentView();
    
    simulationInterval = setInterval(() => {
        // Update machine data in memory
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
        
        // Only update the ticker element, not the full view
        const ticker = document.getElementById('sim-ticker');
        if (ticker) {
            ticker.textContent = 'Last simulated: ' + formatAgo(lastSimulated);
        }
    }, 2500); // Fixed 2.5 second interval
}

function stopSimulation() {
    simulationRunning = false;
    clearInterval(simulationInterval);
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

// Validate imported checklist JSON structure
function validateChecklistJSON(data) {
    const errors = [];
    const requiredSections = ['Safety', 'IO', 'Network', 'Sensors', 'Throughput', 'Handoff'];
    
    // Check if data is an object
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        errors.push('Invalid format: expected an object with section keys');
        return { valid: false, errors };
    }
    
    // Check for required sections
    for (const section of requiredSections) {
        if (!(section in data)) {
            errors.push(`Missing required section: "${section}"`);
        }
    }
    
    // Validate each section
    for (const [section, items] of Object.entries(data)) {
        if (!Array.isArray(items)) {
            errors.push(`Section "${section}" must be an array`);
            continue;
        }
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (typeof item !== 'object' || item === null) {
                errors.push(`Section "${section}" item ${i + 1} must be an object`);
                continue;
            }
            if (typeof item.item !== 'string' || item.item.trim() === '') {
                errors.push(`Section "${section}" item ${i + 1} missing valid "item" property`);
            }
            if (typeof item.checked !== 'boolean') {
                errors.push(`Section "${section}" item ${i + 1} "checked" must be a boolean`);
            }
        }
    }
    
    return { valid: errors.length === 0, errors };
}

// Import checklist from JSON file
function importChecklist(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const statusDiv = document.getElementById('import-status');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            const validation = validateChecklistJSON(data);
            
            if (!validation.valid) {
                statusDiv.innerHTML = `
                    <div class="bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 p-4 rounded-lg">
                        <strong>⚠️ Import Failed - Invalid JSON structure:</strong>
                        <ul class="list-disc list-inside mt-2">
                            ${validation.errors.map(err => `<li>${err}</li>`).join('')}
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
            setTimeout(() => statusDiv.classList.add('hidden'), 3000);
            
        } catch (err) {
            statusDiv.innerHTML = `
                <div class="bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 p-4 rounded-lg">
                    <strong>⚠️ Import Failed:</strong> ${err.message}. Ensure the file is valid JSON.
                </div>
            `;
            statusDiv.classList.remove('hidden');
        }
        
        event.target.value = ''; // Reset file input
    };
    reader.readAsText(file);
}

// Reset checklist to unchecked state
function resetChecklist() {
    if (!confirm('Are you sure you want to reset ALL checklist items to unchecked?')) {
        return;
    }
    
    for (const section of Object.keys(commissioningChecklist)) {
        commissioningChecklist[section].forEach(item => {
            item.checked = false;
        });
    }
    saveChecklistToLocalStorage();
    renderCurrentView();
}

// Load checklist on start
loadChecklistFromLocalStorage();