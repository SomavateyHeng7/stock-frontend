"use client";

import Link from "next/link";

export default function ForbiddenPage() {
	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b12] px-6 text-white">
			<div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,77,77,0.015)_2px,rgba(255,77,77,0.015)_4px)]" />

			<div className="pointer-events-none fixed left-[10%] top-[10%] z-0 h-80 w-80 rounded-full bg-[#ff4d4d] opacity-20 blur-[120px]" />
			<div className="pointer-events-none fixed bottom-[10%] right-[10%] z-0 h-80 w-80 rounded-full bg-[#ff8547] opacity-20 blur-[120px]" />

			<section className="relative z-10 w-full max-w-[520px] rounded-[28px] border border-white/10 bg-white/[0.06] px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-12 sm:py-12">
				<span className="mb-4 block animate-bounce text-4xl" aria-hidden="true">
					🔒
				</span>

				<div className="inline-flex rounded-full bg-[#ff4d4d]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#ff4d4d]">
					Restricted
				</div>

				<div className="mt-5 text-[clamp(5rem,18vw,9rem)] font-black leading-none text-[#ff4d4d] drop-shadow-[0_0_18px_rgba(255,77,77,0.22)]">
					403
				</div>

				<h1 className="mt-4 text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold">
					Access Forbidden
				</h1>

				<div className="mx-auto mt-6 inline-flex animate-pulse rounded-md border border-[#ff4d4d]/20 bg-[#ff4d4d]/10 px-5 py-2 font-mono text-xs tracking-[0.2em] text-[#ff4d4d]">
					ACCESS_DENIED
				</div>

				<p className="mx-auto mt-6 max-w-[420px] text-base leading-7 text-white/70">
					You don&apos;t have permission to view this page. If you believe this
					is a mistake, please contact your administrator or sign in with a
					different account.
				</p>

				<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
					<Link
						href="/"
						className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#ff4d4d] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:opacity-90"
					>
						Go Home
					</Link>

					<Link
						href="/contact"
						className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-transparent px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/5"
					>
						Contact Support
					</Link>
				</div>
			</section>
		</main>
	);
}