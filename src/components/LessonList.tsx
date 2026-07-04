import React from 'react';
import { motion } from 'motion/react';
import { WordData } from '../types';
import { LogOut, BookOpen, CheckCircle, RefreshCw, Star, PlayCircle, Lock } from 'lucide-react';
import { decrementRetryCount, unmarkLessonCompleted } from '../api';

interface LessonListProps {
  username: string;
  sheetNumber: string;
  lessons: WordData[];
  onSelectLesson: (index: number, isReset: boolean) => void;
  onLogout: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export default function LessonList({
  username,
  sheetNumber,
  lessons,
  onSelectLesson,
  onLogout,
  onRefresh,
  loading,
}: LessonListProps) {

  const handleResetLesson = async (e: React.MouseEvent, index: number, lesson: WordData) => {
    e.stopPropagation(); // Prevent opening lesson immediately
    if (confirm('هل أنت متأكد من رغبتك في إعادة المحاولة لهذا الدرس؟ سيؤدي ذلك إلى استهلاك محاولة واحدة من محاولاتك المتاحة.')) {
      try {
        await decrementRetryCount(sheetNumber, index);
        await unmarkLessonCompleted(sheetNumber, index);
        onRefresh(); // Refresh parent to reload lesson data
        onSelectLesson(index, true); // Open lesson in "Reset/Retake" mode
      } catch (err) {
        alert('فشل إعادة تعيين الدرس. يرجى مراجعة الاتصال والتحقق.');
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 text-right" dir="rtl">
      {/* Student Profile Ribbon */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800 border border-slate-700/50 rounded-3xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center text-xl font-bold">
            👤
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">{username}</h2>
            <p className="text-xs text-slate-400 mt-0.5">شيت الطالب: #{sheetNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onLogout}
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      </motion.div>

      {/* Title */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/15 text-amber-400 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">دروس القراءة التفاعلية المتاحة</h3>
        </div>
        {loading && (
          <div className="text-xs text-slate-400 animate-pulse flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
            <span>جاري المزامنة...</span>
          </div>
        )}
      </div>

      {/* Lesson Board */}
      {lessons.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-800/80 rounded-3xl p-12 text-center text-slate-500">
          <span className="text-4xl">📭</span>
          <p className="mt-3 text-sm">لا توجد دروس مخصصة لك في هذا الشيت حالياً.</p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700/40 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-700/60 text-slate-400 text-xs font-bold">
                  <th className="px-6 py-4">اسم وموضوع الدرس</th>
                  <th className="px-6 py-4 text-center">حالة الإنجاز</th>
                  <th className="px-6 py-4 text-center">إعادة محاولة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {lessons.map((lesson, idx) => {
                  const isCompleted = lesson.completed === 'تم';
                  
                  // Reset condition from apps script
                  let showReset = isCompleted && lesson.retryResetCount > 0;
                  if (lesson.resetCondition === 'نعم') {
                    showReset = showReset && lesson.dzValue === 'تم';
                  }

                  return (
                    <motion.tr
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx}
                      onClick={() => onSelectLesson(idx, false)}
                      className={`group hover:bg-slate-750 cursor-pointer transition-all ${
                        isCompleted ? 'bg-sky-500/5' : ''
                      }`}
                    >
                      {/* Lesson Name */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl transition-colors ${
                            isCompleted 
                              ? 'bg-sky-500/10 text-sky-400' 
                              : 'bg-slate-900 group-hover:bg-amber-500/10 text-slate-400 group-hover:text-amber-400'
                          }`}>
                            <PlayCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <span className={`font-bold block text-sm transition-colors ${
                              isCompleted ? 'text-sky-300' : 'text-slate-200 group-hover:text-amber-400'
                            }`}>
                              {lesson.comment || 'درس غير معنون'}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                              الكلمة المستهدفة: {lesson.word}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Achievement Status */}
                      <td className="px-6 py-4.5 text-center">
                        <div className="flex items-center justify-center">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-bold rounded-full">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>تم الإنجاز (مراجعة)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-700/50 text-slate-400 text-xs font-bold rounded-full">
                              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                              <span>مستمر / غير منجز</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Reset / Retake Button */}
                      <td className="px-6 py-4.5 text-center">
                        <div className="flex items-center justify-center">
                          {showReset ? (
                            <button
                              onClick={(e) => handleResetLesson(e, idx, lesson)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 border border-amber-600/30 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-md shadow-amber-500/5"
                            >
                              <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
                              <span>إعادة ({lesson.retryResetCount})</span>
                            </button>
                          ) : isCompleted ? (
                            <span className="text-slate-600 text-[11px] flex items-center gap-1 justify-center">
                              <Lock className="w-3 h-3" />
                              <span>مغلق</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-xs">-</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
