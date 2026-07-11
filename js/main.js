/* Kinetic editorial — denser ScrollTrigger choreography */

(() => {
  gsap.registerPlugin(ScrollTrigger);

  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const progress = document.getElementById("progress");
  const track = document.getElementById("ratesTrack");
  const marquee = document.getElementById("marquee");
  const filmRail = document.getElementById("filmRail");

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

      gsap.defaults({ ease: "power3.out" });

      /* Progress — Zeigarnik */
      if (progress) {
        gsap.to(progress, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: live ? 0.25 : true,
          },
        });
      }

      ScrollTrigger.create({
        start: 10,
        onUpdate: (self) => nav?.classList.toggle("is-solid", self.scroll() > 10),
      });

      /* Spy dots */
      const spyLinks = gsap.utils.toArray("#spy [data-spy]");
      const spyMap = [
        { id: "top", el: document.getElementById("top") },
        { id: "proof", el: document.getElementById("proof") },
        { id: "method", el: document.getElementById("method") },
        { id: "rates", el: document.getElementById("rates") },
        { id: "contact", el: document.getElementById("contact") },
      ];
      spyMap.forEach(({ id, el }) => {
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (!self.isActive) return;
            spyLinks.forEach((a) => a.classList.toggle("is-active", a.dataset.spy === id));
          },
        });
      });
      spyLinks[0]?.classList.add("is-active");

      /* Hero entrance */
      const lines = gsap.utils.toArray(".hero h1 .line span");
      const enters = gsap.utils.toArray(".hero [data-enter]");
      const sessionItems = gsap.utils.toArray(".session-rows li");

      if (live) {
        gsap.set(lines, { yPercent: 120 });
        gsap.set(enters, { autoAlpha: 0, y: 24 });
        gsap.set(sessionItems, { autoAlpha: 0, x: -16 });

        gsap
          .timeline()
          .to(lines, { yPercent: 0, duration: 1, stagger: 0.1 }, 0.1)
          .to(enters, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.35)
          .to(sessionItems, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.07 }, 0.7);

        gsap.to(".hero h1", {
          y: -28,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        gsap.to(".hero-side", {
          y: -16,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      } else {
        gsap.set([...lines, ...enters, ...sessionItems], { clearProps: "all" });
      }

      /* Glyphs */
      if (live) {
        const glyphs = gsap.utils.toArray(".glyph");
        glyphs.forEach((g, i) => {
          gsap.to(g, {
            y: i % 2 ? 36 : -42,
            rotation: i % 2 ? 7 : -9,
            duration: 4.5 + i,
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
              const nx = (e.clientX / innerWidth - 0.5) * 2;
              const ny = (e.clientY / innerHeight - 0.5) * 2;
              glyphs.forEach((g, i) => {
                gsap.to(g, {
                  x: nx * (16 + i * 5),
                  duration: 1.1,
                  ease: "power2.out",
                  overwrite: "auto",
                });
              });
              gsap.to(".grain", {
                x: nx * 6,
                y: ny * 5,
                duration: 1.3,
                ease: "power2.out",
                overwrite: "auto",
              });
            },
            { passive: true }
          );
        }

        gsap.to(".glyph-field", {
          y: 160,
          ease: "none",
          scrollTrigger: {
            trigger: "main",
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });
      }

      /* Marquee + velocity bump on scroll */
      if (marquee && live) {
        const tw = marquee.scrollWidth / 3;
        const mq = gsap.to(marquee, {
          x: -tw,
          duration: 22,
          ease: "none",
          repeat: -1,
        });

        ScrollTrigger.create({
          onUpdate: (self) => {
            const v = Math.min(Math.abs(self.getVelocity()) / 800, 2.5);
            mq.timeScale(1 + v);
          },
        });
      }

      /* Generic section enters */
      if (live) {
        gsap.utils.toArray("[data-enter]").forEach((el) => {
          if (el.closest(".hero")) return;
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 40 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              scrollTrigger: {
                trigger: el,
                start: "top 90%",
                toggleActions: "play none none none",
              },
            }
          );
        });

        /* Heading clip / scrub */
        gsap.utils.toArray(".anim-head").forEach((h) => {
          gsap.fromTo(
            h,
            { y: 36, autoAlpha: 0.35 },
            {
              y: 0,
              autoAlpha: 1,
              ease: "none",
              scrollTrigger: {
                trigger: h,
                start: "top 92%",
                end: "top 55%",
                scrub: true,
              },
            }
          );
        });

        /* Quote scrub + scale */
        gsap.fromTo(
          ".quote-stage blockquote",
          { autoAlpha: 0.2, y: 50, scale: 0.97 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".quote-stage",
              start: "top 90%",
              end: "top 35%",
              scrub: true,
            },
          }
        );

        gsap.fromTo(
          ".quote-stage cite",
          { autoAlpha: 0, x: -20 },
          {
            autoAlpha: 1,
            x: 0,
            ease: "none",
            scrollTrigger: {
              trigger: ".quote-stage",
              start: "top 70%",
              end: "top 40%",
              scrub: true,
            },
          }
        );

        /* Kickers draw */
        gsap.utils.toArray(".kicker").forEach((k) => {
          gsap.fromTo(
            k,
            { autoAlpha: 0, x: -18 },
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.6,
              scrollTrigger: {
                trigger: k,
                start: "top 92%",
                toggleActions: "play none none none",
              },
            }
          );
        });
      } else {
        gsap.set("[data-enter], [data-film], .anim-head, .kicker", { clearProps: "all" });
      }

      /* Film rail — compact grid (no full-screen pin) */
      if (filmRail && live) {
        const films = gsap.utils.toArray("[data-film]");
        gsap.set(films, { autoAlpha: 0, y: 28 });

        ScrollTrigger.batch(films, {
          start: "top 92%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              stagger: 0.07,
              duration: 0.65,
              overwrite: true,
            }),
        });

        if (isDesktop) {
          films.forEach((film) => {
            gsap.fromTo(
              film.querySelector(".film-frame"),
              { y: 24 },
              {
                y: 0,
                ease: "none",
                scrollTrigger: {
                  trigger: film,
                  start: "top 95%",
                  end: "top 55%",
                  scrub: true,
                },
              }
            );
          });
        }
      }

      /* Credo highlight as you scroll — Miller + Zeigarnik */
      if (live) {
        gsap.utils.toArray(".credo article").forEach((article) => {
          ScrollTrigger.create({
            trigger: article,
            start: "top 65%",
            end: "bottom 45%",
            onEnter: () => article.classList.add("is-on"),
            onEnterBack: () => article.classList.add("is-on"),
            onLeave: () => article.classList.remove("is-on"),
            onLeaveBack: () => article.classList.remove("is-on"),
          });

          gsap.fromTo(
            article,
            { autoAlpha: 0, x: 28 },
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.7,
              scrollTrigger: {
                trigger: article,
                start: "top 88%",
                toggleActions: "play none none none",
              },
            }
          );
        });

        gsap.from(".glance div", {
          autoAlpha: 0,
          y: 20,
          stagger: 0.08,
          duration: 0.55,
          scrollTrigger: {
            trigger: ".glance",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
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
              duration: live ? 1.45 : 0,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = String(Math.round(obj.v));
              },
            }),
        });
      });

      /* Rates horizontal scrub + focus card */
      if (track) {
        const rates = gsap.utils.toArray(".rate");
        const getDist = () => Math.max(0, track.scrollWidth - innerWidth);

        if (isDesktop && live) {
          gsap.set(rates, { autoAlpha: 0.35, scale: 0.94 });

          const rateTween = gsap.to(track, {
            x: () => -getDist(),
            ease: "none",
            scrollTrigger: {
              trigger: "#ratesPin",
              start: "top 22%",
              end: () => `+=${getDist() + 160}`,
              pin: true,
              scrub: 0.55,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                const i = Math.min(rates.length - 1, Math.round(self.progress * (rates.length - 1)));
                rates.forEach((r, idx) => r.classList.toggle("is-focus", idx === i));
              },
            },
          });

          rates.forEach((rate) => {
            gsap.to(rate, {
              autoAlpha: 1,
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: rate,
                containerAnimation: rateTween,
                start: "left 85%",
                end: "left 45%",
                scrub: true,
              },
            });

            gsap.fromTo(
              rate.querySelector(".cost"),
              { y: 24, autoAlpha: 0.3 },
              {
                y: 0,
                autoAlpha: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: rate,
                  containerAnimation: rateTween,
                  start: "left 80%",
                  end: "left 40%",
                  scrub: true,
                },
              }
            );
          });

          gsap.to(".rates-hint .scroll-arr", {
            x: 8,
            duration: 0.8,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        } else {
          gsap.set(track, { clearProps: "transform" });
          gsap.set(rates, { clearProps: "all" });
          const pin = document.getElementById("ratesPin");
          if (pin) {
            pin.style.overflowX = "auto";
            pin.style.webkitOverflowScrolling = "touch";
          }
        }
      }

      /* Formula rows */
      if (live) {
        gsap.from(".formula li", {
          autoAlpha: 0,
          x: 24,
          stagger: 0.1,
          duration: 0.55,
          scrollTrigger: {
            trigger: ".formula",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }

      /* About sticky scrub */
      if (isDesktop && live) {
        gsap.to(".about-sticky", {
          y: 60,
          ease: "none",
          scrollTrigger: {
            trigger: "#method",
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });
      }

      /* Magnetic + tilts */
      if (isFine && live) {
        document.querySelectorAll(".magnetic").forEach((btn) => {
          btn.addEventListener("pointermove", (e) => {
            const r = btn.getBoundingClientRect();
            gsap.to(btn, {
              x: (e.clientX - (r.left + r.width / 2)) * 0.3,
              y: (e.clientY - (r.top + r.height / 2)) * 0.3,
              duration: 0.28,
              ease: "power2.out",
              overwrite: "auto",
            });
          });
          btn.addEventListener("pointerleave", () => {
            gsap.to(btn, {
              x: 0,
              y: 0,
              duration: 0.55,
              ease: "elastic.out(1, 0.4)",
              overwrite: "auto",
            });
          });
        });

        document.querySelectorAll(".rate, .film, .credo article").forEach((card) => {
          card.addEventListener("pointermove", (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            gsap.to(card, {
              rotateY: x * 7,
              rotateX: -y * 5,
              y: -3,
              transformPerspective: 800,
              duration: 0.3,
              ease: "power2.out",
              overwrite: "auto",
            });
          });
          card.addEventListener("pointerleave", () => {
            gsap.to(card, {
              rotateY: 0,
              rotateX: 0,
              y: 0,
              duration: 0.45,
              ease: "power3.out",
              overwrite: "auto",
            });
          });
        });
      }

      /* Contact Peak-End sequence */
      if (live) {
        const contactTl = gsap.timeline({
          scrollTrigger: {
            trigger: ".contact-board",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });

        contactTl
          .fromTo(
            ".contact-board",
            { autoAlpha: 0, y: 60, scale: 0.98 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 0.9 }
          )
          .from(
            ".contact-blast h2, .contact-blast p, .contact-blast .btn",
            { autoAlpha: 0, y: 24, stagger: 0.1, duration: 0.55 },
            "-=0.4"
          )
          .from(
            ".ways a, .ways .way",
            { autoAlpha: 0, x: 20, stagger: 0.08, duration: 0.45 },
            "-=0.25"
          );
      }

      if (document.fonts?.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
    }
  );
})();
