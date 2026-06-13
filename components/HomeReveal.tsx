'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Обёртка для главной страницы.
 * При SPA-навигации (когда intro уже сыграло) мгновенно делает
 * все [data-intro] элементы видимыми, не запуская лесенку повторно.
 */
export default function HomeReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (document.body.classList.contains('kb-intro-ready')) {
      // SPA-навигация: intro уже сыграло — сбрасываем задержки
      el.querySelectorAll<HTMLElement>('[data-intro]').forEach(node => {
        node.style.opacity   = '1';
        node.style.animation = 'none';
        node.style.transform = 'translateY(0)';
      });
    }
  }, []);

  // display: contents — обёртка не создаёт лишнего бокса в layout
  return (
    <div ref={ref} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}
