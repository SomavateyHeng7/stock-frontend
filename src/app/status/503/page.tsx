"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const formatTime = (value: number) => String(value).padStart(2, "0");

const IconTool = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="40"
		height="40"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.2-3.2a6 6 0 0 1-7.9 7.9l-6 6a2 2 0 0 1-2.8-2.8l6-6a6 6 0 0 1 7.9-7.9z" />
	</svg>
);

export default function MaintenancePage() {
	const [progress, setProgress] = useState(0);
	const [targetTime] = useState(() => Date.now() + 2.5 * 60 * 60 * 1000);
	const [timeLeft, setTimeLeft] = useState({
		hours: 2,
		minutes: 30,
		seconds: 0,
	});

	useEffect(() => {
		let frameId = 0;
		let startTime: number | null = null;
		let timeoutId: ReturnType<typeof setTimeout>;

		const animateProgress = (timestamp: number) => {
			if (!startTime) startTime = timestamp;

			const elapsed = timestamp - startTime;
			const ratio = Math.min(elapsed / 3000, 1);

			setProgress(Math.round(ratio * 68));

			if (ratio < 1) {
				frameId = requestAnimationFrame(animateProgress);
			}
		};

		timeoutId = setTimeout(() => {
			frameId = requestAnimationFrame(animateProgress);
		}, 500);

		return () => {
			clearTimeout(timeoutId);
			cancelAnimationFrame(frameId);
		};
	}, []);

	useEffect(() => {
		const updateCountdown = () => {
			const diff = Math.max(0, targetTime - Date.now());

			const hours = Math.floor(diff / 3600000);
			const minutes = Math.floor((diff % 3600000) / 60000);
			const seconds = Math.floor((diff % 60000) / 1000);

			setTimeLeft({ hours, minutes, seconds });
		};

		updateCountdown();

		const intervalId = setInterval(updateCountdown, 1000);

		return () => clearInterval(intervalId);
	}, [targetTime]);

	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b12] px-6 text-white">
			<div className="pointer-events-none fixed left-[10%] top-[10%] z-0 h-80 w-80 rounded-full bg-[#47c8ff] opacity-20 blur-[120px]" />
			<div className="pointer-events-none fixed bottom-[10%] right-[10%] z-0 h-80 w-80 rounded-full bg-[#4782ff] opacity-20 blur-[120px]" />

			<section className="relative z-10 w-full max-w-[520px] rounded-[28px] border border-white/10 bg-white/[0.06] px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-12 sm:py-12">
				<div className="mx-auto mb-4 flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl border border-[#47c8ff]/20 bg-[#47c8ff]/10 text-[#47c8ff]">
					<IconTool />
				</div>

				<div className="inline-flex rounded-full bg-[#47c8ff]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#47c8ff]">
					Scheduled Maintenance
				</div>

				<div className="mt-5 text-[clamp(5rem,18vw,9rem)] font-black leading-none text-[#47c8ff] drop-shadow-[0_0_18px_rgba(71,200,255,0.22)]">
					503
				</div>

				<h1 className="mt-4 text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold">
					We&apos;ll Be Right Back
				</h1>

				<div className="my-6">
					<div className="mb-2 flex justify-between font-mono text-xs text-white/45">
						<span>Maintenance progress</span>
						<span>{progress}%</span>
					</div>

					<div className="h-1.5 overflow-hidden rounded-full bg-[#47c8ff]/15">
						<div
							className="h-full rounded-full bg-[#47c8ff] shadow-[0_0_12px_#47c8ff] transition-all duration-300 ease-out"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>

				<div className="mb-8 flex justify-center gap-4 sm:gap-5">
					<div className="text-center">
						<span className="block text-3xl font-extrabold leading-none text-[#47c8ff]">
							{formatTime(timeLeft.hours)}
						</span>
						<span className="mt-1 block text-[0.65rem] uppercase tracking-[0.2em] text-white/35">
							Hours
						</span>
					</div>

					<span className="text-3xl font-extrabold leading-none text-[#47c8ff]/30">
						:
					</span>

					<div className="text-center">
						<span className="block text-3xl font-extrabold leading-none text-[#47c8ff]">
							{formatTime(timeLeft.minutes)}
						</span>
						<span className="mt-1 block text-[0.65rem] uppercase tracking-[0.2em] text-white/35">
							Minutes
						</span>
					</div>

					<span className="text-3xl font-extrabold leading-none text-[#47c8ff]/30">
						:
					</span>

					<div className="text-center">
						<span className="block text-3xl font-extrabold leading-none text-[#47c8ff]">
							{formatTime(timeLeft.seconds)}
						</span>
						<span className="mt-1 block text-[0.65rem] uppercase tracking-[0.2em] text-white/35">
							Seconds
						</span>
					</div>
				</div>

				<p className="mx-auto mt-6 max-w-[420px] text-base leading-7 text-white/70">
					We&apos;re performing scheduled maintenance to improve performance and
					reliability. Everything will be back online shortly.
				</p>

				<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
					<Link
						href="/notify"
						className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#47c8ff] px-5 text-sm font-bold text-[#0b0f14] transition hover:-translate-y-0.5 hover:opacity-90"
					>
						Get Notified
					</Link>

					<Link
						href="/status"
						className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-transparent px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/5"
					>
						Status Page
					</Link>
				</div>
			</section>
		</main>
	);
}