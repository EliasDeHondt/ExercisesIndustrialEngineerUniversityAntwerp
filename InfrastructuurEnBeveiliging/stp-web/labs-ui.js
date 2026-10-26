/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 26/10/2026
**/

'use strict';

// The shell of the lab app: routing, the home screen with the labs, and the tabs of a lab
// (Guide, Prepare, Monitor, Check, Notes).

const TABS = [['guide', 'Guide'], ['pdf', 'PDF'], ['prepare', 'Prepare'], ['monitor', 'Monitor'], ['check', 'Check'], ['notes', 'Notes']];
const TEST_MINUTES = 15;
const PREP_STORE = 'ieb-best-lab';

const SHELL = {
    lab: null,
    tab: null,
    prep: { mode: 'kb', test: null, timer: null },
    checkEx: {},                 // lab -> selected exercise id
    results: {},                 // 'lab.ex' -> last result of this session
    running: false,
    auto: null,                  // auto-run timer of the checker
    theme: new URLSearchParams(location.search).get('theme') || load('stp.theme', matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
};

const ICONS = {
    terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
    route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/></svg>',
    tree: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/><path d="M12 7v4M5 16v-3h14v3"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21H3z"/><path d="M9 21v-7h6v7"/></svg>'
};

/* ---------- Theme and chrome ---------- */

function setTheme(theme) {
    SHELL.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    $('themeBtn').innerHTML = theme === 'dark' ? ICON.sun : ICON.moon;
    save('stp.theme', theme);
}

function bestScore(n) {
    try {
        const b = localStorage.getItem(PREP_STORE + n), t = localStorage.getItem('ieb-total-lab' + n);
        return b !== null && t !== null ? { score: Number(b), total: Number(t) } : null;
    } catch { return null; }
}

function checkSummary(lab) {
    let ok = 0, ran = 0;
    for (const ex of lab.exercises) {
        const r = load(`ieb-check-${lab.n}-${ex.id}`, null);
        if (!r) continue;
        ran++;
        if (!r.fail) ok++;
    }
    return { ok, ran, total: lab.exercises.length };
}

function renderNav() {
    $('labNav').innerHTML = `
        <a class="stp-nav-item cursor-pointer${SHELL.lab === null ? ' stp-active' : ''}" href="#/"><span class="stp-nav-icon">${ICONS.home}</span><span>All labs</span></a>
        ${LABS.map(l => `<a class="stp-nav-item cursor-pointer${SHELL.lab === l.n ? ' stp-active' : ''}" href="#/lab/${l.n}"><span class="stp-nav-icon">${ICONS[l.icon]}</span><span>Lab ${l.n}: ${esc(l.short)}</span></a>`).join('')}`;
}

function setHeader(title, controls) {
    $('title').textContent = title;
    $('interval').hidden = controls !== 'stp';
    $('pauseBtn').hidden = controls !== 'stp';
    $('refreshBtn').hidden = !controls;
    $('status').hidden = !controls;
}

/* ---------- Routing ---------- */

function leaveViews() {
    Monitor.leave();
    DeviceMap.leave();
    clearInterval(SHELL.prep.timer);
    clearInterval(SHELL.auto);
    SHELL.auto = null;
    $('wrapper').classList.remove('stp-mobile-menu-open');
}

function route() {
    leaveViews();
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const q = new URLSearchParams(location.search);
    if (!parts.length && q.get('demo')) {
        location.hash = q.get('demo') === 'lab4' ? '#/lab/4/monitor' : '#/lab/3/monitor';
        return;
    }
    if (parts[0] === 'lab' && labByNumber(parts[1])) {
        const tab = TABS.some(t => t[0] === parts[2]) ? parts[2] : 'guide';
        showLab(Number(parts[1]), tab);
    } else {
        showHome();
    }
}

function showHome() {
    SHELL.lab = null;
    renderNav();
    setHeader('Infrastructure and Security labs', null);
    $('view-home').hidden = false;
    $('view-lab').hidden = true;
    $('view-home').innerHTML = `
        <div class="stp-hero">
            <h1>Choose a lab</h1>
            <p>Every lab has a guide to read, a preparation test, a live monitor of your devices, a checker that tells you whether the exercise is set up correctly and, if not, what is wrong, and your notes.</p>
        </div>
        <div class="stp-lab-grid">
            ${LABS.map(l => {
                const best = bestScore(l.n), cs = checkSummary(l);
                return `<article class="stp-lab-card">
                    <div class="stp-lab-card-head"><span class="stp-lab-num">${l.n}</span><span class="stp-lab-icon">${ICONS[l.icon]}</span></div>
                    <h2>${esc(l.title)}</h2>
                    <p>${esc(l.summary)}</p>
                    <div class="stp-badges">
                        <span class="stp-badge">${l.exercises.length} exercises</span>
                        <span class="stp-badge${best ? ' stp-badge--ok' : ''}">Test: ${best ? `${best.score}/${best.total}` : 'not taken'}</span>
                        <span class="stp-badge${cs.ran && cs.ok === cs.ran ? ' stp-badge--ok' : cs.ran ? ' stp-badge--warn' : ''}">Checks: ${cs.ran ? `${cs.ok}/${cs.ran} OK` : 'not run'}</span>
                    </div>
                    <div class="stp-lab-actions">
                        ${TABS.map(([k, name]) => `<a class="stp-btn cursor-pointer" href="#/lab/${l.n}/${k}">${name}</a>`).join('')}
                    </div>
                </article>`;
            }).join('')}
        </div>
        <p class="stp-muted">Labs 5 to 8 (firewalls, VPNs, security validation) follow when their guides are available.</p>`;
    window.scrollTo(0, 0);
}

function showLab(n, tab) {
    const lab = labByNumber(n);
    SHELL.lab = n;
    SHELL.tab = tab;
    Monitor.select(n);
    renderNav();
    setHeader(`Lab ${n}: ${lab.title}`, null);
    $('view-home').hidden = true;
    $('view-lab').hidden = false;
    $('labHead').innerHTML = `<span class="stp-lab-num">${n}</span><div><h1>${esc(lab.title)}</h1><p>${esc(lab.summary)}</p></div>`;
    $('labTabs').innerHTML = TABS.map(([k, name]) => `<a class="stp-tab-link cursor-pointer${k === tab ? ' stp-active' : ''}" href="#/lab/${n}/${k}">${name}</a>`).join('');
    for (const [k] of TABS) $('tab-' + k).hidden = k !== tab;
    ({ guide: renderGuide, pdf: renderPdf, prepare: renderPrepare, monitor: renderMonitor, check: renderCheck, notes: renderLabNotes })[tab](lab);
    $('content').scrollTop = 0;
}

/* ---------- Guide ---------- */

function renderGuide(lab) {
    $('tab-guide').innerHTML = `
        <div class="stp-guide-top">
            <section class="stp-card"><h2 class="stp-card-title">Lab goals</h2><ul class="stp-list">${lab.goals.map(g => `<li>${inlineMd(g)}</li>`).join('')}</ul></section>
            <section class="stp-card"><h2 class="stp-card-title">Preparation</h2><ul class="stp-list">${lab.reading.map(g => `<li>${inlineMd(g)}</li>`).join('')}</ul>
                <p class="stp-muted" style="margin-top:10px">The Prepare tab has the knowledge base and a 15-minute test.</p></section>
            <section class="stp-card"><h2 class="stp-card-title">Devices and settings</h2>
                <dl class="stp-detail-grid">${lab.devices.map(([k, v]) => `<dt>${esc(k)}</dt><dd style="font-weight:500;word-break:normal">${inlineMd(v)}</dd>`).join('')}</dl></section>
        </div>
        <h2 class="stp-section-title">Exercises</h2>
        ${lab.exercises.map((ex, i) => `
            <details class="stp-ex"${i === 0 ? ' open' : ''}>
                <summary>${esc(ex.title)}<span class="stp-ex-status" id="exstatus-${lab.n}-${ex.id}"></span></summary>
                <div class="stp-ex-body">
                    <p>${inlineMd(ex.intro)}</p>
                    ${ex.steps.length ? `<h3>What to do</h3><ol class="stp-steps">${ex.steps.map(s => `<li>${inlineMd(s)}</li>`).join('')}</ol>` : ''}
                    ${ex.questions.length ? `<h3>Questions</h3><ul class="stp-questions">${ex.questions.map(s => `<li>${inlineMd(s)}</li>`).join('')}</ul>` : ''}
                    <div class="stp-ex-actions"><a class="stp-btn cursor-pointer" href="#/lab/${lab.n}/check" data-checkex="${ex.id}">Check this exercise</a><a class="stp-btn cursor-pointer" href="#/lab/${lab.n}/monitor">Open the monitor</a></div>
                </div>
            </details>`).join('')}`;
    for (const ex of lab.exercises) paintExStatus(lab.n, ex.id);
}

function paintExStatus(labN, exId) {
    const el = $(`exstatus-${labN}-${exId}`);
    if (!el) return;
    const r = load(`ieb-check-${labN}-${exId}`, null);
    el.innerHTML = r ? `<span class="stp-badge ${r.fail ? 'stp-badge--bad' : r.warn ? 'stp-badge--warn' : 'stp-badge--ok'}">${r.fail ? r.fail + ' problem(s)' : r.warn ? 'OK with warnings' : 'OK'}</span>` : '';
}

/* ---------- PDF ---------- */

// The original lab guide, shown in the page with the viewer of the browser.
function renderPdf(lab) {
    const box = $('tab-pdf');
    const src = `/pdf/Lab${lab.n}.pdf`;
    if (box.dataset.src === src) return;          // already loaded: keep the page the reader was on
    box.dataset.src = src;
    box.innerHTML = `
        <div class="stp-pdf-bar">
            <span class="stp-muted"><b>Lab${lab.n}.pdf</b>, the guide of this lab as handed out</span>
            <span class="stp-pdf-actions">
                <a class="stp-btn cursor-pointer" href="${src}" target="_blank" rel="noopener">Open in a new tab</a>
                <a class="stp-btn cursor-pointer" href="${src}" download="Lab${lab.n}.pdf">Download</a>
            </span>
        </div>
        <iframe class="stp-pdf-frame" src="${src}#view=FitH" title="Lab ${lab.n} guide (PDF)"></iframe>
        <p class="stp-muted">If the page stays empty, your browser blocks embedded PDFs. Use "Open in a new tab".</p>`;
}

/* ---------- Prepare (knowledge base and test) ---------- */

const prepLab = n => PREP_LABS.find(l => l.n === n);
const letter = i => String.fromCharCode(65 + i);
const fmtTime = sec => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
function shuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
}

function renderPrepare(lab) {
    clearInterval(SHELL.prep.timer);
    SHELL.prep.mode = 'kb';
    const p = prepLab(lab.n);
    const box = $('tab-prepare');
    if (!p || !p.kb) { box.innerHTML = '<p class="stp-muted">No preparation material for this lab yet.</p>'; return; }
    const best = bestScore(lab.n);
    box.innerHTML = `
        <div class="stp-prose">${p.kb}</div>
        <div class="stp-cta">
            <p><strong>Ready to test?</strong> ${p.qs.length} multiple-choice questions, ${TEST_MINUTES} minutes. The timer starts when you press the button.${best ? ` Best score so far: ${best.score} / ${best.total}.` : ''}</p>
            ${p.note ? `<p class="stp-muted">${esc(p.note)}</p>` : ''}
            <button class="stp-btn stp-btn--primary cursor-pointer" id="startTest" type="button">Start test</button>
        </div>`;
    $('startTest').addEventListener('click', () => startTest(lab, p));
}

function startTest(lab, p) {
    const test = {
        items: shuffle(p.qs).map(q => ({ q, order: shuffle(q.o.map((_, i) => i)), picked: null })),
        end: Date.now() + TEST_MINUTES * 60 * 1000,
        done: false
    };
    SHELL.prep.test = test;
    const box = $('tab-prepare');
    box.innerHTML = `
        <div class="stp-test-bar"><button class="stp-btn cursor-pointer" id="leaveTest" type="button">Stop</button><span class="stp-muted" id="progress"></span><span class="stp-timer" id="timer">${fmtTime(TEST_MINUTES * 60)}</span></div>
        <h2 class="stp-section-title">Test Lab ${lab.n}: ${esc(lab.title)}</h2>
        <div id="questions">${test.items.map((it, qi) => `
            <div class="stp-q"><p class="stp-q-text">${qi + 1}. ${esc(it.q.q)}</p>
                ${it.order.map((orig, pos) => `<label class="stp-opt cursor-pointer"><input class="cursor-pointer" type="radio" name="q${qi}" value="${orig}"><span>${letter(pos)}. ${esc(it.q.o[orig])}</span></label>`).join('')}
            </div>`).join('')}</div>
        <div class="stp-ex-actions"><button class="stp-btn stp-btn--primary cursor-pointer" id="submitTest" type="button">Hand in</button></div>`;
    const progress = () => { $('progress').textContent = `${test.items.filter(i => i.picked !== null).length} / ${test.items.length} answered`; };
    box.querySelectorAll('input[type=radio]').forEach(inp => inp.addEventListener('change', () => {
        const qi = Number(inp.name.slice(1));
        test.items[qi].picked = Number(inp.value);
        progress();
    }));
    $('leaveTest').addEventListener('click', () => { clearInterval(SHELL.prep.timer); renderPrepare(lab); });
    $('submitTest').addEventListener('click', () => {
        const open = test.items.filter(i => i.picked === null).length;
        if (open && !window.confirm(`You have ${open} unanswered question(s). Hand in anyway?`)) return;
        finishTest(lab, test, false);
    });
    progress();
    const tick = () => {
        if (test.done) return;
        const left = Math.max(0, Math.ceil((test.end - Date.now()) / 1000));
        const t = $('timer');
        if (t) { t.textContent = fmtTime(left); t.classList.toggle('stp-low', left <= 120); }
        if (left <= 0) finishTest(lab, test, true);
    };
    clearInterval(SHELL.prep.timer);
    SHELL.prep.timer = setInterval(tick, 250);
    $('content').scrollTop = 0;
}

function finishTest(lab, test, timeUp) {
    if (test.done) return;
    test.done = true;
    clearInterval(SHELL.prep.timer);
    const total = test.items.length;
    const score = test.items.filter(i => i.picked === i.q.a).length;
    const used = Math.min(TEST_MINUTES * 60, Math.round((TEST_MINUTES * 60 * 1000 - Math.max(0, test.end - Date.now())) / 1000));
    try {
        const old = Number(localStorage.getItem(PREP_STORE + lab.n));
        if (isNaN(old) || localStorage.getItem(PREP_STORE + lab.n) === null || score > old) localStorage.setItem(PREP_STORE + lab.n, String(score));
        localStorage.setItem('ieb-total-lab' + lab.n, String(total));
    } catch { /* storage not available */ }
    const pct = Math.round(score / total * 100);
    $('tab-prepare').innerHTML = `
        <div class="stp-score"><div class="stp-score-big">${score} / ${total}</div>
            <div>${pct}%${timeUp ? ' · time was up' : ' · time used: ' + fmtTime(used)}</div>
            <div class="stp-ex-actions"><button class="stp-btn stp-btn--primary cursor-pointer" id="again" type="button">Try again</button><button class="stp-btn cursor-pointer" id="back" type="button">Back to the knowledge base</button></div></div>
        ${test.items.map((it, qi) => {
            const correctPos = it.order.indexOf(it.q.a);
            const verdict = it.picked === null ? `<span class="stp-event--bad">Not answered.</span> Correct answer: ${letter(correctPos)}. `
                : it.picked === it.q.a ? '<span class="stp-event--ok">Correct.</span> ' : `<span class="stp-event--bad">Wrong.</span> Correct answer: ${letter(correctPos)}. `;
            return `<div class="stp-q"><p class="stp-q-text">${qi + 1}. ${esc(it.q.q)}</p>
                ${it.order.map((orig, pos) => `<div class="stp-opt${orig === it.q.a ? ' stp-opt--correct' : orig === it.picked ? ' stp-opt--wrong' : ''}"><span>${letter(pos)}. ${esc(it.q.o[orig])}</span></div>`).join('')}
                <p class="stp-verdict">${verdict}${esc(it.q.e)}</p></div>`;
        }).join('')}`;
    $('again').addEventListener('click', () => startTest(lab, prepLab(lab.n)));
    $('back').addEventListener('click', () => renderPrepare(lab));
    $('content').scrollTop = 0;
}

/* ---------- Monitor ---------- */

function renderMonitor(lab) {
    const stpLab = lab.n === 3 || lab.n === 4;
    $('netMonitor').hidden = !stpLab;
    $('deviceMapBox').hidden = stpLab;
    const q = new URLSearchParams(location.search);
    if (stpLab) {
        setHeader(`Lab ${lab.n}: ${lab.title}`, 'stp');
        Monitor.enter(lab.n, q.get('demo'));
    } else {
        setHeader(`Lab ${lab.n}: ${lab.title}`, 'map');
        $('mapTitle').textContent = mapSpec(lab.n).title;
        DeviceMap.enter(lab.n);
    }
}

/* ---------- Check ---------- */

const STATUS_ICON = { pass: '✓', fail: '✕', warn: '!', info: 'i', manual: '?' };
const STATUS_LABEL = { pass: 'OK', fail: 'Problem', warn: 'Warning', info: 'Info', manual: 'Do yourself' };

function renderCheck(lab) {
    if (!SHELL.checkEx[lab.n]) SHELL.checkEx[lab.n] = lab.exercises[0].id;
    const sel = SHELL.checkEx[lab.n];
    const ex = lab.exercises.find(e => e.id === sel);
    const hasCheck = !!CHECKS[`${lab.n}.${sel}`];
    $('tab-check').innerHTML = `
        <div class="stp-seg" id="checkTabs">${lab.exercises.map(e => {
            const r = load(`ieb-check-${lab.n}-${e.id}`, null);
            return `<button class="stp-seg-btn cursor-pointer${e.id === sel ? ' stp-active' : ''}" type="button" data-ex="${e.id}">${esc(e.title.replace(/^Exercise (\d+)[a-z]*: /, 'Ex $1: ').replace(/^Extra: /, 'Extra: '))}${r ? `<span class="stp-seg-dot ${r.fail ? 'stp-bad' : r.warn ? 'stp-warn' : 'stp-ok'}"></span>` : ''}</button>`;
        }).join('')}</div>
        <section class="stp-card">
            <div class="stp-check-head">
                <div><h2 class="stp-card-title" style="margin-bottom:4px">${esc(ex.title)}</h2>
                    <p class="stp-muted">${hasCheck ? 'Reads your switches and routers (read-only) and tells you what is right and what is not.' : 'This exercise has no automatic check.'}</p></div>
                <div class="stp-check-actions">
                    <label class="stp-check cursor-pointer"><input class="cursor-pointer" type="checkbox" id="autoRun"> re-run every 5 s</label>
                    <button class="stp-btn stp-btn--primary cursor-pointer" id="runCheck" type="button">Run check</button>
                </div>
            </div>
            <div id="checkOut"></div>
        </section>`;
    $('checkTabs').addEventListener('click', e => {
        const b = e.target.closest('[data-ex]');
        if (b) { SHELL.checkEx[lab.n] = b.dataset.ex; clearInterval(SHELL.auto); SHELL.auto = null; renderCheck(lab); }
    });
    $('runCheck').addEventListener('click', () => doCheck(lab, sel));
    $('autoRun').addEventListener('change', e => {
        clearInterval(SHELL.auto);
        SHELL.auto = null;
        if (e.target.checked) { doCheck(lab, sel); SHELL.auto = setInterval(() => doCheck(lab, sel), 5000); }
    });
    const last = SHELL.results[`${lab.n}.${sel}`];
    if (last) paintResults(lab, sel, last);
    else $('checkOut').innerHTML = '<p class="stp-muted">Press <b>Run check</b> after you finished the exercise.</p>';
}

async function doCheck(lab, exId) {
    if (SHELL.running) return;
    SHELL.running = true;
    const out = $('checkOut'), btn = $('runCheck');
    if (btn) { btn.disabled = true; btn.textContent = 'Checking...'; }
    try {
        const r = await runCheck(lab.n, exId, text => { const el = $('checkProgress'); if (el) el.textContent = text; else if (out && !out.querySelector('.stp-result')) out.innerHTML = `<p class="stp-muted" id="checkProgress">${esc(text)}</p>`; });
        SHELL.results[`${lab.n}.${exId}`] = r;
        save(`ieb-check-${lab.n}-${exId}`, { at: r.at || Date.now(), fail: r.counts.fail || 0, warn: r.counts.warn || 0, pass: r.counts.pass || 0 });
        if (SHELL.lab === lab.n && SHELL.tab === 'check' && SHELL.checkEx[lab.n] === exId) paintResults(lab, exId, r);
    } catch (e) {
        if ($('checkOut')) $('checkOut').innerHTML = `<div class="stp-note stp-note--bad">The check could not run: ${esc(e.message)}. Is the server running?</div>`;
    } finally {
        SHELL.running = false;
        const b = $('runCheck');
        if (b) { b.disabled = false; b.textContent = 'Run check'; }
    }
}

function paintResults(lab, exId, r) {
    const c = r.counts;
    const verdict = c.fail ? { cls: 'bad', text: `${c.fail} problem(s) to fix` } : c.warn ? { cls: 'warn', text: 'No problems, but check the warnings' } : { cls: 'ok', text: 'Everything checked is correct' };
    const order = { fail: 0, warn: 1, pass: 2, info: 3, manual: 4 };
    const sorted = r.results.map((x, i) => [x, i]).sort((a, b) => (order[a[0].status] - order[b[0].status]) || a[1] - b[1]).map(x => x[0]);
    $('checkOut').innerHTML = `
        <div class="stp-verdict-bar stp-verdict-bar--${verdict.cls}">
            <strong>${verdict.text}</strong>
            <span>${c.pass || 0} OK · ${c.fail || 0} problem(s) · ${c.warn || 0} warning(s) · ${c.manual || 0} to do yourself · ${new Date(r.at || Date.now()).toLocaleTimeString('en-GB', { hour12: false })}</span>
        </div>
        <ul class="stp-results">${sorted.map(x => `
            <li class="stp-result stp-result--${x.status}">
                <span class="stp-result-icon">${STATUS_ICON[x.status]}</span>
                <div><div class="stp-result-title">${esc(x.title)}</div>
                ${x.detail ? `<div class="stp-result-detail">${esc(x.detail)}</div>` : ''}
                ${x.fix ? `<div class="stp-result-fix"><b>Fix:</b> ${inlineMd(x.fix)}</div>` : ''}</div>
            </li>`).join('')}</ul>`;
}

/* ---------- Notes ---------- */

async function renderLabNotes(lab) {
    const box = $('tab-notes');
    box.innerHTML = '<p class="stp-muted">Loading...</p>';
    try {
        const res = await fetch(`/notes/Lab${lab.n}.md`, { cache: 'no-store' });
        if (!res.ok) throw new Error('no notes file');
        box.innerHTML = `<p class="stp-muted">Your own notes and answers from <code>Lab${lab.n}.md</code> (kept in the language you wrote them).</p><div class="stp-prose stp-md">${renderMarkdown(await res.text())}</div>`;
    } catch {
        box.innerHTML = `<p class="stp-muted">There is no <code>Lab${lab.n}.md</code> next to the app yet.</p>`;
    }
}

/* ---------- Boot ---------- */

function boot() {
    setTheme(SHELL.theme);
    $('themeBtn').addEventListener('click', () => setTheme(SHELL.theme === 'dark' ? 'light' : 'dark'));
    $('menuBtn').addEventListener('click', () => $('wrapper').classList.toggle('stp-mobile-menu-open'));
    $('overlay').addEventListener('click', () => $('wrapper').classList.remove('stp-mobile-menu-open'));
    $('refreshBtn').addEventListener('click', () => { if (DeviceMap.active) DeviceMap.poll(); });
    document.addEventListener('click', e => {
        const ex = e.target.closest('[data-checkex]');
        if (ex && SHELL.lab) SHELL.checkEx[SHELL.lab] = ex.dataset.checkex;
    });
    Monitor.init();
    window.addEventListener('hashchange', route);
    route();
}

boot();
