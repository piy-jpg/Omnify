import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  AuthUser, 
  getStoredUser, 
  getStoredAuthToken, 
  setStoredAuth, 
  clearStoredAuth, 
  apiGetMe, 
  apiLogout, 
  apiVerifyOtp,
  apiLoginOtp,
  apiLoginPassword,
  apiRegister,
  apiVerifyRegisterOtp,
  apiCompleteRegistration,
  apiResendOtp,
  apiGoogleLogin,
  RegisterPayload,
  OtpResponse,
  VerifyRegisterResponse
} from '../services/authApi';

export interface PendingAuthFlow {
  type: 'login' | 'register';
  stage?: 'details' | 'verify_otp' | 'create_password' | 'done';
  registrationId?: string;
  identifier: string;
  email?: string;
  phone?: string;
  name?: string;
  category?: string;
  age?: number;
  maskedIdentifier?: string;
  maskedEmail?: string;
  maskedPhone?: string;
  tempToken?: string;
  devOtp?: string;
  resendAvailableAt: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingFlow: PendingAuthFlow | null;
  loginWithPassword: (email: string, password: string) => Promise<AuthUser>;
  loginWithOtp: (identifier: string) => Promise<OtpResponse>;
  loginWithGoogle: (payload: { email: string; name?: string; avatar?: string; credential?: string }) => Promise<AuthUser>;
  loginUser: (identifier: string) => Promise<OtpResponse>;
  registerStep1SendOtp: (payload: RegisterPayload) => Promise<OtpResponse>;
  registerStep2VerifyOtp: (email: string, otp: string, registrationId?: string) => Promise<VerifyRegisterResponse>;
  registerStep3SetPassword: (email: string, password: string, tempToken?: string, registrationId?: string) => Promise<AuthUser>;
  verifyOtp: (otp: string) => Promise<AuthUser>;
  resendOtp: () => Promise<OtpResponse>;
  logout: () => Promise<void>;
  setPendingFlow: (flow: PendingAuthFlow | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingFlow, setPendingFlow] = useState<PendingAuthFlow | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = sessionStorage.getItem('omni_pending_auth');
    return saved ? JSON.parse(saved) : null;
  });

  // Verify active session on load
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const token = getStoredAuthToken();
        if (token) {
          const remoteUser = await apiGetMe();
          if (isMounted) {
            if (remoteUser) {
              setUser(remoteUser);
              setStoredAuth(token, remoteUser);
            } else {
              setUser(null);
              clearStoredAuth();
            }
          }
        } else {
          const localUser = getStoredUser();
          if (localUser) {
            const remoteUser = await apiGetMe();
            if (isMounted) {
              if (remoteUser) {
                setUser(remoteUser);
              } else {
                setUser(null);
                clearStoredAuth();
              }
            }
          }
        }
      } catch (err) {
        console.error('[Auth Provider] Session check error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync pendingFlow to sessionStorage
  useEffect(() => {
    if (pendingFlow) {
      sessionStorage.setItem('omni_pending_auth', JSON.stringify(pendingFlow));
    } else {
      sessionStorage.removeItem('omni_pending_auth');
    }
  }, [pendingFlow]);

  const loginWithPassword = async (email: string, password: string): Promise<AuthUser> => {
    const res = await apiLoginPassword(email, password);
    setStoredAuth(res.sessionToken, res.user);
    setUser(res.user);
    setPendingFlow(null);
    return res.user;
  };

  const loginWithOtp = async (identifier: string): Promise<OtpResponse> => {
    const res = await apiLoginOtp(identifier);
    const flow: PendingAuthFlow = {
      type: 'login',
      stage: 'verify_otp',
      identifier: res.identifier || identifier,
      email: res.email,
      phone: res.phone,
      maskedIdentifier: res.maskedIdentifier || res.maskedEmail || res.maskedPhone || identifier,
      maskedEmail: res.maskedEmail,
      maskedPhone: res.maskedPhone,
      devOtp: res.devOtp,
      resendAvailableAt: Date.now() + (res.resendCooldown || 30) * 1000
    };
    setPendingFlow(flow);
    return res;
  };

  const loginWithGoogle = async (payload: { email: string; name?: string; avatar?: string; credential?: string }): Promise<AuthUser> => {
    const res = await apiGoogleLogin(payload);
    setUser(res.user);
    setPendingFlow(null);
    return res.user;
  };

  const registerStep1SendOtp = async (payload: RegisterPayload): Promise<OtpResponse> => {
    const res = await apiRegister(payload);
    const flow: PendingAuthFlow = {
      type: 'register',
      stage: 'verify_otp',
      registrationId: res.registrationId,
      identifier: res.identifier || payload.email,
      email: res.email || payload.email,
      phone: res.phone || payload.phone,
      name: payload.name,
      category: payload.category,
      age: payload.age,
      maskedIdentifier: res.maskedIdentifier || res.maskedEmail || payload.email,
      maskedEmail: res.maskedEmail,
      maskedPhone: res.maskedPhone,
      devOtp: res.devOtp,
      resendAvailableAt: Date.now() + (res.resendCooldown || 30) * 1000
    };
    setPendingFlow(flow);
    return res;
  };

  const registerStep2VerifyOtp = async (email: string, otp: string, registrationId?: string): Promise<VerifyRegisterResponse> => {
    const regId = registrationId || pendingFlow?.registrationId;
    const res = await apiVerifyRegisterOtp(email, otp, regId);
    if (pendingFlow) {
      setPendingFlow({
        ...pendingFlow,
        stage: 'create_password',
        registrationId: res.registrationId || pendingFlow.registrationId,
        tempToken: res.tempToken
      });
    }
    return res;
  };

  const registerStep3SetPassword = async (email: string, password: string, tempToken?: string, registrationId?: string): Promise<AuthUser> => {
    const regId = registrationId || pendingFlow?.registrationId;
    const res = await apiCompleteRegistration(email, password, tempToken || pendingFlow?.tempToken, regId);
    setStoredAuth(res.sessionToken, res.user);
    setUser(res.user);
    setPendingFlow(null);
    return res.user;
  };

  const verifyOtp = async (otp: string): Promise<AuthUser> => {
    const key = pendingFlow?.identifier || pendingFlow?.email || pendingFlow?.phone;
    if (!key) {
      throw new Error('No pending authentication session found. Please enter your email again.');
    }
    const res = await apiVerifyOtp(key, otp, pendingFlow?.registrationId);
    setStoredAuth(res.sessionToken, res.user);
    setUser(res.user);
    setPendingFlow(null);
    return res.user;
  };

  const resendOtp = async (): Promise<OtpResponse> => {
    const key = pendingFlow?.identifier || pendingFlow?.email || pendingFlow?.phone;
    if (!key) {
      throw new Error('No active authentication target found. Please restart registration.');
    }
    const res = await apiResendOtp(key, pendingFlow?.registrationId);
    setPendingFlow({
      ...pendingFlow,
      resendAvailableAt: Date.now() + (res.resendCooldown || 30) * 1000
    });
    return res;
  };

  const logout = async (): Promise<void> => {
    await apiLogout();
    setUser(null);
    setPendingFlow(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        pendingFlow,
        loginWithPassword,
        loginWithOtp,
        loginWithGoogle,
        loginUser: loginWithOtp,
        registerStep1SendOtp,
        registerStep2VerifyOtp,
        registerStep3SetPassword,
        verifyOtp,
        resendOtp,
        logout,
        setPendingFlow
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
