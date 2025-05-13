// src/components/ErrorDisplay.js
import React from 'react';

export const ErrorDisplay = ({ error }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-8 text-red-600 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 dark:text-red-400 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold mb-4">Connection Error</h1>
      <p className="mb-6 max-w-2xl leading-relaxed">{error}</p>
      
      <div className="text-left bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md p-4 w-full max-w-2xl overflow-x-auto font-mono text-sm mb-6">
        <strong className="dark:text-gray-300">Possible causes:</strong>
        <ul className="list-disc ml-5 mt-2 mb-4 dark:text-gray-400">
          <li>The backend service is not running</li>
          <li>MongoDB connection is misconfigured or unavailable</li>
          <li>Network connectivity issues between services</li>
          <li>Incorrect API_ENDPOINT configuration</li>
        </ul>

        <strong className="dark:text-gray-300">Suggested actions:</strong>
        <ul className="list-disc ml-5 mt-2 dark:text-gray-400">
          <li>Check backend logs: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">docker-compose logs backend</code></li>
          <li>Verify MongoDB URI in .env file</li>
          <li>Ensure MONGODB_URI environment variable is passed to backend</li>
          <li>Check network connectivity between services</li>
        </ul>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Check application logs for more detailed error information.</p>
      <button 
        className="bg-blue-600 text-white border-none rounded px-4 py-2 font-bold cursor-pointer hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        onClick={() => window.location.reload()}>
        Reload Page
      </button>
    </div>
  );
};