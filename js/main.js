/* Motion entry. Three designs, not one scaled down: a fine pointer gets the
   whole thing, touch keeps the one-shots and the loops, and reduced motion
   gets the finished page and nothing that travels. */

import { gsap, lenis, refresh, still, D, E } from "./motion.js";
import { initField } from "./field.js";
import { intro, reveals, drift, navState, prices } from "./reveals.js";
import { record } from "./record.js";
import { pointer } from "./pointer.js";
import { ambient } from "./ambient.js";

/* ---------- Markup the motion needs, the same in every mode ---------- */

// the name is split into letters. the h1 carries the readable label
document.querySelectorAll(".open-line > span").forEach((line) => {
  const text = line.textContent;
  line.textContent = "";
  for (const letter of text) {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = letter;
    line.append(span);
  }
  line.parentElement.setAttribute("aria-hidden", "true");
});

document.querySelectorAll("[data-words]").forEach((el) => {
  const text = el.textContent.trim();
  el.textContent = "";
  text.split(/(\s+)/).forEach((chunk) => {
    if (/^\s+$/.test(chunk)) return el.append(chunk);
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = chunk;
    el.append(span);
  });
});

/* ---------- The smooth scroller takes over anchors and the menu lock ---------- */
if (lenis) {
  document.addEventListener("anchor", (e) => {
    e.preventDefault();
    lenis.scrollTo(e.detail.el, { duration: 1.2 });
  });
  // body overflow does not stop lenis, so the lock goes through the instance
  document.addEventListener("menu", (e) => (e.detail.open ? lenis.stop() : lenis.start()));
}

const field = initField(document.getElementById("field"), still);

/* ---------- The cover: the mark is constructed once per session, then lifted ---------- */
function openCover(onLift) {
  const cover = document.getElementById("cover");
  if (!cover || still()) {
    cover?.remove();
    return onLift();
  }

  // storage can throw in a private window
  let seen = false;
  try {
    seen = sessionStorage.getItem("cover") === "1";
    sessionStorage.setItem("cover", "1");
  } catch {}

  // the first screen starts arriving as the cover starts to leave
  const lift = () => {
    onLift();
    gsap.to(cover, { yPercent: -100, duration: D.base, ease: E.inOut, onComplete: () => cover.remove() });
  };
  if (seen) return lift();

  // compass, then ruler: two rings swung, the centre set, one line ruled across
  gsap.set(".cover-mark", { visibility: "visible" });
  gsap
    .timeline({ onComplete: lift })
    .from(".cover-ring", { drawSVG: "0%", duration: 0.45, stagger: 0.1, ease: E.inOut }, 0)
    .from(".cover-dot", { scale: 0, transformOrigin: "50% 50%", duration: D.fast, ease: E.out }, 0.3)
    .from(".cover-line", { drawSVG: "0%", duration: D.fast, ease: E.inOut }, 0.45);
}

let introPlayed = false;

gsap.matchMedia().add(
  {
    wide: "(min-width: 961px)",
    fine: "(hover: hover) and (pointer: fine)",
    reduce: "(prefers-reduced-motion: reduce)",
  },
  (context) => {
    const { wide, fine, reduce } = context.conditions;
    const live = !reduce;
    const scope = new AbortController();
    const mode = { wide, fine, live, signal: scope.signal };

    // the pin goes first: every trigger made after it is measured with its spacer in place
    record(mode);
    navState();
    prices(mode);

    if (live) {
      if (!introPlayed) openCover(intro);
      introPlayed = true;
      reveals();
      drift(wide);
      if (fine) pointer(mode);
      ambient(field, mode);
    } else {
      openCover(() => {});
      field.pause();
    }

    return () => scope.abort();
  },
);

// fonts change every line length, and every trigger below them with it
document.fonts.ready.then(refresh);
addEventListener("load", refresh);
