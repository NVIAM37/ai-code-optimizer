import React, { createContext, useContext, useState, useEffect } from 'react';

const OptimizerContext = createContext();

export const useOptimizer = () => useContext(OptimizerContext);

const STORAGE_KEY = 'optimizer_state';
const STORAGE_VERSION = '2.0'; // Increment to force clear old data
const VERSION_KEY = 'optimizer_version';

export const OptimizerProvider = ({ children }) => {
    // Load initial state from localStorage
    const loadState = () => {
        // Check version and clear if outdated
        const savedVersion = localStorage.getItem(VERSION_KEY);
        if (savedVersion !== STORAGE_VERSION) {
            console.log('🔄 Clearing outdated localStorage data...');
            localStorage.removeItem(STORAGE_KEY);
            localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
            return null;
        }
        
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                
                // Sanitize metrics to ensure all values are numbers
                if (parsed.metrics) {
                    const sanitizeMetrics = (metricsObj) => {
                        if (!metricsObj || !metricsObj.metrics) return metricsObj;
                        
                        const sanitized = { ...metricsObj };
                        sanitized.metrics = {};
                        
                        for (const key in metricsObj.metrics) {
                            const value = metricsObj.metrics[key];
                            sanitized.metrics[key] = (typeof value === 'number' && !isNaN(value)) ? value : 0;
                        }
                        
                        return sanitized;
                    };
                    
                    if (parsed.metrics.original) {
                        parsed.metrics.original = sanitizeMetrics(parsed.metrics.original);
                    }
                    if (parsed.metrics.optimized) {
                        parsed.metrics.optimized = sanitizeMetrics(parsed.metrics.optimized);
                    }
                }
                
                return parsed;
            }
        } catch (err) {
            console.error('Failed to load optimizer state from localStorage:', err);
            // Clear corrupted data
            localStorage.removeItem(STORAGE_KEY);
        }
        return null;
    };

    const savedState = loadState();

    const [language, setLanguage] = useState(savedState?.language || 'python');
    const [code, setCode] = useState(savedState?.code || '');
    const [optimizedCode, setOptimizedCode] = useState(savedState?.optimizedCode || '');
    const [metrics, setMetrics] = useState(savedState?.metrics || null);
    const [aiMetadata, setAiMetadata] = useState(savedState?.aiMetadata || null);
    const [terminalLogs, setTerminalLogs] = useState(savedState?.terminalLogs || []);
    const [backendLogs, setBackendLogs] = useState(savedState?.backendLogs || []);

    // Advanced Mode State
    const [isAdvancedMode, setIsAdvancedMode] = useState(savedState?.isAdvancedMode || false);
    const [advancedSettings, setAdvancedSettings] = useState(savedState?.advancedSettings || {
        paradigm: 'Procedural',
        optimizationType: 'Balanced',
        useLLVM: false,
        projectContext: 'Standalone Script'
    });

    // Save state to localStorage whenever it changes
    useEffect(() => {
        const stateToSave = {
            language,
            code,
            optimizedCode,
            metrics,
            aiMetadata,
            terminalLogs,
            backendLogs,
            isAdvancedMode,
            advancedSettings
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (err) {
            console.error('Failed to save optimizer state to localStorage:', err);
        }
    }, [language, code, optimizedCode, metrics, aiMetadata, terminalLogs, backendLogs, isAdvancedMode, advancedSettings]);

    const clearState = () => {
        setLanguage('python');
        setCode('');
        setOptimizedCode('');
        setMetrics(null);
        setAiMetadata(null);
        setTerminalLogs([]);
        setBackendLogs([]);
        setAdvancedSettings({
            paradigm: 'Procedural',
            optimizationType: 'Balanced',
            useLLVM: false,
            projectContext: 'Standalone Script'
        });
        localStorage.removeItem(STORAGE_KEY);
    };

    const loadFromHistory = (historyRecord) => {
        console.log('📂 Loading session from history:', historyRecord);

        // Restore language
        if (historyRecord.language) {
            setLanguage(historyRecord.language);
        }

        // Restore code
        if (historyRecord.originalCode) {
            setCode(historyRecord.originalCode);
        }

        // Restore optimized code
        if (historyRecord.optimizedCode) {
            setOptimizedCode(historyRecord.optimizedCode);
        }

        // Restore metrics (handle both old and new formats)
        if (historyRecord.metrics) {
            let originalMetrics = historyRecord.metrics.original;
            let optimizedMetrics = historyRecord.metrics.optimized;

            // Backward compatibility: unwrap nested metrics if present
            if (originalMetrics?.metrics) {
                originalMetrics = originalMetrics.metrics;
            }
            if (optimizedMetrics?.metrics) {
                optimizedMetrics = optimizedMetrics.metrics;
            }

            // MetricsCard expects: { original: { metrics: {...} }, optimized: { metrics: {...} } }
            setMetrics({
                original: { metrics: originalMetrics },
                optimized: { metrics: optimizedMetrics }
            });

            console.log('✅ Metrics restored:', {
                original: originalMetrics,
                optimized: optimizedMetrics
            });
        }

        // Restore AI metadata
        if (historyRecord.aiMetadata) {
            setAiMetadata(historyRecord.aiMetadata);
        }

        // Restore advanced mode based on intensity
        if (historyRecord.intensity && historyRecord.intensity > 50) {
            setIsAdvancedMode(true);
        }

        console.log('✅ Session restored from history');
    };

    const value = {
        language, setLanguage,
        code, setCode,
        optimizedCode, setOptimizedCode,
        metrics, setMetrics,
        aiMetadata, setAiMetadata,
        terminalLogs, setTerminalLogs,
        backendLogs, setBackendLogs,
        isAdvancedMode, setIsAdvancedMode,
        advancedSettings, setAdvancedSettings,
        clearState,
        loadFromHistory
    };

    return (
        <OptimizerContext.Provider value={value}>
            {children}
        </OptimizerContext.Provider>
    );
};
