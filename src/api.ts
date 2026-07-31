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

// Helper to map AdminQuestionItem to Question
function mapAdminQuestionsToQuestions(qs?: AdminQuestionItem[]): Question[] {
  if (!qs || !Array.isArray(qs)) return [];
  return qs.map(q => ({
    slotIndex: q.slotIndex,
    time: q.time || 0,
    image: q.image || '',
    question: q.question || '',
    options: typeof q.options === 'string'
      ? (q.options === 'نص' || !q.options ? [] : q.options.split(',').map(s => s.trim()))
      : (Array.isArray(q.options) ? q.options : []),
    correctAnswer: q.correctAnswer || ''
  }));
}

// 2. Fetch Lessons / Words
export async function fetchLessons(sheetName: string, username?: string): Promise<WordData[]> {
  if (!isApiConfigured()) {
    const local = localStorage.getItem('mockAdminQuestions');
    if (local) {
      try {
        const adminQs: AdminQuestionRow[] = JSON.parse(local);
        return adminQs.map(q => ({
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
          questions: mapAdminQuestionsToQuestions(q.questions),
          audioQuestions: mapAdminQuestionsToQuestions(q.audioQuestions)
        }));
      } catch (e) {}
    }
    return [
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
  const params: Record<string, string> = { action: 'getWords', sheetName };
  if (username) {
    params.username = username;
  }
  const response = await fetchGas(params);
  if (Array.isArray(response)) {
    return response as WordData[];
  }
  return [];
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
      try { return JSON.parse(local); } catch (e) {}
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
        questions: [],
        audioQuestions: []
      }
    ];
    localStorage.setItem('mockAdminQuestions', JSON.stringify(initial));
    return initial;
  }
  const response = await fetchGas({ action: 'getAdminQuestions' });
  if (Array.isArray(response)) {
    return response as AdminQuestionRow[];
  }
  return [];
}

// 19. Admin: Save or Add question/lesson in Questions sheet
export async function saveAdminQuestion(payload: AdminQuestionRow) {
  if (!isApiConfigured()) {
    const questions = await fetchAdminQuestions();
    let updated = [...questions];
    if (payload.rowIndex && payload.rowIndex > 1) {
      const idx = updated.findIndex(q => q.rowIndex === payload.rowIndex);
      if (idx !== -1) {
        updated[idx] = { ...payload };
      } else {
        updated.push({ ...payload });
      }
    } else if (payload.comment) {
      const idx = updated.findIndex(q => q.comment && q.comment.trim() === payload.comment.trim());
      if (idx !== -1) {
        updated[idx] = { ...payload, rowIndex: updated[idx].rowIndex };
      } else {
        const maxRow = updated.reduce((max, q) => Math.max(max, q.rowIndex || 1), 1);
        const newRowIndex = maxRow + 1;
        updated.push({ ...payload, rowIndex: newRowIndex });
      }
    } else {
      const maxRow = updated.reduce((max, q) => Math.max(max, q.rowIndex || 1), 1);
      const newRowIndex = maxRow + 1;
      updated.push({ ...payload, rowIndex: newRowIndex });
    }
    localStorage.setItem('mockAdminQuestions', JSON.stringify(updated));
    return { success: true };
  }
  return fetchGas({ action: 'saveAdminQuestion' }, 'POST', payload);
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
