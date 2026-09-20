(() => {
  const button = document.querySelector('.theme-toggle');
  const system = matchMedia('(prefers-color-scheme: dark)');
  const syncTheme = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    if (button) button.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101b20' : '#f7f8f5');
  };
  if (button) {
    button.hidden = false;
    button.addEventListener('click', () => {
      const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem('eomp-theme', theme); } catch (_) { /* The switch still works without storage. */ }
      syncTheme();
    });
  }
  system.addEventListener('change', ({ matches }) => {
    let saved;
    try { saved = localStorage.getItem('eomp-theme'); } catch (_) {}
    if (!saved) {
      document.documentElement.dataset.theme = matches ? 'dark' : 'light';
      syncTheme();
    }
  });
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  syncTheme();

  const imageFrame = document.querySelector('.earth-image');
  const photo = imageFrame?.querySelector('img');
  if (photo) {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const hoverPointer = matchMedia('(hover: hover)');
    const scrollMode = matchMedia('(hover: none)');
    let angle = 0;
    let animationFrame;
    let scrollFrame;
    let width = imageFrame.clientWidth;
    let height = imageFrame.clientHeight;

    const renderRotation = () => {
      const radians = angle * Math.PI / 180;
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));
      // A temporary zoom keeps the photo covering its frame at every angle.
      const scale = width && height ? Math.max(cos + height / width * sin, cos + width / height * sin) : 1;
      photo.style.transform = 'rotate(' + angle + 'deg) scale(' + scale + ')';
    };
    const updateScrollRotation = () => {
      scrollFrame = undefined;
      if (!scrollMode.matches || reducedMotion.matches) return;
      const rect = imageFrame.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const viewportTop = viewport?.offsetTop ?? 0;
      // Start only once the whole frame is visible, with a little breathing room.
      const startBottom = viewportTop + viewportHeight - 24;
      const distance = Math.max(160, viewportHeight - rect.height - 48);
      const progress = Math.max(0, Math.min(1, (startBottom - rect.bottom) / distance));
      angle = progress * 180;
      renderRotation();
    };
    const scheduleScrollRotation = () => {
      if (scrollMode.matches && !reducedMotion.matches && scrollFrame === undefined) {
        scrollFrame = requestAnimationFrame(updateScrollRotation);
      }
    };
    const rotateTo = target => {
      if (scrollMode.matches || !hoverPointer.matches || reducedMotion.matches) return;
      cancelAnimationFrame(animationFrame);
      const from = angle;
      const started = performance.now();
      const duration = Math.max(180, 1100 * Math.abs(target - from) / 180);
      const tick = now => {
        const progress = Math.min(1, (now - started) / duration);
        const eased = progress * progress * (3 - 2 * progress);
        angle = from + (target - from) * eased;
        renderRotation();
        if (progress < 1) animationFrame = requestAnimationFrame(tick);
      };
      animationFrame = requestAnimationFrame(tick);
    };
    const syncRotationMode = () => {
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(scrollFrame);
      scrollFrame = undefined;
      if (scrollMode.matches && !reducedMotion.matches) {
        updateScrollRotation();
      } else {
        angle = 0;
        renderRotation();
      }
    };
    imageFrame.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') rotateTo(180);
    });
    imageFrame.addEventListener('pointerleave', () => rotateTo(0));
    imageFrame.addEventListener('pointercancel', () => rotateTo(0));
    window.addEventListener('scroll', scheduleScrollRotation, { passive: true });
    window.addEventListener('resize', scheduleScrollRotation, { passive: true });
    window.addEventListener('pageshow', syncRotationMode);
    window.visualViewport?.addEventListener('resize', scheduleScrollRotation, { passive: true });
    window.visualViewport?.addEventListener('scroll', scheduleScrollRotation, { passive: true });
    reducedMotion.addEventListener('change', syncRotationMode);
    hoverPointer.addEventListener('change', syncRotationMode);
    scrollMode.addEventListener('change', syncRotationMode);
    new ResizeObserver(() => {
      width = imageFrame.clientWidth;
      height = imageFrame.clientHeight;
      if (scrollMode.matches && !reducedMotion.matches) updateScrollRotation();
      else renderRotation();
    }).observe(imageFrame);
    syncRotationMode();
  }
})();
