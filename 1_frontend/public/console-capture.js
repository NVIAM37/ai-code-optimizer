
// This script is injected to capture console logs
(function () {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    window.__consoleLogs = [];

    function capture(type, args) {
        window.__consoleLogs.push({ type, message: Array.from(args).map(a => String(a)).join(' ') });
    }

    console.log = function (...args) { capture('log', args); originalLog.apply(console, args); };
    console.error = function (...args) { capture('error', args); originalError.apply(console, args); };
    console.warn = function (...args) { capture('warn', args); originalWarn.apply(console, args); };

    window.onerror = function (message, source, lineno, colno, error) {
        capture('error', [`Global Error: ${message} at ${source}:${lineno}:${colno}`]);
    };
})();
