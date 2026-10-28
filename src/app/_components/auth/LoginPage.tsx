'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/_context/AuthContext';
import { ROLE_LABEL, roleFromLoginId } from '@/lib/access';
import { Coffee, IdCard, Eye, EyeOff, ShieldCheck, Sparkles, HelpCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Hint only: the actual role always comes from the stored account after a successful login.
  const detectedRole = roleFromLoginId(loginId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const res = await login(loginId, password, rememberMe);
    setIsLoading(false);

    if (!res.success) {
      setPassword('');
      setErrorMessage(res.message || 'Gagal masuk. Silakan cek data Anda.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1A1A1A] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Subtle Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#F47C0B]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-[400px] z-10">
        {/* Card: 16px radius + modal shadow */}
        <div className="bg-white rounded-[16px] p-6 md:p-8 wkm-modal-shadow border border-[#F1F1EF] transition-all relative">
          
          {/* Top Coffee Icon: #242424 Box */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-[#242424] rounded-[12px] flex items-center justify-center shadow-md shadow-black/10">
              <Coffee className="w-7 h-7 text-[#FFB21A]" strokeWidth={2.2} />
            </div>
          </div>

          {/* Title and Tagline */}
          <div className="text-center mb-6">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#242424] uppercase font-serif">
              WARKOP WONG KITO
            </h1>
            <p className="text-[#525252] italic text-xs mt-1 font-serif">
              &ldquo;Kelola operasional Warkop Wong Kito&rdquo;
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[8px] flex items-start gap-2">
              <span className="font-semibold">Perhatian:</span> {errorMessage}
            </div>
          )}

          {/* Login Form: 12px label-to-input, 16px section spacing */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login ID */}
            <div>
              <label htmlFor="login-id" className="block text-xs font-semibold text-[#525252] mb-1.5">
                ID Login
              </label>
              <div className="relative">
                <input
                  id="login-id"
                  type="text"
                  required
                  autoComplete="username"
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value.toUpperCase())}
                  placeholder="contoh: KSR-001"
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm font-mono tracking-wider bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] text-[#242424] placeholder:text-[#737373] placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#FFB21A]/30 focus:border-[#F47C0B] transition-all"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737373]">
                  <IdCard className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-1.5 text-[11px] text-[#737373] flex items-center gap-1.5 min-h-4">
                {detectedRole ? (
                  <>
                    {detectedRole === 'superadmin' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-[#F47C0B]" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#FFB21A]" />
                    )}
                    <span>
                      Akses: <strong className="text-[#242424]">{ROLE_LABEL[detectedRole]}</strong>
                    </span>
                  </>
                ) : (
                  <span>ID login diberikan oleh Owner (OWN-… / KSR-…).</span>
                )}
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-[#525252] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] text-[#242424] placeholder:text-[#737373] focus:outline-none focus:ring-2 focus:ring-[#FFB21A]/30 focus:border-[#F47C0B] transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#242424] p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#525252]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#F1F1EF] text-[#F47C0B] focus:ring-[#F47C0B] cursor-pointer"
                />
                <span>Ingat saya</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[#F47C0B] font-semibold hover:underline cursor-pointer"
              >
                Lupa password?
              </button>
            </div>

            {/* Submit Button with PRIMARY GRADIENT (#FFB21A -> #F47C0B) and 8px radius */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 wkm-gradient-bg wkm-gradient-bg-hover active:scale-[0.99] text-white font-bold rounded-[8px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-wider text-xs md:text-sm mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>MASUK</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer info: #737373 */}
        <p className="text-center text-[11px] text-[#737373] mt-5">
          &copy; {new Date().getFullYear()} Warkop Wong Kito. Sistem POS & Manajemen Warkop.
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[16px] max-w-sm w-full p-6 wkm-modal-shadow border border-[#F1F1EF] text-[#242424]">
            <div className="w-12 h-12 rounded-[12px] bg-[#FFF7E8] text-[#F47C0B] flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-center text-[#242424] mb-1">
              Lupa Password?
            </h3>
            <p className="text-xs text-center text-[#525252] mb-4 leading-relaxed">
              Akun dan password dibuat oleh Owner. Minta Owner untuk <strong>reset sandi</strong> lewat menu{' '}
              <strong>Team</strong>, lalu login dengan password sementara dan ganti di menu Profile.
            </p>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-1.5 text-xs font-semibold text-[#737373] hover:text-[#242424]"
            >
              Kembali ke Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
