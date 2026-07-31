import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HelpCircle, Check, AlertCircle, Send, CheckCircle2, ArrowLeft, RotateCcw, X } from 'lucide-react';
import { Question } from '../types';

interface QuestionModalProps {
  question: Question;
  onClose: () => void;
  onSubmit: (answer: string, isCorrect: boolean | null) => void;
  showResult: 'نعم' | 'لا';
  onRewatch?: () => void;
  rewatchType?: 'video' | 'audio';
}

interface ResultModalState {
  text: string;
  success: boolean | null;
  correctLabel?: string;
  answer: string;
  isCorrect: boolean | null;
}

function getGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  const ucMatch = url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (ucMatch && ucMatch[1]) return ucMatch[1];

  return null;
}

function getPlayableImageUrl(url: string): string {
  if (!url) return '';
  const driveId = getGoogleDriveFileId(url);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`;
  }
  return url;
}

export default function QuestionModal({
  question,
  onClose,
  onSubmit,
  showResult,
  onRewatch,
  rewatchType,
}: QuestionModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultModal, setResultModal] = useState<ResultModalState | null>(null);

  const rawOptions = Array.isArray(question.options) ? question.options : [];
  const validOptions = rawOptions.map(o => String(o ?? '')).filter(o => o.trim().length > 0);
  const isMultipleChoice = validOptions.length > 0;
  const isButtonEnabled = isMultipleChoice ? selectedOption !== null : textAnswer.trim().length > 0;

  const handleSubmit = async () => {
    if (!isButtonEnabled || isSubmitting) return;
    setIsSubmitting(true);

    const answer = isMultipleChoice ? selectedOption! : textAnswer.trim();
    let isCorrect: boolean | null = null;

    if (isMultipleChoice) {
      // Correct answer can be 1-based index string (e.g. "1" or "2") or the option text itself
      const numAnswer = parseInt(question.correctAnswer);
      if (!isNaN(numAnswer) && numAnswer >= 1 && numAnswer <= validOptions.length) {
        const correctText = validOptions[numAnswer - 1];
        isCorrect = answer === correctText;
      } else {
        isCorrect = answer === question.correctAnswer || answer.trim() === String(question.correctAnswer || '').trim();
      }
    } else {
      // Text answers evaluate if there's a strict correct answer, else they are open-ended (null)
      if (question.correctAnswer) {
        isCorrect = answer.toLowerCase() === question.correctAnswer.toLowerCase();
      }
    }

    if (showResult === 'نعم') {
      let text = '';
      let correctLabel: string | undefined = undefined;

      if (isCorrect === null) {
        text = 'تم تسجيل إجابتك بنجاح! 👍';
      } else if (isCorrect) {
        text = 'أحسنت! إجابتك صحيحة وممتازة 🎉🌟';
      } else {
        text = 'للأسف إجابتك غير صحيحة.';
        const numAnswer = parseInt(question.correctAnswer);
        correctLabel = (!isNaN(numAnswer) && numAnswer >= 1 && numAnswer <= validOptions.length)
          ? validOptions[numAnswer - 1]
          : question.correctAnswer;
      }

      setResultModal({
        text,
        success: isCorrect,
        correctLabel,
        answer,
        isCorrect
      });
    } else {
      // Submit immediately
      onSubmit(answer, isCorrect);
    }
  };

  const handleConfirmResult = () => {
    if (resultModal) {
      const { answer, isCorrect } = resultModal;
      setResultModal(null);
      onSubmit(answer, isCorrect);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm" dir="rtl">
      {/* Result Popup Modal (When showResult is 'نعم' and answer is submitted) */}
      {resultModal ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-center z-10"
        >
          {/* Background glow */}
          <div className={`absolute top-0 right-1/2 translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            resultModal.success === true ? 'bg-emerald-500/10' : resultModal.success === false ? 'bg-rose-500/10' : 'bg-blue-500/10'
          }`} />

          {/* Header Icon */}
          <div className="flex justify-center mb-5">
            <div className={`p-4 rounded-3xl border shadow-lg ${
              resultModal.success === true
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : resultModal.success === false
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-blue-500/20 border-blue-500/40 text-blue-400'
            }`}>
              {resultModal.success === true ? (
                <CheckCircle2 className="w-12 h-12" />
              ) : resultModal.success === false ? (
                <AlertCircle className="w-12 h-12" />
              ) : (
                <CheckCircle2 className="w-12 h-12" />
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className={`text-xl font-black mb-3 ${
            resultModal.success === true
              ? 'text-emerald-400'
              : resultModal.success === false
              ? 'text-rose-400'
              : 'text-blue-400'
          }`}>
            {resultModal.success === true
              ? 'إجابة صحيحة وممتازة! 🎉'
              : resultModal.success === false
              ? 'إجابة خاطئة ❌'
              : 'تم تسجيل الإجابة 👍'}
          </h3>

          {/* Message / Details */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 mb-6 text-right">
            <p className="text-sm font-semibold text-slate-200 leading-relaxed text-center">
              {resultModal.text}
            </p>

            {resultModal.correctLabel && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-center">
                <span className="text-xs text-slate-400 block mb-1">الإجابة الصحيحة هي:</span>
                <span className="text-sm font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl inline-block mt-0.5">
                  {resultModal.correctLabel}
                </span>
              </div>
            )}
          </div>

          {/* Close & Continue Button */}
          <button
            onClick={handleConfirmResult}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-3.5 px-6 rounded-2xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <span>إغلاق ومتابعة الدرس</span>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </motion.div>
      ) : (
        /* Standard Question Modal */
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-right"
        >
          {/* Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header Icon */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <HelpCircle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">سؤال تفاعلي أثناء التشغيل</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">يرجى الإجابة بدقة لمتابعة الدرس</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title="إغلاق وإكمال المشاهدة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Question Image if present */}
          {question.image && (
            <div className="mb-4 aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <img
                src={getPlayableImageUrl(question.image)}
                className="w-full h-full object-contain cursor-zoom-in"
                alt="Question Visual"
                onClick={() => window.open(getPlayableImageUrl(question.image), '_blank')}
              />
            </div>
          )}

          {/* Question Text */}
          <h4 className="text-base font-bold text-slate-200 mb-5 leading-relaxed">
            {question.question || 'سؤال تفاعلي (يرجى اختيار إجابة من القائمة أدناه)'}
          </h4>

          {/* Answer Selection */}
          <div className="space-y-3 mb-6">
            {isMultipleChoice ? (
              validOptions.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedOption(opt)}
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3.5 rounded-2xl text-xs font-bold text-right border transition-all cursor-pointer flex items-center justify-between group active:scale-99 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                        : 'bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{opt}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-amber-400 border-amber-400' : 'border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <input
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="اكتب إجابتك هنا..."
                disabled={isSubmitting}
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-850 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-2xl placeholder-slate-600 outline-none transition-all text-xs text-right"
              />
            )}
          </div>

          {/* Action button */}
          <div className="flex flex-col sm:flex-row gap-3">
            {onRewatch && (
              <button
                type="button"
                onClick={onRewatch}
                disabled={isSubmitting}
                className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 hover:border-slate-700 font-bold py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-[11px] cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span>
                  {rewatchType === 'audio' ? 'إعادة استماع المقطع السابق' : 'إعادة مشاهدة المقطع السابق'}
                </span>
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!isButtonEnabled || isSubmitting}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3.5 rounded-2xl shadow-lg shadow-amber-500/10 active:scale-98 transition-all flex items-center justify-center gap-2 text-[11px] cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>إرسال الإجابة وتأكيد</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
