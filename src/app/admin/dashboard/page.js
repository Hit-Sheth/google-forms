'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { Plus, Edit2, FileText, Users, Trash2, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchForms() {
    try {
      setLoading(true);
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

  useEffect(() => {
    fetchForms();
  }, []);

  async function handleDeleteForm(id) {
    if (!confirm('Are you sure you want to delete this form and all its responses? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/forms/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchForms();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete form');
      }
    } catch (err) {
      console.error('Delete form failed', err);
    }
  }

  async function toggleFormActive(id, currentActive) {
    try {
      const res = await fetch(`/api/admin/forms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      if (res.ok) {
        fetchForms();
      }
    } catch (err) {
      console.error('Toggle active status failed', err);
    }
  }

  return (
    <>
      <Header />
      <main className="container" style={{ marginTop: '2rem', paddingBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Admin Form Control</h1>
            <p style={{ color: 'var(--text-muted)' }}>Build powerful dynamic forms, assign employee access, and manage responses.</p>
          </div>
          <Link href="/admin/forms/new" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            <span>Create New Form</span>
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style jsx global>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : forms.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.4, color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>No forms created yet</h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: '320px', margin: '0 auto 1.5rem' }}>
              Create your very first customizable, dynamic form to start collecting responses!
            </p>
            <Link href="/admin/forms/new" className="btn btn-primary">
              <Plus size={16} />
              <span>Create a Form Now</span>
            </Link>
          </div>
        ) : (
          <div className="grid-2">
            {forms.map((form) => (
              <div key={form._id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '12px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', wordBreak: 'break-word' }}>{form.title}</h3>
                    <button
                      onClick={() => toggleFormActive(form._id, form.active)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      title={form.active ? 'Accepting Responses (Click to Pause)' : 'Paused (Click to Open)'}
                    >
                      {form.active ? (
                        <span className="badge" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>Active</span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: 'var(--error-light)', color: 'var(--error)' }}>Paused</span>
                      )}
                    </button>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.5rem' }}>
                    {form.description || 'No description provided.'}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={14} />
                      {(form?.sections?.reduce((acc, s) => acc + (s?.questions?.length ?? 0), 0) ?? 0)} questions
                    </span>

                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={14} />
                      {(form?.allowedEmployees?.length ?? 0)} staff allowed
                    </span>

                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} />
                      {form?.createdAt ? new Date(form.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <Link
                    href={`/employee/forms/${form._id}/responses`}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, borderColor: 'var(--primary)', color: 'var(--primary)' }}
                  >
                    View Responses
                  </Link>

                  <Link
                    href={`/admin/forms/${form._id}/edit`}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Edit Form"
                  >
                    <Edit2 size={12} />
                    <span>Edit</span>
                  </Link>

                  <button
                    onClick={() => handleDeleteForm(form._id)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--error)', borderColor: 'var(--border)' }}
                    title="Delete Form"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}