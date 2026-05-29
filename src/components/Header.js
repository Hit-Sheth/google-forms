'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, FormInput, Users, FileText, User } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        } else {
          // If not authenticated, let middleware handle redirect if needed,
          // or locally redirect to login
        }
      } catch (err) {
        console.error('Failed to load user', err);
      }
    }
    fetchUser();
  }, []);

  async function handleLogout() {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed', err);
    }
  }

  if (!currentUser) {
    return (
      <header className="header">
        <div className="container header-container">
          <div className="logo-group">
            <FormInput size={24} />
            <span>FormCreator</span>
          </div>
        </div>
      </header>
    );
  }

  const role = currentUser.role;

  return (
    <header className="header">
      <div className="container header-container">
        <div className="logo-group">
          <FormInput size={24} />
          <span>FormCreator</span>
        </div>

        <nav className="nav-links">
          {role === 'admin' && (
            <>
              <Link
                href="/admin/dashboard"
                className={`nav-link ${pathname === '/admin/dashboard' ? 'nav-link-active' : ''}`}
              >
                Forms
              </Link>
              <Link
                href="/admin/employees"
                className={`nav-link ${pathname === '/admin/employees' ? 'nav-link-active' : ''}`}
              >
                Employees
              </Link>
            </>
          )}

          {role === 'employee' && (
            <Link
              href="/employee/dashboard"
              className={`nav-link ${pathname === '/employee/dashboard' ? 'nav-link-active' : ''}`}
            >
              Assigned Forms
            </Link>
          )}

          {role === 'customer' && (
            <Link
              href="/customer/dashboard"
              className={`nav-link ${pathname === '/customer/dashboard' ? 'nav-link-active' : ''}`}
            >
              My Forms
            </Link>
          )}
        </nav>

        <div className="user-profile">
          <span className={`badge badge-${role}`}>{role}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: '500' }}>
            <User size={16} className="text-muted" />
            <span>{currentUser.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Log Out"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
