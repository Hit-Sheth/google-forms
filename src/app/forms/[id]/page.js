'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, RefreshCw, AlertCircle, UploadCloud, File as FileIcon } from 'lucide-react';

export default function FillFormPage({ params }) {
  // `params` can be a Promise in some Next.js configurations. Safely unwrap it.
  const [id, setId] = useState(null);
  useEffect(() => {
    let mounted = true;
    async function resolveParams() {
      try {
        const p = typeof params?.then === 'function' ? await params : params;
        if (mounted && p) setId(p.id);
      } catch (e) {
        // noop
      }
    }
    resolveParams();
    return () => { mounted = false; };
  }, [params]);
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [files, setFiles] = useState({}); // To hold file objects
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    async function fetchForm() {
      try {
        const res = await fetch(`/api/forms/${id}`);
        if (!res.ok) {
          throw new Error('Form not found or access denied');
        }
        const data = await res.json();
        setForm(data.form);
        
        const initialAnswers = {};
        data.form.questions.forEach((q) => {
          if (q.type === 'checkbox') {
            initialAnswers[q.id] = [];
          } else if (q.type === 'file') {
            initialAnswers[q.id] = null; // For file URLs
          } else {
            initialAnswers[q.id] = '';
          }
        });
        setAnswers(initialAnswers);
      } catch (err) {
        setServerError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchForm();
    }
  }, [id]);

  function handleInputChange(qId, value) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    if (errors[qId]) {
      setErrors((prev) => ({ ...prev, [qId]: '' }));
    }
  }

  function handleFileChange(qId, file, question) {
    if (!file) {
      return; // User cancelled file selection
    }
    setErrors((prev) => ({ ...prev, [qId]: '' }));

    const maxFileSize = (question.maxFileSize || 10) * 1024 * 1024; // in bytes
    if (file.size > maxFileSize) {
      setErrors((prev) => ({ ...prev, [qId]: `File size cannot exceed ${question.maxFileSize || 10}MB.` }));
      return;
    }

    const allowedFileTypes = question.allowedFileTypes || [];
    if (allowedFileTypes.length > 0 && !allowedFileTypes.includes('all')) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!allowedFileTypes.includes(fileExtension)) {
        setErrors((prev) => ({ ...prev, [qId]: `Invalid file type. Allowed types: ${allowedFileTypes.join(', ')}.` }));
        return;
      }
    }

    setFiles((prev) => ({ ...prev, [qId]: file }));
  }

  function handleCheckboxChange(qId, optionVal, checked) {
    const currentVals = answers[qId] || [];
    const newVal = checked ? [...currentVals, optionVal] : currentVals.filter((v) => v !== optionVal);
    handleInputChange(qId, newVal);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setServerError('');
    setSubmitting(true);

    // --- Client-side validation ---
    const validationErrors = {};
    for (const q of form.questions) {
      const val = answers[q.id];
      const file = files[q.id];

      if (q.required) {
        let isMissing = false;
        if (q.type === 'file') {
          if (!file) isMissing = true;
        } else if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          isMissing = true;
        }
        if (isMissing) {
          validationErrors[q.id] = 'This question is required';
        }
      }

      if (q.type === 'integer' && val) {
        const parsed = parseInt(val, 10);
        if (isNaN(parsed) || String(parsed) !== String(val).trim()) {
          validationErrors[q.id] = 'Please enter a valid whole number';
        }
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrId = Object.keys(validationErrors)[0];
      document.getElementById(firstErrId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSubmitting(false);
      return;
    }

    // --- File Uploading ---
    const uploadedFileUrls = { ...answers };
    for (const qId in files) {
      const file = files[qId];
      if (file) {
        try {
          const question = form.questions.find(q => q.id === qId);
          const formData = new FormData();
          formData.append('file', file);
          if (question.allowedFileTypes?.length > 0) {
            formData.append('allowedFileTypes', question.allowedFileTypes.join(','));
          }
          if (question.maxFileSize) {
            formData.append('maxFileSize', question.maxFileSize);
          }
          
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'File upload failed');
          }
          uploadedFileUrls[qId] = data.url; // Store the URL
        } catch (err) {
          setServerError(`Error uploading file for question: ${form.questions.find(q=>q.id === qId)?.label}. ${err.message}`);
          setSubmitting(false);
          return;
        }
      }
    }

    // --- Form Submission ---
    try {
      const res = await fetch(`/api/forms/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: uploadedFileUrls }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.validationErrors) {
          setErrors(data.validationErrors);
          throw new Error('Validation failed on the server.');
        }
        throw new Error(data.error || 'Failed to submit form');
      }

      setSuccess(true);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
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

  if (serverError && !form) {
    return (
      <>
        <Header />
        <main className="container" style={{ marginTop: '3rem', textAlign: 'center' }}>
          <div className="card" style={{ maxWidth: '480px', margin: '0 auto', padding: '3rem 2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--error)', marginBottom: '8px' }}>Access Restricted</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {serverError === 'Only customers can access and fill forms' 
                ? 'Only registered Customers are allowed to fill out and submit company forms.' 
                : 'Form does not exist or has been deactivated.'}
            </p>
            <Link href="/customer/dashboard" className="btn btn-primary">
              Return to Dashboard
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container" style={{ marginTop: '2rem', paddingBottom: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '640px' }}>
          <Link
            href="/customer/dashboard"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '1.5rem', alignSelf: 'flex-start' }}
          >
            <ArrowLeft size={16} />
            <span>Customer Portal</span>
          </Link>

          {success ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', borderTop: '6px solid var(--success)' }}>
              <div style={{ color: 'var(--success)', display: 'inline-flex', marginBottom: '1rem' }}>
                <CheckCircle size={48} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text)' }}>Submission Received!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
                Your responses for <strong>{form.title}</strong> have been recorded successfully. Thank you for your feedback!
              </p>
              <Link href="/customer/dashboard" className="btn btn-primary">
                Return to Portal
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ borderTop: '8px solid var(--primary)', borderRadius: 'var(--radius-md)' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>{form.title}</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{form.description || 'No description provided.'}</p>
                <div style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '1rem', fontWeight: '500' }}>
                  * Required field
                </div>
              </div>

              {serverError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', background: 'var(--error-light)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                  <AlertCircle size={16} />
                  <span>{serverError}</span>
                </div>
              )}

              {form.questions.map((question) => {
                const error = errors[question.id];
                return (
                  <div
                    key={question.id}
                    id={question.id}
                    className="card"
                    style={{
                      borderLeft: error ? '4px solid var(--error)' : '1px solid var(--border)',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    <label className="form-label" style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'block' }}>
                      {question.label}
                      {question.required && <span style={{ color: 'var(--error)', marginLeft: '4px' }}>*</span>}
                    </label>

                    {question.type === 'text' && (
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Your answer"
                        value={answers[question.id] || ''}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                      />
                    )}

                    {question.type === 'integer' && (
                      <input
                        type="number"
                        step="1"
                        className="form-input"
                        placeholder="Enter whole number"
                        value={answers[question.id] || ''}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                      />
                    )}

                    {question.type === 'file' && (
                      <div>
                        <label htmlFor={`file-upload-${question.id}`} className="form-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', background: files[question.id] ? 'var(--primary-light)' : '#fff' }}>
                          <UploadCloud size={18} className="text-primary" />
                          <span>{files[question.id] ? 'File Selected' : 'Upload a file'}</span>
                        </label>
                        <input
                          id={`file-upload-${question.id}`}
                          type="file"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileChange(question.id, e.target.files[0], question)}
                          accept={(question.allowedFileTypes || []).map(ext => `.${ext}`).join(',')}
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                          Max size: {question.maxFileSize || 10}MB. 
                          {question.allowedFileTypes?.length > 0 && ` Allowed types: ${question.allowedFileTypes.join(', ')}.`}
                        </div>
                        {files[question.id] && !errors[question.id] && (
                          <div style={{ marginTop: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                            <FileIcon size={14} />
                            <span>{files[question.id].name} ({(files[question.id].size / 1024).toFixed(1)} KB)</span>
                          </div>
                        )}
                      </div>
                    )}

                    {question.type === 'dropdown' && (
                      <select
                        className="form-input"
                        value={answers[question.id] || ''}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                      >
                        <option value="">Choose option</option>
                        {question.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {question.type === 'radio' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {question.options.map((opt) => {
                          const isSelected = answers[question.id] === opt;
                          return (
                            <label
                              key={opt}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                padding: '6px 10px',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                background: isSelected ? 'var(--primary-light)' : 'none',
                                borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                              }}
                            >
                              <input
                                type="radio"
                                name={question.id}
                                value={opt}
                                checked={isSelected}
                                onChange={() => handleInputChange(question.id, opt)}
                                style={{ cursor: 'pointer' }}
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {question.type === 'checkbox' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {question.options.map((opt) => {
                          const isChecked = (answers[question.id] || []).includes(opt);
                          return (
                            <label
                              key={opt}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                padding: '6px 10px',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                background: isChecked ? 'var(--primary-light)' : 'none',
                                borderColor: isChecked ? 'var(--primary)' : 'var(--border)',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleCheckboxChange(question.id, opt, e.target.checked)}
                                style={{ cursor: 'pointer' }}
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {error && (
                      <div className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontWeight: '500' }}>
                        <AlertCircle size={12} />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start', padding: '0.625rem 2rem', fontSize: '0.95rem', minWidth: '120px' }}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Answers'}
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}