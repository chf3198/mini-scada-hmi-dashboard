// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Curtis Franks <curtisfranks@gmail.com>

'use strict';

/**
 * @file Security utilities for input sanitization and XSS prevention.
 * @module security
 * @description Provides safe text handling for user-generated content.
 * @author Curtis Franks <curtisfranks@gmail.com>
 * @copyright 2026 Curtis Franks
 * @license MIT
 * @see {@link https://github.com/chf3198/mini-scada-hmi-dashboard}
 */

// ============================================================================
// XSS PREVENTION
// ============================================================================

/**
 * HTML entity map for escaping special characters.
 * @type {Object<string, string>}
 * @constant
 */
const HTML_ENTITIES = Object.freeze({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
});

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Use this function when inserting user-generated content into HTML.
 * @param {string} unsafeString - The potentially unsafe input string
 * @returns {string} The escaped, safe string
 * @example escapeHtml('<script>alert("XSS")</script>') // => '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 * @pure
 */
function escapeHtml(unsafeString) {
    if (typeof unsafeString !== 'string') {
        return String(unsafeString);
    }
    return unsafeString.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char]);
}

/**
 * Sanitizes a string by removing potentially dangerous characters.
 * More aggressive than escapeHtml - removes rather than escapes.
 * @param {string} input - The input string to sanitize
 * @returns {string} The sanitized string
 * @pure
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return String(input);
    }
    // Remove any HTML tags and trim whitespace
    return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Validates and sanitizes a machine ID.
 * @param {string|number} id - The machine ID to validate
 * @returns {number|null} The parsed ID as a number, or null if invalid
 * @pure
 */
function validateMachineId(id) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId < 0 || parsedId > 1000) {
        return null;
    }
    return parsedId;
}

/**
 * Validates a runbook code format.
 * Expected format: XXXX-NNN (4 letters, hyphen, 3 digits)
 * @param {string} code - The runbook code to validate
 * @returns {boolean} True if valid format
 * @pure
 */
function isValidRunbookCode(code) {
    if (typeof code !== 'string') return false;
    return /^[A-Z]{2,6}-\d{3}$/.test(code);
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Safely parses JSON with error handling.
 * @param {string} jsonString - The JSON string to parse
 * @param {*} defaultValue - Default value to return on parse failure
 * @returns {*} Parsed object or defaultValue on error
 */
function safeJsonParse(jsonString, defaultValue = null) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.warn('JSON parse error:', error.message);
        return defaultValue;
    }
}

/**
 * Wraps a function in try/catch and logs errors.
 * @param {Function} fn - The function to wrap
 * @param {string} context - Context description for error logging
 * @returns {Function} Wrapped function that catches and logs errors
 */
function withErrorHandling(fn, context) {
    return function(...args) {
        try {
            return fn.apply(this, args);
        } catch (error) {
            console.error(`Error in ${context}:`, error.message);
            return null;
        }
    };
}
