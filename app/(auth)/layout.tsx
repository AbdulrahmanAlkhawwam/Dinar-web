import { Logo } from '@/components/logo';

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo className="size-14" />
          <span className="text-2xl font-bold tracking-wide">DINAR</span>
        </div>
        {children}
      </div>
    </main>
  );
}
