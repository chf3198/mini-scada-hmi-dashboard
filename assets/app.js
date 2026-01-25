// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Curtis Franks <curtisfranks@gmail.com>

'use strict';

/**
 * @file Core application initialization and view rendering for the Mini SCADA HMI Dashboard.
 * @module app
 * @description Orchestrates views by delegating to templates.js for HTML generation.
 * @requires config/constants
 * @requires data
 * @requires utils
 * @requires templates
 * @requires router
 * @requires handlers
 * @requires charts
 * @author Curtis Franks <curtisfranks@gmail.com>
 * @copyright 2026 Curtis Franks
 * @license MIT
 * @see {@link https://github.com/chf3198/mini-scada-hmi-dashboard}
 */

// ============================================================================
// CORE RENDERING
// ============================================================================

/**
 * Updates the sticky action toolbar based on current view.
 * @param {string} view - The current view constant
 * @sideeffect Updates DOM, initializes tooltips on toolbar buttons
 */
function updateActionToolbar(view) {
    const toolbar = document.getElementById('action-toolbar');
    if (!toolbar) {
        console.error('Action toolbar element not found');
        return;
    }
    
    // Pass simulation state for Overview toolbar
    const state = view === VIEWS.OVERVIEW 
        ? { simulationRunning, lastSimulated } 
        : {};
    
    toolbar.innerHTML = templateActionToolbar(view, state);
    
    // Re-initialize tooltips for toolbar buttons
    if (typeof tippy !== 'undefined') {
        tippy('#action-toolbar [data-tippy-content]', { 
            theme: 'light-border', 
            placement: 'bottom', 
            delay: [200, 0] 
        });
    }
}

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
    
    const view = getCurrentView();
    
    // Update sticky action toolbar first
    updateActionToolbar(view);
    
    switch (view) {
        case VIEWS.OVERVIEW:
            content.innerHTML = renderOverview();
            setTimeout(renderCharts, TIME.CHART_RENDER_DELAY_MS);
            break;
        case VIEWS.MACHINE:
            content.innerHTML = renderMachineDetail(getMachineIdFromHash(window.location.hash));
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
// VIEW RENDERERS
// ============================================================================

/**
 * Renders the overview dashboard with machine cards, metrics, and charts.
 * @returns {string} HTML string for the overview view
 */
function renderOverview() {
    updateMetrics();
    
    const machineCards = machines.map(templateMachineCard).join('');
    const metricsHtml = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            ${templateMetricCard('Alarms last 24h', alarmsLast24h, 'text-red-600', 'Critical alarms requiring operator attention')}
            ${templateMetricCard('Machines down', machinesDown, 'text-red-600', 'Count of machines currently in DOWN state')}
            ${templateMetricCard('Downtime minutes today', Math.floor(downtimeMinutesToday), 'text-yellow-600', 'Total downtime accumulated today')}
        </div>
    `;

    return `
        <h2 class="text-2xl font-bold mb-4" data-tippy-content="SCADA HMI Overview Dashboard">Overview Dashboard</h2>
        ${metricsHtml}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">${machineCards}</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow" data-tippy-content="Downtime by equipment">
                <h3>Downtime by Machine</h3>
                <canvas id="downtimeChart"></canvas>
            </div>
            <div class="bg-white dark:bg-gray-800 p-4 rounded shadow" data-tippy-content="Event distribution by severity">
                <h3>Events by Severity</h3>
                <canvas id="eventsChart"></canvas>
            </div>
        </div>
    `;
}

/**
 * Renders detailed view for a specific machine.
 * @param {string} machineId - The machine ID from the route
 * @returns {string} HTML string for the machine detail view
 */
function renderMachineDetail(machineId) {
    const parsedId = parseInt(machineId);
    const machine = machines.find(m => m.id === parsedId);
    if (!machine) return '<p>Machine not found</p>';

    const machineEvents = events.filter(e => e.machineId === parsedId).slice(0, 20);
    const machineDowntime = downtimeEntries.filter(d => d.machineId === parsedId);

    return `
        <h2 class="text-2xl font-bold mb-4">${machine.name} Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            ${templateMachineHealthCard(machine)}
            ${templateDowntimeForm(machine.id)}
        </div>
        ${templateEventLog(machineEvents)}
        ${templateDowntimeTable(machineDowntime)}
    `;
}

/**
 * Renders the runbooks page.
 * @returns {string} HTML string for the runbooks view
 */
function renderRunbooks() {
    return `
        <h2 class="text-2xl font-bold mb-4">Runbooks</h2>
        <input type="text" id="runbook-search" placeholder="Search by code (e.g., ALRM-001)" 
               class="block w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg mb-4" 
               oninput="filterRunbooks()">
        <div id="runbook-list">${runbooks.map(templateRunbookCard).join('')}</div>
    `;
}

/**
 * Renders the commissioning checklist.
 * @returns {string} HTML string for the commissioning view
 */
function renderCommissioning() {
    let totalItems = 0, checkedItems = 0;
    Object.values(commissioningChecklist).forEach(items => {
        totalItems += items.length;
        checkedItems += items.filter(i => i.checked).length;
    });
    
    const sections = Object.keys(commissioningChecklist)
        .map(s => templateCommissioningSection(s, commissioningChecklist[s]))
        .join('');

    return `
        <h2 class="text-2xl font-bold mb-4">Commissioning Checklist</h2>
        ${templateProgressCard(checkedItems, totalItems)}
        ${sections}
        <input type="file" id="import-file" accept=".json" onchange="importChecklist(event)" class="hidden">
        <div id="import-status" class="mt-4 hidden"></div>
    `;
}

/**
 * Renders the help page.
 * @returns {string} HTML string for the help view
 */
function renderHelp() {
    return templateHelpPage();
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initial render on page load
renderCurrentView();
