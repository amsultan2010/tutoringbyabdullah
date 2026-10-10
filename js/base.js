/* What the page needs to work at all: the menu, anchors and the players.
   It imports nothing, so it still runs if the motion scripts never load. */

const nav = document.getElementById("nav");
const toggle = document.getElementById("navToggle");

/* ---------- Menu ---------- */
function setMenu(open) {
  nav.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  document.body.style.overflow = open ? "hidden" : "";
  // the smooth scroller ignores body overflow, so the motion script listens for this
  document.dispatchEvent(new CustomEvent("menu", { detail: { open } }));
}

if (nav && toggle) {
  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  nav.querySelectorAll(".nav-links a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !nav.classList.contains("is-open")) return;
    setMenu(false);
    toggle.focus();
  });
  // the menu only exists below this width, so widening the window closes it
  matchMedia("(min-width: 961px)").addEventListener("change", (e) => e.matches && setMenu(false));
}

// the bar takes a ground once the page has moved under it
if (nav) {
  const solid = () => nav.classList.toggle("is-solid", scrollY > 20);
  addEventListener("scroll", solid, { passive: true });
  solid();
}

/* ---------- Anchors ---------- */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const el = document.querySelector(a.getAttribute("href"));
    if (!el) return;
    e.preventDefault();
    // the motion script scrolls instead when it has a smooth scroller
    const go = new CustomEvent("anchor", { detail: { el }, cancelable: true });
    if (!document.dispatchEvent(go)) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  });
});

/* ---------- Click-to-play YouTube ---------- */
document.querySelectorAll(".player[data-yt]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.classList.contains("is-playing")) return;
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${btn.dataset.yt}?autoplay=1&rel=0`;
    iframe.title = btn.dataset.title || "video";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    btn.querySelector("img")?.remove();
    btn.appendChild(iframe);
    btn.classList.add("is-playing");
    btn.dispatchEvent(new CustomEvent("playing", { bubbles: true }));
  });
});
