// import React, { useState } from 'react'

// export default function OptimizeTab({ postMessage }) {
//   const [code, setCode] = useState('')
//   const [level, setLevel] = useState('safe')

//   const handleOptimize = () => {
//     // send message to extension for real work
//     postMessage?.({ command: 'optimize', data: { code, level } })
//     alert('Optimize request sent (dummy)')
//   }

//   return (
//     <div className=' text-white'>
//       <label className="block mb-2 ">Code</label>
//       <textarea value={code} onChange={e=>setCode(e.target.value)} className="w-full h-40 border-white border p-2 mb-2 min-h-screen" />
//       <div className="flex gap-2 items-center mb-2  ">
//         <select value={level} onChange={e=>setLevel(e.target.value)} className="border p-1 text-gray-500 cursor-pointer">
//           <option value="safe cursor-pointer ">Safe</option>
//           <option value="aggressive cursor-pointer ">Aggressive</option>
//         </select>
//         <button onClick={handleOptimize} className="px-3 py-1 bg-blue-600 text-white rounded  cursor-pointer">Optimize</button>
//       </div>
//     </div>
//   )
// }





import React from "react";

export default function OptimizeTab({ uploadedFile }) {
  return (
    <div className="p-3">
      {uploadedFile ? (
        <div className="bg-[#1e1e1e] p-4 rounded-md border border-[#333] text-sm text-gray-300">
          ✅ <span className="text-white font-medium">{uploadedFile}</span> has been uploaded successfully.
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No file uploaded yet. Upload a file to optimize it.</p>
      )}
    </div>
  );
}
