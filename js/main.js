/* Chapter narrative — GSAP + ScrollTrigger + constellation field */

(() => {
  gsap.registerPlugin(ScrollTrigger);

  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const progress = document.getElementById("progress");
  const methodTrack = document.getElementById("methodTrack");
  const recordTrack = document.getElementById("recordTrack");
  const bandTrack = document.getElementById("bandTrack");
  const field = document.getElementById("field");

  /* ---------- Nav ---------- */
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
    });
    nav.querySelectorAll(".nav-links a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
        document.body.style.overflow = "";
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

  /* ---------- Click-to-play YouTube ---------- */
  document.querySelectorAll(".player[data-yt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("is-playing")) return;
      const id = btn.getAttribute("data-yt");
      const title = btn.getAttribute("data-title") || "video";
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
      iframe.title = title;
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      btn.querySelector("img")?.remove();
      btn.appendChild(iframe);
      btn.classList.add("is-playing");
    });
  });

  /* ---------- Quote word split ---------- */
  document.querySelectorAll("[data-words]").forEach((el) => {
    const text = el.textContent.trim();
    el.textContent = "";
    text.split(/(\s+)/).forEach((chunk) => {
      if (/^\s+$/.test(chunk)) {
        el.appendChild(document.createTextNode(chunk));
        return;
      }
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = chunk;
      el.appendChild(span);
    });
  });

  /* ---------- Constellation / soft terrain field (auto-drift, no mouse) ---------- */
  function initField() {
    if (!field) return () => {};
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = field.getContext("2d");
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let stars = [];

    const seed = (i) => {
      const x = Math.sin(i * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };

    const build = () => {
      const count = w < 700 ? 56 : 88;
      stars = Array.from({ length: count }, (_, i) => {
        const r1 = seed(i + 1);
        const r2 = seed(i + 41);
        const r3 = seed(i + 97);
        const r4 = seed(i + 211);
        return {
          x: r1,
          y: r2,
          z: 0.35 + r3 * 0.65,
          r: 1 + r3 * 1.8,
          phase: r1 * Math.PI * 2,
          speed: 0.55 + r4 * 0.9,
          orbit: 10 + r3 * 22,
        };
      });
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      field.width = Math.floor(w * dpr);
      field.height = Math.floor(h * dpr);
      field.style.width = `${w}px`;
      field.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    const project = (s, t) => {
      const driftX = Math.sin(t * 0.28 * s.speed + s.phase) * s.orbit * s.z;
      const driftY = Math.cos(t * 0.22 * s.speed + s.phase * 1.3) * s.orbit * 0.75 * s.z;
      const wanderX = Math.sin(t * 0.08 + s.phase * 2.1) * 14;
      const wanderY = Math.cos(t * 0.06 + s.phase * 1.7) * 12;
      return {
        x: s.x * w + driftX + wanderX,
        y: s.y * h + driftY + wanderY,
      };
    };

    const draw = (time) => {
      const t = time * 0.001;
      ctx.clearRect(0, 0, w, h);

      /* Soft terrain ridges — continuous wave motion */
      ctx.lineWidth = 1;
      const rows = 9;
      for (let i = 0; i < rows; i++) {
        const baseY = ((i + 1) / (rows + 1)) * h;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(33, 92, 78, ${0.09 + i * 0.012})`;
        for (let x = 0; x <= w; x += 8) {
          const nx = x / w;
          const wave =
            Math.sin(nx * Math.PI * 2.2 + t * 0.45 + i * 0.4) * 22 +
            Math.sin(nx * Math.PI * 5.1 - t * 0.35 + i) * 10 +
            Math.cos(t * 0.2 + i * 0.5) * 6;
          const y = baseY + wave;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      /* Constellation links */
      const pts = stars.map((s) => ({ ...project(s, t), z: s.z, r: s.r, phase: s.phase }));
      const linkDist = Math.min(w, h) * 0.2;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < linkDist) {
            const a = (1 - d / linkDist) * 0.28 * Math.min(pts[i].z, pts[j].z);
            ctx.strokeStyle = `rgba(33, 92, 78, ${a})`;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      /* Stars */
      pts.forEach((p) => {
        const pulse = 0.55 + Math.sin(t * 1.8 + p.phase) * 0.3;
        const alpha = 0.28 + p.z * 0.4 * pulse;
        ctx.fillStyle = `rgba(33, 92, 78, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.z, 0, Math.PI * 2);
        ctx.fill();

        if (p.phase > 5) {
          ctx.fillStyle = `rgba(196, 146, 90, ${alpha * 0.55})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.8, p.r * 0.45), 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (!reduce) raf = requestAnimationFrame(draw);
    };

    resize();
    if (reduce) {
      draw(0);
    } else {
      raf = requestAnimationFrame(draw);
    }
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }

  const killField = initField();

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

      if (progress) {
        gsap.to(progress, {
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
        onUpdate: (self) => nav?.classList.toggle("is-solid", self.scroll() > 20),
      });

      if (isFine && live) {
        document.querySelectorAll("[data-magnetic]").forEach((el) => {
          const move = (e) => {
            const r = el.getBoundingClientRect();
            gsap.to(el, {
              x: (e.clientX - (r.left + r.width / 2)) * 0.28,
              y: (e.clientY - (r.top + r.height / 2)) * 0.28,
              duration: 0.4,
              ease: "power3.out",
            });
          };
          const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.65, ease: "elastic.out(1, 0.45)" });
          el.addEventListener("mousemove", move);
          el.addEventListener("mouseleave", leave);
          ctx.add(() => {
            el.removeEventListener("mousemove", move);
            el.removeEventListener("mouseleave", leave);
          });
        });
      }

      if (live) {
        /* Open — line masks + soft exit scrub */
        gsap.set(".open-line > span", { yPercent: 120 });
        gsap.set([".open-meta", ".open-role", ".open-scroll"], { autoAlpha: 0, y: 20 });

        gsap
          .timeline()
          .to(".open-line > span", { yPercent: 0, duration: 1.3, stagger: 0.14, ease: "power4.out" }, 0.12)
          .to([".open-meta", ".open-role"], { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1 }, 0.5)
          .to(".open-scroll", { autoAlpha: 1, y: 0, duration: 0.65 }, 1);

        gsap.to(".open-stage", {
          y: 90,
          scale: 0.94,
          autoAlpha: 0.2,
          filter: "blur(2px)",
          ease: "none",
          scrollTrigger: {
            trigger: ".open",
            start: "center top",
            end: "bottom top",
            scrub: true,
          },
        });

        /* Field parallax on scroll */
        gsap.to(".field", {
          y: 80,
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });
      }

      const revealLines = (selector) => {
        document.querySelectorAll(selector).forEach((title) => {
          const lines = title.querySelectorAll(".t-line > span");
          if (!lines.length || !live) return;
          gsap.set(lines, { yPercent: 115 });
          gsap.to(lines, {
            yPercent: 0,
            duration: 1.05,
            stagger: 0.08,
            ease: "power4.out",
            scrollTrigger: {
              trigger: title,
              start: "top 84%",
              toggleActions: "play none none reverse",
            },
          });
        });
      };

      revealLines(".thesis-title");
      revealLines(".section-title");
      revealLines(".book-title");

      if (live) {
        gsap.from([".thesis-lede", ".thesis-actions", ".thesis-aside"], {
          autoAlpha: 0,
          y: 28,
          duration: 0.9,
          stagger: 0.1,
          scrollTrigger: {
            trigger: ".thesis-inner",
            start: "top 78%",
            toggleActions: "play none none reverse",
          },
        });

        /* Thesis title parallax scrub */
        gsap.to(".thesis-title", {
          y: -30,
          ease: "none",
          scrollTrigger: {
            trigger: ".thesis",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });

        /* Aside cells stagger in */
        gsap.from(".aside-list li", {
          autoAlpha: 0,
          y: 20,
          duration: 0.7,
          stagger: 0.08,
          scrollTrigger: {
            trigger: ".thesis-aside",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });

        gsap.from(".section-lede", {
          autoAlpha: 0,
          y: 18,
          duration: 0.8,
          scrollTrigger: {
            trigger: ".section-lede",
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
          stagger: 0.05,
        });

        /* Accent wash pulse on buttons */
        gsap.utils.toArray(".btn").forEach((btn) => {
          btn.addEventListener("mouseenter", () => {
            gsap.fromTo(
              btn,
              { boxShadow: "0 0 0 0 rgba(33, 92, 78, 0)" },
              {
                boxShadow: "0 12px 28px -8px rgba(33, 92, 78, 0.45)",
                duration: 0.35,
                overwrite: "auto",
              }
            );
          });
          btn.addEventListener("mouseleave", () => {
            gsap.to(btn, {
              boxShadow: "0 0 0 0 rgba(33, 92, 78, 0)",
              duration: 0.45,
              overwrite: "auto",
            });
          });
        });

        const words = gsap.utils.toArray(".witness-quote .word");
        if (words.length) {
          gsap.to(words, {
            opacity: 1,
            stagger: 0.04,
            ease: "none",
            scrollTrigger: {
              trigger: ".witness-quote",
              start: "top 75%",
              end: "bottom 50%",
              scrub: 0.5,
            },
          });
        }

        gsap.from(".cinema-media", {
          autoAlpha: 0,
          y: 36,
          duration: 1,
          scrollTrigger: {
            trigger: ".cinema",
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });

        gsap.from(".cinema-copy", {
          autoAlpha: 0,
          y: 36,
          duration: 1,
          delay: 0.08,
          scrollTrigger: {
            trigger: ".cinema",
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });

        gsap.utils.toArray(".player img").forEach((img) => {
          gsap.fromTo(
            img,
            { scale: 1.9 },
            {
              scale: 1.65,
              ease: "none",
              scrollTrigger: {
                trigger: img.closest(".player"),
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        });

        gsap.from(".reel-item", {
          autoAlpha: 0,
          y: 40,
          duration: 0.85,
          stagger: 0.1,
          scrollTrigger: {
            trigger: ".reel",
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        });

        /* Reel horizontal nudge on scroll velocity */
        if (isFine) {
          const reel = document.getElementById("reel");
          if (reel) {
            ScrollTrigger.create({
              trigger: reel,
              start: "top bottom",
              end: "bottom top",
              onUpdate: (self) => {
                const nudge = gsap.utils.clamp(-40, 40, self.getVelocity() / 80);
                gsap.to(reel, { x: -nudge, duration: 0.6, ease: "power2.out", overwrite: "auto" });
              },
            });
          }
        }

        gsap.from(".creds div", {
          autoAlpha: 0,
          y: 24,
          duration: 0.7,
          stagger: 0.07,
          scrollTrigger: {
            trigger: ".creds",
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        });

        gsap.utils.toArray(".count").forEach((el) => {
          const to = parseFloat(el.getAttribute("data-to") || "0");
          const obj = { v: 0 };
          const tween = gsap.to(obj, {
            v: to,
            duration: 1.4,
            ease: "power2.out",
            paused: true,
            onUpdate: () => {
              el.textContent = Math.round(obj.v);
            },
          });
          ScrollTrigger.create({
            trigger: el,
            start: "top 90%",
            onEnter: () => tween.play(),
          });
        });

        gsap.from(".price-list > li", {
          autoAlpha: 0,
          y: 28,
          duration: 0.75,
          stagger: 0.07,
          scrollTrigger: {
            trigger: ".price-list",
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        });

        gsap.from(".group-note", {
          autoAlpha: 0,
          y: 32,
          duration: 0.9,
          scrollTrigger: {
            trigger: ".group-note",
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        });

        gsap.from(".reach li", {
          autoAlpha: 0,
          y: 22,
          duration: 0.7,
          stagger: 0.07,
          scrollTrigger: {
            trigger: ".reach",
            start: "top 92%",
            toggleActions: "play none none reverse",
          },
        });
      }

      if (bandTrack && live) {
        const total = bandTrack.scrollWidth / 3;
        const loop = gsap.to(bandTrack, {
          x: -total,
          duration: 30,
          ease: "none",
          repeat: -1,
        });
        ScrollTrigger.create({
          trigger: ".band",
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            loop.timeScale(gsap.utils.clamp(0.5, 2.6, 1 + Math.abs(self.getVelocity()) / 1600));
          },
        });
      }

      /* Record carousel — always horizontal, peek slides + focus morph */
      const recordStep = document.getElementById("recordStep");
      const recordTag = document.getElementById("recordTag");
      const recordBar = document.getElementById("recordBar");
      const marks = gsap.utils.toArray(".mark");

      if (recordTrack && live && marks.length) {
        const getRecordScroll = () => Math.max(0, recordTrack.scrollWidth - window.innerWidth);

        const setMarkFocus = (activeIdx) => {
          marks.forEach((mark, i) => {
            const dist = Math.abs(i - activeIdx);
            const isActive = i === activeIdx;
            mark.classList.toggle("is-active", isActive);
            gsap.to(mark, {
              scale: isActive ? 1 : dist === 1 ? 0.94 : 0.88,
              opacity: isActive ? 1 : dist === 1 ? 0.58 : 0.38,
              duration: 0.3,
              overwrite: "auto",
              ease: "power2.out",
            });
          });
        };

        setMarkFocus(0);

        const recordHead = document.querySelector(".record-head");

        const recordTween = gsap.to(recordTrack, {
          x: () => -getRecordScroll(),
          ease: "none",
          scrollTrigger: {
            trigger: "#recordPin",
            start: "center center",
            end: () => `+=${Math.max(getRecordScroll() * 1.35, window.innerHeight * 2.2)}`,
            pin: true,
            scrub: 0.55,
            snap: {
              snapTo: 1 / Math.max(1, marks.length - 1),
              duration: 0.4,
              ease: "power1.inOut",
            },
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const idx = Math.min(
                marks.length - 1,
                Math.round(self.progress * (marks.length - 1))
              );
              const mark = marks[idx];
              if (recordStep) recordStep.textContent = mark.getAttribute("data-step") || "01";
              if (recordTag) recordTag.textContent = mark.getAttribute("data-tag") || "";
              if (recordBar) gsap.set(recordBar, { scaleX: (idx + 1) / marks.length });
              if (recordHead) {
                gsap.set(recordHead, {
                  autoAlpha: self.progress < 0.06 ? 1 : Math.max(0, 1 - (self.progress - 0.06) * 8),
                });
              }
              if (setMarkFocus._last !== idx) {
                setMarkFocus._last = idx;
                setMarkFocus(idx);
              }
            },
          },
        });

        marks.forEach((mark) => {
          const stat = mark.querySelector(".mark-stat");
          const copy = mark.querySelector(".mark-copy");
          const ghost = mark.querySelector(".mark-ghost");

          if (ghost) {
            gsap.fromTo(
              ghost,
              { y: 40, scale: 0.92 },
              {
                y: -20,
                scale: 1.05,
                ease: "none",
                scrollTrigger: {
                  trigger: mark,
                  containerAnimation: recordTween,
                  start: "left 95%",
                  end: "left 5%",
                  scrub: true,
                },
              }
            );
          }

          if (stat) {
            gsap.fromTo(
              stat,
              { y: 80, scale: 0.82, rotate: -3 },
              {
                y: 0,
                scale: 1,
                rotate: 0,
                ease: "none",
                scrollTrigger: {
                  trigger: mark,
                  containerAnimation: recordTween,
                  start: "left 85%",
                  end: "left 40%",
                  scrub: true,
                },
              }
            );
          }

          if (copy) {
            gsap.fromTo(
              copy,
              { y: 36, autoAlpha: 0.2 },
              {
                y: 0,
                autoAlpha: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: mark,
                  containerAnimation: recordTween,
                  start: "left 78%",
                  end: "left 42%",
                  scrub: true,
                },
              }
            );
          }
        });
      } else if (!live && marks.length) {
        marks.forEach((mark, i) => mark.classList.toggle("is-active", i === 0));
      }

      /* Method carousel — horizontal pin scrub with HUD (Zeigarnik) */
      const methodStep = document.getElementById("methodStep");
      const methodTag = document.getElementById("methodTag");
      const methodBar = document.getElementById("methodBar");
      const moves = gsap.utils.toArray(".move");

      if (methodTrack && isDesktop && live && moves.length) {
        const getScroll = () => Math.max(0, methodTrack.scrollWidth - window.innerWidth);

        const scrubTween = gsap.to(methodTrack, {
          x: () => -getScroll(),
          ease: "none",
          scrollTrigger: {
            trigger: "#methodPin",
            start: "center center",
            end: () => `+=${getScroll() * 1.15}`,
            pin: true,
            scrub: 0.65,
            snap: {
              snapTo: 1 / (moves.length - 1),
              duration: 0.35,
              ease: "power1.inOut",
            },
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const idx = Math.min(
                moves.length - 1,
                Math.round(self.progress * (moves.length - 1))
              );
              const move = moves[idx];
              if (methodStep) methodStep.textContent = move.getAttribute("data-step") || "01";
              if (methodTag) methodTag.textContent = move.getAttribute("data-tag") || "";
              if (methodBar) gsap.set(methodBar, { scaleX: (idx + 1) / moves.length });
            },
          },
        });

        moves.forEach((move) => {
          const index = move.querySelector(".move-index");
          const copy = move.querySelector(".move-copy");
          const ghost = move.querySelector(".move-ghost");

          if (ghost) {
            gsap.fromTo(
              ghost,
              { x: 80, autoAlpha: 0.02 },
              {
                x: 0,
                autoAlpha: 0.045,
                ease: "none",
                scrollTrigger: {
                  trigger: move,
                  containerAnimation: scrubTween,
                  start: "left 90%",
                  end: "left 30%",
                  scrub: true,
                },
              }
            );
          }

          if (index) {
            gsap.fromTo(
              index,
              { y: 60, autoAlpha: 0.15 },
              {
                y: 0,
                autoAlpha: 0.45,
                ease: "none",
                scrollTrigger: {
                  trigger: move,
                  containerAnimation: scrubTween,
                  start: "left 80%",
                  end: "left 35%",
                  scrub: true,
                },
              }
            );
          }

          if (copy) {
            gsap.fromTo(
              copy,
              { y: 50, autoAlpha: 0.2 },
              {
                y: 0,
                autoAlpha: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: move,
                  containerAnimation: scrubTween,
                  start: "left 75%",
                  end: "left 40%",
                  scrub: true,
                },
              }
            );
          }
        });
      } else if (live) {
        moves.forEach((panel) => {
          const inner = panel.querySelector(".move-inner");
          if (!inner) return;
          gsap.from(inner, {
            autoAlpha: 0,
            y: 40,
            duration: 0.95,
            scrollTrigger: {
              trigger: panel,
              start: "top 78%",
              toggleActions: "play none none reverse",
            },
          });
        });
      }

      const priceItems = gsap.utils.toArray(".price-list > li");
      const syncPrices = () => {
        const center = window.innerHeight * 0.48;
        let best = null;
        let bestDist = Infinity;
        priceItems.forEach((li) => {
          const r = li.getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) return;
          const mid = (r.top + r.bottom) / 2;
          const d = Math.abs(mid - center);
          if (d < bestDist) {
            bestDist = d;
            best = li;
          }
        });
        priceItems.forEach((li) => {
          const row = li.querySelector(".price-row");
          const open = li === best;
          li.classList.toggle("is-open", open);
          row?.setAttribute("aria-expanded", String(open));
        });
      };

      ScrollTrigger.create({
        trigger: ".price-list",
        start: "top bottom",
        end: "bottom top",
        onUpdate: syncPrices,
        onEnter: syncPrices,
        onEnterBack: syncPrices,
      });

      if (live) {
        priceItems.forEach((li) => {
          const line = li.querySelector(".price-line");
          if (!line) return;
          gsap.fromTo(
            line,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                trigger: li,
                start: "top 85%",
                end: "top 50%",
                scrub: true,
              },
            }
          );
        });
      }

      if (document.fonts?.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }

      return () => {
        document.body.style.overflow = "";
      };
    }
  );

  window.addEventListener("pagehide", () => killField?.());
})();
