export function announceToScreenReader(message, priority = 'polite') {
  const liveRegion = document.getElementById('aria-live-region');
  if (liveRegion) {
    liveRegion.textContent = '';
    setTimeout(() => {
      liveRegion.textContent = message;
      liveRegion.setAttribute('aria-live', priority);
    }, 100);
  }
}

export function announceZenModeChange(isActive, reason, isAutomatic = false) {
  const mode = isActive ? 'enabled' : 'disabled';
  const trigger = isAutomatic ? 'automatically' : 'manually';
  const message = `Zen Mode ${mode} ${trigger}. ${reason || ''}`;
  announceToScreenReader(message, 'polite');
}

export function announceStressLevelChange(level, score) {
  const levelText = level === 'high' ? 'high' : level === 'moderate' ? 'moderate' : 'low';
  const message = `Stress level is now ${levelText}, ${score} percent`;
  announceToScreenReader(message, 'polite');
}
