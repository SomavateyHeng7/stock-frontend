import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Inbox,
  Loader2,
  LockKeyhole,
  ServerCrash,
  type LucideIcon,
} from "lucide-react"

type StatusPageItem = {
  href: string
  icon: LucideIcon
  code: string
  title: string
  description: string
  accent: string
  badge: string
}

const statusPages: StatusPageItem[] = [
  {
    href: "/404",
    icon: FileQuestion,
    code: "404",
    title: "Not found",
    description: "Guide users back when a page no longer exists or has moved.",
    accent: "text-cyan-300",
    badge: "bg-cyan-400/10 text-cyan-200 ring-cyan-300/20",
  },
  {
    href: "/403",
    icon: LockKeyhole,
    code: "403",
    title: "Forbidden",
    description: "Explain missing access and give users a safe next step.",
    accent: "text-rose-300",
    badge: "bg-rose-400/10 text-rose-200 ring-rose-300/20",
  },
  {
    href: "/500",
    icon: ServerCrash,
    code: "500",
    title: "Server error",
    description: "Handle backend failures with clear recovery options.",
    accent: "text-orange-300",
    badge: "bg-orange-400/10 text-orange-200 ring-orange-300/20",
  },
  {
    href: "/503",
    icon: AlertTriangle,
    code: "503",
    title: "Maintenance",
    description: "Show downtime status, countdowns, and service context.",
    accent: "text-blue-300",
    badge: "bg-blue-400/10 text-blue-200 ring-blue-300/20",
  },
  {
    href: "/loading",
    icon: Loader2,
    code: "Loading",
    title: "Loading state",
    description: "Use skeletons and progress feedback to reduce uncertainty.",
    accent: "text-violet-300",
    badge: "bg-violet-400/10 text-violet-200 ring-violet-300/20",
  },
  {
    href: "/empty",
    icon: Inbox,
    code: "Empty",
    title: "Empty state",
    description: "Help users take the first action when no content exists.",
    accent: "text-emerald-300",
    badge: "bg-emerald-400/10 text-emerald-200 ring-emerald-300/20",
  },
  {
    href: "/success",
    icon: CheckCircle2,
    code: "Success",
    title: "Success state",
    description: "Confirm completed actions with a clear result summary.",
    accent: "text-lime-300",
    badge: "bg-lime-400/10 text-lime-200 ring-lime-300/20",
  },
]

export default function StatusPagesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-5 py-10 text-white sm:px-8 lg:px-10">
      <div className="pointer-events-none absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />

      <section className="relative mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200 ring-1 ring-white/10">
              Component Library
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Status pages
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
              A polished set of page states for errors, loading, empty content,
              maintenance, and completed actions.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/10">
            <Stat label="Pages" value="7" />
            <Stat label="States" value="5" />
            <Stat label="Ready" value="100%" />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statusPages.map((item) => (
            <StatusCard key={item.href} item={item} />
          ))}
        </div>
      </section>
    </main>
  )
}

function StatusCard({ item }: { item: StatusPageItem }) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
          <Icon className={`h-6 w-6 ${item.accent}`} aria-hidden="true" />
        </div>

        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${item.badge}`}>
          Preview
        </span>
      </div>

      <div className="mt-8">
        <p className={`text-3xl font-black tracking-tight ${item.accent}`}>
          {item.code}
        </p>

        <h2 className="mt-3 text-lg font-semibold text-white">
          {item.title}
        </h2>

        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">
          {item.description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
        <span className="text-sm font-medium text-slate-300">
          Open page
        </span>

        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-slate-300 transition group-hover:bg-white group-hover:text-slate-950">
          <Clock3 className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-4 py-3 text-center ring-1 ring-white/10">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-400">{label}</p>
    </div>
  )
}