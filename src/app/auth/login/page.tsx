"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { useToast } from "@/components/ui/toast-provider";
import { signInWithEmail } from "@/lib/auth";

/* ------------------------------------------------------------------ */
/*  Inline icons                                                       */
/* ------------------------------------------------------------------ */
const IconMail = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
);
const IconLock = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
const IconEye = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
);
const IconEyeOff = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" /></svg>
);
const IconArrowRight = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);
const IconBarChart = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>
);
const IconShield = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>
);
const IconZap = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></svg>
);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function LoginPage() {
	const router = useRouter();
	const { showToast } = useToast();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const onSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			showToast({ title: "Invalid email", description: "Please enter a valid email address.", source: "Auth", severity: "warning" });
			return;
		}

		if (password.trim().length < 6) {
			showToast({ title: "Invalid password", description: "Password must be at least 6 characters.", source: "Auth", severity: "warning" });
			return;
		}

		setIsLoading(true);
		// Simulate brief loading state for perceived quality
		setTimeout(() => {
			const user = signInWithEmail(email);
			showToast({ title: "Welcome back", description: `Signed in as ${user.fullName}.`, source: "Auth", severity: "info" });
			router.push("/dashboard");
		}, 400);
	};

	return (
		<PublicPageShell>
			<div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg sm:grid sm:grid-cols-[1fr_1.15fr]">

				{/* ── Left: branded panel ─────────────────────────────── */}
				<div className="relative hidden overflow-hidden bg-primary p-8 sm:flex sm:flex-col sm:justify-between">
					{/* Subtle grid pattern overlay */}
					<div
						className="pointer-events-none absolute inset-0 opacity-[0.07]"
						style={{
							backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
							backgroundSize: "24px 24px",
						}}
					/>

					<div className="relative z-10">
						<div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15 text-primary-foreground">
							<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" /></svg>
						</div>
						<h2 className="text-2xl font-bold tracking-tight text-primary-foreground">
							SmartStock
						</h2>
						<p className="mt-2 text-sm leading-relaxed text-primary-foreground/70">
							Inventory intelligence that keeps you ahead of demand, not behind it.
						</p>
					</div>

					<div className="relative z-10 space-y-4">
						{[
							{ icon: <IconBarChart />, text: "30-day demand forecasting" },
							{ icon: <IconZap />, text: "Automated reorder triggers" },
							{ icon: <IconShield />, text: "SLA breach monitoring" },
						].map((feat) => (
							<div key={feat.text} className="flex items-center gap-3 text-primary-foreground/80">
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
									{feat.icon}
								</span>
								<span className="text-sm font-medium">{feat.text}</span>
							</div>
						))}
					</div>

					<p className="relative z-10 mt-8 text-[11px] text-primary-foreground/40">
						Trusted by 200+ warehouse teams worldwide.
					</p>
				</div>

				{/* ── Right: sign-in form ─────────────────────────────── */}
				<div className="px-6 py-8 sm:px-10 sm:py-10">
					{/* Mobile-only logo */}
					<div className="mb-6 flex items-center gap-2 sm:hidden">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" /></svg>
						</div>
						<span className="text-base font-bold text-foreground">SmartStock</span>
					</div>

					<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
						Welcome back
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Sign in to your workspace to continue.
					</p>

					<form className="mt-8 space-y-5" onSubmit={onSubmit}>
						{/* Email */}
						<div>
							<label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-foreground">
								Email address
							</label>
							<div className="relative">
								<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
									<IconMail />
								</span>
								<input
									id="login-email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="example@gmail.com"
									required
									autoComplete="email"
									className="h-11 w-full rounded-lg border border-border/70 bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								/>
							</div>
						</div>

						{/* Password */}
						<div>
							<label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-foreground">
								Password
							</label>
							<div className="relative">
								<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
									<IconLock />
								</span>
								<input
									id="login-password"
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Enter password"
									required
									autoComplete="current-password"
									className="h-11 w-full rounded-lg border border-border/70 bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								/>
								<button
									type="button"
									onClick={() => setShowPassword((v) => !v)}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
									aria-label={showPassword ? "Hide password" : "Show password"}
									tabIndex={-1}
								>
									{showPassword ? <IconEyeOff /> : <IconEye />}
								</button>
							</div>
						</div>

						{/* Links row */}
						<div className="flex items-center justify-between text-sm">
							<Link
								href="/forgot-password"
								className="font-medium text-muted-foreground transition-colors hover:text-foreground"
							>
								Forgot password?
							</Link>
						</div>

						{/* Submit */}
						<button
							type="submit"
							disabled={isLoading}
							className="relative flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
						>
							{isLoading ? (
								<span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
							) : (
								<>
									Sign in
									<IconArrowRight />
								</>
							)}
						</button>
					</form>

					{/* Divider */}
					<div className="relative my-6">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-border/50" />
						</div>
						<div className="relative flex justify-center">
							<span className="bg-card px-3 text-xs text-muted-foreground/60">or</span>
						</div>
					</div>

					{/* Create account CTA */}
					<p className="text-center text-sm text-muted-foreground">
						Don&apos;t have an account?{" "}
						<Link
							href="/signup"
							className="font-semibold text-primary transition-colors hover:text-primary/80"
						>
							Create one free
						</Link>
					</p>
				</div>
			</div>
		</PublicPageShell>
	);
}