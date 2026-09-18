import type { Metadata } from "next";
import { cookies } from "next/headers";

import { Providers } from "@/components/providers";
import { SYSTEM_THEME_SCRIPT, THEME_COOKIE } from "@/lib/theme";

// Self-hosted rather than next/font/google, so neither dev nor build needs
// to reach fonts.gstatic.com.
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dinar",
  description: "Dinar dashboard",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = (await cookies()).get(THEME_COOKIE)?.value;

  return (
    <html
      lang="en"
      className={`h-full antialiased ${theme === "dark" ? "dark" : ""}`}
      // The system-theme script may add `dark` before React hydrates.
      suppressHydrationWarning
    >
      <head>
        {theme ? null : (
          <script dangerouslySetInnerHTML={{ __html: SYSTEM_THEME_SCRIPT }} />
        )}
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
