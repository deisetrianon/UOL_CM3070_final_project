/**
 * Accessibility utility functions.
 * Provides screen reader announcements and accessibility helpers.
 * 
 * @module accessibility
 */

/**
 * Announces a message to screen readers via the ARIA live region.
 * 
 * @param {string} message - The message to announce
 * @param {string} priority - The announcement priority ('polite' or 'assertive', default: 'polite')
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
 * Announces Zen Mode state changes to screen readers.
 * 
 * @param {boolean} isActive - Whether Zen Mode is active
 * @param {string} reason - The reason for the change
 * @param {boolean} isAutomatic - Whether the change was automatic (default: false)
 */
export function announceZenModeChange(isActive, reason, isAutomatic = false) {
  const mode = isActive ? 'enabled' : 'disabled';
  const trigger = isAutomatic ? 'automatically' : 'manually';
  const message = `Zen Mode ${mode} ${trigger}. ${reason || ''}`;
  announceToScreenReader(message, 'polite');
}

/**
 * Announces stress level changes to screen readers.
 * 
 * @param {string} level - The stress level ('high', 'moderate', or 'normal')
 * @param {number} score - The stress score (0-100)
 */
export function announceStressLevelChange(level, score) {
  const levelText = level === 'high' ? 'high' : level === 'moderate' ? 'moderate' : 'low';
  const message = `Stress level is now ${levelText}, ${score} percent`;
  announceToScreenReader(message, 'polite');
}
