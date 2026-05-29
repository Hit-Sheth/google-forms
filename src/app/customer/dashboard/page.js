'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { ClipboardList, CheckCircle, ArrowRight, FileSignature, RefreshCw } from 'lucide-react';

export default function CustomerDashboard() {
  const [activeForms, setActiveForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchCustomerData() {
    try {
      setLoading(true);
      const res = await fetch('/api/customer/forms');
      if (res.ok) {
        const data = await res.json();
        setActiveForms(data.activeForms);
        setSubmissions(data.submittedResponses);
      }
    } catch (err) {
      console.error('Failed to load customer dashboard data', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomerData();
  }, []);

  return (
    <>
      <Header />
      <main className="container" style={{ marginTop: '2rem', paddingBottom: '4rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Customer Portal</h1>
          <p style={{ color: 'var(--text-muted)' }}>Browse active company forms to fill or view your past submissions.</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
            <RefreshCw size={28} className="text-primary" style={{ animation: 'spin 1.5s linear infinite' }} />
          </div>
        ) : (
          <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr' }}>
            {/* Available Forms */}
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={20} className="text-primary" />
                <span>Forms Available to Fill</span>
              </h2>

              {activeForms.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
                  <p>No active forms available at the moment. Please check back later!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activeForms.map((form) => (
                    <div key={form._id} className="card card-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '4px' }}>{form.title}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{form.description || 'No description.'}</p>
                      </div>
                      <Link href={`/forms/${form._id}`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span>Fill Form</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Submissions */}
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} className="text-primary" />
                <span>My Past Submissions ({submissions.length})</span>
              </h2>

              {submissions.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <FileSignature size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <p>You haven&apos;t submitted any forms yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
                  {submissions.map((sub) => {
                    const title = sub.form?.title || 'Deleted Form';
                    return (
                      <div key={sub._id} className="card" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.875rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {title}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          Submitted: {new Date(sub.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
