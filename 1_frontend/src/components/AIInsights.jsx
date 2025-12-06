import React from 'react';
import { Lightbulb, ListChecks, AlertTriangle, Info } from 'lucide-react';

const AIInsights = ({ metadata }) => {
    if (!metadata) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                <Info size={24} />
                <p className="text-sm">Run an optimization to see AI insights.</p>
            </div>
        );
    }

    const { explanation, changes, warnings } = metadata;

    return (
        <div className="h-full overflow-y-auto p-4 space-y-6 text-sm">
            {/* Explanation Section */}
            {explanation && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-400 font-medium uppercase tracking-wider text-xs">
                        <Lightbulb size={14} />
                        <span>AI Explanation</span>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-md p-3 border border-gray-800 text-gray-300 leading-relaxed">
                        {explanation}
                    </div>
                </div>
            )}

            {/* Changes Section */}
            {changes && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-400 font-medium uppercase tracking-wider text-xs">
                        <ListChecks size={14} />
                        <span>Optimizations Applied</span>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-md p-3 border border-gray-800 text-gray-300">
                        {/* Handle both string list (newlines) and array */}
                        {Array.isArray(changes) ? (
                            <ul className="list-disc list-inside space-y-1">
                                {changes.map((change, i) => (
                                    <li key={i}>{change}</li>
                                ))}
                            </ul>
                        ) : (
                            <div className="whitespace-pre-line">{changes}</div>
                        )}
                    </div>
                </div>
            )}

            {/* Warnings Section */}
            {warnings && warnings.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-yellow-500 font-medium uppercase tracking-wider text-xs">
                        <AlertTriangle size={14} />
                        <span>Warnings & Considerations</span>
                    </div>
                    <div className="bg-[#2a2210] rounded-md p-3 border border-yellow-900/50 text-yellow-200/80">
                        {/* Handle both string list (newlines) and array */}
                        {Array.isArray(warnings) ? (
                            <ul className="list-disc list-inside space-y-1">
                                {warnings.map((warning, i) => (
                                    <li key={i}>{warning}</li>
                                ))}
                            </ul>
                        ) : (
                            <div className="whitespace-pre-line">{warnings}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIInsights;
