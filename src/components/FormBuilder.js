'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Trash2, ArrowLeft, Users, PlusCircle, Check,
  GripVertical, Settings, LayoutList, ChevronDown, ChevronUp
} from 'lucide-react';

export default function FormBuilder({ formId = null, isEmployee = false }) {
  // ... rest of code
  const router = useRouter();

  // Tabs & Core Metadata
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'settings'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState([]);

  // NEW: Form Settings & Theme
  const [settings, setSettings] = useState({
    isAcceptingResponses: true,
    limitOnePerCustomer: false,
    confirmationMessage: 'Your response has been recorded.',
    showProgressBar: true,
    startDate: '',
    endDate: ''
  });

  const [theme, setTheme] = useState({
    headerImage: '',
    primaryColor: '#6366f1',
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter, sans-serif'
  });

  // NEW: Granular Permissions
  const [defaultPerms, setDefaultPerms] = useState({
    canSubmit: false,
    canViewOwn: true,
    canViewAll: false,
    canEditForm: false,
  });

  const [employees, setEmployees] = useState([]);
  const [allowedEmployees, setAllowedEmployees] = useState([]); // Array of { user: ID, permissions: {} }
  const [expandedEmpId, setExpandedEmpId] = useState(null); // For toggling the permissions UI
  const [showDefaultPerms, setShowDefaultPerms] = useState(false);

  // System State
  const [loading, setLoading] = useState(!!formId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fileTypeInputs, setFileTypeInputs] = useState({});
  const activeSectionId = sections[0]?.id;

  // Drag and Drop State
  const [draggingQuestion, setDraggingQuestion] = useState(null);
  const [dragOverZone, setDragOverZone] = useState(null);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch('/api/admin/employees');
        if (res.ok) {
          const data = await res.json();
          setEmployees(data.users.filter((u) => u.role === 'employee'));
        }
      } catch (err) {
        console.error('Failed to fetch employees', err);
      }
    }
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!formId) return;
    async function fetchForm() {
      try {
        const res = await fetch(`/api/admin/forms/${formId}`);
        if (!res.ok) throw new Error('Form not found');
        const data = await res.json();
        const f = data.form;

        setTitle(f.title);
        setDescription(f.description);

        const loadedSections = f.sections && f.sections.length > 0
          ? f.sections
          : [{ id: Date.now(), title: '', description: '', questions: f.questions || [] }];
        setSections(loadedSections);

        if (f.settings) setSettings(f.settings);
        if (f.theme) setTheme(f.theme);
        if (f.defaultEmployeePermissions) setDefaultPerms(f.defaultEmployeePermissions);

        // Map allowedEmployees to handle populated vs unpopulated IDs
        if (f.allowedEmployees) {
          setAllowedEmployees(f.allowedEmployees.map(ae => ({
            user: ae.user?._id || ae.user,
            permissions: ae.permissions || defaultPerms
          })));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchForm();
  }, [formId]);

  // --- Drag & Drop Helpers ---
  function handleDragStart(e, sectionId, qIdx) {
    setDraggingQuestion({ sectionId, qIdx });
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    }
  }

  function handleDragEnd() {
    setDraggingQuestion(null);
    setDragOverZone(null);
  }

  function handleDrop(e, targetSectionId, targetQIdx) {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingQuestion) return;

    const { sectionId: sourceSectionId, qIdx: sourceQIdx } = draggingQuestion;
    if (sourceSectionId === targetSectionId && sourceQIdx === targetQIdx) {
      handleDragEnd();
      return;
    }

    setSections((prevSections) => {
      const newSections = JSON.parse(JSON.stringify(prevSections));
      const sourceSectionIndex = newSections.findIndex(s => s.id === sourceSectionId);
      const targetSectionIndex = newSections.findIndex(s => s.id === targetSectionId);

      const [movedItem] = newSections[sourceSectionIndex].questions.splice(sourceQIdx, 1);

      let insertIdx = targetQIdx;
      if (sourceSectionId === targetSectionId && sourceQIdx < targetQIdx) {
        insertIdx -= 1;
      }

      newSections[targetSectionIndex].questions.splice(insertIdx, 0, movedItem);
      return newSections;
    });
    handleDragEnd();
  }

  function renderDropZone(sectionId, index) {
    const zoneId = `s${sectionId}-q${index}`;
    const isOver = dragOverZone === zoneId;
    if (!draggingQuestion) return <div style={{ height: '12px' }} />;
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverZone(zoneId); }}
        onDragLeave={() => setDragOverZone(null)}
        onDrop={(e) => handleDrop(e, sectionId, index)}
        style={{
          height: isOver ? '48px' : '16px',
          background: isOver ? 'var(--primary-light)' : 'transparent',
          border: isOver ? '2px dashed var(--primary)' : 'none',
          borderRadius: 'var(--radius-md)',
          transition: 'all 0.2s ease',
          margin: '-4px 0',
          position: 'relative',
          zIndex: 10,
        }}
      />
    );
  }

  // --- Section & Question Helpers ---
  function addSection() {
    setSections((prev) => [...prev, { id: Date.now(), title: '', description: '', questions: [] }]);
  }
  function removeSection(sectionId) {
    setSections((prev) => prev.filter(s => s.id !== sectionId));
  }
  function addQuestion(sectionId = activeSectionId) {
    const newQ = { id: 'q_' + Math.random().toString(36).substr(2, 9), type: 'text', label: '', required: false, options: ['Option 1'] };
    setSections((prev) => prev.length ? prev.map(s => (s.id === sectionId ? { ...s, questions: [...s.questions, newQ] } : s)) : [{ id: Date.now(), title: '', description: '', questions: [newQ] }]);
  }
  function removeQuestion(sectionId, qId) {
    setSections((prev) => prev.map(s => (s.id === sectionId ? { ...s, questions: s.questions.filter(q => q.id !== qId) } : s)));
  }
  function updateQuestion(sectionId, qId, field, value) {
    setSections((prev) => prev.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s, questions: s.questions.map(q => {
          if (q.id !== qId) return q;
          const updated = { ...q, [field]: value };
          if (field === 'type' && ['text', 'integer', 'file'].includes(value)) updated.options = [];
          if (field === 'type' && value !== 'file') { delete updated.allowedFileTypes; delete updated.maxFileSize; }
          return updated;
        })
      };
    }));
  }
  function addOption(sectionId, qId) {
    setSections((prev) => prev.map(s => s.id === sectionId ? { ...s, questions: s.questions.map(q => q.id === qId ? { ...q, options: [...(q.options || []), `Option ${(q.options || []).length + 1}`] } : q) } : s));
  }
  function removeOption(sectionId, qId, indexToRemove) {
    setSections((prev) => prev.map(s => s.id === sectionId ? { ...s, questions: s.questions.map(q => q.id === qId ? { ...q, options: (q.options || []).filter((_, idx) => idx !== indexToRemove) } : q) } : s));
  }
  function updateOption(sectionId, qId, indexToUpdate, value) {
    setSections((prev) => prev.map(s => s.id === sectionId ? {
      ...s, questions: s.questions.map(q => {
        if (q.id !== qId) return q;
        const newOptions = [...(q.options || [])];
        newOptions[indexToUpdate] = value;
        return { ...q, options: newOptions };
      })
    } : s));
  }

  // --- Permission Helpers ---
  function toggleEmployeeAccess(empId) {
    setAllowedEmployees(prev => {
      const exists = prev.find(p => p.user === empId);
      if (exists) return prev.filter(p => p.user !== empId);
      // When adding, apply the CURRENT default permissions template
      return [...prev, { user: empId, permissions: { ...defaultPerms } }];
    });
  }

  function updateEmpPermission(empId, permKey, value) {
    setAllowedEmployees(prev => prev.map(emp => {
      if (emp.user === empId) {
        return { ...emp, permissions: { ...emp.permissions, [permKey]: value } };
      }
      return emp;
    }));
  }

  // --- Save Logic ---
  async function handleSaveForm(e) {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('Form title is required');
    const totalQuestions = sections.reduce((acc, s) => acc + (s.questions?.length || 0), 0);
    if (totalQuestions === 0) return setError('Please add at least one question to the form');
    const hasEmptyLabels = sections.some(s => s.questions.some(q => !q.label.trim()));
    if (hasEmptyLabels) return setError('All questions must have a question text/label');

    setSaving(true);
    const url = formId ? `/api/admin/forms/${formId}` : '/api/admin/forms';
    const method = formId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, sections, settings, theme,
          defaultEmployeePermissions: defaultPerms,
          allowedEmployees
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save form');
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '4rem' }}>

      {/* Top Action Bar & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/admin/dashboard" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </Link>

          <div style={{ display: 'flex', background: 'var(--border)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
            <button
              onClick={() => setActiveTab('questions')}
              className={`btn btn-sm ${activeTab === 'questions' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LayoutList size={14} /> Questions
            </button>

            {/* ONLY ADMINS SEE THIS BUTTON */}
            {!isEmployee && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`btn btn-sm ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Settings size={14} /> Settings & Theme
              </button>
            )}
          </div>
        </div>

        <button onClick={handleSaveForm} className="btn btn-primary" style={{ minWidth: '120px' }} disabled={saving}>
          {saving ? 'Saving...' : formId ? 'Save Changes' : 'Create Form'}
        </button>
      </div>

      {error && <div style={{ padding: '0.75rem 1rem', background: 'var(--error-light)', color: 'var(--error)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}

      <div className="grid-3" style={{ gridTemplateColumns: isEmployee ? '1fr' : '2fr 1fr', alignItems: 'start', maxWidth: isEmployee ? '800px' : 'none', margin: isEmployee ? '0 auto' : '0' }}>

        {/* LEFT CANVAS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {activeTab === 'questions' ? (
            <>
              {/* Form Header Metadata */}
              <div className="card" style={{ borderTop: `6px solid ${theme.primaryColor || 'var(--primary)'}` }}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <input
                    type="text" className="form-input"
                    style={{ fontSize: '1.6rem', fontWeight: '700', border: 'none', borderBottom: '1px solid var(--border)', borderRadius: 0, padding: '0.5rem 0', outline: 'none' }}
                    placeholder="Untitled Form" value={title} onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <textarea
                    className="form-input"
                    style={{ fontSize: '0.925rem', border: 'none', borderBottom: '1px solid var(--border)', borderRadius: 0, padding: '0.5rem 0', outline: 'none', resize: 'vertical', minHeight: '60px' }}
                    placeholder="Form description (optional)" value={description} onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Sections & Questions */}
              {sections.map((section, sectionIdx) => (
                <div key={section.id} className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="text" className="form-input" style={{ fontWeight: '600', fontSize: '1rem' }}
                      placeholder={`Section ${sectionIdx + 1} title`} value={section.title}
                      onChange={(e) => setSections((prev) => prev.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))}
                    />
                    {sections.length > 1 && (
                      <button type="button" onClick={() => removeSection(section.id)} className="btn btn-secondary btn-sm" style={{ color: 'var(--error)', border: 'none' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <textarea
                    className="form-input" style={{ fontSize: '0.925rem', resize: 'vertical', minHeight: '56px' }}
                    placeholder="Section description (optional)" value={section.description}
                    onChange={(e) => setSections((prev) => prev.map(s => s.id === section.id ? { ...s, description: e.target.value } : s))}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {renderDropZone(section.id, 0)}
                    {section.questions.map((question, qIdx) => {
                      const isDraggingThis = draggingQuestion?.sectionId === section.id && draggingQuestion?.qIdx === qIdx;
                      return (
                        <div key={question.id}>
                          <div
                            draggable onDragStart={(e) => handleDragStart(e, section.id, qIdx)} onDragEnd={handleDragEnd}
                            className="card"
                            style={{
                              opacity: isDraggingThis ? 0.4 : 1, transform: isDraggingThis ? 'scale(0.98)' : 'scale(1)',
                              border: isDraggingThis ? `1px dashed ${theme.primaryColor || 'var(--primary)'}` : undefined,
                              transition: 'opacity 0.2s, transform 0.2s', cursor: 'grab'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'center', margin: '-1rem -1.5rem 1rem -1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                              <GripVertical size={20} />
                            </div>

                            <div className="grid-2" style={{ gridTemplateColumns: '3fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                              <input
                                type="text" className="form-input" style={{ fontWeight: '500' }}
                                placeholder={`Question ${qIdx + 1}`} value={question.label}
                                onChange={(e) => updateQuestion(section.id, question.id, 'label', e.target.value)}
                              />
                              <select
                                className="form-input" style={{ height: '40px' }} value={question.type}
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

                            {question.type === 'file' && (
                              <div style={{ marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div className="form-group">
                                  <label className="form-label">Allowed File Types</label>
                                  <input type="text" className="form-input" placeholder="pdf, png, docx" value={fileTypeInputs[question.id] ?? (question.allowedFileTypes || []).join(', ')} onChange={(e) => setFileTypeInputs(prev => ({ ...prev, [question.id]: e.target.value }))} onBlur={(e) => updateQuestion(section.id, question.id, 'allowedFileTypes', e.target.value.split(',').map(ext => ext.trim()).filter(Boolean))} />
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Max File Size (MB)</label>
                                  <input type="number" className="form-input" value={question.maxFileSize || ''} onChange={(e) => updateQuestion(section.id, question.id, 'maxFileSize', e.target.value ? Number(e.target.value) : undefined)} />
                                </div>
                              </div>
                            )}

                            {['dropdown', 'radio', 'checkbox'].includes(question.type) && (
                              <div style={{ marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
                                {question.options.map((option, oIdx) => (
                                  <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{question.type === 'dropdown' ? `${oIdx + 1}.` : question.type === 'radio' ? '○' : '□'}</span>
                                    <input type="text" className="form-input" style={{ width: 'auto', flex: 1 }} value={option} onChange={(e) => updateOption(section.id, question.id, oIdx, e.target.value)} />
                                    {question.options.length > 1 && (
                                      <button type="button" onClick={() => removeOption(section.id, question.id, oIdx)} className="btn btn-secondary btn-sm" style={{ color: 'var(--error)' }}><Trash2 size={14} /></button>
                                    )}
                                  </div>
                                ))}
                                <button type="button" onClick={() => addOption(section.id, question.id)} className="btn btn-secondary btn-sm" style={{ alignSelf: 'start', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                  <PlusCircle size={12} /> Add Option
                                </button>
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={question.required} onChange={(e) => updateQuestion(section.id, question.id, 'required', e.target.checked)} />
                                <span>Required field</span>
                              </label>
                              <button type="button" onClick={() => removeQuestion(section.id, question.id)} className="btn btn-secondary btn-sm" style={{ color: 'var(--error)', border: 'none' }}><Trash2 size={14} /> Delete</button>
                            </div>
                          </div>
                          {renderDropZone(section.id, qIdx + 1)}
                        </div>
                      );
                    })}
                  </div>

                  <button type="button" onClick={() => addQuestion(section.id)} className="btn btn-secondary" style={{ borderStyle: 'dashed', borderWidth: '2px', display: 'flex', alignItems: 'center', gap: '8px', padding: '1rem' }}>
                    <Plus size={18} /> Add Question
                  </button>
                </div>
              ))}

              <button type="button" onClick={addSection} className="btn btn-secondary" style={{ borderStyle: 'dashed', borderWidth: '2px', display: 'flex', alignItems: 'center', gap: '8px', padding: '1rem' }}>
                <Plus size={18} /> Add Section
              </button>
            </>
          ) : (
            /* --- SETTINGS & THEME TAB --- */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              <div className="card">
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.25rem' }}>Form Behavior</h3>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>Accepting Responses</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Allow customers to fill out this form</div>
                  </div>
                  <input type="checkbox" checked={settings.isAcceptingResponses} onChange={(e) => setSettings(s => ({ ...s, isAcceptingResponses: e.target.checked }))} style={{ transform: 'scale(1.2)' }} />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>Limit to 1 response</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Customers can only submit once</div>
                  </div>
                  <input type="checkbox" checked={settings.limitOnePerCustomer} onChange={(e) => setSettings(s => ({ ...s, limitOnePerCustomer: e.target.checked }))} style={{ transform: 'scale(1.2)' }} />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>Show Progress Bar</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Helpful for multi-section forms</div>
                  </div>
                  <input type="checkbox" checked={settings.showProgressBar} onChange={(e) => setSettings(s => ({ ...s, showProgressBar: e.target.checked }))} style={{ transform: 'scale(1.2)' }} />
                </label>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Confirmation Message</label>
                  <textarea className="form-input" value={settings.confirmationMessage} onChange={(e) => setSettings(s => ({ ...s, confirmationMessage: e.target.value }))} rows={2} />
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.25rem' }}>Visual Theme</h3>

                <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Primary Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="color" value={theme.primaryColor} onChange={(e) => setTheme(t => ({ ...t, primaryColor: e.target.value }))} style={{ height: '40px', width: '40px', padding: 0, border: 'none', borderRadius: '4px' }} />
                      <input type="text" className="form-input" value={theme.primaryColor} onChange={(e) => setTheme(t => ({ ...t, primaryColor: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Background Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="color" value={theme.backgroundColor} onChange={(e) => setTheme(t => ({ ...t, backgroundColor: e.target.value }))} style={{ height: '40px', width: '40px', padding: 0, border: 'none', borderRadius: '4px' }} />
                      <input type="text" className="form-input" value={theme.backgroundColor} onChange={(e) => setTheme(t => ({ ...t, backgroundColor: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Typography</label>
                  <select className="form-input" value={theme.fontFamily} onChange={(e) => setTheme(t => ({ ...t, fontFamily: e.target.value }))}>
                    <option value="Inter, sans-serif">Modern (Inter)</option>
                    <option value="serif">Classic (Serif)</option>
                    <option value="monospace">Technical (Monospace)</option>
                    <option value="'Comic Sans MS', cursive">Playful</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Header Image URL (Optional)</label>
                  <input type="text" className="form-input" placeholder="https://example.com/banner.jpg" value={theme.headerImage} onChange={(e) => setTheme(t => ({ ...t, headerImage: e.target.value }))} />
                </div>
              </div>

            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: Permissions Matrix */}
        {!isEmployee && (
          <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Default Template Box */}
            <div className="card" style={{ border: '1px solid var(--primary-light)', background: 'var(--background)' }}>
              <button
                onClick={() => setShowDefaultPerms(!showDefaultPerms)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600' }}
              >
                <span>Form Default Permissions</span>
                {showDefaultPerms ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showDefaultPerms && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Applied to employees when first added:</p>
                  {Object.keys(defaultPerms).map((permKey) => (
                    <label key={permKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={defaultPerms[permKey]} onChange={(e) => setDefaultPerms(p => ({ ...p, [permKey]: e.target.checked }))} />
                      <span style={{ textTransform: 'capitalize' }}>{permKey.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} className="text-primary" />
                <span>Employee Roster</span>
              </h3>

              {employees.length === 0 ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>No employees found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                  {employees.map((emp) => {
                    const empRecord = allowedEmployees.find(p => p.user === emp._id);
                    const isChecked = !!empRecord;
                    const isExpanded = expandedEmpId === emp._id;

                    return (
                      <div key={emp._id} style={{ border: '1px solid', borderColor: isChecked ? 'var(--primary)' : 'var(--border)', borderRadius: 'var(--radius-sm)', background: isChecked ? 'var(--primary-light)' : 'none', overflow: 'hidden' }}>

                        {/* Top Row: User Select */}
                        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
                          <label style={{ display: 'flex', flex: 1, alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
                            <input type="checkbox" checked={isChecked} onChange={() => toggleEmployeeAccess(emp._id)} style={{ display: 'none' }} />
                            <div style={{ width: '18px', height: '18px', border: '2px solid', borderColor: isChecked ? 'var(--primary)' : 'var(--border)', borderRadius: '4px', background: isChecked ? 'var(--primary)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{emp.name}</span>
                            </div>
                          </label>

                          {/* Expand settings if selected */}
                          {isChecked && (
                            <button onClick={() => setExpandedEmpId(isExpanded ? null : emp._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}>
                              {isExpanded ? <ChevronUp size={16} /> : <Settings size={14} />}
                            </button>
                          )}
                        </div>

                        {/* Expanded Granular Permissions Panel */}
                        {isChecked && isExpanded && empRecord && (
                          <div style={{ padding: '12px', background: 'var(--background)', borderTop: '1px solid var(--border)', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Object.keys(empRecord.permissions || {}).map((permKey) => (
                              <label key={permKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={!!empRecord.permissions?.[permKey]} onChange={(e) => updateEmpPermission(emp._id, permKey, e.target.checked)} />
                                <span style={{ textTransform: 'capitalize' }}>{permKey.replace(/([A-Z])/g, ' $1')}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}