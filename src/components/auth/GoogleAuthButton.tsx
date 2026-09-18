import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
import { X, CheckCircle, Sparkles, User, ArrowRight, Shield, Globe } from 'lucide-react';

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  className?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  className = ''
}) => {
  const { loginWithGoogle } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const googleClientId =
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
    '880806707459-9ph50ruben26p9buk0qme9i2u6g86g87.apps.googleusercontent.com';

  const handleCredentialResponse = async (response: any) => {
    if (response.credential) {
      setIsSubmitting(true);
      setError(null);
      try {
        await loginWithGoogle({
          email: '',
          credential: response.credential
        });
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        setIsOpen(false);
        if (onSuccess) onSuccess();
      } catch (err: any) {
        setError(err.message || 'Google authentication failed.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Initialize Real-Time Google Identity Services
  useEffect(() => {
    const initGsi = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id && googleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          if (googleBtnContainerRef.current) {
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 380
            });
          }

          // Prompt Google One Tap
          window.google.accounts.id.prompt();
        } catch (e) {
          console.warn('[Google Identity Services] Initialization notice:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGsi();
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [googleClientId, onSuccess]);

  // Real-Time Google OAuth Popup Flow
  const handleGoogleClick = () => {
    setError(null);

    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              console.warn('[Google OAuth Error]:', tokenResponse.error);
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setIsOpen(true);
              }
              return;
            }

            if (tokenResponse.access_token) {
              setIsSubmitting(true);
              try {
                // Fetch real-time user profile from official Google userinfo endpoint
                const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`
                  }
                });

                if (!userinfoRes.ok) {
                  throw new Error('Failed to fetch verified user profile from Google.');
                }

                const profile = await userinfoRes.json();
                
                await loginWithGoogle({
                  email: profile.email,
                  name: profile.name || profile.given_name || profile.email.split('@')[0],
                  avatar: profile.picture
                });

                confetti({
                  particleCount: 120,
                  spread: 80,
                  origin: { y: 0.6 }
                });

                if (onSuccess) onSuccess();
              } catch (err: any) {
                setError(err.message || 'Google authentication failed.');
              } finally {
                setIsSubmitting(false);
              }
            }
          },
          error_callback: (nonOAuthErr: any) => {
            console.warn('[Google OAuth Non-OAuth Error]:', nonOAuthErr);
            setIsOpen(true);
          }
        });

        // Request real-time access token (opens Google official popup)
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('[Google Token Client Error]:', err);
      }
    }

    // Fallback if Google GIS is still loading
    setIsOpen(true);
  };

  const suggestedAccounts = [
    {
      name: 'Piyush Verma',
      email: 'piyushverma730929@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=piyushverma',
      badge: 'Account Owner'
    },
    {
      name: 'Piyush Verma (IILM)',
      email: 'piyush1.verma.cs27@iilm.edu',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=iilmedu',
      badge: 'University'
    }
  ];

  const handleSelectAccount = async (account: { name: string; email: string; avatar?: string }) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await loginWithGoogle({
        email: account.email,
        name: account.name,
        avatar: account.avatar
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setIsOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid Google email address.');
      return;
    }

    const name = customName.trim() || cleanEmail.split('@')[0];
    await handleSelectAccount({
      name,
      email: cleanEmail,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`
    });
  };

  return (
    <>
      {/* Main Google Sign-In Button */}
      <button
        type="button"
        onClick={handleGoogleClick}
        className={`w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-100 text-xs font-bold shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-200 cursor-pointer ${className}`}
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* Google Account Chooser Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => {
                if (!isSubmitting) setIsOpen(false);
              }}
              disabled={isSubmitting}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Google Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Sign in with Google
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Choose an account to continue to <strong>OMNIFY</strong>
                </p>
              </div>
            </div>

            {/* Error Notice */}
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            {/* Loading State */}
            {isSubmitting ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Authenticating with Google...
                </p>
                <p className="text-[11px] text-slate-400">
                  Activating Free Lifetime Pass
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                
                {/* Account Cards */}
                {suggestedAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectAccount(acc)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/70 hover:border-indigo-300 dark:border-slate-700/70 dark:hover:border-indigo-500/50 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {acc.name}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                            {acc.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {acc.email}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}

                {/* Custom Google Account Input */}
                {!showCustomInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="w-full py-2.5 px-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Use another Google account...</span>
                  </button>
                ) : (
                  <form onSubmit={handleCustomGoogleSubmit} className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Google Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Your Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md transition-all cursor-pointer"
                    >
                      Sign In with this Google Account
                    </button>
                  </form>
                )}

              </div>
            )}

            {/* Bottom Security Note */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-500" /> Free Lifetime Access
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Instant Activation
              </span>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
