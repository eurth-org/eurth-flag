/**
 * Flagwright's own buttons answer a click with a small movement: they press in (app.css), and
 * their icon does what the button says (data-click names it: spin-back, tumble, bounce,
 * swing-left, swing-right, pop). Installed once for the page (layouts/Base.astro). The suite's
 * shell does the same for its own buttons, and hides tooltips on Escape for both. Nothing moves
 * for reduced motion or when motion is switched off in the footer (calm()).
 */
import { calm } from '@eurth/style';

export function clickDelights() {
  document.addEventListener('click', (event) => {
    if (calm()) return;
    const button = (event.target as Element | null)?.closest<HTMLElement>('.fw .btn, .fw .pill');
    if (!button || button.matches(':disabled')) return;
    button.classList.remove('clicked');
    void button.offsetWidth;
    button.classList.add('clicked');
    setTimeout(() => button.classList.remove('clicked'), 700);
  });
}
