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

  const [expandedComments, setExpandedComments] = React.useState<Record<number, boolean>>({});

  const toggleComment = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation(); // Avoid triggering onSelectLesson
    setExpandedComments(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const hasMoreThanTwoWords = (text: string): boolean => {
    if (!text) return false;
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length > 2;
  };

  const getTwoWordsOrFull = (text: string): string => {
    if (!text) return 'درس غير معنون';
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 2) return text;
    return words.slice(0, 2).join(' ') + '...';
  };

  const isCommentExpanded = (idx: number, text: string): boolean => {
    if (!hasMoreThanTwoWords(text)) return true;
    return !!expandedComments[idx];
  };

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
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 text-right font-sans" dir="rtl">
      {/* Student Profile Ribbon */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#fefcf8] dark:bg-slate-900 border border-amber-100 dark:border-slate-800 rounded-3xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md shadow-amber-100/30 dark:shadow-none transition-colors duration-300"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-500 dark:text-amber-400 rounded-2xl flex items-center justify-center text-xl font-bold">
            👤
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{username}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">شيت الطالب: #{sheetNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onLogout}
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/50 text-rose-500 dark:text-rose-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      </motion.div>

      {/* Title */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-amber-400 text-slate-900 rounded-2xl shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">دروس القراءة التفاعلية المتاحة</h3>
        </div>
        {loading && (
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold animate-pulse flex items-center gap-1.5">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
            <span>جاري المزامنة...</span>
          </div>
        )}
      </div>

      {/* Lesson Board */}
      {lessons.length === 0 ? (
        <div className="bg-[#fefcf8] dark:bg-slate-900 border border-amber-100 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400 shadow-md">
          <span className="text-4xl">📭</span>
          <p className="mt-3 text-sm font-semibold">لا توجد دروس مخصصة لك في هذا الشيت حالياً.</p>
        </div>
      ) : (
        <div className="bg-[#fefcf8] dark:bg-slate-900 border border-amber-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md shadow-amber-100/30 dark:shadow-none transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-amber-50/40 dark:bg-slate-950/40 border-b border-amber-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-extrabold">
                  <th className="px-3 py-4 md:px-6">اسم وموضوع الدرس</th>
                  <th className="px-3 py-4 md:px-6 text-center">حالة الإنجاز</th>
                  <th className="px-3 py-4 md:px-6 text-center">إعادة محاولة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/40 dark:divide-slate-800/60">
                {lessons.map((lesson, idx) => {
                  const isCompleted = lesson.completed === 'تم';
                  
                  // Reset condition from apps script
                  let showReset = isCompleted && lesson.retryResetCount > 0;
                  if (lesson.resetCondition === 'نعم') {
                    showReset = showReset && lesson.dzValue === 'تم';
                  }

                  const commentText = lesson.comment || 'درس غير معنون';
                  const isExpanded = isCommentExpanded(idx, commentText);

                  return (
                    <motion.tr
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx}
                      onClick={() => onSelectLesson(idx, false)}
                      className={`group hover:bg-amber-50/30 dark:hover:bg-slate-800/40 cursor-pointer transition-all ${
                        isCompleted ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : 'bg-[#fefcf8] dark:bg-slate-900'
                      }`}
                    >
                      {/* Lesson Name & Topic */}
                      <td className="px-3 py-3 md:px-6 md:py-4.5">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className={`p-2 md:p-2.5 rounded-2xl transition-colors shrink-0 ${
                            isCompleted 
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 group-hover:bg-amber-400 group-hover:text-slate-900 shadow-sm'
                          }`}>
                            <PlayCircle className="w-4 h-4 md:w-5 md:h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            {/* Tap to expand for mobile */}
                            <div 
                              onClick={(e) => {
                                if (hasMoreThanTwoWords(commentText)) {
                                  toggleComment(e, idx);
                                } else {
                                  // Click normal to open lesson
                                  onSelectLesson(idx, false);
                                }
                              }}
                              className="inline-block max-w-full"
                            >
                              <span className={`font-extrabold text-xs md:text-sm transition-colors cursor-pointer select-none ${
                                isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                              }`}>
                                {isExpanded ? (
                                  <span className="block break-words leading-relaxed max-w-[150px] xs:max-w-[200px] sm:max-w-md">
                                    {commentText}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1">
                                    <span>{getTwoWordsOrFull(commentText)}</span>
                                    <span className="text-[9px] text-indigo-500 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50 px-1 py-0.5 rounded font-normal font-sans hover:bg-amber-100">
                                      + تفاصيل
                                    </span>
                                  </span>
                                )}
                              </span>
                            </div>
                            <span className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1 block">
                              الكلمة المستهدفة: {lesson.word}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Achievement Status */}
                      <td className="px-2 py-3 md:px-6 md:py-4.5 text-center">
                        <div className="flex items-center justify-center">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                              <CheckCircle className="w-3.5 h-3.5 hidden sm:inline" />
                              <span>تم</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-full">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse hidden sm:inline" />
                              <span>جديد</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Reset / Retake Button */}
                      <td className="px-2 py-3 md:px-6 md:py-4.5 text-center">
                        <div className="flex items-center justify-center">
                          {showReset ? (
                            <button
                              onClick={(e) => handleResetLesson(e, idx, lesson)}
                              className="px-2 py-1 md:px-3 md:py-1.5 bg-amber-400 hover:bg-amber-500 border border-amber-300 text-slate-900 text-[10px] md:text-xs font-extrabold rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm shrink-0"
                            >
                              <RefreshCw className="w-3 h-3 md:w-3.5 md:h-3.5 animate-spin-hover" />
                              <span>إعادة ({lesson.retryResetCount})</span>
                            </button>
                          ) : isCompleted ? (
                            <span className="text-slate-400 dark:text-slate-500 text-[10px] md:text-[11px] flex items-center gap-1 justify-center font-bold">
                              <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                              <span className="hidden sm:inline">مغلق</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">-</span>
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
