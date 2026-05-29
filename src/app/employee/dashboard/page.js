'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { FileText, Calendar, ArrowRight, ClipboardList } from 'lucide-react';

export default function EmployeeDashboard() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchForms() {
      try {
        const res = await fetch('/api/admin/forms');
        if (res.ok) {
          const data = await res.json();
          setForms(data.forms);
        }
      } catch (err) {
        console.error('Failed to load forms', err);
      } finally {
        setLoading(false);
      }
    }
    fetchForms();
  }, []);

  return (
    <>
      <Header />
      <main className="container" style={{ marginTop: '2rem', paddingBottom: '3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Assigned Form Responses</h1>
          <p style={{ color: 'var(--text-muted)' }}>Select an active form below to monitor and review customer responses.</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : forms.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <ClipboardList size={48} style={{ margin: '0 auto 16px', opacity: 0.4, color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>No Assigned Forms</h3>
            <p style={{ fontSize: '0.875rem', maxWidth: '360px', margin: '0 auto' }}>
              The administrator has not granted you access to any form responses yet. When they do, they will appear here!
            </p>
          </div>
        ) : (
          <div className="grid-2">
            {forms.map((form) => (
              <div key={form._id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>{form.title}</h3>
                    {form.active ? (
                      <span className="badge" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>Active</span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: 'var(--error-light)', color: 'var(--error)' }}>Paused</span>
                    )}
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.5rem' }}>
                    {form.description || 'No description provided.'}
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={14} />
                      {form.questions.length} questions
                    </span>

                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} />
                      Created {new Date(form.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <Link
                    href={`/employee/forms/${form._id}/responses`}
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>View Response Analytics</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
