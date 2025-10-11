// HistorySection.jsx
// React + Tailwind component for displaying chat/code optimization history.
// Use this as the content for your History tab.

import React, { useState } from 'react';

const sampleHistory = [
  {
    id: 1,
    title: 'Optimize Python Function',
    date: 'Oct 10, 2025',
    snippet: 'def process_data(data): result = []...',
    agent: 'Code Optimizer Pro',
  },
  {
    id: 2,
    title: 'Debug React Component',
    date: 'Oct 8, 2025',
    snippet: 'Unhandled runtime error in JSX...',
    agent: 'Debug Assistant',
  },
  {
    id: 3,
    title: 'Code Review: MERN App',
    date: 'Oct 6, 2025',
    snippet: 'Suggested improvements in API call structure...',
    agent: 'Chat Helper',
  },
];

export default function HistoryTab() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="flex flex-col h-full bg-[#121216] text-slate-200 border-l border-slate-700">
      <div className="px-4 pt-4 pb-3 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-slate-100">History</h2>
        <p className="text-xs text-slate-400">View your recent optimization and debugging sessions</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {sampleHistory.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelected(item.id)}
            className={`border border-slate-800 rounded-md p-4 cursor-pointer transition-colors ${
              selected === item.id ? 'bg-slate-800 border-emerald-600' : 'hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-white">{item.title}</h3>
              <span className="text-xs text-slate-500">{item.date}</span>
            </div>
            <p className="text-xs text-slate-400 mb-2 line-clamp-1">{item.snippet}</p>
            <span className="text-[11px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">{item.agent}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-700 p-3 text-xs text-slate-500 text-center">
        Showing {sampleHistory.length} history items
      </div>
    </div>
  );
}
