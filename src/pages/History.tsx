import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function History() {
  const { user } = useAuth();
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    async function load() {
      setLoading(true);
      try {
        const { data: sData, error: sErr } = await supabase
          .from('guardian_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        const { data: rData, error: rErr } = await supabase
          .from('safety_reports')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (sErr) throw sErr;
        if (rErr) throw rErr;

        setSessions(sData || []);
        setReports(rData || []);
      } catch (err: any) {
        console.error('Failed loading history', err.message || err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-space-navy-900">
        <p className="text-gray-400">Please sign in to view history.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-space-navy-900 text-white">
      <h1 className="text-2xl font-bold mb-4">History</h1>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Guardian Sessions</h2>
          <span className="text-sm text-gray-400">{sessions.length} items</span>
        </div>
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-gray-500">No guardian sessions yet.</div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="p-3 bg-space-navy-800 border border-space-navy-700 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">Session: {s.id}</div>
                    <div className="text-sm text-gray-400">Status: {s.status || '—'}</div>
                  </div>
                  <div className="text-sm text-gray-400">{new Date(s.created_at).toLocaleString()}</div>
                </div>
                {s.notes && <p className="mt-2 text-sm text-gray-300">{s.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Safety Reports</h2>
          <span className="text-sm text-gray-400">{reports.length} items</span>
        </div>
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="text-gray-500">No safety reports yet.</div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="p-3 bg-space-navy-800 border border-space-navy-700 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">Report: {r.id}</div>
                    <div className="text-sm text-gray-400">Type: {r.type || '—'}</div>
                  </div>
                  <div className="text-sm text-gray-400">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                {r.details && <p className="mt-2 text-sm text-gray-300">{r.details}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
