(function () {
  "use strict";

  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const easeInOutQuart = (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);

  function splitChars(el) {
    let i = 0;
    const walk = (node) => {
      const frag = document.createDocumentFragment();
      node.childNodes.forEach((child) => {
        if (child.nodeType === 3) {
          for (const ch of child.textContent) {
            if (ch === " ") {
              frag.appendChild(document.createTextNode(" "));
              continue;
            }
            const s = document.createElement("span");
            s.className = "char";
            s.style.setProperty("--i", i++);
            s.textContent = ch;
            frag.appendChild(s);
          }
        } else if (child.nodeType === 1) {
          const clone = child.cloneNode(false);
          clone.appendChild(walk(child));
          frag.appendChild(clone);
        }
      });
      return frag;
    };
    const out = walk(el);
    el.textContent = "";
    el.appendChild(out);
    return i;
  }

  function splitWords(el) {
    const walk = (node) => {
      const frag = document.createDocumentFragment();
      node.childNodes.forEach((child) => {
        if (child.nodeType === 3) {
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
              return;
            }
            const mask = document.createElement("span");
            mask.className = "w";
            const inner = document.createElement("span");
            inner.className = "w__in";
            inner.textContent = part;
            mask.appendChild(inner);
            frag.appendChild(mask);
          });
        } else if (child.nodeType === 1 && child.tagName === "BR") {
          frag.appendChild(child.cloneNode());
        } else if (child.nodeType === 1) {
          const clone = child.cloneNode(false);
          clone.appendChild(walk(child));
          frag.appendChild(clone);
        }
      });
      return frag;
    };
    const original = document.createDocumentFragment();
    while (el.firstChild) original.appendChild(el.firstChild);
    el._original = original;
    el.appendChild(walk(original));
    el.classList.add("is-split");
    return indexLines(el);
  }

  function unsplit(el) {
    if (!el._original) return;
    el.textContent = "";
    el.appendChild(el._original);
    el._original = null;
  }

  function revealText(el) {
    const { lines, count } = splitWords(el);
    void el.offsetWidth;
    requestAnimationFrame(() => el.classList.add("in-view"));
    const total = 1200 + lines * 95 + count * 6 + 200;
    setTimeout(() => unsplit(el), total);
  }

  function indexLines(el) {
    let line = -1;
    let lastTop = null;
    let w = 0;
    el.querySelectorAll(".w").forEach((word) => {
      const top = Math.round(word.offsetTop);
      if (lastTop === null || Math.abs(top - lastTop) > 4) {
        line++;
        lastTop = top;
      }
      word.style.setProperty("--line", line);
      word.style.setProperty("--word", w++);
    });
    return { lines: line + 1, count: w };
  }

  const sound = {
    ctx: null,
    master: null,
    noise: null,
    muted: (() => { try { return localStorage.getItem("sound") === "off"; } catch (e) { return false; } })(),
    setMuted(v) {
      this.muted = v;
      try { localStorage.setItem("sound", v ? "off" : "on"); } catch (e) {}
      document.dispatchEvent(new CustomEvent("soundchange"));
    },
    start() {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!this.ctx) {
        this.ctx = new Ctx();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.55;
        this.master.connect(this.ctx.destination);
        const len = Math.floor(this.ctx.sampleRate * 0.08);
        this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = this.noise.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    ready() {
      return this.ctx && !this.muted && this.ctx.state === "running";
    },
    env(gain, t, peak, decay) {
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peak, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    },
    key(strength = 1) {
      if (!this.ready()) return;
      const c = this.ctx;
      const t = c.currentTime;
      const src = c.createBufferSource();
      src.buffer = this.noise;
      src.playbackRate.value = 0.9 + Math.random() * 0.25;
      const bp = c.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2200 + Math.random() * 1800;
      bp.Q.value = 1.2;
      const g = c.createGain();
      this.env(g, t, 0.32 * strength, 0.04);
      src.connect(bp).connect(g).connect(this.master);
      src.start(t);
      src.stop(t + 0.08);
      const o = c.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(170 + Math.random() * 50, t);
      o.frequency.exponentialRampToValueAtTime(55, t + 0.06);
      const g2 = c.createGain();
      this.env(g2, t, 0.16 * strength, 0.07);
      o.connect(g2).connect(this.master);
      o.start(t);
      o.stop(t + 0.1);
    },
    enter() {
      this.key(1.7);
      setTimeout(() => this.key(0.6), 45);
    },
    blip() {
      if (!this.ready()) return;
      const c = this.ctx;
      const t = c.currentTime;
      const o = c.createOscillator();
      o.type = "square";
      o.frequency.value = 1400 + Math.random() * 500;
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 3000;
      const g = c.createGain();
      this.env(g, t, 0.025, 0.03);
      o.connect(lp).connect(g).connect(this.master);
      o.start(t);
      o.stop(t + 0.05);
    },
    chime() {
      if (!this.ready()) return;
      const c = this.ctx;
      const t0 = c.currentTime;
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(900, t0);
      lp.frequency.exponentialRampToValueAtTime(4200, t0 + 0.8);
      lp.connect(this.master);
      [261.63, 392.0, 523.25, 659.25, 987.77].forEach((f, i) => {
        const t = t0 + i * 0.07;
        [-4, 4].forEach((detune) => {
          const o = c.createOscillator();
          o.type = i === 0 ? "sine" : "triangle";
          o.frequency.value = f;
          o.detune.value = detune;
          const g = c.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(i === 0 ? 0.09 : 0.045, t + 0.04);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
          o.connect(g).connect(lp);
          o.start(t);
          o.stop(t + 2.3);
        });
      });
    },
    whoosh() {
      if (!this.ready()) return;
      const c = this.ctx;
      const t = c.currentTime;
      const src = c.createBufferSource();
      const len = Math.floor(c.sampleRate * 1.2);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      src.buffer = buf;
      const bp = c.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 0.8;
      bp.frequency.setValueAtTime(300, t);
      bp.frequency.exponentialRampToValueAtTime(3200, t + 0.9);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      src.connect(bp).connect(g).connect(this.master);
      src.start(t);
      src.stop(t + 1.2);
    },
  };

  function runIntro(done) {
    const intro = document.getElementById("intro");
    let seen = false;
    try { seen = !!sessionStorage.getItem("intro_seen"); } catch (e) {}

    if (!intro || reduced || seen) {
      if (intro) intro.remove();
      root.classList.add("is-loaded");
      done();
      return;
    }

    root.classList.add("intro-on");
    const $ = (id) => document.getElementById(id);
    const gate = $("introGate");
    const log = $("introLog");
    const name = $("introName");
    const nameText = $("introNameText");
    const welcome = $("introWelcome");
    const sub = $("introSub");
    const line = $("introLine");
    const muteBtn = $("introMute");
    let finished = false;
    let started = false;

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const humanDelay = (ch) => (ch === " " ? 110 + Math.random() * 90 : 45 + Math.random() * 85);

    const finish = () => {
      if (finished) return;
      finished = true;
      window.removeEventListener("keydown", onKey);
      sound.whoosh();
      intro.classList.add("is-out");
      root.classList.remove("intro-on");
      root.classList.add("is-loaded");
      try { sessionStorage.setItem("intro_seen", "1"); } catch (e) {}
      done();
      setTimeout(() => intro.remove(), 1300);
    };

    async function type(el, text, opts = {}) {
      for (const ch of text) {
        if (finished) return;
        el.append(ch);
        if (ch !== " ") sound.key(opts.strength || 1);
        await wait(opts.fast ? 22 + Math.random() * 25 : humanDelay(ch));
      }
    }

    function logLine(html) {
      const p = document.createElement("p");
      p.innerHTML = html;
      log.appendChild(p);
      return p;
    }

    async function command(cmd) {
      const p = logLine('<span class="p">guest@inconnuboy</span> <span class="hi">~ %</span> ');
      const cmdSpan = document.createElement("span");
      cmdSpan.className = "hi";
      p.appendChild(cmdSpan);
      await type(cmdSpan, cmd);
      await wait(220);
      sound.enter();
      await wait(160);
    }

    async function output(lines) {
      for (const l of lines) {
        if (finished) return;
        logLine(l);
        sound.blip();
        await wait(90 + Math.random() * 90);
      }
    }

    async function progress() {
      const p = logLine("");
      const total = window.innerWidth < 600 ? 12 : 24;
      for (let i = 0; i <= total; i++) {
        if (finished) return;
        p.textContent = `fetching assets  [${"█".repeat(i)}${"·".repeat(total - i)}] ${String(Math.round((i / total) * 100)).padStart(3, " ")}%`;
        if (i % 3 === 0) sound.blip();
        await wait(28);
      }
      p.innerHTML += ' <span class="ok">done</span>';
    }

    async function sequence() {
      await wait(250);
      await command("ssh guest@inconnuboy.dev");
      await output([
        "connecting to inconnuboy.dev:22 …",
        '<span class="ok">✓</span> secure channel established',
        "Maringá, BR · " + new Date().toUTCString().slice(17, 22) + " UTC",
      ]);
      await progress();
      await wait(200);
      await command("whoami");
      if (finished) return;
      await wait(150);
      name.classList.add("is-typing");
      await type(nameText, "Inconnu boy sensei", { strength: 1.15 });
      name.classList.remove("is-typing");
      await wait(650);
      if (finished) return;
      sound.enter();
      name.classList.add("is-gone");
      await wait(350);
      welcome.innerHTML = "Welcome."
        .split("")
        .map((c, i) => `<span class="c${c === "." ? " c--dot" : ""}" style="--i:${i}">${c}</span>`)
        .join("");
      void welcome.offsetWidth;
      welcome.classList.add("is-in");
      sub.classList.add("is-in");
      line.classList.add("is-in");
      sound.chime();
      await wait(1900);
      finish();
    }

    function boot() {
      if (started) return;
      started = true;
      sound.start();
      gate.classList.add("is-gone");
      setTimeout(() => gate.remove(), 600);
      sequence();
    }

    function onKey(e) {
      if (e.key === "Escape") return finish();
      if (!started) boot();
    }

    const syncMute = () => {
      muteBtn.textContent = sound.muted ? "sound: off" : "sound: on";
      muteBtn.setAttribute("aria-pressed", String(sound.muted));
    };
    syncMute();
    document.addEventListener("soundchange", syncMute);
    gate.addEventListener("click", boot);
    window.addEventListener("keydown", onKey);
    $("introSkip").addEventListener("click", (e) => {
      e.stopPropagation();
      finish();
    });
    muteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sound.setMuted(!sound.muted);
      if (!started) boot();
    });
    gate.focus({ preventScroll: true });
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function initSoundToggle() {
    const unlock = () => {
      if (!sound.muted) sound.start();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    const btn = document.getElementById("soundToggle");
    if (!btn) return;
    const sync = () => {
      btn.classList.toggle("is-muted", sound.muted);
      btn.setAttribute("aria-pressed", String(!sound.muted));
    };
    sync();
    document.addEventListener("soundchange", sync);
    btn.addEventListener("click", () => {
      sound.start();
      sound.setMuted(!sound.muted);
      if (!sound.muted) sound.key(0.8);
    });
  }

  async function typeHero() {
    const title = document.getElementById("heroTitle");
    if (!title) return;
    const chars = Array.from(title.querySelectorAll(".char"));
    if (reduced) {
      chars.forEach((c) => c.classList.add("on"));
      return;
    }
    const caret = document.createElement("span");
    caret.className = "hero-caret is-typing";
    caret.setAttribute("aria-hidden", "true");
    chars[0].before(caret);
    await sleep(250);
    for (const c of chars) {
      c.classList.add("on");
      c.after(caret);
      sound.key(0.9);
      const next = c.nextSibling;
      const pause = next && next.nodeType === 3 ? 160 : 0;
      await sleep(55 + Math.random() * 75 + pause);
    }
    caret.classList.remove("is-typing");
    await sleep(200);
  }

  async function typeCommand(head) {
    const label = head.querySelector(".label");
    if (!label) return head.classList.add("in-view");
    const nodes = [];
    const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const targets = nodes.map((n) => n.data);
    nodes.forEach((n) => (n.data = ""));
    const caret = document.createElement("span");
    caret.className = "type-caret";
    caret.setAttribute("aria-hidden", "true");
    label.append(caret);
    head.classList.add("in-view");
    await sleep(120);
    for (let k = 0; k < nodes.length; k++) {
      for (const ch of targets[k]) {
        nodes[k].data += ch;
        if (ch !== " ") sound.key(0.3);
        await sleep(35 + Math.random() * 45);
      }
    }
    await sleep(900);
    caret.remove();
  }

  const GLYPHS = "!<>-_\\/[]{}=+*^?#%&$@ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  function decode(el) {
    const nodes = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const targets = nodes.map((n) => n.data);
    let offset = 0;
    const plan = targets.map((t) =>
      Array.from(t).map((ch) => {
        const i = offset++;
        return { ch, at: i * 22 + Math.random() * 380 };
      })
    );
    const total = Math.max(0, ...plan.flat().map((p) => p.at)) + 120;
    el.classList.add("in-view", "decoding");
    const start = performance.now();
    let lastSound = 0;
    const frame = (now) => {
      const t = now - start;
      plan.forEach((chars, k) => {
        nodes[k].data = chars
          .map((p) => (t >= p.at || p.ch === " " ? p.ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join("");
      });
      if (now - lastSound > 70) {
        sound.blip();
        lastSound = now;
      }
      if (t < total) return requestAnimationFrame(frame);
      nodes.forEach((n, k) => (n.data = targets[k]));
      el.classList.remove("decoding");
    };
    requestAnimationFrame(frame);
  }

  let io;
  function observe(scope = document, skipHero = false) {
    let els = Array.from(scope.querySelectorAll("[data-anim]:not(.in-view)"));
    if (skipHero) els = els.filter((el) => !el.closest(".hero"));
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in-view", "is-split"));
      return;
    }
    if (!io) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            io.unobserve(e.target);
            const kind = e.target.dataset.anim;
            if (kind === "words" || kind === "lines") revealText(e.target);
            else if (kind === "decode") decode(e.target);
            else if (kind === "cmd") typeCommand(e.target);
            else e.target.classList.add("in-view");
          });
        },
        { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
      );
    }
    els.forEach((el) => {
      const kind = el.dataset.anim;
      if (kind === "stagger") {
        Array.from(el.children).forEach((c, i) => c.style.setProperty("--s", i));
      }
      io.observe(el);
    });
  }

  function magnetic(el) {
    if (!finePointer || reduced) return;
    const strength = 0.28;
    const label = el.querySelector(".btn__label, .contact__mail-text");
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
      if (label) label.style.transform = `translate3d(${x * strength * 0.4}px, ${y * strength * 0.4}px, 0)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transform = "";
      if (label) label.style.transform = "";
    });
  }

  function spotlight(el) {
    if (!finePointer) return;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  }

  const cursor = { x: -100, y: -100, tx: -100, ty: -100, el: null, label: null, active: false };
  function initCursor() {
    cursor.el = document.getElementById("cursor");
    cursor.label = document.getElementById("cursorLabel");
    if (!cursor.el || !finePointer || reduced) {
      if (cursor.el) cursor.el.remove();
      return;
    }
    root.classList.add("has-cursor");
    window.addEventListener("pointermove", (e) => {
      cursor.tx = e.clientX;
      cursor.ty = e.clientY;
      if (!cursor.active) {
        cursor.active = true;
        cursor.x = cursor.tx;
        cursor.y = cursor.ty;
        cursor.el.classList.add("is-on");
      }
    }, { passive: true });
    document.addEventListener("pointerleave", () => cursor.el.classList.remove("is-on"));
    document.addEventListener("pointerenter", () => cursor.active && cursor.el.classList.add("is-on"));

    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("a, button, [data-cursor], summary, label");
      if (!t) {
        cursor.el.classList.remove("is-hover", "is-label");
        return;
      }
      const text = t.getAttribute("data-cursor");
      cursor.el.classList.toggle("is-label", !!text);
      cursor.el.classList.toggle("is-hover", !text);
      if (text) cursor.label.textContent = text;
    });
    document.addEventListener("pointerdown", () => cursor.el.classList.add("is-down"));
    document.addEventListener("pointerup", () => cursor.el.classList.remove("is-down"));
  }

  const marquees = [];
  function initMarquee(el, html) {
    const track = el.querySelector(".marquee__track");
    track.innerHTML = `<div class="marquee__group">${html}</div><div class="marquee__group" aria-hidden="true">${html}</div>`;
    marquees.push({ el, track, dir: Number(el.dataset.marquee) || 1, x: 0, width: 0 });
    measureMarquees();
  }
  function measureMarquees() {
    marquees.forEach((m) => (m.width = m.track.firstElementChild.offsetWidth));
  }

  const state = { y: window.scrollY, lastY: window.scrollY, velocity: 0, navHidden: false };
  const els = {};

  function cacheEls() {
    els.progress = document.getElementById("progressBar");
    els.nav = document.getElementById("nav");
    els.heroTitle = document.getElementById("heroTitle");
    els.hero = document.querySelector(".hero");
    els.timeline = document.getElementById("timeline");
    els.timelineFill = document.getElementById("timelineFill");
  }

  function loop() {
    state.y = window.scrollY;
    const delta = state.y - state.lastY;
    state.lastY = state.y;
    state.velocity = lerp(state.velocity, delta, 0.12);

    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;

    if (els.progress) els.progress.style.transform = `scaleX(${max > 0 ? state.y / max : 0})`;

    if (els.nav) {
      els.nav.classList.toggle("is-scrolled", state.y > 24);
      if (Math.abs(delta) > 2) {
        const hide = delta > 0 && state.y > vh * 0.6;
        if (hide !== state.navHidden) {
          state.navHidden = hide;
          els.nav.classList.toggle("is-hidden", hide);
        }
      }
    }

    if (!reduced) {
      if (els.heroTitle && state.y < vh * 1.2) {
        const p = clamp(state.y / vh, 0, 1);
        els.heroTitle.style.transform = `translate3d(0, ${p * 18}vh, 0)`;
        els.heroTitle.style.opacity = String(1 - p * 0.9);
      }

      marquees.forEach((m) => {
        if (!m.width) return;
        const speed = 0.5 + Math.min(Math.abs(state.velocity) * 0.35, 14);
        m.x -= speed * m.dir;
        if (m.x <= -m.width) m.x += m.width;
        if (m.x > 0) m.x -= m.width;
        const skew = clamp(state.velocity * -0.15, -6, 6);
        m.track.style.transform = `translate3d(${m.x}px,0,0) skewX(${skew}deg)`;
      });

      if (cursor.active) {
        cursor.x = lerp(cursor.x, cursor.tx, 0.2);
        cursor.y = lerp(cursor.y, cursor.ty, 0.2);
        cursor.el.style.transform = `translate3d(${cursor.x}px, ${cursor.y}px, 0)`;
      }
    }

    if (els.timeline && els.timelineFill) {
      const r = els.timeline.getBoundingClientRect();
      const p = clamp((vh * 0.65 - r.top) / r.height, 0, 1);
      els.timelineFill.style.transform = `scaleY(${p})`;
      els.timeline.querySelectorAll(".tl-item").forEach((item) => {
        const ir = item.getBoundingClientRect();
        item.classList.toggle("is-active", ir.top < vh * 0.65);
      });
    }

    requestAnimationFrame(loop);
  }

  function countUp(el, value, duration = 1400) {
    const n = Number(value);
    if (reduced || !Number.isFinite(n)) {
      el.textContent = value;
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      el.textContent = Math.round(easeOutExpo(t) * n).toLocaleString();
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function countWhenVisible(el, value) {
    if (!("IntersectionObserver" in window)) return countUp(el, value);
    const o = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        o.disconnect();
        countUp(el, value);
      }
    }, { threshold: 0.6 });
    o.observe(el);
  }

  let resizeT;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      measureMarquees();
    }, 150);
  });

  window.InconnuBoy = {
    reduced,
    init() {
      cacheEls();
      document.querySelectorAll("[data-split]").forEach((el) => {
        const n = splitChars(el);
        el.style.setProperty("--n", n);
      });
      document.querySelectorAll("[data-magnetic]").forEach(magnetic);
      document.querySelectorAll("[data-spot]").forEach(spotlight);
      initCursor();
      initSoundToggle();
      requestAnimationFrame(loop);
      const start = () => {
        observe(document, true);
        typeHero().then(() => observe(document.querySelector(".hero")));
      };
      if (document.fonts && document.fonts.ready) {
        Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]).then(() =>
          runIntro(start)
        );
      } else {
        runIntro(start);
      }
    },
    observe,
    initMarquee,
    countWhenVisible,
    spotlight,
  };
})();
