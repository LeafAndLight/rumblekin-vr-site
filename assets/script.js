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

  const initializeCityViewer = () => {
    const viewer = document.querySelector("[data-city-viewer]");
    const world = document.querySelector("[data-city-world]");
    const image = world?.querySelector("img");
    if (!viewer || !world || !image) return;

    const minZoom = 0.45;
    const maxZoom = 3;
    const homeZoom = 1.12;
    const state = { zoom: homeZoom, x: 0, y: 0, base: 1, drag: null };

    const clamp = (value, extent, viewportExtent) => extent <= viewportExtent
      ? (viewportExtent - extent) / 2
      : Math.min(0, Math.max(viewportExtent - extent, value));
    const render = () => {
      const bounds = viewer.getBoundingClientRect();
      const width = image.naturalWidth || Number(image.getAttribute("width")) || 1672;
      const height = image.naturalHeight || Number(image.getAttribute("height")) || 941;
      state.base = Math.max(bounds.width / width, bounds.height / height);
      world.style.width = `${width}px`;
      world.style.height = `${height}px`;
      const scale = state.base * state.zoom;
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      if (!state.drag) {
        state.x = clamp(state.x, scaledWidth, bounds.width);
        state.y = clamp(state.y, scaledHeight, bounds.height);
      }
      world.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) scale(${scale})`;
    };

    const recenter = () => {
      state.zoom = homeZoom;
      state.x = 0;
      state.y = 0;
      render();
      const bounds = viewer.getBoundingClientRect();
      const width = (image.naturalWidth || Number(image.getAttribute("width")) || 1672) * state.base;
      const height = (image.naturalHeight || Number(image.getAttribute("height")) || 941) * state.base;
      state.x = (bounds.width - width) / 2;
      state.y = (bounds.height - height) / 2;
      render();
    };

    const zoomAt = (nextZoom, localX, localY) => {
      const bounds = viewer.getBoundingClientRect();
      const next = Math.max(minZoom, Math.min(maxZoom, nextZoom));
      if (next === state.zoom) return;
      const factor = next / state.zoom;
      state.x = localX - (localX - state.x) * factor;
      state.y = localY - (localY - state.y) * factor;
      state.zoom = next;
      render();
    };

    const zoomFromButton = (factor) => {
      const bounds = viewer.getBoundingClientRect();
      zoomAt(state.zoom * factor, bounds.width / 2, bounds.height / 2);
      viewer.focus({ preventScroll: true });
    };

    viewer.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      viewer.focus({ preventScroll: true });
      state.drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      viewer.classList.add("is-panning");
      viewer.setPointerCapture(event.pointerId);
    });

    viewer.addEventListener("pointermove", (event) => {
      if (!state.drag || state.drag.id !== event.pointerId) return;
      state.x += event.clientX - state.drag.x;
      state.y += event.clientY - state.drag.y;
      state.drag.x = event.clientX;
      state.drag.y = event.clientY;
      render();
    });

    const finishPan = (event) => {
      if (!state.drag || state.drag.id !== event.pointerId) return;
      state.drag = null;
      viewer.classList.remove("is-panning");
      render();
      if (viewer.hasPointerCapture(event.pointerId)) viewer.releasePointerCapture(event.pointerId);
    };
    viewer.addEventListener("pointerup", finishPan);
    viewer.addEventListener("pointercancel", finishPan);

    viewer.addEventListener("wheel", (event) => {
      event.preventDefault();
      const bounds = viewer.getBoundingClientRect();
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomAt(state.zoom * factor, event.clientX - bounds.left, event.clientY - bounds.top);
    }, { passive: false });

    viewer.addEventListener("keydown", (event) => {
      const step = event.shiftKey ? 140 : 72;
      const movements = {
        ArrowLeft: [step, 0], ArrowRight: [-step, 0],
        ArrowUp: [0, step], ArrowDown: [0, -step],
      };
      if (movements[event.key]) {
        event.preventDefault();
        state.x += movements[event.key][0];
        state.y += movements[event.key][1];
        render();
      } else if (event.key === "Home") {
        event.preventDefault();
        recenter();
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomFromButton(1.25);
      } else if (event.key === "-") {
        event.preventDefault();
        zoomFromButton(1 / 1.25);
      }
    });

    document.querySelector("[data-city-zoom-in]")?.addEventListener("click", () => zoomFromButton(1.25));
    document.querySelector("[data-city-zoom-out]")?.addEventListener("click", () => zoomFromButton(1 / 1.25));
    document.querySelector("[data-city-reset]")?.addEventListener("click", recenter);
    image.addEventListener("load", recenter, { once: true });
    if ("ResizeObserver" in window) new ResizeObserver(render).observe(viewer);
    else window.addEventListener("resize", render, { passive: true });
    if (image.complete) recenter();
    else render();
  };

  initializeCityViewer();

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const header = document.querySelector("[data-header]");
  const depthLayers = [...document.querySelectorAll("[data-depth]")];
  const hero = document.querySelector(".hero");
  const heroDepthLayers = [...(hero?.querySelectorAll("[data-depth]") || [])];

  const updateScroll = () => {
    const scrollY = window.scrollY;
    header?.classList.toggle("scrolled", scrollY > 24);

    if (reducedMotion) return;

    depthLayers.forEach((layer) => {
      const speed = Number(layer.dataset.depth || 0.05);
      const host = layer.closest("section") || layer.parentElement;
      const rect = host.getBoundingClientRect();
      const distance = window.innerHeight * 0.5 - (rect.top + rect.height * 0.5);
      const offset = Math.max(-130, Math.min(130, distance * speed));
      layer.style.setProperty("--scroll-depth", `${offset}px`);
    });
  };

  hero?.addEventListener("pointermove", (event) => {
    if (reducedMotion || coarsePointer) return;
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (event.clientY - rect.top - rect.height / 2) / rect.height;
    heroDepthLayers.forEach((layer) => {
      const depth = Number(layer.dataset.depth || 0.05) * 300;
      layer.style.setProperty("--pointer-x", `${-x * depth}px`);
      layer.style.setProperty("--pointer-y", `${-y * depth}px`);
    });
  }, { passive: true });

  hero?.addEventListener("pointerleave", () => {
    heroDepthLayers.forEach((layer) => {
      layer.style.setProperty("--pointer-x", "0px");
      layer.style.setProperty("--pointer-y", "0px");
    });
  });

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
