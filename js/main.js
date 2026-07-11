/* Original layout + palette, kinetic layer via GSAP + ScrollTrigger */

(() => {
  gsap.registerPlugin(ScrollTrigger);

  const bar = document.getElementById("progressBar");
  const nav = document.getElementById("mainNav");
  const accentWord = document.getElementById("accentWord");

  const mm = gsap.matchMedia();

  mm.add(
    {
      isFine: "(pointer: fine)",
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      const { isFine, reduceMotion } = context.conditions;
      const dur = reduceMotion ? 0 : 1;

      /* Progress bar */
      if (bar) {
        gsap.to(bar, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: reduceMotion ? true : 0.25,
          },
        });
      }

      /* Sticky nav shadow */
      ScrollTrigger.create({
        start: 24,
        onUpdate: (self) => {
          nav?.classList.toggle("scrolled", self.scroll() > 24);
        },
      });

      /* Hero entrance */
      const heroReveals = gsap.utils.toArray(".hero-grid .reveal");
      if (heroReveals.length) {
        if (dur) {
          gsap.set(heroReveals, { autoAlpha: 0, y: 36 });
          gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .to(heroReveals, {
              autoAlpha: 1,
              y: 0,
              duration: 0.85,
              stagger: 0.12,
            })
            .add(() => {
              if (accentWord) {
                accentWord.classList.add("animate");
                gsap.fromTo(
                  accentWord,
                  { "--underline": 0 },
                  {
                    duration: 0.7,
                    ease: "power2.out",
                    onStart: () => accentWord.classList.add("animate"),
                  }
                );
              }
            }, "-=0.35");
        } else {
          gsap.set(heroReveals, { clearProps: "all" });
          accentWord?.classList.add("animate");
        }
      }

      /* Section scroll reveals */
      const otherReveals = gsap.utils
        .toArray(".reveal")
        .filter((el) => !el.closest(".hero-grid"));

      if (dur) {
        otherReveals.forEach((el) => {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 40 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                toggleActions: "play none none none",
              },
            }
          );
        });
      } else {
        gsap.set(otherReveals, { clearProps: "all" });
      }

      /* Stat counters */
      document.querySelectorAll(".count").forEach((el) => {
        const target = Number(el.dataset.target);
        const obj = { val: 0 };
        ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          once: true,
          onEnter: () => {
            gsap.to(obj, {
              val: target,
              duration: reduceMotion ? 0 : 1.5,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = String(Math.round(obj.val));
              },
            });
          },
        });
      });

      /* Floating math symbols */
      if (dur) {
        gsap.utils.toArray(".floater").forEach((el, i) => {
          const yAmp = 18 + (i % 4) * 6;
          const rot = i % 2 === 0 ? 5 : -5;
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 0 },
            {
              autoAlpha: 0.1,
              y: -yAmp,
              rotation: rot,
              duration: 5 + (i % 5),
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              delay: i * 0.35,
            }
          );
        });
      }

      /* Soft parallax on lesson card */
      if (dur) {
        gsap.to(".lesson-card", {
          y: -28,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero-grid",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      /* Price / quality card tilt on hover */
      if (isFine && dur) {
        document.querySelectorAll(".price-card, .quality-card").forEach((card) => {
          const onMove = (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            gsap.to(card, {
              rotateX: -y * 7,
              rotateY: x * 7,
              y: -5,
              transformPerspective: 700,
              duration: 0.35,
              ease: "power2.out",
              overwrite: "auto",
            });
          };
          const onLeave = () => {
            gsap.to(card, {
              rotateX: 0,
              rotateY: 0,
              y: 0,
              duration: 0.5,
              ease: "power3.out",
              overwrite: "auto",
            });
          };
          card.addEventListener("mousemove", onMove);
          card.addEventListener("mouseleave", onLeave);
        });
      }

      /* Contact rows: arrow nudge */
      if (isFine && dur) {
        document.querySelectorAll(".contact-row").forEach((row) => {
          const arrow = row.querySelector(".contact-arrow");
          if (!arrow) return;
          row.addEventListener("mouseenter", () => {
            gsap.to(arrow, { x: 5, duration: 0.25, ease: "power2.out" });
          });
          row.addEventListener("mouseleave", () => {
            gsap.to(arrow, { x: 0, duration: 0.3, ease: "power2.out" });
          });
        });
      }

      /* Section divider draw-in */
      if (dur) {
        gsap.utils.toArray(".section-divider").forEach((line) => {
          gsap.fromTo(
            line,
            { scaleX: 0, transformOrigin: "left center" },
            {
              scaleX: 1,
              duration: 1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: line,
                start: "top 95%",
                toggleActions: "play none none none",
              },
            }
          );
        });
      }

      if (document.fonts?.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
    }
  );
})();
