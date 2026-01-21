'use strict';

/**
 * @module charts
 * @description Chart.js rendering logic for the Mini SCADA HMI Dashboard.
 * Handles creation and destruction of overview dashboard charts.
 * @requires config/constants
 * @requires data
 * @author Mini SCADA HMI Team
 * @license MIT
 */

// ============================================================================
// CHART STATE
// ============================================================================

/** @type {Chart|null} Chart.js instance for downtime chart */
let downtimeChartInstance = null;

/** @type {Chart|null} Chart.js instance for events chart */
let eventsChartInstance = null;

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

    renderDowntimeChart();
    renderEventsChart();
}

/**
 * Renders the downtime by machine bar chart.
 * @sideeffect Creates downtimeChartInstance on canvas element
 */
function renderDowntimeChart() {
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
}

/**
 * Renders the events by severity pie chart.
 * @sideeffect Creates eventsChartInstance on canvas element
 */
function renderEventsChart() {
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

/**
 * Destroys all chart instances to free memory.
 * @sideeffect Sets chart instances to null
 */
function destroyCharts() {
    if (downtimeChartInstance) {
        downtimeChartInstance.destroy();
        downtimeChartInstance = null;
    }
    if (eventsChartInstance) {
        eventsChartInstance.destroy();
        eventsChartInstance = null;
    }
}
