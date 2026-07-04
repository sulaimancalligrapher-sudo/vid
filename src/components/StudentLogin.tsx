import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, FileSpreadsheet, KeyRound, AlertCircle, Settings, MapPin, Loader2 } from 'lucide-react';
import { loginStudent } from '../api';

interface StudentLoginProps {
  onLoginSuccess: (username: string, sheetNumber: string, sheetName: string) => void;
  onOpenSettings: () => void;
  isConfigured: boolean;
}

export default function StudentLogin({ onLoginSuccess, onOpenSettings, isConfigured }: StudentLoginProps) {
  const [username, setUsername] = useState(localStorage.getItem('loggedInUsername') || '');
  const [sheetNumber, setSheetNumber] = useState(localStorage.getItem('loggedInSheetNumber') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setError('يرجى تهيئة رابط اتصال قاعدة البيانات (Google Sheet) أولاً من الإعدادات ⚙️.');
      return;
    }

    if (!username.trim() || !sheetNumber.trim()) {
      setError('يرجى ملء جميع الحقول المطلوبة للدخول.');
      return;
    }

    setLoading(true);
    setError(null);

    // Get Device ID
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('deviceId', deviceId);
    }

    // Attempt Geolocation
    let coords: { lat: number | null; lng: number | null } = { lat: null, lng: null };
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
      });
      coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    } catch (err) {
      console.warn('Geolocation permission denied or timed out. Proceeding without coordinates.');
    }

    try {
      const result = await loginStudent(username.trim(), sheetNumber.trim(), deviceId, coords);
      if (result && result.success) {
        // Save in localStorage
        localStorage.setItem('loggedInUsername', username.trim());
        localStorage.setItem('loggedInSheetNumber', sheetNumber.trim());
        onLoginSuccess(username.trim(), sheetNumber.trim(), result.sheetName);
      } else {
        setError(result?.message || 'اسم الطالب أو رقم الورقة غير صحيح، أو تم منع هذا المستخدم.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول. يرجى مراجعة إعدادات الرابط والاتصال بالإنترنت.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4">
      {/* Settings Shortcut Button */}
      <button
        onClick={onOpenSettings}
        className="fixed top-4 right-4 p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/40 text-slate-300 hover:text-amber-400 rounded-2xl cursor-pointer transition-all flex items-center gap-2 text-xs font-semibold backdrop-blur-sm shadow-xl"
      >
        <Settings className="w-4.5 h-4.5 animate-spin-hover" />
        <span>إعدادات الاتصال بالشيت</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-slate-800/90 border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow Effects */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative">
          <span className="text-4xl">🎓</span>
          <h1 className="text-2xl font-bold text-amber-400 mt-3">بوابة دخول الطالب</h1>
          <p className="text-xs text-slate-400 mt-1">تعلّم القراءة وأرسل واجباتك التفاعلية بسهولة</p>
        </div>

        {/* Warning if Sheet connection is not configured */}
        {!isConfigured && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-xs flex items-start gap-3 text-right"
            dir="rtl"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">تنبيه للمعلم / مدير الموقع:</p>
              <p className="mt-1 leading-relaxed text-slate-300">
                يرجى الضغط على زر <span className="font-bold text-amber-400">"إعدادات الاتصال بالشيت"</span> في الأعلى لتوصيل الصفحة بملف Google Sheet الخاص بك وتفعيل نظام الدخول واستدعاء الدروس بنجاح.
              </p>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5 text-right" dir="rtl">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">اسم الطالب الثلاثي:</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسمك بالكامل"
                disabled={loading}
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-2xl placeholder-slate-600 outline-none transition-all pr-12 text-sm disabled:opacity-50"
              />
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">رقم الورقة / شيت الطالب (Sheet Number):</label>
            <div className="relative">
              <input
                type="text"
                value={sheetNumber}
                onChange={(e) => setSheetNumber(e.target.value)}
                placeholder="أدخل رقم شيت الطالب الخاص بك"
                disabled={loading}
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-2xl placeholder-slate-600 outline-none transition-all pr-12 text-sm disabled:opacity-50"
              />
              <FileSpreadsheet className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            </div>
          </div>

          {/* Feedback message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-4 rounded-2xl shadow-lg shadow-amber-500/15 active:scale-98 transition-all flex items-center justify-center gap-2.5 text-sm cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري التحقق من الهوية والموقع...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-5 h-5" />
                <span>دخول آمن للبوابة 🔐</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
