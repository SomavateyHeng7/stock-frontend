"use client";

export default function LoadingPage() {
	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b12] px-6 text-white">
			<div className="pointer-events-none fixed left-[10%] top-[10%] z-0 h-80 w-80 rounded-full bg-[#b047ff] opacity-20 blur-[120px]" />
			<div className="pointer-events-none fixed bottom-[10%] right-[10%] z-0 h-80 w-80 rounded-full bg-[#7047ff] opacity-20 blur-[120px]" />

			<section className="relative z-10 w-full max-w-[520px] rounded-[28px] border border-white/10 bg-white/[0.06] px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-12 sm:py-12">
				<div className="mx-auto mb-6 h-20 w-20 animate-spin rounded-full border-[3px] border-[#b047ff]/15 border-r-[#7047ff] border-t-[#b047ff] shadow-[0_0_20px_rgba(176,71,255,0.3)]" />

				<div className="inline-flex rounded-full bg-[#b047ff]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#b047ff]">
					Please wait
				</div>

				<h1 className="mt-5 flex items-center justify-center text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold">
					<span>Loading</span>
					<span className="ml-1 inline-flex w-8 justify-start">
						<span className="animate-bounce">.</span>
						<span className="animate-bounce delay-150">.</span>
						<span className="animate-bounce delay-300">.</span>
					</span>
				</h1>

				<div className="my-6 rounded-xl border border-white/10 bg-white/[0.04] p-5 text-left">
					<div className="mb-3 h-4 w-3/5 animate-pulse rounded-md bg-white/10" />
					<div className="mb-2 h-3 w-4/5 animate-pulse rounded-md bg-white/10" />
					<div className="mb-2 h-3 w-[90%] animate-pulse rounded-md bg-white/10" />
					<div className="h-3 w-[65%] animate-pulse rounded-md bg-white/10" />
				</div>

				<p className="mx-auto max-w-[420px] text-base leading-7 text-white/70">
					Fetching your content, this usually only takes a second. Thanks for
					your patience.
				</p>
			</section>
		</main>
	);
}