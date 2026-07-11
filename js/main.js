/* Kinetic editorial motion — GSAP + ScrollTrigger */

(() => {
  gsap.registerPlugin(ScrollTrigger);

  const nav = document.getElementById("mainNav");
  const toggle = document.getElementById("navToggle");
  const bar = document.getElementById("progressBar");
  const accent = document.getElementById("accentWord");
  const lesson = document.getElementById("lessonCard");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  });

  const mm = gsap.matchMedia();

  mm.add(
    {
      isDesktop: "(min-width: 901px)",
      isFine: "(pointer: fine)",
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      const { isDesktop, isFine, reduceMotion } = context.conditions;
      const live = !reduceMotion;

      gsap.defaults({ ease: "power3.out" });

      /* Progress bar (Zeigarnik) */
      if (bar) {
        gsap.to(bar, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: live ? 0.3 : true,
          },
        });
      }

      ScrollTrigger.create({
        start: 20,
        onUpdate: (self) => nav?.classList.toggle("is-scrolled", self.scroll() > 20),
      });

      /* Hero line masks + staggered content */
      const lines = gsap.utils.toArray(".hero-copy-col .line-inner");
      const heroBits = gsap.utils.toArray(".hero-copy-col .reveal, .lesson-card.reveal");

      if (live) {
        gsap.set(lines, { yPercent: 115 });
        gsap.set(heroBits, { autoAlpha: 0, y: 28 });

        gsap
          .timeline()
          .to(lines, { yPercent: 0, duration: 1.05, stagger: 0.11 }, 0.08)
          .to(heroBits, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1 }, 0.42)
          .add(() => accent?.classList.add("is-on"), 1.05);

        if (lesson) {
          gsap.from(".lesson-item", {
            autoAlpha: 0,
            x: -14,
            stagger: 0.09,
            duration: 0.55,
            delay: 1.05,
            ease: "power2.out",
          });
        }
      } else {
        gsap.set([...lines, ...heroBits], { clearProps: "all" });
        accent?.classList.add("is-on");
      }

      /* Hero scrub parallax */
      if (live && isDesktop) {
        gsap.to(".hero-copy-col h1", {
          y: -36,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero-grid",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
        gsap.to(".lesson-card", {
          y: -48,
          rotation: 0,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero-grid",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      /* Ambient floaters + pointer lean */
      if (live) {
        const floaters = gsap.utils.toArray(".floater");
        floaters.forEach((el, i) => {
          gsap.to(el, {
            y: i % 2 ? 22 : -26,
            rotation: i % 2 ? -6 : 7,
            duration: 4.5 + (i % 4),
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.25,
          });
        });

        if (isFine) {
          window.addEventListener(
            "pointermove",
            (e) => {
              const nx = (e.clientX / window.innerWidth - 0.5) * 2;
              floaters.forEach((el, i) => {
                gsap.to(el, {
                  x: nx * (12 + i * 2),
                  duration: 1.15,
                  ease: "power2.out",
                  overwrite: "auto",
                });
              });
            },
            { passive: true }
          );
        }
      }

      /* Scroll reveals (exclude hero + batched grids) */
      const rest = gsap.utils.toArray(".reveal").filter((el) => {
        if (el.closest(".hero-grid")) return false;
        if (el.matches(".video-grid .video-card, .price-card")) return false;
        return true;
      });

      if (live) {
        rest.forEach((el) => {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 48 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                toggleActions: "play none none none",
              },
            }
          );
        });

        ScrollTrigger.batch(".video-grid .video-card", {
          start: "top 90%",
          once: true,
          onEnter: (batch) =>
            gsap.fromTo(
              batch,
              { autoAlpha: 0, y: 56, scale: 0.97 },
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.75, stagger: 0.1, overwrite: true }
            ),
        });

        ScrollTrigger.batch(".price-card", {
          start: "top 90%",
          once: true,
          onEnter: (batch) =>
            gsap.fromTo(
              batch,
              { autoAlpha: 0, y: 40 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.7,
                stagger: 0.08,
                overwrite: true,
                onComplete: () => batch.forEach((c) => c.classList.add("is-shown")),
              }
            ),
        });

        gsap.utils.toArray(".section-rule").forEach((rule) => {
          gsap.fromTo(
            rule,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 1.1,
              ease: "power2.inOut",
              scrollTrigger: {
                trigger: rule,
                start: "top 95%",
                toggleActions: "play none none none",
              },
            }
          );
        });

        gsap.fromTo(
          ".quote-text",
          { autoAlpha: 0.4, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: ".quote-panel",
              start: "top 80%",
              end: "top 40%",
              scrub: true,
            },
          }
        );
      } else {
        gsap.set(rest, { clearProps: "all" });
        gsap.set(".video-grid .video-card, .price-card", { clearProps: "all" });
        document.querySelectorAll(".price-card").forEach((c) => c.classList.add("is-shown"));
      }

      /* Counters */
      document.querySelectorAll(".count").forEach((el) => {
        const target = Number(el.dataset.target);
        const obj = { val: 0 };
        ScrollTrigger.create({
          trigger: el,
          start: "top 92%",
          once: true,
          onEnter: () => {
            gsap.to(obj, {
              val: target,
              duration: live ? 1.55 : 0,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = String(Math.round(obj.val));
              },
            });
          },
        });
      });

      /* Magnetic CTAs */
      if (isFine && live) {
        document.querySelectorAll(".magnetic").forEach((btn) => {
          btn.addEventListener("pointermove", (e) => {
            const r = btn.getBoundingClientRect();
            gsap.to(btn, {
              x: (e.clientX - (r.left + r.width / 2)) * 0.22,
              y: (e.clientY - (r.top + r.height / 2)) * 0.22,
              duration: 0.35,
              ease: "power2.out",
              overwrite: "auto",
            });
          });
          btn.addEventListener("pointerleave", () => {
            gsap.to(btn, {
              x: 0,
              y: 0,
              duration: 0.55,
              ease: "elastic.out(1, 0.45)",
              overwrite: "auto",
            });
          });
        });
      }

      /* Lesson card tilt */
      if (isFine && live && lesson) {
        lesson.addEventListener("pointermove", (e) => {
          const r = lesson.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(lesson, {
            rotateY: px * 10,
            rotateX: -py * 8,
            transformPerspective: 800,
            duration: 0.4,
            ease: "power2.out",
            overwrite: "auto",
          });
        });
        lesson.addEventListener("pointerleave", () => {
          gsap.to(lesson, {
            rotateY: 0,
            rotateX: 0,
            duration: 0.7,
            ease: "power3.out",
            overwrite: "auto",
          });
        });
      }

      /* Card hover tilt */
      if (isFine && live) {
        document.querySelectorAll(".price-card, .quality-card, .video-card").forEach((card) => {
          card.addEventListener("pointermove", (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            gsap.to(card, {
              rotateX: -y * 6,
              rotateY: x * 6,
              y: -6,
              transformPerspective: 700,
              duration: 0.35,
              ease: "power2.out",
              overwrite: "auto",
            });
            if (card.classList.contains("price-card")) card.classList.add("is-hot");
          });
          card.addEventListener("pointerleave", () => {
            gsap.to(card, {
              rotateX: 0,
              rotateY: 0,
              y: 0,
              duration: 0.5,
              ease: "power3.out",
              overwrite: "auto",
            });
            card.classList.remove("is-hot");
          });
        });
      }

      /* Contact row motion */
      if (isFine && live) {
        document.querySelectorAll(".contact-row").forEach((row) => {
          const arrow = row.querySelector(".contact-arrow");
          row.addEventListener("pointerenter", () => {
            gsap.to(row, { x: 5, duration: 0.28, ease: "power2.out" });
            if (arrow) gsap.to(arrow, { x: 6, duration: 0.28, ease: "power2.out" });
          });
          row.addEventListener("pointerleave", () => {
            gsap.to(row, { x: 0, duration: 0.35, ease: "power2.out" });
            if (arrow) gsap.to(arrow, { x: 0, duration: 0.35, ease: "power2.out" });
          });
        });
      }

      if (document.fonts?.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
    }
  );
})();
