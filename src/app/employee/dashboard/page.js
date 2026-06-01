'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { ClipboardList, FileText, Calendar, PenTool, Eye, Edit2 } from 'lucide-react';

export default function EmployeeDashboard() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const authRes = await fetch('/api/auth/me');
        if (authRes.ok) {
          const authData = await authRes.json();
          setUserId(authData.user.userId || authData.user.id || authData.user._id);
        }

        const formsRes = await fetch('/api/admin/forms');
        if (formsRes.ok) {
          const formsData = await formsRes.json();
          setForms(formsData.forms);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <>
      <Header />
      <main className="container" style={{ marginTop: '2rem', paddingBottom: '3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Employee Workspace</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage, edit, or fill out forms based on your assigned permissions.</p>
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
              The administrator has not granted you access to any forms yet.
            </p>
          </div>
        ) : (
          <div className="grid-2">
            {forms.map((form) => {
              const totalQuestions = form.sections
                ? form.sections.reduce((sum, sec) => sum + (sec.questions?.length || 0), 0)
                : (form.questions?.length || 0);

              const myRecord = form.allowedEmployees?.find(emp => (emp.user?._id || emp.user) === userId);
              const perms = myRecord?.permissions || {};
              
              const canView = perms.canViewAll || perms.canViewOwn;
              const canSubmit = perms.canSubmit;
              const canEditForm = perms.canEditForm; // <-- New permission check

              // Determine the role badge
              let roleBadge = 'Submitter';
              if (canEditForm) roleBadge = 'Form Editor';
              else if (canView) roleBadge = 'Reviewer';

              return (
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
                        {totalQuestions} questions
                      </span>

                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} />
                        Created {new Date(form.createdAt).toLocaleDateString()}
                      </span>
                      
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: 'auto', color: 'var(--primary)', fontWeight: '600' }}>
                        {roleBadge}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Action Buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    
                    {canView && (
                      <Link href={`/employee/forms/${form._id}/responses`} className="btn btn-primary btn-sm" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Eye size={14} />
                        <span>{perms.canViewAll ? 'All Responses' : 'My Responses'}</span>
                      </Link>
                    )}

                    {canEditForm && (
                      <Link href={`/employee/forms/${form._id}/edit`} className="btn btn-secondary btn-sm" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                        <Edit2 size={14} />
                        <span>Edit Form</span>
                      </Link>
                    )}

                    {canSubmit && (
                      <Link href={`/forms/${form._id}`} className="btn btn-secondary btn-sm" style={{ flex: (!canView && !canEditForm) ? 1 : 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <PenTool size={14} />
                        <span>Fill</span>
                      </Link>
                    )}

                    {!canView && !canSubmit && !canEditForm && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic', width: '100%', textAlign: 'center' }}>
                        No actions assigned.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}