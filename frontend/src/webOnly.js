// iOS ships the same Vite bundle as Android (`vite build --mode android`).
// Sample Sets and Remember are public website pages, so they stay out of that build.
export const webMarketing = import.meta.env.MODE !== 'android'
