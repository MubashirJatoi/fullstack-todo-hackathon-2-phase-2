'use client';

import { api } from '@/lib/api';

export default function DebugApiPage() {
  return (
    <div className="p-4">
      <h1>API Debug Info</h1>
      <p><strong>Base URL:</strong> {api['client']?.defaults?.baseURL || 'Not available'}</p>
      <p><strong>Environment API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
      <button
        onClick={() => alert(`Base URL: ${api['client']?.defaults?.baseURL}`)}
        className="bg-blue-500 text-white p-2 rounded mt-4"
      >
        Alert Base URL
      </button>
    </div>
  );
}