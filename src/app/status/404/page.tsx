"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const particles = [
	"left-[4vw] top-[88vh] animate-[bounce_5s_infinite]",
	"left-[10vw] top-[76vh] animate-[pulse_4s_infinite]",
	"left-[16vw] top-[92vh] animate-[bounce_6s_infinite]",
	"left-[22vw] top-[70vh] animate-[pulse_5s_infinite]",
	"left-[28vw] top-[84vh] animate-[bounce_4s_infinite]",
	"left-[34vw] top-[96vh] animate-[pulse_6s_infinite]",
	"left-[40vw] top-[78vh] animate-[bounce_5s_infinite]",
	"left-[46vw] top-[90vh] animate-[pulse_4s_infinite]",
	"left-[52vw] top-[72vh] animate-[bounce_6s_infinite]",
	"left-[58vw] top-[86vh] animate-[pulse_5s_infinite]",
	"left-[64vw] top-[94vh] animate-[bounce_4s_infinite]",
	"left-[70vw] top-[80vh] animate-[pulse_6s_infinite]",
	"left-[76vw] top-[74vh] animate-[bounce_5s_infinite]",
	"left-[82vw] top-[91vh] animate-[pulse_4s_infinite]",
	"left-[88vw] top-[83vh] animate-[bounce_6s_infinite]",
	"left-[94vw] top-[77vh] animate-[pulse_5s_infinite]",
];

export default function NotFoundPage() {
	const router = useRouter();

	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b12] px-6 text-white">
			<div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
				{particles.map((className, index) => (
					<span
						key={index}
						className={`absolute h-1 w-1 rounded-full bg-[#e8ff47] opacity-40 ${className}`}
					/>
				))}
			</div>

			<div className="pointer-events-none fixed left-[10%] top-[10%] z-0 h-80 w-80 rounded-full bg-[#e8ff47] opacity-20 blur-[120px]" />
			<div className="pointer-events-none fixed bottom-[10%] right-[10%] z-0 h-80 w-80 rounded-full bg-[#a0ff47] opacity-20 blur-[120px]" />

			<section className="relative z-10 w-full max-w-[520px] rounded-[28px] border border-white/10 bg-white/[0.06] px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-12 sm:py-12">
				<span className="mb-4 block text-4xl" aria-hidden="true">
					🔍
				</span>

				<div className="inline-flex rounded-full bg-[#e8ff47]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#e8ff47]">
					Error
				</div>

				<div className="mt-5 text-[clamp(5rem,18vw,9rem)] font-black leading-none text-[#e8ff47] drop-shadow-[0_0_18px_rgba(232,255,71,0.22)]">
					404
				</div>

				<h1 className="mt-4 text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold">
					Page Not Found
				</h1>

				<p className="mx-auto mt-4 max-w-[420px] text-base leading-7 text-white/70">
					The page you&apos;re looking for has gone missing. It may have been
					moved, renamed, or never existed. Let&apos;s get you back on track.
				</p>

				<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
					<Link
						href="/"
						className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#e8ff47] px-5 text-sm font-bold text-[#0b0f14] transition hover:-translate-y-0.5 hover:opacity-90"
					>
						Go Home
					</Link>

					<button
						type="button"
						onClick={() => router.back()}
						className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-transparent px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/5"
					>
						Go Back
					</button>
				</div>
			</section>
		</main>
	);
}