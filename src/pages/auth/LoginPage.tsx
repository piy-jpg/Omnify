import React, { useState } from 'react';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import { OmnifyLogo } from '../../components/common/OmnifyLogo';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowRight, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  AlertCircle,
  KeyRound
} from 'lucide-react';

interface LoginPageProps {
  onNavigateRegister: () => void;
  onNavigateOtp: () => void;
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateRegister,
  onNavigateOtp,
  onSuccess
}) => {
  const { loginWithPassword, loginWithOtp } = useAuth();

  // Login Mode: 'password' | 'otp'
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);

    try {
      if (loginMode === 'password') {
        if (!password) {
          setError('Please enter your password.');
          setIsLoading(false);
          return;
        }
        await loginWithPassword(cleanEmail, password);
        if (onSuccess) onSuccess();
      } else {
        // Passwordless Email OTP Login
        await loginWithOtp(cleanEmail);
        onNavigateOtp();
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#EEF2FF] via-[#F8FAFC] to-[#F3E8FF] dark:from-slate-950 dark:via-[#0c1222] dark:to-[#150d2a] relative overflow-hidden transition-colors duration-200">
      
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(99,102,241,0.06)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Top Branding */}
        <div className="flex justify-center mb-6">
          <OmnifyLogo size="lg" />
        </div>

        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-slate-800/80 shadow-2xl shadow-indigo-900/10 dark:shadow-indigo-950/50 p-7 sm:p-9 space-y-6">
          
          {/* Header */}
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back to OMNIFY
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Free lifetime access &bull; Secure cloud workspace
            </p>
          </div>

          {/* Google 1-Click Fast Sign In */}
          <div className="space-y-4">
            <GoogleAuthButton onSuccess={onSuccess} />
            
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <span className="relative px-3 bg-white/80 dark:bg-slate-900/80 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Login Mode Toggle Pills */}
          <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setLoginMode('password');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                loginMode === 'password'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Email &amp; Password</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode('otp');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                loginMode === 'otp'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Instant Email OTP</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password Field (Only in Password mode) */}
            {loginMode === 'password' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setLoginMode('otp')}
                    className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                  >
                    Forgot? Log in with OTP
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
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
              </div>
            )}

            {loginMode === 'otp' && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                A 6-digit security code will be sent to your email for passwordless entry.
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-xs font-black shadow-xl shadow-indigo-600/25 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-200 cursor-pointer pt-3.5"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{loginMode === 'password' ? 'Signing In...' : 'Dispatching OTP...'}</span>
                </>
              ) : (
                <>
                  <span>{loginMode === 'password' ? 'Sign In' : 'Send Verification Code'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Don't have an account?
            </p>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline transition-all cursor-pointer"
            >
              <span>Create 100% Free Lifetime Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Trust Guarantee */}
          <div className="flex items-center justify-center gap-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Free Forever
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Instant Access
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
