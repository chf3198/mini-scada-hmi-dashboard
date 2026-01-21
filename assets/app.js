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
 * Uses template functions from templates.js for component rendering.
 * @returns {string} HTML string for the overview view
 */
function renderOverview() {
    updateMetrics();
    
    const machineCards = machines.map(templateMachineCard).join('');
    const metricsHtml = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            ${templateMetricCard('Alarms last 24h', alarmsLast24h, 'text-red-600', 'Critical alarms requiring operator attention - high priority events that may indicate equipment failure or safety issues')}
            ${templateMetricCard('Machines down', machinesDown, 'text-red-600', 'Count of machines currently in DOWN state - indicates production capacity loss')}
            ${templateMetricCard('Downtime minutes today', Math.floor(downtimeMinutesToday), 'text-yellow-600', 'Total unplanned and planned downtime accumulated today - key metric for OEE calculations')}
        </div>
    `;

    return `
        <h2 class="text-2xl font-bold mb-4" data-tippy-content="SCADA HMI Overview: Supervisory Control and Data Acquisition Human-Machine Interface for monitoring plant operations">Overview Dashboard</h2>
        ${metricsHtml}
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
        ${templateSimulationControls(simulationRunning, lastSimulated)}
    `;
}

// ============================================================================
// MACHINE DETAIL VIEW
// ============================================================================

/**
 * Renders detailed view for a specific machine with events and downtime.
 * Uses template functions from templates.js for component rendering.
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
    
    const machineDowntime = downtimeEntries
        .filter(downtimeEntry => downtimeEntry.machineId === parsedMachineId);

    return `
        <h2 class="text-2xl font-bold mb-4" data-tippy-content="Detailed view of individual equipment asset - drill-down from overview for diagnostics and maintenance">${machine.name} Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            ${templateMachineHealthCard(machine)}
            ${templateDowntimeForm(machine.id)}
        </div>
        ${templateEventLog(machineEvents)}
        ${templateDowntimeTable(machineDowntime)}
    `;
}

// ============================================================================
// RUNBOOKS VIEW
// ============================================================================

/**
 * Renders the runbooks page with searchable procedure list.
 * Uses template functions from templates.js for runbook cards.
 * @returns {string} HTML string for the runbooks view
 */
function renderRunbooks() {
    const runbookList = runbooks.map(templateRunbookCard).join('');

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
 * Uses template functions from templates.js for sections.
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
    
    const sections = Object.keys(commissioningChecklist)
        .map(section => templateCommissioningSection(section, commissioningChecklist[section]))
        .join('');

    return `
        <h2 class="text-2xl font-bold mb-4" data-tippy-content="Factory Acceptance Test (FAT) and Site Acceptance Test (SAT) checklist - systematic validation before production handoff">Commissioning Checklist</h2>
        
        ${templateProgressCard(checkedItems, totalItems)}
        
        ${sections}
        
        ${templateCommissioningActions()}
        
        <div id="import-status" class="mt-4 hidden"></div>
    `;
}

// ============================================================================
// HELP VIEW
// ============================================================================

/**
 * Renders the user manual / help page.
 * Delegates to templateHelpPage() from templates.js.
 * @returns {string} HTML string for the help view
 */
function renderHelp() {
    return templateHelpPage();
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
 * Uses templateRunbookCard from templates.js.
 * @sideeffect Re-renders the runbook list in the DOM
 */
function filterRunbooks() {
    const searchQuery = document.getElementById('runbook-search').value.toLowerCase();
    const listContainer = document.getElementById('runbook-list');
    
    const filteredRunbooks = runbooks.filter(runbook => 
        runbook.code.toLowerCase().includes(searchQuery) || 
        runbook.title.toLowerCase().includes(searchQuery)
    );
    
    listContainer.innerHTML = filteredRunbooks.map(templateRunbookCard).join('');
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