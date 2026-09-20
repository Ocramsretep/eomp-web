(() => {
  let preference;
  try { preference = localStorage.getItem('eomp-theme'); } catch (_) { /* Storage may be disabled. */ }
  const dark = preference ? preference === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();
