import React from 'react'

/**
 * Reusable loading spinner component
 * @param {string} message - Optional loading message to display
 */
export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-gray-600">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
      <p>{message}</p>
    </div>
  )
}
