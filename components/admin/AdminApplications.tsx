"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge, LiveDot } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { adminApi, ApiError, type AdminApplication } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

const FILTERS = [
  { value: "pending", label: "Kutayotgan" },
  { value: "approved", label: "Tasdiqlangan" },
  { value: "rejected", label: "Rad etilgan" },
  { value: "", label: "Hammasi" },
];

export function AdminApplications({ onChange }: { onChange: () => void }) {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("pending");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.applications(filter || undefined);
      setApplications(data.results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const afterReview = () => {
    load();
    onChange();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            aria-pressed={filter === item.value}
            className={cn(
              "rounded-full border-2 px-4 py-2 text-[13px] font-semibold transition-all duration-300",
              filter === item.value
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-[var(--line)] hover:border-brand-600",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <ul className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="rounded-[var(--radius-card)] border p-6">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="mt-3 h-4 w-2/3" />
              <Skeleton className="mt-5 h-11 w-48" />
            </li>
          ))}
        </ul>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : applications.length === 0 ? (
        <EmptyState
          title="Ariza yo'q"
          hint={filter === "pending" ? "Hamma ariza ko'rib chiqilgan" : undefined}
          icon={filter === "pending" ? "✅" : "📭"}
        />
      ) : (
        <ul className="space-y-4">
          {applications.map((application, i) => (
            <li key={application.id}>
              <Reveal delay={Math.min(i, 5) * 0.06}>
                <ApplicationCard application={application} onReviewed={afterReview} />
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ApplicationCard({
  application,
  onReviewed,
}: {
  application: AdminApplication;
  onReviewed: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");
  const [showNote, setShowNote] = useState(false);

  const isPending = application.status === "pending";

  const review = async (action: "approve" | "reject") => {
    setBusy(action);
    setError("");
    try {
      if (action === "approve") await adminApi.approveApplication(application.id, note);
      else await adminApi.rejectApplication(application.id, note);
      onReviewed();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Amal bajarilmadi");
    } finally {
      setBusy(null);
    }
  };

  const tone = { pending: "gold", approved: "brand", rejected: "neutral" } as const;
  const label = {
    pending: "Kutmoqda",
    approved: "Tasdiqlangan",
    rejected: "Rad etilgan",
  } as const;

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface)] p-6",
        "transition-[border-color,box-shadow] duration-500",
        isPending && "border-gold-500/40 hover:shadow-[var(--shadow-lift)]",
      )}
    >
      {isPending && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1.5 bg-gold-500"
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {application.user.avatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={application.user.avatar}
              alt=""
              className="size-12 rounded-2xl object-cover"
            />
          ) : (
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-600 font-display text-lg font-bold text-white">
              {(application.user.full_name || application.shop_name).charAt(0)}
            </span>
          )}

          <div>
            <h3 className="text-lg font-bold">{application.shop_name}</h3>
            <p className="text-[13px] text-ink-600 dark:text-ink-400">
              {application.user.full_name || "Ismsiz"} · {application.user.phone}
            </p>
          </div>
        </div>

        <Badge tone={tone[application.status]}>
          {isPending && <LiveDot className="bg-gold-700" />}
          {label[application.status]}
        </Badge>
      </div>

      <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <Field label="Hunar turi" value={application.craft_name} />
        <Field label="Viloyat" value={application.region || "—"} />
        <Field label="Yuborilgan" value={formatDate(application.created_at, true)} />
        {application.document && (
          <div>
            <dt className="text-[11px] font-semibold tracking-[0.1em] text-ink-600 uppercase dark:text-ink-400">
              Hujjat
            </dt>
            <dd className="mt-1">
              <a
                href={application.document}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-600 hover:underline"
              >
                Ko&apos;rish ↗
              </a>
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-5">
        <dt className="text-[11px] font-semibold tracking-[0.1em] text-ink-600 uppercase dark:text-ink-400">
          Nima ishlab chiqaradi
        </dt>
        <p className="mt-1.5 leading-relaxed whitespace-pre-line text-ink-800 dark:text-ink-200">
          {application.description}
        </p>
      </div>

      {application.admin_note && (
        <p className="mt-4 rounded-2xl bg-ink-100 p-4 text-[14px] dark:bg-ink-900">
          <strong>Admin izohi:</strong> {application.admin_note}
        </p>
      )}

      {isPending && (
        <div className="mt-6 border-t pt-5">
          {showNote && (
            <div className="mb-4">
              <label htmlFor={`note-${application.id}`} className="mb-2 block text-sm font-semibold">
                Izoh (ixtiyoriy)
              </label>
              <textarea
                id={`note-${application.id}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Masalan: hujjat aniq emas…"
                className="w-full rounded-2xl border-2 border-[var(--line)] bg-[var(--bg)] p-3 text-[15px] transition-colors outline-none focus:border-brand-600"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => review("approve")}
              disabled={busy !== null}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-all duration-300 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-0.5 hover:bg-brand-700 disabled:opacity-50"
            >
              {busy === "approve" ? "Tasdiqlanmoqda…" : "✓ Tasdiqlash"}
            </button>

            <button
              type="button"
              onClick={() => review("reject")}
              disabled={busy !== null}
              className="inline-flex h-11 items-center rounded-full border-2 border-[var(--line)] px-6 text-sm font-semibold transition-all duration-300 hover:border-brand-600 hover:text-brand-600 disabled:opacity-50"
            >
              {busy === "reject" ? "Rad etilmoqda…" : "Rad etish"}
            </button>

            <button
              type="button"
              onClick={() => setShowNote((v) => !v)}
              className="text-sm font-medium text-ink-600 transition-colors hover:text-brand-600 dark:text-ink-400"
            >
              {showNote ? "Izohni yashirish" : "+ Izoh qo'shish"}
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-brand-600">
              {error}
            </p>
          )}
        </div>
      )}

      {application.status === "approved" && application.user.artisan_slug && (
        <Link
          href={`/hunarmandlar/${application.user.artisan_slug}`}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
        >
          Do&apos;konni ko&apos;rish →
        </Link>
      )}
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-[0.1em] text-ink-600 uppercase dark:text-ink-400">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
