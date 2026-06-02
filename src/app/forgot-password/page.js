'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, KeyRound, ShieldCheck, AlertCircle, CheckCircle, Lock } from 'lucide-react';

export default function ForgotPasswordPage() {
  // States
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Enter OTP & New Password
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // STEP 1: Request OTP
  async function handleRequestOTP(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Reusing your existing send-otp route!
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'reset_password' }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset code');
      }

      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // STEP 2: Verify OTP and Reset Password
  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '12px', borderRadius: 'var(--radius-md)', display: 'inline-flex' }}>
            {step === 1 ? <Lock size={32} /> : <ShieldCheck size={32} />}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            {step === 1 ? 'Reset Password' : 'Enter Reset Code'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {step === 1 ? "Enter your email and we'll send you a code" : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ color: 'var(--success)', display: 'inline-flex', marginBottom: '1rem' }}>
              <CheckCircle size={48} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Password Updated!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Link href="/login" className="btn btn-primary" style={{ width: '100%', padding: '0.625rem' }}>
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', background: 'var(--error-light)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleRequestOTP}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" htmlFor="email">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="email"
                      type="email"
                      className="form-input"
                      style={{ paddingLeft: '36px' }}
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.625rem', fontSize: '0.95rem' }} disabled={loading}>
                  {loading ? 'Sending Code...' : 'Send Reset Code'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label className="form-label" htmlFor="otp">6-Digit Code</label>
                  <div style={{ position: 'relative' }}>
                    <ShieldCheck size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="otp"
                      type="text"
                      maxLength="6"
                      className="form-input"
                      style={{ paddingLeft: '36px', letterSpacing: '4px', fontSize: '1.1rem', textAlign: 'center' }}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newPassword">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="newPassword"
                      type="password"
                      className="form-input"
                      style={{ paddingLeft: '36px' }}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="confirmPassword"
                      type="password"
                      className="form-input"
                      style={{ paddingLeft: '36px' }}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.625rem', fontSize: '0.95rem', marginBottom: '1rem' }} disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
                
                <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>
                  <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>
                    Try a different email
                  </button>
                </div>
              </form>
            )}

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Remember your password?{' '}
              <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>
                Log in here
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}