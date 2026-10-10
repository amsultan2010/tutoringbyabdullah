/* What the page does under a fine pointer, before any click. None of this
   exists on touch or under reduced motion, and nothing here reveals content. */

import { gsap, D, E } from "./motion.js";

const quick = (el, prop, duration = 0.3) => gsap.quickTo(el, prop, { duration, ease: "power3.out" });

export function pointer({ signal }) {
  const on = (el, type, fn) => el.addEventListener(type, fn, { passive: true, signal });

  /* ---------- A compass ring follows the pointer and says what a click does ---------- */
  const pen = document.createElement("div");
  pen.className = "pen";
  pen.setAttribute("aria-hidden", "true");
  pen.innerHTML = "<i></i><span></span>";
  document.body.append(pen);
  signal.addEventListener("abort", () => pen.remove());

  const label = pen.lastChild;
  gsap.set(pen, { xPercent: -50, yPercent: -50 });
  const penX = quick(pen, "x", 0.18);
  const penY = quick(pen, "y", 0.18);

  on(window, "pointermove", (e) => {
    pen.classList.add("is-active");
    penX(e.clientX);
    penY(e.clientY);
  });
  on(document.documentElement, "pointerleave", () => pen.classList.remove("is-active"));
  // the ring changes ink with the ground it is over
  on(document, "pointerover", (e) => pen.classList.toggle("on-ink", !!e.target.closest(".record, .ledger")));

  document.querySelectorAll("a, button").forEach((target) => {
    on(target, "pointerenter", () => {
      pen.classList.add("is-hovering");
      label.textContent = target.dataset.cursor || "";
      pen.classList.toggle("is-labelled", !!target.dataset.cursor && !target.classList.contains("is-playing"));
    });
    on(target, "pointerleave", () => pen.classList.remove("is-hovering", "is-labelled"));
  });

  /* ---------- Buttons are pulled toward the pointer ---------- */
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const x = quick(el, "x");
    const y = quick(el, "y");
    on(el, "pointermove", (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.28);
      y((e.clientY - r.top - r.height / 2) * 0.28);
    });
    on(el, "pointerleave", () => { x(0); y(0); });
  });

  /* ---------- Stills: the disc is drawn to the pointer, the picture leans away ---------- */
  document.querySelectorAll(".player").forEach((player) => {
    const disc = player.querySelector(".player-play i");
    const img = player.querySelector("img");
    const discX = quick(disc, "x");
    const discY = quick(disc, "y");
    // the scroll owns the picture's scale, so the lean stays on x and y
    const imgX = quick(img, "x", 0.9);
    const imgY = quick(img, "y", 0.9);
    on(player, "pointermove", (e) => {
      const r = player.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      discX(px * r.width * 0.3);
      discY(py * r.height * 0.3);
      imgX(px * -14);
      imgY(py * -14);
    });
    on(player, "pointerleave", () => { discX(0); discY(0); imgX(0); imgY(0); });
  });

  /* ---------- Contact rows: three parts on three offsets ---------- */
  document.querySelectorAll(".reach li").forEach((row) => {
    const link = row.querySelector("a");
    if (!link) return;
    const glyph = row.querySelector(".swap .icon");

    // from here the script owns the row, so the css fallback stands down
    row.classList.add("is-wired");
    signal.addEventListener("abort", () => row.classList.remove("is-wired", "is-hot"));

    const lean = gsap
      .timeline({ paused: true, defaults: { duration: D.fast, ease: E.out } })
      .to(row.querySelector("span"), { x: 12 }, 0)
      .to(row.querySelector("strong"), { x: -12 }, 0.04);

    // the arrow leaves through one corner of its window and comes back in
    // through the other: two tweens with a jump between them
    const swap = gsap
      .timeline({ paused: true })
      .to(glyph, { xPercent: 110, yPercent: -110, duration: 0.2, ease: "power2.in" })
      .set(glyph, { xPercent: -110, yPercent: 110 })
      .to(glyph, { xPercent: 0, yPercent: 0, duration: D.fast, ease: E.out });

    const enter = () => { row.classList.add("is-hot"); lean.play(); swap.restart(); };
    const leave = () => { row.classList.remove("is-hot"); lean.reverse(); };
    on(link, "pointerenter", enter);
    on(link, "pointerleave", leave);
    // the keyboard gets the same row
    on(link, "focus", enter);
    on(link, "blur", leave);
  });

  /* ---------- The name answers like keys: letters dip under the pointer ---------- */
  const name = document.querySelector(".open-name");
  // the intro owns yPercent on these, so the dip goes on y
  const keys = gsap.utils.toArray(".open-name .char").map((char) => ({ char, dip: quick(char, "y", 0.5) }));
  on(name, "pointermove", (e) => {
    keys.forEach(({ char, dip }) => {
      const r = char.getBoundingClientRect();
      const reach = r.height * 0.9;
      const gap = Math.abs(e.clientX - (r.left + r.width / 2));
      const inLine = e.clientY > r.top - r.height * 0.2 && e.clientY < r.bottom + r.height * 0.2;
      dip(inLine && gap < reach ? 0.06 * r.height * (1 - gap / reach) : 0);
    });
  });
  on(name, "pointerleave", () => keys.forEach(({ dip }) => dip(0)));
}
