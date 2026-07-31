import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Check, AlertCircle, Copy, CheckCircle2, HelpCircle, ExternalLink, Globe } from 'lucide-react';
import { getWebAppUrl } from '../api';

interface SettingsPanelProps {
  onClose: () => void;
  onSave: (url: string) => void;
}

export default function SettingsPanel({ onClose, onSave }: SettingsPanelProps) {
  const [url, setUrl] = useState(getWebAppUrl());
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = () => {
    localStorage.setItem('webAppUrl', url);
    onSave(url);
    onClose();
  };

  const handleTestConnection = async () => {
    if (!url.trim()) {
      setTestResult({ success: false, message: 'يرجى إدخال رابط صالح أولاً.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`${url.trim()}?action=getWords&sheetName=test_dummy_nonexistent`, {
        method: 'GET',
        redirect: 'follow',
      });
      // Since dummy sheet name might fail or return empty, any JSON response means server is alive!
      const data = await response.json();
      setTestResult({
        success: true,
        message: 'تم الاتصال بالخادم بنجاح! خادم Apps Script نشط ومستعد.',
      });
    } catch (err: any) {
      // Even if it returns error, if we get any CORS redirect response it's good, but let's be realistic:
      console.error('Test connection error:', err);
      setTestResult({
        success: false,
        message: 'فشل الاتصال. يرجى التأكد من نشر الكود كـ Web App بصلاحيات "Anyone" وإتاحة الوصول.',
      });
    } finally {
      setTesting(false);
    }
  };

  const copyCodeToClipboard = () => {
    const code = getFullAppsScriptCode();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="settings-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">إعدادات الاتصال بقاعدة البيانات</h2>
              <p className="text-xs text-slate-400 mt-0.5">اربط تطبيق الويب بجدول بيانات Google Sheets الخاص بك</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 hover:bg-slate-800/60 rounded-xl transition-all"
          >
            ✕
          </button>
        </div>

        {/* Input Field */}
        <div className="space-y-4 mb-6 text-right" dir="rtl">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">رابط تطبيق Google Apps Script (Web App URL):</label>
            <div className="relative">
              <input
                type="url"
                dir="ltr"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-xl placeholder-slate-600 outline-none transition-all pr-12 text-sm"
              />
              <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            </div>
          </div>

          {/* Test & Save Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-amber-500/10 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Check className="w-4.5 h-4.5" />
              <span>حفظ الإعدادات وتطبيق</span>
            </button>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {testing ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <HelpCircle className="w-4.5 h-4.5 text-amber-400" />
              )}
              <span>فحص الاتصال</span>
            </button>
          </div>

          {/* Test Feedback */}
          {testResult && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl flex items-start gap-3 border ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <span className="text-xs font-medium leading-relaxed">{testResult.message}</span>
            </motion.div>
          )}
        </div>

        {/* Detailed Guide */}
        <div className="border-t border-slate-800/80 pt-6 text-right" dir="rtl">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
            <HelpCircle className="w-4.5 h-4.5 text-amber-400" />
            <span>كيف تقوم بإعداد وربط جدول البيانات (Google Sheet)؟</span>
          </h3>

          <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-400 leading-relaxed pr-1 mb-6">
            <li>أنشئ ملف Google Sheet جديد في حسابك.</li>
            <li>قم بتسمية الصفحات الداخلية بنفس الأسماء الأصلية: <code className="bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono">Profile</code> و <code className="bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono">Contact</code> و <code className="bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono">About</code> و <code className="bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono">Settings</code> و <code className="bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono">Answers</code> بالإضافة لصفحات أرقام الشيتات للدروس.</li>
            <li>من القائمة العلوية لـ Google Sheet، اختر <span className="text-slate-200 font-semibold">Extensions</span> ثم <span className="text-slate-200 font-semibold">Apps Script</span>.</li>
            <li>احذف أي كود موجود هناك، ثم اضغط على الزر أدناه لنسخ كود Apps Script المطور بالكامل، وألصقه في المحرر.</li>
            <li>قم بتغيير معرف الـ Spreadsheet ID في السطر رقم 14 في كود Apps Script ليتطابق مع رابط ملف الشيت الخاص بك.</li>
            <li>اضغط على زر <span className="text-slate-200 font-semibold">Deploy</span> ثم <span className="text-slate-200 font-semibold">New Deployment</span>.</li>
            <li>اختر نوع المشروع <span className="text-slate-200 font-semibold">Web App</span>، واجعل صلاحية الوصول <span className="text-amber-400 font-semibold">"Anyone"</span> لكي يتمكن الطلاب من التسجيل، ثم اضغط Deploy.</li>
            <li>انسخ رابط الـ Web App URL الناتج وضعه في المربع المخصص في أعلى هذه النافذة ثم اضغط حفظ!</li>
          </ol>

          {/* Copy Code Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-xl text-amber-400">
                <Copy className="w-4.5 h-4.5" />
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold text-slate-200">كود Apps Script المطور بالكامل</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">جاهز للنسخ المباشر ويدعم الـ React API بالكامل</p>
              </div>
            </div>
            <button
              onClick={copyCodeToClipboard}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-600 active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تم نسخ الكود!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ الكود بالكامل</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Full Upgraded Apps Script Code compiled for easy user setup
function getFullAppsScriptCode(): string {
  return `/**
 * Google Apps Script - كود الخلفية المطور لقاعدة بيانات الطلاب والدروس التفاعلية
 * يدعم الاستدعاء كـ API كامل لصفحة الـ React الخارجية بدون مشاكل CORS وبأقصى درجات الحماية والأمان.
 */

var SPREADSHEET_ID = '1967wIJrB-0hVLHxH6rdkZbscO2S7GwxlHObtsmWFnFU'; // معرف جدول البيانات الجديد

function doGet(e) {
  var action = e.parameter.action;
  var response;
  
  try {
    if (action === 'getWords') {
      var sheetName = e.parameter.sheetName;
      var username = e.parameter.username;
      response = getWords(sheetName, username);
    } else if (action === 'getFullAudioScore') {
      response = { score: getFullAudioScore(e.parameter.comment, e.parameter.sheet_number, e.parameter.username, e.parameter.word) };
    } else if (action === 'getLetterListenScore') {
      response = { score: getLetterListenScore(e.parameter.comment, e.parameter.sheet_number, e.parameter.username, e.parameter.word) };
    } else if (action === 'getRecordingLink') {
      response = { link: getRecordingLink(e.parameter.comment, e.parameter.sheet_number, e.parameter.username, e.parameter.word) };
    } else if (action === 'getImageLink') {
      response = { link: getImageLink(e.parameter.comment, e.parameter.sheet_number, e.parameter.username, e.parameter.word) };
    } else if (action === 'getAdminQuestions') {
      response = getAdminQuestions();
    } else if (action === 'getAdminAnswers') {
      response = getAdminAnswers();
    } else {
      // افتراضي: إرجاع البيانات العامة لصفحة الواجهة
      response = getData();
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var response;
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = e.parameter.action || payload.action;
    
    if (action === 'loginUser') {
      response = loginUser(payload.username, payload.sheet_number, payload.deviceId, payload.lat, payload.lng);
    } else if (action === 'saveAnswer') {
      response = saveAnswer(payload);
    } else if (action === 'saveFullAudioScore') {
      response = saveFullAudioScore(payload.sheet_number, payload.username, payload.word, payload.score, payload.timestamp, payload.comment);
    } else if (action === 'saveLetterListenScore') {
      response = saveLetterListenScore(payload.sheet_number, payload.username, payload.word, payload.score, payload.timestamp, payload.comment);
    } else if (action === 'uploadImageFromBase64') {
      var link = uploadImageFromBase64(payload.base64Data, payload.mimeType, payload.word, payload.username, payload.sheet_number, payload.comment);
      response = { success: true, link: link };
    } else if (action === 'uploadRecordingFromBase64') {
      var link = uploadRecordingFromBase64(payload.base64Data, payload.mimeType, payload.word, payload.username, payload.sheet_number, payload.comment);
      response = { success: true, link: link };
    } else if (action === 'saveImageLink') {
      saveImageLink(payload.sheet_number, payload.username, payload.comment, payload.link, payload.timestamp, payload.word);
      response = { success: true };
    } else if (action === 'saveRecordingLink') {
      saveRecordingLink(payload.sheet_number, payload.username, payload.comment, payload.link, payload.timestamp, payload.word);
      response = { success: true };
    } else if (action === 'markLessonCompleted') {
      markLessonCompleted(payload.sheetName, payload.lessonIndex, payload.username, payload.comment, payload.word);
      response = { success: true };
    } else if (action === 'unmarkLessonCompleted') {
      unmarkLessonCompleted(payload.sheetName, payload.lessonIndex, payload.username, payload.comment, payload.word);
      response = { success: true };
    } else if (action === 'resetToCompleted') {
      resetToCompleted(payload.sheetName, payload.lessonIndex, payload.username, payload.comment, payload.word);
      response = { success: true };
    } else if (action === 'decrementRetryCount') {
      decrementRetryCount(payload.sheetName, payload.lessonIndex, payload.username, payload.comment, payload.word);
      response = { success: true };
    } else if (action === 'saveAdminQuestion') {
      response = saveAdminQuestion(payload);
    } else if (action === 'deleteAdminQuestion') {
      response = deleteAdminQuestion(payload);
    } else if (action === 'updateAdminAnswer') {
      response = updateAdminAnswer(payload);
    } else {
      response = { success: false, message: 'الإجراء المطلوب غير معروف' };
    }
  } catch (error) {
    response = { success: false, message: error.message };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ------------------- دوال استدعاء وقراءة البيانات -------------------

function getData() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var profileSheet = ss.getSheetByName('Profile');
  var contactSheet = ss.getSheetByName('Contact');
  var aboutSheet = ss.getSheetByName('About');
  
  var profileData = profileSheet ? profileSheet.getDataRange().getValues() : [];
  var contactData = contactSheet ? contactSheet.getDataRange().getValues() : [];
  var aboutData = aboutSheet ? aboutSheet.getDataRange().getValues() : [];
  
  var buttonsData = [];
  for (var i = 11; i <= 15; i++) {
    if (profileData[i]) {
      buttonsData.push({
        buttonText: profileData[i][1] ? profileData[i][1].toString().trim() : 'زر بدون نص',
        buttonUrl: profileData[i][2] ? profileData[i][2].toString().trim() : '#'
      });
    }
  }
  
  var headerData = {
    logoUrl: profileData[9] && profileData[9][2] ? profileData[9][2].toString().trim() : '',
    mainTitle: profileData[9] && profileData[9][1] ? profileData[9][1].toString().trim() : '',
    description: profileData[10] && profileData[10][1] ? profileData[10][1].toString().trim() : '',
    buttons: buttonsData
  };
  
  return {
    profile: profileData.slice(1),
    contact: contactData.slice(1),
    about: aboutData.slice(1),
    header: headerData
  };
}

function loginUser(username, sheet_number, deviceId, lat, lng) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var settingsSheet = ss.getSheetByName('Settings');
    if (!settingsSheet) return { success: false, message: 'ورقة الإعدادات Settings غير موجودة' };
    var data = settingsSheet.getDataRange().getValues();
    var userRow = -1;
    for (var r = 1; r < data.length; r++) {
      var user = data[r][25] ? data[r][25].toString().trim() : '';
      var sheetNum = data[r][26] ? data[r][26].toString().trim() : '';
      if (user === username && sheetNum === sheet_number) {
        userRow = r + 1;
        break;
      }
    }
    if (userRow === -1) {
      return { success: false, message: 'اسم الطالب أو رقم الورقة غير صحيح' };
    }
    var status = data[userRow - 1][27] ? data[userRow - 1][27].toString().trim() : 'نعم';
    if (status === 'لا') {
      return { success: false, message: 'تم منع الدخول لهذا المستخدم' };
    }
    
    var deviceColumns = [
      {locationCol: 31, deviceCol: 32},
      {locationCol: 33, deviceCol: 34},
      {locationCol: 35, deviceCol: 36},
      {locationCol: 37, deviceCol: 38},
      {locationCol: 39, deviceCol: 40},
      {locationCol: 41, deviceCol: 42},
      {locationCol: 43, deviceCol: 44},
      {locationCol: 45, deviceCol: 46},
      {locationCol: 47, deviceCol: 48},
      {locationCol: 49, deviceCol: 50}
    ];
    var allowedDevices = parseInt(data[userRow - 1][28]) || 1;
    allowedDevices = Math.min(allowedDevices, 10);
    var deviceIndex = -1;
    for (var j = 0; j < allowedDevices; j++) {
      var currentDeviceId = data[userRow - 1][deviceColumns[j].deviceCol - 1] ? data[userRow - 1][deviceColumns[j].deviceCol - 1].toString().trim() : '';
      if (currentDeviceId === deviceId) {
        deviceIndex = j;
        break;
      }
    }
    var registeredCount = 0;
    for (var j = 0; j < allowedDevices; j++) {
      var currentDeviceId = data[userRow - 1][deviceColumns[j].deviceCol - 1] ? data[userRow - 1][deviceColumns[j].deviceCol - 1].toString().trim() : '';
      if (currentDeviceId !== '') {
        registeredCount++;
      }
    }
    if (deviceIndex === -1) {
      if (registeredCount >= allowedDevices) {
        return { success: false, message: 'تم تجاوز عدد الأجهزة المسموحة' };
      }
      for (var j = 0; j < allowedDevices; j++) {
        if (data[userRow - 1][deviceColumns[j].deviceCol - 1] === '') {
          deviceIndex = j;
          break;
        }
      }
    }
    var location = 'غير متاح';
    if (lat && lng) {
      try {
        var geocoder = Maps.newGeocoder().reverseGeocode(lat, lng);
        if (geocoder.results && geocoder.results.length > 0) {
          location = geocoder.results[0].formatted_address;
        }
      } catch (geoErr) {
        location = lat + ',' + lng;
      }
    }
    if (deviceIndex !== -1) {
      settingsSheet.getRange(userRow, deviceColumns[deviceIndex].locationCol).setValue(location);
      settingsSheet.getRange(userRow, deviceColumns[deviceIndex].deviceCol).setValue(deviceId);
    } else {
      return { success: false, message: 'خطأ في تسجيل الجهاز' };
    }
    
    var questionsSheet = ss.getSheetByName('Questions');
    if (!questionsSheet) {
      return { success: false, message: 'ورقة الأسئلة Questions غير موجودة في جدول البيانات' };
    }
    return { success: true, sheetName: sheet_number };
  } catch (e) {
    return { success: false, message: 'خطأ في الدخول: ' + e.message };
  }
}

function formatDriveImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  url = url.trim();
  if (!url) return '';

  var fileId = null;
  var fileDMatch = url.match(/\\/file\\/d\\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    fileId = fileDMatch[1];
  } else {
    var idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      fileId = idMatch[1];
    } else {
      var ucMatch = url.match(/googleusercontent\\.com\\/d\\/([a-zA-Z0-9_-]+)/);
      if (ucMatch && ucMatch[1]) {
        fileId = ucMatch[1];
      }
    }
  }

  if (fileId) {
    return 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1200';
  }

  return url;
}

function getWords(sheetName, username) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var questionsSheet = ss.getSheetByName('Questions');
  if (!questionsSheet) return [];
  
  var answersSheet = ss.getSheetByName('Answers');
  var answersData = answersSheet ? answersSheet.getDataRange().getValues() : [];
  
  var fullData = questionsSheet.getDataRange().getValues();
  var result = [];
  
  for (var rowIndex = 1; rowIndex < fullData.length; rowIndex++) {
    var row = fullData[rowIndex];
    if (row[0]) {
      var word = row[0].toString().trim(); // A (1)
      var rawLinks = row[1] ? row[1].toString() : ''; // B (2)
      var fullSound = row[2] ? row[2].toString().trim() : ''; // C (3)
      var comment = row[3] ? row[3].toString().trim() : ''; // D (4) - المعرف الربطي للدرس
      var image = row[4] ? formatDriveImageUrl(row[4].toString().trim()) : ''; // E (5)
      var explainSound = row[5] ? row[5].toString().trim() : ''; // F (6)
      var youtubeUrl = row[6] ? row[6].toString().trim() : ''; // G (7)
      var showResult = row[7] ? row[7].toString().trim() : 'نعم'; // H (8)
      var totalQuestionsCount = row[8] ? (parseInt(row[8].toString().trim()) || 0) : 0; // I (9)

      // الإعدادات والمحددات المتقدمة للدرس من ورقة Questions
      var instruction = row[94] ? row[94].toString().trim() : ''; // CQ (95)
      var allowRecording = row[95] ? row[95].toString().trim() : ''; // CR (96)
      var maxRecordingTime = row[97] ? (parseInt(row[97].toString().trim()) || 0) : 0; // CT (98)
      var retryCount = row[98] ? (parseInt(row[98].toString().trim()) || 0) : 0; // CU (99)
      var showPrevButton = row[100] ? row[100].toString().trim() : ''; // CW (101)
      var allowUpload = row[102] ? row[102].toString().trim() : ''; // CY (103)
      var defaultRetryResetCount = row[104] ? (parseInt(row[104].toString().trim()) || 0) : 0; // DA (105)
      var startDate = row[105] ? (row[105] instanceof Date ? Utilities.formatDate(row[105], Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd HH:mm") : row[105].toString().trim()) : ''; // DB (106)
      var endDate = row[106] ? (row[106] instanceof Date ? Utilities.formatDate(row[106], Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd HH:mm") : row[106].toString().trim()) : ''; // DC (107)

      // قراءة حالة إكمال الدرس وعدد الإعادات المتبقية للطالب المنسوب من ورقة Answers (العمود AO / Column 41 / index 40 و العمود AP / Column 42 / index 41)
      var completed = '';
      var studentRetryResetCount = null;
      if (answersData.length > 1 && comment) {
        for (var a = 1; a < answersData.length; a++) {
          var aSheetNum = answersData[a][0] ? answersData[a][0].toString().trim() : '';
          var aUser = answersData[a][1] ? answersData[a][1].toString().trim() : '';
          var aComment = answersData[a][2] ? answersData[a][2].toString().trim() : '';
          
          if ((!sheetName || aSheetNum === sheetName.toString().trim()) &&
              (!username || aUser === username.toString().trim()) &&
              aComment === comment) {
            completed = answersData[a][40] ? answersData[a][40].toString().trim() : ''; // العمود AO (41)
            if (answersData[a][41] !== undefined && answersData[a][41] !== null && answersData[a][41] !== '') {
              studentRetryResetCount = parseInt(answersData[a][41].toString().trim());
            }
            break;
          }
        }
      }

      var retryResetCount = (studentRetryResetCount !== null && !isNaN(studentRetryResetCount)) ? studentRetryResetCount : defaultRetryResetCount;

      var letterSounds = rawLinks
        .split(/[,،]\\s*/)
        .map(function(s) { return s.trim(); })
        .filter(function(s) { return s.indexOf('http') === 0; });

      // أسئلة الفيديو (الأعمدة J إلى CF - index 9 إلى 83 - 15 سؤالاً، كل سؤال 5 أعمدة)
      var questions = [];
      var videoSlot = 0;
      for (var j = 9; j < row.length && videoSlot < 15; j += 5, videoSlot++) {
        if (row[j] !== undefined && row[j] !== null && row[j].toString().trim() !== '') {
          var time = parseFloat(row[j].toString().trim());
          if (isNaN(time)) time = 0;
          var questionImage = row[j + 1] ? formatDriveImageUrl(row[j + 1].toString().trim()) : '';
          var questionText = row[j + 2] ? row[j + 2].toString().trim() : '';
          var optionsStr = row[j + 3] ? row[j + 3].toString().trim() : '';
          var correctAnswer = row[j + 4] ? row[j + 4].toString().trim() : '';

          if (questionText !== '' || questionImage !== '') {
            var options = [];
            if (optionsStr && optionsStr !== 'نص') {
              options = optionsStr.split(',');
            }
            questions.push({
              slotIndex: videoSlot,
              time: time,
              image: questionImage,
              question: questionText,
              options: options.map(function(opt) { return opt.trim(); }),
              correctAnswer: correctAnswer
            });
          }
        }
      }

      // أسئلة الصوت والاستماع (الأعمدة CG إلى CP - index 84 إلى 93 - سؤالان)
      var audioQuestions = [];
      var audioSlot = 0;
      for (var j = 84; j < row.length && audioSlot < 2; j += 5, audioSlot++) {
        if (row[j] !== undefined && row[j] !== null && row[j].toString().trim() !== '') {
          var time = parseFloat(row[j].toString().trim());
          if (isNaN(time)) time = 0;
          var questionImage = row[j + 1] ? formatDriveImageUrl(row[j + 1].toString().trim()) : '';
          var questionText = row[j + 2] ? row[j + 2].toString().trim() : '';
          var optionsStr = row[j + 3] ? row[j + 3].toString().trim() : '';
          var correctAnswer = row[j + 4] ? row[j + 4].toString().trim() : '';

          if (questionText !== '' || questionImage !== '') {
            var options = [];
            if (optionsStr && optionsStr !== 'نص') {
              options = optionsStr.split(',');
            }
            audioQuestions.push({
              slotIndex: audioSlot,
              time: time,
              image: questionImage,
              question: questionText,
              options: options.map(function(opt) { return opt.trim(); }),
              correctAnswer: correctAnswer
            });
          }
        }
      }

      result.push({
        word: word,
        fullSound: fullSound,
        letterSounds: letterSounds,
        image: image,
        comment: comment,
        explainSound: explainSound,
        youtubeUrl: youtubeUrl,
        questions: questions,
        audioQuestions: audioQuestions,
        showResult: showResult,
        instruction: instruction,
        allowRecording: allowRecording,
        maxRecordingTime: maxRecordingTime,
        retryCount: retryCount,
        completed: completed,
        showPrevButton: showPrevButton,
        allowUpload: allowUpload,
        retryResetCount: retryResetCount,
        totalQuestionsCount: totalQuestionsCount,
        startDate: startDate,
        endDate: endDate
      });
    }
  }
  return result;
}

// ------------------- دوال مساعدة للبحث وإنشاء الصفوف -------------------

function findOrCreateAnswersRow(sheet, sheet_number, username, comment, word, youtubeUrl, explainSound) {
  var data = sheet.getDataRange().getValues();
  var rowNum = -1;
  
  var cleanSheetNum = sheet_number ? sheet_number.toString().trim() : '';
  var cleanUser = username ? username.toString().trim() : '';
  var cleanComment = comment ? comment.toString().trim() : '';
  var cleanWord = word ? word.toString().trim() : '';

  for (var r = 1; r < data.length; r++) {
    var aSheet = data[r][0] ? data[r][0].toString().trim() : '';
    var aUser = data[r][1] ? data[r][1].toString().trim() : '';
    var aComment = data[r][2] ? data[r][2].toString().trim() : '';
    var aWord = data[r][26] ? data[r][26].toString().trim() : ''; // العمود AA (27)

    if ((!cleanSheetNum || aSheet === cleanSheetNum) && (!cleanUser || aUser === cleanUser)) {
      var match = false;
      if (cleanComment !== '' && aComment === cleanComment) {
        match = true;
      } else if (cleanWord !== '' && (aComment === cleanWord || aWord === cleanWord)) {
        match = true;
      } else if (cleanComment !== '' && aWord === cleanComment) {
        match = true;
      }
      
      if (match) {
        rowNum = r + 1;
        if (cleanComment !== '' && aComment !== cleanComment) {
          sheet.getRange(rowNum, 3).setValue(cleanComment);
        }
        if (cleanWord !== '' && aWord !== cleanWord) {
          sheet.getRange(rowNum, 27).setValue(cleanWord);
        }
        break;
      }
    }
  }

  if (rowNum === -1) {
    var newRow = [cleanSheetNum, cleanUser, cleanComment, youtubeUrl ? youtubeUrl.toString().trim() : ''];
    for (var i = 0; i < 15; i++) newRow.push('');
    newRow.push('', '', explainSound ? explainSound.toString().trim() : '');
    for (var i = 0; i < 2; i++) newRow.push('');
    newRow.push('', '', cleanWord, '', '', '', '', '', '', '', 0, 0, 0, 0, '', '', '');
    sheet.appendRow(newRow);
    rowNum = sheet.getLastRow();
  }

  return rowNum;
}

function findAnswersRowOnly(sheet, sheet_number, username, comment, word) {
  var data = sheet.getDataRange().getValues();
  var cleanSheetNum = sheet_number ? sheet_number.toString().trim() : '';
  var cleanUser = username ? username.toString().trim() : '';
  var cleanComment = comment ? comment.toString().trim() : '';
  var cleanWord = word ? word.toString().trim() : '';

  for (var r = 1; r < data.length; r++) {
    var aSheet = data[r][0] ? data[r][0].toString().trim() : '';
    var aUser = data[r][1] ? data[r][1].toString().trim() : '';
    var aComment = data[r][2] ? data[r][2].toString().trim() : '';
    var aWord = data[r][26] ? data[r][26].toString().trim() : '';

    if ((!cleanSheetNum || aSheet === cleanSheetNum) && (!cleanUser || aUser === cleanUser)) {
      if (cleanComment !== '' && aComment === cleanComment) return r + 1;
      if (cleanWord !== '' && (aComment === cleanWord || aWord === cleanWord)) return r + 1;
      if (cleanComment !== '' && aWord === cleanComment) return r + 1;
    }
  }
  return -1;
}

// ------------------- دوال حفظ الأداء والإجابات -------------------

function saveAnswer(payload) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheetName = 'Answers';
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var headers = ['رقم الطالب', 'اسم الطالب', 'الموضوع', 'رابط الفيديو'];
    for (var i = 1; i <= 15; i++) { headers.push('النتيجة ' + i); }
    headers.push('التوقيت', 'فراغ', 'رابط الصوت');
    for (var i = 1; i <= 2; i++) { headers.push('النتيجة ' + i); }
    headers.push('التوقيت', 'فراغ', 'موضوع الصوت', 'درجة الاستماع', 'درجة استماع الحروف', 'رابط التسجيل', 'تاريخ الإرسال', 'فراغ', 'رابط الصورة', 'تاريخ إرسال الصورة', 'عدد إرسال فيديو', 'عدد إرسال صوت', 'عدد إرسال تسجيل', 'عدد إرسال صورة', 'النتيجة الكلية', 'الدرجة النهائية', 'حالة الدرس');
    sheet.appendRow(headers);
  }

  var rowNum = findOrCreateAnswersRow(sheet, payload.sheet_number, payload.username, payload.comment, payload.word, payload.youtubeUrl, payload.explainSound);
  
  if (payload.youtubeUrl && payload.youtubeUrl.trim()) {
    sheet.getRange(rowNum, 4).setValue(payload.youtubeUrl.trim());
  }
  if (payload.explainSound && payload.explainSound.trim()) {
    sheet.getRange(rowNum, 22).setValue(payload.explainSound.trim());
  }

  var result = '';
  if (payload.isCorrect === null) {
    result = payload.selectedAnswer.trim();
  } else {
    result = payload.isCorrect ? 'صح' : 'خطأ';
  }
  
  if (payload.type === 'video') {
    var col = 5 + payload.questionIndex;
    sheet.getRange(rowNum, col).setValue(result);
    if (payload.questionIndex === 0) {
      sheet.getRange(rowNum, 20).setValue(payload.timestamp);
      var currentVideoCount = sheet.getRange(rowNum, 35).getValue() || 0;
      sheet.getRange(rowNum, 35).setValue(currentVideoCount + 1);
    }
    calculateResults(payload.sheet_number, payload.comment, rowNum);
  } else if (payload.type === 'audio') {
    var col = 23 + payload.questionIndex;
    sheet.getRange(rowNum, col).setValue(result);
    if (payload.questionIndex === 0) {
      sheet.getRange(rowNum, 25).setValue(payload.timestamp);
      var currentAudioCount = sheet.getRange(rowNum, 36).getValue() || 0;
      sheet.getRange(rowNum, 36).setValue(currentAudioCount + 1);
    }
    calculateSectionTwo(payload.sheet_number, payload.comment, rowNum);
  }
  return { success: true };
}

function calculateResults(sheet_number, comment, rowNum) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var questionsSheet = ss.getSheetByName('Questions');
  var answersSheet = ss.getSheetByName('Answers');
  if (!answersSheet) return;

  var totalQuestions = 0;
  if (questionsSheet && comment) {
    var qData = questionsSheet.getDataRange().getValues();
    for (var r = 1; r < qData.length; r++) {
      if (qData[r][3] && qData[r][3].toString().trim() === comment.toString().trim()) {
        totalQuestions = parseInt(qData[r][8]) || 0; // العمود I (9)
        break;
      }
    }
  }

  var answersRow = answersSheet.getRange(rowNum, 5, 1, 15).getValues()[0];
  var correct = 0;
  var wrong = 0;
  var answeredCount = 0;

  for (var col = 0; col < 15; col++) {
    var value = (answersRow[col] || "").toString().trim().toLowerCase();
    if (value === "") continue;
    answeredCount++;
    if (value === "صح" || value === "صحيح" || value === "true" || value === "✓") {
      correct++;
    } else if (value === "خطأ" || value === "خاطئ" || value === "false" || value === "✗") {
      wrong++;
    }
  }

  if (totalQuestions <= 0) {
    totalQuestions = answeredCount > 0 ? answeredCount : 15;
  }

  var noAnswer = totalQuestions - (correct + wrong);
  if (noAnswer < 0) noAnswer = 0;
  var percentage = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

  var resultText = "عدد الأسئلة " + totalQuestions + " - الصحيحة " + correct + " والخاطئة " + wrong;
  if (noAnswer > 0) {
    resultText += " و " + noAnswer + " لا يوجد إجابة";
  }
  resultText += " وحصلت على " + percentage + "%";

  answersSheet.getRange(rowNum, 21).setValue(resultText); // العمود U (21)
  calculatePercentages(answersSheet, rowNum);
}

function calculateSectionTwo(sheet_number, comment, rowNum) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var answersSheet = ss.getSheetByName('Answers');
  if (!answersSheet) return;
  var answersRow = answersSheet.getRange(rowNum, 23, 1, 2).getValues()[0];
  var w = (answersRow[0] || "").toString().trim().toLowerCase();
  var x = (answersRow[1] || "").toString().trim().toLowerCase();
  var wStatus = getStatus(w);
  var xStatus = getStatus(x);
  var score = 0;
  var total = 2;
  var resultText = "";
  
  if (wStatus === "text" || xStatus === "text") {
    total = 1;
    if (wStatus === "correct" || xStatus === "correct") {
      score = 1;
      resultText = "1 صح = 100%";
    } else if (wStatus === "wrong" || xStatus === "wrong") {
      score = 0;
      resultText = "1 خطأ = 0%";
    } else {
      score = 0;
      resultText = "0%";
    }
  } else {
    if (wStatus === "correct") score += 0.5;
    if (xStatus === "correct") score += 0.5;
    if (score === 1) {
      resultText = "2 صح = 100%";
    } else if (score === 0.5) {
      resultText = "1 صح و 1 خطأ = 50%";
    } else {
      resultText = "0%";
    }
  }
  if (w === "" && x === "") {
    resultText = "";
  }
  answersSheet.getRange(rowNum, 26).setValue(resultText);
  calculatePercentages(answersSheet, rowNum);
}

function getStatus(value) {
  if (value === "") return "empty";
  if (value === "صح" || value === "صحيح" || value === "true" || value === "✓") return "correct";
  if (value === "خطأ" || value === "خاطئ" || value === "false" || value === "✗") return "wrong";
  return "text";
}

function getFullAudioScore(comment, sheet_number, username, word) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return 0;
  var rowNum = findAnswersRowOnly(sheet, sheet_number, username, comment, word);
  if (rowNum !== -1) {
    var scoreStr = sheet.getRange(rowNum, 28).getValue(); // Column AB (28)
    if (scoreStr) {
      var score = parseFloat(scoreStr.toString().replace('%', ''));
      return isNaN(score) ? 0 : score;
    }
  }
  return 0;
}

function saveFullAudioScore(sheet_number, username, word, score, timestamp, comment) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return { success: false };

  var rowNum = findOrCreateAnswersRow(sheet, sheet_number, username, comment, word);

  sheet.getRange(rowNum, 27).setValue(word ? word.trim() : '');
  sheet.getRange(rowNum, 28).setValue(score + '%');
  calculatePercentages(sheet, rowNum);
  return { success: true };
}

function getLetterListenScore(comment, sheet_number, username, word) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return 0;
  var rowNum = findAnswersRowOnly(sheet, sheet_number, username, comment, word);
  if (rowNum !== -1) {
    var scoreStr = sheet.getRange(rowNum, 29).getValue(); // Column AC (29)
    if (scoreStr) {
      scoreStr = arabicToWestern(scoreStr.toString());
      scoreStr = scoreStr.replace(/%|٪/g, '').trim();
      var score = parseFloat(scoreStr);
      return isNaN(score) ? 0 : score;
    }
  }
  return 0;
}

function saveLetterListenScore(sheet_number, username, word, score, timestamp, comment) {
  if (score !== 100) return { success: false };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return { success: false };

  var rowNum = findOrCreateAnswersRow(sheet, sheet_number, username, comment, word);

  sheet.getRange(rowNum, 29).setValue(score + '%');
  calculatePercentages(sheet, rowNum);
  return { success: true };
}

function getRecordingLink(comment, sheet_number, username, word) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return '';
  var rowNum = findAnswersRowOnly(sheet, sheet_number, username, comment, word);
  if (rowNum !== -1) {
    return sheet.getRange(rowNum, 30).getValue() ? sheet.getRange(rowNum, 30).getValue().toString().trim() : ''; // Column AD (30)
  }
  return '';
}

function getImageLink(comment, sheet_number, username, word) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return '';
  var rowNum = findAnswersRowOnly(sheet, sheet_number, username, comment, word);
  if (rowNum !== -1) {
    return sheet.getRange(rowNum, 32).getValue() ? sheet.getRange(rowNum, 32).getValue().toString().trim() : ''; // Column AF (32)
  }
  return '';
}

// ------------------- دوال رفع ملفات الوسائط -------------------

function uploadImageFromBase64(base64Data, mimeType, word, username, sheet_number, comment) {
  try {
    var folderId = '1XRSjYZMT8j_0t5U9Jtdr8JNN1B2P2iL5';
    var actualMime = mimeType || 'image/jpeg';
    var actualWord = word || 'صورة';
    var actualUsername = username || 'طالب';
    var actualSheetNumber = sheet_number || '1';
    var actualComment = comment || getCommentForWord(actualSheetNumber, actualWord);
    
    var timestamp = new Date().toISOString().replace(/:/g, '-');
    var filename = 'صورة_' + actualUsername + '_' + actualSheetNumber + '_' + actualWord + '_' + timestamp + '.jpg';
    
    var decodedBytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decodedBytes, actualMime, filename);
    
    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    saveImageLink(actualSheetNumber, actualUsername, actualComment, file.getUrl(), new Date().toLocaleString(), actualWord);
    
    return file.getUrl();
  } catch (e) {
    throw new Error("فشل رفع الصورة إلى جوجل درايف: " + e.message);
  }
}

function uploadRecordingFromBase64(base64Data, mimeType, word, username, sheet_number, comment) {
  try {
    var folderId = '1XRSjYZMT8j_0t5U9Jtdr8JNN1B2P2iL5';
    var actualMime = mimeType || 'audio/webm';
    var actualWord = word || 'واجب';
    var actualUsername = username || 'طالب';
    var actualSheetNumber = sheet_number || '1';
    var actualComment = comment || getCommentForWord(actualSheetNumber, actualWord);
    
    var timestamp = new Date().toISOString().replace(/:/g, '-');
    var ext = 'webm';
    if (actualMime.indexOf('mp4') !== -1 || actualMime.indexOf('m4a') !== -1 || actualMime.indexOf('aac') !== -1) ext = 'm4a';
    else if (actualMime.indexOf('wav') !== -1) ext = 'wav';
    else if (actualMime.indexOf('ogg') !== -1) ext = 'ogg';
    else if (actualMime.indexOf('mpeg') !== -1 || actualMime.indexOf('mp3') !== -1) ext = 'mp3';
    
    var filename = 'تسجيل_' + actualUsername + '_' + actualSheetNumber + '_' + actualWord + '_' + timestamp + '.' + ext;
    var decodedBytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decodedBytes, actualMime, filename);
    
    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    saveRecordingLink(actualSheetNumber, actualUsername, actualComment, file.getUrl(), new Date().toLocaleString(), actualWord);
    
    return file.getUrl();
  } catch (e) {
    throw new Error("فشل رفع التسجيل الصوتي إلى جوجل درايف: " + e.message);
  }
}

function saveImageLink(sheet_number, username, comment, link, timestamp, word) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return;
  
  var rowNum = findOrCreateAnswersRow(sheet, sheet_number, username, comment, word);
  
  sheet.getRange(rowNum, 32).setValue(link.trim());
  sheet.getRange(rowNum, 33).setValue(timestamp);
  var currentImageCount = sheet.getRange(rowNum, 38).getValue() || 0;
  sheet.getRange(rowNum, 38).setValue(currentImageCount + 1);
  calculatePercentages(sheet, rowNum);
}

function saveRecordingLink(sheet_number, username, comment, link, timestamp, word) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return;
  
  var rowNum = findOrCreateAnswersRow(sheet, sheet_number, username, comment, word);
  
  sheet.getRange(rowNum, 30).setValue(link.trim());
  sheet.getRange(rowNum, 31).setValue(timestamp);
  var currentRecordingCount = sheet.getRange(rowNum, 37).getValue() || 0;
  sheet.getRange(rowNum, 37).setValue(currentRecordingCount + 1);
  calculatePercentages(sheet, rowNum);
}

// ------------------- تتبع اكتمال الدروس ودرجات الطالب -------------------

function markLessonCompleted(sheetName, lessonIndex, username, comment, word) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var answersSheet = ss.getSheetByName('Answers');
  if (!answersSheet) return;

  var rowNum = findOrCreateAnswersRow(answersSheet, sheetName, username, comment, word);

  var defaultCount = 0;
  var questionsSheet = ss.getSheetByName('Questions');
  if (questionsSheet && comment) {
    var qData = questionsSheet.getDataRange().getValues();
    for (var q = 1; q < qData.length; q++) {
      if (qData[q][3] && qData[q][3].toString().trim() === comment.toString().trim()) {
        defaultCount = parseInt(qData[q][104]) || 0; // العمود DA (105)
        break;
      }
    }
  }

  if (rowNum !== -1) {
    answersSheet.getRange(rowNum, 41).setValue('تم'); // العمود AO (41)

    var currentAp = answersSheet.getRange(rowNum, 42).getValue();
    if (currentAp === '' || currentAp === null || currentAp === undefined) {
      answersSheet.getRange(rowNum, 42).setValue(defaultCount); // العمود AP (42)
    }
  }
}

function unmarkLessonCompleted(sheetName, lessonIndex, username, comment, word) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var answersSheet = ss.getSheetByName('Answers');
  if (!answersSheet) return;

  var rowNum = findAnswersRowOnly(answersSheet, sheetName, username, comment, word);

  if (rowNum !== -1) {
    answersSheet.getRange(rowNum, 41).setValue('اعادة'); // العمود AO (41)
  }
}

function resetToCompleted(sheetName, lessonIndex, username, comment, word) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var answersSheet = ss.getSheetByName('Answers');
  if (!answersSheet) return;

  var rowNum = findAnswersRowOnly(answersSheet, sheetName, username, comment, word);
  if (rowNum !== -1) {
    var currentValue = answersSheet.getRange(rowNum, 41).getValue().toString().trim();
    if (currentValue === 'اعادة' || currentValue === 'إعادة') {
      answersSheet.getRange(rowNum, 41).setValue('تم');
    }
  }
}

function decrementRetryCount(sheetName, lessonIndex, username, comment, word) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var answersSheet = ss.getSheetByName('Answers');
  if (!answersSheet) return;

  var rowNum = findOrCreateAnswersRow(answersSheet, sheetName, username, comment, word);

  var defaultCount = 0;
  var questionsSheet = ss.getSheetByName('Questions');
  if (questionsSheet && comment) {
    var qData = questionsSheet.getDataRange().getValues();
    for (var q = 1; q < qData.length; q++) {
      if (qData[q][3] && qData[q][3].toString().trim() === comment.toString().trim()) {
        defaultCount = parseInt(qData[q][104]) || 0; // العمود DA (105)
        break;
      }
    }
  }

  if (rowNum !== -1) {
    var currentAp = answersSheet.getRange(rowNum, 42).getValue();
    var currentVal = (currentAp !== '' && currentAp !== null && currentAp !== undefined) ? parseInt(currentAp) : defaultCount;
    if (isNaN(currentVal)) currentVal = defaultCount;

    var newVal = Math.max(0, currentVal - 1);
    answersSheet.getRange(rowNum, 42).setValue(newVal); // العمود AP (42) في ورقة Answers
  }
}

// ------------------- دوال التحكم الإداري (قسم الإدارة) -------------------

function getAdminQuestions() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Questions');
  if (!sheet) return [];
  var fullData = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < fullData.length; i++) {
    var row = fullData[i];
    if (row[0] || row[3]) {
      // أسئلة الفيديو (الأعمدة J إلى CF - index 9 إلى 83 - 15 سؤالاً، كل سؤال 5 أعمدة)
      var questions = [];
      var count = 0;
      for (var j = 9; j < row.length && count < 15; j += 5) {
        if (row[j] !== undefined && row[j] !== null && row[j] !== '' && row[j + 2]) {
          var time = parseFloat(row[j].toString().trim()) || 0;
          var questionImage = row[j + 1] ? formatDriveImageUrl(row[j + 1].toString().trim()) : '';
          var questionText = row[j + 2] ? row[j + 2].toString().trim() : '';
          var optionsStr = row[j + 3] ? row[j + 3].toString().trim() : 'نص';
          var correctAnswer = row[j + 4] ? row[j + 4].toString().trim() : '';
          questions.push({
            time: time,
            image: questionImage,
            question: questionText,
            options: optionsStr,
            correctAnswer: correctAnswer
          });
          count++;
        }
      }

      // أسئلة الصوت والاستماع (الأعمدة CG إلى CP - index 84 إلى 93 - سؤالان)
      var audioQuestions = [];
      count = 0;
      for (var j = 84; j < row.length && count < 2; j += 5) {
        if (row[j] !== undefined && row[j] !== null && row[j] !== '' && row[j + 2]) {
          var time = parseFloat(row[j].toString().trim()) || 0;
          var questionImage = row[j + 1] ? formatDriveImageUrl(row[j + 1].toString().trim()) : '';
          var questionText = row[j + 2] ? row[j + 2].toString().trim() : '';
          var optionsStr = row[j + 3] ? row[j + 3].toString().trim() : 'نص';
          var correctAnswer = row[j + 4] ? row[j + 4].toString().trim() : '';
          audioQuestions.push({
            time: time,
            image: questionImage,
            question: questionText,
            options: optionsStr,
            correctAnswer: correctAnswer
          });
          count++;
        }
      }

      result.push({
        rowIndex: i + 1,
        word: row[0] ? row[0].toString().trim() : '',
        rawLinks: row[1] ? row[1].toString().trim() : '',
        fullSound: row[2] ? row[2].toString().trim() : '',
        comment: row[3] ? row[3].toString().trim() : '',
        image: row[4] ? formatDriveImageUrl(row[4].toString().trim()) : '',
        explainSound: row[5] ? row[5].toString().trim() : '',
        youtubeUrl: row[6] ? row[6].toString().trim() : '',
        showResult: row[7] ? row[7].toString().trim() : 'نعم',
        totalQuestionsCount: row[8] ? (parseInt(row[8].toString().trim()) || 0) : 0,
        questions: questions,
        audioQuestions: audioQuestions,
        instruction: row[94] ? row[94].toString().trim() : '',
        allowRecording: row[95] ? row[95].toString().trim() : '',
        maxRecordingTime: row[97] ? (parseInt(row[97].toString().trim()) || 0) : 0,
        retryCount: row[98] ? (parseInt(row[98].toString().trim()) || 0) : 0,
        showPrevButton: row[100] ? row[100].toString().trim() : '',
        allowUpload: row[102] ? row[102].toString().trim() : '',
        defaultRetryResetCount: row[104] ? (parseInt(row[104].toString().trim()) || 0) : 0,
        startDate: row[105] ? (row[105] instanceof Date ? Utilities.formatDate(row[105], Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd HH:mm") : row[105].toString().trim()) : '',
        endDate: row[106] ? (row[106] instanceof Date ? Utilities.formatDate(row[106], Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd HH:mm") : row[106].toString().trim()) : ''
      });
    }
  }
  return result;
}

function saveAdminQuestion(payload) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Questions');
  if (!sheet) return { success: false, message: 'ورقة الأسئلة غير موجودة' };

  var data = sheet.getDataRange().getValues();
  var rowIndex = payload.rowIndex;
  var targetRow = -1;

  if (rowIndex && rowIndex > 1) {
    targetRow = rowIndex;
  }

  if (targetRow === -1 && payload.comment) {
    var searchComment = payload.comment.toString().trim();
    if (searchComment) {
      for (var r = 1; r < data.length; r++) {
        if (data[r][3] && data[r][3].toString().trim() === searchComment) {
          targetRow = r + 1;
          break;
        }
      }
    }
  }

  if (targetRow === -1) {
    var lastOccupiedRow = 1;
    for (var i = data.length - 1; i >= 0; i--) {
      var rData = data[i];
      if ((rData[0] !== undefined && rData[0] !== null && rData[0].toString().trim() !== '') ||
          (rData[3] !== undefined && rData[3] !== null && rData[3].toString().trim() !== '')) {
        lastOccupiedRow = i + 1;
        break;
      }
    }
    targetRow = lastOccupiedRow + 1;
  }

  var rowValues = [];
  for (var k = 0; k < 107; k++) {
    rowValues.push('');
  }

  if (targetRow <= data.length && data[targetRow - 1]) {
    var existingRow = data[targetRow - 1];
    for (var k = 0; k < Math.min(existingRow.length, 107); k++) {
      rowValues[k] = existingRow[k];
    }
  }

  rowValues[0] = payload.word || ''; // A
  rowValues[1] = payload.rawLinks || ''; // B
  rowValues[2] = payload.fullSound || ''; // C
  rowValues[3] = payload.comment || ''; // D
  rowValues[4] = payload.image || ''; // E
  rowValues[5] = payload.explainSound || ''; // F
  rowValues[6] = payload.youtubeUrl || ''; // G
  rowValues[7] = payload.showResult || 'نعم'; // H
  rowValues[8] = payload.totalQuestionsCount || 0; // I

  for (var vIdx = 9; vIdx <= 83; vIdx++) {
    rowValues[vIdx] = '';
  }
  if (payload.questions && payload.questions.length > 0) {
    for (var qIdx = 0; qIdx < Math.min(payload.questions.length, 15); qIdx++) {
      var q = payload.questions[qIdx];
      var startIdx = 9 + (qIdx * 5);
      rowValues[startIdx] = q.time !== undefined ? q.time : 0;
      rowValues[startIdx + 1] = q.image || '';
      rowValues[startIdx + 2] = q.question || '';
      rowValues[startIdx + 3] = q.options || 'نص';
      rowValues[startIdx + 4] = q.correctAnswer || '';
    }
  }

  for (var aIdx = 84; aIdx <= 93; aIdx++) {
    rowValues[aIdx] = '';
  }
  if (payload.audioQuestions && payload.audioQuestions.length > 0) {
    for (var aIdx = 0; aIdx < Math.min(payload.audioQuestions.length, 2); aIdx++) {
      var aq = payload.audioQuestions[aIdx];
      var startIdx = 84 + (aIdx * 5);
      rowValues[startIdx] = aq.time !== undefined ? aq.time : 0;
      rowValues[startIdx + 1] = aq.image || '';
      rowValues[startIdx + 2] = aq.question || '';
      rowValues[startIdx + 3] = aq.options || 'نص';
      rowValues[startIdx + 4] = aq.correctAnswer || '';
    }
  }

  rowValues[94] = payload.instruction || ''; // CQ (95)
  rowValues[95] = payload.allowRecording || ''; // CR (96)
  rowValues[97] = payload.maxRecordingTime || 0; // CT (98)
  rowValues[98] = payload.retryCount || 0; // CU (99)
  rowValues[100] = payload.showPrevButton || ''; // CW (101)
  rowValues[102] = payload.allowUpload || ''; // CY (103)
  rowValues[104] = payload.defaultRetryResetCount || 0; // DA (105)
  rowValues[105] = payload.startDate || ''; // DB (106)
  rowValues[106] = payload.endDate || ''; // DC (107)

  sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);

  return { success: true, rowIndex: targetRow };
}

function deleteAdminQuestion(payload) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Questions');
  if (!sheet) return { success: false, message: 'ورقة الأسئلة غير موجودة' };

  var comment = payload.comment ? payload.comment.toString().trim() : '';
  if (comment) {
    var data = sheet.getDataRange().getValues();
    for (var r = 1; r < data.length; r++) {
      if (data[r][3] && data[r][3].toString().trim() === comment) {
        sheet.deleteRow(r + 1);
        return { success: true };
      }
    }
  }

  var rowIndex = parseInt(payload.rowIndex);
  if (!isNaN(rowIndex) && rowIndex > 1) {
    sheet.deleteRow(rowIndex);
    return { success: true };
  }

  return { success: false, message: 'لم يتم العثور على الدرس المراد حذفه' };
}

function getAdminAnswers() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0] || row[1] || row[2]) {
      result.push({
        rowIndex: i + 1,
        sheetNumber: row[0] ? row[0].toString().trim() : '',
        username: row[1] ? row[1].toString().trim() : '',
        comment: row[2] ? row[2].toString().trim() : '',
        youtubeUrl: row[3] ? row[3].toString().trim() : '',
        videoAnswersResult: row[20] ? row[20].toString().trim() : '',
        audioAnswersResult: row[25] ? row[25].toString().trim() : '',
        fullAudioScore: row[27] ? row[27].toString().trim() : '0',
        letterListenScore: row[28] ? row[28].toString().trim() : '0',
        recordingLink: row[29] ? row[29].toString().trim() : '',
        imageLink: row[32] ? row[32].toString().trim() : '',
        audioUploadCount: (row[36] !== undefined && row[36] !== null && row[36] !== '') ? parseInt(row[36].toString().trim()) : 0,
        imageUploadCount: (row[37] !== undefined && row[37] !== null && row[37] !== '') ? parseInt(row[37].toString().trim()) : 0,
        finalResult: row[38] ? row[38].toString().trim() : '',
        completed: row[40] ? row[40].toString().trim() : '',
        retryResetCount: (row[41] !== undefined && row[41] !== null && row[41] !== '') ? parseInt(row[41].toString().trim()) : null
      });
    }
  }
  return result;
}

function updateAdminAnswer(payload) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return { success: false, message: 'ورقة الإجابات غير موجودة' };

  var rowIndex = payload.rowIndex;
  if (!rowIndex || rowIndex <= 1) {
    return { success: false, message: 'رقم الصف غير صحيح' };
  }

  if (payload.sheetNumber !== undefined) sheet.getRange(rowIndex, 1).setValue(payload.sheetNumber);
  if (payload.username !== undefined) sheet.getRange(rowIndex, 2).setValue(payload.username);
  if (payload.comment !== undefined) sheet.getRange(rowIndex, 3).setValue(payload.comment);
  if (payload.audioUploadCount !== undefined && payload.audioUploadCount !== null) {
    sheet.getRange(rowIndex, 37).setValue(payload.audioUploadCount); // العمود AK (37)
  }
  if (payload.imageUploadCount !== undefined && payload.imageUploadCount !== null) {
    sheet.getRange(rowIndex, 38).setValue(payload.imageUploadCount); // العمود AL (38)
  }
  if (payload.finalResult !== undefined) {
    sheet.getRange(rowIndex, 39).setValue(payload.finalResult); // العمود AM (39)
  }
  if (payload.completed !== undefined) {
    sheet.getRange(rowIndex, 41).setValue(payload.completed); // العمود AO (41)
  }
  if (payload.retryResetCount !== undefined && payload.retryResetCount !== null) {
    sheet.getRange(rowIndex, 42).setValue(payload.retryResetCount); // العمود AP (42)
  }

  return { success: true };
}

// ------------------- دوال مساعدة لحساب النسب الكلية والوزن النسبي -------------------

function calculatePercentages(sheet, row) {
  var uValue = sheet.getRange(row, 21).getValue().toString().trim();
  var zValue = sheet.getRange(row, 26).getValue().toString().trim();
  var abValue = sheet.getRange(row, 28).getValue().toString().trim();
  var acValue = sheet.getRange(row, 29).getValue().toString().trim();
  
  var u = getPercent(uValue);
  var z = getPercent(zValue);
  var ab = getPercent(abValue);
  var ac = getPercent(acValue);
  
  var weights = {u: 0, z: 0, ab: 0, ac: 0};
  var uP = u.present;
  var zP = z.present;
  var abP = ab.present;
  var acP = ac.present;
  
  var main = '';
  var mainWeight = 60;
  var remaining = 40;
  
  if (uP) {
    main = 'u';
  } else if (zP) {
    main = 'z';
  } else {
    main = 'none';
    mainWeight = 0;
    remaining = 100;
  }
  
  if (main !== 'none') {
    weights[main] = mainWeight;
    var zShare = 0;
    if (zP && main !== 'z') {
      zShare = 20;
      weights.z = zShare;
    }
    remaining -= zShare;
    var abAcPresent = [];
    if (abP) abAcPresent.push('ab');
    if (acP) abAcPresent.push('ac');
    var abAcCount = abAcPresent.length;
    if (abAcCount > 0) {
      var share = remaining / abAcCount;
      for (var i = 0; i < abAcPresent.length; i++) {
        weights[abAcPresent[i]] = share;
      }
    }
    if (remaining > 0 && abAcCount === 0) {
      if (zP && main !== 'z') {
        weights.z += remaining;
      } else {
        weights[main] += remaining;
      }
    }
  } else {
    var abAcPresent = [];
    if (abP) abAcPresent.push('ab');
    if (acP) abAcPresent.push('ac');
    var abAcCount = abAcPresent.length;
    if (abAcCount > 0) {
      var share = 100 / abAcCount;
      for (var i = 0; i < abAcPresent.length; i++) {
        weights[abAcPresent[i]] = share;
      }
    }
  }
  
  var contribU = uP ? Math.round(weights.u * (u.percent / 100)) + '%' : null;
  var contribZ = zP ? Math.round(weights.z * (z.percent / 100)) + '%' : null;
  var contribAB = abP ? Math.round(weights.ab * (ab.percent / 100)) + '%' : null;
  var contribAC = acP ? Math.round(weights.ac * (ac.percent / 100)) + '%' : null;
  
  var finalScore = 0;
  if (uP) finalScore += weights.u * (u.percent / 100);
  if (zP) finalScore += weights.z * (z.percent / 100);
  if (abP) finalScore += weights.ab * (ab.percent / 100);
  if (acP) finalScore += weights.ac * (ac.percent / 100);
  finalScore = Math.round(finalScore);
  
  var parts = [];
  if (uP) parts.push(contribU);
  if (zP) parts.push(contribZ);
  if (abP) parts.push(contribAB);
  if (acP) parts.push(contribAC);
  
  var finalResult = '';
  if (parts.length > 0) {
    finalResult = parts.join(' + ') + ' = ' + finalScore + '%';
  } else {
    finalResult = '0%';
  }
  
  sheet.getRange(row, 39).setValue(finalResult);
  sheet.getRange(row, 40).setValue(finalScore + '%');
}

function getPercent(text) {
  if (text === '') return {present: false, percent: 0};
  var regex = /(\\d+)%/g;
  var matches = text.match(regex);
  if (matches && matches.length > 0) {
    var last = matches[matches.length - 1];
    return {present: true, percent: parseInt(last)};
  } else {
    var num = parseFloat(text);
    if (!isNaN(num)) {
      var p = num <= 1 ? Math.round(num * 100) : Math.round(num);
      return {present: true, percent: p};
    } else {
      return {present: false, percent: 0};
    }
  }
}

function arabicToWestern(numStr) {
  var arabicNums = '٠١٢٣٤٥٦٧٨٩';
  var westernNums = '0123456789';
  return numStr.replace(/[٠-٩]/g, function(d) {
    return westernNums[arabicNums.indexOf(d)];
  });
}

function getCommentForWord(sheetName, word) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Questions');
    if (!sheet) return word;
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === word.trim()) {
        return data[i][3] ? data[i][3].toString().trim() : word;
      }
    }
  } catch(err) {
    // ignore
  }
  return word;
}
`;
}
