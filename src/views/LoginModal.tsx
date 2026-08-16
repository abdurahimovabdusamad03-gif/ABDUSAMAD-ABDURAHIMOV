import React, { useState, useEffect } from 'react';
import { useERP } from '../context/ERPContext';
import { translations } from '../translations';
import {
  User,
  ShieldCheck,
  KeyRound,
  Store,
  Phone,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Lock,
  Smartphone,
  Sparkles,
  RefreshCw,
  Building2,
  AlertCircle,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  HelpCircle,
  Users,
  X,
} from 'lucide-react';

interface LoginModalProps {
  onClose?: () => void;
  defaultMode?: 'register' | 'login';
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, defaultMode }) => {
  const { loginWithCredentials, loginWithCredentialsAsync, registerAdmin, settings, users, currentUser } = useERP();
  const t = translations[settings.language || 'uz'];

  const [mode, setMode] = useState<'register' | 'login'>(() => {
    if (defaultMode) return defaultMode;
    if (!currentUser) return 'register';
    return 'login';
  });

  // Registration Form States
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [storeName, setStoreName] = useState(settings.storeName || '');
  const [phone, setPhone] = useState('+998 ');

  // Verification SMS State
  const [generatedSmsCode, setGeneratedSmsCode] = useState('');
  const [enteredSmsCode, setEnteredSmsCode] = useState('');
  const [timer, setTimer] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Password & Username State
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Login Form States - Privacy & Security Protection (No auto-fill of credentials)
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPin, setLoginPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // UI Error / Success messages
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Timer countdown for SMS resend
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  // Handle phone format
  const handlePhoneChange = (val: string) => {
    if (!val.startsWith('+998')) {
      setPhone('+998 ');
      return;
    }
    setPhone(val);
  };

  // Step 1 -> Step 2: Send SMS Code
  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError("Iltimos, ism va familiyangizni kiriting!");
      return;
    }
    if (!storeName.trim()) {
      setError("Iltimos, do'kon nomini kiriting!");
      return;
    }
    if (phone.trim().length < 12) {
      setError("Iltimos, to'liq telefon raqamingizni kiriting!");
      return;
    }

    // Generate realistic 6-digit random verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedSmsCode(code);
    setEnteredSmsCode('');
    setRegStep(2);

    // Auto suggest username if empty
    if (!username) {
      const autoUser = (firstName.trim().toLowerCase() + '_' + storeName.trim().toLowerCase().replace(/\s+/g, '')).slice(0, 15);
      setUsername(autoUser);
    }

    // Start 60s timer
    setTimer(60);
    setIsTimerActive(true);
  };

  // Step 2 -> Step 3: Verify SMS Code
  const handleVerifySms = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (enteredSmsCode.trim() !== generatedSmsCode) {
      setError("Tasdiqlash kodi xato kiritildi! Qaytadan tekshiring.");
      return;
    }

    // Success code verified
    setSuccessMsg("SMS kodi muvaffaqiyatli tasdiqlandi!");
    setTimeout(() => {
      setSuccessMsg('');
      setRegStep(3);
    }, 800);
  };

  // Step 3: Complete Registration
  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError("Iltimos, foydalanuvchi nomini (Login) kiriting!");
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      setError("Parol / Kod kamida 4 ta belgidan iborat bo'lishi kerak!");
      return;
    }
    if (pin !== confirmPin) {
      setError("Kiritilgan parollar bir-biriga mos kelmadi!");
      return;
    }

    // Register Glavniy Admin
    registerAdmin({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      storeName: storeName.trim(),
      phone: phone.trim(),
      username: username.trim().toLowerCase(),
      pin: pin.trim(),
    });

    if (rememberMe) {
      localStorage.setItem('erp_remember_me', 'true');
      localStorage.setItem('erp_saved_identifier', username.trim() || phone.trim());
    }

    if (onClose) onClose();
  };

  // Handle Login Submit with Server + Local cross-device sync
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    const cleanId = loginIdentifier.trim();
    const cleanPin = loginPin.trim();

    if (!cleanId) {
      setError("Iltimos, Login yoki Telefon raqamingizni kiriting!");
      setIsLoggingIn(false);
      return;
    }
    if (!cleanPin) {
      setError("Iltimos, parolingizni kiriting!");
      setIsLoggingIn(false);
      return;
    }

    try {
      const success = await loginWithCredentialsAsync(cleanId, cleanPin);
      if (success) {
        if (rememberMe) {
          localStorage.setItem('erp_remember_me', 'true');
          localStorage.setItem('erp_saved_identifier', cleanId);
        } else {
          localStorage.setItem('erp_remember_me', 'false');
          localStorage.removeItem('erp_saved_identifier');
        }
        if (onClose) onClose();
      } else {
        setError("Login yoki parol xato kiritildi! Agar parolni unutgan bo'lsangiz, yuqoridagi 'Ro'yxatdan o'tish' orqali yangilashingiz yoki standart 'admin' / '1234' orqali kirishingiz mumkin.");
      }
    } catch (err) {
      setError("Kirishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-slate-100 relative animate-in zoom-in-95 my-auto">
        
        {/* Optional Close Button (Only if user is already logged in) */}
        {currentUser && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header App Official Logo */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 mx-auto p-0.5 shadow-xl shadow-amber-500/25 mb-2.5 overflow-hidden">
            <div className="w-full h-full bg-[#121316] rounded-[14px] flex items-center justify-center overflow-hidden">
              <img
                src="/icon-192.png"
                alt="ERP Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/icon.png';
                }}
              />
            </div>
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">
            ERP Tizimi
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Boshqaruv va Savdo Platformasi
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Ro'yxatdan o'tish</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Kirish</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMsg && (
          <div className="mb-5 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE 1: REGISTRATION WIZARD */}
        {mode === 'register' && (
          <div>
            {/* Step Progress Bar */}
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center ${
                    regStep >= 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  1
                </div>
                <span className={`text-xs font-bold ${regStep === 1 ? 'text-amber-400' : 'text-slate-500'}`}>
                  Ma'lumotlar
                </span>
              </div>

              <div className="h-0.5 w-6 bg-slate-800" />

              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center ${
                    regStep >= 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  2
                </div>
                <span className={`text-xs font-bold ${regStep === 2 ? 'text-amber-400' : 'text-slate-500'}`}>
                  SMS Kod
                </span>
              </div>

              <div className="h-0.5 w-6 bg-slate-800" />

              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center ${
                    regStep >= 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  3
                </div>
                <span className={`text-xs font-bold ${regStep === 3 ? 'text-amber-400' : 'text-slate-500'}`}>
                  Login/Parol
                </span>
              </div>
            </div>

            {/* STEP 1: USER & STORE INFO */}
            {regStep === 1 && (
              <form onSubmit={handleSendSms} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ismingiz</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Jamshid"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Familiyangiz</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Anvarov"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Do'kon Nomi</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Grand Matolar Baza"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Telefon Raqamingiz</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+998 90 123 45 67"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm border-b-4 border-amber-800 shadow-xl shadow-amber-500/20 active:translate-y-1 active:border-b-0 flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>SMS Tasdiqlash Kodini Yuborish</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: SMS VERIFICATION CODE */}
            {regStep === 2 && (
              <form onSubmit={handleVerifySms} className="space-y-4">
                
                {/* Simulated SMS Alert Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 text-amber-200 text-xs shadow-lg space-y-2 relative overflow-hidden animate-in fade-in">
                  <div className="flex items-center justify-between font-bold text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-amber-400 animate-bounce" />
                      <span>SMS Xabarnoma</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{phone}</span>
                  </div>
                  
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Siz kiritgan telefon raqamga tasdiqlash kodi yuborildi:
                  </p>
                  
                  <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-amber-500/30">
                    <span className="text-xl font-extrabold font-mono tracking-widest text-amber-400">
                      {generatedSmsCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEnteredSmsCode(generatedSmsCode);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 active:scale-95 transition-all"
                    >
                      ⚡ Avto-to'ldirish
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>6 xonali SMS kodi</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="text-[11px] text-amber-400 hover:underline"
                    >
                      Raqamni o'zgartirish
                    </button>
                  </label>

                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="______"
                    value={enteredSmsCode}
                    onChange={(e) => setEnteredSmsCode(e.target.value)}
                    className="w-full text-center tracking-[0.5em] font-mono text-2xl font-bold py-3 rounded-2xl bg-slate-950 border border-slate-800 text-amber-400 placeholder-slate-700 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Countdown & Resend */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  {isTimerActive ? (
                    <span className="font-mono text-amber-400">
                      Qayta yuborish: <strong>{timer}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                        setGeneratedSmsCode(newCode);
                        setTimer(60);
                        setIsTimerActive(true);
                      }}
                      className="text-amber-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Kodni qayta yuborish</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm border-b-4 border-amber-800 shadow-xl shadow-amber-500/20 active:translate-y-1 active:border-b-0 flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kodni Tasdiqlash</span>
                </button>
              </form>
            )}

            {/* STEP 3: LOGIN & PASSWORD SETUP */}
            {regStep === 3 && (
              <form onSubmit={handleCompleteRegistration} className="space-y-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-amber-200">Glavniy Admin Ma'lumotlari</div>
                    <div className="text-[10px] text-amber-400/80 font-medium">
                      Oliy boshqaruv huquqiga ega bo'lasiz.
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Login (Foydalanuvchi nomi)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Parol / Kod (PIN-kod)</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Kamida 4 ta belgi (Masalan: 1234)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Parolni tasdiqlash</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Parolni qayta kiriting"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm border-b-4 border-amber-800 shadow-xl shadow-amber-500/20 active:translate-y-1 active:border-b-0 flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Glavniy Admin Bo'lib Kirish</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* MODE 2: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Login yoki Telefon raqami</span>
                </span>
                {loginIdentifier && (
                  <span className="text-[10px] font-mono text-amber-400">
                    {loginIdentifier.startsWith('+998') ? '📞 Telefon' : '👤 Login'}
                  </span>
                )}
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="Masalan: admin yoki +998..."
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Parol / Kod (PIN)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Yashirish</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ko'rsatish</span>
                    </>
                  )}
                </button>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Parolingizni kiriting"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0 w-4 h-4 accent-amber-500 cursor-pointer"
                />
                <span className={rememberMe ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                  Tizimda eslab qolish
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-[11px] text-amber-400/90 hover:text-amber-300 hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Kirish yordami</span>
              </button>
            </div>

            {/* Expandable Help Info */}
            {showHelp && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2 animate-in fade-in">
                <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Xavfsiz Kirish bo'yicha ma'lumot:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  Hisobingiz xavfsizligini ta'minlash uchun har bir xodim va boshqaruvchi o'ziga berilgan shaxsiy <strong>Login</strong> va <strong>Parol</strong> orqali kirishi lozim.
                </p>
                <p className="text-[10px] text-amber-300/80 leading-relaxed font-sans">
                  💡 Agar parolingizni eslay olmasangiz yoki yangi do'kon boshlamoqchi bo'lsangiz, yuqoridagi <strong>"Ro'yxatdan o'tish"</strong> tugmasi orqali yangi admin hisobini ochishingiz mumkin.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 disabled:opacity-60 text-slate-950 font-black text-sm border-b-4 border-amber-800 shadow-xl shadow-amber-500/20 active:translate-y-1 active:border-b-0 flex items-center justify-center gap-2 transition-all"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Tekshirilmoqda va kiritilmoqda...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Tizimga Kirish</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
