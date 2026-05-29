'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Search, UserPlus, ShieldAlert, Award, User, RefreshCw } from 'lucide-react';

export default function AdminEmployeesPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Direct creation form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/employees?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [search]);

  async function handleRoleChange(userId, currentRole) {
    const newRole = currentRole === 'customer' ? 'employee' : 'customer';
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update role');
      }
    } catch (err) {
      console.error('Role update failed', err);
    }
  }

  async function handleCreateEmployee(e) {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreating(true);

    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create employee');
      }

      setCreateSuccess('Employee created successfully!');
      setName('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Header />
      <main className="container" style={{ marginTop: '2rem', paddingBottom: '3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Manage Employees & Customers</h1>
          <p style={{ color: 'var(--text-muted)' }}>Search and manage company staff, or promote registered customers to employees.</p>
        </div>

        <div className="grid-3" style={{ gridTemplateColumns: '1fr 2fr' }}>
          {/* Add Employee Form */}
          <div>
            <div className="card">
              <h2 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} className="text-primary" />
                <span>Create Employee Directly</span>
              </h2>

              {createError && (
                <div style={{ padding: '0.5rem 0.75rem', background: 'var(--error-light)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={14} />
                  <span>{createError}</span>
                </div>
              )}

              {createSuccess && (
                <div style={{ padding: '0.5rem 0.75rem', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={14} />
                  <span>{createSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateEmployee}>
                <div className="form-group">
                  <label className="form-label" htmlFor="emp-name">Full Name</label>
                  <input
                    id="emp-name"
                    type="text"
                    className="form-input"
                    placeholder="Alice Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="emp-email">Email Address</label>
                  <input
                    id="emp-email"
                    type="email"
                    className="form-input"
                    placeholder="alice@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" htmlFor="emp-password">Password</label>
                  <input
                    id="emp-password"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Employee'}
                </button>
              </form>
            </div>
          </div>

          {/* Search & Promote Users */}
          <div>
            <div className="card" style={{ height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '600' }}>Directory Search & Promotion</h2>
                
                {/* Search input */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '32px', paddingTop: '0.45rem', paddingBottom: '0.45rem', fontSize: '0.875rem' }}
                    placeholder="Search name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem 0' }}>
                  <RefreshCw size={24} className="text-primary" style={{ animation: 'spin 1.5s linear infinite' }} />
                  <style jsx global>{`
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              ) : users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  <User size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.875rem' }}>No matching registered users found.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600', color: 'var(--text-muted)' }}>Name</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600', color: 'var(--text-muted)' }}>Email</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600', color: 'var(--text-muted)' }}>Role</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600', color: 'var(--text-muted)', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.875rem 0.5rem', fontWeight: '500' }}>{u.name}</td>
                          <td style={{ padding: '0.875rem 0.5rem', color: 'var(--text-muted)' }}>{u.email}</td>
                          <td style={{ padding: '0.875rem 0.5rem' }}>
                            <span className={`badge badge-${u.role}`}>{u.role}</span>
                          </td>
                          <td style={{ padding: '0.875rem 0.5rem', textAlign: 'right' }}>
                            {u.role === 'customer' ? (
                              <button
                                onClick={() => handleRoleChange(u._id, u.role)}
                                className="btn btn-secondary btn-sm"
                                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                              >
                                Promote to Employee
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRoleChange(u._id, u.role)}
                                className="btn btn-secondary btn-sm"
                                style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
                              >
                                Make Customer
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
