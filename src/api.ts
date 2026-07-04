import { WordData } from './types';

// Helper to get Web App URL from localStorage
export function getWebAppUrl(): string {
  return localStorage.getItem('webAppUrl') || '';
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

// 2. Fetch Lessons / Words
export async function fetchLessons(sheetName: string): Promise<WordData[]> {
  const response = await fetchGas({ action: 'getWords', sheetName });
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
export async function getFullAudioListeningScore(comment: string, sheetNumber: string, username: string): Promise<number> {
  const res = await fetchGas({
    action: 'getFullAudioScore',
    comment,
    sheet_number: sheetNumber,
    username,
  });
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
export async function getLetterListeningScore(comment: string, sheetNumber: string, username: string): Promise<number> {
  const res = await fetchGas({
    action: 'getLetterListenScore',
    comment,
    sheet_number: sheetNumber,
    username,
  });
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
export async function getSavedRecordingLink(comment: string, sheetNumber: string, username: string): Promise<string> {
  const res = await fetchGas({
    action: 'getRecordingLink',
    comment,
    sheet_number: sheetNumber,
    username,
  });
  return res && res.link ? res.link : '';
}

// 9. Retrieve Saved Image Link
export async function getSavedImageLink(comment: string, sheetNumber: string, username: string): Promise<string> {
  const res = await fetchGas({
    action: 'getImageLink',
    comment,
    sheet_number: sheetNumber,
    username,
  });
  return res && res.link ? res.link : '';
}

// 10. Upload Camera Photo / Image File (returns Drive file URL)
export async function uploadImage(payload: {
  base64Data: string;
  mimeType: string;
  word: string;
  username: string;
  sheet_number: string;
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

// 14. Mark Lesson Completed (calculates overall grade and copies score elements to user sheet)
export async function markLessonCompleted(sheetName: string, lessonIndex: number, username: string) {
  return fetchGas({ action: 'markLessonCompleted' }, 'POST', { sheetName, lessonIndex, username });
}

// 15. Re-open Lesson for Student
export async function unmarkLessonCompleted(sheetName: string, lessonIndex: number) {
  return fetchGas({ action: 'unmarkLessonCompleted' }, 'POST', { sheetName, lessonIndex });
}

// 16. Reset State when Student navigates back early without completing
export async function resetToCompleted(sheetName: string, lessonIndex: number) {
  return fetchGas({ action: 'resetToCompleted' }, 'POST', { sheetName, lessonIndex });
}

// 17. Decrement Student's Lesson Retry Counts
export async function decrementRetryCount(sheetName: string, lessonIndex: number) {
  return fetchGas({ action: 'decrementRetryCount' }, 'POST', { sheetName, lessonIndex });
}
