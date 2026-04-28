"use client";

import { FormEvent, useState } from "react";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { useToast } from "@/components/ui/toast-provider";

type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string;
  createdAt: string;
};

const CONTACT_SUBMISSIONS_KEY = "smartstock.contact.submissions.v1";

function readContactSubmissions(): ContactSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONTACT_SUBMISSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ContactSubmission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeContactSubmissions(submissions: ContactSubmission[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONTACT_SUBMISSIONS_KEY, JSON.stringify(submissions));
}

function InputField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.5a.875.875 0 110-1.75.875.875 0 010 1.75z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export default function ContactPage() {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});

  const inputClass = (hasError?: string) =>
    `h-11 w-full rounded-xl border bg-background px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 ${
      hasError
        ? "border-destructive/60 focus:border-destructive focus:ring-destructive/20"
        : "border-border/70 focus:border-primary/60"
    }`;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: { name?: string; email?: string; message?: string } = {};
    if (name.trim().length < 2) nextErrors.name = "Please enter your full name.";
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
      nextErrors.email = "Please enter a valid email address.";
    if (message.trim().length < 10)
      nextErrors.message = "Please provide at least 10 characters.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast({
        title: "Please fix form errors",
        description: "Name, email, and message are required.",
        source: "Contact",
        severity: "warning",
      });
      return;
    }

    const submission: ContactSubmission = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      email: normalizedEmail,
      company: company.trim(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    writeContactSubmissions([submission, ...readContactSubmissions()].slice(0, 100));
    setName(""); setEmail(""); setCompany(""); setMessage(""); setErrors({});
    setSubmitted(true);

    showToast({
      title: "Message submitted",
      description: "Thanks for contacting SmartStock. Our team will reach out soon.",
      source: "Contact",
      severity: "info",
    });
  };

  return (
    <PublicPageShell
      title="Contact"
      subtitle="Talk to us about onboarding, partnerships, or enterprise deployments."
    >
      <section className="grid gap-5 lg:grid-cols-2">

        {/* Send message card */}
        <article className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          {/* Top accent */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-400 to-sky-400" />

          <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-200/60 bg-blue-50 text-blue-600 dark:border-blue-800/60 dark:bg-blue-950/60 dark:text-blue-400">
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Send us a message</h2>
                <p className="text-xs text-muted-foreground">We reply within one business day</p>
              </div>
            </div>

            {/* Success state */}
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-600 dark:border-green-800 dark:bg-green-950/60 dark:text-green-400">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-foreground">Message sent!</p>
                <p className="text-xs text-muted-foreground">Our team will be in touch shortly.</p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-1 text-xs font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className="grid gap-4" onSubmit={handleSubmit}>
                {/* Name + Email row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField label="Full name *" error={errors.name}>
                    <input
                      className={inputClass(errors.name)}
                      placeholder="Jane Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-invalid={errors.name ? "true" : "false"}
                    />
                  </InputField>

                  <InputField label="Email *" error={errors.email}>
                    <input
                      className={inputClass(errors.email)}
                      placeholder="jane@company.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={errors.email ? "true" : "false"}
                    />
                  </InputField>
                </div>

                <InputField label="Company">
                  <input
                    className={inputClass()}
                    placeholder="Acme Corp (optional)"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </InputField>

                <InputField label="Message *" error={errors.message}>
                  <textarea
                    className={`${inputClass(errors.message)} h-auto min-h-28 resize-none py-3`}
                    placeholder="How can we help you today?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    aria-invalid={errors.message ? "true" : "false"}
                  />
                </InputField>

                <button
                  type="submit"
                  className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  Send message
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </button>

                <p className="text-center text-[11px] text-muted-foreground/60">
                  We'll never share your information with third parties.
                </p>
              </form>
            )}
          </div>
        </article>

        {/* Direct channels card */}
        <article className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-400">
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Direct channels</h2>
              <p className="text-xs text-muted-foreground">Mon–Fri, 8:00–18:00 ICT</p>
            </div>
          </div>

          <ul className="space-y-3">
            {[
              {
                icon: (
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                ),
                label: "Support",
                value: "support@smartstock.app",
                href: "mailto:support@smartstock.app",
              },
              {
                icon: (
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                ),
                label: "Sales",
                value: "sales@smartstock.app",
                href: "mailto:sales@smartstock.app",
              },
              {
                icon: (
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                ),
                label: "Phone",
                value: "+855 12 345 678",
                href: "tel:+85512345678",
              },
            ].map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 transition-colors hover:border-border hover:bg-muted/60"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon}
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60">{item.label}</p>
                    <p className="truncate text-sm font-medium text-foreground">{item.value}</p>
                  </div>
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </article>

      </section>
    </PublicPageShell>
  );
}