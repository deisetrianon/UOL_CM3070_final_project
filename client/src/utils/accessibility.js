/**
 * Announcing a message to screen readers via ARIA live region
 * @param {string} message - The message to announce
 * @param {string} priority - 'polite' (default) or 'assertive'
 */
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

/**
 * Announcing Zen Mode state changes
 * @param {boolean} isActive - Whether Zen Mode is active
 * @param {string} reason - Reason for the change
 * @param {boolean} isAutomatic - Whether the change was automatic
 */
export function announceZenModeChange(isActive, reason, isAutomatic = false) {
  const mode = isActive ? 'enabled' : 'disabled';
  const trigger = isAutomatic ? 'automatically' : 'manually';
  const message = `Zen Mode ${mode} ${trigger}. ${reason || ''}`;
  announceToScreenReader(message, 'polite');
}

/**
 * Announcing stress level changes
 * @param {string} level - Stress level ('low', 'moderate', 'high')
 * @param {number} score - Stress score (0-100)
 */
export function announceStressLevelChange(level, score) {
  const levelText = level === 'high' ? 'high' : level === 'moderate' ? 'moderate' : 'low';
  const message = `Stress level is now ${levelText}, ${score} percent`;
  announceToScreenReader(message, 'polite');
}
