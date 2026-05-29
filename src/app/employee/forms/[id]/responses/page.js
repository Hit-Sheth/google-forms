'use client';

import { useState, useEffect, use } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Users, Clock, Mail, CheckSquare, ListPlus, ToggleLeft, RefreshCw, FileText } from 'lucide-react';
import { io } from "socket.io-client";

export default function FormResponsesPage({ params }) {
  const { id } = use(params);
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'individual'
  const [selectedResponseIndex, setSelectedResponseIndex] = useState(0);
  const [userRole, setUserRole] = useState('employee');
  // const [socket, setSocket] = useState(null);

  useEffect(() => {
  if (!id) return;

  const socketInstance = io();

  socketInstance.emit("join-form", id);

  socketInstance.on("new-response", (newResponse) => {
    setResponses((prev) => {
      const exists = prev.some((r) => r._id === newResponse._id);

      if (exists) return prev;

      return [newResponse, ...prev];
    });
  });

  return () => {
    socketInstance.off("new-response");
    socketInstance.disconnect();
  };
}, [id]);

  async function fetchResponses() {
    try {
      setLoading(true);
      const res = await fetch(`/api/forms/${id}/responses`);
      if (res.ok) {
        const data = await res.json();
        setForm(data.form);
        setResponses(data.responses);
      }
    } catch (err) {
      console.error('Failed to fetch responses', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResponses();

    // Check user role
    async function checkRole() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.user.role);
        }
      } catch (err) {
        console.error('Error fetching role', err);
      }
    }
    checkRole();
  }, [id]);

  // Aggregate answer statistics for dropdown, radio, and checkbox question types
  function getQuestionStats(question) {
    const stats = {};
    // Initialize stats for each pre-defined option
    question.options.forEach((opt) => {
      stats[opt] = 0;
    });

    let totalAnswers = 0;

    responses.forEach((resp) => {
      const ansVal = resp?.answers?.[question.id];
      if (ansVal === undefined || ansVal === null) return;

      if (Array.isArray(ansVal)) {
        // Checkboxes multiple answers
        ansVal.forEach((val) => {
          if (stats[val] !== undefined) {
            stats[val]++;
            totalAnswers++;
          }
        });
      } else {
        // Radio / Dropdown single answer
        if (stats[ansVal] !== undefined) {
          stats[ansVal]++;
          totalAnswers++;
        }
      }
    });

    return { stats, totalAnswers };
  }

  if (loading) {
    return (
      <>
        <Header />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <RefreshCw size={32} className="text-primary" style={{ animation: 'spin 1.5s linear infinite' }} />
        </div>
      </>
    );
  }

  if (!form) {
    return (
      <>
        <Header />
        <main className="container" style={{ marginTop: '3rem', textAlign: 'center' }}>
          <div className="card" style={{ maxWidth: '480px', margin: '0 auto', padding: '3rem 2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--error)', marginBottom: '8px' }}>Access Denied or Not Found</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              You do not have access rights to view these responses, or this form does not exist.
            </p>
            <Link href={userRole === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} className="btn btn-primary">
              Return to Dashboard
            </Link>
          </div>
        </main>
      </>
    );
  }

  const selectedResponse = responses[selectedResponseIndex];

  return (
    <>
      <Header />
      <main className="container" style={{ marginTop: '2rem', paddingBottom: '4rem' }}>
        {/* Back and Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <Link
            href={userRole === 'admin' ? '/admin/dashboard' : '/employee/dashboard'}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>

          <div style={{ display: 'flex', gap: '4px', background: 'var(--border)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
            <button
              onClick={() => setActiveTab('summary')}
              className={`btn btn-sm ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', boxShadow: activeTab === 'summary' ? 'var(--shadow-sm)' : 'none' }}
            >
              Summary Analytics
            </button>
            <button
              onClick={() => setActiveTab('individual')}
              className={`btn btn-sm ${activeTab === 'individual' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', boxShadow: activeTab === 'individual' ? 'var(--shadow-sm)' : 'none' }}
            >
              Individual Submissions ({responses.length})
            </button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>{form.title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Responses and submission analytics data overview.</p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} />
              {responses.length} Submissions
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <CheckSquare size={14} />
              {form.questions.length} Fields
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} />
              Last submitted: {responses.length > 0 ? new Date(responses[0].createdAt).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>

        {responses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <BarChart3 size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>Waiting for submissions</h3>
            <p style={{ fontSize: '0.875rem', maxWidth: '320px', margin: '0 auto' }}>
              No customers have submitted responses to this form yet. Once they fill it out, their data will pop up here instantly!
            </p>
          </div>
        ) : activeTab === 'summary' ? (
          /* SUMMARY ANALYTICS VIEW */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {form.questions.map((question, index) => {
              const isMCQ = ['dropdown', 'radio', 'checkbox'].includes(question.type);
              
              return (
                <div key={question.id} className="card">
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '1.25rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: '700' }}>Q{index + 1}.</span>
                    <span>{question.label}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: 'auto', background: 'var(--background)', padding: '2px 8px', borderRadius: '4px', textTransform: 'capitalize' }}>
                      {question.type}
                    </span>
                  </h3>

                  {isMCQ ? (
                    /* Multiple choice horizontal progress bar graph representation */
                    (() => {
                      const { stats, totalAnswers } = getQuestionStats(question);
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {question.options.map((opt) => {
                            const count = stats[opt] || 0;
                            const pct = totalAnswers > 0 ? Math.round((count / responses.length) * 100) : 0;
                            return (
                              <div key={opt}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                                  <span style={{ fontWeight: '500' }}>{opt}</span>
                                  <span style={{ color: 'var(--text-muted)' }}>
                                    {count} {count === 1 ? 'vote' : 'votes'} ({pct}%)
                                  </span>
                                </div>
                                <div style={{ height: '8px', width: '100%', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    /* Scrollable lists of text/numeric responses */
                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                      {responses
                        .filter((resp) => resp.answers[question.id] !== undefined && resp.answers[question.id] !== null && resp.answers[question.id] !== '')
                        .map((resp) => (
                          <div
                            key={resp._id}
                            style={{
                              padding: '8px 12px',
                              background: 'var(--background)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.875rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px'
                            }}
                          >
                            {question.type === 'file' ? (
                              <a href={resp.answers[question.id]} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <FileText size={14} />
                                View File
                              </a>
                            ) : (
                              <span style={{ wordBreak: 'break-all' }}>{resp.answers[question.id]}</span>
                            )}
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              - {resp.submittedBy?.name || 'Customer'}
                            </span>
                          </div>
                        ))}
                      {responses.filter((resp) => resp.answers[question.id] !== undefined && resp.answers[question.id] !== null && resp.answers[question.id] !== '').length === 0 && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                          No answers submitted for this question yet.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* INDIVIDUAL SUBMISSIONS VIEW */
          <div className="grid-3" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
            {/* Left submission list sidebar */}
            <div className="card" style={{ padding: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Submissions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {responses.map((resp, idx) => (
                  <button
                    key={resp._id}
                    onClick={() => setSelectedResponseIndex(idx)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      background: selectedResponseIndex === idx ? 'var(--primary-light)' : 'none',
                      border: '1px solid',
                      borderColor: selectedResponseIndex === idx ? 'var(--primary)' : 'var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontWeight: selectedResponseIndex === idx ? '600' : '500', fontSize: '0.875rem', color: selectedResponseIndex === idx ? 'var(--primary-hover)' : 'var(--text)' }}>
                      {resp.submittedBy?.name || 'Customer'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} />
                      {new Date(resp.createdAt).toLocaleDateString()} {new Date(resp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right response detail sheet */}
            {selectedResponse ? (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Submitter Metadata header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Submission details</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} />
                        {selectedResponse.submittedBy?.email || 'N/A'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {new Date(selectedResponse.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className="badge badge-customer">Customer</span>
                </div>

                {/* Submissions QA List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {form.questions.map((question, index) => {
                    const ansVal = selectedResponse?.answers?.[question.id];
                    const isAnswered = ansVal !== undefined && ansVal !== null && ansVal !== '' && (!Array.isArray(ansVal) || ansVal.length > 0);

                    return (
                      <div key={question.id} style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                        <h4 style={{ fontSize: '0.925rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
                          <span style={{ color: 'var(--primary)', marginRight: '6px' }}>Q{index + 1}.</span>
                          {question.label}
                        </h4>
                        
                        {isAnswered ? (
                          (() => {
                            if (question.type === 'file') {
                              return (
                                <a
                                  href={ansVal}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-secondary"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                                >
                                  <FileText size={14} />
                                  <span>View Attached File</span>
                                </a>
                              );
                            }
                            if (Array.isArray(ansVal)) {
                              return (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                  {ansVal.map((v) => (
                                    <span key={v} className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', textTransform: 'none' }}>
                                      ✓ {v}
                                    </span>
                                  ))}
                                </div>
                              );
                            }
                            return (
                              <p style={{ fontSize: '0.875rem', background: 'var(--background)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)', wordBreak: 'break-all' }}>
                                {ansVal}
                              </p>
                            );
                          })()
                        ) : (
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Left blank
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </>
  );
}
