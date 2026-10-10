/* One place for gsap, the timing tokens and the smooth scroller.
   Every other module imports from here, never from the globals. */

const { gsap, ScrollTrigger, SplitText, CustomEase, DrawSVGPlugin, Lenis } = window;

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, DrawSVGPlugin);
ScrollTrigger.config({ ignoreMobileResize: true });

CustomEase.create("out", "0.16, 1, 0.3, 1");
CustomEase.create("inOut", "0.65, 0, 0.35, 1");

export const D = { fast: 0.35, base: 0.7, slow: 1.1, epic: 1.6 };
export const E = { out: "out", inOut: "inOut" };

export const fine = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
export const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// touch devices keep their own momentum scrolling. lenis re-implements it in
// javascript, which on a phone is slower than the thing it replaces
export let lenis = null;
if (fine() && !still()) {
  lenis = new Lenis({
    autoRaf: false,
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

export const refresh = () => {
  ScrollTrigger.refresh();
  lenis?.resize();
};

// a loop only earns its frame cost while it is visible
export function park(trigger, tweens) {
  const view = ScrollTrigger.create({
    trigger,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => tweens.forEach((tween) => (self.isActive ? tween.play() : tween.pause())),
  });
  if (!view.isActive) tweens.forEach((tween) => tween.pause());
  return view;
}

export { gsap, ScrollTrigger, SplitText };
