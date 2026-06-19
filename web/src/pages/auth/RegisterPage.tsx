import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useTranslation } from '../../hooks/useTranslation';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuthStore } from '../../store/useAuthStore';

type RoleOption = 'CUSTOMER' | 'MANAGER' | 'STAFF';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<RoleOption>('CUSTOMER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const redirectByRole = (role: string) => {
    if (role === 'MANAGER' || role === 'ADMIN') {
      navigate('/manager/appointments', { replace: true });
    } else if (role === 'STAFF') {
      navigate('/staff/appointments', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !phoneNumber.trim() || !password.trim() || !confirmPassword.trim()) {
      setError(t('auth.fillAllFields'));
      return;
    }

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      setError(t('auth.invalidPhone'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsNotMatch'));
      return;
    }

    setLoading(true);
    try {
      await authApi.register(fullName.trim(), phoneNumber.trim(), password, role);
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('auth.registerFailed');
      setError(message || t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    setError('');
    setGoogleLoading(true);
    try {
      const data = await authApi.googleLogin(credentialResponse.credential);
      login(data.user, data.token);
      redirectByRole(data.user.role);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('auth.registerFailed');
      setError(message || t('auth.registerFailed'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError(t('auth.registerFailed'));
  };

  return (
    <div className="auth-page">
      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <div className="auth-logo headline">B_Hair</div>
        <p className="auth-subtitle">{t('auth.joinToday')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Full Name */}
          <div className="input-group">
            <label className="input-label">{t('auth.fullNameLabel')}</label>
            <div className="input-icon-wrap">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                type="text"
                className="input"
                placeholder={t('auth.fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="input-group">
            <label className="input-label">{t('auth.phoneLabel')}</label>
            <div className="input-icon-wrap">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.64 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.64a16 16 0 0 0 5.55 5.55l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 15.5z"/>
                </svg>
              </span>
              <input
                type="tel"
                className="input"
                placeholder={t('auth.phonePlaceholder')}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
              />
            </div>
          </div>

          {/* Password */}
          <div className="input-group">
            <label className="input-label">{t('auth.passwordLabel')}</label>
            <div className="input-icon-wrap" style={{ position: 'relative' }}>
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                style={{ paddingRight: 48 }}
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--outline)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <label className="input-label">{t('auth.confirmPasswordLabel')}</label>
            <div className="input-icon-wrap" style={{ position: 'relative' }}>
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </span>
              <input
                type={showConfirm ? 'text' : 'password'}
                className="input"
                style={{
                  paddingRight: 48,
                  borderColor:
                    confirmPassword && password !== confirmPassword
                      ? 'var(--error)'
                      : undefined,
                }}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--outline)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <span style={{ fontSize: 12, color: 'var(--error)', marginTop: 2 }}>
                {t('auth.passwordsNotMatch')}
              </span>
            )}
          </div>

          {/* Role Selector */}
          <div className="input-group">
            <label className="input-label">{t('auth.roleLabel')}</label>
            <div className="segment">
              <button
                type="button"
                className={`segment-btn${role === 'CUSTOMER' ? ' active' : ''}`}
                onClick={() => setRole('CUSTOMER')}
              >
                {t('auth.customer')}
              </button>
              <button
                type="button"
                className={`segment-btn${role === 'MANAGER' ? ' active' : ''}`}
                onClick={() => setRole('MANAGER')}
              >
                {t('auth.manager')}
              </button>
              <button
                type="button"
                className={`segment-btn${role === 'STAFF' ? ' active' : ''}`}
                onClick={() => setRole('STAFF')}
              >
                {t('auth.barber')}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: 'rgba(192,57,43,0.1)',
                border: '1px solid rgba(192,57,43,0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: 13,
                color: 'var(--error)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                {t('common.loading')}
              </>
            ) : (
              t('auth.createAccount')
            )}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="divider-text">{t('auth.continueGoogle')}</div>

      {/* Google Login */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          opacity: googleLoading || loading ? 0.6 : 1,
          pointerEvents: googleLoading || loading ? 'none' : 'auto',
          transition: 'opacity 0.18s ease',
          marginBottom: 8,
        }}
      >
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap={false}
          shape="rectangular"
          size="large"
          width="100%"
          text="signup_with"
          logo_alignment="left"
        />
      </div>

      {/* Footer link */}
      <p
        style={{
          textAlign: 'center',
          marginTop: 28,
          fontSize: 13,
          color: 'var(--text-muted)',
        }}
      >
        {t('auth.haveAccount')}
        <Link
          to="/login"
          style={{
            color: 'var(--color-secondary)',
            fontWeight: 700,
          }}
        >
          {t('auth.signIn')}
        </Link>
      </p>
    </div>
  );
}
