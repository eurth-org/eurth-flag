/** Small shared behaviours: a toast, and buttons whose icons act out their click (app.css). */
const calm = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A short message at the bottom of the screen, also read out by screen readers. */
export function toast(text: string) {
  document.querySelector('.toast')?.remove();
  const note = document.createElement('div');
  note.className = 'toast';
  note.setAttribute('role', 'status');
  note.textContent = text;
  document.body.append(note);
  setTimeout(() => note.classList.add('leaving'), 2400);
  setTimeout(() => note.remove(), 2900);
}

/** Installed once for the whole page: Escape hides tooltips, and clicked buttons animate. */
export function clickDelights() {
  const root = document.documentElement;
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') root.classList.add('tips-hidden');
  });
  document.addEventListener('pointermove', () => root.classList.remove('tips-hidden'), { passive: true });

  document.addEventListener('click', (event) => {
    if (calm()) return;
    const button = (event.target as Element | null)?.closest<HTMLElement>('.btn, .pill');
    if (!button || button.matches(':disabled')) return;
    button.classList.remove('clicked');
    void button.offsetWidth;
    button.classList.add('clicked');
    setTimeout(() => button.classList.remove('clicked'), 700);
  });
}
