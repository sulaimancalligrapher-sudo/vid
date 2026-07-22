import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HelpCircle, Check, AlertCircle, Send, CheckCircle2, ArrowLeft, RotateCcw } from 'lucide-react';
import { Question } from '../types';

interface QuestionModalProps {
  question: Question;
  onClose: () => void;
  onSubmit: (answer: string, isCorrect: boolean | null) => void;
  showResult: 'نعم' | 'لا';
  onRewatch?: () => void;
  rewatchType?: 'video' | 'audio';
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
  const [resultText, setResultText] = useState<{ text: string; success: boolean | null } | null>(null);

  const isMultipleChoice = question.options.length > 0;
  const isButtonEnabled = isMultipleChoice ? selectedOption !== null : textAnswer.trim().length > 0;

  const handleSubmit = async () => {
    if (!isButtonEnabled || isSubmitting) return;
    setIsSubmitting(true);

    const answer = isMultipleChoice ? selectedOption! : textAnswer.trim();
    let isCorrect: boolean | null = null;

    if (isMultipleChoice) {
      // Correct answer is numeric 1-based index (e.g. "1" or "2") in the original sheet
      const correctIdx = parseInt(question.correctAnswer) - 1;
      const correctText = question.options[correctIdx];
      isCorrect = answer === correctText;
    } else {
      // Text answers evaluate if there's a strict correct answer, else they are open-ended (null)
      if (question.correctAnswer) {
        isCorrect = answer.toLowerCase() === question.correctAnswer.toLowerCase();
      }
    }

    if (showResult === 'نعم') {
      // Display result feedback to the student
      if (isCorrect === null) {
        setResultText({ text: 'تم تسجيل إجابتك بنجاح! 👍', success: null });
      } else if (isCorrect) {
        setResultText({ text: 'إجابة صحيحة وممتازة! 🎉🌟', success: true });
      } else {
        const correctLabel = isMultipleChoice
          ? question.options[parseInt(question.correctAnswer) - 1] || question.correctAnswer
          : question.correctAnswer;
        setResultText({ text: `للأسف إجابة خاطئة. الإجابة الصحيحة هي: ${correctLabel}`, success: false });
      }

      // Wait 2 seconds, then submit and close
      setTimeout(() => {
        onSubmit(answer, isCorrect);
      }, 2500);
    } else {
      // Submit immediately
      onSubmit(answer, isCorrect);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-right"
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
            <HelpCircle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">سؤال تفاعلي أثناء التشغيل</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">يرجى الإجابة بدقة لمتابعة الدرس</p>
          </div>
        </div>

        {/* Question Image if present */}
        {question.image && (
          <div className="mb-4 aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
            <img
              src={question.image}
              className="w-full h-full object-contain cursor-zoom-in"
              alt="Question Visual"
              onClick={() => window.open(question.image, '_blank')}
            />
          </div>
        )}

        {/* Question Text */}
        <h4 className="text-base font-bold text-slate-200 mb-5 leading-relaxed">
          {question.question}
        </h4>

        {/* Answer Selection */}
        <div className="space-y-3 mb-6">
          {isMultipleChoice ? (
            question.options.map((opt, idx) => {
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

        {/* Submission Feedback alert */}
        {resultText && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border text-xs flex items-start gap-3 mb-6 ${
              resultText.success === null
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                : resultText.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {resultText.success === null ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : resultText.success ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed font-semibold">{resultText.text}</span>
          </motion.div>
        )}

        {/* Action button */}
        {!resultText && (
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
        )}
      </motion.div>
    </div>
  );
}
