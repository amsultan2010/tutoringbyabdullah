/* HTML/CSS/vanilla JS + GSAP + ScrollTrigger — kinetic editorial */

(() => {
  gsap.registerPlugin(ScrollTrigger);

  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const progress = document.getElementById("progress");
  const track = document.getElementById("ratesTrack");
  const marquee = document.getElementById("marquee");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const el = id && document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  });

  const mm = gsap.matchMedia();

  mm.add(
    {
      isDesktop: "(min-width: 961px)",
      isFine: "(pointer: fine)",
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    (ctx) => {
      const { isDesktop, isFine, reduceMotion } = ctx.conditions;
      const live = !reduceMotion;

      /* Progress */
      if (progress) {
        gsap.to(progress, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: live ? 0.35 : true,
          },
        });
      }

      ScrollTrigger.create({
        start: 12,
        onUpdate: (self) => nav?.classList.toggle("is-solid", self.scroll() > 12),
      });

      /* Hero line masks */
      const lines = gsap.utils.toArray(".hero h1 .line span");
      const enters = gsap.utils.toArray(".hero [data-enter]");

      if (live) {
        gsap.set(lines, { yPercent: 120 });
        gsap.set(enters, { autoAlpha: 0, y: 32 });

        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .to(lines, { yPercent: 0, duration: 1.1, stagger: 0.12 }, 0.15)
          .to(enters, { autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.1 }, 0.45);
      } else {
        gsap.set([...lines, ...enters], { clearProps: "all" });
      }

      /* Glyph drift + pointer lean */
      if (live) {
        const glyphs = gsap.utils.toArray(".glyph");
        glyphs.forEach((g, i) => {
          gsap.to(g, {
            y: i % 2 ? 40 : -48,
            rotation: i % 2 ? 8 : -10,
            duration: 5 + i,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.3,
          });
        });

        if (isFine) {
          window.addEventListener(
            "pointermove",
            (e) => {
              const nx = (e.clientX / innerWidth - 0.5) * 2;
              const ny = (e.clientY / innerHeight - 0.5) * 2;
              glyphs.forEach((g, i) => {
                gsap.to(g, {
                  x: nx * (18 + i * 6),
                  duration: 1.2,
                  ease: "power2.out",
                  overwrite: "auto",
                });
              });
              gsap.to(".grain", {
                x: nx * 8,
                y: ny * 6,
                duration: 1.4,
                ease: "power2.out",
                overwrite: "auto",
              });
            },
            { passive: true }
          );
        }

        gsap.to(".glyph-field", {
          y: 120,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      /* Infinite marquee */
      if (marquee && live) {
        const tw = marquee.scrollWidth / 3;
        gsap.to(marquee, {
          x: -tw,
          duration: 28,
          ease: "none",
          repeat: -1,
        });
      }

      /* Section enters */
      if (live) {
        gsap.utils.toArray("[data-enter]").forEach((el) => {
          if (el.closest(".hero")) return;
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 56 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.95,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                toggleActions: "play none none none",
              },
            }
          );
        });

        gsap.fromTo(
          ".quote-stage blockquote",
          { autoAlpha: 0.25, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: ".quote-stage",
              start: "top 85%",
              end: "top 40%",
              scrub: true,
            },
          }
        );

        ScrollTrigger.batch("[data-film]", {
          start: "top 92%",
          once: true,
          onEnter: (batch) =>
            gsap.fromTo(
              batch,
              { autoAlpha: 0, y: 48, rotate: 1.5 },
              { autoAlpha: 1, y: 0, rotate: 0, duration: 0.8, stagger: 0.1, overwrite: true }
            ),
        });
      } else {
        gsap.set("[data-enter], [data-film]", { clearProps: "all" });
      }

      /* Counters */
      document.querySelectorAll(".count").forEach((el) => {
        const to = Number(el.dataset.to);
        const obj = { v: 0 };
        ScrollTrigger.create({
          trigger: el,
          start: "top 95%",
          once: true,
          onEnter: () =>
            gsap.to(obj, {
              v: to,
              duration: live ? 1.6 : 0,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = String(Math.round(obj.v));
              },
            }),
        });
      });

      /* Horizontal rates scrub (desktop) */
      if (track) {
        const getDist = () => Math.max(0, track.scrollWidth - innerWidth);

        if (isDesktop && live) {
          gsap.to(track, {
            x: () => -getDist(),
            ease: "none",
            scrollTrigger: {
              trigger: "#ratesPin",
              start: "top 18%",
              end: () => `+=${getDist() + 200}`,
              pin: true,
              scrub: 0.65,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
        } else {
          gsap.set(track, { clearProps: "transform" });
          const pin = document.getElementById("ratesPin");
          if (pin) {
            pin.style.overflowX = "auto";
            pin.style.webkitOverflowScrolling = "touch";
          }
        }
      }

      /* Sticky about parallax on desktop */
      if (isDesktop && live) {
        gsap.to(".about-sticky", {
          y: 80,
          ease: "none",
          scrollTrigger: {
            trigger: "#method",
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });
      }

      /* Magnetic buttons */
      if (isFine && live) {
        document.querySelectorAll(".magnetic").forEach((btn) => {
          btn.addEventListener("pointermove", (e) => {
            const r = btn.getBoundingClientRect();
            gsap.to(btn, {
              x: (e.clientX - (r.left + r.width / 2)) * 0.28,
              y: (e.clientY - (r.top + r.height / 2)) * 0.28,
              duration: 0.3,
              ease: "power2.out",
              overwrite: "auto",
            });
          });
          btn.addEventListener("pointerleave", () => {
            gsap.to(btn, {
              x: 0,
              y: 0,
              duration: 0.6,
              ease: "elastic.out(1, 0.4)",
              overwrite: "auto",
            });
          });
        });

        document.querySelectorAll(".rate, .film").forEach((card) => {
          card.addEventListener("pointermove", (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            gsap.to(card, {
              rotateY: x * 8,
              rotateX: -y * 6,
              y: -4,
              transformPerspective: 800,
              duration: 0.35,
              ease: "power2.out",
              overwrite: "auto",
            });
          });
          card.addEventListener("pointerleave", () => {
            gsap.to(card, {
              rotateY: 0,
              rotateX: 0,
              y: 0,
              duration: 0.5,
              ease: "power3.out",
              overwrite: "auto",
            });
          });
        });
      }

      /* Contact board slam */
      if (live) {
        gsap.fromTo(
          ".contact-board",
          { autoAlpha: 0, y: 80, scale: 0.98 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 1.05,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".contact-board",
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      if (document.fonts?.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
    }
  );
})();
