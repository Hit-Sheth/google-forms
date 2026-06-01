'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { ArrowLeft, Activity, Trash2, Edit2, PlusCircle, CheckCircle, RefreshCw, ShieldAlert } from 'lucide-react';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/admin/logs');
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs);
        }
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  if (loading) return <div className="container" style={{ marginTop: '2rem' }}>Loading logs...</div>;

  return (
    <>
      <Header />
      <main className="container" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h1><Activity size={24} style={{ marginRight: '10px' }}/>Security Audit Logs</h1>
          <Link href="/admin/dashboard" className="btn btn-secondary"><ArrowLeft size={16} /> Back</Link>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--background)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Time</th>
                <th style={{ padding: '1rem' }}>User</th>
                <th style={{ padding: '1rem' }}>Action</th>
                <th style={{ padding: '1rem' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>{log.actor?.name}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge" style={{ textTransform: 'uppercase' }}>{log.action}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>{JSON.stringify(log.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}