
'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <html>
            <body className="bg-surface-900 text-white flex items-center justify-center min-h-screen p-4">
                <div className="max-w-md text-center space-y-4">
                    <h2 className="text-2xl font-bold text-danger-500">Something went wrong!</h2>
                    <p className="text-surface-300">
                        {error.message || 'An unexpected error occurred.'}
                    </p>
                    <div className="text-sm bg-surface-800 p-4 rounded-lg overflow-auto text-left font-mono">
                        <p className="text-warning-400 mb-2">Troubleshooting:</p>
                        <ul className="list-disc list-inside space-y-1 text-surface-400">
                            <li>Check Vercel Environment Variables</li>
                            <li>Ensure NEXT_PUBLIC_SUPABASE_URL is set</li>
                            <li>Ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set</li>
                        </ul>
                    </div>
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-primary-600 rounded-lg hover:bg-primary-700 transition"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
