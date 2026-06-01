'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, CheckCircle, ArrowLeft, Users, FileQuestion, PlusCircle, Check } from 'lucide-react';

export default function FormBuilder({ formId = null }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allowedEmployees, setAllowedEmployees] = useState([]);
  const [loading, setLoading] = useState(!!formId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fileTypeInputs, setFileTypeInputs] = useState({});
  const activeSectionId = sections[0]?.id;

  // Fetch employees list
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch('/api/admin/employees');
        if (res.ok) {
          const data = await res.json();
          // Filter to only include actual employees
          const emps = data.users.filter((u) => u.role === 'employee');
          setEmployees(emps);
        }
      } catch (err) {
        console.error('Failed to fetch employees', err);
      }
    }
    fetchEmployees();
  }, []);

  // Fetch existing form data if editing
  useEffect(() => {
    if (!formId) return;

    async function fetchForm() {
      try {
        const res = await fetch(`/api/admin/forms/${formId}`);
        if (!res.ok) throw new Error('Form not found');
        const data = await res.json();
        
        setTitle(data.form.title);
        setDescription(data.form.description);
        // If form uses sections, load them. Otherwise wrap legacy questions into one section.
        const loadedSections = data.form.sections && data.form.sections.length > 0
          ? data.form.sections
          : [{ id: Date.now(), title: '', description: '', questions: data.form.questions || [] }];
        setSections(loadedSections);
        setAllowedEmployees(data.form.allowedEmployees.map(emp => emp._id || emp));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchForm();
  }, [formId]);

  // Sections & Question manipulation helpers
  function addSection() {
    const newSection = { id: Date.now(), title: '', description: '', questions: [] };
    setSections((prevSections) => [...prevSections, newSection]);
  }

  function removeSection(sectionId) {
    setSections((prevSections) => prevSections.filter(s => s.id !== sectionId));
  }

  function addQuestion(sectionId = activeSectionId) {
    const newQ = {
      id: 'q_' + Math.random().toString(36).substr(2, 9),
      type: 'text',
      label: '',
      required: false,
      options: ['Option 1'],
    };
    setSections((prevSections) => {
      if (!prevSections.length) {
        return [{ id: Date.now(), title: '', description: '', questions: [newQ] }];
      }
      return prevSections.map(s => (s.id === sectionId ? { ...s, questions: [...s.questions, newQ] } : s));
    });
  }

  function removeQuestion(sectionId = activeSectionId, qId) {
    setSections((prevSections) => prevSections.map(s => {
      if (s.id === sectionId) return { ...s, questions: s.questions.filter(q => q.id !== qId) };
      return s;
    }));
  }

  function updateQuestion(sectionId = activeSectionId, qId, field, value) {
    setSections((prevSections) => prevSections.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        questions: s.questions.map(q => {
          if (q.id !== qId) return q;
          const updated = { ...q, [field]: value };
          if (field === 'type' && ['text', 'integer', 'file'].includes(value)) updated.options = [];
          if (field === 'type' && value !== 'file') {
            delete updated.allowedFileTypes;
            delete updated.maxFileSize;
          }
          return updated;
        })
      };
    }));
  }

  // Option manipulation helpers (for dropdown, radio, checkbox)
  function addOption(sectionId = activeSectionId, qId) {
    setSections((prevSections) => prevSections.map(s => {
      if (s.id !== sectionId) return s;
      return { ...s, questions: s.questions.map(q => q.id === qId ? { ...q, options: [...(q.options||[]), `Option ${ (q.options||[]).length + 1}`] } : q) };
    }));
  }

  function removeOption(sectionId = activeSectionId, qId, indexToRemove) {
    setSections((prevSections) => prevSections.map(s => {
      if (s.id !== sectionId) return s;
      return { ...s, questions: s.questions.map(q => {
        if (q.id !== qId) return q;
        return { ...q, options: (q.options||[]).filter((_, idx) => idx !== indexToRemove) };
      }) };
    }));
  }

  function updateOption(sectionId = activeSectionId, qId, indexToUpdate, value) {
    setSections((prevSections) => prevSections.map(s => {
      if (s.id !== sectionId) return s;
      return { ...s, questions: s.questions.map(q => {
        if (q.id !== qId) return q;
        const newOptions = [...(q.options||[])];
        newOptions[indexToUpdate] = value;
        return { ...q, options: newOptions };
      }) };
    }));
  }

  // Employee access list toggle helper
  function toggleEmployeeAccess(empId) {
    if (allowedEmployees.includes(empId)) {
      setAllowedEmployees(allowedEmployees.filter((id) => id !== empId));
    } else {
      setAllowedEmployees([...allowedEmployees, empId]);
    }
  }

  // Form submission handler
  async function handleSaveForm(e) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Form title is required');
      return;
    }
    
    // Ensure at least one question across sections
    const totalQuestions = sections.reduce((acc, s) => acc + (s.questions?.length || 0), 0);
    if (totalQuestions === 0) {
      setError('Please add at least one question to the form');
      return;
    }

    // Check if any question has empty label
    const hasEmptyLabels = sections.some(s => s.questions.some(q => !q.label.trim()));
    if (hasEmptyLabels) {
      setError('All questions must have a question text/label');
      return;
    }

    setSaving(true);
    const url = formId ? `/api/admin/forms/${formId}` : '/api/admin/forms';
    const method = formId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          sections,
          allowedEmployees,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save form');
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '4rem' }}>
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/admin/dashboard" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
        
        <button
          onClick={handleSaveForm}
          className="btn btn-primary"
          style={{ minWidth: '120px' }}
          disabled={saving}
        >
          {saving ? 'Saving...' : formId ? 'Save Changes' : 'Create Form'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--error-light)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
        {/* Form Creator Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Metadata Card */}
          <div className="card" style={{ borderTop: '6px solid var(--primary)' }}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '1.6rem', fontWeight: '700', border: 'none', borderBottom: '1px solid var(--border)', borderRadius: 0, padding: '0.5rem 0', outline: 'none' }}
                placeholder="Untitled Form"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <textarea
                className="form-input"
                style={{ fontSize: '0.925rem', border: 'none', borderBottom: '1px solid var(--border)', borderRadius: 0, padding: '0.5rem 0', outline: 'none', resize: 'vertical', minHeight: '60px' }}
                placeholder="Form description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Dynamic Sections / Questions Canvas */}
          {sections.map((section, sectionIdx) => (
            <div key={section.id} className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontWeight: '600', fontSize: '1rem' }}
                  placeholder={`Section ${sectionIdx + 1} title`}
                  value={section.title}
                  onChange={(e) => setSections((prevSections) => prevSections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))}
                />

                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSection(section.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--error)', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Remove Section"
                  >
                    <Trash2 size={14} />
                    <span>Delete Section</span>
                  </button>
                )}
              </div>

              <textarea
                className="form-input"
                style={{ fontSize: '0.925rem', resize: 'vertical', minHeight: '56px' }}
                placeholder="Section description (optional)"
                value={section.description}
                onChange={(e) => setSections((prevSections) => prevSections.map(s => s.id === section.id ? { ...s, description: e.target.value } : s))}
              />

              {section.questions.map((question, qIdx) => (
                <div key={question.id} className="card" style={{ position: 'relative' }}>
                  <div className="grid-2" style={{ gridTemplateColumns: '3fr 1fr', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                {/* Question Text */}
                <input
                  type="text"
                  className="form-input"
                  style={{ fontWeight: '500', fontSize: '0.95rem' }}
                  placeholder={`Question ${qIdx + 1}`}
                  value={question.label}
                  onChange={(e) => updateQuestion(section.id, question.id, 'label', e.target.value)}
                />

                {/* Question Type Selection */}
                <select
                  className="form-input"
                  style={{ fontSize: '0.875rem', height: '40px', padding: '0 0.5rem' }}
                  value={question.type}
                  onChange={(e) => updateQuestion(section.id, question.id, 'type', e.target.value)}
                >
                  <option value="text">Text response</option>
                  <option value="integer">Integer number</option>
                  <option value="file">File Upload</option>
                  <option value="dropdown">Dropdown select</option>
                  <option value="radio">Multiple Choice (Radio)</option>
                  <option value="checkbox">Checkboxes</option>
                </select>
              </div>

              {/* File Type Specific Options */}
              {question.type === 'file' && (
                <div style={{ marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Allowed File Types (comma-separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., pdf, png, docx, all"
                      value={fileTypeInputs[question.id] ?? (question.allowedFileTypes || []).join(', ')}
                      onChange={(e) => {
                        setFileTypeInputs(prev => ({ ...prev, [question.id]: e.target.value }));
                      }}
                      onBlur={(e) => {
                        updateQuestion(section.id, question.id, 'allowedFileTypes', e.target.value.split(',').map(ext => ext.trim()).filter(Boolean));
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Max File Size (MB)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g., 10"
                      value={question.maxFileSize || ''}
                      onChange={(e) => updateQuestion(section.id, question.id, 'maxFileSize', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              )}

              {/* Options Section (If dynamic type) */}
              {['dropdown', 'radio', 'checkbox'].includes(question.type) && (
                <div style={{ marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
                  {question.options.map((option, oIdx) => (
                    <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {question.type === 'radio' && '○'}
                        {question.type === 'checkbox' && '□'}
                        {question.type === 'dropdown' && `${oIdx + 1}.`}
                      </span>
                      
                      <input
                        type="text"
                        className="form-input"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.875rem', width: 'auto', flex: 1 }}
                        value={option}
                        onChange={(e) => updateOption(section.id, question.id, oIdx, e.target.value)}
                        placeholder={`Option ${oIdx + 1}`}
                      />

                      {question.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOption(section.id, question.id, oIdx)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem', border: 'none', color: 'var(--error)' }}
                          title="Remove Option"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addOption(section.id, question.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ alignSelf: 'start', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.8rem', padding: '4px 8px' }}
                  >
                    <PlusCircle size={12} />
                    <span>Add Option</span>
                  </button>
                </div>
              )}

              {/* Bottom Actions Card (Required toggle & delete question) */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => updateQuestion(section.id, question.id, 'required', e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Required field</span>
                </label>

                <div style={{ width: '1px', height: '16px', background: 'var(--border)' }}></div>

                <button
                  type="button"
                  onClick={() => removeQuestion(section.id, question.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--error)', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  title="Remove Question"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
              ))}

              <button
                type="button"
                onClick={() => addQuestion(section.id)}
                className="btn btn-secondary"
                style={{ borderStyle: 'dashed', borderWidth: '2px', display: 'flex', alignItems: 'center', gap: '8px', padding: '1rem' }}
              >
                <Plus size={18} />
                <span>Add Question</span>
              </button>
            </div>
          ))}

          {/* Add Section Button */}
          <button
            type="button"
            onClick={addSection}
            className="btn btn-secondary"
            style={{ borderStyle: 'dashed', borderWidth: '2px', display: 'flex', alignItems: 'center', gap: '8px', padding: '1rem' }}
          >
            <Plus size={18} />
            <span>Add Section</span>
          </button>
        </div>

        {/* Sidebar: Access Rights */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} className="text-primary" />
              <span>Response Access</span>
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Select which employees are authorized to view and download this form&apos;s submissions. Admins always have access.
            </p>

            {employees.length === 0 ? (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                No employees registered yet. Promote customers to employees in the Directory first!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                {employees.map((emp) => {
                  const isChecked = allowedEmployees.includes(emp._id);
                  return (
                    <label
                      key={emp._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        background: isChecked ? 'var(--primary-light)' : 'none',
                        borderColor: isChecked ? 'var(--primary)' : 'var(--border)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '8px' }}>
                        <span style={{ fontWeight: '600' }}>{emp.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{emp.email}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEmployeeAccess(emp._id)}
                        style={{ display: 'none' }}
                      />
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          border: '2px solid var(--border)',
                          borderColor: isChecked ? 'var(--primary)' : 'var(--border)',
                          borderRadius: '4px',
                          background: isChecked ? 'var(--primary)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                        }}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}