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
    // Functional Programming Utilities Tests (NEW)
    // ========================================================================
    console.log('\n🔧 Testing FP Utilities (fp.js)...');
    
    // Test pipe
    assert(typeof pipe === 'function', 'pipe function exists');
    const pipedResult = pipe(5, x => x + 1, x => x * 2);
    assert(pipedResult === 12, 'pipe correctly chains functions left-to-right');
    
    const pipedArray = pipe([1, 2, 3], arr => arr.filter(x => x > 1), arr => arr.map(x => x * 2));
    assert(pipedArray.length === 2, 'pipe works with array transformations');
    assert(pipedArray[0] === 4 && pipedArray[1] === 6, 'pipe produces correct array results');
    
    // Test flow
    assert(typeof flow === 'function', 'flow function exists');
    const addOneThenDouble = flow(x => x + 1, x => x * 2);
    assert(addOneThenDouble(5) === 12, 'flow creates reusable composed function');
    
    // Test compose
    assert(typeof compose === 'function', 'compose function exists');
    const doubleThenAddOne = compose(x => x + 1, x => x * 2);
    assert(doubleThenAddOne(5) === 11, 'compose applies functions right-to-left');
    
    // Test curry
    assert(typeof curry === 'function', 'curry function exists');
    const add3 = (a, b, c) => a + b + c;
    const curriedAdd = curry(add3);
    assert(curriedAdd(1)(2)(3) === 6, 'curry allows one arg at a time');
    assert(curriedAdd(1, 2)(3) === 6, 'curry allows multiple args');
    assert(curriedAdd(1)(2, 3) === 6, 'curry allows remaining args at once');
    
    // Test partial
    assert(typeof partial === 'function', 'partial function exists');
    const greet = (greeting, name) => `${greeting}, ${name}!`;
    const sayHello = partial(greet, 'Hello');
    assert(sayHello('World') === 'Hello, World!', 'partial presets arguments');
    
    // Test immutable helpers
    assert(typeof freezeShallow === 'function', 'freezeShallow function exists');
    const frozen = freezeShallow({ a: 1 });
    assert(Object.isFrozen(frozen), 'freezeShallow returns frozen object');
    
    assert(typeof setIn === 'function', 'setIn function exists');
    const nestedObj = { user: { name: 'Alice', age: 30 } };
    const updated = setIn(nestedObj, ['user', 'age'], 31);
    assert(updated.user.age === 31, 'setIn updates nested property');
    assert(nestedObj.user.age === 30, 'setIn does not mutate original');
    
    assert(typeof getIn === 'function', 'getIn function exists');
    assert(getIn(nestedObj, ['user', 'name']) === 'Alice', 'getIn retrieves nested value');
    assert(getIn(nestedObj, ['x', 'y'], 'default') === 'default', 'getIn returns default for missing path');
    
    // Test curried array utilities
    assert(typeof map === 'function', 'curried map function exists');
    const doubled = pipe([1, 2, 3], map(x => x * 2));
    assert(doubled[0] === 2 && doubled[1] === 4, 'curried map works in pipe');
    
    assert(typeof filter === 'function', 'curried filter function exists');
    const evens = pipe([1, 2, 3, 4], filter(x => x % 2 === 0));
    assert(evens.length === 2, 'curried filter works in pipe');
    
    assert(typeof reduce === 'function', 'curried reduce function exists');
    const sum = pipe([1, 2, 3], reduce((acc, x) => acc + x, 0));
    assert(sum === 6, 'curried reduce works in pipe');
    
    assert(typeof take === 'function', 'curried take function exists');
    const first2 = pipe([1, 2, 3, 4, 5], take(2));
    assert(first2.length === 2 && first2[1] === 2, 'curried take works correctly');
    
    // Test predicate utilities
    assert(typeof propEq === 'function', 'propEq function exists');
    const isActive = propEq('status', 'active');
    assert(isActive({ status: 'active' }) === true, 'propEq matches correctly');
    assert(isActive({ status: 'inactive' }) === false, 'propEq rejects non-match');
    
    assert(typeof identity === 'function', 'identity function exists');
    assert(identity(42) === 42, 'identity returns its argument');
    
    assert(typeof always === 'function', 'always function exists');
    const alwaysZero = always(0);
    assert(alwaysZero() === 0, 'always returns constant value');

    // ========================================================================
    // State Management Tests (NEW)
    // ========================================================================
    console.log('\n📊 Testing State Management (state.js)...');
    
    // Test ActionTypes
    assert(typeof ActionTypes === 'object', 'ActionTypes constant exists');
    assert(ActionTypes.ADD_EVENT === 'ADD_EVENT', 'ActionTypes.ADD_EVENT is correct');
    assert(ActionTypes.TOGGLE_CHECKLIST_ITEM === 'TOGGLE_CHECKLIST_ITEM', 'ActionTypes has checklist action');
    
    // Test action creators
    assert(typeof createAddEventAction === 'function', 'createAddEventAction exists');
    const eventAction = createAddEventAction(1, 'INFO', 'Test message', 12345);
    assert(eventAction.type === ActionTypes.ADD_EVENT, 'createAddEventAction returns correct type');
    assert(eventAction.payload.machineId === 1, 'createAddEventAction includes machineId');
    assert(eventAction.payload.message === 'Test message', 'createAddEventAction includes message');
    
    assert(typeof createToggleChecklistAction === 'function', 'createToggleChecklistAction exists');
    const toggleAction = createToggleChecklistAction('Safety', 'Test item');
    assert(toggleAction.type === ActionTypes.TOGGLE_CHECKLIST_ITEM, 'Toggle action has correct type');
    assert(toggleAction.payload.section === 'Safety', 'Toggle action includes section');
    
    // Test pure reducers
    assert(typeof eventsReducer === 'function', 'eventsReducer exists');
    const testEvents = [{ id: 1, message: 'Old event', severity: 'INFO', acknowledged: false }];
    const addAction = createAddEventAction(1, 'ALARM', 'New alarm', Date.now());
    const newEvents = eventsReducer(testEvents, addAction);
    assert(newEvents.length === 2, 'eventsReducer adds new event');
    assert(newEvents[0].message === 'New alarm', 'eventsReducer prepends new event');
    assert(testEvents.length === 1, 'eventsReducer does not mutate original array');
    
    // Test event acknowledgment reducer
    const ackAction = createAcknowledgeEventAction(1);
    const ackedEvents = eventsReducer(testEvents, ackAction);
    assert(ackedEvents[0].acknowledged === true, 'eventsReducer acknowledges event');
    assert(testEvents[0].acknowledged === false, 'eventsReducer does not mutate original event');
    
    // Test checklist reducer
    assert(typeof checklistReducer === 'function', 'checklistReducer exists');
    const testChecklist = {
        Safety: [{ item: 'Test item', checked: false }]
    };
    const checklistToggleAction = createToggleChecklistAction('Safety', 'Test item');
    const newChecklist = checklistReducer(testChecklist, checklistToggleAction);
    assert(newChecklist.Safety[0].checked === true, 'checklistReducer toggles item');
    assert(testChecklist.Safety[0].checked === false, 'checklistReducer does not mutate original');
    
    // Test pure metric calculators
    assert(typeof calculateMetrics === 'function', 'calculateMetrics exists');
    const testMachines = [
        { id: 1, status: 'RUN' },
        { id: 2, status: 'DOWN' }
    ];
    const testEventsForMetrics = [
        { timestamp: Date.now(), severity: 'ALARM' }
    ];
    const metrics = calculateMetrics(testEventsForMetrics, testMachines, [], Date.now());
    assert(metrics.machinesDown === 1, 'calculateMetrics counts machines down');
    assert(metrics.alarmsLast24h === 1, 'calculateMetrics counts recent alarms');
    
    // Test selectors
    assert(typeof selectMachineById === 'function', 'selectMachineById exists');
    assert(typeof selectEventsByMachine === 'function', 'selectEventsByMachine exists');
    assert(typeof selectChecklistProgress === 'function', 'selectChecklistProgress exists');

    // ========================================================================
    // Immutable Utility Tests (NEW)
    // ========================================================================
    console.log('\n🔒 Testing Immutable Utilities...');
    
    // Test createEvent
    assert(typeof createEvent === 'function', 'createEvent pure function exists');
    const newEventObj = createEvent([], 1, 'INFO', 'Test', 12345);
    assert(newEventObj.id === 1, 'createEvent assigns correct id');
    assert(newEventObj.acknowledged === false, 'createEvent defaults acknowledged to false');
    assert(Object.isFrozen(newEventObj), 'createEvent returns frozen object');
    
    // Test addEventImmutable
    assert(typeof addEventImmutable === 'function', 'addEventImmutable exists');
    const existingEvents = [{ id: 1, message: 'old' }];
    const addedEvents = addEventImmutable(existingEvents, { id: 2, message: 'new' }, 5);
    assert(addedEvents.length === 2, 'addEventImmutable adds event');
    assert(addedEvents[0].id === 2, 'addEventImmutable prepends event');
    assert(existingEvents.length === 1, 'addEventImmutable does not mutate original');
    
    // Test acknowledgeEventImmutable
    assert(typeof acknowledgeEventImmutable === 'function', 'acknowledgeEventImmutable exists');
    const eventsToAck = [{ id: 1, acknowledged: false }, { id: 2, acknowledged: false }];
    const afterAck = acknowledgeEventImmutable(eventsToAck, 1);
    assert(afterAck[0].acknowledged === true, 'acknowledgeEventImmutable acks correct event');
    assert(afterAck[1].acknowledged === false, 'acknowledgeEventImmutable leaves other events');
    assert(eventsToAck[0].acknowledged === false, 'acknowledgeEventImmutable does not mutate');
    
    // Test toggleChecklistItemImmutable
    assert(typeof toggleChecklistItemImmutable === 'function', 'toggleChecklistItemImmutable exists');
    const checklistToToggle = { Safety: [{ item: 'Guards', checked: false }] };
    const toggled = toggleChecklistItemImmutable(checklistToToggle, 'Safety', 'Guards');
    assert(toggled.Safety[0].checked === true, 'toggleChecklistItemImmutable toggles item');
    assert(checklistToToggle.Safety[0].checked === false, 'toggleChecklistItemImmutable does not mutate');
    
    // Test resetChecklistImmutable
    assert(typeof resetChecklistImmutable === 'function', 'resetChecklistImmutable exists');
    const checklistToReset = { 
        Safety: [{ item: 'Test', checked: true }],
        IO: [{ item: 'Inputs', checked: true }]
    };
    const resetResult = resetChecklistImmutable(checklistToReset);
    assert(resetResult.Safety[0].checked === false, 'resetChecklistImmutable unchecks items');
    assert(resetResult.IO[0].checked === false, 'resetChecklistImmutable resets all sections');
    assert(checklistToReset.Safety[0].checked === true, 'resetChecklistImmutable does not mutate');
    
    // Test computeMetrics pure function
    assert(typeof computeMetrics === 'function', 'computeMetrics pure function exists');
    const pureMetrics = computeMetrics(Date.now());
    assert(typeof pureMetrics.alarmsLast24h === 'number', 'computeMetrics returns alarmsLast24h');
    assert(typeof pureMetrics.machinesDown === 'number', 'computeMetrics returns machinesDown');
    assert(Object.isFrozen(pureMetrics), 'computeMetrics returns frozen object');

    // ========================================================================
    // Time-Injectable Pure Function Tests (NEW)
    // ========================================================================
    console.log('\n⏰ Testing Time-Injectable Pure Functions...');
    
    // Test formatAgo with injectable time
    assert(typeof formatAgo === 'function', 'formatAgo function exists');
    const pastTime = 1000000;
    const currentTime = 1005000; // 5 seconds later
    const agoResult = formatAgo(pastTime, currentTime);
    assert(agoResult === '5s ago', 'formatAgo with injected time returns correct result');
    assert(formatAgo(null) === 'Never', 'formatAgo returns Never for null');
    
    // Test templateMachineCard with injectable time
    const testMachineForTemplate = { 
        id: 1, 
        name: 'Test Machine', 
        status: 'RUN', 
        healthScore: 95, 
        lastHeartbeat: 1000000 
    };
    const cardWithTime = templateMachineCard(testMachineForTemplate, 1005000);
    assert(cardWithTime.includes('5s ago'), 'templateMachineCard uses injected time');
    
    // Test templateMachineHealthCard with injectable time
    const healthCardWithTime = templateMachineHealthCard(testMachineForTemplate, 1010000);
    assert(healthCardWithTime.includes('10s ago'), 'templateMachineHealthCard uses injected time');
    
    // Test calculateDowntimeToday with injectable time
    assert(typeof calculateDowntimeToday === 'function', 'calculateDowntimeToday function exists');
    // Function should accept time parameter
    const downtimeResult = calculateDowntimeToday(Date.now());
    assert(typeof downtimeResult === 'number', 'calculateDowntimeToday returns number');

    // ========================================================================
    // Curried Template Function Tests (NEW)
    // ========================================================================
    console.log('\n🎨 Testing Curried Template Functions...');
    
    // Test curriedMetricCard
    assert(typeof curriedMetricCard === 'function', 'curriedMetricCard exists');
    const redMetric = curriedMetricCard('text-red-600');
    assert(typeof redMetric === 'function', 'curriedMetricCard returns partially applied function');
    
    const redWithTooltip = redMetric('Danger tooltip');
    assert(typeof redWithTooltip === 'function', 'curriedMetricCard can be partially applied twice');
    
    const finalMetricHtml = redWithTooltip('Alarms', 5);
    assert(finalMetricHtml.includes('text-red-600'), 'curriedMetricCard includes color class');
    assert(finalMetricHtml.includes('5'), 'curriedMetricCard includes value');
    
    // Test pre-configured metric cards
    assert(typeof dangerMetricCard === 'function', 'dangerMetricCard exists');
    assert(typeof warningMetricCard === 'function', 'warningMetricCard exists');
    assert(typeof successMetricCard === 'function', 'successMetricCard exists');
    assert(typeof infoMetricCard === 'function', 'infoMetricCard exists');

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