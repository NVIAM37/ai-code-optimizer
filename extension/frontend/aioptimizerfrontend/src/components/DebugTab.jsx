import React from 'react'

export default function DebugTab({ postMessage }) {
  const start = () => {
    postMessage?.({ command: 'startSandbox' })
    alert('Start sandbox (dummy)')
  }
  const stop = () => {
    postMessage?.({ command: 'stopSandbox' })
    alert('Stop sandbox (dummy)')
  }

  return (
    <div>
      <div className="mb-2">
        <button onClick={start} className="px-3 py-1 bg-green-600 text-white rounded mr-2 cursor-pointer">Start</button>
        <button onClick={stop} className="px-3 py-1 bg-red-600 text-white rounded cursor-pointer">Stop</button>
      </div>
      <pre className="bg-gray-100 p-2 h-40 overflow-auto text-black">Dummy logs will appear here...</pre>
    </div>
  )
}
  