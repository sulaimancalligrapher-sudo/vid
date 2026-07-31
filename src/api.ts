import { WordData, AdminQuestionRow, AdminAnswerRow, Question, AdminQuestionItem } from './types';

// Helper to get Web App URL from localStorage or environment variables
export function getWebAppUrl(): string {
  // 1. Check localStorage first (allows individual overrides / testing)
  const localUrl = localStorage.getItem('webAppUrl');
  if (localUrl && localUrl.trim().length > 0) {
    return localUrl.trim();
  }

  // 2. Check Vite Environment Variable (perfect for production deployment like Vercel)
  const envUrl = (import.meta as any).env?.VITE_WEB_APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim();
  }

  // 3. Fallback hardcoded URL if you prefer to paste it directly here
  const fallbackUrl: string = ''; // يمكنك كتابة رابط الـ Apps Script هنا مباشرة كخيار بديل دائم
  if (fallbackUrl && fallbackUrl.trim().length > 0) {
    return fallbackUrl.trim();
  }

  return '';
}

// Check if the API URL is configured
export function isApiConfigured(): boolean {
  return getWebAppUrl().trim().length > 0;
}

// Simple fetch wrapper that handles CORS for Google Apps Script
async function fetchGas(params: Record<string, string>, method: 'GET' | 'POST' = 'GET', postBody?: any) {
  const baseUrl = getWebAppUrl().trim();
  if (!baseUrl) {
    throw new Error('لم يتم تكوين رابط API الخاص بـ Google Sheet بعد.');
  }

  // Construct query string for GET parameters or action specification
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    urlParams.append(key, value);
  });

  const url = `${baseUrl}?${urlParams.toString()}`;

  const options: RequestInit = {
    method: method,
    redirect: 'follow', // Crucial for GAS Web App redirects
  };

  if (method === 'POST' && postBody) {
    // To avoid CORS preflight (OPTIONS) requests which GAS does not support,
    // we send the content as text/plain. The backend will parse it as JSON.
    options.body = JSON.stringify(postBody);
    options.headers = {
      'Content-Type': 'text/plain;charset=utf-8',
    };
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`خطأ في خادم Google Apps Script: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('GAS API Fetch Error:', error);
    throw new Error(error.message || 'فشل الاتصال بخادم Google Sheets. يرجى التحقق من الرابط والاتصال.');
  }
}

// 1. Authenticate / Login Student
export async function loginStudent(username: string, sheetNumber: string, deviceId: string, coords: { lat: number | null, lng: number | null }) {
  return fetchGas({ action: 'loginUser' }, 'POST', {
    username,
    sheet_number: sheetNumber,
    deviceId,
    lat: coords.lat,
    lng: coords.lng,
  });
}

// Helper to clean string & remove weird symbols / URL encoding
function cleanString(str: any): string {
  if (str === null || str === undefined) return '';
  let s = String(str).trim();
  if (s === 'undefined' || s === 'null') return '';
  if (s.includes('%')) {
    try {
      s = decodeURIComponent(s);
    } catch (e) {}
  }
  return s.trim();
}

export function sanitizeQuestionOptions(options: any): string[] {
  if (!options) return [];
  if (Array.isArray(options)) {
    return options.map(cleanString).filter(o => o.length > 0 && o !== 'نص' && o !== 'undefined');
  }
  const rawStr = cleanString(options);
  if (!rawStr || rawStr === 'نص') return [];

  return rawStr
    .split(/[,;]/)
    .map(s => cleanString(s))
    .filter(s => s.length > 0 && s !== 'نص' && s !== 'undefined');
}

export function sanitizeQuestions<T extends { question?: string; text?: string; time?: number; image?: string; videoUrl?: string; options?: any; correctAnswer?: string; slotIndex?: number }>(qs?: T[]): T[] {
  if (!qs || !Array.isArray(qs)) return [];

  const cleaned: T[] = [];
  const seenSignatures = new Set<string>();

  for (const q of qs) {
    if (!q) continue;

    let qText = cleanString(q.question || q.text);
    const img = cleanString(q.image || q.videoUrl);
    const timeVal = typeof q.time === 'number' ? q.time : (parseFloat(String(q.time)) || 0);
    const opts = sanitizeQuestionOptions(q.options);

    // If qText is a placeholder like "NONE", "EMPTY", "-", "فارغ", treat as empty
    const lowerText = qText.toLowerCase();
    if (['none', 'empty', '-', 'فارغ', 'لا يوجد', 'null', 'undefined'].includes(lowerText)) {
      qText = '';
    }

    // Filter out completely empty question slots
    if (!qText && !img && opts.length === 0 && timeVal === 0) {
      continue;
    }

    // Deduplicate questions based on unique signature
    const signature = `${timeVal}_${qText.toLowerCase()}_${img.toLowerCase()}_${opts.join('|').toLowerCase()}`;
    if (seenSignatures.has(signature)) {
      continue;
    }
    seenSignatures.add(signature);

    const cleanedQ: any = {
      ...q,
      question: qText,
      image: img,
      time: timeVal,
      options: opts,
      correctAnswer: cleanString(q.correctAnswer)
    };

    cleaned.push(cleanedQ as T);
  }

  return cleaned;
}

export function getQuestionSignature(q: any): string {
  if (!q) return '';
  const qText = cleanString(q.question || q.text).toLowerCase();
  const img = cleanString(q.image || q.videoUrl).toLowerCase();
  const timeVal = typeof q.time === 'number' ? q.time : (parseFloat(String(q.time)) || 0);
  const opts = sanitizeQuestionOptions(q.options).join('|').toLowerCase();
  const ans = cleanString(q.correctAnswer).toLowerCase();
  return `${timeVal}_${qText}_${img}_${opts}_${ans}`;
}

export function sanitizeLessonQuestions(questions?: any[], audioQuestions?: any[]): { cleanQuestions: any[]; cleanAudioQuestions: any[] } {
  const cleanAudio = sanitizeQuestions(audioQuestions || []);
  const audioSignatures = new Set(
    cleanAudio
      .map(getQuestionSignature)
      .filter(sig => sig.replace(/^[0_]*$/, '').length > 0)
  );

  const rawVideo = sanitizeQuestions(questions || []);
  const cleanVideo = rawVideo.filter(vq => {
    const sig = getQuestionSignature(vq);
    if (!sig || sig.replace(/^[0_]*$/, '').length === 0) return false;
    return !audioSignatures.has(sig);
  });

  return { cleanQuestions: cleanVideo, cleanAudioQuestions: cleanAudio };
}

export function prepareQuestionsForSaving(qs?: any[], targetCount: number = 15): AdminQuestionItem[] {
  const sanitized = sanitizeQuestions(qs || []);
  const padded: AdminQuestionItem[] = [];

  for (let i = 0; i < targetCount; i++) {
    if (i < sanitized.length) {
      const q = sanitized[i];
      padded.push({
        slotIndex: i + 1,
        time: typeof q.time === 'number' ? q.time : (parseFloat(String(q.time)) || 0),
        image: q.image || '',
        question: q.question || '',
        options: Array.isArray(q.options) ? q.options.join(', ') : (q.options || ''),
        correctAnswer: q.correctAnswer || ''
      });
    } else {
      // Send explicit clear placeholder 'NONE' so GAS & Google Sheets overwrite old duplicate values in these cells!
      padded.push({
        slotIndex: i + 1,
        time: 0,
        image: '',
        question: '',
        options: '',
        correctAnswer: ''
      });
    }
  }

  return padded;
}

// Helper to map AdminQuestionItem to Question
function mapAdminQuestionsToQuestions(qs?: AdminQuestionItem[]): Question[] {
  if (!qs || !Array.isArray(qs)) return [];
  const sanitized = sanitizeQuestions(qs);
  return sanitized.map(q => ({
    slotIndex: q.slotIndex,
    time: typeof q.time === 'number' ? q.time : (parseFloat(String(q.time)) || 0),
    image: q.image || '',
    question: q.question || '',
    options: Array.isArray(q.options) ? q.options : sanitizeQuestionOptions(q.options),
    correctAnswer: q.correctAnswer || ''
  }));
}

export interface StudentCustomScheduleItem {
  word: string;
  comment?: string;
  startDate: string;
  endDate: string;
  expireAfterDays?: number | string;
}

export interface StudentCustomScheduleData {
  username: string;
  updatedAt: string;
  config: {
    selectedDays: number[];
    startDate: string;
    lessonsPerDay: number;
    autoHideMode: 'days' | 'unifiedDate' | 'none';
    autoExpireAfterDays: number | string;
    autoUnifiedEndDate: string;
  };
  schedule: StudentCustomScheduleItem[];
}

export function getStudentCustomSchedulesMap(): Record<string, StudentCustomScheduleData> {
  try {
    const raw = localStorage.getItem('studentCustomSchedules');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveStudentCustomSchedule(username: string, data: StudentCustomScheduleData) {
  const map = getStudentCustomSchedulesMap();
  const key = username.trim().toLowerCase();
  map[key] = data;
  localStorage.setItem('studentCustomSchedules', JSON.stringify(map));
}

export function deleteStudentCustomSchedule(username: string) {
  const map = getStudentCustomSchedulesMap();
  const key = username.trim().toLowerCase();
  delete map[key];
  localStorage.setItem('studentCustomSchedules', JSON.stringify(map));
}

export function applyStudentCustomScheduleOverrides(lessons: WordData[], username?: string): WordData[] {
  if (!username || !username.trim()) return lessons;
  const map = getStudentCustomSchedulesMap();
  const studentData = map[username.trim().toLowerCase()];
  if (!studentData || !studentData.schedule || studentData.schedule.length === 0) {
    return lessons;
  }

  return lessons.map((lesson, idx) => {
    const match = studentData.schedule.find(
      s => (s.comment && lesson.comment && s.comment.trim() === lesson.comment.trim()) ||
           (s.word && lesson.word && s.word.trim() === lesson.word.trim())
    ) || studentData.schedule[idx];

    if (match) {
      return {
        ...lesson,
        startDate: match.startDate !== undefined ? match.startDate : lesson.startDate,
        endDate: match.endDate !== undefined ? match.endDate : lesson.endDate,
        expireAfterDays: match.expireAfterDays !== undefined ? match.expireAfterDays : lesson.expireAfterDays,
      };
    }
    return lesson;
  });
}

// 2. Fetch Lessons / Words
export async function fetchLessons(sheetName: string, username?: string): Promise<WordData[]> {
  let lessons: WordData[] = [];
  if (!isApiConfigured()) {
    const local = localStorage.getItem('mockAdminQuestions');
    if (local) {
      try {
        const adminQs: AdminQuestionRow[] = JSON.parse(local);
        lessons = adminQs.map(q => ({
          word: q.word,
          fullSound: '',
          letterSounds: [],
          image: q.image || '',
          comment: q.comment || '',
          explainSound: q.explainSound || '',
          youtubeUrl: q.youtubeUrl || '',
          showResult: (q.showResult as 'نعم' | 'لا') || 'نعم',
          totalQuestionsCount: q.totalQuestionsCount || 15,
          defaultRetryResetCount: q.defaultRetryResetCount || 1,
          retryResetCount: q.defaultRetryResetCount || 1,
          instruction: q.instruction || '',
          allowRecording: (q.allowRecording as 'نعم' | 'لا' | '') || '',
          maxRecordingTime: q.maxRecordingTime || 0,
          retryCount: q.retryCount || 0,
          completed: '' as const,
          showPrevButton: q.showPrevButton || '',
          allowUpload: (q.allowUpload as 'نعم' | 'لا' | '') || '',
          startDate: q.startDate || '',
          endDate: q.endDate || '',
          expireAfterDays: q.expireAfterDays !== undefined ? q.expireAfterDays : '',
          questions: mapAdminQuestionsToQuestions(q.questions),
          audioQuestions: mapAdminQuestionsToQuestions(q.audioQuestions)
        }));
      } catch (e) {}
    } else {
      lessons = [
        {
          word: 'الدرس الأول - الحروف',
          fullSound: 'https://example.com/audio1.mp3',
          letterSounds: [],
          image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800',
          comment: 'L1',
          explainSound: '',
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          showResult: 'نعم',
          instruction: '',
          allowRecording: '',
          maxRecordingTime: 0,
          retryCount: 0,
          completed: '',
          showPrevButton: '',
          allowUpload: '',
          retryResetCount: 1,
          questions: [],
          audioQuestions: [],
          startDate: '',
          endDate: ''
        }
      ];
    }
  } else {
    const params: Record<string, string> = { action: 'getWords', sheetName };
    if (username) {
      params.username = username;
    }
    const response = await fetchGas(params);
    if (Array.isArray(response)) {
      lessons = (response as WordData[]).map(lesson => ({
        ...lesson,
        questions: mapAdminQuestionsToQuestions(lesson.questions as any),
        audioQuestions: mapAdminQuestionsToQuestions(lesson.audioQuestions as any)
      }));
    }
  }

  return applyStudentCustomScheduleOverrides(lessons, username);
}

// 3. Save Question Answer (from YouTube Video or Explanation Audio)
export async function saveQuestionAnswer(payload: {
  sheet_number: string;
  username: string;
  word: string;
  youtubeUrl: string;
  question: string;
  selectedAnswer: string;
  isCorrect: boolean | null;
  timestamp: string;
  type: 'video' | 'audio';
  questionIndex: number;
  comment: string;
  explainSound: string;
}) {
  return fetchGas({ action: 'saveAnswer' }, 'POST', payload);
}

// 4. Retrieve Full Audio Listening Score
export async function getFullAudioListeningScore(comment: string, sheetNumber: string, username: string, word?: string): Promise<number> {
  const params: Record<string, string> = {
    action: 'getFullAudioScore',
    comment,
    sheet_number: sheetNumber,
    username,
  };
  if (word) params.word = word;
  const res = await fetchGas(params);
  return res && typeof res.score === 'number' ? res.score : 0;
}

// 5. Save Full Audio Listening Score (100% when completed)
export async function saveFullAudioListeningScore(payload: {
  sheet_number: string;
  username: string;
  word: string;
  score: number;
  timestamp: string;
  comment: string;
}) {
  return fetchGas({ action: 'saveFullAudioScore' }, 'POST', payload);
}

// 6. Retrieve Letter Sound Listening Score
export async function getLetterListeningScore(comment: string, sheetNumber: string, username: string, word?: string): Promise<number> {
  const params: Record<string, string> = {
    action: 'getLetterListenScore',
    comment,
    sheet_number: sheetNumber,
    username,
  };
  if (word) params.word = word;
  const res = await fetchGas(params);
  return res && typeof res.score === 'number' ? res.score : 0;
}

// 7. Save Letter Sound Listening Score
export async function saveLetterListeningScore(payload: {
  sheet_number: string;
  username: string;
  word: string;
  score: number;
  timestamp: string;
  comment: string;
}) {
  return fetchGas({ action: 'saveLetterListenScore' }, 'POST', payload);
}

// 8. Retrieve Saved Recording Link
export async function getSavedRecordingLink(comment: string, sheetNumber: string, username: string, word?: string): Promise<string> {
  const params: Record<string, string> = {
    action: 'getRecordingLink',
    comment,
    sheet_number: sheetNumber,
    username,
  };
  if (word) params.word = word;
  const res = await fetchGas(params);
  return res && res.link ? res.link : '';
}

// 9. Retrieve Saved Image Link
export async function getSavedImageLink(comment: string, sheetNumber: string, username: string, word?: string): Promise<string> {
  const params: Record<string, string> = {
    action: 'getImageLink',
    comment,
    sheet_number: sheetNumber,
    username,
  };
  if (word) params.word = word;
  const res = await fetchGas(params);
  return res && res.link ? res.link : '';
}

// 10. Upload Camera Photo / Image File (returns Drive file URL)
export async function uploadImage(payload: {
  base64Data: string;
  mimeType: string;
  word: string;
  username: string;
  sheet_number: string;
  comment?: string;
}) {
  return fetchGas({ action: 'uploadImageFromBase64' }, 'POST', payload);
}

// 11. Upload Recorded Audio / Audio File (returns Drive file URL)
export async function uploadRecording(payload: {
  base64Data: string;
  mimeType: string;
  word: string;
  username: string;
  sheet_number: string;
  comment?: string;
}) {
  return fetchGas({ action: 'uploadRecordingFromBase64' }, 'POST', payload);
}

// 12. Save Uploaded Image Link metadata to Answers sheet
export async function saveImageLinkMetadata(payload: {
  sheet_number: string;
  username: string;
  comment: string;
  link: string;
  timestamp: string;
}) {
  return fetchGas({ action: 'saveImageLink' }, 'POST', payload);
}

// 13. Save Uploaded Recording Link metadata to Answers sheet
export async function saveRecordingLinkMetadata(payload: {
  sheet_number: string;
  username: string;
  comment: string;
  link: string;
  timestamp: string;
}) {
  return fetchGas({ action: 'saveRecordingLink' }, 'POST', payload);
}

// 14. Mark Lesson Completed in Answers sheet
export async function markLessonCompleted(sheetName: string, lessonIndex: number, username: string, comment?: string) {
  return fetchGas({ action: 'markLessonCompleted' }, 'POST', { sheetName, lessonIndex, username, comment });
}

// 15. Re-open Lesson for Student in Answers sheet
export async function unmarkLessonCompleted(sheetName: string, lessonIndex: number, username?: string, comment?: string) {
  return fetchGas({ action: 'unmarkLessonCompleted' }, 'POST', { sheetName, lessonIndex, username, comment });
}

// 16. Reset State when Student navigates back early without completing
export async function resetToCompleted(sheetName: string, lessonIndex: number, username?: string, comment?: string) {
  return fetchGas({ action: 'resetToCompleted' }, 'POST', { sheetName, lessonIndex, username, comment });
}

// 17. Decrement Student's Lesson Retry Counts
export async function decrementRetryCount(sheetName: string, lessonIndex: number, username?: string, comment?: string) {
  return fetchGas({ action: 'decrementRetryCount' }, 'POST', { sheetName, lessonIndex, username, comment });
}

// 18. Admin: Fetch all questions/lessons from Questions sheet
export async function fetchAdminQuestions(): Promise<AdminQuestionRow[]> {
  if (!isApiConfigured()) {
    const local = localStorage.getItem('mockAdminQuestions');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        return (parsed as AdminQuestionRow[]).map(q => {
          const { cleanQuestions, cleanAudioQuestions } = sanitizeLessonQuestions(q.questions, q.audioQuestions);
          return {
            ...q,
            questions: cleanQuestions,
            audioQuestions: cleanAudioQuestions
          };
        });
      } catch (e) {}
    }
    const initial: AdminQuestionRow[] = [
      {
        rowIndex: 2,
        word: 'الدرس الأول - الحروف',
        comment: 'L1',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        showResult: 'نعم',
        totalQuestionsCount: 15,
        defaultRetryResetCount: 1,
        startDate: '',
        endDate: '',
        expireAfterDays: '',
        questions: [],
        audioQuestions: []
      }
    ];
    localStorage.setItem('mockAdminQuestions', JSON.stringify(initial));
    return initial;
  }
  const response = await fetchGas({ action: 'getAdminQuestions' });
  if (Array.isArray(response)) {
    return (response as AdminQuestionRow[]).map(q => {
      const { cleanQuestions, cleanAudioQuestions } = sanitizeLessonQuestions(q.questions, q.audioQuestions);
      return {
        ...q,
        questions: cleanQuestions,
        audioQuestions: cleanAudioQuestions
      };
    });
  }
  return [];
}

// 19. Admin: Save or Add question/lesson in Questions sheet
export async function saveAdminQuestion(payload: AdminQuestionRow) {
  const { cleanQuestions, cleanAudioQuestions } = sanitizeLessonQuestions(payload.questions, payload.audioQuestions);
  const sanitizedPayload: AdminQuestionRow = {
    ...payload,
    questions: cleanQuestions,
    audioQuestions: cleanAudioQuestions
  };

  if (!isApiConfigured()) {
    const questions = await fetchAdminQuestions();
    let updated = [...questions];
    if (sanitizedPayload.rowIndex && sanitizedPayload.rowIndex > 1) {
      const idx = updated.findIndex(q => q.rowIndex === sanitizedPayload.rowIndex);
      if (idx !== -1) {
        updated[idx] = { ...sanitizedPayload };
      } else {
        updated.push({ ...sanitizedPayload });
      }
    } else if (sanitizedPayload.comment) {
      const idx = updated.findIndex(q => q.comment && q.comment.trim() === sanitizedPayload.comment.trim());
      if (idx !== -1) {
        updated[idx] = { ...sanitizedPayload, rowIndex: updated[idx].rowIndex };
      } else {
        const maxRow = updated.reduce((max, q) => Math.max(max, q.rowIndex || 1), 1);
        const newRowIndex = maxRow + 1;
        updated.push({ ...sanitizedPayload, rowIndex: newRowIndex });
      }
    } else {
      const maxRow = updated.reduce((max, q) => Math.max(max, q.rowIndex || 1), 1);
      const newRowIndex = maxRow + 1;
      updated.push({ ...sanitizedPayload, rowIndex: newRowIndex });
    }
    localStorage.setItem('mockAdminQuestions', JSON.stringify(updated));
    return { success: true };
  }

  // When sending to Google Apps Script (GAS), pad questions to 15 slots and audio to 2 slots
  // to force GAS to clear any old duplicated columns in Google Sheets!
  const gasPayload: AdminQuestionRow = {
    ...payload,
    questions: prepareQuestionsForSaving(cleanQuestions, 15),
    audioQuestions: prepareQuestionsForSaving(cleanAudioQuestions, 2)
  };

  return fetchGas({ action: 'saveAdminQuestion' }, 'POST', gasPayload);
}

// 19b. Admin: Save batch of questions/lessons
export async function saveBatchAdminQuestions(payloadList: AdminQuestionRow[]) {
  const sanitizedList = payloadList.map(item => {
    const { cleanQuestions, cleanAudioQuestions } = sanitizeLessonQuestions(item.questions, item.audioQuestions);
    return {
      ...item,
      questions: cleanQuestions,
      audioQuestions: cleanAudioQuestions
    };
  });

  if (!isApiConfigured()) {
    localStorage.setItem('mockAdminQuestions', JSON.stringify(sanitizedList));
    return { success: true };
  }

  // Send each question update with padded 15 slots so GAS overwrites trailing columns in Sheets
  for (const item of payloadList) {
    const { cleanQuestions, cleanAudioQuestions } = sanitizeLessonQuestions(item.questions, item.audioQuestions);
    const gasItem: AdminQuestionRow = {
      ...item,
      questions: prepareQuestionsForSaving(cleanQuestions, 15),
      audioQuestions: prepareQuestionsForSaving(cleanAudioQuestions, 2)
    };
    await fetchGas({ action: 'saveAdminQuestion' }, 'POST', gasItem);
  }
  return { success: true };
}

// 20. Admin: Delete question/lesson row from Questions sheet
export async function deleteAdminQuestion(payload: { rowIndex?: number; comment?: string }) {
  if (!isApiConfigured()) {
    const questions = await fetchAdminQuestions();
    const updated = questions.filter(q => {
      if (payload.rowIndex && q.rowIndex === payload.rowIndex) return false;
      if (payload.comment && q.comment === payload.comment) return false;
      return true;
    });
    localStorage.setItem('mockAdminQuestions', JSON.stringify(updated));
    return { success: true };
  }
  return fetchGas({ action: 'deleteAdminQuestion' }, 'POST', payload);
}

// 21. Admin: Fetch all student answers from Answers sheet
export async function fetchAdminAnswers(): Promise<AdminAnswerRow[]> {
  if (!isApiConfigured()) {
    const local = localStorage.getItem('mockAdminAnswers');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    const initial: AdminAnswerRow[] = [
      {
        rowIndex: 2,
        sheetNumber: '1',
        username: 'أحمد علي',
        comment: 'L1',
        videoAnswersResult: '15/15',
        audioAnswersResult: '2/2',
        finalResult: '100%',
        audioUploadCount: 1,
        imageUploadCount: 1,
        completed: 'تم',
        retryResetCount: 1
      }
    ];
    localStorage.setItem('mockAdminAnswers', JSON.stringify(initial));
    return initial;
  }
  const response = await fetchGas({ action: 'getAdminAnswers' });
  if (Array.isArray(response)) {
    return response as AdminAnswerRow[];
  }
  return [];
}

// 22. Admin: Update student data in Answers sheet
export async function updateAdminAnswer(payload: {
  rowIndex: number;
  sheetNumber?: string;
  username?: string;
  comment?: string;
  videoAnswersResult?: string;
  audioAnswersResult?: string;
  finalResult?: string;
  audioUploadCount?: number | string;
  imageUploadCount?: number | string;
  completed?: string;
  retryResetCount?: number | null;
}) {
  if (!isApiConfigured()) {
    const answers = await fetchAdminAnswers();
    const updated = answers.map(a => {
      if (a.rowIndex === payload.rowIndex) {
        return { ...a, ...payload };
      }
      return a;
    });
    localStorage.setItem('mockAdminAnswers', JSON.stringify(updated));
    return { success: true };
  }
  return fetchGas({ action: 'updateAdminAnswer' }, 'POST', payload);
}
