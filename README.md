# Irrigation Trial — تجربة الري

**Designed by Engineer Mohamed Ibrahim (Firmeno)**

## Contents
- `index.html` — main application; responsive Arabic-first interface and irrigation calculations.
- `manifest.webmanifest` — install metadata for supported browsers.
- `service-worker.js` — offline cache for installations served from HTTPS or localhost.
- `assets/icon.svg` — application icon for browser tabs and supported home-screen installations.

## Features
- Manage many named pivot trials (not limited to ten): create, save/update, load, rename, and delete.
- Saved trials are stored locally in the current browser/device using `localStorage`.
- Irrigation readings, calculated millimeters, summary statistics, chart, outlier checks, and recommendations based on the app's existing calculation rules.
- Light/dark theme preference and manually switchable Arabic/English document direction.
- Export a JSON backup of all saved pivots; import JSON backups and SVG files containing a `data-irrigation-trial` attribute; import simple CSV readings.
- Excel-compatible CSV export when the optional spreadsheet library is not present.
- Contact shortcuts for Email, LinkedIn, Facebook, X, WhatsApp, and Telegram.
- No third-party scripts or CDNs are required for core calculations.

## Start
1. Extract the ZIP archive.
2. Open `index.html` in a modern browser.
3. To install as a PWA, serve the folder from **HTTPS or localhost** and open it in a supported browser. Browsers do not allow service workers/PWA installation from a `file://` URL; the standalone HTML itself can still run offline when opened locally.

## Offline and data notes
- Data remains on the same browser profile and device. Clearing browser data can remove saved pivots; use **Export backup** regularly.
- Contact links need internet and may open the installed official app or a browser depending on the operating system.
- This package is offline-first. Importing legacy `.xlsx` / `.xls` directly requires a spreadsheet parser; in this dependency-free build, export the workbook as CSV in Excel/LibreOffice and import the CSV. SVG import is intended for SVG files embedding JSON in the `data-irrigation-trial` attribute; arbitrary SVG artwork is not a spreadsheet data source.
- English mode currently switches document language and reading direction; some domain labels remain Arabic. Full translated interface copy is a future enhancement.

## Calculation and performance guide
- The app's existing formula for `C1` is `π × radius² ÷ 10`.
- Converted reading = raw reading ÷ `C1`.
- Overall average, sample standard deviation, coefficient of variation (CV), wheel-level comparison, and outlier screening are calculated from available positive readings.
- The existing quick assessment uses CV bands: below 10% excellent; below 15% good; below 25% moderate; otherwise weak. Outliers are screened against mean ± 1.5 standard deviations. These are application heuristics, not a certified irrigation audit or guarantee of field performance.
- Verify units, equipment calibration, operating pressure, nozzle condition, and field protocol before making operational decisions.

## Browser compatibility
Use a recent version of Chrome, Edge, Firefox, or Safari. PWA installation and SVG icon behavior vary by platform. Local storage capacity and browser privacy settings may affect persistence.


## External asset files

- `assets/css/app.css` — application styles.
- `assets/js/app.js` — application logic and offline registration.
- `assets/icon.svg` — web/app icon.

Keep the `assets` folder beside `index.html`; do not move or rename these files unless you also update their paths in `index.html`, `manifest.webmanifest`, and `service-worker.js`.

## تثبيت التطبيق من الهاتف

- زر **📲 تثبيت التطبيق** يظهر التثبيت المباشر عندما يدعم المتصفح ذلك.
- يجب نشر المجلد على موقع HTTPS مثل GitHub Pages، مع رفع `index.html` و`manifest.webmanifest` و`service-worker.js` ومجلد `assets` كاملًا.
- بعد فتح الموقع مرة مع اتصال الإنترنت، انتظر تحميل الصفحة ثم استخدم زر التثبيت. إذا لم يظهر خيار التثبيت، افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».
- ملف ZIP يجمع جميع الملفات في مرفق واحد للتنزيل، لكنه لا يُرفع كما هو إلى GitHub Pages؛ فك الضغط أولًا ثم ارفع محتويات المجلد إلى المستودع.
