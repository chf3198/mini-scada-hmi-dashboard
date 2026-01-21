// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Curtis Franks <curtisfranks@gmail.com>

'use strict';

/**
 * @file Self-tests for Mini SCADA HMI Dashboard.
 * @module tests
 * @description Unit tests for core application functionality. Run with ?test=1 URL parameter.
 * @author Curtis Franks <curtisfranks@gmail.com>
 * @copyright 2026 Curtis Franks
 * @license MIT
 * @see {@link https://github.com/chf3198/mini-scada-hmi-dashboard}
 */

// ============================================================================
// TEST RUNNER
// ============================================================================

if (window.location.search.includes('test=1')) {
    console.log('🧪 Running self-tests...');
    let passCount = 0;
    let failCount = 0;

    /**
     * Custom assertion with pass/fail counting.
     * @param {boolean} condition - The condition to test
     * @param {string} testName - Description of the test
     */
    function assert(condition, testName) {
        if (condition) {
            passCount++;
            console.log(`✅ PASS: ${testName}`);
        } else {
            failCount++;
            console.error(`❌ FAIL: ${testName}`);
        }
    }

    // ========================================================================
    // Constants Tests
    // ========================================================================
    console.log('\n📦 Testing Constants...');
    
    assert(typeof SIMULATION === 'object', 'SIMULATION constant exists');
    assert(SIMULATION.INTERVAL_MS > 0, 'SIMULATION.INTERVAL_MS is positive');
    assert(typeof SEVERITY === 'object', 'SEVERITY constant exists');
    assert(SEVERITY.INFO === 'INFO', 'SEVERITY.INFO equals "INFO"');
    assert(SEVERITY.WARNING === 'WARN', 'SEVERITY.WARNING equals "WARN"');
    assert(SEVERITY.ALARM === 'ALARM', 'SEVERITY.ALARM equals "ALARM"');
    assert(typeof MACHINE_STATUS === 'object', 'MACHINE_STATUS constant exists');
    assert(typeof VIEWS === 'object', 'VIEWS constant exists');
    assert(typeof REQUIRED_CHECKLIST_SECTIONS === 'object', 'REQUIRED_CHECKLIST_SECTIONS exists');

    // ========================================================================
    // Event Generation Tests
    // ========================================================================
    console.log('\n📡 Testing Event Generation...');
    
    const initialEventCount = events.length;
    generateEvent(1, SEVERITY.INFO, 'Test event');
    assert(events.length === initialEventCount + 1, 'Event generation adds to events array');
    assert(events[0].message === 'Test event', 'Event message is correctly stored');
    assert(events[0].severity === SEVERITY.INFO, 'Event severity is correctly stored');

    // ========================================================================
    // Downtime Calculation Tests
    // ========================================================================
    console.log('\n⏱️ Testing Downtime Calculation...');
    
    const initialDowntime = downtimeMinutesToday;
    addDowntimeEntry(1, 'Test', 'Notes', Date.now() - TIME.MS_PER_MINUTE, Date.now());
    updateMetrics();
    assert(downtimeMinutesToday > initialDowntime, 'Downtime calculation updates metrics');

    // ========================================================================
    // Checklist Persistence Tests
    // ========================================================================
    console.log('\n💾 Testing Checklist Persistence...');
    
    const originalChecked = commissioningChecklist.Safety[0].checked;
    commissioningChecklist.Safety[0].checked = !originalChecked;
    saveChecklistToLocalStorage();
    loadChecklistFromLocalStorage();
    assert(commissioningChecklist.Safety[0].checked === !originalChecked, 'Checklist persistence round-trips correctly');

    // ========================================================================
    // Simulation Tests
    // ========================================================================
    console.log('\n🎮 Testing Simulation Functions...');
    
    assert(typeof startSimulation === 'function', 'startSimulation function exists');
    assert(typeof stopSimulation === 'function', 'stopSimulation function exists');

    // ========================================================================
    // View Rendering Tests
    // ========================================================================
    console.log('\n🖼️ Testing View Rendering...');
    
    assert(typeof renderHelp === 'function', 'renderHelp function exists');
    const helpContent = renderHelp();
    assert(helpContent.includes('User Manual'), 'renderHelp includes User Manual title');
    assert(helpContent.includes('SCADA'), 'renderHelp explains SCADA terminology');

    // ========================================================================
    // Template Function Tests
    // ========================================================================
    console.log('\n🧩 Testing Template Functions...');
    
    // Test templateMachineCard
    assert(typeof templateMachineCard === 'function', 'templateMachineCard function exists');
    const testMachine = { id: 1, name: 'Test Machine', status: 'RUN', healthScore: 95, lastHeartbeat: Date.now() };
    const machineCardHtml = templateMachineCard(testMachine);
    assert(machineCardHtml.includes('Test Machine'), 'templateMachineCard includes machine name');
    assert(machineCardHtml.includes('RUN'), 'templateMachineCard includes status');
    
    // Test templateEventRow
    assert(typeof templateEventRow === 'function', 'templateEventRow function exists');
    const testEvent = { id: 1, timestamp: Date.now(), severity: 'INFO', message: 'Test', acknowledged: false };
    const eventRowHtml = templateEventRow(testEvent);
    assert(eventRowHtml.includes('<tr'), 'templateEventRow returns table row');
    
    // Test templateRunbookCard
    assert(typeof templateRunbookCard === 'function', 'templateRunbookCard function exists');
    const testRunbook = { code: 'TEST-001', title: 'Test Runbook', steps: ['Step 1', 'Step 2'] };
    const runbookCardHtml = templateRunbookCard(testRunbook);
    assert(runbookCardHtml.includes('TEST-001'), 'templateRunbookCard includes runbook code');
    assert(runbookCardHtml.includes('Step 1'), 'templateRunbookCard includes steps');
    
    // Test templateMetricCard
    assert(typeof templateMetricCard === 'function', 'templateMetricCard function exists');
    const metricHtml = templateMetricCard('Test Metric', 42, 'text-blue-600', 'Test tooltip');
    assert(metricHtml.includes('Test Metric'), 'templateMetricCard includes title');
    assert(metricHtml.includes('42'), 'templateMetricCard includes value');
    
    // Test templateHelpPage
    assert(typeof templateHelpPage === 'function', 'templateHelpPage function exists');
    const helpPageHtml = templateHelpPage();
    assert(helpPageHtml.includes('Pro Tips'), 'templateHelpPage includes Pro Tips section');
    assert(helpPageHtml.includes('Glossary'), 'templateHelpPage includes Glossary section');

    // ========================================================================
    // Validation Tests
    // ========================================================================
    console.log('\n✅ Testing Validation Functions...');
    
    assert(typeof validateChecklistJSON === 'function', 'validateChecklistJSON function exists');
    
    // Test valid structure
    const validData = {
        Safety: [{ item: 'Test', checked: true }],
        IO: [{ item: 'Test', checked: false }],
        Network: [{ item: 'Test', checked: true }],
        Sensors: [{ item: 'Test', checked: false }],
        Throughput: [{ item: 'Test', checked: true }],
        Handoff: [{ item: 'Test', checked: false }]
    };
    const validResult = validateChecklistJSON(validData);
    assert(validResult.valid === true, 'Valid checklist passes validation');
    
    // Test invalid: not an object
    const invalidNotObject = validateChecklistJSON('string');
    assert(invalidNotObject.valid === false, 'String input fails validation');
    
    // Test invalid: missing section
    const invalidMissing = validateChecklistJSON({ Safety: [] });
    assert(invalidMissing.valid === false, 'Missing sections fail validation');
    
    // Test invalid: wrong item structure
    const invalidItem = validateChecklistJSON({
        Safety: [{ item: 'Test', checked: 'yes' }], // checked should be boolean
        IO: [], Network: [], Sensors: [], Throughput: [], Handoff: []
    });
    assert(invalidItem.valid === false, 'Invalid item structure fails validation');

    // ========================================================================
    // Security & Sanitization Tests (Phase 4)
    // ========================================================================
    console.log('\n🔒 Testing Security Functions...');
    
    // Test escapeHtml
    assert(typeof escapeHtml === 'function', 'escapeHtml function exists');
    const xssAttempt = '<script>alert("XSS")</script>';
    const escapedXss = escapeHtml(xssAttempt);
    assert(!escapedXss.includes('<script>'), 'escapeHtml neutralizes script tags');
    assert(escapedXss.includes('&lt;'), 'escapeHtml converts < to entity');
    assert(escapedXss.includes('&gt;'), 'escapeHtml converts > to entity');
    
    // Test sanitizeInput
    assert(typeof sanitizeInput === 'function', 'sanitizeInput function exists');
    const htmlInput = '<b>Bold</b> text';
    const sanitized = sanitizeInput(htmlInput);
    assert(!sanitized.includes('<'), 'sanitizeInput removes HTML tags');
    assert(sanitized.includes('Bold'), 'sanitizeInput preserves text content');
    
    // Test validateMachineId
    assert(typeof validateMachineId === 'function', 'validateMachineId function exists');
    assert(validateMachineId(1) === 1, 'validateMachineId accepts valid number');
    assert(validateMachineId('2') === 2, 'validateMachineId parses valid string');
    assert(validateMachineId('abc') === null, 'validateMachineId rejects non-numeric');
    assert(validateMachineId(-5) === null, 'validateMachineId rejects negative');
    assert(validateMachineId(5000) === null, 'validateMachineId rejects out of range');
    
    // Test safeJsonParse
    assert(typeof safeJsonParse === 'function', 'safeJsonParse function exists');
    const validJson = '{"key": "value"}';
    const parsedValid = safeJsonParse(validJson);
    assert(parsedValid !== null && parsedValid.key === 'value', 'safeJsonParse parses valid JSON');
    const invalidJson = '{not valid json}';
    const parsedInvalid = safeJsonParse(invalidJson, {});
    assert(typeof parsedInvalid === 'object', 'safeJsonParse returns default on invalid JSON');

    // ========================================================================
    // Accessibility Tests (Phase 4)
    // ========================================================================
    console.log('\n♿ Testing Accessibility...');
    
    // Test ARIA landmarks
    const mainContent = document.getElementById('main-content');
    assert(mainContent !== null, 'Main content landmark exists');
    assert(mainContent && mainContent.getAttribute('role') === 'main', 'Main content has role="main"');
    
    const nav = document.querySelector('nav');
    assert(nav !== null, 'Navigation element exists');
    assert(nav && nav.getAttribute('role') === 'navigation', 'Navigation has role="navigation"');
    
    // Test screen reader announcer
    const announcer = document.getElementById('sr-announcer');
    assert(announcer !== null, 'Screen reader announcer exists');
    assert(announcer && announcer.getAttribute('aria-live') === 'polite', 'Announcer has aria-live');
    
    // Test skip link
    const skipLink = document.querySelector('a[href="#main-content"]');
    assert(skipLink !== null, 'Skip to content link exists');

    // ========================================================================
    // Dark Mode E2E Tests
    // ========================================================================
    console.log('\n🌙 Testing Dark Mode Toggle...');
    
    // Test dark mode toggle button exists
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    assert(darkModeToggle !== null, 'Dark mode toggle button exists');
    
    // Test Tailwind dark mode configuration
    assert(typeof tailwind !== 'undefined', 'Tailwind config object exists');
    assert(tailwind.config && tailwind.config.darkMode === 'class', 'Tailwind darkMode is set to "class"');
    
    // Test dark mode toggle functionality
    const htmlElement = document.documentElement;
    const initialDarkState = htmlElement.classList.contains('dark');
    
    // Simulate click
    darkModeToggle.click();
    const afterFirstClick = htmlElement.classList.contains('dark');
    assert(afterFirstClick !== initialDarkState, 'Dark mode class toggles on click');
    
    // Click again to restore
    darkModeToggle.click();
    const afterSecondClick = htmlElement.classList.contains('dark');
    assert(afterSecondClick === initialDarkState, 'Dark mode class toggles back on second click');
    
    // Test that body has dark mode classes defined
    const bodyClasses = document.body.className;
    assert(bodyClasses.includes('dark:bg-gray-900'), 'Body has dark mode background class');
    assert(bodyClasses.includes('dark:text-gray-100'), 'Body has dark mode text class');

    // ========================================================================
    // Test Summary
    // ========================================================================
    console.log('\n' + '='.repeat(50));
    console.log(`🧪 TEST RESULTS: ${passCount} passed, ${failCount} failed`);
    console.log('='.repeat(50));
    
    if (failCount === 0) {
        console.log('🎉 All tests passed!');
    } else {
        console.warn(`⚠️ ${failCount} test(s) failed - review above for details`);
    }
}