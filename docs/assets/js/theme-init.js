(function () {
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
  }

  // tema iniziale automatico
  applyTheme(media.matches);

  // aggiornamento automatico se cambia il tema sistema/browser
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', (e) => applyTheme(e.matches));
  } else if (typeof media.addListener === 'function') {
    media.addListener((e) => applyTheme(e.matches)); // fallback vecchi browser
  }
})();