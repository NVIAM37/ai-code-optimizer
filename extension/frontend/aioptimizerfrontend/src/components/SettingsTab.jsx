// import React, { useState } from 'react'

// export default function SettingsTab({ postMessage }) {
//   const [apiKey, setApiKey] = useState('')
//   const [agent, setAgent] = useState('agent-v1')

//   const save = () => {
//     // send to extension to securely store
//     postMessage?.({ command: 'storeApiKey', key: apiKey, agent })
//     alert('Settings sent to extension (dummy)')
//   }

//   return (
//     <div className="space-y-2 text-white">
//       <div className='flex  flex-col gap-2'>
//         <label className="block">API Key</label>
//         <input type="text" value={apiKey} onChange={e=>setApiKey(e.target.value)} className="w-full text-gray-400 border p-2" placeholder="Paste API key here" />
//       </div>
//       <div className='flex  flex-col gap-2'>
//         <label className="block">Choose Agent</label>
//         <select className="w-full border p-2" value={agent} onChange={e=>setAgent(e.target.value)}>
//           <option value="agent-v1">Agent v1</option>
//           <option value="agent-v2">Agent v2</option>
//         </select>
//       </div>
//       <div >
//         <button onClick={save} className="px-3 py-1 bg-indigo-600 text-white rounded cursor-pointer">Save Settings</button>
//       </div>
//     </div>
//   )
// }




/*
Settings Page — React + Tailwind
Single-file React component (default export)

How to use:
1. Create a React app (Vite / Create React App).
2. Install and configure Tailwind CSS according to the official docs.
3. Save this file as `src/components/SettingsPage.jsx` and import it from `App.jsx`:
   `import SettingsPage from "./components/SettingsPage";`
4. Render <SettingsPage /> inside your app.

Notes:
- Uses only Tailwind utility classes (no external CSS files).
- Inputs remove default focus outlines (focus:outline-none + focus:ring-0).
- The file upload for profile picture shows a preview and enforces a 10MB limit.
- Toggling switches are accessible (role="switch" + aria-checked).
*/

import React, { useRef, useState } from "react";

function UserIcon({ className = "w-8 h-8 text-gray-400" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown({ className = "w-4 h-4 text-gray-400" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-[#4f46e5]" : "bg-[#2b2b2b]"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [avatar, setAvatar] = useState(null);
  const [username, setUsername] = useState("coder_dev");
  const [email, setEmail] = useState("coder.dev@example.com");
  const [password, setPassword] = useState("password123");

  const [multiAgent, setMultiAgent] = useState(false);
  const [theme, setTheme] = useState("Dark");
  const [compactMode, setCompactMode] = useState(false);

  const fileRef = useRef(null);

  function handleAvatarChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      alert("File too large (max 10MB)");
      return;
    }
    const url = URL.createObjectURL(f);
    setAvatar({ file: f, url, name: f.name });
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-gray-200 antialiased">
      <div className="max-w-5xl mx-auto py-5 px-6">
        <h1 className="text-2xl font-extrabold border-b pb-2 text-white mb-4">Settings</h1>

        {/* User Profile Section */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-white mb-2">User Profile</h2>
          <div className="h-px bg-[#232323] mb-6" />

          <div className="bg-[#111111] border border-[#252525] rounded-xl p-6 shadow-inner">
            <div className="grid grid-cols-1  gap-6 items-start">
              {/* Avatar + Upload */}
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-20 h-20 rounded-full bg-[#0d0d0d] flex items-center justify-center overflow-hidden border border-[#222]">
                  {avatar ? (
                    <img src={avatar.url} alt="avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-3">
                      <UserIcon className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="pt-1  flex flex-col items-center justify-center">
                  <label htmlFor="avatar-upload" className="inline-flex items-center gap-2 px-2 py-1 rounded-md  bg-[#275BD6] text-white text-sm cursor-pointer ">
                    Upload
                  </label>
                  <input
                    id="avatar-upload"
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <div className="text-sm text-gray-400 mt-2">PNG, JPG, GIF up to 10MB</div>
                </div>
              </div>

              {/* Form fields (username + email) */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-1  gap-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Username</label>
                    <input
                    required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#0b0b0b] border border-[#262626] rounded-md px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-[#275BD6]"
                      placeholder="username"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Email</label>
                    <input
                    required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#0b0b0b] border border-[#262626] rounded-md px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-[#275BD6]"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>


                {/* Password  */}
                <div className="mt-4 ">
                  <label className="text-sm text-gray-300 mb-2 block">Password</label>
                  <div className="flex gap-4 flex-col items-center">
                    <input
                    required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 bg-[#0b0b0b] border border-[#262626] rounded-md px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-[#275BD6]"
                    />
                    <button onClick={()=> alert("Your info has been saved ....")} className="px-4 py-2 rounded-md bg-[#275BD6] text-sm text-white">Save</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Agent Settings */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">Agent Settings</h2>
          <div className="h-px bg-[#232323] mb-6" />

 
           {/* options of agent settings   */}
          <div className="bg-[#111111] border border-[#252525] rounded-xl p-6 shadow-inner ">
            <div className="grid grid-cols-1  gap-6 items-start">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Default Agent</label>
                <div className="relative">
                  <select
                    value={"GPT-4 Turbo"}
                    onChange={() => {}}
                    className="w-full bg-[#0b0b0b] border border-[#262626] rounded-md px-4 py-3 pr-10 text-gray-200 focus:outline-none focus:ring-0 focus:border-[#275BD6] appearance-none"
                  >
                    <option>GPT-4 Turbo</option>
                    <option>GPT-4</option>
                    <option>GPT-3.5</option>
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none">
                    <ChevronDown />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm text-gray-300 mb-2 block">Agent 1 API Key (Optional)</label>
                  <input className="w-full bg-[#0b0b0b] border border-[#262626] rounded-md px-4 py-3 text-gray-200 focus:outline-none focus:ring-0 focus:border-[#275BD6]" placeholder="Enter API Key" />
                </div>

                <div className="mt-4">
                  <label className="text-sm text-gray-300 mb-2 block">Agent 2 API Key (Optional)</label>
                  <input className="w-full bg-[#0b0b0b] border border-[#262626] rounded-md px-4 py-3 text-gray-200 focus:outline-none focus:ring-0 focus:border-[#275BD6]" placeholder="Enter API Key" />
                </div>

                <div className="mt-5">
                  <button className="px-4 py-2 rounded-md bg-[#2b6adf] text-white text-sm">Add New Agent</button>
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white font-medium">Multi-Agent Mode</div>
                      <div className="text-sm text-gray-400">Enable to use multiple AI agents.</div>
                    </div>
                    <Toggle checked={multiAgent} onChange={setMultiAgent} id="multi-agent-toggle" />
                  </div>
                </div>

                <div className="mt-6 text-sm text-gray-500">&nbsp;</div>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">Appearance</h2>
          <div className="h-px bg-[#232323] mb-6" />

          <div className="bg-[#111111] border border-[#252525] rounded-xl p-6 shadow-inner">
            <div className="grid grid-cols-1 gap-6 items-center">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Theme</label>
                <div className="relative">
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full bg-[#0b0b0b] border border-[#262626] rounded-md px-4 py-3 pr-10 text-gray-200 focus:outline-none focus:ring-0 focus:border-[#275BD6] appearance-none"
                  >
                    <option>Dark</option>
                    <option>Light</option>
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none">
                    <ChevronDown />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white font-medium">Compact Mode</div>
                  <div className="text-sm text-gray-400">Reduce padding for a denser UI.</div>
                </div>
                <Toggle checked={compactMode} onChange={setCompactMode} id="compact-toggle" />
              </div>
            </div>
          </div>
        </section>

        {/* small footer / saved state example */}
        {/* <div className="text-sm text-gray-500">All changes are saved locally in this demo.</div> */}
      </div>
    </div>
  );
}
