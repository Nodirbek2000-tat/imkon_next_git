"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { StarPicker, StaticStars } from "@/components/Comments";
import { useAuth } from "@/components/auth/AuthProvider";
import { MyComments } from "@/components/profile/MyComments";
import { api, ApiError, type ApiComment, type ApiProduct } from "@/lib/api";
import { formatDate } from "@/lib/utils";

/** Profildagi "Sharhlarim" bo'limi — o'zi yozgan sharhlar + yangi sharh yozish. */
export function MyReviews() {
  const { user } = useAuth();

  const [written, setWritten] = useState<ApiComment[] | null>(null);

  const load = useCallback(() => {
    api
      .myWrittenComments()
      .then((data) => setWritten(data.results))
      .catch(() => setWritten([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8">
      <WriteReview onSent={load} />
      <WrittenReviews comments={written} onChanged={load} />
      {user?.is_artisan && (
        <div>
          <h2 className="text-xl font-bold">Mahsulotlaringizga yozilgan sharhlar</h2>
          <p className="mt-1 mb-4 text-sm text-ink-600 dark:text-ink-400">
            Xaridorlar do&apos;koningizdagi ishlarga qoldirgan sharhlar.
          </p>
          <MyComments />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- yangi sharh */

function WriteReview({ onSent }: { onSent: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const id = setTimeout(() => {
      api
        .products({ search: trimmed })
        .then((data) => setResults(data.results.slice(0, 5)))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <div className="rounded-[var(--radius-card)] border-2 border-dashed p-6">
      <h2 className="text-xl font-bold">Yangi sharh yozish</h2>
      <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
        Sotib olgan buyumingizni qidiring va fikringizni qoldiring.
      </p>

      <div className="mt-4 max-w-sm">
        <Input
          id="review-search"
          label="Mahsulot qidirish"
          placeholder="Masalan: kulolchilik idish"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {searching && (
        <p className="mt-3 text-sm text-ink-600 dark:text-ink-400">Qidirilmoqda…</p>
      )}

      {results.length > 0 && (
        <ul className="mt-4 space-y-3">
          {results.map((product) => (
            <li key={product.id}>
              <ReviewTarget
                product={product}
                open={openSlug === product.slug}
                onToggle={() =>
                  setOpenSlug((s) => (s === product.slug ? null : product.slug))
                }
                onSent={() => {
                  setOpenSlug(null);
                  setQuery("");
                  setResults([]);
                  onSent();
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewTarget({
  product,
  open,
  onToggle,
  onSent,
}: {
  product: ApiProduct;
  open: boolean;
  onToggle: () => void;
  onSent: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;

    setBusy(true);
    setError("");
    try {
      await api.addComment(product.slug, text.trim(), undefined, rating > 0 ? rating : undefined);
      setText("");
      setRating(0);
      onSent();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sharh yuborilmadi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
      <div className="flex items-center gap-3 p-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-ink-100 dark:bg-ink-800">
          {product.main_image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.main_image.url}
              alt={product.main_image.alt || product.title}
              className="size-full object-cover"
            />
          ) : (
            <div className="grain size-full bg-gradient-to-br from-brand-500 to-gold-500" />
          )}
        </div>
        <p className="min-w-0 flex-1 truncate font-semibold">{product.title}</p>
        <Button type="button" size="sm" variant={open ? "outline" : "primary"} onClick={onToggle}>
          {open ? "Bekor qilish" : "Sharh yozish"}
        </Button>
      </div>

      {open && (
        <form onSubmit={submit} className="space-y-3 border-t border-[var(--line)] p-4">
          <div>
            <span className="mb-2 block text-sm font-semibold">
              Bahoingiz <span className="font-normal text-ink-600 dark:text-ink-400">(ixtiyoriy)</span>
            </span>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <Textarea
            id={`review-text-${product.slug}`}
            label="Fikringiz"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={1500}
            placeholder="Mahsulot haqida fikringizni yozing…"
          />

          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm" disabled={busy || !text.trim()}>
              {busy ? "Yuborilmoqda…" : "Yuborish"}
            </Button>
            {error && (
              <span role="alert" className="text-sm font-medium text-brand-600">
                {error}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- yozganlarim */

function WrittenReviews({
  comments,
  onChanged,
}: {
  comments: ApiComment[] | null;
  onChanged: () => void;
}) {
  const [busyId, setBusyId] = useState<number | null>(null);

  const remove = async (comment: ApiComment) => {
    setBusyId(comment.id);
    try {
      await api.deleteComment(comment.product_slug, comment.id);
      onChanged();
    } catch {
      /* jim — ro'yxat o'zgarmay qoladi, foydalanuvchi qayta urinishi mumkin */
    } finally {
      setBusyId(null);
    }
  };

  if (comments === null) {
    return (
      <ul className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <li key={i} className="rounded-[var(--radius-card)] border p-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-3 h-4 w-full" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold">Men yozgan sharhlar</h2>

      {comments.length === 0 ? (
        <div className="mt-4 rounded-[var(--radius-card)] border border-dashed p-10 text-center">
          <p className="font-semibold">Hali sharh yozmagansiz</p>
          <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
            Sotib olgan mahsulotingiz haqida fikringizni yuqoridan qoldiring.
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="flex gap-4 rounded-[var(--radius-card)] border bg-[var(--surface)] p-5"
            >
              <Link
                href={`/mahsulot/${comment.product_slug}`}
                className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-ink-100 dark:bg-ink-800"
              >
                {comment.product_image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={comment.product_image}
                    alt={comment.product_title}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="grain size-full bg-gradient-to-br from-brand-500 to-gold-500" />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/mahsulot/${comment.product_slug}`}
                    className="truncate text-sm font-semibold hover:text-brand-600"
                  >
                    {comment.product_title}
                  </Link>
                  <time className="shrink-0 text-[12px] text-ink-600 dark:text-ink-400">
                    {formatDate(comment.created_at)}
                  </time>
                </div>

                {comment.rating != null && <StaticStars value={comment.rating} />}

                <p className="mt-2 leading-relaxed">{comment.text}</p>

                <button
                  type="button"
                  onClick={() => remove(comment)}
                  disabled={busyId === comment.id}
                  className="mt-3 text-sm font-medium text-ink-600 hover:text-brand-600 dark:text-ink-400"
                >
                  {busyId === comment.id ? "O'chirilmoqda…" : "O'chirish"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
