/* Motion entry. Three designs, not one scaled down: a fine pointer gets the
   whole thing, touch keeps the one-shots and the loops, and reduced motion
   gets the finished page and nothing that travels. */

import { gsap, lenis, refresh } from "./motion.js";
import { initField } from "./field.js";
import { intro, reveals, drift, navState, prices } from "./reveals.js";
import { record } from "./record.js";
import { pointer } from "./pointer.js";

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

const field = initField(document.getElementById("field"), () => matchMedia("(prefers-reduced-motion: reduce)").matches);

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
      field.play();
      if (!introPlayed) intro();
      introPlayed = true;
      reveals();
      drift(wide);
      if (fine) pointer(mode);
    } else {
      field.pause();
    }

    return () => scope.abort();
  },
);

// fonts change every line length, and every trigger below them with it
document.fonts.ready.then(refresh);
addEventListener("load", refresh);
