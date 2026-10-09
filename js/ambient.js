/* What stays alive after the page has arrived. Low amplitude, nothing in
   step, and every loop is parked while its section is off screen. */

import { gsap, ScrollTrigger, park } from "./motion.js";

export function ambient(field, { signal }) {
  /* ---------- The first screen idles ---------- */
  park(".open", [
    // the scroll owns the svg's scale, so the breath goes on the group inside it
    gsap.to(".open-rings g", { scale: 1.035, duration: 9, repeat: -1, yoyo: true, ease: "sine.inOut" }),
    gsap.fromTo(
      ".open-scroll i",
      { scaleY: 0.35 },
      { scaleY: 1, duration: 1.3, repeat: -1, yoyo: true, ease: "sine.inOut" },
    ),
  ]);

  /* ---------- A ring swings out from each play disc ---------- */
  gsap.utils.toArray(".player").forEach((player, index) => {
    const ripple = gsap.fromTo(
      player.querySelector(".player-play b"),
      { scale: 1, opacity: 0.8 },
      { scale: 2, opacity: 0, duration: 2.2 + (index % 3) * 0.5, repeat: -1, repeatDelay: 0.6, ease: "power1.out" },
    );
    const view = park(player, [ripple]);
    // once the clip is playing there is no disc left to ring
    player.addEventListener("playing", () => { view.kill(); ripple.kill(); }, { once: true, signal });
  });

  /* ---------- The subject band runs, and takes its speed from the scroll ---------- */
  const band = gsap.to("#bandTrack", { xPercent: -50, duration: 36, repeat: -1, ease: "none" });
  // started deep into its repeats, so it can also run backwards without hitting its start
  band.totalTime(band.duration() * 50);
  park(".band", [band]);

  /* ---------- The point plotted on the active price beats ---------- */
  // the entrance owns --point, so the beat multiplies it through a variable of its own
  park(".price-list", [
    gsap.to(".price-list", { "--beat": 1.9, duration: 1.1, repeat: -1, yoyo: true, ease: "sine.inOut" }),
  ]);

  /* ---------- The field only draws while paper is showing ---------- */
  // these sections have their own ground. while one fills the screen the field is hidden behind it
  const covers = [];
  const rest = () => {
    if (document.hidden || covers.some((cover) => cover.isActive)) field.pause();
    else field.play();
  };
  [".record", ".witness", ".ledger"].forEach((section) => {
    covers.push(ScrollTrigger.create({ trigger: section, start: "top top", end: "bottom bottom", onToggle: rest }));
  });
  document.addEventListener("visibilitychange", rest, { signal });
  rest();

  /* ---------- Scroll velocity is an input ---------- */
  // it changes the speed of things already moving and nothing else
  let settle;
  ScrollTrigger.create({
    onUpdate: (self) => {
      const velocity = self.getVelocity();
      const speed = gsap.utils.clamp(1, 5, 1 + Math.abs(velocity) / 500);
      field.push(velocity);
      gsap.to(band, { timeScale: self.direction * speed, duration: 0.25, overwrite: true });
      settle?.kill();
      settle = gsap.delayedCall(0.3, () => gsap.to(band, { timeScale: self.direction, duration: 1.2, overwrite: true }));
    },
  });
}
