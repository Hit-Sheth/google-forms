'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FormInput, KeyRound, Mail, User, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // UI States
  const [step, setStep] = useState(1); // 1 = Details form, 2 = OTP form
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // STEP 1: Request OTP
  async function handleRequestOTP(e) {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'register' }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // Move to OTP verification step
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // STEP 2: Verify OTP and Create Account
  async function handleVerifyAndRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Verify the OTP using your new GET route
      const verifyRes = await fetch(`/api/auth/register?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
      const verifyData = await verifyRes.json().catch(() => ({}));

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Invalid OTP');
      }

      // 2. If OTP is valid, actually register the user
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const regData = await regRes.json().catch(() => ({}));

      if (!regRes.ok) {
        throw new Error(regData.error || 'Registration failed');
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
            {step === 1 ? <FormInput size={32} /> : <ShieldCheck size={32} />}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            {step === 1 ? 'Create Account' : 'Verify Email'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {step === 1 ? 'Join FormCreator and submit forms' : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ color: 'var(--success)', display: 'inline-flex', marginBottom: '1rem' }}>
              <CheckCircle size={48} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Registration Successful!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Your account has been verified and registered. You can now log in.
            </p>
            <Link href="/login" className="btn btn-primary" style={{ width: '100%', padding: '0.625rem' }}>
              Back to Login
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
                {/* Name Input */}
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input id="name" type="text" className="form-input" style={{ paddingLeft: '36px' }} placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                </div>

                {/* Email Input */}
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input id="email" type="email" className="form-input" style={{ paddingLeft: '36px' }} placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>

                {/* Password Input */}
                <div className="form-group">
                  <label className="form-label" htmlFor="password">Password</label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input id="password" type="password" className="form-input" style={{ paddingLeft: '36px' }} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input id="confirmPassword" type="password" className="form-input" style={{ paddingLeft: '36px' }} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.625rem', fontSize: '0.95rem' }} disabled={loading}>
                  {loading ? 'Sending Code...' : 'Continue'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyAndRegister}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
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
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only allow numbers
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.625rem', fontSize: '0.95rem', marginBottom: '1rem' }} disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Register'}
                </button>
                
                <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>
                  <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>
                    Use a different email
                  </button>
                </div>
              </form>
            )}

            {step === 1 && (
              <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>
                  Log in here
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}