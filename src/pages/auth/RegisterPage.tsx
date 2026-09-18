import React, { useState, useEffect, useRef } from 'react';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import { OmnifyLogo } from '../../components/common/OmnifyLogo';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowRight, 
  ArrowLeft,
  User, 
  Briefcase, 
  Calendar, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  Check,
  CheckCircle2,
  RefreshCw,
  Search,
  Copy
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RegisterPageProps {
  onNavigateLogin: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  'Developer',
  'Student',
  'Designer',
  'Office Professional',
  'Teacher',
  'Researcher',
  'Freelancer',
  'Business',
  'Marketing',
  'Education',
  'Other'
];

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateLogin,
  onSuccess
}) => {
  const { 
    registerStep1SendOtp, 
    registerStep2VerifyOtp, 
    registerStep3SetPassword, 
    resendOtp 
  } = useAuth();

  // Wizard Stages: 1 = Details, 2 = Verify OTP, 3 = Create Password, 4 = Success
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 Form Data
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Developer');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2 OTP Data (Single robust string input supporting 1-tap Safari/iOS/Android autofill)
  const [otpValue, setOtpValue] = useState<string>('');
  const [devOtp, setDevOtp] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(30);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState<string>('');
  const [tempToken, setTempToken] = useState<string>('');
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Step 3 Password Data
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Shared State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Resend Countdown Timer
  useEffect(() => {
    if (currentStep !== 2) return;
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep, countdown]);

  // Focus OTP input when entering Step 2
  useEffect(() => {
    if (currentStep === 2) {
      setTimeout(() => otpInputRef.current?.focus(), 150);
    }
  }, [currentStep]);

  // -------------------------------------------------------------
  // STEP 1: VALIDATE & SEND EMAIL OTP
  // -------------------------------------------------------------
  const validateStep1 = () => {
    const errs: { [key: string]: string } = {};

    if (!name.trim() || name.trim().length < 2) {
      errs.name = 'Please enter your full name (at least 2 characters).';
    }

    if (!category) {
      errs.category = 'Please select your domain / category.';
    }

    const numAge = parseInt(age, 10);
    if (!age || isNaN(numAge) || numAge < 8 || numAge > 120) {
      errs.age = 'Please enter a valid age between 8 and 120.';
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateStep1()) return;

    setIsLoading(true);
    try {
      const res = await registerStep1SendOtp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        category,
        age: parseInt(age, 10),
        phone: phone.trim() ? phone.trim() : undefined
      });
      if (res?.registrationId) {
        setRegistrationId(res.registrationId);
      }
      if (res?.devOtp) {
        setDevOtp(res.devOtp);
      }
      setCountdown(30);
      setOtpValue('');
      setCurrentStep(2);
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to dispatch verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2: VERIFY OTP
  // -------------------------------------------------------------
  const handleStep2Verify = async (codeToVerify?: string) => {
    const code = String(codeToVerify || otpValue).trim().replace(/\D/g, '');
    if (code.length !== 6) {
      setGeneralError('Please enter the complete 6-digit verification code.');
      return;
    }

    setGeneralError(null);
    setIsLoading(true);

    try {
      const res = await registerStep2VerifyOtp(email.trim().toLowerCase(), code, registrationId);
      if (res.tempToken) {
        setTempToken(res.tempToken);
      }
      if (res.registrationId) {
        setRegistrationId(res.registrationId);
      }
      setCurrentStep(3);
    } catch (err: any) {
      setGeneralError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || isLoading) return;
    setGeneralError(null);
    setResendNotice(null);
    setIsLoading(true);

    try {
      const res = await resendOtp();
      if (res?.registrationId) {
        setRegistrationId(res.registrationId);
      }
      if (res?.devOtp) {
        setDevOtp(res.devOtp);
      }
      setCountdown(30);
      setResendNotice('A fresh verification code was sent to your email.');
      setOtpValue('');
      otpInputRef.current?.focus();
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 3: CREATE PASSWORD & COMPLETE REGISTRATION
  // -------------------------------------------------------------
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!password || password.length < 6) {
      setGeneralError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setGeneralError('Passwords do not match. Please re-type identical passwords.');
      return;
    }

    setIsLoading(true);
    try {
      await registerStep3SetPassword(email.trim().toLowerCase(), password, tempToken, registrationId);
      
      // Joyful celebration confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      setCurrentStep(4);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to finalize account creation.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 25;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 25;
    if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 25;
    return score;
  };
  const passStrength = getPasswordStrength();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#EEF2FF] via-[#F8FAFC] to-[#F3E8FF] dark:from-slate-950 dark:via-[#0c1222] dark:to-[#150d2a] relative overflow-hidden transition-colors duration-200">
      
      {/* Glow Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(99,102,241,0.06)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-lg relative z-10">
        
        {/* Top Branding */}
        <div className="flex justify-center mb-6">
          <OmnifyLogo size="lg" />
        </div>

        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-slate-800/80 shadow-2xl shadow-indigo-900/10 dark:shadow-indigo-950/50 p-7 sm:p-9 space-y-6">
          
          {/* Multi-Step Progress Tracker */}
          <div className="flex items-center justify-between px-2">
            {[
              { num: 1, label: 'Profile' },
              { num: 2, label: 'Verify OTP' },
              { num: 3, label: 'Password' }
            ].map((st, idx) => (
              <React.Fragment key={st.num}>
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      currentStep > st.num
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : currentStep === st.num
                        ? 'bg-brand-600 text-white ring-4 ring-brand-500/20 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {currentStep > st.num ? <Check className="w-3.5 h-3.5" /> : st.num}
                  </div>
                  <span className={`text-[11px] font-bold ${currentStep === st.num ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {st.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full ${currentStep > st.num ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-800'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 1: PROFILE & DOMAIN DETAILS */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4 animate-in fade-in">
              
              <div className="space-y-1 text-center pb-1">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Create your OMNIFY Account
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  100% Free Lifetime Pass &bull; Instant Access
                </p>
              </div>

              {/* 1-Click Fast Google Sign-Up */}
              <div className="space-y-4 pt-1">
                <GoogleAuthButton onSuccess={onSuccess} />
                
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <span className="relative px-3 bg-white/80 dark:bg-slate-900/80 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Or register with email OTP
                  </span>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Full Name</span>
                  {!errors.name && name.trim().length >= 2 && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Valid
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border ${
                      errors.name ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                    } text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 outline-none transition-all`}
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.name && <p className="text-[11px] text-rose-500 font-semibold">{errors.name}</p>}
              </div>

              {/* Domain / Category & Age Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Category / Domain Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Domain / Role
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all cursor-pointer appearance-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <Briefcase className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Age */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Age
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="8"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="22"
                      disabled={isLoading}
                      className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border ${
                        errors.age ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                      } text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 outline-none transition-all`}
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.age && <p className="text-[11px] text-rose-500 font-semibold">{errors.age}</p>}
                </div>

              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Email ID (Used for OTP verification)</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Live OTP Delivery
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. your_email@gmail.com"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border ${
                      errors.email ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                    } text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 outline-none transition-all`}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.email && <p className="text-[11px] text-rose-500 font-semibold">{errors.email}</p>}
              </div>

              {/* Submit Step 1 Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-xs font-black shadow-xl shadow-indigo-600/25 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-200 cursor-pointer pt-3"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Dispatching OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code to Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 2: VERIFY 6-DIGIT EMAIL OTP */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in">
              
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit email details</span>
              </button>

              <div className="space-y-1.5 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-2">
                  <Mail className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Verify your Email OTP
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter the 6-digit verification code sent to <strong className="text-slate-800 dark:text-slate-200 font-black">{email}</strong>
                </p>
              </div>

              {resendNotice && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{resendNotice}</span>
                </div>
              )}

              {/* Seamless Single Input Overlay with 6 Beautiful Visual Boxes */}
              <div className="space-y-4">
                <div 
                  className="relative flex justify-center items-center py-1 cursor-text"
                  onClick={() => otpInputRef.current?.focus()}
                >
                  {/* Real accessible input handling Safari 1-tap autofill, paste & keyboard events */}
                  <input
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpValue(clean);
                      if (clean.length === 6) {
                        handleStep2Verify(clean);
                      }
                    }}
                    onInput={(e: any) => {
                      const val = e.target.value || '';
                      const clean = val.replace(/\D/g, '').slice(0, 6);
                      if (clean.length === 6 && clean !== otpValue) {
                        setOtpValue(clean);
                        handleStep2Verify(clean);
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                      if (pasteData) {
                        setOtpValue(pasteData);
                        if (pasteData.length === 6) {
                          handleStep2Verify(pasteData);
                        }
                      }
                    }}
                    disabled={isLoading}
                    className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-text"
                    autoFocus
                  />

                  {/* 6 Visual Box Cluster */}
                  <div className="flex items-center justify-between gap-2.5 w-full">
                    {[0, 1, 2, 3, 4, 5].map((i) => {
                      const digit = otpValue[i] || '';
                      const isFocused = otpValue.length === i || (i === 5 && otpValue.length === 6);
                      return (
                        <div
                          key={i}
                          className={`flex-1 h-14 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black transition-all ${
                            digit 
                              ? 'bg-white dark:bg-slate-900 border-2 border-brand-500 text-slate-900 dark:text-white shadow-lg shadow-brand-500/10'
                              : isFocused
                              ? 'bg-slate-50 dark:bg-slate-800 border-2 border-indigo-500 ring-4 ring-indigo-500/20 text-transparent'
                              : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400'
                          }`}
                        >
                          {digit || (isFocused ? <span className="w-0.5 h-6 bg-brand-500 animate-pulse" /> : '')}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStep2Verify()}
                  disabled={isLoading || otpValue.length !== 6}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-xs font-black shadow-xl shadow-indigo-600/25 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-200 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify Code &amp; Continue to Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Spam Advisory & Instant Search / Activation Code */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-center space-y-2.5">
                <p className="text-[11px] text-indigo-950 dark:text-indigo-200 font-semibold">
                  📬 Code dispatched to <strong>{email}</strong>
                </p>

                {/* Email Search Helper Tip */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-indigo-100 dark:border-indigo-900/60 text-[11px] text-slate-600 dark:text-slate-300 shadow-sm">
                  <div className="flex items-center gap-1 shrink-0 font-medium">
                    <Search className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Can't find it in Inbox? Search</span>
                  </div>
                  <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-lg border border-indigo-200/70 dark:border-indigo-800/70">
                    <code className="font-mono font-black text-indigo-700 dark:text-indigo-300 text-[11px] select-all">
                      in:anywhere omnify
                    </code>
                  </div>
                </div>

                {devOtp && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpValue(devOtp);
                      handleStep2Verify(devOtp);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-sm hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Instant Autofill Code ({devOtp})</span>
                  </button>
                )}
              </div>

              {/* Resend Section */}
              <div className="pt-2 text-center space-y-1 border-t border-slate-100 dark:border-slate-800">
                {countdown > 0 ? (
                  <p className="text-xs font-bold text-slate-400">
                    Resend available in <span className="font-mono text-brand-600 dark:text-brand-400">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Resend Code</span>
                  </button>
                )}
              </div>

            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 3: CREATE SECURE PASSWORD */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-4 animate-in fade-in">
              
              <div className="space-y-1 text-center pb-1">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-2">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Create your Password
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Attach a password to <strong className="text-slate-800 dark:text-slate-200">{email}</strong> for instant logins.
                </p>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password (min 6 chars)"
                    disabled={isLoading}
                    className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          passStrength <= 25 ? 'bg-rose-500 w-1/4' : passStrength <= 50 ? 'bg-amber-500 w-2/4' : passStrength <= 75 ? 'bg-blue-500 w-3/4' : 'bg-emerald-500 w-full'
                        }`}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 flex justify-between">
                      <span>Strength</span>
                      <span className={passStrength >= 75 ? 'text-emerald-500' : 'text-amber-500'}>
                        {passStrength <= 25 ? 'Weak' : passStrength <= 50 ? 'Fair' : passStrength <= 75 ? 'Good' : 'Strong & Secure'}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type your password"
                    disabled={isLoading}
                    className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Complete Account Button */}
              <button
                type="submit"
                disabled={isLoading || !password || password !== confirmPassword}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-black shadow-xl shadow-emerald-600/25 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-200 cursor-pointer pt-3"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Account &amp; Unlock Free Lifetime Pass</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 4: SUCCESS STATE */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 4 && (
            <div className="py-6 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Account Created Successfully!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Welcome to OMNIFY, <strong>{name}</strong>. Entering your workspace...
              </p>
            </div>
          )}

          {/* Switch to Login Footer */}
          {currentStep === 1 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already have an account?
              </p>
              <button
                type="button"
                onClick={onNavigateLogin}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline transition-all cursor-pointer"
              >
                <span>Sign in with Email &amp; Password</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
