// Artin page builder v17. Rewritten when the builder is updated; your other files are never touched.
'use client';

import { useEffect, useRef } from 'react';

/**
 * What a builder page does in the browser: entrance animations, sliders,
 * tabs, counters, the countdown, progress bars, the gallery lightbox,
 * closing alerts and sending forms.
 *
 * One listener on the page handles every widget, so widgets added later
 * (in the editor) work too. Without JavaScript every widget still shows its
 * content: elements are only hidden once this has started.
 *
 * In the editor (`editing`), animations and counting are skipped so every
 * widget shows as it ends up, and forms do not send.
 *
 * Part of the project's copy of the builder renderer.
 */
export function PageRuntime({ editing = false }: { editing?: boolean }) {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = marker.current?.closest<HTMLElement>('.artin-page');
    if (!root) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanups: Array<() => void> = [];
    const started = new WeakSet<Element>();

    // ─── Custom code that runs in the page: each script once, in order ──
    if (!editing) {
      const ran = new WeakSet<Element>();
      const run = (old: HTMLScriptElement) => {
        if (ran.has(old) || old.dataset.abDone) return;
        ran.add(old);
        old.dataset.abDone = '1';
        const s = document.createElement('script');
        for (const a of Array.from(old.attributes)) if (!['type', 'data-ab-run', 'data-ab-type', 'data-ab-done'].includes(a.name)) s.setAttribute(a.name, a.value);
        if (old.dataset.abType) s.type = old.dataset.abType;
        // Scripts with a src load in the order written, as they would in the page.
        if (s.src) s.async = false;
        s.text = old.text;
        old.parentNode?.insertBefore(s, old.nextSibling);
      };
      root.querySelectorAll<HTMLScriptElement>('script[data-ab-run]').forEach(run);
    }

    // ─── Things that happen when they scroll into view ───────────────────
    const count = (el: HTMLElement) => {
      const end = Number(el.dataset.abCount ?? 0);
      const from = Number(el.dataset.abFrom ?? 0);
      const dur = Number(el.dataset.abDur ?? 2000);
      const fmt = el.dataset.abSep === '1' ? (n: number) => Math.round(n).toLocaleString('en-IN') : (n: number) => String(Math.round(n));
      if (reduced || editing) { el.textContent = fmt(end); return; }
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = fmt(from + (end - from) * (1 - (1 - p) ** 3));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const seen = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        // An entrance that repeats plays again each time it comes back: it goes out of view hidden.
        const repeats = el.classList.contains('ab-repeat');
        if (!entry.isIntersecting) {
          if (repeats && entry.boundingClientRect.top > 0) el.classList.remove('ab-in');
          continue;
        }
        if (!repeats) seen?.unobserve(el);
        if (el.dataset.abCount !== undefined) count(el);
        else el.classList.add('ab-in');
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }) : null;
    if (seen) cleanups.push(() => seen.disconnect());

    // ─── Widgets that run by themselves ──────────────────────────────────
    function startSlider(slider: HTMLElement) {
      const track = slider.querySelector<HTMLElement>('[data-ab-track]');
      if (!track) return;
      const dots = [...slider.querySelectorAll<HTMLElement>('[data-ab-dot]')];
      const current = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      const total = () => track.children.length;
      const onScroll = () => dots.forEach((d, i) => d.setAttribute('aria-current', i === current() ? 'true' : 'false'));
      track.addEventListener('scroll', onScroll, { passive: true });
      cleanups.push(() => track.removeEventListener('scroll', onScroll));
      const every = Number(slider.dataset.abSlider);
      if (!every || reduced || editing || total() < 2) return;
      let paused = false;
      const pause = () => { paused = true; };
      const resume = () => { paused = false; };
      for (const [ev, fn] of [['mouseenter', pause], ['mouseleave', resume], ['focusin', pause], ['focusout', resume]] as const) slider.addEventListener(ev, fn);
      const timer = window.setInterval(() => { if (!paused && !document.hidden) go(slider, current() + 1); }, every);
      cleanups.push(() => window.clearInterval(timer));
    }

    function startCountdown(el: HTMLElement) {
      const at = new Date(el.dataset.abCountdown ?? '').getTime();
      if (Number.isNaN(at)) return;
      const units = Object.fromEntries([...el.querySelectorAll<HTMLElement>('[data-ab-unit]')].map((u) => [u.dataset.abUnit!, u]));
      const tick = () => {
        const left = Math.max(0, at - Date.now());
        if (left === 0 && !editing) {
          const done = el.dataset.abDone;
          if (done) { el.replaceChildren(Object.assign(document.createElement('p'), { className: 'ab-countdown-done', textContent: done })); }
          window.clearInterval(timer);
          return;
        }
        const parts = { days: Math.floor(left / 864e5), hours: Math.floor(left / 36e5) % 24, minutes: Math.floor(left / 6e4) % 60, seconds: Math.floor(left / 1e3) % 60 };
        for (const [unit, value] of Object.entries(parts)) if (units[unit]) units[unit]!.textContent = String(value).padStart(unit === 'days' ? 1 : 2, '0');
      };
      const timer = window.setInterval(tick, 1000);
      tick();
      cleanups.push(() => window.clearInterval(timer));
    }

    /** An animated heading: one word at a time, typed letter by letter or swapped with the heading's effect. */
    function startWords(el: HTMLElement) {
      const words = [...el.querySelectorAll<HTMLElement>('.ab-ah-word')];
      const every = Number(el.dataset.abRotate);
      if (words.length < 2 || !every || reduced || editing) return;
      let at = 0;
      if (el.dataset.abEffect === 'type') {
        const typed = Object.assign(document.createElement('span'), { className: 'ab-ah-typed', textContent: words[0]!.textContent ?? '' });
        el.classList.add('ab-ah-typing');
        el.append(typed);
        cleanups.push(() => { typed.remove(); el.classList.remove('ab-ah-typing'); });
        let timer = 0;
        const write = (word: string, i: number, deleting: boolean) => {
          typed.textContent = word.slice(0, i);
          if (!deleting && i < word.length) { timer = window.setTimeout(() => write(word, i + 1, false), 70); return; }
          if (!deleting) { timer = window.setTimeout(() => write(word, i, true), every); return; }
          if (i > 0) { timer = window.setTimeout(() => write(word, i - 1, true), 35); return; }
          at = (at + 1) % words.length;
          timer = window.setTimeout(() => write(words[at]!.textContent ?? '', 0, false), 250);
        };
        timer = window.setTimeout(() => write(words[0]!.textContent ?? '', words[0]!.textContent?.length ?? 0, true), every);
        cleanups.push(() => window.clearTimeout(timer));
        return;
      }
      const timer = window.setInterval(() => {
        if (document.hidden) return;
        words[at]!.removeAttribute('data-ab-on');
        at = (at + 1) % words.length;
        words[at]!.setAttribute('data-ab-on', '');
      }, every);
      cleanups.push(() => window.clearInterval(timer));
    }

    // ─── The page's scroll: headers that change once it moves, and parallax backgrounds ──
    const scrollers = () => root!.querySelectorAll<HTMLElement>('[data-ab-scroll]');
    const layers = () => root!.querySelectorAll<HTMLElement>('.ab-parallax');
    let ticking = false;
    const onPageScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const down = window.scrollY > 12;
        for (const el of scrollers()) el.classList.toggle('ab-scrolled', down);
        if (reduced || editing) return;
        for (const el of layers()) {
          const box = el.getBoundingClientRect();
          if (box.bottom < 0 || box.top > window.innerHeight) continue;
          const factor = Number(getComputedStyle(el).getPropertyValue('--ab-par')) || 0.3;
          el.style.setProperty('--ab-py', `${Math.round((box.top + box.height / 2 - window.innerHeight / 2) * -factor * 0.5)}px`);
        }
      });
    };
    window.addEventListener('scroll', onPageScroll, { passive: true });
    cleanups.push(() => window.removeEventListener('scroll', onPageScroll));
    onPageScroll();

    function scan() {
      if (!editing) {
        for (const el of root!.querySelectorAll('.ab-anim:not(.ab-in), [data-ab-grow]:not(.ab-in), [data-ab-count]')) {
          if (started.has(el)) continue;
          started.add(el);
          if (!seen || reduced) { if ((el as HTMLElement).dataset.abCount !== undefined) count(el as HTMLElement); else el.classList.add('ab-in'); }
          else seen.observe(el);
        }
      }
      for (const el of root!.querySelectorAll<HTMLElement>('[data-ab-slider]')) { if (!started.has(el)) { started.add(el); startSlider(el); } }
      for (const el of root!.querySelectorAll<HTMLElement>('[data-ab-countdown]')) { if (!started.has(el)) { started.add(el); startCountdown(el); } }
      for (const el of root!.querySelectorAll<HTMLElement>('[data-ab-rotate]')) { if (!started.has(el)) { started.add(el); startWords(el); } }
      for (const el of root!.querySelectorAll<HTMLInputElement>('[data-ab-started]')) { if (!started.has(el)) { started.add(el); el.value = String(Date.now()); } }
    }
    // Menus fold into a button only once this runs; without it every link stays in view.
    root.classList.add('ab-ready');
    cleanups.push(() => root.classList.remove('ab-ready'));
    const here = window.location.pathname.replace(/\/$/, '') || '/';
    for (const a of root.querySelectorAll<HTMLAnchorElement>('[data-ab-menu] a[href]')) {
      if ((new URL(a.href, window.location.href).pathname.replace(/\/$/, '') || '/') === here) a.setAttribute('aria-current', 'page');
    }
    // Only hide what waits for the screen once this script runs, so nothing stays hidden without it.
    if (!editing && !reduced && seen) root.classList.add('ab-js');
    scan();
    const changes = new MutationObserver(() => scan());
    changes.observe(root, { childList: true, subtree: true });
    cleanups.push(() => changes.disconnect());

    // ─── Clicks, keys and forms, for every widget at once ────────────────
    function go(slider: HTMLElement, index: number) {
      const track = slider.querySelector<HTMLElement>('[data-ab-track]');
      if (!track) return;
      const n = track.children.length;
      const target = ((index % n) + n) % n;
      track.scrollTo({ left: target * track.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
    }

    function selectTab(tab: HTMLElement, focus = false) {
      const tabs = tab.closest('[data-ab-tabs]');
      if (!tabs) return;
      for (const t of tabs.querySelectorAll<HTMLElement>('[data-ab-tab]')) {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = tabs.querySelector<HTMLElement>(`[data-ab-panel="${t.dataset.abTab}"]`);
        if (panel) panel.hidden = !on;
      }
      if (focus) tab.focus();
    }

    let lightbox: { close: () => void } | null = null;
    function openLightbox(link: HTMLAnchorElement) {
      const gallery = link.closest('[data-ab-gallery]');
      const links = gallery ? [...gallery.querySelectorAll<HTMLAnchorElement>('a[data-ab-lightbox]')] : [link];
      let index = links.indexOf(link);
      const back = document.activeElement as HTMLElement | null;
      const box = document.createElement('div');
      box.className = 'ab-lightbox';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', 'Image');
      const figure = document.createElement('figure');
      figure.style.margin = '0';
      const img = document.createElement('img');
      const caption = document.createElement('p');
      figure.append(img, caption);
      const button = (cls: string, label: string, glyph: string) => {
        const b = Object.assign(document.createElement('button'), { type: 'button', className: cls, textContent: glyph });
        b.setAttribute('aria-label', label);
        return b;
      };
      const close = button('ab-lb-close', 'Close', '×');
      const prev = button('ab-lb-prev', 'Previous image', '‹');
      const next = button('ab-lb-next', 'Next image', '›');
      const show = (i: number) => {
        index = (i + links.length) % links.length;
        img.src = links[index]!.href;
        img.alt = links[index]!.querySelector('img')?.alt ?? '';
        caption.textContent = links[index]!.dataset.abLightbox ?? '';
        caption.hidden = !caption.textContent;
      };
      box.append(figure, close, ...(links.length > 1 ? [prev, next] : []));
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') shut();
        if (e.key === 'ArrowLeft') show(index - 1);
        if (e.key === 'ArrowRight') show(index + 1);
      };
      const shut = () => { box.remove(); document.removeEventListener('keydown', onKey); lightbox = null; back?.focus(); };
      box.addEventListener('click', (e) => {
        if (e.target === box || e.target === close) shut();
        else if (e.target === prev) show(index - 1);
        else if (e.target === next) show(index + 1);
      });
      document.addEventListener('keydown', onKey);
      document.body.append(box);
      show(index);
      close.focus();
      lightbox = { close: shut };
    }
    cleanups.push(() => lightbox?.close());

    const closeMenus = (except?: Element | null) => {
      for (const m of root.querySelectorAll('[data-ab-menu].ab-open')) {
        if (m === except) continue;
        m.classList.remove('ab-open');
        m.querySelector('[data-ab-menu-toggle]')?.setAttribute('aria-expanded', 'false');
      }
    };
    const onDocClick = (e: MouseEvent) => { if (!(e.target as Element).closest?.('[data-ab-menu]')) closeMenus(); };
    const onEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenus(); };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEscape);
    cleanups.push(() => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onEscape); });

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const toggle = target.closest<HTMLElement>('[data-ab-menu-toggle]');
      if (toggle) {
        const menu = toggle.closest('[data-ab-menu]')!;
        const open = !menu.classList.contains('ab-open');
        closeMenus(menu);
        menu.classList.toggle('ab-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        return;
      }
      const tab = target.closest<HTMLElement>('[data-ab-tab]');
      if (tab) { selectTab(tab); return; }
      const slider = target.closest<HTMLElement>('[data-ab-slider]');
      if (slider) {
        const track = slider.querySelector<HTMLElement>('[data-ab-track]');
        const at = track ? Math.round(track.scrollLeft / Math.max(1, track.clientWidth)) : 0;
        if (target.closest('[data-ab-prev]')) { go(slider, at - 1); return; }
        if (target.closest('[data-ab-next]')) { go(slider, at + 1); return; }
        const dot = target.closest<HTMLElement>('[data-ab-dot]');
        if (dot) { go(slider, Number(dot.dataset.abDot)); return; }
      }
      if (editing) return;
      const zoom = target.closest<HTMLAnchorElement>('a[data-ab-lightbox]');
      if (zoom) { e.preventDefault(); openLightbox(zoom); return; }
      const dismiss = target.closest('[data-ab-dismiss]');
      if (dismiss) dismiss.closest('[data-ab-alert]')?.closest('.ab-widget')?.remove();
    };

    const onKey = (e: KeyboardEvent) => {
      const tab = (e.target as HTMLElement).closest<HTMLElement>('[data-ab-tab]');
      if (!tab) return;
      const all = [...(tab.closest('[data-ab-tabs]')?.querySelectorAll<HTMLElement>('[data-ab-tab]') ?? [])];
      const i = all.indexOf(tab);
      const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (step) { e.preventDefault(); selectTab(all[(i + step + all.length) % all.length]!, true); }
      if (e.key === 'Home') { e.preventDefault(); selectTab(all[0]!, true); }
      if (e.key === 'End') { e.preventDefault(); selectTab(all.at(-1)!, true); }
    };

    const onSubmit = async (e: SubmitEvent) => {
      const form = (e.target as HTMLElement).closest<HTMLFormElement>('form[data-ab-form]');
      if (!form) return;
      e.preventDefault();
      if (editing) return;
      const button = form.querySelector<HTMLButtonElement>('button[type=submit]');
      const message = form.querySelector<HTMLElement>('[data-ab-message]');
      for (const el of form.querySelectorAll<HTMLElement>('[data-ab-error]')) el.textContent = '';
      for (const el of form.querySelectorAll('[aria-invalid]')) el.removeAttribute('aria-invalid');
      if (message) message.hidden = true;
      if (button) { button.disabled = true; button.dataset.label = button.textContent ?? ''; button.textContent = 'Sending…'; }
      try {
        const res = await fetch(form.action, {
          method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        const body = (await res.json().catch(() => ({}))) as { message?: string; errors?: Record<string, string> };
        if (res.ok) {
          const done = Object.assign(document.createElement('p'), { className: 'ab-form-sent', textContent: form.dataset.abForm ?? 'Thank you!' });
          done.setAttribute('role', 'status');
          form.replaceWith(done);
          return;
        }
        for (const [field, error] of Object.entries(body.errors ?? {})) {
          const slot = form.querySelector<HTMLElement>(`[data-ab-error="${CSS.escape(field)}"]`);
          if (slot) slot.textContent = error;
          form.querySelector(`[name="${CSS.escape(field)}"]`)?.setAttribute('aria-invalid', 'true');
        }
        if (message) { message.textContent = body.message ?? 'Something went wrong. Please try again.'; message.hidden = false; }
      } catch {
        if (message) { message.textContent = 'Could not send the form. Check your connection and try again.'; message.hidden = false; }
      } finally {
        if (button && form.isConnected) { button.disabled = false; button.textContent = button.dataset.label ?? 'Send'; }
      }
    };

    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);
    root.addEventListener('submit', onSubmit);
    // Before and after: the divider follows the slider laid over the pictures (a real range input, so keys and touch work).
    const onCompare = (e: Event) => {
      const range = (e.target as HTMLElement).closest<HTMLInputElement>('[data-ab-compare-range]');
      range?.closest<HTMLElement>('[data-ab-compare]')?.style.setProperty('--ab-pos', `${range.value}%`);
    };
    root.addEventListener('input', onCompare);
    cleanups.push(() => root.removeEventListener('input', onCompare));
    cleanups.push(() => { root.removeEventListener('click', onClick); root.removeEventListener('keydown', onKey); root.removeEventListener('submit', onSubmit); });
    return () => { for (const fn of cleanups) fn(); };
  }, [editing]);
  return <span ref={marker} hidden />;
}
