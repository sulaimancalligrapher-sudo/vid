import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WordData, Question, Student } from '../types';
import {
  ArrowRight, Image as ImageIcon, Video, Mic, Upload, Volume2,
  Play, Pause, RefreshCw, CheckCircle2, ChevronRight, X, AlertTriangle, Sparkles, AlertCircle
} from 'lucide-react';
import {
  saveQuestionAnswer,
  getFullAudioListeningScore,
  saveFullAudioListeningScore,
  getLetterListeningScore,
  saveLetterListeningScore,
  getSavedRecordingLink,
  getSavedImageLink,
  uploadImage,
  uploadRecording,
  saveImageLinkMetadata,
  saveRecordingLinkMetadata,
  markLessonCompleted
} from '../api';
import QuestionModal from './QuestionModal';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface LessonDetailProps {
  student: Student;
  lesson: WordData;
  lessonIndex: number;
  isReset: boolean;
  onBack: () => void;
}

export default function LessonDetail({
  student,
  lesson,
  lessonIndex,
  isReset: initialIsReset,
  onBack,
}: LessonDetailProps) {
  const [isReset, setIsReset] = useState(initialIsReset);
  const [activeTab, setActiveTab] = useState<'study' | 'assignment'>('study');
  
  // Image Lightbox
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // YouTube State
  const [ytReady, setYtReady] = useState(false);
  const [ytPlaying, setYtPlaying] = useState(false);
  const [ytProgress, setYtProgress] = useState(0);
  const [ytVolume, setYtVolume] = useState(40);
  const ytPlayerRef = useRef<any>(null);
  const ytTimerRef = useRef<number | null>(null);
  const [videoAnswered, setVideoAnswered] = useState<Set<string>>(new Set());

  // Explanation Audio State
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioTimeStr, setAudioTimeStr] = useState('00:00 / 00:00');
  const [audioVolume, setAudioVolume] = useState(40);
  const audioObjRef = useRef<HTMLAudioElement | null>(null);
  const [audioAnswered, setAudioAnswered] = useState<Set<string>>(new Set());

  // Full Lesson Audio State
  const [fullAudioPlaying, setFullAudioPlaying] = useState(false);
  const [fullAudioProgress, setFullAudioProgress] = useState(0);
  const [fullAudioDuration, setFullAudioDuration] = useState(0);
  const [fullAudioTimeStr, setFullAudioTimeStr] = useState('00:00 / 00:00');
  const [fullAudioVolume, setFullAudioVolume] = useState(40);
  const [fullAudioScore, setFullAudioScore] = useState(0);
  const [fullAudioCompleted, setFullAudioCompleted] = useState(false);
  const [fullAudioMessage, setFullAudioMessage] = useState<{ text: string; success: boolean } | null>(null);
  const fullAudioObjRef = useRef<HTMLAudioElement | null>(null);
  const fullMaxPercentRef = useRef(0);

  // Letter Sounds State
  const [letterAudios, setLetterAudios] = useState<(HTMLAudioElement | null)[]>([]);
  const [listenedLetters, setListenedLetters] = useState<Set<number>>(new Set());
  const [letterVolume, setLetterVolume] = useState(40);
  const [letterMsg, setLetterMsg] = useState('');
  const [activeLetterIdx, setActiveLetterIdx] = useState<number | null>(null);

  // Integrated Recording State
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [savedRecordingLink, setSavedRecordingLink] = useState('');
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [audioUploadSuccess, setAudioUploadSuccess] = useState(false);
  const [audioUploadError, setAudioUploadError] = useState('');
  const [remainingRetries, setRemainingRetries] = useState(lesson.retryCount);
  const recordingTimerRef = useRef<number | null>(null);

  // Integrated Camera State
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const [savedImageLink, setSavedImageLink] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadSuccess, setImageUploadSuccess] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const videoStreamRef = useRef<HTMLVideoElement | null>(null);

  // Active Overlay Question
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionType, setCurrentQuestionType] = useState<'video' | 'audio' | null>(null);

  // Exit Validation State
  const [exitValidationMsg, setExitValidationMsg] = useState<string | null>(null);
  const [finalCompleting, setFinalCompleting] = useState(false);

  const hasLetterSounds = lesson.letterSounds.length > 0 && lesson.letterSounds.some(sound => sound && sound.startsWith('http'));

  // Formatter helper
  const formatTime = (sec: number) => {
    if (!isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ------------------- INITIALIZATION & SCORE DATA LOADING -------------------
  useEffect(() => {
    // Load existing scores from Sheet
    const loadScores = async () => {
      try {
        if (lesson.fullSound) {
          const score = await getFullAudioListeningScore(lesson.comment, student.sheetNumber, student.username);
          setFullAudioScore(score);
          if (score === 100 || isReset) {
            setFullAudioCompleted(true);
            setFullAudioMessage({ text: 'رائع! درجة الاستماع لهذا الدرس: 100%', success: true });
          }
        }
        if (hasLetterSounds) {
          const score = await getLetterListeningScore(lesson.comment, student.sheetNumber, student.username);
          if (score === 100 || isReset) {
            const completedSet = new Set<number>();
            for (let i = 0; i < lesson.word.length; i++) completedSet.add(i);
            setListenedLetters(completedSet);
          }
        }
        // Load assignment status
        const recLink = await getSavedRecordingLink(lesson.comment, student.sheetNumber, student.username);
        if (recLink) {
          setSavedRecordingLink(recLink);
          setAudioUploadSuccess(true);
        }
        const imgLink = await getSavedImageLink(lesson.comment, student.sheetNumber, student.username);
        if (imgLink) {
          setSavedImageLink(imgLink);
          setImageUploadSuccess(true);
        }
      } catch (err) {
        console.error('Failed to load student scores:', err);
      }
    };
    loadScores();

    // Setup YouTube Iframe API if needed
    if (lesson.youtubeUrl) {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
      
      const checkAndInitYt = () => {
        if (window.YT && window.YT.Player) {
          initYtPlayer();
        } else {
          setTimeout(checkAndInitYt, 200);
        }
      };
      checkAndInitYt();
    }

    // Clean up streams on unmount
    return () => {
      stopAllStreams();
      if (ytTimerRef.current) clearInterval(ytTimerRef.current);
      if (audioObjRef.current) audioObjRef.current.pause();
      if (fullAudioObjRef.current) fullAudioObjRef.current.pause();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const stopAllStreams = () => {
    if (micStream) micStream.getTracks().forEach(t => t.stop());
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
  };

  // ------------------- YOUTUBE PLAYER CONFIG -------------------
  const initYtPlayer = () => {
    try {
      const videoId = lesson.youtubeUrl.match(/(?:youtube\.com\/(?:.*v=|embed\/)|youtu\.be\/)([^?&"'>]+)/)?.[1];
      if (!videoId) return;

      ytPlayerRef.current = new window.YT.Player('yt-player-frame', {
        videoId: videoId,
        playerVars: {
          controls: 0,
          rel: 0,
          showinfo: 0,
          disablekb: 1,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            setYtReady(true);
            ytPlayerRef.current.setVolume(ytVolume);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setYtPlaying(true);
              // Pause explanation/full audio if playing
              pauseExplanationAudio();
              pauseFullAudio();
              startXyTimer();
            } else {
              setYtPlaying(false);
              stopXyTimer();
            }
          },
        },
      });
    } catch (err) {
      console.error('Failed to init YT player:', err);
    }
  };

  const startXyTimer = () => {
    if (ytTimerRef.current) clearInterval(ytTimerRef.current);
    ytTimerRef.current = window.setInterval(() => {
      if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
        const curr = ytPlayerRef.current.getCurrentTime();
        const duration = ytPlayerRef.current.getDuration();
        const pct = duration ? (curr / duration) * 100 : 0;
        setYtProgress(pct);

        // Check for interactive questions
        if (lesson.completed !== 'تم' || isReset) {
          const question = lesson.questions.find(
            q => Math.abs(q.time - curr) < 1 && !videoAnswered.has(q.question)
          );
          if (question) {
            ytPlayerRef.current.pauseVideo();
            setCurrentQuestion(question);
            setCurrentQuestionType('video');
          }
        }
      }
    }, 500);
  };

  const stopXyTimer = () => {
    if (ytTimerRef.current) clearInterval(ytTimerRef.current);
  };

  const handleYtPlay = () => {
    if (ytPlayerRef.current && ytReady) {
      ytPlayerRef.current.playVideo();
    }
  };

  const handleYtPause = () => {
    if (ytPlayerRef.current && ytReady) {
      ytPlayerRef.current.pauseVideo();
    }
  };

  const handleYtVolumeChange = (vol: number) => {
    setYtVolume(vol);
    if (ytPlayerRef.current && ytReady) {
      ytPlayerRef.current.setVolume(vol);
    }
  };

  const handleYtSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (ytPlayerRef.current && ytReady) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      const duration = ytPlayerRef.current.getDuration();
      ytPlayerRef.current.seekTo(pct * duration, true);
    }
  };

  // ------------------- EXPLANATION AUDIO CONFIG -------------------
  const playExplanationAudio = () => {
    // Pause other medias
    handleYtPause();
    pauseFullAudio();

    if (!audioObjRef.current) {
      audioObjRef.current = new Audio(lesson.explainSound);
      audioObjRef.current.volume = audioVolume / 100;

      audioObjRef.current.addEventListener('loadedmetadata', () => {
        setAudioDuration(audioObjRef.current?.duration || 0);
      });

      audioObjRef.current.addEventListener('timeupdate', () => {
        if (!audioObjRef.current) return;
        const curr = audioObjRef.current.currentTime;
        const dur = audioObjRef.current.duration || 1;
        setAudioProgress((curr / dur) * 100);
        setAudioTimeStr(`${formatTime(curr)} / ${formatTime(dur)}`);

        // Check for questions
        if (lesson.completed !== 'تم' || isReset) {
          const question = lesson.audioQuestions.find(
            q => Math.abs(q.time - curr) < 1 && !audioAnswered.has(q.question)
          );
          if (question) {
            audioObjRef.current.pause();
            setAudioPlaying(false);
            setCurrentQuestion(question);
            setCurrentQuestionType('audio');
          }
        }
      });

      audioObjRef.current.addEventListener('ended', () => {
        setAudioPlaying(false);
      });
    }

    audioObjRef.current.play();
    setAudioPlaying(true);
  };

  const pauseExplanationAudio = () => {
    if (audioObjRef.current) {
      audioObjRef.current.pause();
      setAudioPlaying(false);
    }
  };

  const handleAudioVolumeChange = (vol: number) => {
    setAudioVolume(vol);
    if (audioObjRef.current) {
      audioObjRef.current.volume = vol / 100;
    }
  };

  const handleAudioSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioObjRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      audioObjRef.current.currentTime = pct * audioDuration;
    }
  };

  // ------------------- FULL LESSON AUDIO CONFIG -------------------
  const playFullAudio = () => {
    // Pause other medias
    handleYtPause();
    pauseExplanationAudio();

    if (!fullAudioObjRef.current) {
      fullAudioObjRef.current = new Audio(lesson.fullSound);
      fullAudioObjRef.current.volume = fullAudioVolume / 100;

      fullAudioObjRef.current.addEventListener('loadedmetadata', () => {
        setFullAudioDuration(fullAudioObjRef.current?.duration || 0);
      });

      fullAudioObjRef.current.addEventListener('timeupdate', () => {
        if (!fullAudioObjRef.current) return;
        const curr = fullAudioObjRef.current.currentTime;
        const dur = fullAudioObjRef.current.duration || 1;
        const pct = Math.floor((curr / dur) * 100);
        fullMaxPercentRef.current = Math.max(fullMaxPercentRef.current, pct);
        setFullAudioProgress(pct);
        setFullAudioTimeStr(`${formatTime(curr)} / ${formatTime(dur)}`);
      });

      fullAudioObjRef.current.addEventListener('pause', () => {
        setFullAudioPlaying(false);
        const maxPct = fullMaxPercentRef.current;
        if (lesson.completed !== 'تم' && !isReset) {
          saveFullAudioScoreBackend(maxPct);
        }
      });

      fullAudioObjRef.current.addEventListener('ended', () => {
        setFullAudioPlaying(false);
        setFullAudioCompleted(true);
        setFullAudioMessage({ text: 'رائع! درجة الاستماع لهذا الدرس: 100%', success: true });
        if (lesson.completed !== 'تم' && !isReset) {
          saveFullAudioScoreBackend(100);
        }
      });
    }

    // Clear message on replay
    setFullAudioMessage(null);
    fullAudioObjRef.current.play();
    setFullAudioPlaying(true);
  };

  const pauseFullAudio = () => {
    if (fullAudioObjRef.current) {
      fullAudioObjRef.current.pause();
      setFullAudioPlaying(false);
    }
  };

  const saveFullAudioScoreBackend = async (score: number) => {
    if (score > fullAudioScore) {
      setFullAudioScore(score);
      try {
        await saveFullAudioListeningScore({
          sheet_number: student.sheetNumber,
          username: student.username,
          word: lesson.word,
          score,
          timestamp: new Date().toLocaleString(),
          comment: lesson.comment,
        });
      } catch (err) {
        console.error('Failed to save full audio progress:', err);
      }
    }

    if (score < 100) {
      setFullAudioMessage({
        text: `لقد استمعت إلى ${score}% من الدرس الصوتي. يرجى الاستماع بالكامل حتى 100% لإكماله.`,
        success: false,
      });
    } else {
      setFullAudioCompleted(true);
      setFullAudioMessage({ text: 'رائع! درجة الاستماع لهذا الدرس: 100%', success: true });
    }
  };

  const handleFullAudioVolumeChange = (vol: number) => {
    setFullAudioVolume(vol);
    if (fullAudioObjRef.current) {
      fullAudioObjRef.current.volume = vol / 100;
    }
  };

  // ------------------- CLICKABLE LETTER SOUNDS CONFIG -------------------
  const playLetter = (url: string, index: number) => {
    // Check if full audio listening is completed first (unless already completed)
    if (lesson.completed !== 'تم' && !isReset && lesson.fullSound && !fullAudioCompleted) {
      setLetterMsg('تنبيه: يجب إكمال الاستماع للدرس الصوتي بالكامل (100%) أولاً قبل البدء بتدريب نطق الحروف 🎙️.');
      setTimeout(() => setLetterMsg(''), 4500);
      return;
    }

    // Pause other background sounds
    handleYtPause();
    pauseExplanationAudio();
    pauseFullAudio();

    if (letterAudios[index]) {
      letterAudios[index]?.pause();
    }

    const audio = new Audio(url);
    audio.volume = letterVolume / 100;
    setActiveLetterIdx(index);
    setLetterMsg('جاري تحميل صوت الحرف...');

    audio.oncanplay = () => {
      setLetterMsg('');
      audio.play();
    };

    audio.onended = () => {
      setActiveLetterIdx(null);
      
      // Track listening progress
      if (lesson.completed !== 'تم' && !isReset && !listenedLetters.has(index)) {
        const nextListened = new Set(listenedLetters);
        nextListened.add(index);
        setListenedLetters(nextListened);

        // Calculate and save listening percentage
        const pct = Math.floor((nextListened.size / lesson.word.length) * 100);
        try {
          saveLetterListeningScore({
            sheet_number: student.sheetNumber,
            username: student.username,
            word: lesson.word,
            score: pct,
            timestamp: new Date().toLocaleString(),
            comment: lesson.comment,
          });
        } catch (err) {
          console.error('Failed to save letter sound listening score:', err);
        }
      }
    };

    audio.onerror = () => {
      setActiveLetterIdx(null);
      setLetterMsg('خطأ في تحميل صوت هذا الحرف.');
      setTimeout(() => setLetterMsg(''), 3000);
    };

    const newAudios = [...letterAudios];
    newAudios[index] = audio;
    setLetterAudios(newAudios);
  };

  const handleLetterVolumeChange = (vol: number) => {
    setLetterVolume(vol);
    letterAudios.forEach(audio => {
      if (audio) audio.volume = vol / 100;
    });
  };

  // ------------------- OVERLAY QUESTIONS FEEDBACK -------------------
  const handleQuestionSubmit = async (answer: string, isCorrect: boolean | null) => {
    const qIndex =
      currentQuestionType === 'video'
        ? lesson.questions.findIndex(q => q.question === currentQuestion?.question)
        : lesson.audioQuestions.findIndex(q => q.question === currentQuestion?.question);

    try {
      await saveQuestionAnswer({
        sheet_number: student.sheetNumber,
        username: student.username,
        word: lesson.word,
        youtubeUrl: lesson.youtubeUrl,
        question: currentQuestion?.question || '',
        selectedAnswer: answer,
        isCorrect: isCorrect,
        timestamp: new Date().toLocaleString(),
        type: currentQuestionType || 'video',
        questionIndex: qIndex,
        comment: lesson.comment,
        explainSound: lesson.explainSound,
      });

      if (currentQuestionType === 'video') {
        const nextSet = new Set(videoAnswered);
        nextSet.add(currentQuestion?.question || '');
        setVideoAnswered(nextSet);
      } else {
        const nextSet = new Set(audioAnswered);
        nextSet.add(currentQuestion?.question || '');
        setAudioAnswered(nextSet);
      }
    } catch (err) {
      console.error('Failed to save question answer to sheet:', err);
    }

    // Close Question Modal and resume media
    setCurrentQuestion(null);
    if (currentQuestionType === 'video' && ytPlayerRef.current) {
      ytPlayerRef.current.playVideo();
    } else if (currentQuestionType === 'audio' && audioObjRef.current) {
      audioObjRef.current.play();
      setAudioPlaying(true);
    }
    setCurrentQuestionType(null);
  };

  // ------------------- IN-PAGE MICROPHONE RECORDER -------------------
  const startRecording = async () => {
    setAudioUploadError('');
    setRecordedAudioUrl(null);
    setRecordedBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        setRecordedAudioUrl(URL.createObjectURL(audioBlob));
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => {
          if (lesson.maxRecordingTime && prev >= lesson.maxRecordingTime) {
            stopRecording(recorder);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setAudioUploadError('تنبيه: لم نتمكن من الوصول للميكروفون. تأكد من تفعيل صلاحية المايك في متصفحك.');
    }
  };

  const stopRecording = (activeRecorder?: MediaRecorder) => {
    const rec = activeRecorder || mediaRecorder;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setRecording(false);
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
    }
  };

  const handleUploadAudio = async () => {
    if (!recordedBlob) return;
    setUploadingAudio(true);
    setAudioUploadError('');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(recordedBlob);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        // 1. Upload file to Google Drive
        const uploadResult = await uploadRecording({
          base64Data: base64,
          mimeType: recordedBlob.type || 'audio/webm',
          word: lesson.word,
          username: student.username,
          sheet_number: student.sheetNumber,
        });

        if (uploadResult && uploadResult.success) {
          const driveUrl = uploadResult.link;
          setSavedRecordingLink(driveUrl);
          
          // 2. Save metadata in Sheet
          await saveRecordingLinkMetadata({
            sheet_number: student.sheetNumber,
            username: student.username,
            comment: lesson.comment,
            link: driveUrl,
            timestamp: new Date().toLocaleString(),
          });

          setAudioUploadSuccess(true);
        } else {
          throw new Error('فشل الرفع من الخادم.');
        }
      };
    } catch (err: any) {
      setAudioUploadError(err.message || 'حدث خطأ أثناء رفع ملف الصوت إلى Google Drive.');
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleManualAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAudio(true);
    setAudioUploadError('');
    setRecordedAudioUrl(URL.createObjectURL(file));

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];

        // 1. Upload to Google Drive
        const uploadResult = await uploadRecording({
          base64Data: base64,
          mimeType: file.type || 'audio/mpeg',
          word: lesson.word,
          username: student.username,
          sheet_number: student.sheetNumber,
        });

        if (uploadResult && uploadResult.success) {
          const driveUrl = uploadResult.link;
          setSavedRecordingLink(driveUrl);

          // 2. Save metadata to Answers Sheet
          await saveRecordingLinkMetadata({
            sheet_number: student.sheetNumber,
            username: student.username,
            comment: lesson.comment,
            link: driveUrl,
            timestamp: new Date().toLocaleString(),
          });

          setAudioUploadSuccess(true);
        } else {
          throw new Error('فشل رفع الملف الصوتي.');
        }
      };
    } catch (err: any) {
      setAudioUploadError(err.message || 'فشل رفع الملف الصوتي المختار.');
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleAudioRetry = () => {
    if (remainingRetries > 0) {
      setRemainingRetries(prev => prev - 1);
      setRecordedAudioUrl(null);
      setRecordedBlob(null);
      setAudioUploadSuccess(false);
      setSavedRecordingLink('');
    }
  };

  // ------------------- IN-PAGE CAMERA GRABBER -------------------
  const startCamera = async () => {
    setCapturedImagePreview(null);
    setCapturedImageBase64(null);
    setImageUploadError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      setCameraStream(stream);
      setCameraActive(true);

      setTimeout(() => {
        if (videoStreamRef.current) {
          videoStreamRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      setImageUploadError('خطأ: لم نتمكن من تفعيل الكاميرا. يرجى تفعيل أذونات الكاميرا في جهازك.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoStreamRef.current) return;
    const video = videoStreamRef.current;
    
    const canvas = document.createElement('canvas');
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    const size = Math.min(videoWidth, videoHeight);
    
    // Crop center square
    const sx = (videoWidth - size) / 2;
    const sy = (videoHeight - size) / 2;
    
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    // DRAW WATERMARK
    try {
      const bannerHeight = Math.max(30, Math.floor(canvas.height * 0.07));
      const fontSize = Math.max(10, Math.floor(bannerHeight * 0.32));

      // Draw dark semi-transparent banner
      context.fillStyle = 'rgba(15, 23, 42, 0.75)';
      context.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

      // Text settings
      context.fillStyle = '#FFFFFF';
      context.font = `bold ${fontSize}px 'Cairo', sans-serif`;
      context.textAlign = 'right';
      context.textBaseline = 'middle';
      context.direction = 'rtl';

      // Locale date
      let dateStr = '';
      try {
        dateStr = new Date().toLocaleString('ar-EG', {
          year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
      } catch (e) {
        dateStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
      }

      const overlayParts = [
        student.username,
        `ID: ${student.sheetNumber}`,
        `درس: ${lesson.word}`,
        dateStr
      ].filter(Boolean);

      const overlayText = overlayParts.join(' - ');
      context.fillText(overlayText, canvas.width - 15, canvas.height - (bannerHeight / 2));
    } catch (err) {
      console.error('Failed to embed camera watermark:', err);
    }

    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImagePreview(base64);
    setCapturedImageBase64(base64.split(',')[1]);
    stopCamera();
  };

  const handleUploadPhoto = async () => {
    if (!capturedImageBase64) return;
    setUploadingImage(true);
    setImageUploadError('');

    try {
      // 1. Upload Base64 to Google Drive
      const uploadResult = await uploadImage({
        base64Data: capturedImageBase64,
        mimeType: 'image/jpeg',
        word: lesson.word,
        username: student.username,
        sheet_number: student.sheetNumber,
      });

      if (uploadResult && uploadResult.success) {
        const driveUrl = uploadResult.link;
        setSavedImageLink(driveUrl);

        // 2. Save image metadata in Answers Sheet
        await saveImageLinkMetadata({
          sheet_number: student.sheetNumber,
          username: student.username,
          comment: lesson.comment,
          link: driveUrl,
          timestamp: new Date().toLocaleString(),
        });

        setImageUploadSuccess(true);
      } else {
        throw new Error('فشل الرفع إلى جوجل درايف.');
      }
    } catch (err: any) {
      setImageUploadError(err.message || 'حدث خطأ أثناء رفع الصورة.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleManualImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setImageUploadError('');

    // Pre-process local file: load into canvas and apply watermark!
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const maxSize = 1024;
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > maxSize) {
            h = Math.round((maxSize * h) / w);
            w = maxSize;
          }
        } else {
          if (h > maxSize) {
            w = Math.round((maxSize * w) / h);
            h = maxSize;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const context = canvas.getContext('2d');
        if (!context) return;
        context.drawImage(img, 0, 0, w, h);

        // Apply watermark banner
        const bannerHeight = Math.max(25, Math.floor(canvas.height * 0.06));
        const fontSize = Math.max(9, Math.floor(bannerHeight * 0.30));

        context.fillStyle = 'rgba(15, 23, 42, 0.75)';
        context.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

        context.fillStyle = '#FFFFFF';
        context.font = `bold ${fontSize}px 'Cairo', sans-serif`;
        context.textAlign = 'right';
        context.textBaseline = 'middle';
        context.direction = 'rtl';

        let dateStr = new Date().toLocaleString('ar-EG', {
          year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const overlayText = [student.username, `ID: ${student.sheetNumber}`, `درس: ${lesson.word}`, dateStr].join(' - ');
        context.fillText(overlayText, canvas.width - 15, canvas.height - (bannerHeight / 2));

        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImagePreview(base64);
        const base64Clean = base64.split(',')[1];

        // Upload to Drive
        const uploadResult = await uploadImage({
          base64Data: base64Clean,
          mimeType: 'image/jpeg',
          word: lesson.word,
          username: student.username,
          sheet_number: student.sheetNumber,
        });

        if (uploadResult && uploadResult.success) {
          const driveUrl = uploadResult.link;
          setSavedImageLink(driveUrl);

          await saveImageLinkMetadata({
            sheet_number: student.sheetNumber,
            username: student.username,
            comment: lesson.comment,
            link: driveUrl,
            timestamp: new Date().toLocaleString(),
          });

          setImageUploadSuccess(true);
        } else {
          throw new Error('فشل الرفع.');
        }
      } catch (err: any) {
        setImageUploadError(err.message || 'فشل معالجة ورفع الصورة.');
      } finally {
        setUploadingImage(false);
      }
    };
  };

  // ------------------- EXIT FLOW VALIDATION -------------------
  const handleExitLesson = async () => {
    setExitValidationMsg(null);
    pauseExplanationAudio();
    pauseFullAudio();
    handleYtPause();

    if (lesson.completed === 'تم' && !isReset) {
      // In review mode, just navigate back directly
      onBack();
      return;
    }

    setFinalCompleting(true);

    const checkRecording = lesson.allowRecording === 'نعم' || lesson.allowRecording === '';
    const checkUpload = lesson.allowUpload === 'نعم' || lesson.allowUpload === '';

    const errors: string[] = [];

    // 1. Check clickable letters
    if (hasLetterSounds && listenedLetters.size !== lesson.word.length) {
      errors.push('تنبيه: أنت لم تستمع إلى نطق جميع الحروف المكونة للكلمة.');
    }

    // 2. Check microphone recording
    if (checkRecording && !audioUploadSuccess) {
      errors.push('تنبيه: يرجى تسجيل وإرسال الواجب الصوتي الخاص بك أولاً.');
    }

    // 3. Check photo upload
    if (checkUpload && !imageUploadSuccess) {
      errors.push('تنبيه: يرجى التقاط أو رفع الصورة المطلوبة للدرس أولاً.');
    }

    if (errors.length > 0) {
      setExitValidationMsg(errors.join(' '));
      setFinalCompleting(false);
      setTimeout(() => setExitValidationMsg(null), 6000);
      return;
    }

    // Perfect! Save everything and submit to sheet
    try {
      await markLessonCompleted(student.sheetNumber, lessonIndex, student.username);
      onBack();
    } catch (err) {
      console.error(err);
      setExitValidationMsg('فشل حفظ تقدم الدرس على خادم Google Sheet. تحقق من اتصالك بالإنترنت وأعد المحاولة.');
      setFinalCompleting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 text-right" dir="rtl">
      {/* Back Button */}
      <button
        onClick={handleExitLesson}
        disabled={finalCompleting}
        className="mb-6 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl cursor-pointer text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
      >
        <ArrowRight className="w-4 h-4" />
        <span>حفظ التقدم والرجوع للدروس</span>
      </button>

      {/* Header Info */}
      <div className="bg-slate-800 border border-slate-700/40 rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-amber-400 text-xs font-mono block mb-1">الدرس النشط #{lessonIndex + 1}</span>
            <h1 className="text-xl md:text-2xl font-bold text-slate-100">{lesson.comment || 'درس غير معنون'}</h1>
            <p className="text-xs text-slate-400 mt-1">
              الكلمة المكتوبة: <span className="text-amber-400 font-bold bg-slate-900/50 px-2.5 py-1 rounded-lg text-sm">{lesson.word}</span>
            </p>
          </div>
          {lesson.completed === 'تم' && !isReset && (
            <div className="px-4 py-2 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-sky-400 text-xs font-bold">
              وضع مراجعة الدرس فقط 👁️
            </div>
          )}
        </div>
      </div>

      {/* Validation Banner */}
      <AnimatePresence>
        {exitValidationMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -5 }}
            className="mb-6 p-4 bg-rose-500/15 border border-rose-500/25 rounded-2xl text-rose-400 text-xs flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">شروط الانتقال غير مكتملة:</p>
              <p className="mt-1 leading-relaxed text-slate-300">{exitValidationMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('study')}
          className={`px-5 py-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'study' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span>قسم الشرح والمشاهدة 📺</span>
          {activeTab === 'study' && (
            <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('assignment')}
          className={`px-5 py-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'assignment' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span>قسم رفع وتصوير الواجبات 📸</span>
          {activeTab === 'assignment' && (
            <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
          )}
        </button>
      </div>

      {/* TAB CONTENT: STUDY */}
      {activeTab === 'study' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Image or Video */}
            <div className="space-y-6">
              {/* Image Preview Card */}
              {lesson.image && (
                <div className="bg-slate-800 border border-slate-700/40 rounded-3xl p-4 shadow-xl text-center">
                  <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5 justify-center">
                    <ImageIcon className="w-4.5 h-4.5 text-amber-400" />
                    <span>صورة توضيحية للدرس</span>
                  </h3>
                  <div
                    onClick={() => setLightboxImg(lesson.image)}
                    className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700 cursor-zoom-in group"
                  >
                    <img src={lesson.image} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" alt="Lesson Visual" />
                    <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors" />
                  </div>
                </div>
              )}

              {/* YouTube Video Card */}
              {lesson.youtubeUrl && (
                <div className="bg-slate-800 border border-slate-700/40 rounded-3xl p-4 shadow-xl">
                  <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5 justify-center">
                    <Video className="w-4.5 h-4.5 text-amber-400" />
                    <span>فيديو الدرس التفاعلي المساعد</span>
                  </h3>
                  
                  {/* Aspect video player frame wrapper */}
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 mb-3">
                    <div id="yt-player-frame" className="w-full h-full" />
                    {/* Transparent overlay blocks skipping on the YouTube iframe */}
                    <div className="absolute inset-0 bg-transparent z-10 pointer-events-none" />
                  </div>

                  {/* Custom Controls */}
                  <div className="flex items-center justify-between gap-4 p-2.5 bg-slate-900 rounded-2xl">
                    <button
                      onClick={ytPlaying ? handleYtPause : handleYtPlay}
                      className="p-3 bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-600 transition-all active:scale-90 cursor-pointer shadow-md shadow-amber-500/10"
                    >
                      {ytPlaying ? <Pause className="w-4.5 h-4.5 fill-slate-950" /> : <Play className="w-4.5 h-4.5 fill-slate-950" />}
                    </button>

                    {/* Progress Bar */}
                    <div
                      onClick={handleYtSeekBarClick}
                      className="flex-grow h-2.5 bg-slate-800 rounded-full cursor-pointer relative"
                    >
                      <div
                        style={{ width: `${ytProgress}%` }}
                        className="h-full bg-amber-400 rounded-full transition-all duration-300"
                      />
                    </div>

                    {/* Volume */}
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-slate-400" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={ytVolume}
                        onChange={(e) => handleYtVolumeChange(Number(e.target.value))}
                        className="w-16 h-1 bg-slate-700 accent-amber-400 rounded-lg cursor-pointer appearance-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Interactive Pronunciation & Custom Audios */}
            <div className="space-y-6">
              {/* Target Word Interactive Pronunciation Card */}
              {hasLetterSounds && (
                <div className="bg-slate-800 border border-slate-700/40 rounded-3xl p-5 shadow-xl text-center flex flex-col items-center">
                  <h3 className="text-xs font-bold text-slate-300 mb-4 flex items-center gap-1.5 justify-center">
                    <Volume2 className="w-4.5 h-4.5 text-amber-400" />
                    <span>انقر على كل حرف بالترتيب للاستماع لنطقه الصحيح</span>
                  </h3>

                  {/* Word Box */}
                  <div className="px-8 py-6 bg-slate-950/80 border border-slate-850 rounded-3xl relative min-w-[200px] mb-4">
                    <div className="flex flex-row-reverse items-center justify-center gap-5">
                      {lesson.word.split('').map((char, index) => {
                        const isListened = listenedLetters.has(index);
                        const isActive = activeLetterIdx === index;
                        return (
                          <div key={index} className="flex flex-col items-center gap-3">
                            {/* Interactive Letter Button */}
                            <button
                              onClick={() => playLetter(lesson.letterSounds[index], index)}
                              className={`w-14 h-14 rounded-2xl text-2xl font-bold transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center ${
                                isActive
                                  ? 'bg-amber-400 text-slate-950 scale-105 shadow-amber-500/10'
                                  : isListened
                                  ? 'bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400'
                                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              {char}
                            </button>
                            {/* Letter dot progress marker */}
                            <div
                              className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                                isListened
                                  ? 'bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/20'
                                  : 'bg-rose-600 border-rose-500'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Feedbacks */}
                    {letterMsg && (
                      <p className="text-[11px] text-amber-400 font-bold mt-4 leading-relaxed max-w-xs mx-auto">
                        {letterMsg}
                      </p>
                    )}
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2.5 rounded-xl border border-slate-800/60 w-full max-w-xs justify-center">
                    <span className="text-[11px] text-slate-400">حجم صوت الحروف:</span>
                    <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={letterVolume}
                      onChange={(e) => handleLetterVolumeChange(Number(e.target.value))}
                      className="w-24 h-1 bg-slate-700 accent-amber-400 rounded-lg cursor-pointer appearance-none"
                    />
                  </div>
                </div>
              )}

              {/* Explanation Audio Card */}
              {lesson.explainSound && (
                <div className="bg-slate-800 border border-slate-700/40 rounded-3xl p-5 shadow-xl text-center">
                  <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5 justify-center">
                    <Volume2 className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
                    <span>صوت شرح الدرس وقراءة المعلم</span>
                  </h3>

                  {/* custom controller panel */}
                  <div className="flex items-center justify-between gap-4 p-3 bg-slate-900 rounded-2xl mb-2.5">
                    <button
                      onClick={audioPlaying ? pauseExplanationAudio : playExplanationAudio}
                      className="p-3 bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-600 active:scale-90 transition-all cursor-pointer shadow-md"
                    >
                      {audioPlaying ? <Pause className="w-4.5 h-4.5 fill-slate-950" /> : <Play className="w-4.5 h-4.5 fill-slate-950" />}
                    </button>

                    <div
                      onClick={handleAudioSeekBarClick}
                      className="flex-grow h-2.5 bg-slate-800 rounded-full cursor-pointer relative"
                    >
                      <div
                        style={{ width: `${audioProgress}%` }}
                        className="h-full bg-amber-400 rounded-full transition-all duration-300"
                      />
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono select-none">{audioTimeStr}</span>
                  </div>

                  {/* volume bar */}
                  <div className="flex items-center gap-2 justify-end px-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={audioVolume}
                      onChange={(e) => handleAudioVolumeChange(Number(e.target.value))}
                      className="w-20 h-1 bg-slate-700 accent-amber-400 rounded-lg cursor-pointer appearance-none"
                    />
                  </div>
                </div>
              )}

              {/* Full Lesson Audio Listening Score Card */}
              {lesson.fullSound && (
                <div className="bg-slate-800 border border-slate-700/40 rounded-3xl p-5 shadow-xl text-center">
                  <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5 justify-center">
                    <Sparkles className="w-4.5 h-4.5 text-amber-400 animate-bounce" />
                    <span>الاستماع الكامل الموجه للدرس</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed mb-4 max-w-xs mx-auto">
                    {lesson.instruction || 'يرجى الاستماع بالكامل للدرس الصوتي لتثبيت الفهم والحصول على العلامة التامة.'}
                  </p>

                  <div className="flex flex-col items-center gap-3 bg-slate-950/85 p-4 rounded-2xl border border-slate-850">
                    <button
                      onClick={fullAudioPlaying ? pauseFullAudio : playFullAudio}
                      className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 hover:from-amber-600 hover:to-amber-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-amber-500/10 active:scale-95 transition-all"
                    >
                      {fullAudioPlaying ? <Pause className="w-6 h-6 fill-slate-950" /> : <Play className="w-6 h-6 fill-slate-950 ml-1" />}
                    </button>

                    <span className="text-xs font-mono text-slate-300 select-none font-bold">{fullAudioTimeStr}</span>

                    {/* listening volume */}
                    <div className="flex items-center gap-2 mt-1">
                      <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={fullAudioVolume}
                        onChange={(e) => handleFullAudioVolumeChange(Number(e.target.value))}
                        className="w-20 h-1 bg-slate-700 accent-amber-400 rounded-lg cursor-pointer appearance-none"
                      />
                    </div>
                  </div>

                  {/* Percentage score results alert */}
                  {fullAudioMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-4 p-3 rounded-xl border text-xs leading-relaxed ${
                        fullAudioMessage.success
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}
                    >
                      {fullAudioMessage.text}
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ASSIGNMENT */}
      {activeTab === 'assignment' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Voice Recorder assignment */}
            {(lesson.allowRecording === 'نعم' || lesson.allowRecording === '') && (
              <div className="bg-slate-800 border border-slate-700/40 rounded-3xl p-5 shadow-xl text-center flex flex-col items-center">
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 mb-3.5">
                  <Mic className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">الواجب الصوتي لقراءة الطالب 🎙️</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1 max-w-xs mx-auto mb-4">
                  سجل صوتك أثناء قراءة الكلمة المستهدفة ({lesson.word}) أو اختر ملفاً صوتياً جاهزاً لإرساله وتصحيحه.
                </p>

                {/* Recorder Console Dashboard */}
                <div className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col items-center mb-4">
                  {/* Visual Wave */}
                  {recording ? (
                    <div className="flex items-center gap-1.5 h-12 mb-3">
                      <span className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce" />
                      <span className="w-1.5 h-10 bg-red-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1.5 h-12 bg-red-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                      <span className="w-1.5 h-7 bg-red-500 rounded-full animate-bounce [animation-delay:0.45s]" />
                      <span className="w-1.5 h-4 bg-red-500 rounded-full animate-bounce [animation-delay:0.6s]" />
                    </div>
                  ) : (
                    <div className="h-12 flex items-center justify-center text-slate-500 text-xs mb-3 font-mono">
                      {recordedAudioUrl ? 'تم تسجيل الصوت! جاهز للمراجعة والرفع.' : 'الميكروفون جاهز لبدء التسجيل'}
                    </div>
                  )}

                  {/* Timer */}
                  {recording && (
                    <span className="text-red-500 text-sm font-bold block mb-4">
                      جاري التسجيل: {formatTime(recordingSeconds)} ثانية
                    </span>
                  )}

                  {/* Local Preview Audio Player */}
                  {recordedAudioUrl && !recording && (
                    <audio src={recordedAudioUrl} controls className="w-full max-w-[280px] mb-4 accent-amber-400" />
                  )}

                  {/* Controls Row */}
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {!recordedAudioUrl && !recording && (
                      <>
                        <button
                          onClick={startRecording}
                          className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 text-xs active:scale-95 cursor-pointer"
                        >
                          <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                          <span>ابدأ تسجيل الواجب الصوتي</span>
                        </button>
                        {/* Custom local file picker */}
                        <label className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 font-bold rounded-xl transition-all flex items-center gap-1.5 text-xs active:scale-95 cursor-pointer">
                          <Upload className="w-4 h-4 text-amber-400" />
                          <span>اختيار ملف</span>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleManualAudioUpload}
                            className="hidden"
                          />
                        </label>
                      </>
                    )}

                    {recording && (
                      <button
                        onClick={() => stopRecording()}
                        className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-1.5 text-xs active:scale-95 cursor-pointer"
                      >
                        <span>إيقاف التسجيل ومعاينة ⏹️</span>
                      </button>
                    )}

                    {recordedAudioUrl && !recording && !audioUploadSuccess && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleUploadAudio}
                          disabled={uploadingAudio}
                          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all flex items-center gap-1 text-xs disabled:opacity-50 cursor-pointer"
                        >
                          {uploadingAudio ? 'جاري الرفع...' : 'إرسال وموافق 🟢'}
                        </button>
                        {remainingRetries > 0 && (
                          <button
                            onClick={handleAudioRetry}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/50 font-bold rounded-xl transition-all flex items-center gap-1 text-xs cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>إعادة ({remainingRetries})</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Status alerts */}
                {audioUploadSuccess && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 w-full justify-center"
                  >
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span>تم إرسال تسليم واجبك الصوتي بنجاح! 🎉</span>
                    {savedRecordingLink && (
                      <a href={savedRecordingLink} target="_blank" className="text-amber-400 underline font-semibold mr-1.5 flex items-center gap-0.5">
                        استماع
                      </a>
                    )}
                  </motion.div>
                )}

                {audioUploadError && (
                  <p className="text-[11px] text-rose-400 leading-relaxed font-semibold mt-2">{audioUploadError}</p>
                )}
              </div>
            )}

            {/* Right Column: Photo assignment */}
            {(lesson.allowUpload === 'نعم' || lesson.allowUpload === '') && (
              <div className="bg-slate-800 border border-slate-700/40 rounded-3xl p-5 shadow-xl text-center flex flex-col items-center">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 mb-3.5">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">{lesson.uploadTitle || 'رفع صورة الواجب المساعد 📸'}</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1 max-w-xs mx-auto mb-4">
                  التقط صورة بكاميرا جهازك الآن مع علامة مائية ذكية، أو اختر صورة جاهزة لإرسالها.
                </p>

                {/* Camera Console Dashboard */}
                <div className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col items-center mb-4 min-h-[160px] justify-center">
                  {/* Video Stream Preview */}
                  {cameraActive && (
                    <div className="relative aspect-square w-full max-w-[240px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 mb-4">
                      <video
                        ref={videoStreamRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover -scale-x-100" // Mirror view
                      />
                    </div>
                  )}

                  {/* Captured Photo Preview */}
                  {capturedImagePreview && (
                    <div className="relative aspect-square w-full max-w-[240px] rounded-xl overflow-hidden border border-slate-850 bg-slate-900 mb-4 shadow-lg">
                      <img src={capturedImagePreview} className="w-full h-full object-cover" alt="Captured" />
                    </div>
                  )}

                  {/* Control Actions */}
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {!cameraActive && !capturedImagePreview && (
                      <>
                        <button
                          onClick={startCamera}
                          className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-1.5 text-xs active:scale-95 cursor-pointer shadow-md shadow-amber-500/10"
                        >
                          <span>التقاط بالكاميرا 📷</span>
                        </button>
                        <label className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 font-bold rounded-xl transition-all flex items-center gap-1.5 text-xs active:scale-95 cursor-pointer">
                          <Upload className="w-4 h-4 text-amber-400" />
                          <span>اختيار ملف</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleManualImageUpload}
                            className="hidden"
                          />
                        </label>
                      </>
                    )}

                    {cameraActive && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={capturePhoto}
                          className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-1.5 text-xs active:scale-95 cursor-pointer"
                        >
                          <span>قص والتقاط الصورة 📸</span>
                        </button>
                        <button
                          onClick={stopCamera}
                          className="px-4 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    )}

                    {capturedImagePreview && !cameraActive && !imageUploadSuccess && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleUploadPhoto}
                          disabled={uploadingImage}
                          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all flex items-center gap-1 text-xs disabled:opacity-50 cursor-pointer"
                        >
                          {uploadingImage ? 'جاري الرفع...' : 'إرسال وموافق 🟢'}
                        </button>
                        <button
                          onClick={() => {
                            setCapturedImagePreview(null);
                            setCapturedImageBase64(null);
                            startCamera();
                          }}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/50 font-bold rounded-xl transition-all text-xs cursor-pointer"
                        >
                          إعادة تصوير
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload status */}
                {imageUploadSuccess && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 w-full justify-center"
                  >
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span>تم إرسال الصورة وتوثيقها بنجاح! 🎉</span>
                    {savedImageLink && (
                      <a href={savedImageLink} target="_blank" className="text-amber-400 underline font-semibold mr-1.5 flex items-center gap-0.5">
                        معاينة
                      </a>
                    )}
                  </motion.div>
                )}

                {imageUploadError && (
                  <p className="text-[11px] text-rose-400 leading-relaxed font-semibold mt-2">{imageUploadError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX FOR IMAGE PREVIEW */}
      <AnimatePresence>
        {lightboxImg && (
          <div
            onClick={() => setLightboxImg(null)}
            className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-full max-h-full"
            >
              <img src={lightboxImg} className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain border border-slate-800" alt="Enlarged view" />
              <button
                onClick={() => setLightboxImg(null)}
                className="absolute -top-12 left-0 p-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-full hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY INTERACTIVE QUESTIONS */}
      <AnimatePresence>
        {currentQuestion && (
          <QuestionModal
            question={currentQuestion}
            onClose={() => {
              setCurrentQuestion(null);
              if (currentQuestionType === 'video' && ytPlayerRef.current) {
                ytPlayerRef.current.playVideo();
              } else if (currentQuestionType === 'audio' && audioObjRef.current) {
                audioObjRef.current.play();
                setAudioPlaying(true);
              }
              setCurrentQuestionType(null);
            }}
            onSubmit={handleQuestionSubmit}
            showResult={lesson.showResult}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
