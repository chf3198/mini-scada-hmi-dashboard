'use strict';

/**
 * @file Self-tests for Mini SCADA HMI Dashboard
 * @description Unit tests for core application functionality.
 *              Run with ?test=1 URL parameter.
 * @module tests
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