"use client";

import Link from "next/link";
import { useMemo } from "react";

type ConfettiPiece = {
	id: number;
	left: string;
	background: string;
	borderRadius: string;
	delayClass: string;
	animationClass: string;
};

const colors = ["#47ffb2", "#e8ff47", "#47c8ff", "#ff47b2", "#ffffff"];

const CheckIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="44"
		height="44"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="3"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M20 6 9 17l-5-5" />
	</svg>
);

export default function SuccessPage() {
	const confetti = useMemo<ConfettiPiece[]>(
		() =>
			Array.from({ length: 60 }, (_, index) => ({
				id: index,
				left: `${Math.random() * 100}vw`,
				background: colors[Math.floor(Math.random() * colors.length)],
				borderRadius: Math.random() > 0.5 ? "999px" : "2px",
				delayClass:
					index % 4 === 0
						? "delay-0"
						: index % 4 === 1
							? "delay-150"
							: index % 4 === 2
								? "delay-300"
								: "delay-500",
				animationClass: index % 2 === 0 ? "animate-bounce" : "animate-pulse",
			})),
		[],
	);

	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b12] px-6 text-white">
			<div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
				{confetti.map((piece) => (
					<span
						key={piece.id}
						className={`absolute top-0 h-2 w-2 opacity-80 ${piece.animationClass} ${piece.delayClass}`}
						style={{
							left: piece.left,
							backgroundColor: piece.background,
							borderRadius: piece.borderRadius,
						}}
					/>
				))}
			</div>

			<div className="pointer-events-none fixed left-[10%] top-[10%] z-0 h-80 w-80 rounded-full bg-[#47ffb2] opacity-20 blur-[120px]" />
			<div className="pointer-events-none fixed bottom-[10%] right-[10%] z-0 h-80 w-80 rounded-full bg-[#e8ff47] opacity-20 blur-[120px]" />

			<section className="relative z-10 w-full max-w-[520px] rounded-[28px] border border-white/10 bg-white/[0.06] px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-12 sm:py-12">
				<div className="mx-auto mb-6 flex h-[90px] w-[90px] scale-100 items-center justify-center rounded-full border-2 border-[#47ffb2]/30 bg-[#47ffb2]/10 text-[#47ffb2] shadow-[0_0_30px_rgba(71,255,178,0.2)] transition-transform duration-500">
					<CheckIcon />
				</div>

				<div className="inline-flex rounded-full bg-[#47ffb2]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#47ffb2]">
					Completed
				</div>

				<h1 className="mt-5 text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold text-[#47ffb2]">
					Success!
				</h1>

				<p className="mx-auto mt-4 max-w-[420px] text-base leading-7 text-white/70">
					Your action was completed successfully. Here&apos;s a summary of what
					just happened.
				</p>

				<div className="my-8 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left">
					<div className="flex items-center justify-between border-b border-white/10 py-2 text-sm">
						<span className="text-white/45">Order ID</span>
						<span className="font-medium text-white">#ORD-2024-8821</span>
					</div>

					<div className="flex items-center justify-between border-b border-white/10 py-2 text-sm">
						<span className="text-white/45">Status</span>
						<span className="font-medium text-[#47ffb2]">Confirmed</span>
					</div>

					<div className="flex items-center justify-between py-2 text-sm">
						<span className="text-white/45">Estimated delivery</span>
						<span className="font-medium text-white">2-3 business days</span>
					</div>
				</div>

				<div className="flex flex-col justify-center gap-3 sm:flex-row">
					<Link
						href="/dashboard"
						className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#47ffb2] px-5 text-sm font-bold text-[#0b0f14] transition hover:-translate-y-0.5 hover:opacity-90"
					>
						Go to Dashboard
					</Link>

					<Link
						href="/receipt"
						className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-transparent px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/5"
					>
						View Receipt
					</Link>
				</div>
			</section>
		</main>
	);
}