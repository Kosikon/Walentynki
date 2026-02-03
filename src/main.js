import "./style.css";

const photoModules = import.meta.glob("./assets/photos/*.{png,jpg,jpeg,webp,gif,PNG,JPG,JPEG,WEBP}", {
  eager: true,
  import: "default",
});
const PHOTOS = Object.values(photoModules);

// 2) Dźwięk (wrzuć plik do public/sounds/holy-moly.mp3)
const HOLY_MOLY_SRC = "./sounds/holy-moly.mp3";

const app = document.querySelector("#app");

/* -------------------- FX: Confetti + Hearts -------------------- */
function makeFxLayer(hostEl) {
  const layer = document.createElement("div");
  layer.className = "fxLayer";
  layer.innerHTML = `<canvas class="confettiCanvas"></canvas>`;
  hostEl.appendChild(layer);

  const canvas = layer.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  function resize() {
    const r = hostEl.getBoundingClientRect();
    canvas.width = Math.floor(r.width * devicePixelRatio);
    canvas.height = Math.floor(r.height * devicePixelRatio);
    canvas.style.width = `${r.width}px`;
    canvas.style.height = `${r.height}px`;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  resize();

  const onResize = () => resize();
  window.addEventListener("resize", onResize);

  let particles = [];
  let running = false;
  let rafId = null;

  function burstConfetti({ x, y, count = 140 }) {
    const r = hostEl.getBoundingClientRect();
    const originX = x ?? r.width / 2;
    const originY = y ?? r.height / 3;

    const shapes = ["rect", "circle"];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (2 + Math.random() * 4),
        size: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.25,
        gravity: 0.18 + Math.random() * 0.12,
        drag: 0.985,
        life: 70 + Math.random() * 40,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        color: `hsl(${Math.floor(Math.random() * 360)} 90% 65%)`,
        alpha: 1,
      });
    }

    if (!running) {
      running = true;
      loop();
    }
  }

  function sprinkleHearts({ x, y, amount = 14 }) {
    const r = hostEl.getBoundingClientRect();
    const ox = x ?? r.width / 2;
    const oy = y ?? r.height / 3;

    for (let i = 0; i < amount; i++) {
      const el = document.createElement("div");
      el.className = "heart";
      el.textContent =
        Math.random() < 0.25 ? "💖" : Math.random() < 0.5 ? "💘" : "💗";
      el.style.left = `${ox + (Math.random() - 0.5) * 60}px`;
      el.style.top = `${oy + (Math.random() - 0.5) * 30}px`;
      el.style.fontSize = `${18 + Math.random() * 18}px`;
      el.style.animationDuration = `${1.2 + Math.random() * 1.2}s`;
      layer.appendChild(el);
      setTimeout(() => el.remove(), 2200);
    }
  }

  function loop() {
    rafId = requestAnimationFrame(loop);
    const r = hostEl.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);

    particles = particles.filter((p) => p.life > 0);

    for (const p of particles) {
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;

      p.x += p.vx;
      p.y += p.vy;

      p.rot += p.vr;
      p.life -= 1;

      if (p.life < 25) p.alpha = Math.max(0, p.life / 25);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;

      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      }
      ctx.restore();
    }

    if (particles.length === 0) {
      running = false;
      cancelAnimationFrame(rafId);
      rafId = null;
      ctx.clearRect(0, 0, r.width, r.height);
    }
  }

  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener("resize", onResize);
    layer.remove();
  }

  return { layer, burstConfetti, sprinkleHearts, destroy };
}
/* --------------------------------------------------------------- */

function mountLanding() {
  app.innerHTML = `
    <div class="shell" id="shell">
      <div class="topbar">
        <div class="brand">💘 Walentynki 15.02.2026</div>
      </div>

      <div class="content" id="stage">
        <div class="center">
          <h1 class="question">Zostaniesz moją walentynką?</h1>

          <div class="controls" id="controls">
            <button class="btn btn-yes" id="yesBtn">Tak</button>
            <button class="btn btn-no" id="noBtn">Nie</button>
          </div>

          <div class="hint" id="hint"></div>
        </div>
      </div>
    </div>
  `;

  const shell = document.getElementById("shell");
  const stage = document.getElementById("stage");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");
  const hint = document.getElementById("hint");

  const fx = makeFxLayer(shell);

  const holyMoly = new Audio(HOLY_MOLY_SRC);
  holyMoly.preload = "auto";

  const amore = new Audio("./sounds/amore.mp3");
  amore.loop = true;
  amore.volume = 0.6; // możesz zmienić (0.0 – 1.0)

  let vx = 0;
  let vy = 0;
  let offsetX = 0;
  let offsetY = 0;

  let questionMarks = 0;
  let nearNo = false;

  // Twoje bazowe prędkości
  const ACTIVATE_DIST = 180;
  const PANIC_DIST = 155;
  const MAX_SPEED = 86;
  const FRICTION = 0.95;
  const NUDGE = 5.2;
  const PANIC_NUDGE = 9.1;

  // Tekst: ? -> HAHAHAHA
  const MAX_Q = 12;
  let reachedMaxQ = false;

  // Hover turbo x3 + sekwencja tekstów
  let hoverPanic = false;
  let hoverSeqRunning = false;

  function runHoverSequence() {
    if (hoverSeqRunning) return;
    hoverSeqRunning = true;

    const seq = ["IM FAST", "AS FUCK", "BOOOOIIIIIIIIIIII"];
    let i = 0;

    const step = () => {
      noBtn.textContent = seq[i] ?? seq[seq.length - 1];
      i += 1;
      if (i < seq.length) {
        setTimeout(step, 420);
      } else {
        setTimeout(() => {
          hoverSeqRunning = false;
          if (reachedMaxQ) noBtn.textContent = "HAHAHAHA";
          else noBtn.textContent = "Nie";
        }, 900);
      }
    };

    step();
  }

  noBtn.addEventListener("mouseenter", () => {
    hoverPanic = true;
    runHoverSequence();
  });

  noBtn.addEventListener("mouseleave", () => {
    setTimeout(() => (hoverPanic = false), 700);
  });

  function clampNoWithinShell(nextLeft, nextTop) {
    const shellRect = shell.getBoundingClientRect();
    const controlsRect = document.getElementById("controls").getBoundingClientRect();
    const noRect = noBtn.getBoundingClientRect();

    const left = controlsRect.left - shellRect.left + 10;
    const right = controlsRect.right - shellRect.left - noRect.width - 10;
    const top = controlsRect.top - shellRect.top + 10;
    const bottom = controlsRect.bottom - shellRect.top - noRect.height - 10;

    const cx = Math.min(Math.max(nextLeft, left), right);
    const cy = Math.min(Math.max(nextTop, top), bottom);
    return [cx, cy];
  }

  const base = { x: 0, y: 0 };
  function computeBase() {
    const shellRect = shell.getBoundingClientRect();
    const noRect = noBtn.getBoundingClientRect();
    base.x = noRect.left - shellRect.left + noRect.width / 2;
    base.y = noRect.top - shellRect.top + noRect.height / 2;
  }
  computeBase();
  window.addEventListener("resize", computeBase);

  function setNoTransform(centerX, centerY) {
    const shellRect = shell.getBoundingClientRect();
    const noRect = noBtn.getBoundingClientRect();

    const left = centerX - noRect.width / 2;
    const top = centerY - noRect.height / 2;

    offsetX = left - (base.x - noRect.width / 2);
    offsetY = top - (base.y - noRect.height / 2);

    noBtn.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
  }

  requestAnimationFrame(() => {
    computeBase();
    setNoTransform(base.x, base.y);
  });

  const YES_BASE_FONT = parseFloat(getComputedStyle(yesBtn).fontSize);
  function setYesGrow(active) {
    yesBtn.style.fontSize = active ? `${YES_BASE_FONT + 5}px` : `${YES_BASE_FONT}px`;
  }

  function setNoTextLevel(active) {
    if (!active) {
      questionMarks = 0;
      reachedMaxQ = false;
      if (!hoverSeqRunning) noBtn.textContent = "Nie";
      return;
    }

    if (hoverSeqRunning) return;

    if (reachedMaxQ) {
      noBtn.textContent = "HAHAHAHA";
      return;
    }

    questionMarks = Math.min(questionMarks + 1, MAX_Q);
    if (questionMarks >= MAX_Q) {
      reachedMaxQ = true;
      noBtn.textContent = "HAHAHAHA";
    } else {
      noBtn.textContent = "?".repeat(questionMarks);
    }
  }

  let lastMouse = { x: 0, y: 0, has: false };
  stage.addEventListener("mousemove", (e) => {
    lastMouse = { x: e.clientX, y: e.clientY, has: true };
  });

  function tick() {
    vx *= FRICTION;
    vy *= FRICTION;

    let localNearNo = false;

    if (lastMouse.has) {
      const noRect = noBtn.getBoundingClientRect();
      const noCx = noRect.left + noRect.width / 2;
      const noCy = noRect.top + noRect.height / 2;

      const dx = noCx - lastMouse.x;
      const dy = noCy - lastMouse.y;
      const dist = Math.hypot(dx, dy);

      if (dist < ACTIVATE_DIST) {
        localNearNo = true;

        const ux = dx / (dist || 1);
        const uy = dy / (dist || 1);

        let power = dist < PANIC_DIST ? PANIC_NUDGE : NUDGE;
        if (hoverPanic) power *= 3;

        vx += ux * power;
        vy += uy * power;

        const swirl = dist < PANIC_DIST ? 1.25 : 0.8;
        vx += -uy * swirl;
        vy += ux * swirl;
      }
    }

    const spd = Math.hypot(vx, vy);
    const speedCap = hoverPanic ? MAX_SPEED * 3 : MAX_SPEED;

    if (spd > speedCap) {
      vx = (vx / spd) * speedCap;
      vy = (vy / spd) * speedCap;
    }

    const shellRect = shell.getBoundingClientRect();
    const noRect = noBtn.getBoundingClientRect();
    const currentX = noRect.left - shellRect.left + noRect.width / 2;
    const currentY = noRect.top - shellRect.top + noRect.height / 2;

    let nextX = currentX + vx;
    let nextY = currentY + vy;

    const [clLeft, clTop] = clampNoWithinShell(
      nextX - noRect.width / 2,
      nextY - noRect.height / 2
    );
    nextX = clLeft + noRect.width / 2;
    nextY = clTop + noRect.height / 2;

    setNoTransform(nextX, nextY);

    if (localNearNo && !nearNo) {
      setNoTextLevel(true);
    } else if (localNearNo) {
      if (Math.random() < 0.06) setNoTextLevel(true);
    } else if (!localNearNo && nearNo) {
      setNoTextLevel(false);
    }

    setYesGrow(localNearNo);
    nearNo = localNearNo;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ✅ NAPRAWIONE DOMKNIĘCIA + try/await wewnątrz handlera
  yesBtn.addEventListener("click", async (e) => {
    const rect = shell.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    fx.burstConfetti({ x, y, count: 170 });
    fx.sprinkleHearts({ x, y, amount: 18 });

    setTimeout(() => {
      fx.burstConfetti({ x: rect.width * 0.55, y: rect.height * 0.28, count: 110 });
      fx.sprinkleHearts({ x: rect.width * 0.55, y: rect.height * 0.28, amount: 14 });
    }, 220);

    try {
      // odpal "holy moly"
      await holyMoly.play();

      //gdy się skończy → start muzyki w pętli
      holyMoly.onended = async () => {
        try {
          await amore.play();
        } catch {}
      };
    } catch {}

    setTimeout(() => {
      fx.destroy();
      mountGallery();
    }, 550);
  });

  function mountGallery() {
    const hasPhotos = PHOTOS.length > 0;

    app.innerHTML = `
      <div class="shell" id="shell">
        <div class="topbar">
          <div class="brand">💘 Walentynki - 15.02.2026<span class="badge">galeria</span></div>
          <div class="badge">${hasPhotos ? `Zdjęcia: ${PHOTOS.length}` : "Brak zdjęć"}</div>
        </div>

        <div class="content">
          <div class="center" style="gap:10px; padding-bottom:16px;">
            <h1 class="question" style="margin-bottom:4px;">MAMY TOO!! 🥹</h1>
            <p class="sub" style="margin-top:0;">
            </p>
          </div>

          <div class="galleryWrap" id="gallery"></div>
        </div>

        <div class="footer">
          <button class="smallBtn" id="backBtn">← Wróć</button>
        </div>
      </div>
    `;

    const shell = document.getElementById("shell");
    const fx = makeFxLayer(shell);

    const heartTimer = setInterval(() => {
      const r = shell.getBoundingClientRect();
      const x = r.width * (0.25 + Math.random() * 0.5);
      const y = r.height * (0.20 + Math.random() * 0.35);
      fx.sprinkleHearts({ x, y, amount: 6 + Math.floor(Math.random() * 6) });
    }, 1200);

    document.getElementById("backBtn").addEventListener("click", () => {
      clearInterval(heartTimer);
      fx.destroy();
      mountLanding();
    });

    const gallery = document.getElementById("gallery");

    if (!hasPhotos) return;

    const POLAROIDS = Math.min(14, Math.max(8, PHOTOS.length));
    const cards = [];

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function normalizeSrc(s) {
      const i = s.lastIndexOf("/");
      return i >= 0 ? s.slice(i + 1) : s;
    }

    function layoutCards() {
      gallery.innerHTML = "";
      cards.length = 0;

      const rect = gallery.getBoundingClientRect();
      const pad = 18;

      const cardW = 240;
      const cardH = 280;
      const gap = 26;

      const usableW = Math.max(1, rect.width - pad * 2);
      const usableH = Math.max(1, rect.height - pad * 2);

      const cols = Math.max(2, Math.floor(usableW / (cardW + gap)));
      const rows = Math.max(2, Math.floor(usableH / (cardH + gap)));

      const maxSlots = cols * rows;
      const target = Math.min(POLAROIDS, maxSlots, PHOTOS.length); // <= PHOTOS.length => brak duplikatów

      const uniquePool = shuffle(PHOTOS).slice(0, target);

      const jitterX = Math.min(40, (cardW + gap) * 0.22);
      const jitterY = Math.min(30, (cardH + gap) * 0.18);

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const slots = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          slots.push({ r, c });
        }
      }
      slots.sort(() => Math.random() - 0.5);

      for (let i = 0; i < target; i++) {
        const { r, c } = slots[i];

        const baseX = pad + c * (cardW + gap);
        const baseY = pad + r * (cardH + gap);

        let x = baseX + (Math.random() - 0.5) * jitterX;
        let y = baseY + (Math.random() - 0.5) * jitterY;

        const px = x + cardW / 2 - centerX;
        const py = y + cardH / 2 - centerY;
        const push = 10;
        x += Math.sign(px) * Math.random() * push;
        y += Math.sign(py) * Math.random() * push;

        x = Math.min(Math.max(pad, x), rect.width - pad - cardW);
        y = Math.min(Math.max(pad, y), rect.height - pad - cardH);

        const el = document.createElement("div");
        el.className = "polaroid fade";
        el.style.opacity = "1";

        const rot = rand(-18, 18);
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transform = `rotate(${rot}deg)`;

        const img = document.createElement("img");
        img.src = uniquePool[i]; // unikalnie na ekranie

        const cap = document.createElement("div");
        cap.className = "cap";
        cap.textContent = "💞";

        el.appendChild(img);
        el.appendChild(cap);
        gallery.appendChild(el);

        cards.push({ el, img });
      }
    }

    layoutCards();
    window.addEventListener("resize", () => layoutCards());

    // Co 3 sekundy podmień część zdjęć — bez duplikatów na ekranie
    setInterval(() => {
      const howMany = Math.max(3, Math.floor(cards.length * 0.4));
      const pickedCards = shuffle(cards).slice(0, howMany);

      const stayingCards = cards.filter((c) => !pickedCards.includes(c));
      const staying = new Set(stayingCards.map((c) => normalizeSrc(c.img.src)));

      // dobieramy tyle nowych zdjęć, aby:
      // - nie było ich w staying
      // - nie duplikowały się między sobą
      const candidates = shuffle(PHOTOS).filter((p) => !staying.has(normalizeSrc(p)));
      const chosen = candidates.slice(0, pickedCards.length);

      pickedCards.forEach(({ el, img }, idx) => {
        el.style.opacity = "0";
        setTimeout(() => {
          img.src = chosen[idx];
          el.style.opacity = "1";
        }, 240);
      });
    }, 3000);
  }
}

mountLanding();
