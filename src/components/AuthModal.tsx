"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/AuthProvider";

type Tab = "login" | "register";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const { login, register } = useAuth();

  const resetForm = () => {
    setError(null);
    setLoginEmail("");
    setLoginPassword("");
    setRegName("");
    setRegEmail("");
    setRegPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(loginEmail, loginPassword);
      if (result.success) {
        resetForm();
        onOpenChange(false);
      } else {
        setError(result.error || "Ошибка входа");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await register(regEmail, regPassword, regName);
      if (result.success) {
        resetForm();
        onOpenChange(false);
      } else {
        setError(result.error || "Ошибка регистрации");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    await signIn("google", { callbackUrl: "/" });
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[420px] bg-[#FAF8F5] border-[#C9A96E]/20 rounded-2xl p-0 overflow-hidden">
        {/* Header with decorative element */}
        <div className="relative px-6 pt-6 pb-2">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C9A96E]/40 to-transparent" />
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-light text-foreground/90 tracking-tight">
              Путь к себе
            </DialogTitle>
            <DialogDescription className="text-center text-[13px] text-foreground/60">
              Войдите, чтобы сохранить свой прогресс
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-1 bg-[#F0EBE3]/50 mx-6 rounded-lg p-1">
          <button
            onClick={() => switchTab("login")}
            className={`flex-1 py-2 text-[14px] font-normal rounded-md transition-all duration-300 cursor-pointer ${
              tab === "login"
                ? "bg-white text-foreground/90 shadow-sm"
                : "text-foreground/55 hover:text-foreground/70"
            }`}
          >
            Вход
          </button>
          <button
            onClick={() => switchTab("register")}
            className={`flex-1 py-2 text-[14px] font-normal rounded-md transition-all duration-300 cursor-pointer ${
              tab === "register"
                ? "bg-white text-foreground/90 shadow-sm"
                : "text-foreground/55 hover:text-foreground/70"
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6"
            >
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-[13px] text-red-600/80">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form content */}
        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {tab === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                onSubmit={handleLogin}
                className="flex flex-col gap-3"
              >
                <div>
                  <label className="text-[12px] font-medium text-foreground/65 tracking-wider uppercase mb-1.5 block">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="h-11 bg-white/80 border-[#E0D8CC]/50 focus-visible:border-[#C9A96E]/40 focus-visible:ring-[#C9A96E]/15 rounded-lg text-[14px]"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-foreground/65 tracking-wider uppercase mb-1.5 block">
                    Пароль
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 bg-white/80 border-[#E0D8CC]/50 focus-visible:border-[#C9A96E]/40 focus-visible:ring-[#C9A96E]/15 rounded-lg text-[14px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 h-11 w-full rounded-lg bg-gradient-to-r from-[#C9A96E]/85 to-[#7A8B6F]/85 text-white text-[14px] font-medium transition-all duration-300 hover:from-[#C9A96E] hover:to-[#7A8B6F] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Входим...
                    </span>
                  ) : (
                    "Войти"
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                onSubmit={handleRegister}
                className="flex flex-col gap-3"
              >
                <div>
                  <label className="text-[12px] font-medium text-foreground/65 tracking-wider uppercase mb-1.5 block">
                    Имя
                  </label>
                  <Input
                    type="text"
                    placeholder="Как вас зовут?"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    className="h-11 bg-white/80 border-[#E0D8CC]/50 focus-visible:border-[#C9A96E]/40 focus-visible:ring-[#C9A96E]/15 rounded-lg text-[14px]"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-foreground/65 tracking-wider uppercase mb-1.5 block">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    className="h-11 bg-white/80 border-[#E0D8CC]/50 focus-visible:border-[#C9A96E]/40 focus-visible:ring-[#C9A96E]/15 rounded-lg text-[14px]"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-foreground/65 tracking-wider uppercase mb-1.5 block">
                    Пароль
                  </label>
                  <Input
                    type="password"
                    placeholder="Минимум 6 символов"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 bg-white/80 border-[#E0D8CC]/50 focus-visible:border-[#C9A96E]/40 focus-visible:ring-[#C9A96E]/15 rounded-lg text-[14px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 h-11 w-full rounded-lg bg-gradient-to-r from-[#7A8B6F]/85 to-[#C9A96E]/85 text-white text-[14px] font-medium transition-all duration-300 hover:from-[#7A8B6F] hover:to-[#C9A96E] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Создаём...
                    </span>
                  ) : (
                    "Создать аккаунт"
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#E0D8CC]/40" />
            <span className="text-[12px] text-foreground/45 font-normal">или</span>
            <div className="flex-1 h-px bg-[#E0D8CC]/40" />
          </div>

          {/* Google sign in */}
          <button
            onClick={handleGoogleLogin}
            className="h-11 w-full flex items-center justify-center gap-2.5 rounded-lg border border-[#E0D8CC]/50 bg-white/60 text-[14px] text-foreground/75 font-normal transition-all duration-300 hover:bg-white/80 hover:border-[#E0D8CC]/70 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Войти через Google
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
