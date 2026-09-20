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
    const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)');
    let angle = 0;
    let animationFrame;
    let width = imageFrame.clientWidth;
    let height = imageFrame.clientHeight;

    const renderRotation = () => {
      const radians = angle * Math.PI / 180;
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));
      // A temporary zoom keeps the rectangular photo covering its frame at every angle.
      const scale = width && height ? Math.max(cos + height / width * sin, cos + width / height * sin) : 1;
      photo.style.transform = 'rotate(' + angle + 'deg) scale(' + scale + ')';
    };
    const rotateTo = target => {
      cancelAnimationFrame(animationFrame);
      if (reducedMotion.matches || !hoverPointer.matches) {
        angle = 0;
        renderRotation();
        return;
      }
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
    imageFrame.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') rotateTo(180);
    });
    imageFrame.addEventListener('pointerleave', () => rotateTo(0));
    imageFrame.addEventListener('pointercancel', () => rotateTo(0));
    reducedMotion.addEventListener('change', () => rotateTo(0));
    hoverPointer.addEventListener('change', () => rotateTo(0));
    new ResizeObserver(() => {
      width = imageFrame.clientWidth;
      height = imageFrame.clientHeight;
      renderRotation();
    }).observe(imageFrame);
  }
})();
