import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, WordData } from './types';
import { fetchLessons, isApiConfigured, getWebAppUrl } from './api';
import StudentLogin from './components/StudentLogin';
import LessonList from './components/LessonList';
import LessonDetail from './components/LessonDetail';
import SettingsPanel from './components/SettingsPanel';
import AdminPasswordModal from './components/AdminPasswordModal';
import { Settings, RefreshCw, BookOpen, Sparkles, Database, Sun, Moon, Lock } from 'lucide-react';

export default function App() {
  const [webAppUrl, setWebAppUrl] = useState(getWebAppUrl());
  const [isConfigured, setIsConfigured] = useState(isApiConfigured());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Do not auto-open to remain fully locked for students
  
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => localStorage.getItem('isAdminUnlocked') === 'true');
  const [showFirstPassModal, setShowFirstPassModal] = useState(false);
  const [showSecondPassModal, setShowSecondPassModal] = useState(false);
  
  const [student, setStudent] = useState<Student | null>(null);
  const [sheetName, setSheetName] = useState<string>('');
  const [lessons, setLessons] = useState<WordData[]>([]);
  const [currentLessonIdx, setCurrentLessonIdx] = useState<number | null>(null);
  const [isReset, setIsReset] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Auto-login if cookies/localStorage exists
  useEffect(() => {
    const loggedUsername = localStorage.getItem('loggedInUsername');
    const loggedSheetNumber = localStorage.getItem('loggedInSheetNumber');
    if (loggedUsername && loggedSheetNumber && isConfigured) {
      setStudent({ username: loggedUsername, sheetNumber: loggedSheetNumber });
      setSheetName(loggedSheetNumber); // Default sheetName is the sheet/class number
      loadStudentLessons(loggedSheetNumber);
    }
  }, [webAppUrl, isConfigured]);

  const loadStudentLessons = async (nameOfSheet: string) => {
    setLoadingLessons(true);
    setError(null);
    try {
      const data = await fetchLessons(nameOfSheet);
      setLessons(data);
    } catch (err: any) {
      console.error(err);
      setError('فشل استرداد قائمة الدروس من الشيت. يرجى مراجعة إعدادات الرابط وصلاحيات الوصول.');
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleLoginSuccess = (username: string, sheetNum: string, returnedSheetName: string) => {
    setStudent({ username, sheetNumber: sheetNum });
    setSheetName(returnedSheetName || sheetNum);
    loadStudentLessons(returnedSheetName || sheetNum);
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUsername');
    localStorage.removeItem('loggedInSheetNumber');
    setStudent(null);
    setSheetName('');
    setLessons([]);
    setCurrentLessonIdx(null);
    setIsReset(false);
  };

  const handleRefreshList = () => {
    if (sheetName) {
      loadStudentLessons(sheetName);
    }
  };

  const handleSelectLesson = (index: number, resetMode: boolean = false) => {
    setIsReset(resetMode);
    setCurrentLessonIdx(index);
  };

  const handleSaveSettings = (url: string) => {
    setWebAppUrl(url);
    const configured = url.trim().length > 0;
    setIsConfigured(configured);
    if (!configured) {
      handleLogout();
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#faf7f2] via-[#f5efe5] to-[#ebf3ed] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 min-h-screen flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-800 transition-colors duration-300">
      {/* Top Banner Header */}
      <header className="bg-[#fefdfa]/90 dark:bg-slate-900/90 border-b border-amber-100/60 dark:border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 py-4 md:px-6 shadow-sm transition-colors duration-300">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {/* Logo / Brand Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-500 rounded-2xl flex items-center justify-center text-xl font-bold shadow-md shadow-amber-200">
              📸
            </div>
            <div className="text-right">
              <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                <span>ملتقط الوسائط للطلاب</span>
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">نظام القراءة والواجبات المطور</p>
            </div>
          </div>

          {/* Quick Stats or Connection status */}
          <div className="flex items-center gap-2">
            {/* Night Mode Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-sky-100 dark:border-slate-700 text-amber-500 dark:text-amber-300 rounded-2xl cursor-pointer transition-all active:scale-95 shadow-sm"
              title={darkMode ? "الوضع النهاري" : "الوضع الليلي"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAdminUnlocked && (
              <>
                {isConfigured ? (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span>متصل بقاعدة البيانات</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold rounded-full">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    <span>غير متصل</span>
                  </span>
                )}
              </>
            )}

            {student && (
              <button
                onClick={handleRefreshList}
                disabled={loadingLessons}
                className="p-2.5 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 border border-sky-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-2xl cursor-pointer transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-4 h-4 ${loadingLessons ? 'animate-spin' : ''}`} />
              </button>
            )}

            {isAdminUnlocked && (
              <>
                <button
                  onClick={() => {
                    setIsAdminUnlocked(false);
                    setIsSettingsOpen(false);
                    localStorage.removeItem('isAdminUnlocked');
                  }}
                  className="px-3 py-2.5 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/80 dark:hover:bg-rose-950/40 border border-rose-100/60 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-2xl cursor-pointer transition-all active:scale-95 shadow-sm flex items-center gap-1.5 text-xs font-bold"
                  title="الخروج من وضع الإدارة"
                >
                  <Lock className="w-4 h-4" />
                  <span>خروج الإدارة</span>
                </button>
                <button
                  onClick={() => setShowSecondPassModal(true)}
                  className="p-2.5 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-sky-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-300 rounded-2xl cursor-pointer transition-all active:scale-95 shadow-sm"
                  title="إعدادات قاعدة البيانات"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col relative py-6">
        {error && (
          <div className="max-w-md mx-auto w-full px-4 mb-4" dir="rtl">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs flex items-start gap-2.5 shadow-lg">
              <Database className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">خطأ في الاتصال:</p>
                <p className="mt-1 leading-relaxed text-slate-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* 1. Login View */}
          {!student ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-grow flex flex-col"
            >
              <StudentLogin
                onLoginSuccess={handleLoginSuccess}
                onOpenSettings={() => setShowSecondPassModal(true)}
                isConfigured={isConfigured}
                isAdminUnlocked={isAdminUnlocked}
                onUnlockAdmin={() => setShowFirstPassModal(true)}
              />
            </motion.div>
          ) : currentLessonIdx === null ? (
            /* 2. Lesson List View */
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <LessonList
                username={student.username}
                sheetNumber={student.sheetNumber}
                lessons={lessons}
                onSelectLesson={handleSelectLesson}
                onLogout={handleLogout}
                onRefresh={handleRefreshList}
                loading={loadingLessons}
              />
            </motion.div>
          ) : (
            /* 3. Lesson Detail Terminal */
            <motion.div
              key="detail"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <LessonDetail
                student={student}
                lesson={lessons[currentLessonIdx]}
                lessonIndex={currentLessonIdx}
                isReset={isReset}
                onBack={() => {
                  setCurrentLessonIdx(null);
                  setIsReset(false);
                  handleRefreshList(); // Reload scores on return
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="bg-[#fefdfa]/90 dark:bg-slate-900/90 border-t border-amber-100/60 dark:border-slate-800 py-6 text-center text-slate-500 dark:text-slate-400 text-xs select-none shadow-inner transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p dir="rtl" className="font-semibold text-slate-600 dark:text-slate-300">تطبيق ويب تفاعلي متقدم لتعليم الأطفال القراءة 📚</p>
          <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">© 2026 ملتقط الوسائط وقارئ الدروس</p>
        </div>
      </footer>

      {/* Settings Panel Overlay */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsPanel
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleSaveSettings}
          />
        )}

        {showFirstPassModal && (
          <AdminPasswordModal
            stage={1}
            onClose={() => setShowFirstPassModal(false)}
            onSuccess={() => {
              setIsAdminUnlocked(true);
              localStorage.setItem('isAdminUnlocked', 'true');
            }}
          />
        )}

        {showSecondPassModal && (
          <AdminPasswordModal
            stage={2}
            onClose={() => setShowSecondPassModal(false)}
            onSuccess={() => {
              setIsSettingsOpen(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
