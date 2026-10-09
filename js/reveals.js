/* How the page arrives. Print is set: it rises out of the line it sits on.
   The pen rules its lines left to right and swings its rings. Points are
   plotted, figures are tallied, sentences are written across. */

import { gsap, ScrollTrigger, SplitText, D, E } from "./motion.js";

const all = (selector, root = document) => gsap.utils.toArray(root.querySelectorAll(selector));
const drawn = { "--draw": 1, ease: E.inOut };

/* ---------- The first screen, as one timeline ---------- */
export function intro(onComplete) {
  return gsap
    .timeline({ defaults: { ease: E.out }, onComplete })
    // clearProps, or the transform left on the bar becomes the containing
    // block of the fixed phone menu and shrinks it to the bar's height
    .from(".nav", { yPercent: -100, autoAlpha: 0, duration: D.base, clearProps: "transform,opacity,visibility" }, 0)
    .from(".field", { autoAlpha: 0, duration: D.epic, clearProps: "opacity,visibility" }, 0)
    .from(".open-rings circle", { drawSVG: "0%", duration: D.epic, stagger: 0.12, ease: E.inOut }, 0.05)
    .from(".open-name .char", { yPercent: 118, duration: D.slow, stagger: 0.03 }, 0.15)
    .fromTo(".open-name .italic", { "--draw": 0 }, { ...drawn, duration: D.base }, 0.85)
    .from([".open-meta", ".open-role"], { y: 16, autoAlpha: 0, duration: D.base, stagger: 0.08 }, 0.6)
    .from(".open-scroll", { autoAlpha: 0, duration: D.fast }, 1.1);
}

/* ---------- One-shots ---------- */
export function reveals() {
  const block = (trigger, start = "top 86%") =>
    gsap.timeline({ defaults: { ease: E.out }, scrollTrigger: { trigger, start, once: true } });

  // headings: the lines are set, then the pen rules under what it wrote
  all(".thesis-title, .section-title, .book-title").forEach((title) => {
    const tl = block(title, "top 84%").from(all(".t-line > span", title), {
      yPercent: 118,
      duration: D.slow,
      stagger: 0.08,
    });
    const pen = title.querySelector(".italic");
    if (pen) tl.fromTo(pen, { "--draw": 0 }, { ...drawn, duration: D.base }, 0.55);
  });

  // sentences are written across, a line at a time
  all(".thesis-lede, .section-lede, .book-lede").forEach((el) => {
    SplitText.create(el, {
      type: "lines",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          clipPath: "inset(0% 100% 0% 0%)",
          duration: D.slow,
          stagger: 0.09,
          ease: E.inOut,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        }),
    });
  });

  // buttons are ruled in from their left edge. the pointer owns their x and y,
  // so the entrance stays on the clip
  all(".thesis-actions, .book-stage").forEach((group) => {
    const tl = block(group.querySelector(".btn"), "top 92%").fromTo(
      group.querySelector(".btn"),
      { clipPath: "inset(0% 100% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: D.base, ease: E.inOut, clearProps: "clipPath" },
    );
    const link = group.querySelector(".text-link");
    // opacity, not visibility: a hidden link drops out of the tab order
    if (link) tl.from(link, { x: -14, opacity: 0, duration: D.fast, clearProps: "transform" }, 0.35);
  });

  // cells hang from their top rule and unroll downward
  [".thesis-aside", ".creds"].forEach((strip) => {
    const tl = block(strip, "top 90%");
    const label = document.querySelector(`${strip} .aside-label`);
    if (label) tl.from(label, { x: -14, autoAlpha: 0, duration: D.fast }, 0);
    tl.fromTo(
      all(`${strip} li, ${strip} > div`),
      { clipPath: "inset(0% 0% 100% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: D.base, stagger: 0.07, ease: E.inOut, clearProps: "clipPath" },
      0.05,
    );
  });

  // figures are tallied. the final value is in the html, so it is right with no script
  all("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count);
    const state = { value: 0 };
    gsap.to(state, {
      value: end,
      duration: D.epic,
      ease: E.out,
      onStart: () => (el.textContent = "0"),
      onUpdate: () => (el.textContent = Math.round(state.value)),
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
    });
  });

  // the record: its count settles, and the strip feeds in from the right
  block(".record-meter", "top 92%").from(".record-meter", { y: 14, autoAlpha: 0, duration: D.base });
  block(".record-window", "top 80%").fromTo(
    ".record-window",
    { clipPath: "inset(0% 0% 0% 100%)" },
    { clipPath: "inset(0% 0% 0% 0%)", duration: D.slow, ease: E.inOut, clearProps: "clipPath" },
  );

  // stills are unmasked from the floor of their frame, in batches so a phone
  // with two of them on screen only plays two
  const stills = all(".player");
  gsap.set(stills, { clipPath: "inset(100% 0% 0% 0%)" });
  ScrollTrigger.batch(stills, {
    start: "top 90%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: D.epic,
        stagger: 0.09,
        ease: E.out,
        clearProps: "clipPath",
      }),
  });

  const names = all(".cinema-meta");
  gsap.set(names, { y: 12, autoAlpha: 0 });
  ScrollTrigger.batch(names, {
    start: "top 94%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: D.fast, stagger: 0.06, ease: E.out }),
  });

  // the quote is read through as it passes
  const words = all(".witness-quote .word");
  if (words.length) {
    gsap.fromTo(
      words,
      { opacity: 0.22 },
      {
        opacity: 1,
        stagger: 0.04,
        ease: "none",
        scrollTrigger: { trigger: ".witness-quote", start: "top 78%", end: "bottom 55%", scrub: 0.5 },
      },
    );
  }
  block(".witness-quote cite", "top 94%").from(".witness-quote cite", { autoAlpha: 0, duration: D.fast });

  // each move: the rule is drawn, the numeral rises off it, the rest follows
  all(".move").forEach((move) => {
    block(move)
      .fromTo(move, { "--draw": 0 }, { ...drawn, duration: D.slow }, 0)
      .from(move.querySelector(".move-index span"), { yPercent: 105, duration: D.slow }, 0.05)
      .from(move.querySelector(".move-tag"), { x: -14, autoAlpha: 0, duration: D.fast }, 0.2)
      .from(move.querySelector("h3"), { y: 24, autoAlpha: 0, duration: D.base }, 0.12)
      .from(move.querySelector(".move-copy > p:last-child"), { y: 12, autoAlpha: 0, duration: D.fast }, 0.4);
  });

  // each price: a point is plotted at the name and a line ruled out to the cost
  all(".price").forEach((price) => {
    block(price, "top 88%")
      .fromTo(price, { "--draw": 0 }, { ...drawn, duration: D.slow }, 0)
      .from(price.querySelector(".price-name"), { x: -22, autoAlpha: 0, duration: D.base }, 0.05)
      // the one thing on the page that overshoots
      .fromTo(price, { "--point": 0 }, { "--point": 1, duration: D.base, ease: "back.out(3)" }, 0.2)
      .from(price.querySelector(".price-line"), { scaleX: 0, duration: D.slow, ease: E.inOut }, 0.25)
      .from(price.querySelector(".price-cost"), { x: 22, autoAlpha: 0, duration: D.base }, 0.4)
      .from(price.querySelector(".price-detail"), { y: 10, autoAlpha: 0, duration: D.fast }, 0.5);
  });

  block(".group-copy", "top 90%")
    .from(".group-copy h3", { y: 24, autoAlpha: 0, duration: D.base }, 0)
    .from(".group-copy p", { y: 12, autoAlpha: 0, duration: D.fast }, 0.2);

  // ledger rows and contact rows: label from the left edge, value from the right.
  // hover owns x on the contact rows, so their travel goes on xPercent
  all(".group-note li, .reach li").forEach((row) => {
    const parts = row.querySelectorAll("span:not(.swap), strong");
    const tl = block(row, "top 93%")
      .fromTo(row, { "--draw": 0 }, { ...drawn, duration: D.slow }, 0)
      .from(parts[0], { xPercent: -12, autoAlpha: 0, duration: D.base }, 0.05)
      .from(parts[1], { xPercent: 8, autoAlpha: 0, duration: D.base }, 0.12);
    const arrow = row.querySelector(".swap");
    if (arrow) tl.from(arrow, { autoAlpha: 0, duration: D.fast }, 0.4);
  });

  block(".foot", "top 97%").from(".foot > *", { y: 12, opacity: 0, duration: D.fast, stagger: 0.06 });
}

/* ---------- Scrubbed motion with no pin ---------- */
export function drift(wide) {
  const scrub = (trigger, amount) => ({ trigger, start: "top bottom", end: "bottom top", scrub: amount });

  gsap.to("#progress", {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.3 },
  });

  // the first screen leaves in three layers at three rates
  const leave = { trigger: ".open", start: "top top", end: "bottom top" };
  gsap.to(".open-stage", { y: 90, scale: 0.94, opacity: 0.2, ease: "none", scrollTrigger: { ...leave, scrub: 0.4 } });
  gsap.to(".open-rings", { scale: 1.4, ease: "none", scrollTrigger: { ...leave, scrub: 0.8 } });
  gsap.to(".field", { y: 80, ease: "none", scrollTrigger: scrub(document.body, 1) });

  // each still drifts inside its own frame
  all(".player img").forEach((img, index) => {
    gsap.fromTo(
      img,
      { scale: 1.9 },
      { scale: 1.65, ease: "none", scrollTrigger: scrub(img.closest(".player"), 0.5 + (index % 3) * 0.25) },
    );
  });

  if (!wide) return;

  gsap.to(".thesis-title", { y: -28, ease: "none", scrollTrigger: scrub(".thesis", 0.6) });
  gsap.fromTo(".witness-quote", { y: 26 }, { y: -26, ease: "none", scrollTrigger: scrub(".cinema", 0.8) });
  gsap.fromTo(".book", { "--ghost-y": "8%" }, { "--ghost-y": "-12%", ease: "none", scrollTrigger: scrub(".book", 1) });

  // the numerals slide past their rows at four different rates. the entrance
  // owns the span inside, so the drift moves the mask around it
  all(".move-index").forEach((index, i) => {
    const amount = [16, 28, 12, 22][i % 4];
    gsap.fromTo(index, { y: amount }, { y: -amount, ease: "none", scrollTrigger: scrub(index, 0.5 + (i % 3) * 0.25) });
  });
}

/* ---------- The nav marks the section in view ---------- */
export function navState() {
  all(".nav-links a").forEach((link) => {
    ScrollTrigger.create({
      trigger: link.getAttribute("href"),
      start: "top 45%",
      end: "bottom 45%",
      onToggle: (self) => link.classList.toggle("is-active", self.isActive),
    });
  });
}

/* ---------- The ledger: the pen sits on one row at a time ---------- */
export function prices({ live, fine, signal }) {
  const rows = all(".price");
  let hovered = null;
  let current;

  // a compass ring round the price the pen is on
  const rings = rows.map((row) => {
    if (!live) return null;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "price-ring");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = '<circle cx="50" cy="50" r="48" vector-effect="non-scaling-stroke"/>';
    row.querySelector(".price-num").append(svg);
    signal.addEventListener("abort", () => svg.remove());
    const circle = svg.firstChild;
    gsap.set(circle, { drawSVG: "0% 0%" });
    return circle;
  });

  const mark = (row) => {
    if (row === current) return;
    current = row;
    rows.forEach((el, i) => {
      const on = el === row;
      el.classList.toggle("is-active", on);
      if (!rings[i]) return;
      gsap.to(rings[i], {
        drawSVG: on ? "0% 100%" : "0% 0%",
        duration: on ? D.base : D.fast,
        ease: E.inOut,
        overwrite: true,
      });
    });
  };

  // without a pointer on a row, it is the row nearest the middle of the screen
  const sync = () => {
    if (hovered) return;
    const middle = innerHeight * 0.48;
    let best = null;
    let bestGap = Infinity;
    rows.forEach((row) => {
      const r = row.getBoundingClientRect();
      const gap = Math.abs((r.top + r.bottom) / 2 - middle);
      if (r.bottom > 0 && r.top < innerHeight && gap < bestGap) {
        bestGap = gap;
        best = row;
      }
    });
    mark(best);
  };

  ScrollTrigger.create({
    trigger: ".price-list",
    start: "top bottom",
    end: "bottom top",
    onUpdate: sync,
    onToggle: (self) => (self.isActive ? sync() : mark(null)),
  });
  signal.addEventListener("abort", () => rows.forEach((row) => row.classList.remove("is-active")));

  if (!fine) return;
  rows.forEach((row) => {
    row.addEventListener("pointerenter", () => mark((hovered = row)), { signal });
    row.addEventListener("pointerleave", () => { hovered = null; sync(); }, { signal });
  });
}
