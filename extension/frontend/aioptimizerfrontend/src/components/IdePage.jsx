



import React, { useState } from "react";
import OptimizeTab from "./OptimizeTab";
import DebugTab from "./DebugTab";
import ChatTab from "./ChatTab";
import HistoryTab from "./HistoryTab";
import SettingsPage from "./SettingsTab.jsx";

// 🔹 Power Icon
function IconPower({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 2v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="16" r="6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

// 🔹 Gear Icon
function IconGear({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.6.2 1.07.66 1.27 1.27h.09a2 2 0 110 4h-.09c-.2.6-.66 1.07-1.27 1.27z"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 🔹 Close Icon
function IconClose({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function AIOptimizerPanel() {
  const [agentActive, setAgentActive] = useState(true);
  const [activeTab, setActiveTab] = useState("Optimize");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs = ["Optimize", "Debug", "Chat", "History", "Settings"];

  const renderTab = () => {
    switch (activeTab) {
      case "Optimize":
        return <OptimizeTab uploadedFile={uploadedFile} />;
      case "Debug":
        return <DebugTab />;
      case "Chat":
        return <ChatTab />;
      case "History":
        return <HistoryTab />;
      case "Settings":
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="relative h-screen bg-[#151515] text-gray-200 overflow-hidden">
      {/* 🔹 Toggle Button */}
      <button
        onClick={() => setSidebarOpen((prev) => !prev)}
        className="absolute top-10 right-3 z-50 p-2 bg-[#2f2f2f] text-white rounded-lg hover:bg-[#3b3b3b] transition"
      >
        {sidebarOpen ? <IconClose /> : <IconGear />}
      </button>

      {/* 🔹 Layout Wrapper */}
      <div className="flex h-full transition-all duration-500">
        {/* 🔹 Text Editor */}
        <main
          className={`flex-1 bg-[#1f1f1f] p-10 transition-all duration-500 ${
            sidebarOpen ? "mr-[360px]" : "mr-0"
          }`}
        >
          <textarea
            className="w-[98%] h-full rounded-sm bg-[#1a1a1a] shadow-inner border border-transparent focus:outline-none resize-none m-auto"
            placeholder="Write your code here..."
          ></textarea>
        </main>

        {/* 🔹 Sidebar (absolute positioned for perfect overlay) */}
        <aside
          className={`fixed right-0 top-0 h-full w-[400px] bg-[#262626] border-l border-[#1f1f1f] p-6 flex flex-col gap-6 transform transition-transform duration-500 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#2d2d2d] text-white">
                <IconPower />
              </div>
              <h1 className="text-white font-semibold text-lg leading-tight">
                AI Code Optimizer
              </h1>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300">AI Agent:</span>
              <span className="text-sm font-medium text-white">
                {agentActive ? "Active" : "Inactive"}
              </span>
            </div>

            <button
              onClick={() => setAgentActive((v) => !v)}
              className={`relative inline-flex h-6 w-14 items-center rounded-full transition-colors focus:outline-none ${
                agentActive ? "bg-[#3b82f6]" : "bg-[#3a3a3a]"
              }`}
            >
              <span
                className={`ml-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  agentActive ? "translate-x-8" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Tabs */}
          <nav>
            <ul className="flex gap-6 items-end border-b border-[#333] pb-3">
              {tabs.map((tab) => (
                <li key={tab} className="pb-2">
                  <button
                    onClick={() => setActiveTab(tab)}
                    className={`text-sm font-medium ${
                      activeTab === tab ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {tab}
                  </button>
                  {activeTab === tab && <div className="mt-2 h-0.5 rounded bg-white" />}
                </li>
              ))}
            </ul>
          </nav>

          {/* Dynamic Tab Content */}
          <div className="flex-1 overflow-y-auto">{renderTab()}</div>

          {/* Upload Button */}
          <div className="mt-4">
            <label
              htmlFor="file-upload"
              className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-[#3b3b3b] text-white text-sm font-medium shadow-sm hover:brightness-110 transition cursor-pointer"
            >
              Upload File
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                setUploadedFile(file ? file.name : null);
                setActiveTab("Optimize");
              }}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
