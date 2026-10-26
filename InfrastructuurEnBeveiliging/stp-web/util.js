/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 26/10/2026
**/

'use strict';

// Small helpers shared by all scripts of the lab app. This file is loaded first.

const SVGNS = 'http://www.w3.org/2000/svg';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const svgEl = (tag, cls) => { const e = document.createElementNS(SVGNS, tag); if (cls) e.setAttribute('class', cls); return e; };
const timeOf = t => new Date(t).toLocaleTimeString('en-GB', { hour12: false });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
}
function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage not available */ }
}

// GET a JSON endpoint of the local server.
async function api(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error('server responded ' + res.status);
    return res.json();
}

// Netmask helpers (dotted decimal <-> prefix length).
function maskToPrefix(mask) {
    return mask.split('.').reduce((n, o) => n + Number(o).toString(2).split('1').length - 1, 0);
}
function prefixToMask(p) {
    return [0, 1, 2, 3].map(i => 256 - Math.pow(2, 8 - clamp(p - i * 8, 0, 8))).join('.');
}
function ipToInt(ip) {
    return ip.split('.').reduce((n, o) => n * 256 + Number(o), 0);
}
function sameSubnet(a, b, prefix) {
    const m = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
    return ((ipToInt(a) & m) >>> 0) === ((ipToInt(b) & m) >>> 0);
}

// Very small Markdown renderer for the lab notes (headings, code blocks, tables, lists, bold, inline code, links).
const inlineMd = s => esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

function renderMarkdown(src) {
    const inline = inlineMd;
    const lines = src.replace(/\r/g, '').split('\n');
    const out = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let m;
        if (/^```/.test(line)) {
            const code = [];
            for (i++; i < lines.length && !/^```/.test(lines[i]); i++) code.push(lines[i]);
            out.push(`<pre class="stp-md-code">${esc(code.join('\n'))}</pre>`);
        } else if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
            out.push(`<h${m[1].length + 1}>${inline(m[2])}</h${m[1].length + 1}>`);
        } else if (/^\|.*\|\s*$/.test(line) && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
            const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => inline(c.trim()));
            const head = cells(line);
            i++;
            const rows = [];
            while (i + 1 < lines.length && /^\|.*\|\s*$/.test(lines[i + 1])) rows.push(cells(lines[++i]));
            out.push(`<div class="stp-table-wrap"><table class="stp-table"><thead><tr>${head.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td style="white-space:normal">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
        } else if (/^[-*]\s+/.test(line)) {
            const items = [];
            while (i < lines.length && /^[-*]\s+/.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(/^[-*]\s+/, ''))}</li>`);
            i--;
            out.push(`<ul>${items.join('')}</ul>`);
        } else if (/^\d+\.\s+/.test(line)) {
            const items = [];
            while (i < lines.length && /^\d+\.\s+/.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(/^\d+\.\s+/, ''))}</li>`);
            i--;
            out.push(`<ol>${items.join('')}</ol>`);
        } else if (/^---+\s*$/.test(line)) {
            out.push('<hr>');
        } else if (/^!\[/.test(line) || !line.trim()) {
            // images (the logo line) and blank lines are skipped
        } else {
            const para = [line];
            while (i + 1 < lines.length && lines[i + 1].trim() && !/^(```|#|\||[-*]\s|\d+\.\s|---)/.test(lines[i + 1])) para.push(lines[++i]);
            out.push(`<p>${inline(para.join(' '))}</p>`);
        }
    }
    return out.join('\n');
}
