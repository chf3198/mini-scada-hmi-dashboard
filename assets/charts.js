// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Curtis Franks <curtisfranks@gmail.com>

'use strict';

/**
 * @file Chart.js rendering logic for the Mini SCADA HMI Dashboard.
 * @module charts
 * @description Handles creation and destruction of overview dashboard charts.
 * @requires config/constants
 * @requires data
 * @author Curtis Franks <curtisfranks@gmail.com>
 * @copyright 2026 Curtis Franks
 * @license MIT
 * @see {@link https://github.com/chf3198/mini-scada-hmi-dashboard}
 */

// ============================================================================
// CHART STATE
// ============================================================================

/** @type {Chart|null} Chart.js instance for downtime chart */
let downtimeChartInstance = null;

/** @type {Chart|null} Chart.js instance for events chart */
let eventsChartInstance = null;

/**
 * Gets chart colors based on current dark mode state.
 * @returns {{gridColor: string, textColor: string, isDark: boolean}} Color configuration
 */
function getChartColors() {
    const isDark = document.documentElement.classList.contains('dark');
    return {
        isDark,
        gridColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        textColor: isDark ? '#e5e7eb' : '#374151'
    };
}

// ============================================================================
// CHART RENDERING
// ============================================================================

/**
 * Renders Chart.js charts for downtime and event severity.
 * Destroys existing chart instances before creating new ones.
 * Includes error handling for missing elements or Chart.js failures.
 * @sideeffect Creates/replaces chart instances on canvas elements
 */
function renderCharts() {
    try {
        // Destroy existing charts to prevent memory leaks and duplicates
        destroyCharts();
        
        // Use requestAnimationFrame for smoother rendering
        requestAnimationFrame(() => {
            renderDowntimeChart();
            renderEventsChart();
        });
    } catch (error) {
        console.error('Error rendering charts:', error);
    }
}

/**
 * Renders the downtime by machine bar chart.
 * Includes error handling and accessibility labels.
 * @sideeffect Creates downtimeChartInstance on canvas element
 */
function renderDowntimeChart() {
    try {
        const downtimeCanvas = document.getElementById('downtimeChart');
        if (!downtimeCanvas) return;
        
        const downtimeContext = downtimeCanvas.getContext('2d');
        if (!downtimeContext) {
            console.error('Could not get 2D context for downtime chart');
            return;
        }
        
        const downtimeByMachine = machines.map(machine => {
            const machineDowntime = downtimeEntries
                .filter(entry => entry.machineId === machine.id)
                .reduce((totalMinutes, entry) => 
                    totalMinutes + (entry.end - entry.start) / TIME.MS_PER_MINUTE, 0
                );
            return machineDowntime;
        });
        
        // Get colors based on dark mode
        const colors = getChartColors();
        
        downtimeChartInstance = new Chart(downtimeContext, {
            type: 'bar',
            data: {
                labels: machines.map(machine => machine.name),
                datasets: [{
                    label: 'Downtime (min)',
                    data: downtimeByMachine,
                    backgroundColor: 'rgba(255, 99, 132, 0.4)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: false,
                        text: 'Machine Downtime in Minutes'
                    },
                    legend: {
                        labels: {
                            color: colors.textColor
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Minutes',
                            color: colors.textColor
                        },
                        ticks: {
                            color: colors.textColor
                        },
                        grid: {
                            color: colors.gridColor
                        }
                    },
                    x: {
                        ticks: {
                            color: colors.textColor
                        },
                        grid: {
                            color: colors.gridColor
                        }
                    }
                }
            }
        });
        
        // Set accessible label for canvas
        downtimeCanvas.setAttribute('aria-label', 'Bar chart showing downtime in minutes for each machine');
        downtimeCanvas.setAttribute('role', 'img');
        
    } catch (error) {
        console.error('Error rendering downtime chart:', error);
    }
}

/**
 * Renders the events by severity pie chart.
 * Includes error handling and accessibility labels.
 * @sideeffect Creates eventsChartInstance on canvas element
 */
function renderEventsChart() {
    try {
        const eventsCanvas = document.getElementById('eventsChart');
        if (!eventsCanvas) return;
        
        const eventsContext = eventsCanvas.getContext('2d');
        if (!eventsContext) {
            console.error('Could not get 2D context for events chart');
            return;
        }
        
        const severityCounts = { 
            [SEVERITY.INFO]: 0, 
            [SEVERITY.WARNING]: 0, 
            [SEVERITY.ALARM]: 0 
        };
        events.forEach(eventEntry => severityCounts[eventEntry.severity]++);
        
        // Get colors based on dark mode
        const colors = getChartColors();
        
        eventsChartInstance = new Chart(eventsContext, {
            type: 'pie',
            data: {
                labels: Object.keys(severityCounts),
                datasets: [{
                    data: Object.values(severityCounts),
                    backgroundColor: ['#3B82F6', '#F59E0B', '#EF4444']
                }]
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: colors.textColor
                        }
                    }
                }
            }
        });
        
        // Set accessible label for canvas
        eventsCanvas.setAttribute('aria-label', 'Pie chart showing event distribution by severity level');
        eventsCanvas.setAttribute('role', 'img');
        
    } catch (error) {
        console.error('Error rendering events chart:', error);
    }
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
