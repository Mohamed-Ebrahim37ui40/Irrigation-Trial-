const PIVOTS = [1, 2, 3, 4, 5, 6, 7, 'End'];
    const READINGS = 8; // default per pivot

    function getC1() {
      const r = parseFloat(document.getElementById('radius').value) || 17.5;
      return (r * r) * Math.PI / 10;
    }

    let cur = 1;
    let data = {};
    PIVOTS.forEach(p => {
      const n = (p === 'End') ? 4 : READINGS;
      data[p] = Array(n).fill(null);
    });

    // Init
    renderTabs();
    renderTable();
    updateAll();
    loadURL();

    function recalc() {
      const area = parseFloat(document.getElementById('area').value) || 0;
      const hours = parseFloat(document.getElementById('hours').value) || 1;
      const c1 = getC1();
      document.getElementById('c1').textContent = c1.toFixed(2);
      document.getElementById('feddanPH').textContent = (area / hours).toFixed(2);
      // التدفق يُحسب في updateAll من متوسط المللي
      renderTable();
      updateAll();
    }
    recalc();

    function renderTabs() {
      const el = document.getElementById('tabs');
      el.innerHTML = '';
      PIVOTS.forEach(p => {
        const n = data[p].filter(v => v != null && v > 0).length;
        const b = document.createElement('button');
        b.className = 'tab' + (p === cur ? ' active' : '');
        b.innerHTML = `عجلة ${p} <span class="badge">${n}/${data[p].length}</span>`;
        b.onclick = () => { cur = p; renderTabs(); renderTable(); };
        el.appendChild(b);
      });
    }

    function renderTable() {
      const tb = document.getElementById('tbody');
      tb.innerHTML = '';
      const c1 = getC1();
      data[cur].forEach((v, i) => {
        const calc = (v != null && v > 0) ? (v / c1).toFixed(2) : '—';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td><input type="number" step="0.1" min="0" value="${v != null ? v : ''}"
               placeholder="MM" data-idx="${i}"
               oninput="setVal(${i}, this.value)"
               onkeydown="navKey(event, ${i})" /></td>
          <td class="calc-cell">${calc}</td>
          <td><button class="btn btn-danger btn-sm" onclick="delVal(${i})">✕</button></td>
        `;
        tb.appendChild(tr);
      });
    }

    // Enter / ArrowDown → next field | ArrowUp → previous
    function navKey(e, i) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        const inputs = document.querySelectorAll('#tbody input');
        if (i + 1 < inputs.length) {
          inputs[i + 1].focus();
          inputs[i + 1].select();
        } else {
          // last field of this pivot → add a new reading and focus it
          addReading();
          setTimeout(() => {
            const inputs2 = document.querySelectorAll('#tbody input');
            if (inputs2.length) {
              inputs2[inputs2.length - 1].focus();
              inputs2[inputs2.length - 1].select();
            }
          }, 50);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const inputs = document.querySelectorAll('#tbody input');
        if (i > 0) {
          inputs[i - 1].focus();
          inputs[i - 1].select();
        }
      }
    }

    function setVal(i, val) {
      const n = val === '' ? null : parseFloat(val);
      data[cur][i] = isNaN(n) ? null : n;
      renderTabs();
      const row = document.getElementById('tbody').rows[i];
      if (row) {
        const c1 = getC1();
        const v = data[cur][i];
        row.cells[2].textContent = (v != null && v > 0) ? (v / c1).toFixed(2) : '—';
      }
      updateAll();
    }

    function addReading() {
      data[cur].push(null);
      renderTabs();
      renderTable();
      setTimeout(() => {
        const inputs = document.querySelectorAll('#tbody input');
        if (inputs.length) inputs[inputs.length - 1].focus();
      }, 40);
    }

    function addMany(n) {
      for (let i = 0; i < n; i++) data[cur].push(null);
      renderTabs();
      renderTable();
    }

    function delVal(i) {
      data[cur].splice(i, 1);
      if (data[cur].length === 0) data[cur] = [null];
      renderTabs();
      renderTable();
      updateAll();
    }

    function getVals(arr) {
      const c1 = getC1();
      return arr.filter(v => v != null && v > 0).map(v => v / c1);
    }

    function avg(a) { return a.length ? a.reduce((s, v) => s + v, 0) / a.length : null; }
    function std(a) {
      if (a.length < 2) return null;
      const m = avg(a);
      return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
    }

    function updateAll() {
      const tb = document.getElementById('sumBody');
      tb.innerHTML = '';
      let all = [];
      const stats = [];

      PIVOTS.forEach(p => {
        const vals = getVals(data[p]);
        all = all.concat(vals);
        stats.push({
          p, n: vals.length,
          avg: avg(vals), sd: std(vals),
          min: vals.length ? Math.min(...vals) : null,
          max: vals.length ? Math.max(...vals) : null
        });
      });

      const overall = avg(all);
      document.getElementById('overallAvg').textContent = overall != null ? overall.toFixed(2) : '—';

      // التدفق = متوسط المللي × الأفدنة/ساعة × 4.2
      // لا قيمة إذا لا توجد قراءات
      const area = parseFloat(document.getElementById('area').value) || 0;
      const hours = parseFloat(document.getElementById('hours').value) || 1;
      const feddanPH = area / hours;
      if (overall != null && overall > 0) {
        document.getElementById('flow').textContent = (overall * feddanPH * 4.2).toFixed(2);
      } else {
        document.getElementById('flow').textContent = '—';
      }

      stats.forEach(s => {
        const div = (s.avg != null && overall) ? ((s.avg / overall) * 100).toFixed(1) + '%' : '—';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${s.p}</strong></td>
          <td>${s.n}</td>
          <td class="avg-cell">${s.avg != null ? s.avg.toFixed(2) : '—'}</td>
          <td>${s.sd != null ? s.sd.toFixed(2) : '—'}</td>
          <td>${s.min != null ? s.min.toFixed(2) : '—'}</td>
          <td>${s.max != null ? s.max.toFixed(2) : '—'}</td>
          <td>${div}</td>
        `;
        tb.appendChild(tr);
      });

      drawChart();
    }

    // Chart: curve + outliers — spread out, no overlap
    function drawChart() {
      const canvas = document.getElementById('chart');
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;

      // Collect points first to decide width
      const pts = [];
      PIVOTS.forEach(p => {
        let vi = 0;
        const vals = getVals(data[p]);
        data[p].forEach((raw, idx) => {
          if (raw != null && raw > 0) {
            pts.push({ p, i: idx + 1, v: vals[vi], label: p + '-' + (idx + 1) });
            vi++;
          }
        });
      });

      const minPointW = 36; // px per point — spreads chart so labels don't overlap
      const parentW = canvas.parentElement.getBoundingClientRect().width;
      const chartContentW = Math.max(parentW, pts.length * minPointW + 80);
      const H = 400;

      canvas.width = chartContentW * dpr;
      canvas.height = H * dpr;
      canvas.style.width = chartContentW + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const W = chartContentW;
      const pad = { t: 40, r: 20, b: 90, l: 50 };
      const cW = W - pad.l - pad.r;
      const cH = H - pad.t - pad.b;
      ctx.clearRect(0, 0, W, H);

      if (!pts.length) {
        ctx.fillStyle = '#999';
        ctx.font = '14px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('أدخل بيانات لعرض المنحنى', parentW / 2, H / 2);
        return;
      }

      const values = pts.map(p => p.v);
      const mean = avg(values);
      const sdVal = std(values) || 0;
      const lo = mean - 1.5 * sdVal;
      const hi = mean + 1.5 * sdVal;
      pts.forEach(pt => { pt.out = pt.v < lo || pt.v > hi; });

      const maxY = Math.max(...values, hi) * 1.2 || 1;
      const gap = cW / pts.length;

      // Normal band
      if (sdVal > 0) {
        const yU = pad.t + cH - (Math.min(hi, maxY) / maxY) * cH;
        const yL = pad.t + cH - (Math.max(lo, 0) / maxY) * cH;
        ctx.fillStyle = 'rgba(46,125,50,.08)';
        ctx.fillRect(pad.l, yU, cW, Math.max(yL - yU, 0));
      }

      // Axes
      ctx.strokeStyle = '#BDBDBD';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.l, pad.t);
      ctx.lineTo(pad.l, pad.t + cH);
      ctx.lineTo(pad.l + cW, pad.t + cH);
      ctx.stroke();

      // Grid + Y labels
      ctx.fillStyle = '#757575';
      ctx.font = '11px Segoe UI';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const y = pad.t + cH - (i / 5) * cH;
        ctx.fillText((maxY * i / 5).toFixed(1), pad.l - 6, y + 4);
        ctx.strokeStyle = '#EEEEEE';
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(pad.l + cW, y);
        ctx.stroke();
      }

      // Mean line
      const yM = pad.t + cH - (mean / maxY) * cH;
      ctx.strokeStyle = '#43A047';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.l, yM);
      ctx.lineTo(pad.l + cW, yM);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#2E7D32';
      ctx.font = '10px Segoe UI';
      ctx.textAlign = 'left';
      ctx.fillText('μ ' + mean.toFixed(2), pad.l + 4, yM - 4);

      // Curve
      ctx.strokeStyle = '#1565C0';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      pts.forEach((pt, i) => {
        const x = pad.l + gap * i + gap / 2;
        const y = pad.t + cH - (pt.v / maxY) * cH;
        if (i === 0) ctx.moveTo(x, y);
        else {
          const prev = pts[i - 1];
          const px = pad.l + gap * (i - 1) + gap / 2;
          const py = pad.t + cH - (prev.v / maxY) * cH;
          ctx.quadraticCurveTo((px + x) / 2, py, x, y);
        }
      });
      ctx.stroke();

      // Points + labels (spread, rotated)
      pts.forEach((pt, i) => {
        const x = pad.l + gap * i + gap / 2;
        const y = pad.t + cH - (pt.v / maxY) * cH;

        if (pt.out) {
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(198,40,40,.18)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#C62828';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
          // value label above
          ctx.fillStyle = '#C62828';
          ctx.font = 'bold 10px Segoe UI';
          ctx.textAlign = 'center';
          ctx.fillText(pt.v.toFixed(2), x, y - 12);
        } else {
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#1565C0';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // X label — rotated 60° to avoid overlap
        ctx.save();
        ctx.translate(x, H - 55);
        ctx.rotate(-Math.PI / 3);
        ctx.textAlign = 'right';
        ctx.font = '10px Segoe UI';
        ctx.fillStyle = pt.out ? '#C62828' : '#424242';
        ctx.fillText(pt.label, 0, 0);
        ctx.restore();
      });

      // Legend
      ctx.font = '11px Segoe UI';
      ctx.textAlign = 'left';
      ctx.beginPath(); ctx.arc(pad.l + 6, 14, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#1565C0'; ctx.fill();
      ctx.fillStyle = '#333'; ctx.fillText('عادية', pad.l + 14, 18);
      ctx.beginPath(); ctx.arc(pad.l + 70, 14, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#C62828'; ctx.fill();
      ctx.fillStyle = '#333'; ctx.fillText('شاذة (±1.5σ)', pad.l + 82, 18);

      ctx.fillStyle = '#1B5E20';
      ctx.font = 'bold 12px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText('منحنى القراءات', Math.min(W, parentW) / 2, H - 8);
    }

    window.addEventListener('resize', updateAll);

    // ===== Export Excel =====
    function buildAnalysis() {
      let all = [];
      PIVOTS.forEach(p => { all = all.concat(getVals(data[p])); });
      if (!all.length) {
        return { lines: ['لا توجد قراءات للتحليل.'], outliers: [], overall: null, sd: null, cv: null, status: '' };
      }
      const overall = avg(all);
      const sdVal = std(all) || 0;
      const cv = overall ? (sdVal / overall) * 100 : 0;
      const lo = overall - 1.5 * sdVal;
      const hi = overall + 1.5 * sdVal;
      const outliers = [];
      PIVOTS.forEach(p => {
        let vi = 0;
        const vals = getVals(data[p]);
        data[p].forEach((raw, idx) => {
          if (raw != null && raw > 0) {
            const v = vals[vi++];
            if (v < lo || v > hi) {
              outliers.push({ pivot: p, reading: idx + 1, value: v, type: v > hi ? 'مرتفع' : 'منخفض' });
            }
          }
        });
      });
      const pivotInfo = [];
      PIVOTS.forEach(p => {
        const vals = getVals(data[p]);
        if (!vals.length) return;
        const a = avg(vals);
        pivotInfo.push({ p, avg: a, n: vals.length, div: (a / overall) * 100, sd: std(vals) });
      });
      const high = pivotInfo.filter(x => x.div > 110).map(x => x.p);
      const low = pivotInfo.filter(x => x.div < 90).map(x => x.p);
      const lines = [];
      lines.push('—— تحليل سريع لحالة البيفوت ——');
      lines.push('متوسط المللي الكلي: ' + overall.toFixed(2) + ' مم');
      lines.push('الانحراف المعياري: ' + sdVal.toFixed(2) + ' مم');
      lines.push('معامل الاختلاف CV: ' + cv.toFixed(1) + '%');
      lines.push('عدد القراءات: ' + all.length);
      lines.push('عدد القيم الشاذة: ' + outliers.length + (outliers.length ? ' (' + outliers.map(o => o.pivot + '-' + o.reading).join(', ') + ')' : ''));
      let status = '';
      const recommendations = [];
      if (cv < 10) {
        status = 'ممتاز — توزيع منتظم جداً';
        recommendations.push('الحفاظ على الإعدادات الحالية للضغط والسرعة.');
      } else if (cv < 15) {
        status = 'جيد — انتظام مقبول';
        recommendations.push('مراقبة النقاط الشاذة إن وُجدت في الجولات القادمة.');
      } else if (cv < 25) {
        status = 'متوسط — يحتاج مراجعة لبعض النقاط';
        recommendations.push('فحص الفوهات والصفايات عند العجلات ذات الانحراف الأعلى.');
        recommendations.push('التحقق من ضغط التشغيل على طول الذراع.');
      } else {
        status = 'ضعيف — عدم انتظام ملحوظ';
        recommendations.push('فحص شامل للفوهات والتسريب والفلاتر.');
        recommendations.push('مراجعة استقامة الذراع وانتظام السرعة.');
        recommendations.push('إعادة ضبط الضغط ومقارنة النتائج بعد التصحيح.');
      }
      lines.push('تقييم الانتظام: ' + status);
      if (high.length) {
        lines.push('عجلات أعلى من المتوسط (>110%): ' + high.join(', '));
        recommendations.push('العجلات المرتفعة (' + high.join(', ') + '): احتمال فوهات متوسعة أو ضغط زائد — راجعها.');
      }
      if (low.length) {
        lines.push('عجلات أقل من المتوسط (<90%): ' + low.join(', '));
        recommendations.push('العجلات المنخفضة (' + low.join(', ') + '): احتمال انسداد فوهات أو تسريب — نظّفها/استبدلها.');
      }
      if (!high.length && !low.length) lines.push('جميع العجلات ضمن نطاق مقبول من المتوسط (90–110%).');
      if (outliers.length) {
        lines.push('القيم الشاذة تستدعي التحقق من الفوهات/الضغط عند تلك المواقع.');
        recommendations.push('القيم الشاذة عند: ' + outliers.map(o => o.pivot + '-' + o.reading + ' (' + o.type + ')').join('، '));
      } else {
        lines.push('لا توجد قيم شاذة خارج نطاق ±1.5σ.');
      }
      const area = parseFloat(document.getElementById('area').value) || 0;
      const hours = parseFloat(document.getElementById('hours').value) || 1;
      lines.push('التدفق المحسوب: ' + (overall * (area / hours) * 4.2).toFixed(2) + ' M³/H');
      lines.push('—— التوصيات ——');
      recommendations.forEach((r, i) => lines.push((i + 1) + ') ' + r));
      return { lines, outliers, overall, sd: sdVal, cv, pivotInfo, status, recommendations };
    }

    function exportExcel() {
      if (typeof XLSX === 'undefined') {
        const rows=[['Pivot',document.getElementById('pivotName').value],['Wheel','Reading','MM']];
        PIVOTS.forEach(k=>data[k].forEach((v,i)=>{if(v!=null&&v>0)rows.push([k,i+1,v])}));
        const csv='\\uFEFF'+rows.map(r=>r.map(v=>String(v??'').replace(/"/g,'""')).map(v=>'"'+v+'"').join(',')).join('\\r\\n');
        downloadLocal(new Blob([csv],{type:'text/csv;charset=utf-8'}),'Irrigation_Readings.csv');toast('تم تصدير القراءات بصيغة CSV المتوافقة مع Excel');return;
      }
      try {
        const c1 = getC1();
        const area = parseFloat(document.getElementById('area').value) || 0;
        const hours = parseFloat(document.getElementById('hours').value) || 0;
        const date = document.getElementById('date').value;
        const pname = document.getElementById('pivotName').value || 'P16';
        const radius = parseFloat(document.getElementById('radius').value) || 17.5;
        const analysis = buildAnalysis();

        const rows = [
          ['تجربة الري | Irrigation Trial'],
          [],
          ['المعاملات'],
          ['نصف قطر الطبق (م)', radius],
          ['ثابت C1', +c1.toFixed(2)],
          ['المساحة (فدان)', area],
          ['ساعات الري', hours],
          ['أفدنة/ساعة', +(area / (hours || 1)).toFixed(2)],
          ['التدفق M³/H', document.getElementById('flow').textContent],
          ['التاريخ', date],
          ['البيفوت', pname],
          ['متوسط كلي (مم)', document.getElementById('overallAvg').textContent],
          [],
          ['—— تحليل سريع لحالة البيفوت ——']
        ];
        analysis.lines.forEach(l => rows.push([l]));
        rows.push([]);
        rows.push(['البيانات التفصيلية']);
        rows.push(['العجلة', 'القراءة', 'MM', 'محسوب (مم)', 'شاذة؟']);

        const overall = analysis.overall;
        const sdVal = analysis.sd || 0;
        const lo = overall != null ? overall - 1.5 * sdVal : 0;
        const hi = overall != null ? overall + 1.5 * sdVal : 0;
        const chartRows = [['التسمية', 'القيمة', 'عادية', 'شاذة']];

        PIVOTS.forEach(p => {
          data[p].forEach((v, i) => {
            if (v != null && v > 0) {
              const calc = v / c1;
              const isOut = overall != null && (calc < lo || calc > hi);
              rows.push([p, i + 1, v, +calc.toFixed(2), isOut ? 'نعم' : '']);
              chartRows.push([
                p + '-' + (i + 1),
                +calc.toFixed(2),
                isOut ? '' : +calc.toFixed(2),
                isOut ? +calc.toFixed(2) : ''
              ]);
            }
          });
        });

        rows.push([]);
        rows.push(['ملخص حسب العجلة']);
        rows.push(['العجلة', 'عدد', 'متوسط', 'انحراف', 'أدنى', 'أقصى', 'DIV %']);
        PIVOTS.forEach(p => {
          const vals = getVals(data[p]);
          const a = avg(vals);
          rows.push([
            p, vals.length,
            a != null ? +a.toFixed(2) : '',
            std(vals) != null ? +std(vals).toFixed(2) : '',
            vals.length ? +Math.min(...vals).toFixed(2) : '',
            vals.length ? +Math.max(...vals).toFixed(2) : '',
            (a != null && overall) ? +((a / overall) * 100).toFixed(1) : ''
          ]);
        });

        if (analysis.outliers.length) {
          rows.push([]);
          rows.push(['القيم الشاذة']);
          rows.push(['العجلة', 'القراءة', 'القيمة (مم)', 'النوع']);
          analysis.outliers.forEach(o => {
            rows.push([o.pivot, o.reading, +o.value.toFixed(2), o.type]);
          });
        }

        const ws1 = XLSX.utils.aoa_to_sheet(rows);
        ws1['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];

        const ws2 = XLSX.utils.aoa_to_sheet(chartRows);
        ws2['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
        const noteR = chartRows.length + 2;
        XLSX.utils.sheet_add_aoa(ws2, [
          [],
          ['لرسم المنحنى: حدد الأعمدة وأدرج مخطط خطوط (Insert > Charts > Line)'],
          ['عمود «شاذة» = القيم خارج المتوسط ± 1.5σ'],
          ['التقييم: ' + (analysis.status || '')]
        ], { origin: 'A' + noteR });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws1, 'البيانات والتحليل');
        XLSX.utils.book_append_sheet(wb, ws2, 'بيانات المنحنى');

        const fileName = 'Irrigation_' + pname.replace(/\s/g, '_') + '_' + (date || 'export') + '.xlsx';
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        try {
          if (navigator.canShare) {
            const file = new File([blob], fileName, { type: blob.type });
            if (navigator.canShare({ files: [file] })) {
              navigator.share({ files: [file], title: 'تجربة الري - ' + pname, text: analysis.lines.slice(0, 5).join('\n') })
                .then(() => toast('✅ تمت المشاركة'))
                .catch(() => forceDownload(blob, fileName));
              return;
            }
          }
        } catch (e) {}

        forceDownload(blob, fileName);
      } catch (err) {
        console.error(err);
        toast('❌ فشل التصدير: ' + (err.message || 'خطأ'));
      }
    }

    function forceDownload(blob, fileName) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 800);
      toast('✅ تم تحميل Excel مع التحليل');
    }


    // Opens the installed WhatsApp app (Android / iOS); falls back to wa.me
    function openWhatsAppApp(encodedText) {
      const webUrl = 'https://wa.me/?text=' + encodedText;
      const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
      if (!isMobile) { window.open(webUrl, '_blank'); return; }
      let left = false;
      const onHide = () => { if (document.hidden) left = true; };
      document.addEventListener('visibilitychange', onHide);
      window.addEventListener('pagehide', () => { left = true; }, { once: true });
      window.location.href = 'whatsapp://send?text=' + encodedText;
      setTimeout(() => {
        document.removeEventListener('visibilitychange', onHide);
        if (!left) window.location.href = webUrl; // app not opened → universal link
      }, 1800);
    }

    // ===== WhatsApp: share as Excel file =====
    function shareWhatsApp() {
      if (typeof XLSX === 'undefined') {
        toast('❌ مكتبة Excel غير محمّلة — تأكد من الإنترنت');
        return;
      }
      const analysis = buildAnalysis();
      if (analysis.overall == null) {
        toast('⚠️ أدخل قراءات أولاً');
        return;
      }

      try {
        const c1 = getC1();
        const area = parseFloat(document.getElementById('area').value) || 0;
        const hours = parseFloat(document.getElementById('hours').value) || 0;
        const date = document.getElementById('date').value;
        const pname = document.getElementById('pivotName').value || 'P16';
        const radius = parseFloat(document.getElementById('radius').value) || 17.5;

        // Sheet 1: full report
        const rows = [
          ['تجربة الري | Irrigation Trial'],
          [],
          ['المعاملات'],
          ['نصف قطر الطبق (م)', radius],
          ['ثابت C1', +c1.toFixed(2)],
          ['المساحة (فدان)', area],
          ['ساعات الري', hours],
          ['أفدنة/ساعة', +(area / (hours || 1)).toFixed(2)],
          ['التدفق M³/H', document.getElementById('flow').textContent],
          ['التاريخ', date],
          ['البيفوت', pname],
          ['متوسط كلي (مم)', document.getElementById('overallAvg').textContent],
          []
        ];
        analysis.lines.forEach(l => rows.push([l]));
        rows.push([]);
        rows.push(['البيانات التفصيلية']);
        rows.push(['العجلة', 'القراءة', 'MM', 'محسوب (مم)', 'شاذة؟']);

        const overall = analysis.overall;
        const sdVal = analysis.sd || 0;
        const lo = overall - 1.5 * sdVal;
        const hi = overall + 1.5 * sdVal;
        const chartRows = [['التسمية', 'القيمة', 'عادية', 'شاذة']];

        PIVOTS.forEach(p => {
          data[p].forEach((v, i) => {
            if (v != null && v > 0) {
              const calc = v / c1;
              const isOut = calc < lo || calc > hi;
              rows.push([p, i + 1, v, +calc.toFixed(2), isOut ? 'نعم' : '']);
              chartRows.push([
                p + '-' + (i + 1),
                +calc.toFixed(2),
                isOut ? '' : +calc.toFixed(2),
                isOut ? +calc.toFixed(2) : ''
              ]);
            }
          });
        });

        rows.push([]);
        rows.push(['ملخص حسب العجلة']);
        rows.push(['العجلة', 'عدد', 'متوسط', 'انحراف', 'أدنى', 'أقصى', 'DIV %']);
        PIVOTS.forEach(p => {
          const vals = getVals(data[p]);
          const a = avg(vals);
          rows.push([
            p, vals.length,
            a != null ? +a.toFixed(2) : '',
            std(vals) != null ? +std(vals).toFixed(2) : '',
            vals.length ? +Math.min(...vals).toFixed(2) : '',
            vals.length ? +Math.max(...vals).toFixed(2) : '',
            (a != null && overall) ? +((a / overall) * 100).toFixed(1) : ''
          ]);
        });

        if (analysis.outliers.length) {
          rows.push([]);
          rows.push(['القيم الشاذة']);
          rows.push(['العجلة', 'القراءة', 'القيمة (مم)', 'النوع']);
          analysis.outliers.forEach(o => {
            rows.push([o.pivot, o.reading, +o.value.toFixed(2), o.type]);
          });
        }

        const ws1 = XLSX.utils.aoa_to_sheet(rows);
        ws1['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];

        const ws2 = XLSX.utils.aoa_to_sheet(chartRows);
        ws2['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
        XLSX.utils.sheet_add_aoa(ws2, [
          [],
          ['لرسم المنحنى في Excel: Insert > Charts > Line'],
          ['عمود شاذة = خارج المتوسط ± 1.5σ'],
          ['التقييم: ' + (analysis.status || '')]
        ], { origin: 'A' + (chartRows.length + 2) });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws1, 'البيانات والتحليل');
        XLSX.utils.book_append_sheet(wb, ws2, 'بيانات المنحنى');

        const fileName = 'Irrigation_' + pname.replace(/\s/g, '_') + '_' + (date || 'export') + '.xlsx';
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const file = new File([blob], fileName, { type: blob.type });

        const caption = '🌱 تجربة الري - ' + pname + '\n' +
          'متوسط: ' + overall.toFixed(2) + ' مم | CV: ' + (analysis.cv || 0).toFixed(1) + '%\n' +
          'التقييم: ' + analysis.status;

        // Save the Excel file (a link can't attach files), then open the WhatsApp app directly
        forceDownload(blob, fileName);
        const waText = encodeURIComponent(caption + '\n(ملف Excel تم تحميله — أرفقه من هنا)');
        setTimeout(() => openWhatsAppApp(waText), 700);
        toast('📥 تم تحميل الملف — جاري فتح واتساب');
      } catch (err) {
        console.error(err);
        toast('❌ فشل: ' + (err.message || 'خطأ'));
      }
    }

    function doShare() {
      exportExcel();
      // Also prepare link for later
      try {
        const json = JSON.stringify(payload());
        const enc = btoa(unescape(encodeURIComponent(json)));
        const url = location.href.split('?')[0] + '?d=' + enc;
        document.getElementById('shareLink').value = url;
        document.getElementById('shareCard').style.display = 'block';
      } catch (e) {}
    }

    function copyLink() {
      const el = document.getElementById('shareLink');
      el.select();
      navigator.clipboard.writeText(el.value).then(() => toast('📋 تم النسخ')).catch(() => toast('انسخ يدوياً'));
    }

    function dlJSON() {
      const blob = new Blob([JSON.stringify(payload(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Irrigation_Trial.json';
      a.click();
      toast('💾 تم التحميل');
    }

    function payload() {
      return {
        app: 'irrigation-trial', v: 1,
        radius: document.getElementById('radius').value,
        area: document.getElementById('area').value,
        hours: document.getElementById('hours').value,
        date: document.getElementById('date').value,
        pivotName: document.getElementById('pivotName').value,
        data: data
      };
    }

    function xmlEsc(t) {
      return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ===== Save as SVG (visual report + embedded data for re-import) =====
    function exportSVG() {
      const a = buildAnalysis();
      const W = 900, F = "font-family=\"Tahoma, 'Segoe UI', Arial, sans-serif\"";
      const pname = document.getElementById('pivotName').value || 'P16';
      const date = document.getElementById('date').value || '';
      const area = parseFloat(document.getElementById('area').value) || 0;
      const hours = parseFloat(document.getElementById('hours').value) || 1;
      const radius = document.getElementById('radius').value;
      const logoEl = document.querySelector('.logo');
      const logo = logoEl ? logoEl.src : '';
      const T = (x, y, txt, size, fill, opts) => '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + fill + '" ' + F + ' ' + (opts || '') + '>' + xmlEsc(txt) + '</text>';
      let o = '';
      o += '<rect width="' + W + '" height="HEIGHT" fill="#F0F4F0"/>';
      o += '<rect width="' + W + '" height="130" fill="#2E7D32"/>';
      o += T(W - 30, 62, 'تجربة الري', 36, '#fff', 'font-weight="700" text-anchor="end" direction="rtl"');
      if (logo) o += '<image href="' + logo + '" x="' + (W - 66) + '" y="80" width="36" height="36"/>';
      o += T(W - 74, 105, 'تصميم مهندس محمد إبراهيم (فرمينو)', 16, '#E8F5E9', 'text-anchor="end" direction="rtl"');
      o += T(30, 62, pname, 26, '#fff', 'font-weight="700"');
      o += T(30, 95, date, 16, '#E8F5E9');
      let y = 160;
      o += T(W - 30, y, 'نصف القطر: ' + radius + ' سم  •  المساحة: ' + area + '  •  الساعات: ' + hours, 15, '#555', 'text-anchor="end" direction="rtl"');
      y += 20;
      if (a.overall == null) {
        o += T(W / 2, y + 60, 'لا توجد قراءات', 22, '#777', 'text-anchor="middle"');
        y += 120;
      } else {
        const flow = (a.overall * (area / hours) * 4.2).toFixed(2);
        const boxes = [
          ['متوسط المللي', a.overall.toFixed(2) + ' مم'],
          ['الانحراف المعياري', a.sd.toFixed(2) + ' مم'],
          ['معامل الاختلاف CV', a.cv.toFixed(1) + '%'],
          ['التدفق المحسوب', flow + ' م³/س']
        ];
        const bw = 200, gap = 20;
        boxes.forEach((b, i) => {
          const x = W - 30 - bw - i * (bw + gap);
          o += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="80" rx="10" fill="#fff" stroke="#E0E0E0"/>';
          o += T(x + bw / 2, y + 28, b[0], 14, '#757575', 'text-anchor="middle"');
          o += T(x + bw / 2, y + 60, b[1], 22, '#1B5E20', 'font-weight="700" text-anchor="middle"');
        });
        y += 110;
        o += T(W - 30, y, 'التقييم: ' + a.status, 18, '#212121', 'font-weight="700" text-anchor="end" direction="rtl"');
        y += 36;
        // bar chart: pivot averages
        const info = a.pivotInfo;
        const chartH = 240, chartX = 50, chartW = W - 100;
        o += '<rect x="30" y="' + y + '" width="' + (W - 60) + '" height="' + (chartH + 70) + '" rx="12" fill="#fff" stroke="#E0E0E0"/>';
        o += T(W - 50, y + 28, 'متوسط المللي لكل عجلة', 16, '#1B5E20', 'font-weight="700" text-anchor="end" direction="rtl"');
        const base = y + 40 + chartH;
        const maxV = Math.max(a.overall * 1.4, ...info.map(p => p.avg)) || 1;
        const step = chartW / info.length;
        info.forEach((p, i) => {
          const h = (p.avg / maxV) * chartH;
          const bx = chartX + (info.length - 1 - i) * step + step * 0.2;
          const bwid = step * 0.6;
          const dev = Math.abs(p.div - 100);
          const col = dev <= 10 ? '#43A047' : dev <= 20 ? '#FB8C00' : '#E53935';
          o += '<rect x="' + bx.toFixed(1) + '" y="' + (base - h).toFixed(1) + '" width="' + bwid.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="4" fill="' + col + '"/>';
          o += T((bx + bwid / 2).toFixed(1), (base - h - 6).toFixed(1), p.avg.toFixed(2), 13, '#333', 'text-anchor="middle"');
          o += T((bx + bwid / 2).toFixed(1), base + 20, String(p.p), 14, '#555', 'text-anchor="middle"');
        });
        const my = base - (a.overall / maxV) * chartH;
        o += '<line x1="' + chartX + '" x2="' + (chartX + chartW) + '" y1="' + my.toFixed(1) + '" y2="' + my.toFixed(1) + '" stroke="#1565C0" stroke-width="2" stroke-dasharray="6 4"/>';
        o += T(chartX + 4, (my - 6).toFixed(1), 'المتوسط ' + a.overall.toFixed(2), 12, '#1565C0');
        o += '<line x1="' + chartX + '" x2="' + (chartX + chartW) + '" y1="' + base + '" y2="' + base + '" stroke="#999"/>';
        y = base + 60;
        // recommendations
        if (a.recommendations.length) {
          o += T(W - 30, y, 'التوصيات', 17, '#1B5E20', 'font-weight="700" text-anchor="end" direction="rtl"');
          y += 26;
          a.recommendations.forEach((r, i) => {
            o += T(W - 30, y, (i + 1) + ') ' + r, 14, '#333', 'text-anchor="end" direction="rtl"');
            y += 24;
          });
        }
      }
      y += 20;
      o += T(W / 2, y, 'ملف SVG يحتوي على بيانات التجربة — يمكن استيراده مرة أخرى داخل التطبيق', 12, '#888', 'text-anchor="middle"');
      y += 20;
      const enc = btoa(unescape(encodeURIComponent(JSON.stringify(payload()))));
      const svg = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + W + '" height="' + y + '" viewBox="0 0 ' + W + ' ' + y + '" data-irrigation-trial="' + enc + '">\n' +
        '<title>تجربة الري - ' + xmlEsc(pname) + '</title>\n' + o.replace('HEIGHT', y) + '\n</svg>';
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const fn = 'Irrigation_' + pname.replace(/\s/g, '_') + '_' + (date || 'export') + '.svg';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = fn; link.style.display = 'none';
      document.body.appendChild(link); link.click();
      setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 800);
      toast('🖼️ تم حفظ ملف SVG');
    }

    // ===== Import from Excel (.xlsx / .xls / .csv) =====
    function importExcel(file) {
      if (typeof XLSX === 'undefined') {
        toast('❌ مكتبة Excel لم تُحمَّل — تأكد من الإنترنت');
        return;
      }
      const r = new FileReader();
      r.onload = ev => {
        try {
          const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array', cellDates: true });
          const ws = wb.Sheets['البيانات والتحليل'] || wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
          const norm = v => (v == null ? '' : String(v)).trim();
          const num = v => {
            if (v == null || v === '') return null;
            const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
            return isFinite(n) ? n : null;
          };
          const fmtDate = v => {
            if (v instanceof Date && !isNaN(v)) {
              const d = new Date(v.getTime() - v.getTimezoneOffset() * 60000);
              return d.toISOString().slice(0, 10);
            }
            const t = norm(v);
            return /^\d{4}-\d{2}-\d{2}/.test(t) ? t.slice(0, 10) : '';
          };

          const p = {};
          let hdr = -1;
          for (let i = 0; i < rows.length; i++) {
            const a = norm(rows[i][0]), b = norm(rows[i][1]);
            if (a === 'العجلة' && b === 'القراءة') { hdr = i; break; }
            const v = rows[i][1];
            if (a.includes('نصف قطر') && num(v)) p.radius = num(v);
            else if (a.includes('المساحة') && num(v) != null) p.area = num(v);
            else if (a.includes('ساعات الري') && num(v) != null) p.hours = num(v);
            else if (a === 'التاريخ' && fmtDate(v)) p.date = fmtDate(v);
            else if (a === 'البيفوت' && norm(v)) p.pivotName = norm(v);
          }
          if (hdr < 0) { toast('❌ لم أجد جدول القراءات (العجلة / القراءة / MM)'); return; }

          const nd = {};
          PIVOTS.forEach(k => { nd[k] = Array((k === 'End') ? 4 : READINGS).fill(null); });
          let count = 0;
          for (let i = hdr + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.every(c => c == null || norm(c) === '')) break;
            let key = norm(row[0]);
            if (/^end$/i.test(key)) key = 'End';
            else if (/^\d+$/.test(key)) key = parseInt(key, 10);
            else continue;
            const idx = num(row[1]), val = num(row[2]);
            if (!PIVOTS.includes(key) || !idx || idx < 1 || val == null || val <= 0) continue;
            while (nd[key].length < idx) nd[key].push(null);
            nd[key][idx - 1] = val;
            count++;
          }
          if (!count) { toast('⚠️ لا توجد قراءات في الملف'); return; }
          p.data = nd;
          apply(p);
          toast('✅ تم استيراد ' + count + ' قراءة من Excel');
        } catch (err) { console.warn(err); toast('❌ تعذّر قراءة ملف Excel'); }
      };
      r.readAsArrayBuffer(file);
    }

    // ===== Import: SVG (with embedded data) or JSON =====
    function importJSON(e) {
      const f = e.target.files[0];
      if (!f) return;
      if (/\.(xlsx|xls|csv)$/i.test(f.name)) {
        importExcel(f);
        e.target.value = '';
        return;
      }
      const r = new FileReader();
      r.onload = ev => {
        try {
          const txt = String(ev.target.result);
          let obj;
          if (/^\s*(<\?xml|<svg|<!--)/i.test(txt) || /\.svg$/i.test(f.name)) {
            const m = txt.match(/data-irrigation-trial\s*=\s*["']([A-Za-z0-9+\/=\s]+)["']/);
            if (!m) { toast('❌ ملف SVG لا يحتوي على بيانات التجربة'); return; }
            obj = JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/\s/g, '')))));
          } else {
            obj = JSON.parse(txt);
          }
          apply(obj);
          toast('✅ تم الاستيراد');
        } catch (err) { console.warn(err); toast('❌ ملف غير صالح'); }
      };
      r.readAsText(f);
      e.target.value = '';
    }

    function loadURL() {
      const d = new URLSearchParams(location.search).get('d');
      if (!d) return;
      try {
        apply(JSON.parse(decodeURIComponent(escape(atob(d)))));
        toast('✅ تم تحميل البيانات المشتركة');
      } catch (e) { console.warn(e); }
    }

    function apply(p) {
      if (p.radius) document.getElementById('radius').value = p.radius;
      if (p.area) document.getElementById('area').value = p.area;
      if (p.hours) document.getElementById('hours').value = p.hours;
      if (p.date) document.getElementById('date').value = p.date;
      if (p.pivotName) document.getElementById('pivotName').value = p.pivotName;
      if (p.data) {
        PIVOTS.forEach(k => {
          const n = (k === 'End') ? 4 : READINGS;
          data[k] = p.data[k] || Array(n).fill(null);
        });
      }
      recalc();
      renderTabs();
      renderTable();
      updateAll();
    }

    function clearAll() {
      if (!confirm('هل تريد مسح جميع الإدخالات لكل العجلات؟ لا يمكن التراجع.')) return;
      PIVOTS.forEach(p => {
        const n = (p === 'End') ? 4 : READINGS;
        data[p] = Array(n).fill(null);
      });
      cur = 1;
      renderTabs();
      renderTable();
      updateAll();
      document.getElementById('shareCard').style.display = 'none';
      toast('🗑️ تم مسح جميع القراءات');
    }

    function toast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2500);
    }
  
    // ===== Offline multi-pivot vault =====
    const VAULT_KEY = 'irrigationTrialVaultV1';
    let activeSavedId = null;
    function readVault(){ try{return JSON.parse(localStorage.getItem(VAULT_KEY)||'[]')}catch(e){return []} }
    function writeVault(list){ localStorage.setItem(VAULT_KEY,JSON.stringify(list)); refreshVault(); }
    function snapshot(name,id){
      return {id:id||('pivot-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)),name:name||document.getElementById('pivotName').value||'بيفوت جديد',
        savedAt:new Date().toISOString(),radius:document.getElementById('radius').value,area:document.getElementById('area').value,
        hours:document.getElementById('hours').value,date:document.getElementById('date').value,
        pivotName:document.getElementById('pivotName').value,data:JSON.parse(JSON.stringify(data))};
    }
    function refreshVault(){
      const sel=document.getElementById('savedPivotSelect'); if(!sel)return;
      const list=readVault(), keep=activeSavedId||sel.value;
      sel.innerHTML='<option value="">اختر بيفوت محفوظًا...</option>';
      list.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.name+' · '+new Date(p.savedAt).toLocaleDateString();sel.appendChild(o)});
      if(list.some(p=>p.id===keep))sel.value=keep;
      document.getElementById('savedPivotStatus').textContent='عدد البيفوتات المحفوظة: '+list.length+' · الحفظ محلي على هذا الجهاز';
    }
    function savePivot(){
      const list=readVault(); let id=activeSavedId;
      if(!id){const name=prompt('اكتب اسم البيفوت للحفظ: ',document.getElementById('pivotName').value||'بيفوت جديد');if(!name)return;
        const item=snapshot(name.trim());id=item.id;list.push(item);activeSavedId=id;
      }else{const i=list.findIndex(p=>p.id===id);const old=i>=0?list[i]:null;const item=snapshot(old?old.name:(document.getElementById('pivotName').value||'بيفوت'));item.id=id;if(i>=0)list[i]=item;else list.push(item);}
      writeVault(list);document.getElementById('savedPivotSelect').value=id;toast('تم حفظ بيانات البيفوت محليًا');
    }
    function loadSavedPivot(){
      const id=document.getElementById('savedPivotSelect').value;if(!id){toast('اختر بيفوتًا محفوظًا أولًا');return}
      const p=readVault().find(x=>x.id===id);if(!p)return;
      activeSavedId=id;apply(p);document.getElementById('pivotName').value=p.pivotName||p.name;
      refreshVault();document.getElementById('savedPivotSelect').value=id;toast('تم استدعاء '+p.name);
    }
    function newPivot(){
      if(!confirm('إنشاء بيفوت جديد؟ احفظ التعديلات الحالية أولًا إذا كنت تحتاجها.'))return;
      activeSavedId=null;PIVOTS.forEach(k=>data[k]=Array(k==='End'?4:READINGS).fill(null));
      document.getElementById('pivotName').value='';document.getElementById('date').value=new Date().toISOString().slice(0,10);
      document.getElementById('savedPivotSelect').value='';cur=1;renderTabs();renderTable();updateAll();toast('أدخل بيانات البيفوت الجديد ثم اضغط حفظ');
    }
    function renamePivot(){
      const id=document.getElementById('savedPivotSelect').value||activeSavedId;if(!id){toast('اختر بيفوتًا محفوظًا لتعديل اسمه');return}
      const list=readVault(),p=list.find(x=>x.id===id);if(!p)return;
      const name=prompt('الاسم الجديد:',p.name);if(!name||!name.trim())return;p.name=name.trim();p.pivotName=document.getElementById('pivotName').value=name.trim();p.savedAt=new Date().toISOString();activeSavedId=id;writeVault(list);document.getElementById('savedPivotSelect').value=id;toast('تم تعديل الاسم');
    }
    function deletePivot(){
      const id=document.getElementById('savedPivotSelect').value||activeSavedId;if(!id){toast('اختر بيفوتًا لحذفه');return}
      const list=readVault(),p=list.find(x=>x.id===id);if(!p)return;
      if(!confirm('حذف "'+p.name+'" نهائيًا من هذا الجهاز؟'))return;
      writeVault(list.filter(x=>x.id!==id));if(activeSavedId===id)activeSavedId=null;document.getElementById('savedPivotSelect').value='';toast('تم حذف البيفوت المحفوظ');
    }
    function exportAllPivots(){
      const payload={app:'Irrigation Trial',version:1,exportedAt:new Date().toISOString(),pivots:readVault()};
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
      downloadLocal(blob,'Irrigation_Pivots_Backup.json');toast('تم تجهيز النسخة الاحتياطية');
    }
    function downloadLocal(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
    function importBackupFile(e){
      const f=e.target.files&&e.target.files[0];if(!f)return;
      const reader=new FileReader();reader.onload=ev=>{
        try{
          const txt=String(ev.target.result||'');
          if(/\.csv$/i.test(f.name)){importCSVText(txt);return}
          if(/\.xlsx?$/i.test(f.name)){toast('استيراد XLSX يتطلب ملف CSV أو JSON عند العمل دون اتصال في هذه النسخة. افتح Excel واحفظ باسم CSV ثم استورده.');return}
          let obj;
          if(/\.svg$/i.test(f.name)||/<svg[\s>]/i.test(txt)){
            const m=txt.match(/data-irrigation-trial\s*=\s*["']([A-Za-z0-9+\/=\s]+)["']/);
            if(!m)throw Error('SVG لا يحتوي على بيانات تجربة مضمنة');
            obj=JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/\s/g,'')))));
          }else obj=JSON.parse(txt);
          if(Array.isArray(obj.pivots)){const current=readVault();const merged=[...current];obj.pivots.forEach(p=>{const i=merged.findIndex(x=>x.id===p.id);if(i>=0)merged[i]=p;else merged.push({...p,id:p.id||('import-'+Date.now()+'-'+Math.random().toString(36).slice(2,5))})});writeVault(merged);toast('تم استيراد البيفوتات: '+obj.pivots.length)}
          else {apply(obj);activeSavedId=null;toast('تم استيراد بيانات التجربة إلى الشاشة')}
        }catch(err){toast('تعذر الاستيراد: '+(err.message||'ملف غير صالح'))}
        finally{e.target.value=''}
      };reader.readAsText(f);
    }
    function importCSVText(txt){
      const rows=txt.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean).map(line=>line.split(/[;,]/).map(v=>v.trim().replace(/^"|"$/g,'')));
      const header=rows.findIndex(r=>r.some(x=>/^(العجلة|pivot)$/i.test(x))&&r.some(x=>/^(القراءة|reading)$/i.test(x))&&r.some(x=>/^mm$/i.test(x)));
      if(header<0){throw Error('CSV يحتاج أعمدة: العجلة, القراءة, MM')}
      const h=rows[header].map(x=>x.toLowerCase()), pi=h.findIndex(x=>/العجلة|pivot/.test(x)),ri=h.findIndex(x=>/القراءة|reading/.test(x)),mi=h.findIndex(x=>x==='mm');
      const nd={};PIVOTS.forEach(k=>nd[k]=Array(k==='End'?4:READINGS).fill(null));let count=0;
      rows.slice(header+1).forEach(r=>{let k=r[pi];if(/^end$/i.test(k))k='End';else if(/^\d+$/.test(k))k=parseInt(k,10);const idx=parseInt(r[ri]),v=parseFloat(r[mi]);if(PIVOTS.includes(k)&&idx>0&&v>0){while(nd[k].length<idx)nd[k].push(null);nd[k][idx-1]=v;count++}});
      if(!count)throw Error('لا توجد قراءات صالحة');apply({data:nd});toast('تم استيراد '+count+' قراءة من CSV');
    }
    function toggleTheme(){document.body.classList.toggle('dark');localStorage.setItem('irrigationTheme',document.body.classList.contains('dark')?'dark':'light')}
    let english=false;
    function toggleLanguage(){
      english=!english;document.documentElement.lang=english?'en':'ar';document.documentElement.dir=english?'ltr':'rtl';
      // Keep data labels intact; provide an explicit language state without relying on device locale.
      toast(english?'Language preference set to English layout':'تم الرجوع إلى الواجهة العربية');
      localStorage.setItem('irrigationLanguage',english?'en':'ar');
    }
    (function initVault(){if(localStorage.getItem('irrigationTheme')==='dark')document.body.classList.add('dark');english=localStorage.getItem('irrigationLanguage')==='en';document.documentElement.lang=english?'en':'ar';document.documentElement.dir=english?'ltr':'rtl';refreshVault();})();

// Installable PWA support: requires HTTPS (GitHub Pages qualifies).
let deferredInstallPrompt = null;
const installButton = document.getElementById('installAppBtn');
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (installButton) {
    installButton.hidden = false;
    installButton.textContent = '📲 تثبيت التطبيق';
  }
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  if (installButton) installButton.textContent = '✅ تم تثبيت التطبيق';
});
async function installApp() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }
  if (window.matchMedia('(display-mode: standalone)').matches) {
    toast('التطبيق مثبت بالفعل على جهازك');
  } else {
    toast('افتح قائمة المتصفح ⋮ ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». يلزم فتح الموقع عبر HTTPS أولاً.');
  }
}
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      if (typeof toast === 'function') toast('تعذر تفعيل التخزين دون اتصال؛ تأكد من رفع ملفات الحزمة كاملة على HTTPS');
    });
  });
}
