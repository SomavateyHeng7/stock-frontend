import Link from "next/link";

const links = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/legal", label: "Legal" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#2f2418] bg-[#3b2d1f] text-white shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="shrink-0 text-3xl font-semibold tracking-tight text-[#f8f2e9]">
            SmartStock
          </Link>
          <nav aria-label="Public" className="hidden lg:block">
            <ul className="flex items-center gap-4">
              {links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-[#eadfce] transition-colors hover:text-[#fff8ef]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/billing"
            className="hidden rounded-full bg-[#5a4631] px-4 py-2 text-sm font-medium text-[#fff8ef] transition-colors hover:bg-[#6a533c] sm:inline-flex"
          >
            Billing
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-[#f5e9d8] px-4 py-2 text-sm font-semibold text-[#2f2418] transition-colors hover:bg-[#f9efdf]"
          >
            Open App
          </Link>
        </div>
      </div>
    </header>
  );
}
