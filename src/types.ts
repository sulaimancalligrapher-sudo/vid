export interface Question {
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
  completed: 'تم' | 'اعادة' | '';
  showPrevButton: string;
  uploadTitle: string;
  allowUpload: 'نعم' | 'لا' | '';
  retryResetCount: number;
  resetCondition: 'نعم' | 'لا';
  dzValue: string;
}

export interface Student {
  username: string;
  sheetNumber: string;
}

export interface AppSettings {
  webAppUrl: string;
}
