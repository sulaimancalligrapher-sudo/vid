import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Check, AlertCircle, Copy, CheckCircle2, HelpCircle, ExternalLink, Globe } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
  onSave: (url: string) => void;
}

export default function SettingsPanel({ onClose, onSave }: SettingsPanelProps) {
  const [url, setUrl] = useState(localStorage.getItem('webAppUrl') || '');
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

var SPREADSHEET_ID = '1JpaachE3muqotD5-4hX6YKJSHi4ssgf5ptrq9JqFo1w'; // استبدل هذا المعرف بمعرف جدول البيانات الخاص بك

function doGet(e) {
  var action = e.parameter.action;
  var response;
  
  try {
    if (action === 'getWords') {
      var sheetName = e.parameter.sheetName;
      response = getWords(sheetName);
    } else if (action === 'getFullAudioScore') {
      response = { score: getFullAudioScore(e.parameter.comment, e.parameter.sheet_number, e.parameter.username) };
    } else if (action === 'getLetterListenScore') {
      response = { score: getLetterListenScore(e.parameter.comment, e.parameter.sheet_number, e.parameter.username) };
    } else if (action === 'getRecordingLink') {
      response = { link: getRecordingLink(e.parameter.comment, e.parameter.sheet_number, e.parameter.username) };
    } else if (action === 'getImageLink') {
      response = { link: getImageLink(e.parameter.comment, e.parameter.sheet_number, e.parameter.username) };
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
      var link = uploadImageFromBase64(payload.base64Data, payload.mimeType, payload.word, payload.username, payload.sheet_number);
      response = { success: true, link: link };
    } else if (action === 'uploadRecordingFromBase64') {
      var link = uploadRecordingFromBase64(payload.base64Data, payload.mimeType, payload.word, payload.username, payload.sheet_number);
      response = { success: true, link: link };
    } else if (action === 'saveImageLink') {
      saveImageLink(payload.sheet_number, payload.username, payload.comment, payload.link, payload.timestamp);
      response = { success: true };
    } else if (action === 'saveRecordingLink') {
      saveRecordingLink(payload.sheet_number, payload.username, payload.comment, payload.link, payload.timestamp);
      response = { success: true };
    } else if (action === 'markLessonCompleted') {
      markLessonCompleted(payload.sheetName, payload.lessonIndex, payload.username);
      response = { success: true };
    } else if (action === 'unmarkLessonCompleted') {
      unmarkLessonCompleted(payload.sheetName, payload.lessonIndex);
      response = { success: true };
    } else if (action === 'resetToCompleted') {
      resetToCompleted(payload.sheetName, payload.lessonIndex);
      response = { success: true };
    } else if (action === 'decrementRetryCount') {
      decrementRetryCount(payload.sheetName, payload.lessonIndex);
      response = { success: true };
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
    if (!settingsSheet) return { success: false, message: 'ورقة الإعدادات غير موجودة' };
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
    var sheetName = sheet_number;
    var studentSheet = ss.getSheetByName(sheetName);
    if (!studentSheet) {
      return { success: false, message: 'ورقة الطالب غير موجودة' };
    }
    return { success: true, sheetName: sheetName };
  } catch (e) {
    return { success: false, message: 'خطأ في الدخول: ' + e.message };
  }
}

function getWords(sheetName) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var fullData = sheet.getDataRange().getValues();
  var result = [];
  for (var rowIndex = 1; rowIndex < fullData.length; rowIndex++) {
    var row = fullData[rowIndex];
    if (row[0]) {
      var word = row[0].toString().trim();
      var fullSound = row[2] ? row[2].toString().trim() : '';
      var image = row[4] ? row[4].toString().trim() : '';
      var comment = row[3] ? row[3].toString().trim() : '';
      var explainSound = row[5] ? row[5].toString().trim() : '';
      var youtubeUrl = row[6] ? row[6].toString().trim() : '';
      var showResult = row[7] ? row[7].toString().trim() : 'نعم';
      var instruction = row[94] ? row[94].toString().trim() : '';
      var allowRecording = row[95] ? row[95].toString().trim() : '';
      var maxRecordingTime = row[97] ? parseInt(row[97].toString().trim()) : 0;
      var retryCount = row[98] ? parseInt(row[98].toString().trim()) : 0;
      var completed = row[103] ? row[103].toString().trim() : '';
      var showPrevButton = row[100] ? row[100].toString().trim() : '';
      var uploadTitle = row[101] ? row[101].toString().trim() : '';
      var allowUpload = row[102] ? row[102].toString().trim() : '';
      var retryResetCount = row[104] ? parseInt(row[104].toString().trim()) : 0;
      var resetCondition = row[105] ? row[105].toString().trim() : 'لا';
      var dzValue = row[129] ? row[129].toString().trim() : '';
      
      var rawLinks = row[1] ? row[1].toString() : '';
      var letterSounds = rawLinks
        .split(/[,،]\\s*/)
        .map(function(s) { return s.trim(); })
        .filter(function(s) { return s.indexOf('http') === 0; });
        
      var questions = [];
      var count = 0;
      for (var j = 9; j < row.length && count < 15; j += 5) {
        if (row[j] && row[j + 2]) {
          var time = parseFloat(row[j].toString().trim());
          var questionImage = row[j + 1] ? row[j + 1].toString().trim() : '';
          var questionText = row[j + 2].toString().trim();
          var optionsStr = row[j + 3] ? row[j + 3].toString().trim() : '';
          var correctAnswer = row[j + 4] ? row[j + 4].toString().trim() : '';
          var options = [];
          if (optionsStr !== 'نص') {
            options = optionsStr.split(',');
          }
          questions.push({
            time: time,
            image: questionImage,
            question: questionText,
            options: options.map(function(opt) { return opt.trim(); }),
            correctAnswer: correctAnswer
          });
          count++;
        }
      }
      
      var audioQuestions = [];
      count = 0;
      for (var j = 84; j < row.length && count < 2; j += 5) {
        if (row[j] && row[j + 2]) {
          var time = parseFloat(row[j].toString().trim());
          var questionImage = row[j + 1] ? row[j + 1].toString().trim() : '';
          var questionText = row[j + 2].toString().trim();
          var optionsStr = row[j + 3] ? row[j + 3].toString().trim() : '';
          var correctAnswer = row[j + 4] ? row[j + 4].toString().trim() : '';
          var options = [];
          if (optionsStr !== 'نص') {
            options = optionsStr.split(',');
          }
          audioQuestions.push({
            time: time,
            image: questionImage,
            question: questionText,
            options: options.map(function(opt) { return opt.trim(); }),
            correctAnswer: correctAnswer
          });
          count++;
        }
      }
      
      result.push({
        word: word, fullSound: fullSound, letterSounds: letterSounds, image: image, comment: comment,
        explainSound: explainSound, youtubeUrl: youtubeUrl, questions: questions, audioQuestions: audioQuestions, 
        showResult: showResult, instruction: instruction, allowRecording: allowRecording, maxRecordingTime: maxRecordingTime, 
        retryCount: retryCount, completed: completed, showPrevButton: showPrevButton, uploadTitle: uploadTitle, 
        allowUpload: allowUpload, retryResetCount: retryResetCount, resetCondition: resetCondition, dzValue: dzValue
      });
    }
  }
  return result;
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
    headers.push('التوقيت', 'فراغ', 'موضوع الصوت', 'درجة الاستماع', 'درجة استماع الحروف', 'رابط التسجيل', 'تاريخ الإرسال', 'فراغ', 'رابط الصورة', 'تاريخ إرسال الصورة', 'عدد إرسال فيديو', 'عدد إرسال صوت', 'عدد إرسال تسجيل', 'عدد إرسال صورة', 'النتيجة الكلية', 'الدرجة النهائية');
    sheet.appendRow(headers);
  }
  
  var data = sheet.getDataRange().getValues();
  var rowNum = -1;
  for (var r = 1; r < data.length; r++) {
    if (data[r][0].toString().trim() === payload.sheet_number.trim() && 
        data[r][1].toString().trim() === payload.username.trim() && 
        data[r][2].toString().trim() === payload.comment.trim()) {
      rowNum = r + 1;
      break;
    }
  }
  
  if (rowNum === -1) {
    var newRow = [payload.sheet_number.trim(), payload.username.trim(), payload.comment.trim(), payload.youtubeUrl.trim()];
    for (var i = 0; i < 15; i++) newRow.push('');
    newRow.push('', '', payload.explainSound.trim());
    for (var i = 0; i < 2; i++) newRow.push('');
    newRow.push('', '', '', '', '', '', '', '', '', '', 0, 0, 0, 0, '', '');
    sheet.appendRow(newRow);
    rowNum = sheet.getLastRow();
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
    حسابالنتائج(payload.sheet_number, payload.comment, rowNum);
  } else if (payload.type === 'audio') {
    var col = 23 + payload.questionIndex;
    sheet.getRange(rowNum, col).setValue(result);
    if (payload.questionIndex === 0) {
      sheet.getRange(rowNum, 25).setValue(payload.timestamp);
      var currentAudioCount = sheet.getRange(rowNum, 36).getValue() || 0;
      sheet.getRange(rowNum, 36).setValue(currentAudioCount + 1);
    }
    حسابالقسمالثاني(payload.sheet_number, payload.comment, rowNum);
  }
  return { success: true };
}

function حسابالنتائج(sheet_number, comment, rowNum) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var studentSheet = ss.getSheetByName(sheet_number);
  var answersSheet = ss.getSheetByName('Answers');
  if (!studentSheet || !answersSheet) return;
  var studentData = studentSheet.getDataRange().getValues();
  var totalQuestions = 0;
  for (var r = 1; r < studentData.length; r++) {
    if (studentData[r][3] && studentData[r][3].toString().trim() === comment.trim()) {
      totalQuestions = parseInt(studentData[r][8]) || 0;
      break;
    }
  }
  if (totalQuestions <= 0) {
    answersSheet.getRange(rowNum, 21).setValue("");
    return;
  }
  var answersRow = answersSheet.getRange(rowNum, 5, 1, 15).getValues()[0];
  var correct = 0;
  var wrong = 0;
  for (var col = 0; col < 15; col++) {
    var value = (answersRow[col] || "").toString().trim().toLowerCase();
    if (value === "") continue;
    if (value === "صح" || value === "صحيح" || value === "true" || value === "✓") {
      correct++;
    } else if (value === "خطأ" || value === "خاطئ" || value === "false" || value === "✗") {
      wrong++;
    }
  }
  var noAnswer = totalQuestions - (correct + wrong);
  var percentage = Math.round((correct / totalQuestions) * 100);
  var resultText = "عدد الأسئلة " + totalQuestions + " - الصحيحة " + correct + " و الخاطئة " + wrong;
  if (noAnswer > 0) {
    resultText += " و " + noAnswer + " لا يوجد إجابة";
  }
  resultText += " و حصلت على " + percentage + "%";
  answersSheet.getRange(rowNum, 21).setValue(resultText);
  calculatePercentages(answersSheet, rowNum);
}

function حسابالقسمالثاني(sheet_number, comment, rowNum) {
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

function getFullAudioScore(comment, sheet_number, username) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return 0;
  var data = sheet.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (data[r][0].toString().trim() === sheet_number.trim() && 
        data[r][1].toString().trim() === username.trim() && 
        data[r][2].toString().trim() === comment.trim()) {
      var scoreStr = data[r][27];
      if (scoreStr) {
        var score = parseFloat(scoreStr.toString().replace('%', ''));
        return isNaN(score) ? 0 : score;
      }
      return 0;
    }
  }
  return 0;
}

function saveFullAudioScore(sheet_number, username, word, score, timestamp, comment) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return { success: false };
  var data = sheet.getDataRange().getValues();
  var rowNum = -1;
  for (var r = 1; r < data.length; r++) {
    if (data[r][0].toString().trim() === sheet_number.trim() && 
        data[r][1].toString().trim() === username.trim() && 
        data[r][2].toString().trim() === comment.trim()) {
      rowNum = r + 1;
      break;
    }
  }
  
  if (rowNum === -1) {
    var newRow = [sheet_number.trim(), username.trim(), comment.trim(), ''];
    for (var i = 0; i < 15; i++) newRow.push('');
    newRow.push('', '', '');
    for (var i = 0; i < 2; i++) newRow.push('');
    newRow.push('', '', '', '', '', '', '', '', '', '', 0, 0, 0, 0, '', '');
    sheet.appendRow(newRow);
    rowNum = sheet.getLastRow();
  }
  sheet.getRange(rowNum, 27).setValue(word.trim());
  sheet.getRange(rowNum, 28).setValue(score + '%');
  calculatePercentages(sheet, rowNum);
  return { success: true };
}

function getLetterListenScore(comment, sheet_number, username) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return 0;
  var data = sheet.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (data[r][0].toString().trim() === sheet_number.trim() && 
        data[r][1].toString().trim() === username.trim() && 
        data[r][2].toString().trim() === comment.trim()) {
      var scoreStr = data[r][28];
      if (scoreStr) {
        scoreStr = arabicToWestern(scoreStr.toString());
        scoreStr = scoreStr.replace(/%|٪/g, '').trim();
        var score = parseFloat(scoreStr);
        return isNaN(score) ? 0 : score;
      }
      return 0;
    }
  }
  return 0;
}

function saveLetterListenScore(sheet_number, username, word, score, timestamp, comment) {
  if (score !== 100) return { success: false };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return { success: false };
  
  var data = sheet.getDataRange().getValues();
  var rowNum = -1;
  for (var r = 1; r < data.length; r++) {
    if (data[r][0].toString().trim() === sheet_number.trim() && 
        data[r][1].toString().trim() === username.trim() && 
        data[r][2].toString().trim() === comment.trim()) {
      rowNum = r + 1;
      break;
    }
  }
  
  if (rowNum === -1) {
    var newRow = [sheet_number.trim(), username.trim(), comment.trim(), ''];
    for (var i = 0; i < 15; i++) newRow.push('');
    newRow.push('', '', '');
    for (var i = 0; i < 2; i++) newRow.push('');
    newRow.push('', '', '', '', '', '', '', '', '', '', 0, 0, 0, 0, '', '');
    sheet.appendRow(newRow);
    rowNum = sheet.getLastRow();
  }
  sheet.getRange(rowNum, 29).setValue(score + '%');
  calculatePercentages(sheet, rowNum);
  return { success: true };
}

function getRecordingLink(comment, sheet_number, username) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return '';
  var data = sheet.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (data[r][0].toString().trim() === sheet_number.trim() && data[r][1].toString().trim() === username.trim() && data[r][2].toString().trim() === comment.trim()) {
      return data[r][29] ? data[r][29].toString().trim() : '';
    }
  }
  return '';
}

function getImageLink(comment, sheet_number, username) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return '';
  var data = sheet.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (data[r][0].toString().trim() === sheet_number.trim() && data[r][1].toString().trim() === username.trim() && data[r][2].toString().trim() === comment.trim()) {
      return data[r][31] ? data[r][31].toString().trim() : '';
    }
  }
  return '';
}

// ------------------- دوال رفع ملفات الوسائط -------------------

function uploadImageFromBase64(base64Data, mimeType, word, username, sheet_number) {
  try {
    var folderId = '1XRSjYZMT8j_0t5U9Jtdr8JNN1B2P2iL5'; // استبدل هذا المعرف بمعرف مجلد Drive الذي تريد تخزين الصور به
    var actualMime = mimeType || 'image/jpeg';
    var actualWord = word || 'صورة';
    var actualUsername = username || 'طالب';
    var actualSheetNumber = sheet_number || '1';
    
    var timestamp = new Date().toISOString().replace(/:/g, '-');
    var filename = 'صورة_' + actualUsername + '_' + actualSheetNumber + '_' + actualWord + '_' + timestamp + '.jpg';
    
    var decodedBytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decodedBytes, actualMime, filename);
    
    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var comment = getCommentForWord(actualSheetNumber, actualWord);
    saveImageLink(actualSheetNumber, actualUsername, comment, file.getUrl(), new Date().toLocaleString());
    
    return file.getUrl();
  } catch (e) {
    throw new Error("فشل رفع الصورة إلى جوجل درايف: " + e.message);
  }
}

function uploadRecordingFromBase64(base64Data, mimeType, word, username, sheet_number) {
  try {
    var folderId = '1XRSjYZMT8j_0t5U9Jtdr8JNN1B2P2iL5'; // استبدل بمعرف مجلد Drive الخاص بك للتسجيلات الصوتية
    var actualMime = mimeType || 'audio/webm';
    var actualWord = word || 'واجب';
    var actualUsername = username || 'طالب';
    var actualSheetNumber = sheet_number || '1';
    
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
    
    var comment = getCommentForWord(actualSheetNumber, actualWord);
    saveRecordingLink(actualSheetNumber, actualUsername, comment, file.getUrl(), new Date().toLocaleString());
    
    return file.getUrl();
  } catch (e) {
    throw new Error("فشل رفع التسجيل الصوتي إلى جوجل درايف: " + e.message);
  }
}

function saveImageLink(sheet_number, username, comment, link, timestamp) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  var rowNum = -1;
  for (var r = 1; r < data.length; r++) {
    if (data[r][0].toString().trim() === sheet_number.trim() && 
        data[r][1].toString().trim() === username.trim() && 
        data[r][2].toString().trim() === comment.trim()) {
      rowNum = r + 1;
      break;
    }
  }
  
  if (rowNum === -1) {
    var newRow = [sheet_number.trim(), username.trim(), comment.trim(), ''];
    for (var i = 0; i < 15; i++) newRow.push('');
    newRow.push('', '', '');
    for (var i = 0; i < 2; i++) newRow.push('');
    newRow.push('', '', '', '', '', '', '', '', '', '', 0, 0, 0, 0, '', '');
    sheet.appendRow(newRow);
    rowNum = sheet.getLastRow();
  }
  
  sheet.getRange(rowNum, 32).setValue(link.trim());
  sheet.getRange(rowNum, 33).setValue(timestamp);
  var currentImageCount = sheet.getRange(rowNum, 38).getValue() || 0;
  sheet.getRange(rowNum, 38).setValue(currentImageCount + 1);
  calculatePercentages(sheet, rowNum);
}

function saveRecordingLink(sheet_number, username, comment, link, timestamp) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Answers');
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  var rowNum = -1;
  for (var r = 1; r < data.length; r++) {
    if (data[r][0].toString().trim() === sheet_number.trim() && 
        data[r][1].toString().trim() === username.trim() && 
        data[r][2].toString().trim() === comment.trim()) {
      rowNum = r + 1;
      break;
    }
  }
  
  if (rowNum === -1) {
    var newRow = [sheet_number.trim(), username.trim(), comment.trim(), ''];
    for (var i = 0; i < 15; i++) newRow.push('');
    newRow.push('', '', '');
    for (var i = 0; i < 2; i++) newRow.push('');
    newRow.push('', '', '', '', '', '', '', '', '', '', 0, 0, 0, 0, '', '');
    sheet.appendRow(newRow);
    rowNum = sheet.getLastRow();
  }
  
  sheet.getRange(rowNum, 30).setValue(link.trim());
  sheet.getRange(rowNum, 31).setValue(timestamp);
  var currentRecordingCount = sheet.getRange(rowNum, 37).getValue() || 0;
  sheet.getRange(rowNum, 37).setValue(currentRecordingCount + 1);
  calculatePercentages(sheet, rowNum);
}

// ------------------- تتبع اكتمال الدروس ودرجات الطالب -------------------

function markLessonCompleted(sheetName, lessonIndex, username) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    var row = lessonIndex + 2;
    sheet.getRange(row, 104).setValue('تم');
    var comment = sheet.getRange(row, 4).getValue().toString().trim();
    var answersSheet = ss.getSheetByName('Answers');
    if (answersSheet && comment) {
      var answersData = answersSheet.getDataRange().getValues();
      var answersRowNum = -1;
      for (var r = 1; r < answersData.length; r++) {
        if (answersData[r][0].toString().trim() === sheetName.trim() &&
            answersData[r][1].toString().trim() === username.trim() &&
            answersData[r][2].toString().trim() === comment.trim()) {
          answersRowNum = r + 1;
          break;
        }
      }
      if (answersRowNum !== -1) {
        var videoResult = answersSheet.getRange(answersRowNum, 21).getValue();
        var videoSendCount = answersSheet.getRange(answersRowNum, 35).getValue();
        var audioResult = answersSheet.getRange(answersRowNum, 26).getValue();
        var audioSendCount = answersSheet.getRange(answersRowNum, 36).getValue();
        var fullListenScore = answersSheet.getRange(answersRowNum, 28).getValue();
        var letterListenScore = answersSheet.getRange(answersRowNum, 29).getValue();
        var recordingLink = answersSheet.getRange(answersRowNum, 30).getValue();
        var recordingSendCount = answersSheet.getRange(answersRowNum, 37).getValue();
        var imageLink = answersSheet.getRange(answersRowNum, 32).getValue();
        var imageSendCount = answersSheet.getRange(answersRowNum, 38).getValue();
        var fullResult = answersSheet.getRange(answersRowNum, 39).getDisplayValue();
        var finalPercent = answersSheet.getRange(answersRowNum, 40).getDisplayValue();
        
        sheet.getRange(row, 108).setValue(videoResult);
        sheet.getRange(row, 109).setValue(videoSendCount);
        sheet.getRange(row, 110).setValue(audioResult);
        sheet.getRange(row, 111).setValue(audioSendCount);
        sheet.getRange(row, 113).setValue(fullListenScore);
        sheet.getRange(row, 114).setValue(letterListenScore);
        sheet.getRange(row, 115).setValue(recordingLink);
        sheet.getRange(row, 116).setValue(recordingSendCount);
        sheet.getRange(row, 118).setValue(imageLink);
        sheet.getRange(row, 119).setValue(imageSendCount);
        sheet.getRange(row, 120).setValue(fullResult);
        sheet.getRange(row, 121).setValue(finalPercent);
      }
    }
  }
}

function unmarkLessonCompleted(sheetName, lessonIndex) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    sheet.getRange(lessonIndex + 2, 104).setValue('اعادة');
  }
}

function resetToCompleted(sheetName, lessonIndex) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    var row = lessonIndex + 2;
    var currentValue = sheet.getRange(row, 104).getValue().toString().trim();
    if (currentValue === 'اعادة') {
      sheet.getRange(row, 104).setValue('تم');
    }
  }
}

function decrementRetryCount(sheetName, lessonIndex) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    var row = lessonIndex + 2;
    var currentCount = sheet.getRange(row, 105).getValue();
    if (typeof currentCount === 'number' && currentCount > 0) {
      sheet.getRange(row, 105).setValue(currentCount - 1);
    }
  }
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
    var sheet = ss.getSheetByName(sheetName);
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
