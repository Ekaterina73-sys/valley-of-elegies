export const KB_ROUTES = [
  { id: 'home',       label: 'Главная',   href: '/' },
  { id: 'radio',      label: 'Радио',     href: '/radio' },
  { id: 'characters', label: 'Жители',    href: '/characters' },
  { id: 'world',      label: 'Мир',       href: '/world' },
  { id: 'about',      label: 'О проекте', href: '/about' },
];

export const siteConfig = {
  evangelineAnnouncement: 'Следующая запись — лето MMXXVI',
};

/**
 * Vinyl label colour palette — cycling by track index.
 * Replace values with the real palette when ready.
 */
export const VINYL_LABEL_HUES = ['amber', 'wine', 'beige', 'gold'] as const;
export type VinylLabelHue = typeof VINYL_LABEL_HUES[number];
