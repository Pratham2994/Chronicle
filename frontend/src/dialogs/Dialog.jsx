import { useEffect, useRef } from 'react';

/** The browser's own dialog: Esc closes it, and the page behind it cannot be reached. */
export default function Dialog({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el.open) el.showModal();
  }, []);
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => e.target === ref.current && ref.current.close()}>
      <header>
        <h2>{title}</h2>
        <button type="button" onClick={() => ref.current.close()} aria-label="Close">
          Close
        </button>
      </header>
      {children}
    </dialog>
  );
}
