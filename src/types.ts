export interface Question {
  slotIndex?: number;
  time: number;
  image?: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface WordData {
  word: string;
  fullSound: string;
  letterSounds: string[];
  image: string;
  comment: string;
  explainSound: string;
  youtubeUrl: string;
  questions: Question[];
  audioQuestions: Question[];
  showResult: 'نعم' | 'لا';
  instruction: string;
  allowRecording: 'نعم' | 'لا' | '';
  maxRecordingTime: number;
  retryCount: number;
  completed: 'تم' | 'اعادة' | '' | 'إعادة';
  showPrevButton: string;
  uploadTitle?: string;
  allowUpload: 'نعم' | 'لا' | '';
  retryResetCount: number;
  resetCondition?: 'نعم' | 'لا';
  dzValue?: string;
  totalQuestionsCount?: number;
  startDate?: string; // العمود DB (106) - تاريخ ظهور الموضوع
  endDate?: string; // العمود DC (107) - تاريخ إخفاء الموضوع
  expireAfterDays?: number | string; // العمود DD (108) - عدد أيام إخفاء الدرس بعد تاريخ الظهور
}

export interface Student {
  username: string;
  sheetNumber: string;
}

export interface AppSettings {
  webAppUrl: string;
}

export interface AdminQuestionItem {
  slotIndex?: number;
  time: number;
  image?: string;
  question: string;
  options: string;
  correctAnswer: string;
}

export interface AdminQuestionRow {
  rowIndex?: number;
  word: string;
  rawLinks?: string;
  fullSound?: string;
  comment: string;
  image?: string;
  explainSound?: string;
  youtubeUrl?: string;
  showResult?: string;
  totalQuestionsCount?: number;
  instruction?: string;
  allowRecording?: string;
  maxRecordingTime?: number;
  retryCount?: number;
  showPrevButton?: string;
  allowUpload?: string;
  defaultRetryResetCount?: number;
  startDate?: string; // العمود DB (106)
  endDate?: string; // العمود DC (107)
  expireAfterDays?: number | string; // العمود DD (108)
  questions?: AdminQuestionItem[];
  audioQuestions?: AdminQuestionItem[];
}

export interface AdminAnswerRow {
  rowIndex: number;
  sheetNumber: string; // العمود A
  username: string; // العمود B
  comment: string; // العمود C
  youtubeUrl?: string;
  videoAnswersResult?: string; // العمود U
  audioAnswersResult?: string; // العمود Z
  fullAudioScore?: string;
  letterListenScore?: string;
  recordingLink?: string;
  imageLink?: string;
  finalResult?: string; // العمود AM
  audioUploadCount?: number | string; // العمود AK
  imageUploadCount?: number | string; // العمود AL
  completed?: string; // العمود AO
  retryResetCount?: number | null; // العمود AP
}
