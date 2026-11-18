// The words and buttons that never move: chapter title and cartouche, diamonds, subtitles, captions, hints, cards, settings.
import { medal, dotRow, trimTile } from '../art/card.js';
import { spiceIcon } from '../art/spices.js';
import { canJump, indexOf } from './progress.js';
import { labels } from '../data/labels.js';

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

export function createUI({ prefs, calm, auto, chapters, onJump }) {
  const root = document.documentElement;
  root.style.setProperty('--trim', trimTile());
  const subs = $('subs'), cur = $('sub-cur'), prev = $('sub-prev'), cap = $('cap');
  const toggles = { sound: $('set-sound'), voice: $('set-voice'), subtitles: $('set-subtitles'), captions: $('set-caps'), calm: $('set-calm') };
  let cardOpen = false;
  let chapterId = null;

  // ---- settings and the CC button ----
  const syncPrefs = () => {
    for (const [key, box] of Object.entries(toggles)) box.checked = key === 'calm' ? !!calm() : !!prefs.get(key);
    root.dataset.calm = String(!!calm());
    root.dataset.subtitles = String(!!prefs.get('subtitles'));
    $('cc').setAttribute('aria-pressed', String(!!prefs.get('captions')));
    cap.hidden = !prefs.get('captions') || !cap.textContent;
    drawDiamonds();
    drawChapterList();
  };
  for (const [key, box] of Object.entries(toggles)) box.addEventListener('change', () => prefs.set(key, box.checked));
  $('cc').addEventListener('click', () => prefs.set('captions', !prefs.get('captions')));
  $('open-settings').addEventListener('click', () => $('settings').showModal());
  $('start-over').addEventListener('click', () => { prefs.set('reached', null); location.reload(); });

  // ---- chapters: diamonds (reached ones are buttons), the settings list ----
  const jump = (id) => { $('settings').close(); onJump(id); };
  function drawDiamonds() {
    const nav = $('diamonds');
    nav.replaceChildren();
    const reached = prefs.get('reached');
    chapters.filter((c) => c.numeral).forEach((c, i) => {
      const can = canJump(chapters, reached, c.id) && !cardOpen;
      const b = el(can ? 'button' : 'span', 'dia');
      b.dataset.state = c.id === chapterId ? 'current' : can || indexOf(chapters, c.id) <= indexOf(chapters, reached) ? 'reached' : 'todo';
      b.innerHTML = '<i></i>';
      if (can) {
        b.type = 'button';
        b.setAttribute('aria-label', `Go to chapter ${c.numeral}, ${c.title}`);
        if (c.id === chapterId) b.setAttribute('aria-current', 'step');
        b.addEventListener('click', () => onJump(c.id));
      }
      nav.append(b);
    });
  }
  function drawChapterList() {
    const reached = prefs.get('reached');
    $('set-chapters').hidden = reached == null || cardOpen;
    const ol = $('chapter-list');
    ol.replaceChildren();
    for (const c of chapters.filter((x) => x.numeral)) {
      const b = el('button', null, `${c.numeral}. ${c.title}`);
      b.type = 'button';
      b.disabled = !canJump(chapters, reached, c.id);
      b.addEventListener('click', () => jump(c.id));
      const li = el('li'); li.append(b); ol.append(li);
    }
  }
  prefs.subscribe(syncPrefs);

  // ---- chapter title: big and centred, then it settles into the cartouche ----
  async function chapter(index, numeral, title) {
    chapterId = chapters[index]?.id ?? null;
    $('cartouche').hidden = !title;
    $('cart-num').textContent = numeral;
    $('cart-title').textContent = title;
    $('cart-num').hidden = !numeral;
    drawDiamonds();
    ui.subtitle(null);
    if (title && !auto) {
      $('big-num').textContent = numeral;
      $('big-title').textContent = title;
      const big = $('chapter-big');
      big.classList.add('is-on');
      await wait(calm() ? 900 : 2000);
      big.classList.remove('is-on');
    }
    if (title) $('cart-title').focus({ preventScroll: true });
  }

  // ---- subtitles and captions ----
  let fade = 0;
  function subtitle(text) {
    clearTimeout(fade);
    if (!text) { cur.textContent = prev.textContent = ''; subs.classList.remove('is-on'); return; }
    prev.textContent = cur.textContent;
    cur.textContent = text;
    subs.classList.add('is-on');
    fade = setTimeout(() => subs.classList.remove('is-on'), 9000);
  }
  function caption(text) {
    cap.textContent = text ? `[${text.replace(/^\[|\]$/g, '')}]` : '';
    cap.hidden = !prefs.get('captions') || !text;
  }

  // ---- hints: text beside the hotspot, and a glyph for the gesture along its path ----
  const hints = new Map();
  let hraf = 0;
  const glyph = (g, k) => {
    const dot = (cls, r = 6) => `<circle class="${cls}" r="${r}"/>`;
    if (g === 'hold') return `<circle class="g-track" r="24"/><circle class="g-fill" r="24" pathLength="100"/>${dot('g-dot', 5)}`;
    if (g === 'circle') return `<circle class="g-dots" r="34"/><g class="g-orbit"><circle class="g-dot" cx="34" r="5.5"/></g>`;
    if (g && g.drag) {
      let [vx, vy] = [g.drag[0] * k, g.drag[1] * k];
      const m = Math.hypot(vx, vy), cap = 150;
      if (m > cap) { vx *= cap / m; vy *= cap / m; }
      const a = Math.atan2(vy, vx) * 180 / Math.PI;
      return `<path class="g-line" d="M0 0L${vx.toFixed(1)} ${vy.toFixed(1)}"/><path class="g-head" d="M-8 -7L2 0L-8 7" transform="translate(${vx.toFixed(1)} ${vy.toFixed(1)}) rotate(${a.toFixed(1)})"/><g class="g-slide" style="--vx:${vx.toFixed(1)}px;--vy:${vy.toFixed(1)}px">${dot('g-dot', 6)}</g>`;
    }
    return `${dot('g-ping', 8)}${dot('g-dot', 6)}`;
  };
  const zoneTop = () => innerHeight * (innerWidth < 600 ? 0.72 : 0.78); // above the subtitle zone
  function place() {
    const placed = [];
    for (const h of hints.values()) {
      const r = h.target.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      h.glyph.style.transform = `translate(${cx}px, ${cy}px)`;
      const tw = h.text.offsetWidth, th = h.text.offsetHeight;
      // Beside its own hotspot: above if there is room, else below, else the side with more room.
      const lo = 86, hi = zoneTop() - th - 8;
      let left = cx - tw / 2, top = r.top - th - 10;
      if (top < lo) top = r.height > 160 ? r.top + 12 : r.bottom + 10; // a tall target (the window) keeps its hint inside its top
      if (top > hi) {
        top = Math.max(lo, Math.min(cy - th / 2, hi));
        left = innerWidth - r.right > r.left ? r.right + 14 : r.left - 14 - tw;
      }
      left = Math.max(10, Math.min(left, innerWidth - tw - 10));
      top = Math.max(lo, Math.min(top, hi));
      // Overlap: nudge this one below, else above, else beside the hint it hits; repeat, since a nudge can land on another.
      for (let n = 0; n < 8; n++) {
        const o = placed.find((o) => left < o.r && left + tw > o.l && top < o.b && top + th > o.t);
        if (!o) break;
        if (o.b + 6 <= hi) top = o.b + 6;
        else if (o.t - th - 6 >= lo) top = o.t - th - 6;
        else left = o.r + 6 + tw <= innerWidth - 10 ? o.r + 6 : Math.max(10, o.l - tw - 6);
      }
      // Still crowded (a row of small targets on a phone): drop this text; its ring and glyph still show it.
      const clash = placed.some((o) => left < o.r && left + tw > o.l && top < o.b && top + th > o.t);
      h.text.style.visibility = clash ? 'hidden' : '';
      if (!clash) placed.push({ l: left, r: left + tw, t: top, b: top + th });
      h.text.style.transform = `translate(${left}px, ${top}px)`;
    }
    hraf = hints.size ? requestAnimationFrame(place) : 0;
  }
  function hint(target, text, gesture = 'tap') {
    if (hints.has(target)) return;
    const k = target.ownerSVGElement?.getScreenCTM()?.a ?? 1;
    const text_ = el('p', 'hint', text);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'glyph');
    svg.setAttribute('viewBox', '-90 -90 180 180');
    svg.innerHTML = glyph(gesture, k);
    $('hints').append(svg, text_);
    hints.set(target, { target, text: text_, glyph: svg, gesture });
    place();
    requestAnimationFrame(() => { text_.classList.add('is-on'); svg.classList.add('is-on'); });
    if (!hraf) hraf = requestAnimationFrame(place);
  }
  function unhint(target) {
    const h = hints.get(target);
    if (!h) return;
    hints.delete(target);
    h.text.classList.remove('is-on'); h.glyph.classList.remove('is-on');
    setTimeout(() => { h.text.remove(); h.glyph.remove(); }, 350);
  }

  // ---- cards ----
  // choices: strings, or { label, sound: true | false | 'keep' }. Choosing sets the sound pref inside the click, so audio unlocks.
  // list: [{ step, why }] under the text, as an ordered recipe. Its absence leaves the card as it was.
  function card({ kind = 'title', title, text, meta, foot, note, list = [], icons = [], choices = [] }) {
    const c = $('card');
    c.dataset.kind = kind;
    $('card-medal').innerHTML = medal();
    $('card-dots').innerHTML = dotRow();
    $('card-title').textContent = title ?? '';
    for (const [id, v] of [['card-text', text], ['card-meta', meta], ['card-foot', foot], ['card-note', note]]) { $(id).textContent = v ?? ''; $(id).hidden = !v; }
    $('card-recipe').hidden = !list.length;
    $('card-list').replaceChildren(...list.map(({ step, why }) => { const li = el('li'); li.append(el('span', 'step', step), el('span', 'why', why)); return li; }));
    c.toggleAttribute('data-list', list.length > 0);
    const iconBox = $('card-icons'), box = $('card-choices');
    iconBox.replaceChildren(); box.replaceChildren();
    iconBox.hidden = !icons.length;
    for (const id of icons) { const s = el('span', 'chip'); s.innerHTML = spiceIcon(id.id ?? id, id.name ?? id); iconBox.append(s); }
    cardOpen = true;
    root.dataset.card = kind;
    drawDiamonds(); drawChapterList();
    c.hidden = false;
    return new Promise((resolve) => {
      const pick = (i) => {
        const ch = choices[i];
        if (ch && typeof ch === 'object' && ch.sound !== undefined) {
          if (ch.sound === 'keep') prefs.set('sound', prefs.get('sound'));
          else prefs.set('sound', ch.sound);
          if (ch.sound === false) { prefs.set('subtitles', true); prefs.set('captions', true); }
        }
        c.hidden = true;
        cardOpen = false;
        delete root.dataset.card;
        drawDiamonds(); drawChapterList();
        resolve(i);
      };
      choices.forEach((ch, i) => {
        const b = el('button', i === 0 ? 'primary' : '', typeof ch === 'string' ? ch : ch.label);
        b.type = 'button';
        b.addEventListener('click', () => pick(i));
        box.append(b);
      });
      box.firstElementChild?.focus({ preventScroll: true });
      if (auto) setTimeout(() => pick(choices.length - 1), 50);
    });
  }

  const ui = {
    chapter, subtitle, caption, card, hint, unhint,
    headingFocused: () => document.activeElement === $('cart-title') || document.activeElement === document.body,
  };
  syncPrefs();
  return ui;
}
