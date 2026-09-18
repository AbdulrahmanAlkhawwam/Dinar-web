'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Logo } from '@/components/logo';
import { NAV_ITEMS } from '@/lib/nav';

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav
      aria-label="Main"
      className="flex shrink-0 flex-col gap-1 border-outline-variant p-4 md:w-60 md:border-r"
    >
      <Link href="/" className="mb-6 hidden items-center gap-3 px-3 md:flex">
        <Logo />
        <span className="text-lg font-bold tracking-wide">Dinar</span>
      </Link>
      <ul className="flex gap-1 overflow-x-auto md:flex-col">
        {items.map((item) => {
          const active =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-11 items-center whitespace-nowrap rounded-pill px-4 text-sm transition ${
                  active
                    ? 'bg-primary-container font-medium text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
