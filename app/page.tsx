import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasUrl || !hasKey) {
    return (
      <div className="min-h-screen bg-surface-900 text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-lg w-full bg-surface-800 p-8 rounded-xl border border-danger-500/50 shadow-2xl">
          <h1 className="text-2xl font-bold text-danger-500 mb-4">Deployment Configuration Error</h1>
          <p className="text-surface-300 mb-6">
            The application cannot start because it cannot find the Supabase authentication keys.
          </p>

          <div className="bg-black/30 p-4 rounded-lg font-mono text-sm space-y-2 mb-6">
            <div className="flex justify-between border-b border-surface-700 pb-2">
              <span className="text-surface-400">Environment</span>
              <span className="text-accent-400">Vercel Production</span>
            </div>
            <div className="flex justify-between">
              <span>NEXT_PUBLIC_SUPABASE_URL</span>
              <span className={hasUrl ? "text-success-500" : "text-danger-500"}>
                {hasUrl ? 'Found ✅' : 'Missing ❌'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              <span className={hasKey ? "text-success-500" : "text-danger-500"}>
                {hasKey ? 'Found ✅' : 'Missing ❌'}
              </span>
            </div>
          </div>

          <div className="bg-primary-900/30 p-4 rounded-lg border border-primary-500/30">
            <h3 className="font-semibold text-primary-200 mb-2">How to Fix on Vercel:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-surface-300">
              <li>Go to Vercel Dashboard → Settings → Environment Variables</li>
              <li>Add the missing keys exactly as named above</li>
              <li><strong>IMPORTANT:</strong> You must <span className="text-white font-bold">Redeploy</span> after adding them!</li>
              <li>(Go to Deployments → Three dots ... → Redeploy)</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = userData?.role || 'nasabah';
  redirect(`/dashboard/${role}`);
}
