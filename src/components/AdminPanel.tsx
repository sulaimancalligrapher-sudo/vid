import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, Plus, Edit, BookOpen, GraduationCap, Save, 
  RefreshCw, CheckCircle2, AlertCircle, Video, Volume2, 
  Mic, Image as ImageIcon, ShieldCheck, Lock,
  Trash2, ChevronDown, ChevronUp, Link as LinkIcon, Settings as SettingsIcon,
  HelpCircle, MessageSquare, Calendar, Clock, Eye, EyeOff
} from 'lucide-react';
import { AdminQuestionRow, AdminAnswerRow, AdminQuestionItem } from '../types';
import { fetchAdminQuestions, saveAdminQuestion, deleteAdminQuestion, fetchAdminAnswers, updateAdminAnswer } from '../api';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'questions' | 'answers'>('questions');

  // Questions state
  const [questions, setQuestions] = useState<AdminQuestionRow[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestionRow | null>(null);
  const [modalSubTab, setModalSubTab] = useState<'links' | 'settings' | 'questions'>('links');
  const [expandedVideoIndex, setExpandedVideoIndex] = useState<number | null>(0);
  const [expandedAudioIndex, setExpandedAudioIndex] = useState<number | null>(0);
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Answers state
  const [answers, setAnswers] = useState<AdminAnswerRow[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [answerSearch, setAnswerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [editingAnswer, setEditingAnswer] = useState<AdminAnswerRow | null>(null);
  const [savingAnswer, setSavingAnswer] = useState(false);

  // Global notice state
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Delete modal state
  const [deletingQuestionRow, setDeletingQuestionRow] = useState<AdminQuestionRow | null>(null);

  useEffect(() => {
    loadQuestionsData();
    loadAnswersData();
  }, []);

  const loadQuestionsData = async () => {
    setLoadingQuestions(true);
    try {
      const data = await fetchAdminQuestions();
      setQuestions(data);
    } catch (err: any) {
      console.error(err);
      setNotice({ text: 'فشل تحميل بيانات ورقة الأسئلة Questions', type: 'error' });
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadAnswersData = async () => {
    setLoadingAnswers(true);
    try {
      const data = await fetchAdminAnswers();
      setAnswers(data);
    } catch (err: any) {
      console.error(err);
      setNotice({ text: 'فشل تحميل بيانات ورقة الإجابات Answers', type: 'error' });
    } finally {
      setLoadingAnswers(false);
    }
  };

  // Filtered Questions
  const filteredQuestions = questions.filter(q => {
    const query = questionSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      (q.word && q.word.toLowerCase().includes(query)) ||
      (q.comment && q.comment.toLowerCase().includes(query))
    );
  });

  // Filtered Answers
  const filteredAnswers = answers.filter(a => {
    const query = answerSearch.trim().toLowerCase();
    const matchesQuery = !query || (
      (a.username && a.username.toLowerCase().includes(query)) ||
      (a.sheetNumber && a.sheetNumber.toLowerCase().includes(query)) ||
      (a.comment && a.comment.toLowerCase().includes(query))
    );

    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'completed' ? (a.completed === 'تم') :
      (a.completed !== 'تم');

    return matchesQuery && matchesStatus;
  });

  // Handle Save Question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    if (!editingQuestion.comment.trim() || !editingQuestion.word.trim()) {
      alert('يرجى كتابة عنوان الدرس (الكلمة) والمعرف الربطي للدرس على الأقل.');
      return;
    }

    setSavingQuestion(true);
    try {
      await saveAdminQuestion(editingQuestion);
      setNotice({ text: 'تم حفظ بيانات الدرس والأسئلة بنجاح في ورقة Questions! 🎉', type: 'success' });
      setEditingQuestion(null);
      await loadQuestionsData();
    } catch (err: any) {
      console.error(err);
      setNotice({ text: 'خطأ أثناء حفظ الدرس: ' + (err.message || ''), type: 'error' });
    } finally {
      setSavingQuestion(false);
    }
  };

  // Handle Delete Question Topic
  const handleDeleteQuestion = (q: AdminQuestionRow) => {
    setDeletingQuestionRow(q);
  };

  const confirmDeleteQuestion = async () => {
    if (!deletingQuestionRow) return;
    const q = deletingQuestionRow;
    setDeletingQuestionRow(null);
    setLoadingQuestions(true);
    try {
      await deleteAdminQuestion({ rowIndex: q.rowIndex, comment: q.comment });
      setNotice({ text: `تم حذف الدرس (${q.comment || q.word}) بنجاح! 🎉`, type: 'success' });
      await loadQuestionsData();
    } catch (err: any) {
      console.error(err);
      setNotice({ text: 'خطأ أثناء حذف الدرس: ' + (err.message || ''), type: 'error' });
      setLoadingQuestions(false);
    }
  };

  // Handle Save Answer Update
  const handleSaveAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnswer) return;

    setSavingAnswer(true);
    try {
      await updateAdminAnswer({
        rowIndex: editingAnswer.rowIndex,
        sheetNumber: editingAnswer.sheetNumber,
        username: editingAnswer.username,
        comment: editingAnswer.comment,
        videoAnswersResult: editingAnswer.videoAnswersResult,
        audioAnswersResult: editingAnswer.audioAnswersResult,
        finalResult: editingAnswer.finalResult,
        audioUploadCount: editingAnswer.audioUploadCount,
        imageUploadCount: editingAnswer.imageUploadCount,
        completed: editingAnswer.completed,
        retryResetCount: editingAnswer.retryResetCount,
      });
      setNotice({ text: 'تم تحديث بيانات الطالب بنجاح! 🎉', type: 'success' });
      setEditingAnswer(null);
      await loadAnswersData();
    } catch (err: any) {
      console.error(err);
      setNotice({ text: 'خطأ أثناء تحديث بيانات الطالب: ' + (err.message || ''), type: 'error' });
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleCreateNewQuestion = () => {
    setEditingQuestion({
      word: '',
      comment: '',
      youtubeUrl: '',
      explainSound: '',
      fullSound: '',
      rawLinks: '',
      image: '',
      totalQuestionsCount: 15,
      showResult: 'نعم',
      instruction: '',
      allowRecording: 'لا',
      maxRecordingTime: 10,
      retryCount: 1,
      allowUpload: 'لا',
      defaultRetryResetCount: 1,
      startDate: '',
      endDate: '',
      questions: [],
      audioQuestions: [],
    });
    setModalSubTab('links');
  };

  // Question manipulation helpers
  const addVideoQuestion = () => {
    if (!editingQuestion) return;
    const current = editingQuestion.questions || [];
    if (current.length >= 15) {
      alert('الحد الأقصى لأسئلة الفيديو هو 15 سؤالاً.');
      return;
    }
    const newQ: AdminQuestionItem = {
      time: 0,
      image: '',
      question: '',
      options: 'نص',
      correctAnswer: '',
    };
    const updated = [...current, newQ];
    setEditingQuestion({ ...editingQuestion, questions: updated });
    setExpandedVideoIndex(updated.length - 1);
  };

  const removeVideoQuestion = (idx: number) => {
    if (!editingQuestion) return;
    const current = editingQuestion.questions || [];
    const updated = current.filter((_, i) => i !== idx);
    setEditingQuestion({ ...editingQuestion, questions: updated });
  };

  const updateVideoQuestion = (idx: number, field: keyof AdminQuestionItem, value: any) => {
    if (!editingQuestion) return;
    const current = editingQuestion.questions || [];
    const updated = [...current];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditingQuestion({ ...editingQuestion, questions: updated });
  };

  const addAudioQuestion = () => {
    if (!editingQuestion) return;
    const current = editingQuestion.audioQuestions || [];
    if (current.length >= 2) {
      alert('الحد الأقصى لأسئلة الصوت هو سؤالان فقط.');
      return;
    }
    const newQ: AdminQuestionItem = {
      time: 0,
      image: '',
      question: '',
      options: 'نص',
      correctAnswer: '',
    };
    const updated = [...current, newQ];
    setEditingQuestion({ ...editingQuestion, audioQuestions: updated });
    setExpandedAudioIndex(updated.length - 1);
  };

  const removeAudioQuestion = (idx: number) => {
    if (!editingQuestion) return;
    const current = editingQuestion.audioQuestions || [];
    const updated = current.filter((_, i) => i !== idx);
    setEditingQuestion({ ...editingQuestion, audioQuestions: updated });
  };

  const updateAudioQuestion = (idx: number, field: keyof AdminQuestionItem, value: any) => {
    if (!editingQuestion) return;
    const current = editingQuestion.audioQuestions || [];
    const updated = [...current];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditingQuestion({ ...editingQuestion, audioQuestions: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="w-full max-w-5xl h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative text-slate-100"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
                <span>قسم التحكم الإداري</span>
                <span className="text-xs px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-full font-bold">إدارة الشيت</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">التحكم المباشر في ورقة الأسئلة (Questions) وورقة إجابات الطلاب (Answers)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notice Alert */}
        {notice && (
          <div className="p-3 px-6 shrink-0">
            <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
              notice.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span className="font-bold">{notice.text}</span>
              </div>
              <button onClick={() => setNotice(null)} className="text-xs underline cursor-pointer">إغلاق</button>
            </div>
          </div>
        )}

        {/* Tab Switcher Header */}
        <div className="px-4 sm:px-6 pt-3 bg-slate-950/30 border-b border-slate-800 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-5 py-3 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-slate-900 text-amber-400 border-amber-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>ورقة الأسئلة (Questions)</span>
            <span className="px-2 py-0.5 text-[10px] bg-slate-800 rounded-full font-mono">{questions.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('answers')}
            className={`px-5 py-3 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'answers'
                ? 'bg-slate-900 text-amber-400 border-amber-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>ورقة الإجابات والطلاب (Answers)</span>
            <span className="px-2 py-0.5 text-[10px] bg-slate-800 rounded-full font-mono">{answers.length}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {/* TAB 1: QUESTIONS SHEET */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                {/* Search */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    placeholder="بحث بعنوان الدرس أو المعرف الربطي..."
                    className="w-full pr-10 pl-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Refresh and Add button */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={loadQuestionsData}
                    disabled={loadingQuestions}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    title="تحديث القائمة"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingQuestions ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={handleCreateNewQuestion}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-amber-500/10 cursor-pointer transition-all active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة درس / سؤال جديد</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              {loadingQuestions ? (
                <div className="py-20 text-center">
                  <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-400 font-bold">جاري تحميل بيانات ورقة Questions...</p>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-400">لا توجد دروس أو أسئلة مطابقة للبحث</p>
                </div>
              ) : (
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                        <tr>
                          <th className="py-3 px-4 w-16 text-center"># (الصف)</th>
                          <th className="py-3 px-4">الموضوع / العنوان (العمود A)</th>
                          <th className="py-3 px-4">المعرف الربطي (العمود D)</th>
                          <th className="py-3 px-4">فترة الظهور والإخفاء (DB / DC)</th>
                          <th className="py-3 px-4 text-center w-48">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredQuestions.map((q, idx) => (
                          <tr key={q.rowIndex || idx} className="hover:bg-slate-900/60 transition-colors">
                            <td className="py-3.5 px-4 text-center text-slate-500 font-mono">
                              {q.rowIndex || idx + 1}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-200">
                              {q.word || 'بدون عنوان'}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-amber-400 font-mono dir-ltr text-right">
                              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs inline-block">
                                {q.comment || 'بدون معرف'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-400">
                              <div className="flex flex-col gap-1 text-[11px] font-mono">
                                <span className="flex items-center gap-1.5 text-emerald-400">
                                  <Calendar className="w-3 h-3" />
                                  <span>ظهور: {q.startDate ? q.startDate : 'دائم (غير محدد)'}</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-rose-400">
                                  <Clock className="w-3 h-3" />
                                  <span>إخفاء: {q.endDate ? q.endDate : 'دائم (غير محدد)'}</span>
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingQuestion({ ...q });
                                    setModalSubTab('links');
                                  }}
                                  className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                                  title="تعديل تفاصيل الدرس"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>تعديل</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(q)}
                                  className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500 hover:text-white text-rose-400 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                                  title="حذف الدرس"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ANSWERS SHEET */}
          {activeTab === 'answers' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                {/* Search */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={answerSearch}
                    onChange={(e) => setAnswerSearch(e.target.value)}
                    placeholder="بحث باسم الطالب أو الصف أو الدرس..."
                    className="w-full pr-10 pl-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      الكل
                    </button>
                    <button
                      onClick={() => setStatusFilter('completed')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${statusFilter === 'completed' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      تم الإكمال
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${statusFilter === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      غير مكتمل
                    </button>
                  </div>

                  <button
                    onClick={loadAnswersData}
                    disabled={loadingAnswers}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    title="تحديث البيانات"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingAnswers ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Answers List */}
              {loadingAnswers ? (
                <div className="py-20 text-center">
                  <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-400 font-bold">جاري تحميل إجابات الطلاب من ورقة Answers...</p>
                </div>
              ) : filteredAnswers.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
                  <GraduationCap className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-400">لا توجد سجلات طلاب مطابقة للبحث</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/50">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3 w-16 text-center"># (الصف)</th>
                        <th className="p-3">اسم الطالب (العمود B)</th>
                        <th className="p-3">رقم الطالب / الصف (العمود A)</th>
                        <th className="p-3">معرف الدرس (العمود C)</th>
                        <th className="p-3 text-center w-36">التفاصيل والتعديل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {filteredAnswers.map((a) => (
                        <tr
                          key={a.rowIndex}
                          onClick={() => setEditingAnswer({ ...a })}
                          className="hover:bg-amber-500/5 cursor-pointer transition-colors group"
                        >
                          <td className="p-3 text-center font-mono text-slate-500 font-bold">{a.rowIndex}</td>
                          <td className="p-3 font-extrabold text-slate-100 group-hover:text-amber-300 transition-colors">
                            {a.username}
                          </td>
                          <td className="p-3 font-semibold text-slate-300">{a.sheetNumber}</td>
                          <td className="p-3 text-amber-400 font-mono font-bold">{a.comment}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAnswer({ ...a });
                              }}
                              className="px-3 py-1.5 bg-amber-500/15 group-hover:bg-amber-500 group-hover:text-slate-950 text-amber-300 font-bold rounded-lg transition-all text-[11px] inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>عرض التفاصيل</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL: EDIT QUESTION / LESSON */}
        <AnimatePresence>
          {editingQuestion && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md" dir="rtl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-3xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col overflow-hidden text-right relative"
              >
                {/* Modal Title */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
                  <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                    <span>{editingQuestion.rowIndex ? `تعديل درس صف #${editingQuestion.rowIndex}` : 'إضافة درس / سؤال جديد'}</span>
                  </h3>
                  <button onClick={() => setEditingQuestion(null)} className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 rounded-xl cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sub-tabs for Modal (3 Sections) */}
                <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-4 shrink-0 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setModalSubTab('links')}
                    className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      modalSubTab === 'links'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>1- قسم الروابط</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalSubTab('settings')}
                    className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      modalSubTab === 'settings'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <SettingsIcon className="w-3.5 h-3.5" />
                    <span>2- إعدادات الدروس</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalSubTab('questions')}
                    className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      modalSubTab === 'questions'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>3- أسئلة الفيديو والصوت</span>
                    <span className="px-1.5 py-0.2 bg-slate-900/40 text-[10px] rounded-full font-mono">
                      {(editingQuestion.questions?.length || 0) + (editingQuestion.audioQuestions?.length || 0)}
                    </span>
                  </button>
                </div>

                <form onSubmit={handleSaveQuestion} className="flex-grow overflow-y-auto space-y-4 pr-1 text-xs custom-scrollbar">
                  {/* SECTION 1: LINKS */}
                  {modalSubTab === 'links' && (
                    <div className="space-y-3.5">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl font-semibold text-xs">
                        قسم الروابط: يحتوي على العناوين والروابط الأساسية للميديا والدرس
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">الكلمة / عنوان الدرس (العمود A):</label>
                          <input
                            type="text"
                            value={editingQuestion.word}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, word: e.target.value })}
                            placeholder="مثال: درس القراءة والأحرف"
                            required
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">المعرف الربطي للدرس (العمود D):</label>
                          <input
                            type="text"
                            value={editingQuestion.comment}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, comment: e.target.value })}
                            placeholder="مثال: L1 أو Word_01"
                            required
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 dir-ltr"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">فيديو الدرس (العمود G):</label>
                        <input
                          type="text"
                          value={editingQuestion.youtubeUrl || ''}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, youtubeUrl: e.target.value })}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 dir-ltr"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">درس صوتي / الشرح الصوتي (العمود F):</label>
                        <input
                          type="text"
                          value={editingQuestion.explainSound || ''}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, explainSound: e.target.value })}
                          placeholder="https://drive.google.com/..."
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 dir-ltr"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">درس استماع / الصوت الكلي (العمود C):</label>
                        <input
                          type="text"
                          value={editingQuestion.fullSound || ''}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, fullSound: e.target.value })}
                          placeholder="رابط الصوت الكامل للكلمة"
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 dir-ltr"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">درس استماع حروف - مقسمة بفاصلة (العمود B):</label>
                        <textarea
                          value={editingQuestion.rawLinks || ''}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, rawLinks: e.target.value })}
                          placeholder="https://link1.mp3, https://link2.mp3"
                          rows={2}
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 dir-ltr"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">صورة توضيحية (العمود E):</label>
                        <input
                          type="text"
                          value={editingQuestion.image || ''}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, image: e.target.value })}
                          placeholder="رابط الصورة التوضيحية للدرس"
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 dir-ltr"
                        />
                      </div>
                    </div>
                  )}

                  {/* SECTION 2: SETTINGS */}
                  {modalSubTab === 'settings' && (
                    <div className="space-y-3.5">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl font-semibold text-xs">
                        قسم إعدادات الدروس: التحكم في مواعيد ظهور وإخفاء الدرس، ومحددات الأسئلة وتفضيلات الواجبات
                      </div>

                      {/* قسم جدولة تاريخ الظهور والإخفاء */}
                      <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                          <Calendar className="w-4 h-4" />
                          <span>جدولة ظهور وإخفاء الدرس (تاريخ الظهور وتاريخ الإخفاء)</span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          حدّد تاريخ ووقت بداية ظهور الدرس للطلبة (العمود DB) وتاريخ ووقت إخفائه التلقائي (العمود DC):
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-200 font-bold mb-1">
                              تاريخ ظهور الدرس (العمود DB):
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingQuestion.startDate || ''}
                                onChange={(e) => setEditingQuestion({ ...editingQuestion, startDate: e.target.value })}
                                placeholder="مثال: 2026-08-01 08:00"
                                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 font-mono text-xs"
                              />
                              <input
                                type="datetime-local"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    setEditingQuestion({ ...editingQuestion, startDate: e.target.value.replace('T', ' ') });
                                  }
                                }}
                                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 cursor-pointer text-xs shrink-0"
                                title="اختر من التقويم"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-200 font-bold mb-1">
                              تاريخ إخفاء الدرس (العمود DC):
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingQuestion.endDate || ''}
                                onChange={(e) => setEditingQuestion({ ...editingQuestion, endDate: e.target.value })}
                                placeholder="مثال: 2026-08-10 23:59"
                                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 font-mono text-xs"
                              />
                              <input
                                type="datetime-local"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    setEditingQuestion({ ...editingQuestion, endDate: e.target.value.replace('T', ' ') });
                                  }
                                }}
                                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 cursor-pointer text-xs shrink-0"
                                title="اختر من التقويم"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">عدد الأسئلة لأسئلة الفيديو (العمود I):</label>
                          <input
                            type="number"
                            min="0"
                            value={editingQuestion.totalQuestionsCount ?? 15}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, totalQuestionsCount: parseInt(e.target.value) || 0 })}
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">إظهار الإجابة الصحيحة (العمود H):</label>
                          <select
                            value={editingQuestion.showResult || 'نعم'}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, showResult: e.target.value })}
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                          >
                            <option value="نعم">نعم (إظهار النتيجة فوراً)</option>
                            <option value="لا">لا (إخفاء النتيجة)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">نص فوق درس الاستماع (العمود CQ):</label>
                        <input
                          type="text"
                          value={editingQuestion.instruction || ''}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, instruction: e.target.value })}
                          placeholder="مثال: يرجى الاستماع جيداً للحروف ثم الإجابة"
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">إتاحة تسجيل الصوت (العمود CR):</label>
                          <select
                            value={editingQuestion.allowRecording || 'لا'}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, allowRecording: e.target.value })}
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                          >
                            <option value="نعم">نعم (مطلوب تسليم واجبي صوتاً)</option>
                            <option value="لا">لا (غير مطلوب)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">أقصى وقت تسجيل بالثواني (العمود CT):</label>
                          <input
                            type="number"
                            min="5"
                            value={editingQuestion.maxRecordingTime ?? 10}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, maxRecordingTime: parseInt(e.target.value) || 10 })}
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">إعادة تسجيل صوت / عدد المحاولات (العمود CU):</label>
                          <input
                            type="number"
                            min="0"
                            value={editingQuestion.retryCount ?? 1}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, retryCount: parseInt(e.target.value) || 0 })}
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">إتاحة رفع صورة (العمود CY):</label>
                          <select
                            value={editingQuestion.allowUpload || 'لا'}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, allowUpload: e.target.value })}
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                          >
                            <option value="نعم">نعم (مطلوب رفع صورة واجبي)</option>
                            <option value="لا">لا (غير مطلوب)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">عدد إعادة إرسال الإجابة من جديد (العمود DA):</label>
                        <input
                          type="number"
                          min="0"
                          value={editingQuestion.defaultRetryResetCount ?? 1}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, defaultRetryResetCount: parseInt(e.target.value) || 0 })}
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* SECTION 3: INTERACTIVE QUESTIONS */}
                  {modalSubTab === 'questions' && (
                    <div className="space-y-5">
                      {/* Section Add Buttons */}
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                        <span className="font-bold text-xs text-slate-300">إضافة أسئلة تفاعلية للفيديو والصوت:</span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={addVideoQuestion}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة سؤال فيديو (حتى 15)</span>
                          </button>

                          <button
                            type="button"
                            onClick={addAudioQuestion}
                            className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة سؤال صوتي (سؤالان)</span>
                          </button>
                        </div>
                      </div>

                      {/* Video Questions Accordion List */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-amber-400 flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          <span>أسئلة الفيديو (الأعمدة J إلى CF) - الإجمالي: {(editingQuestion.questions || []).length}/15</span>
                        </h4>

                        {(!editingQuestion.questions || editingQuestion.questions.length === 0) ? (
                          <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-xs">
                            لا توجد أسئلة فيديو مضافة لهذا الدرس بعد. انقر فوق "إضافة سؤال فيديو" للأعلى.
                          </div>
                        ) : (
                          editingQuestion.questions.map((q, qIdx) => {
                            const isExpanded = expandedVideoIndex === qIdx;
                            return (
                              <div key={qIdx} className="border border-slate-800 rounded-2xl bg-slate-950/80 overflow-hidden transition-all">
                                {/* Accordion Header */}
                                <div
                                  onClick={() => setExpandedVideoIndex(isExpanded ? null : qIdx)}
                                  className="p-3 bg-slate-900/90 hover:bg-slate-850 flex items-center justify-between gap-3 cursor-pointer select-none"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-6 h-6 bg-amber-500/20 text-amber-300 font-bold font-mono text-xs rounded-lg flex items-center justify-center border border-amber-500/30">
                                      {qIdx + 1}
                                    </span>
                                    <div>
                                      <span className="font-bold text-xs text-slate-200">
                                        {q.question.trim() ? q.question : `سؤال فيديو #${qIdx + 1}`}
                                      </span>
                                      <span className="text-[10px] text-slate-500 mr-2 font-mono">({q.time} ثانية)</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeVideoQuestion(qIdx);
                                      }}
                                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                      title="حذف السؤال"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                  </div>
                                </div>

                                {/* Accordion Body */}
                                {isExpanded && (
                                  <div className="p-3.5 space-y-3 bg-slate-950 border-t border-slate-800/80 text-xs">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-slate-400 font-bold mb-1">توقيت ظهور السؤال بالفيديو بالثواني (time):</label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          value={q.time}
                                          onChange={(e) => updateVideoQuestion(qIdx, 'time', parseFloat(e.target.value) || 0)}
                                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-slate-400 font-bold mb-1">رابط صورة السؤال (questionImage):</label>
                                        <input
                                          type="text"
                                          value={q.image || ''}
                                          onChange={(e) => updateVideoQuestion(qIdx, 'image', e.target.value)}
                                          placeholder="https://..."
                                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 dir-ltr"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-slate-400 font-bold mb-1">نص السؤال (questionText):</label>
                                      <input
                                        type="text"
                                        value={q.question}
                                        onChange={(e) => updateVideoQuestion(qIdx, 'question', e.target.value)}
                                        placeholder="اكتب نص السؤال هنا..."
                                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-slate-400 font-bold mb-1">الخيارات مقسمة بفاصلة أو كلمة "نص" (options):</label>
                                        <input
                                          type="text"
                                          value={q.options}
                                          onChange={(e) => updateVideoQuestion(qIdx, 'options', e.target.value)}
                                          placeholder="خيار1,خيار2,خيار3 أو كلمة نص"
                                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-slate-400 font-bold mb-1">الإجابة الصحيحة (correctAnswer):</label>
                                        <input
                                          type="text"
                                          value={q.correctAnswer}
                                          onChange={(e) => updateVideoQuestion(qIdx, 'correctAnswer', e.target.value)}
                                          placeholder="الإجابة الصحيحة بالضبط"
                                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Audio Questions Accordion List */}
                      <div className="space-y-2 pt-3 border-t border-slate-800">
                        <h4 className="text-xs font-black text-sky-400 flex items-center gap-2">
                          <Volume2 className="w-4 h-4" />
                          <span>أسئلة الصوت الاستماعية (الأعمدة CG إلى CP) - الإجمالي: {(editingQuestion.audioQuestions || []).length}/2</span>
                        </h4>

                        {(!editingQuestion.audioQuestions || editingQuestion.audioQuestions.length === 0) ? (
                          <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-xs">
                            لا توجد أسئلة صوت مضافة لهذه الكلمة بعد. انقر فوق "إضافة سؤال صوتي" للأعلى.
                          </div>
                        ) : (
                          editingQuestion.audioQuestions.map((aq, aqIdx) => {
                            const isExpanded = expandedAudioIndex === aqIdx;
                            return (
                              <div key={aqIdx} className="border border-slate-800 rounded-2xl bg-slate-950/80 overflow-hidden transition-all">
                                {/* Accordion Header */}
                                <div
                                  onClick={() => setExpandedAudioIndex(isExpanded ? null : aqIdx)}
                                  className="p-3 bg-slate-900/90 hover:bg-slate-850 flex items-center justify-between gap-3 cursor-pointer select-none"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-6 h-6 bg-sky-500/20 text-sky-300 font-bold font-mono text-xs rounded-lg flex items-center justify-center border border-sky-500/30">
                                      {aqIdx + 1}
                                    </span>
                                    <div>
                                      <span className="font-bold text-xs text-slate-200">
                                        {aq.question.trim() ? aq.question : `سؤال صوتي #${aqIdx + 1}`}
                                      </span>
                                      <span className="text-[10px] text-slate-500 mr-2 font-mono">({aq.time} ثانية)</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeAudioQuestion(aqIdx);
                                      }}
                                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                      title="حذف السؤال"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                  </div>
                                </div>

                                {/* Accordion Body */}
                                {isExpanded && (
                                  <div className="p-3.5 space-y-3 bg-slate-950 border-t border-slate-800/80 text-xs">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-slate-400 font-bold mb-1">توقيت ظهور السؤال بالثواني (time):</label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          value={aq.time}
                                          onChange={(e) => updateAudioQuestion(aqIdx, 'time', parseFloat(e.target.value) || 0)}
                                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-slate-400 font-bold mb-1">رابط صورة السؤال (questionImage):</label>
                                        <input
                                          type="text"
                                          value={aq.image || ''}
                                          onChange={(e) => updateAudioQuestion(aqIdx, 'image', e.target.value)}
                                          placeholder="https://..."
                                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 dir-ltr"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-slate-400 font-bold mb-1">نص السؤال (questionText):</label>
                                      <input
                                        type="text"
                                        value={aq.question}
                                        onChange={(e) => updateAudioQuestion(aqIdx, 'question', e.target.value)}
                                        placeholder="اكتب نص السؤال هنا..."
                                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-slate-400 font-bold mb-1">الخيارات مقسمة بفاصلة أو كلمة "نص" (options):</label>
                                        <input
                                          type="text"
                                          value={aq.options}
                                          onChange={(e) => updateAudioQuestion(aqIdx, 'options', e.target.value)}
                                          placeholder="خيار1,خيار2,خيار3 أو كلمة نص"
                                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-slate-400 font-bold mb-1">الإجابة الصحيحة (correctAnswer):</label>
                                        <input
                                          type="text"
                                          value={aq.correctAnswer}
                                          onChange={(e) => updateAudioQuestion(aqIdx, 'correctAnswer', e.target.value)}
                                          placeholder="الإجابة الصحيحة بالضبط"
                                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Form Footer Buttons */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(null)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                    >
                      إلغاء
                    </button>

                    <button
                      type="submit"
                      disabled={savingQuestion}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {savingQuestion ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>حفظ الدرس والأسئلة</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: VIEW DETAILS & EDIT STUDENT ANSWER */}
        <AnimatePresence>
          {editingAnswer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md" dir="rtl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col overflow-y-auto custom-scrollbar text-right"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-100">تفاصيل الدرس للطالب (صف #{editingAnswer.rowIndex})</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">عرض السجلات وحالة الدرس وإجراء التعديلات المطلوبة</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingAnswer(null)} className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800 rounded-xl cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* SECTION 1: READ-ONLY INFORMATION (بيانات لا يمكن التعديل عليها) */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-500" />
                      <span>بيانات لا يمكن التعديل عليها (عرض فقط):</span>
                    </h4>
                    <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-md font-bold border border-slate-800">
                      محمية التعديل
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* 1. اسم الطالب (العمود B) */}
                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">اسم الطالب (العمود B)</span>
                      <span className="font-extrabold text-slate-100 text-sm block truncate">
                        {editingAnswer.username || 'بدون اسم'}
                      </span>
                    </div>

                    {/* 2. رقم الطالب / الصف (العمود A) */}
                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">رقم الطالب / الصف (العمود A)</span>
                      <span className="font-extrabold text-slate-200 text-xs block font-mono">
                        {editingAnswer.sheetNumber || 'غير محدد'}
                      </span>
                    </div>

                    {/* 3. معرف الدرس (العمود C) */}
                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">معرف الدرس (العمود C)</span>
                      <span className="font-extrabold text-amber-400 font-mono text-xs block dir-ltr text-right">
                        {editingAnswer.comment || 'غير محدد'}
                      </span>
                    </div>

                    {/* 4. نتائج إجابات الفيديو (العمود U) */}
                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">نتائج إجابات الفيديو (العمود U)</span>
                      <span className="font-extrabold text-emerald-400 font-mono text-xs block">
                        {editingAnswer.videoAnswersResult || editingAnswer.fullAudioScore || 'لا توجد إجابات'}
                      </span>
                    </div>

                    {/* 5. نتائج إجابات الصوت (العمود Z) */}
                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">نتائج إجابات الصوت (العمود Z)</span>
                      <span className="font-extrabold text-sky-400 font-mono text-xs block">
                        {editingAnswer.audioAnswersResult || editingAnswer.letterListenScore || 'لا توجد إجابات'}
                      </span>
                    </div>

                    {/* 6. النتيجة الكلية (العمود AM) */}
                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">النتيجة الكلية (العمود AM)</span>
                      <span className="font-extrabold text-amber-300 font-mono text-xs block">
                        {editingAnswer.finalResult || 'غير مسجلة'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: EDITABLE FIELDS FORM (حقول يمكن تعديلها) */}
                <form onSubmit={handleSaveAnswer} className="space-y-4 text-xs">
                  <div className="border-t border-slate-800 pt-3">
                    <h4 className="text-xs font-black text-amber-400 mb-3 flex items-center gap-1.5">
                      <Edit className="w-4 h-4 text-amber-400" />
                      <span>حقول قابلة للتعديل والتحكم:</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* عدد إرسال ملف الصوت (العمود AK) */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">عدد إرسال ملف الصوت (العمود AK):</label>
                      <input
                        type="number"
                        min="0"
                        value={editingAnswer.audioUploadCount ?? 0}
                        onChange={(e) => setEditingAnswer({ ...editingAnswer, audioUploadCount: parseInt(e.target.value) || 0 })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 font-mono font-bold"
                      />
                    </div>

                    {/* عدد إرسال ملف الصورة (العمود AL) */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">عدد إرسال ملف الصورة (العمود AL):</label>
                      <input
                        type="number"
                        min="0"
                        value={editingAnswer.imageUploadCount ?? 0}
                        onChange={(e) => setEditingAnswer({ ...editingAnswer, imageUploadCount: parseInt(e.target.value) || 0 })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* الحالة (AO) : تم / اعادة / فراغ */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">الحالة (العمود AO):</label>
                      <select
                        value={editingAnswer.completed || ''}
                        onChange={(e) => setEditingAnswer({ ...editingAnswer, completed: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 font-bold text-amber-300"
                      >
                        <option value="تم">تم</option>
                        <option value="اعادة">اعادة</option>
                        <option value="">فراغ (لا شيء)</option>
                      </select>
                    </div>

                    {/* عدد الإعادات المتبقية (العمود AP) */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">عدد الإعادات المتبقية (العمود AP):</label>
                      <input
                        type="number"
                        min="0"
                        value={editingAnswer.retryResetCount ?? 0}
                        onChange={(e) => setEditingAnswer({ ...editingAnswer, retryResetCount: parseInt(e.target.value) || 0 })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 font-mono font-bold text-amber-400"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingAnswer(null)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                    >
                      إلغاء
                    </button>

                    <button
                      type="submit"
                      disabled={savingAnswer}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-amber-500/10"
                    >
                      {savingAnswer ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>حفظ التعديلات</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
          {/* Delete Confirmation Modal */}
          {deletingQuestionRow && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl dir-rtl text-slate-100"
              >
                <div className="flex items-center gap-3 text-rose-400 mb-4">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">تأكيد حذف الدرس</h3>
                    <p className="text-xs text-slate-400 mt-0.5">عملية الحذف نهائية من ورقة الأسئلة</p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  هل أنت متأكد من حذف الموضوع / الدرس (<span className="font-bold text-amber-400">{deletingQuestionRow.comment || deletingQuestionRow.word}</span>) بالكامل من ورقة الأسئلة؟
                </p>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setDeletingQuestionRow(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={confirmDeleteQuestion}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs cursor-pointer flex items-center gap-2 shadow-lg shadow-rose-600/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>تأكيد الحذف النهائي</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
