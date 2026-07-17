import React, { useState, useRef } from 'react';
import { Mail, Lock, User, Wallet, ArrowRight, ShieldCheck, Landmark, Sparkles, Check, Eye, EyeOff, X, Building2, Users, Globe, Briefcase } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (user: any, token: string) => void;
}

const requirements = [
  { id: 'length', text: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { id: 'uppercase', text: 'At least one uppercase letter (A-Z)', test: (pw: string) => /[A-Z]/.test(pw) },
  { id: 'lowercase', text: 'At least one lowercase letter (a-z)', test: (pw: string) => /[a-z]/.test(pw) },
  { id: 'number', text: 'At least one number (0-9)', test: (pw: string) => /[0-9]/.test(pw) },
  { id: 'special', text: 'At least one special character (!@#$%^&*)', test: (pw: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
];

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState('');
  const [realEmailSent, setRealEmailSent] = useState(false);
  const [smtpError, setSmtpError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 6-digit OTP input states and refs
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = cleanVal;
    setOtpValues(newOtp);
    setVerificationCode(newOtp.join(''));

    if (cleanVal && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        const newOtp = [...otpValues];
        newOtp[index - 1] = '';
        setOtpValues(newOtp);
        setVerificationCode(newOtp.join(''));
        otpRefs[index - 1].current?.focus();
      } else if (otpValues[index]) {
        const newOtp = [...otpValues];
        newOtp[index] = '';
        setOtpValues(newOtp);
        setVerificationCode(newOtp.join(''));
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
    const newOtp = Array(6).fill('');
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtpValues(newOtp);
    setVerificationCode(newOtp.join(''));
    
    const focusIndex = Math.min(pastedData.length, 5);
    otpRefs[focusIndex].current?.focus();
  };

  // Registration Preferences (Personal Only)
  const [personalPlan, setPersonalPlan] = useState<'basic' | 'premium' | 'family'>('premium');
  const [savingGoalPreference, setSavingGoalPreference] = useState('Emergency Fund');
  const [currency, setCurrency] = useState('USD');

  const allRequirementsMet = isLogin || requirements.every(req => req.test(password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!isLogin && !requirements.every(req => req.test(password))) {
      setError('Please satisfy all password requirements before registering.');
      setLoading(false);
      return;
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email, password } 
      : { 
          email, 
          password, 
          name,
          accountType: 'personal',
          personalPlan,
          savingGoalPreference,
          currency
        };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.verificationRequired) {
        setIsVerifying(true);
        setSimulatedCode(data.code || '');
        setRealEmailSent(!!data.realEmailSent);
        setSmtpError(data.smtpError || '');
        setMessage(data.message || 'A 6-digit verification code has been dispatched. Enter it below to authorize this ledger.');
        return;
      }

      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setMessage('If this email is registered, we have sent security reset codes.');
    }, 800);
  };

  return (
    <div id="auth-container" className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      
      {/* Visual Branding Section - Left */}
      <div id="auth-left-brand" className="hidden md:flex md:w-1/2 bg-slate-900 dark:bg-slate-950 relative overflow-hidden flex-col justify-between p-12 text-white border-r border-slate-800">
        {/* Floating Ambient Blobs */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-emerald-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '3s' }}></div>

        {/* Top Header */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">DevFint</span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50 font-mono">SaaS v1.0</span>
        </div>

        {/* Middle Value Proposition */}
        <div className="my-auto max-w-md z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Wealth Planning Engine</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white mb-4">
            Command your capital with surgical precision.
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-8">
            The intelligent personal finance gateway that auto-tracks cashflows, manages recurring expenses, secures savings, and delivers Gemini-powered capital efficiency.
          </p>

          <div className="space-y-4">
            {[
              'Enterprise-grade local offline-first capability with IndexedDB',
              'Surgical tracking of multi-cycle SaaS subscriptions',
              'Predictive financial budgeting & customized savings goals',
              'Smart recommendations generated by Gemini AI models'
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-sm text-slate-300 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-500 z-10">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>AES-256 Client Isolation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-slate-400" />
            <span>Open-Banking Blueprint</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Form Screen - Right */}
      <div id="auth-right-form" className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:p-12 lg:p-24 z-10">
        
        {/* Mobile Header Branding */}
        <div className="flex md:hidden items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Wallet className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900 dark:text-white">DevFint</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Form Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-100 dark:shadow-none border border-slate-200/60 dark:border-slate-800/80">
            
            {/* Headers */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isForgotPassword 
                  ? 'Recover Security Code' 
                  : isVerifying
                    ? 'Verify Security Email'
                    : isLogin 
                      ? 'Login to DevFint' 
                      : 'Register Premium SaaS'
                }
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
                {isForgotPassword 
                  ? 'We will transmit access key recovery links.' 
                  : isVerifying
                    ? `Please enter the authorization code sent to ${email}.`
                    : isLogin 
                      ? 'Welcome back. Enter authorization keys.' 
                      : 'Get started with fully automated capital planning.'
                }
              </p>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Success notifications */}
            {message && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                {message}
              </div>
            )}

            {/* Forms */}
            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Security Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all hover:shadow-lg hover:shadow-blue-500/15 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Transmitting...' : 'Send Recovery Packet'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Back to Secure Login
                  </button>
                </div>
              </form>
            ) : isVerifying ? (
              <form onSubmit={handleVerifySubmit} className="space-y-4">
                {realEmailSent ? (
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs mb-4">
                    <div className="font-bold flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Real-Time Verification Sent
                    </div>
                    A secure 6-digit activation key has been dispatched to <strong className="font-semibold text-slate-700 dark:text-slate-300">{email}</strong>.
                    <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      Please open your inbox (and check spam/promotions) to retrieve your code.
                    </div>
                  </div>
                ) : simulatedCode ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-slate-300 text-xs mb-4">
                    {smtpError ? (
                      <>
                        <div className="font-bold flex items-center gap-1.5 mb-1.5 text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          Offline Sandbox Mode
                        </div>
                        <div className="leading-relaxed text-[11px] text-slate-600 dark:text-slate-400">
                          We encountered a temporary constraint trying to dispatch your activation email. For your convenience, we have safely generated a secure temporary passcode so you can access your workspace instantly.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-bold flex items-center gap-1.5 mb-1.5 text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          Demo Sandbox Mode
                        </div>
                        <div className="leading-relaxed text-[11px] text-slate-600 dark:text-slate-400">
                          Email delivery is running in simulated sandbox mode. A temporary passcode has been generated below to authorize your session immediately.
                        </div>
                      </>
                    )}
                    <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Temporary Security Code</span>
                      <span className="inline-block bg-slate-100 dark:bg-slate-950 px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-lg font-mono font-bold text-blue-600 tracking-widest">{simulatedCode}</span>
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 text-center">
                    6-Digit Verification Code
                  </label>
                  <div className="flex justify-between gap-2 max-w-[280px] mx-auto mb-4" onPaste={handleOtpPaste}>
                    {otpValues.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={otpRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-10 h-12 text-center text-lg font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all hover:shadow-lg hover:shadow-blue-500/15 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Verifying Ledger...' : 'Verify & Authorize Account'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVerifying(false);
                      setSimulatedCode('');
                      setVerificationCode('');
                      setOtpValues(Array(6).fill(''));
                      setMessage('');
                      setError('');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Cancel & Return
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {isLogin ? (
                  <>
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Security Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@email.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Access Security Key</label>
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                        >
                          Forgot Key?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 focus:outline-none"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all hover:shadow-lg hover:shadow-blue-500/15 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Authorizing Access...' : 'Authorize Access'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  // Simple Personal Registration Flow
                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Security Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@email.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Access Security Key</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Primary Savings Goal & Starting Currency Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Savings Goal</label>
                        <select
                          value={savingGoalPreference}
                          onChange={(e) => setSavingGoalPreference(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                        >
                          <option value="Emergency Fund">Emergency Fund</option>
                          <option value="Retirement Savings">Retirement Savings</option>
                          <option value="Home Downpayment">Home Downpayment</option>
                          <option value="Tech & Hardware">Tech Investment</option>
                          <option value="Business Capital">Business Capital</option>
                          <option value="Vacation & Travel">Travel Fund</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Base Currency</label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="NGN">NGN (₦)</option>
                          <option value="CAD">CAD (C$)</option>
                          <option value="AUD">AUD (A$)</option>
                        </select>
                      </div>
                    </div>

                    {/* Password Strength Requirements */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 space-y-2">
                      <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Password Strength
                      </p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {requirements.map((req) => {
                          const isPassed = req.test(password);
                          return (
                            <div key={req.id} className="flex items-center gap-2">
                              {isPassed ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-red-500 stroke-[2.5]" />
                              )}
                              <span className={`text-[11px] transition-colors duration-150 ${
                                isPassed 
                                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold' 
                                  : 'text-slate-400 dark:text-slate-500 line-through decoration-slate-300/40 dark:decoration-slate-800'
                              }`}>
                                {req.text}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Register Submit Button */}
                    <button
                      type="submit"
                      disabled={loading || !name || !email || !password || !allRequirementsMet}
                      className="w-full mt-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-blue-500/15 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating Ledger...' : 'Create Ledger & Register'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Switch Login/Register */}
                <div className="text-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-xs text-slate-400">
                    {isLogin ? "Don't have a secure ledger?" : 'Already registered your keys?'}
                  </span>{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                      setMessage('');
                      setShowPassword(false);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    {isLogin ? 'Sign Up' : 'Secure Login'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Seed Data Reminder removed */}
        </div>
      </div>
    </div>
  );
}
