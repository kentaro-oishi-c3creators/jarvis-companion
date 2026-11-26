(() => {
  const key = 'jarvis.portal.theme';
  const choices = ['light', 'dark', 'auto'];
  let theme = 'auto';
  try {
    const saved = localStorage.getItem(key);
    if (choices.includes(saved)) theme = saved;
  } catch {}

  function render() {
    document.documentElement.dataset.theme = theme;
    for (const radio of document.querySelectorAll('input[name="jarvis-theme"]')) {
      radio.checked = radio.value === theme;
    }
  }

  render();
  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('change', event => {
    const control = event.target;
    if (!control.matches('input[name="jarvis-theme"]') || !choices.includes(control.value)) return;
    theme = control.value;
    render();
    try { localStorage.setItem(key, theme); } catch {}
  });
})();
