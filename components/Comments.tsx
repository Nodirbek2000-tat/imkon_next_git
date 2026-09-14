"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import { api, ApiError, type ApiComment } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

export function Comments({ slug }: { slug: string }) {
  const { user } = useAuth();

  const [comments, setComments] = useState<ApiComment[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [replyTo, setReplyTo] = useState<ApiComment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.comments(slug);
      setComments(data.results);
      setCount(data.count);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;

    setBusy(true);
    setError("");
    try {
      await api.addComment(slug, text.trim(), replyTo?.id, !replyTo && rating > 0 ? rating : undefined);
      setText("");
      setRating(0);
      setReplyTo(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Izoh yuborilmadi");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await api.deleteComment(slug, id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "O'chirilmadi");
    }
  };

  return (
    <section id="izohlar" className="mt-16">
      <h2 className="text-2xl font-extrabold">
        Izohlar
        {count > 0 && (
          <span className="ml-2 text-lg font-bold text-ink-600 dark:text-ink-400">{count}</span>
        )}
      </h2>

      {/* Yozish */}
      {user ? (
        <form onSubmit={submit} className="mt-6 max-w-2xl">
          {replyTo && (
            <div className="mb-3 flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-2.5 text-sm dark:bg-brand-950/40">
              <span>
                <strong>{replyTo.user_name}</strong> ga javob
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="font-semibold text-brand-600 hover:underline"
              >
                Bekor qilish
              </button>
            </div>
          )}

          {!replyTo && (
            <div className="mb-3">
              <span className="mb-2 block text-sm font-semibold">
                Bahoingiz <span className="font-normal text-ink-600 dark:text-ink-400">(ixtiyoriy)</span>
              </span>
              <StarPicker value={rating} onChange={setRating} />
            </div>
          )}

          <label htmlFor="comment-text" className="sr-only">
            Izoh matni
          </label>
          <textarea
            id="comment-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={1500}
            placeholder={replyTo ? "Javobingizni yozing…" : "Fikringizni yozing…"}
            className="w-full resize-y rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] p-4 text-[16px] transition-colors outline-none focus:border-brand-600"
          />

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Button disabled={busy || !text.trim()}>
              {busy ? "Yuborilmoqda…" : replyTo ? "Javob berish" : "Izoh qoldirish"}
            </Button>
            <span className="text-[13px] text-ink-600 dark:text-ink-400">
              {text.length}/1500
            </span>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-brand-600">
              {error}
            </p>
          )}
        </form>
      ) : (
        <div className="mt-6 max-w-2xl rounded-2xl border-2 border-dashed p-6 text-center">
          <p className="font-semibold">Izoh qoldirish uchun kiring</p>
          <Button
            href={`/kirish?next=${encodeURIComponent(`/mahsulot/${slug}#izohlar`)}`}
            size="sm"
            className="mt-3"
          >
            Kirish
          </Button>
        </div>
      )}

      {/* Ro'yxat */}
      <div className="mt-10 max-w-2xl">
        {loading ? (
          <div className="space-y-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-ink-600 dark:text-ink-400">
            Hali izoh yo&apos;q. Birinchi bo&apos;ling!
          </p>
        ) : (
          <ul className="space-y-7">
            {comments.map((comment) => (
              <li key={comment.id}>
                <CommentItem
                  comment={comment}
                  canReply={!!user}
                  onReply={() => setReplyTo(comment)}
                  onDelete={remove}
                />

                {comment.replies.length > 0 && (
                  <ul className="mt-5 space-y-5 border-l-2 pl-5">
                    {comment.replies.map((reply) => (
                      <li key={reply.id}>
                        <CommentItem comment={reply} canReply={false} onDelete={remove} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function CommentItem({
  comment,
  canReply,
  onReply,
  onDelete,
}: {
  comment: ApiComment;
  canReply: boolean;
  onReply?: () => void;
  onDelete: (id: number) => void;
}) {
  return (
    <article className="flex gap-3">
      {comment.user_avatar ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={comment.user_avatar}
          alt=""
          className="size-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-200 text-sm font-bold dark:bg-ink-800">
          {comment.user_name.charAt(0).toUpperCase()}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{comment.user_name}</p>
          {comment.rating && <StaticStars value={comment.rating} />}
          <span className="text-[12px] text-ink-600 dark:text-ink-400">
            {formatDate(comment.created_at, true)}
          </span>
          {comment.is_mine && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              Siz
            </span>
          )}
        </div>

        <p className="mt-1.5 leading-relaxed whitespace-pre-line text-ink-800 dark:text-ink-200">
          {comment.text}
        </p>

        <div className="mt-2 flex gap-4 text-[13px]">
          {canReply && onReply && (
            <button
              type="button"
              onClick={onReply}
              className={cn(
                "font-semibold text-ink-600 transition-colors hover:text-brand-600",
                "dark:text-ink-400",
              )}
            >
              Javob berish
            </button>
          )}
          {comment.is_mine && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="font-semibold text-ink-600 transition-colors hover:text-brand-600 dark:text-ink-400"
            >
              O&apos;chirish
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} yulduz`}
          aria-pressed={value === n}
          onClick={() => onChange(value === n ? 0 : n)}
          className="p-0.5"
        >
          <StarIcon
            filled={n <= value}
            className="size-6 text-gold-500 transition-transform duration-150 hover:scale-110"
          />
        </button>
      ))}
    </div>
  );
}

export function StaticStars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} yulduzli baho`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} filled={n <= value} className="size-3.5 text-gold-500" />
      ))}
    </span>
  );
}

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.5 15 9l7 1-5.2 5 1.3 7-6.1-3.4L5.9 22l1.3-7L2 10l7-1 3-6.5Z" strokeLinejoin="round" />
    </svg>
  );
}
