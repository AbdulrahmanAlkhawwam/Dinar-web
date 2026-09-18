/** Readable by page scripts on purpose — it only holds 'light' or 'dark'. */
export const THEME_COOKIE = 'dinar_theme';

/**
 * Runs before first paint when no theme has been chosen, so a dark-mode
 * system doesn't flash white. An explicit choice is applied server-side.
 */
export const SYSTEM_THEME_SCRIPT = `if(matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark')`;
