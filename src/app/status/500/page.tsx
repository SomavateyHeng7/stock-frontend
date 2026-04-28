"use client";

import Link from "next/link";

export default function ServerErrorPage() {
	const handleRefresh = () => {
		window.location.reload();
	};

	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b12] px-6 text-white">
			<div className="pointer-events-none fixed left-[10%] top-[10%] z-0 h-80 w-80 rounded-full bg-[#ffaa47] opacity-20 blur-[120px]" />
			<div className="pointer-events-none fixed bottom-[10%] right-[10%] z-0 h-80 w-80 rounded-full bg-[#ff6b47] opacity-20 blur-[120px]" />

			<section className="relative z-10 w-full max-w-[520px] rounded-[28px] border border-white/10 bg-white/[0.06] px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-12 sm:py-12">
				<span className="mb-4 block animate-spin text-4xl" aria-hidden="true">
					⚙️
				</span>

				<div className="inline-flex rounded-full bg-[#ffaa47]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#ffaa47]">
					Server Error
				</div>

				<div className="mt-5 text-[clamp(5rem,18vw,9rem)] font-black leading-none text-[#ffaa47] drop-shadow-[0_0_18px_rgba(255,170,71,0.22)]">
					500
				</div>

				<h1 className="mt-4 text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold">
					Internal Server Error
				</h1>

				<div className="mt-6 rounded-xl border border-[#ffaa47]/20 bg-[#ffaa47]/10 px-5 py-4 text-left font-mono text-xs leading-7 text-[#ffaa47]/70">
					<span className="block">[ERROR] Unexpected exception in request handler</span>
					<span className="block">[INFO] Our team has been notified automatically</span>
					<span className="block">
						[INFO] Attempting recovery...
						<span className="ml-1 inline-block h-4 w-2 animate-pulse bg-[#ffaa47] align-text-bottom" />
					</span>
				</div>

				<p className="mx-auto mt-6 max-w-[420px] text-base leading-7 text-white/70">
					Something broke on our end. Our team has been notified and is already
					on it. Try refreshing in a moment.
				</p>

				<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
					<button
						type="button"
						onClick={handleRefresh}
						className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#ffaa47] px-5 text-sm font-bold text-[#0b0f14] transition hover:-translate-y-0.5 hover:opacity-90"
					>
						Refresh Page
					</button>

					<Link
						href="/"
						className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-transparent px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/5"
					>
						Go Home
					</Link>
				</div>
			</section>
		</main>
	);
}