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

export default function ContactPage() {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: {
      name?: string;
      email?: string;
      message?: string;
    } = {};

    if (name.trim().length < 2) {
      nextErrors.name = "Please enter your full name.";
    }

    const normalizedEmail = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (message.trim().length < 10) {
      nextErrors.message = "Please provide at least 10 characters so we can help effectively.";
    }

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

    setName("");
    setEmail("");
    setCompany("");
    setMessage("");
    setErrors({});

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
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Send us a message</h2>
          <form className="mt-3 grid gap-3" onSubmit={handleSubmit}>
            <div className="grid gap-1">
              <input
                className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="grid gap-1">
              <input
                className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <input
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              placeholder="Company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />

            <div className="grid gap-1">
              <textarea
                className="min-h-28 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                placeholder="How can we help?"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                aria-invalid={errors.message ? "true" : "false"}
              />
              {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
            </div>

            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Submit
            </button>
          </form>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Direct channels</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Email: support@smartstock.app</li>
            <li>• Sales: sales@smartstock.app</li>
            <li>• Phone: +855 12 345 678</li>
            <li>• Office hours: Mon-Fri, 8:00-18:00 ICT</li>
          </ul>
        </article>
      </section>
    </PublicPageShell>
  );
}
