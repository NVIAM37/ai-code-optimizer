import React from 'react'

export default function MetricsTab(){
  return (
    <div className=' text-white'>
      <p>Code size: 42 KB (dummy)</p>
      <p>Complexity: 7/10 (dummy)</p>
      <p>Last run: {new Date().toLocaleString()}</p>
    </div>
  )
}
