"use client";

import Link from "next/link";

export default function EmptyStatePage() {
	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b12] px-6 text-white">
			<div className="pointer-events-none fixed left-[10%] top-[10%] z-0 h-80 w-80 rounded-full bg-[#47ffb2] opacity-20 blur-[120px]" />
			<div className="pointer-events-none fixed bottom-[10%] right-[10%] z-0 h-80 w-80 rounded-full bg-[#47c8ff] opacity-20 blur-[120px]" />

			<section className="relative z-10 w-full max-w-[520px] rounded-[28px] border border-white/10 bg-white/[0.06] px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-12 sm:py-12">
				<div className="relative mx-auto mb-6 h-[100px] w-[120px]">
					<span className="absolute left-1 top-1 animate-pulse text-sm text-[#47ffb2]">
						✦
					</span>
					<span className="absolute right-1 top-1 animate-ping text-sm text-[#47ffb2]">
						✦
					</span>
					<span className="absolute bottom-1 left-1/2 animate-pulse text-sm text-[#47ffb2]">
						✦
					</span>

					<div className="absolute left-1/2 top-1/2 h-[60px] w-[70px] -translate-x-1/2 -translate-y-1/2 animate-bounce rounded-[10px] border-2 border-[#47ffb2]/40">
						<div className="absolute -top-[14px] left-1/2 h-0 w-0 -translate-x-1/2 border-b-[14px] border-l-[37px] border-r-[37px] border-b-[#47ffb2]/25 border-l-transparent border-r-transparent" />

						<div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#47ffb2] shadow-[0_0_12px_#47ffb2]" />
					</div>
				</div>

				<div className="inline-flex rounded-full bg-[#47ffb2]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#47ffb2]">
					Nothing here yet
				</div>

				<h1 className="mt-5 text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold text-white">
					It&apos;s Quiet in Here
				</h1>

				<p className="mx-auto mt-4 max-w-[420px] text-base leading-7 text-white/70">
					You haven&apos;t added anything yet. Start creating content and it&apos;ll
					appear here ready for you to manage.
				</p>

				<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
					{/* <Link
						href="/create"
						className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#47ffb2] px-5 text-sm font-bold text-[#0b0f14] transition hover:-translate-y-0.5 hover:opacity-90"
					>
						+ Create Your First Item
					</Link> */}

					<Link
						href="/learn-more"
						className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-transparent px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/5"
					>
						Learn More
					</Link>
				</div>
			</section>
		</main>
	);
}