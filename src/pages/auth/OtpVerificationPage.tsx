import React, { useState, useEffect, useRef } from 'react';
import { OmnifyLogo } from '../../components/common/OmnifyLogo';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, 
  Mail, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  Search
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OtpVerificationPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const OtpVerificationPage: React.FC<OtpVerificationPageProps> = ({
  onSuccess,
  onBack
}) => {
  const { pendingFlow, verifyOtp, resendOtp } = useAuth();

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState<number>(30);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Calculate remaining countdown
  useEffect(() => {
    if (!pendingFlow?.resendAvailableAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((pendingFlow.resendAvailableAt - Date.now()) / 1000));
      setCountdown(remaining);
    }, 500);

    return () => clearInterval(interval);
  }, [pendingFlow?.resendAvailableAt]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    const updated = [...otpDigits];
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split('');
      chars.forEach((c, idx) => {
        if (index + idx < 6) {
          updated[index + idx] = c;
        }
      });
      setOtpDigits(updated);
      const nextFocus = Math.min(index + chars.length, 5);
      inputRefs.current[nextFocus]?.focus();
    } else {
      updated[index] = clean[clean.length - 1];
      setOtpDigits(updated);
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    const completeOtp = updated.join('');
    if (completeOtp.length === 6) {
      handleVerify(completeOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const updated = ['', '', '', '', '', ''];
    pasteData.split('').forEach((c, idx) => {
      updated[idx] = c;
    });
    setOtpDigits(updated);

    const nextFocus = Math.min(pasteData.length, 5);
    inputRefs.current[nextFocus]?.focus();

    if (pasteData.length === 6) {
      handleVerify(pasteData);
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setError(null);
    setIsVerifying(true);

    try {
      await verifyOtp(code);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setError(null);
    setResendMessage(null);
    setIsResending(true);

    try {
      await resendOtp();
      setResendMessage('New verification code has been dispatched to your email!');
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  const displayTarget = pendingFlow?.maskedIdentifier || pendingFlow?.maskedEmail || pendingFlow?.email || pendingFlow?.identifier || 'your email';

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#EEF2FF] via-[#F8FAFC] to-[#F3E8FF] dark:from-slate-950 dark:via-[#0c1222] dark:to-[#150d2a] relative overflow-hidden transition-colors duration-200">
      
      {/* Background Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Top Logo */}
        <div className="flex justify-center mb-6">
          <OmnifyLogo size="lg" />
        </div>

        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-slate-800/80 shadow-2xl shadow-indigo-900/10 dark:shadow-indigo-950/50 p-7 sm:p-9 space-y-6">
          
          {/* Back Action */}
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change email / phone</span>
          </button>

          {/* Heading */}
          <div className="space-y-2 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 via-blue-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Mail className="w-7 h-7" />
            </div>

            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Check your inbox
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              We sent a 6-digit verification code to <strong className="text-slate-800 dark:text-slate-200 font-black">{displayTarget}</strong>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Resend Success Banner */}
          {resendMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resendMessage}</span>
            </div>
          )}

          {/* 6-Box OTP Input Cluster */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 sm:gap-2.5">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  disabled={isVerifying}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 outline-none transition-all"
                />
              ))}
            </div>

            {/* Verify & Continue Button */}
            <button
              onClick={() => handleVerify()}
              disabled={isVerifying || otpDigits.join('').length !== 6}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white text-xs font-black shadow-xl shadow-indigo-600/25 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-200 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Code &amp; Continue</span>
                </>
              )}
            </button>
          </div>

            {/* Spam Advisory & Instant Search / Activation Code */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-center space-y-2.5">
              <p className="text-[11px] text-indigo-950 dark:text-indigo-200 font-semibold">
                📬 Code dispatched to <strong>{displayTarget}</strong>
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

              {pendingFlow?.devOtp && (
                <button
                  type="button"
                  onClick={() => {
                    const digits = pendingFlow.devOtp!.split('').slice(0, 6);
                    setOtpDigits(digits);
                    handleVerify(pendingFlow.devOtp);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-sm hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Instant Autofill Code ({pendingFlow.devOtp})</span>
                </button>
              )}
            </div>

            {/* Resend Countdown Section */}
            <div className="pt-2 text-center space-y-1.5 border-t border-slate-100 dark:border-slate-800">
              {countdown > 0 ? (
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  Resend available in <span className="font-mono text-brand-600 dark:text-brand-400">{countdown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-brand-600 dark:text-brand-400 hover:underline cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>Resend Code</span>
                </button>
              )}
            </div>

        </div>

      </div>
    </div>
  );
};
