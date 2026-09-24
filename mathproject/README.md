# 📚 مكتبة الرياضيات

منصة تعليمية لعرض وتنزيل ملفات الرياضيات.

## 🌐 الرابط
https://mo2xo.github.io/math.2027/

## 📁 بنية المشروع

- `index.html` — صفحة التحويل الرئيسية
- `website/` — ملفات الموقع
  - `index.html` — الموقع نفسه
  - `style.css` — التصميم
  - `script.js` — الأكواد
  - `notice.json` — الإشعار العلوي
  - `messages.json` — شريط الإعلانات
  - `schedule.json` — جدول المواعيد
  - `subjects.json` — صور المواد
- `game/` — اللعبة
- `assets/` — صور الموقع
- `files/` — ملفات PDF

## 🔧 التعديلات السريعة

| أريد تعديل... | افتح الملف |
|----------------|-----------|
| الإشعار العلوي | `website/notice.json` |
| شريط الإعلانات | `website/messages.json` |
| جدول المواعيد | `website/schedule.json` |
| إطفاء/تشغيل الموقع | `website/index.html` (سطر `MAINTENANCE_MODE`) |
| إضافة ملفات PDF | `files/الرياضيات/` |

## 🔌 إطفاء الموقع

في `website/index.html`، غيّر:
```js
const MAINTENANCE_MODE = false;  // ← اجعلها true