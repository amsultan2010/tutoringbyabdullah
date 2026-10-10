/* The record: the one pinned piece. On a fine pointer the strip of nine is
   pulled sideways under the scroll while the count turns over beside it.
   Everywhere else it is a plain sideways scroller and the count follows it. */

import { gsap, D, E } from "./motion.js";

export function record({ wide, fine, live, signal }) {
  const section = document.getElementById("record");
  const track = document.getElementById("recordTrack");
  const step = document.getElementById("recordStep");
  const tag = document.getElementById("recordTag");
  const bar = document.getElementById("recordBar");
  const marks = gsap.utils.toArray(".mark");
  const last = marks.length - 1;
  let active = 0;

  const show = (index) => {
    const turned = index - active;
    active = index;
    marks.forEach((mark, i) => mark.classList.toggle("is-active", i === index));
    step.textContent = marks[index].dataset.step;
    tag.textContent = marks[index].dataset.tag;
    return turned;
  };

  if (!(wide && fine && live)) {
    // the strip scrolls natively, so the count follows the card nearest the middle
    const follow = () => {
      const box = track.getBoundingClientRect();
      const middle = box.left + box.width / 2;
      let nearest = 0;
      let gap = Infinity;
      marks.forEach((mark, i) => {
        const r = mark.getBoundingClientRect();
        const d = Math.abs((r.left + r.right) / 2 - middle);
        if (d < gap) {
          gap = d;
          nearest = i;
        }
      });
      if (nearest !== active) show(nearest);
      bar.style.transform = `scaleX(${(nearest + 1) / marks.length})`;
    };

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        follow();
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true, signal });
    addEventListener("resize", onScroll, { signal });
    signal.addEventListener("abort", () => (bar.style.transform = ""));
    follow();
    return;
  }

  // from here the script owns the track, so the css scroller stands down
  section.classList.add("is-pinned");
  track.scrollLeft = 0;
  signal.addEventListener("abort", () => {
    section.classList.remove("is-pinned");
    // the focus tweens are made in a scroll callback, outside the context that
    // reverts everything else, and the pin puts the track's start back as it dies
    gsap.killTweensOf([marks, step]);
    gsap.set([track, marks, step], { clearProps: "transform,opacity" });
  });

  const edge = 24;
  const room = () => track.parentElement.clientWidth;
  const travel = () => Math.max(0, track.scrollWidth - room() + edge * 2);

  // the card the pen is on stays whole, its neighbours step back
  const focus = (index) => {
    const turned = show(index);
    marks.forEach((mark, i) => {
      const away = Math.abs(i - index);
      gsap.to(mark, {
        scale: away === 0 ? 1 : away === 1 ? 0.95 : 0.9,
        opacity: away === 0 ? 1 : away === 1 ? 0.6 : 0.38,
        duration: D.fast,
        ease: E.out,
        overwrite: "auto",
      });
    });
    // the count turns over like a wheel, in the direction of travel
    if (turned) gsap.fromTo(step, { yPercent: turned > 0 ? 110 : -110 }, { yPercent: 0, duration: D.fast, ease: E.out, overwrite: true });
  };

  focus(0);

  const slide = gsap.fromTo(
    track,
    { x: edge },
    {
      x: () => edge - travel(),
      ease: "none",
      scrollTrigger: {
        trigger: "#recordPin",
        start: "top top",
        end: () => `+=${Math.max(innerHeight * 1.5, travel() * 0.55)}`,
        pin: true,
        anticipatePin: 1,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          gsap.set(bar, { scaleX: (1 + self.progress * last) / marks.length });
          const index = Math.round(self.progress * last);
          if (index !== active) focus(index);
        },
      },
    },
  );

  // three layers in each card at three rates: the ghost keeps drifting the
  // whole way across, the figure and the copy settle as the card comes in
  marks.forEach((mark) => {
    const inCard = (start, end, amount) => ({
      trigger: mark,
      containerAnimation: slide,
      start: `left ${start}%`,
      end: `left ${end}%`,
      scrub: amount,
    });
    gsap.fromTo(
      mark.querySelector(".mark-ghost"),
      { xPercent: 14, yPercent: 8 },
      { xPercent: -14, yPercent: -6, ease: "none", scrollTrigger: inCard(100, 20, true) },
    );
    gsap.fromTo(
      mark.querySelector(".mark-stat"),
      { yPercent: 38, scale: 0.84, rotate: -3 },
      { yPercent: 0, scale: 1, rotate: 0, ease: "none", scrollTrigger: inCard(100, 74, true) },
    );
    gsap.fromTo(
      mark.querySelector(".mark-copy"),
      { y: 36, opacity: 0.2 },
      { y: 0, opacity: 1, ease: "none", scrollTrigger: inCard(98, 72, true) },
    );
  });
}
