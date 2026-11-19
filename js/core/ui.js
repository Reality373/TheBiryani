// The words and buttons that never move: chapter title and cartouche, diamonds, subtitles, captions, hints, cards, settings.
import { medal, dotRow, trimTile } from '../art/card.js';
import { spiceIcon } from '../art/spices.js';
import { canJump, indexOf } from './progress.js';
import { labels } from '../data/labels.js';
import { serves, ingredients as byChapter } from '../data/cookbook.js';

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
// What a tick says aloud: "thick curd, not sour" -> "Thick curd".
export const shortName = (name) => { const s = name.split(',')[0].trim(); return s[0].toUpperCase() + s.slice(1); };
const checkSvg = () => {
  const NS = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(NS, 'svg'), p = document.createElementNS(NS, 'path');
  s.setAttribute('class', 'chk'); s.setAttribute('viewBox', '0 0 16 16'); s.setAttribute('aria-hidden', 'true');
  p.setAttribute('d', 'M2.5 8.5l3.6 3.4L13.5 4.2');
  s.append(p);
  return s;
};

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

  // ---- the goal line: what to do now, shown before the action (set by the hotspot layer) ----
  const goal = (text) => { const g = $('goal'); g.textContent = text || ''; g.hidden = !text; };

  // ---- chapter progress: each finished hotspot is a step; the bar fills to the chapter's step count, and the chapter's end fills it ----
  let stepsDone = 0, stepsTotal = 0;
  function showProgress(full) {
    const f = full ? 1 : stepsTotal ? Math.min(0.97, stepsDone / stepsTotal) : 0; // 97%: only the chapter's end shows 100%
    root.style.setProperty('--prog', String(f)); // the cartouche bar and the subtitle card's bar both read it
    $('prog').setAttribute('aria-valuenow', String(Math.round(f * 100)));
    const step = $('sub-step');
    step.textContent = !stepsTotal ? '' : full ? 'Done' : `Step ${Math.min(stepsTotal, stepsDone + 1)} of ${stepsTotal}`;
    $('sub-bar').hidden = step.hidden = !stepsTotal;
  }
  const stepDone = () => { stepsDone++; showProgress(); };

  // ---- chapter title: big and centred, then it settles into the cartouche ----
  async function chapter(index, numeral, title) {
    chapterId = chapters[index]?.id ?? null;
    goal('');
    stepsDone = 0; stepsTotal = chapters[index]?.steps ?? 0;
    showProgress();
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

  // The line floats near the action but never on it: the first of above / right / left / below the live hotspots that clears
  // every hotspot, the ingredient card and the buttons; else high and central. It also fades while the pointer is near it.
  const hit = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
  const grow = (r, g) => ({ l: r.left - g, r: r.right + g, t: r.top - g, b: r.bottom + g });
  function floatSubs() {
    const vw = innerWidth, vh = innerHeight, M = 12, TOP = 64;
    const hs = [...document.querySelectorAll('.hotspot')].map((n) => n.getBoundingClientRect())
      .filter((r) => r.width > 4 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw);
    const avoid = [...hs, ...['tl', 'corner-buttons', 'skip'].map((id) => $(id)?.getBoundingClientRect()).filter((r) => r && r.width > 0)]
      .map((r) => grow(r, 10));
    const w = Math.min(subs.offsetWidth || 320, vw - 2 * M), h = subs.offsetHeight || 60;
    const cands = [];
    if (hs.length) {
      const l = Math.min(...hs.map((r) => r.left)), r = Math.max(...hs.map((r) => r.right));
      const t = Math.min(...hs.map((r) => r.top)), b = Math.max(...hs.map((r) => r.bottom));
      const cx = (l + r) / 2, cy = (t + b) / 2;
      cands.push([cx, t - 14 - h / 2], [r + 14 + w / 2, cy], [l - 14 - w / 2, cy], [cx, b + 14 + h / 2]);
    }
    cands.push([vw / 2, TOP + 8 + h / 2]);
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    let best = null;
    for (const [cx, cy] of cands) {
      const x = clamp(cx, M + w / 2, vw - M - w / 2), y = clamp(cy, TOP + h / 2, vh - 24 - h / 2);
      best ??= [x, y];
      if (!avoid.some((a) => hit(a, { l: x - w / 2, r: x + w / 2, t: y - h / 2, b: y + h / 2 }))) { best = [x, y]; break; }
    }
    // Stay put while the current spot is still clear (no flipping sides as things move); move only when something is in the way.
    const clear = (x, y) => x - w / 2 >= M && x + w / 2 <= vw - M && y - h / 2 >= TOP && y + h / 2 <= vh - 24
      && !avoid.some((a) => hit(a, { l: x - w / 2, r: x + w / 2, t: y - h / 2, b: y + h / 2 }));
    if (subPos && clear(subPos[0], subPos[1])) return;
    subPos = [Math.round(best[0]), Math.round(best[1])];
    subs.style.setProperty('--sx', `${subPos[0]}px`);
    subs.style.setProperty('--sy', `${subPos[1]}px`);
  }
  let subPos = null;
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || !subs.classList.contains('is-on')) return;
    const r = subs.getBoundingClientRect();
    subs.classList.toggle('is-dodging', e.clientX > r.left - 40 && e.clientX < r.right + 40 && e.clientY > r.top - 40 && e.clientY < r.bottom + 40);
  }, { passive: true });

  // ---- subtitles and captions ----
  let fade = 0, replace = 0;
  function subtitle(text) {
    clearTimeout(fade);
    if (!text) { clearInterval(replace); cur.textContent = prev.textContent = ''; subs.classList.remove('is-on'); return; }
    prev.textContent = cur.textContent;
    cur.textContent = text;
    floatSubs();
    subs.classList.add('is-on');
    clearInterval(replace); replace = setInterval(floatSubs, 450); // slides and camera moves change what is under the card
    fade = setTimeout(() => { subs.classList.remove('is-on'); clearInterval(replace); }, Math.min(9000, Math.max(3500, 2500 + 55 * text.length))); // short lines leave sooner
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
      // Same words already shown (four chicken pieces, one hint), or no clear spot: drop this text; the ring stays.
      const clash = placed.some((o) => o.say === h.text.textContent || (left < o.r && left + tw > o.l && top < o.b && top + th > o.t));
      h.text.style.visibility = clash ? 'hidden' : '';
      if (!clash) placed.push({ l: left, r: left + tw, t: top, b: top + th, say: h.text.textContent });
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

  // ---- the ingredient card: what this step needs, ticked off as it is added ----
  // Desktop: the panel is always open under the cartouche. Phones: a pill ("Ingredients · 3/14") opens it over the scene.
  const ingr = $('ingr'), ingrList = $('ingr-list'), pill = $('ingr-pill'), ingrLive = $('ingr-live');
  let ingrItems = [], ticked = new Set(), shownFor = null;
  const setCount = () => { $('ingr-count').textContent = `Ingredients · ${ticked.size}/${ingrItems.length}`; };
  pill.addEventListener('click', () => {
    const open = !ingr.classList.contains('is-open');
    ingr.classList.toggle('is-open', open);
    pill.setAttribute('aria-expanded', String(open));
  });
  // The chapter's list, or hidden when it has none (or id is null). Ticks last only while the same chapter is shown.
  // only: optional list of ingredient ids, for a chapter that uses part of a group (the spices measure only the powders).
  function showIngredients(id, only) {
    const items = (id ? byChapter[id] ?? [] : []).filter((it) => !only || only.includes(it.id));
    if (id !== shownFor) ticked = new Set();
    shownFor = items.length ? id : null;
    ingrItems = items;
    ingr.hidden = !items.length;
    ingr.classList.remove('is-open');
    pill.setAttribute('aria-expanded', 'false');
    ingrList.replaceChildren(...items.map(({ id: iid, name, amount }) => {
      const li = el('li');
      li.dataset.id = iid;
      li.append(checkSvg(), el('b', null, amount), ' ', el('span', 'nm', name));
      if (ticked.has(iid)) li.classList.add('is-added');
      return li;
    }));
    setCount();
  }
  // Unknown ids and repeats are ignored. The live region says the short name, only for a tick.
  function tick(id) {
    const i = ingrItems.findIndex((x) => x.id === id);
    if (i < 0 || ticked.has(id)) return;
    ticked.add(id);
    const li = ingrList.children[i];
    li.classList.add('is-added');
    if (!calm()) li.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
    setCount();
    ingrLive.textContent = `${shortName(ingrItems[i].name)} added`;
  }

  // ---- cards ----
  // choices: strings, or { label, sound: true | false | 'keep' }. Choosing sets the sound pref inside the click, so audio unlocks.
  // list: [{ step, why }] under the text, as an ordered recipe. Its absence leaves the card as it was. A list also gets
  //   the "Print the recipe" button, which is not a choice, so auto mode still picks the last one.
  // ingredients: [{ heading, items: [{ name, amount }] }], shown above the list as "You will need (serves ...)".
  // While a card is open the ingredient card is hidden (html[data-card] in app.css).
  const printBtn = el('button', null, 'Print the recipe');
  printBtn.type = 'button';
  printBtn.addEventListener('click', () => window.print());
  function card({ kind = 'title', title, text, meta, foot, note, list = [], ingredients = [], icons = [], choices = [] }) {
    const c = $('card');
    c.dataset.kind = kind;
    $('card-medal').innerHTML = medal();
    $('card-dots').innerHTML = dotRow();
    $('card-title').textContent = title ?? '';
    for (const [id, v] of [['card-text', text], ['card-meta', meta], ['card-foot', foot], ['card-note', note]]) { $(id).textContent = v ?? ''; $(id).hidden = !v; }
    $('card-need').hidden = !ingredients.length;
    $('card-need-h').textContent = `You will need (serves ${serves})`;
    $('card-groups').replaceChildren(...ingredients.map(({ heading, items }) => {
      const sec = el('section'), ul = el('ul');
      ul.append(...items.map(({ name, amount }) => { const li = el('li'); li.append(el('b', null, amount), ' ', el('span', null, name)); return li; }));
      sec.append(el('h3', null, heading), ul);
      return sec;
    }));
    $('card-recipe').hidden = !list.length;
    $('card-list').replaceChildren(...list.map(({ step, why }) => { const li = el('li'); li.append(el('span', 'step', step)); if (why) li.append(el('span', 'why', why)); return li; }));
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
      if (list.length) box.append(printBtn);
      box.firstElementChild?.focus({ preventScroll: true });
      if (auto) setTimeout(() => pick(choices.length - 1), 50);
    });
  }

  const ui = {
    chapter, goal, stepDone, chapterDone: () => showProgress(true), subtitle, caption, card, hint, unhint, ingredients: showIngredients, tick,
    headingFocused: () => document.activeElement === $('cart-title') || document.activeElement === document.body,
  };
  syncPrefs();
  // Dev switch: ?ingr=<chapterId> shows that chapter's ingredient card for screenshots.
  const devIngr = new URLSearchParams(location.search).get('ingr');
  if (devIngr) showIngredients(devIngr);
  return ui;
}
