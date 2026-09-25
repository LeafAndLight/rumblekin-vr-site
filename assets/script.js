(() => {
  const i18n = window.IM_MONSTER_I18N;
  const storageKey = "im-monster-language";

  const getStoredLanguage = () => {
    try {
      return window.localStorage.getItem(storageKey)
        || window.localStorage.getItem("rumblekin-language"); // Previous site's preference.
    } catch {
      return null;
    }
  };

  const renderPolicy = (policy, locale) => {
    const article = document.querySelector("[data-policy-content]");
    if (!article || !policy) return;

    article.replaceChildren();
    article.lang = locale;

    const heading = document.createElement("h2");
    heading.textContent = policy.name;
    article.append(heading);

    const opening = document.createElement("p");
    opening.innerHTML = policy.opening;
    article.append(opening);

    const summary = document.createElement("div");
    summary.className = "policy-note";
    summary.innerHTML = `<strong>${policy.summaryLabel}</strong> ${policy.summary}`;
    article.append(summary);

    policy.sections.forEach((section) => {
      const sectionHeading = document.createElement("h3");
      sectionHeading.textContent = section.title;
      if (section.id) sectionHeading.id = section.id;
      article.append(sectionHeading);

      (section.paragraphs || []).forEach((paragraphText, index) => {
        const paragraph = document.createElement("p");
        paragraph.innerHTML = paragraphText;
        article.append(paragraph);

        if (index === 1 && section.list) {
          const list = document.createElement("ul");
          section.list.forEach((itemText) => {
            const item = document.createElement("li");
            item.textContent = itemText;
            list.append(item);
          });
          article.append(list);
        }
      });
    });

    const notice = document.createElement("div");
    notice.className = "policy-note policy-language-note";
    notice.innerHTML = `<strong>${policy.noticeLabel}</strong> ${policy.notice}`;
    article.append(notice);
  };

  const updateLanguageLinks = (language) => {
    document.querySelectorAll("[data-language-link]").forEach((link) => {
      const baseHref = link.dataset.baseHref || link.getAttribute("href");
      link.dataset.baseHref = baseHref;
      const separator = baseHref.includes("?") ? "&" : "?";
      link.setAttribute("href", `${baseHref}${separator}lang=${encodeURIComponent(language)}`);
    });
  };

  const applyLanguage = (requestedLanguage, updateAddress = true) => {
    if (!i18n) return;
    const language = i18n.languages[requestedLanguage] ? requestedLanguage : i18n.defaultLanguage;
    const translation = i18n.languages[language];
    const messages = translation.messages;
    const privacyPage = document.body.dataset.page === "privacy";

    document.documentElement.lang = translation.locale;
    document.body.dataset.language = language;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const value = messages[element.dataset.i18n];
      if (value !== undefined) element.textContent = value;
    });
    document.querySelectorAll("[data-i18n-html]").forEach((element) => {
      const value = messages[element.dataset.i18nHtml];
      if (value !== undefined) element.innerHTML = value;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      const value = messages[element.dataset.i18nAria];
      if (value !== undefined) element.setAttribute("aria-label", value);
    });
    document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
      const value = messages[element.dataset.i18nAlt];
      if (value !== undefined) element.setAttribute("alt", value);
    });

    if (privacyPage) renderPolicy(translation.policy, translation.locale);

    const titleKey = privacyPage ? "privacy.metaTitle" : "meta.title";
    const descriptionKey = privacyPage ? "privacy.metaDescription" : "meta.description";
    document.title = messages[titleKey];
    document.querySelector('meta[name="description"]')?.setAttribute("content", messages[descriptionKey]);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", messages[titleKey]);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", messages[descriptionKey]);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", messages[titleKey]);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", messages[descriptionKey]);

    document.querySelectorAll("[data-language-selector]").forEach((selector) => {
      selector.value = language;
    });
    updateLanguageLinks(language);

    try {
      window.localStorage.setItem(storageKey, language);
    } catch {
      // The selector still works when storage is disabled.
    }

    if (updateAddress) {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", language);
      window.history.replaceState({}, "", url);
    }
  };

  if (i18n) {
    const addressLanguage = new URLSearchParams(window.location.search).get("lang");
    const initialLanguage = addressLanguage || getStoredLanguage() || i18n.defaultLanguage;
    applyLanguage(initialLanguage, Boolean(addressLanguage));
    document.querySelectorAll("[data-language-selector]").forEach((selector) => {
      selector.addEventListener("change", (event) => applyLanguage(event.target.value));
    });
  }

  const initializeCityDemo = () => {
    const map = document.querySelector(".demo-map");
    const player = document.querySelector("#demo-player");
    if (!map || !player) return;

    const blocks = [...map.querySelectorAll("[data-building]")];
    const people = [...map.querySelectorAll("[data-person]")];
    const stats = {
      buildings: document.querySelector("#demo-building-count"),
      people: document.querySelector("#demo-people-count"),
      status: document.querySelector("#demo-status"),
    };
    const ring = map.querySelector(".demo-target-ring");
    const wave = map.querySelector("#demo-wave");
    const start = { x: 280, y: 265 };
    const buildingPoints = new Map([
      ["1", [132, 91]], ["2", [438, 91]], ["3", [742, 99]], ["4", [128, 272]],
      ["5", [434, 273]], ["6", [740, 275]], ["7", [212, 431]], ["8", [764, 431]],
    ]);
    const personStarts = people.map((person) => {
      const match = person.getAttribute("transform").match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
      return { x: Number(match?.[1] || 0), y: Number(match?.[2] || 0) };
    });
    const buildingHits = new Map(blocks.map((block) => [block.dataset.building, 0]));
    let selected = null;
    let activePower = null;
    let playerPosition = { ...start };
    let dragging = false;

    const text = (key) => {
      const language = document.body.dataset.language || i18n?.defaultLanguage || "en";
      return i18n?.languages?.[language]?.messages?.[key] || i18n?.languages?.en?.messages?.[key] || key;
    };
    const message = (key, values = {}) => Object.entries(values).reduce(
      (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), text(key),
    );
    const setStatus = (key, values) => {
      if (stats.status) stats.status.textContent = message(key, values);
    };
    const localPoint = (event) => {
      const matrix = map.getScreenCTM();
      if (!matrix) return null;
      const point = map.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const local = point.matrixTransform(matrix.inverse());
      return {
        x: Math.max(28, Math.min(872, local.x)),
        y: Math.max(28, Math.min(492, local.y)),
      };
    };
    const movePlayer = (position) => {
      playerPosition = position;
      player.setAttribute("transform", `translate(${position.x} ${position.y})`);
    };
    const updateCounts = () => {
      const standing = blocks.filter((block) => !block.classList.contains("destroyed")).length;
      if (stats.buildings) stats.buildings.textContent = `${standing} / ${blocks.length}`;
      if (stats.people) stats.people.textContent = String(people.length);
    };
    const clearActivePower = () => {
      activePower = null;
      document.querySelectorAll("[data-power]").forEach((button) => button.setAttribute("aria-pressed", "false"));
    };
    const selectBlock = (block) => {
      selected = block;
      blocks.forEach((item) => item.classList.toggle("selected", item === block));
      const center = buildingPoints.get(block.dataset.building);
      if (ring && center) {
        ring.style.display = "block";
        ring.setAttribute("transform", `translate(${center[0]} ${center[1]})`);
      }
    };
    const fleePeople = (center, radius) => {
      people.forEach((person, index) => {
        const base = personStarts[index];
        const dx = base.x - center.x;
        const dy = base.y - center.y;
        const distance = Math.hypot(dx, dy);
        if (distance > radius) return;
        const direction = distance < 1 ? { x: 1, y: 0 } : { x: dx / distance, y: dy / distance };
        const x = Math.max(22, Math.min(878, base.x + direction.x * 98));
        const y = Math.max(22, Math.min(498, base.y + direction.y * 82));
        person.setAttribute("transform", `translate(${x} ${y})`);
      });
    };
    const damageBlock = (block, amount, power) => {
      if (!block || block.classList.contains("destroyed")) return false;
      const id = block.dataset.building;
      const hits = (buildingHits.get(id) || 0) + amount;
      buildingHits.set(id, hits);
      const remaining = Math.max(0, 3 - hits);
      block.classList.add("hit");
      window.setTimeout(() => block.classList.remove("hit"), 360);
      if (remaining === 0) {
        block.classList.add("destroyed");
        fleePeople(buildingPoints.get(id), 155);
        setStatus("demo.statusDestroyed", { building: id });
      } else {
        setStatus("demo.statusHit", { building: id, power: text(`demo.${power}`), remaining });
      }
      updateCounts();
      return true;
    };
    const usePower = (power) => {
      if (power === "shockwave") {
        const origin = { ...playerPosition };
        let hitCount = 0;
        if (wave) {
          wave.setAttribute("transform", `translate(${origin.x} ${origin.y})`);
          wave.classList.remove("active");
          void wave.getBoundingClientRect();
          wave.classList.add("active");
        }
        blocks.forEach((block) => {
          const center = buildingPoints.get(block.dataset.building);
          if (Math.hypot(center[0] - origin.x, center[1] - origin.y) <= 175 && damageBlock(block, 1, power)) hitCount += 1;
        });
        fleePeople(origin, 190);
        clearActivePower();
        setStatus(hitCount ? "demo.statusShockwave" : "demo.statusEmpty", { count: hitCount });
        return;
      }
      if (!selected || selected.classList.contains("destroyed")) {
        setStatus("demo.statusNoTarget");
        return;
      }
      damageBlock(selected, power === "fireball" ? 2 : 1, power);
      clearActivePower();
    };

    blocks.forEach((block) => {
      block.addEventListener("pointerdown", (event) => event.stopPropagation());
      block.addEventListener("click", (event) => {
        event.stopPropagation();
        if (block.classList.contains("destroyed")) {
          setStatus("demo.statusNoTarget");
          return;
        }
        selectBlock(block);
        if (activePower) usePower(activePower);
        else setStatus("demo.statusTarget", { building: block.dataset.building });
      });
      block.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        block.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
    });

    map.addEventListener("pointerdown", (event) => {
      if (event.target.closest("[data-building], #demo-player")) return;
      const point = localPoint(event);
      if (point) movePlayer(point);
    });
    player.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      dragging = true;
      player.classList.add("dragging");
      player.setPointerCapture(event.pointerId);
    });
    player.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const point = localPoint(event);
      if (point) movePlayer(point);
    });
    const stopDragging = (event) => {
      dragging = false;
      player.classList.remove("dragging");
      if (player.hasPointerCapture(event.pointerId)) player.releasePointerCapture(event.pointerId);
    };
    player.addEventListener("pointerup", stopDragging);
    player.addEventListener("pointercancel", stopDragging);
    map.addEventListener("keydown", (event) => {
      const delta = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }[event.key];
      if (!delta) return;
      event.preventDefault();
      movePlayer({ x: Math.max(28, Math.min(872, playerPosition.x + delta[0])), y: Math.max(28, Math.min(492, playerPosition.y + delta[1])) });
    });

    document.querySelectorAll("[data-power]").forEach((button) => {
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        const power = button.dataset.power;
        clearActivePower();
        button.setAttribute("aria-pressed", "true");
        if (power === "shockwave") {
          usePower(power);
          return;
        }
        activePower = power;
        if (selected && !selected.classList.contains("destroyed")) usePower(power);
        else setStatus("demo.statusNoTarget");
      });
    });

    document.querySelector(".demo-reset")?.addEventListener("click", () => {
      blocks.forEach((block) => {
        block.classList.remove("destroyed", "selected", "hit");
        buildingHits.set(block.dataset.building, 0);
      });
      people.forEach((person, index) => {
        const point = personStarts[index];
        person.setAttribute("transform", `translate(${point.x} ${point.y})`);
      });
      selected = null;
      if (ring) ring.style.display = "none";
      if (wave) wave.classList.remove("active");
      clearActivePower();
      movePlayer({ ...start });
      updateCounts();
      setStatus("demo.statusReset");
    });

    updateCounts();
    setStatus("demo.statusReady");
  };

  initializeCityDemo();

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const header = document.querySelector("[data-header]");
  const depthLayers = [...document.querySelectorAll("[data-depth]")];

  const updateScroll = () => {
    const scrollY = window.scrollY;
    header?.classList.toggle("scrolled", scrollY > 24);

    if (reducedMotion || coarsePointer) return;

    depthLayers.forEach((layer) => {
      const speed = Number(layer.dataset.depth || 0.05);
      const host = layer.closest("section") || layer.parentElement;
      const rect = host.getBoundingClientRect();
      const distance = window.innerHeight * 0.5 - (rect.top + rect.height * 0.5);
      const offset = Math.max(-130, Math.min(130, distance * speed));
      layer.style.transform = `translate3d(0, ${offset}px, 0) scale(1.06)`;
    });
  };

  let queued = false;
  window.addEventListener("scroll", () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      updateScroll();
      queued = false;
    });
  }, { passive: true });

  if (!reducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    document.querySelectorAll(".reveal").forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
      observer.observe(element);
    });
  } else {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
  }

  updateScroll();
})();
