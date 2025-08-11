'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to scout page immediately
    router.replace('/scout');
  }, [router]);

  // Show loading screen during redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Loading Scout...</h2>
        <p className="text-gray-600">Redirecting to your travel planning assistant</p>
      </div>
    </div>
  );
}