export interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Overview' },
  { href: '/operations', label: 'Operations' },
  { href: '/currencies', label: 'Currencies' },
  { href: '/products', label: 'Products' },
  { href: '/categories', label: 'Categories' },
  { href: '/users', label: 'Users', adminOnly: true },
];
