"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { StaticStars } from "@/components/Comments";
import { api, type ApiComment } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export function MyComments() {
  const [comments, setComments] = useState<ApiComment[] | null>(null);

  useEffect(() => {
    api
      .myComments()
      .then((data) => setComments(data.results))
      .catch(() => setComments([]));
  }, []);

  if (comments === null) {
    return (
      <ul className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="rounded-[var(--radius-card)] border p-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-3 h-4 w-full" />
          </li>
        ))}
      </ul>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed p-10 text-center">
        <p className="font-semibold">Hozircha izoh yo&apos;q</p>
        <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
          Mahsulotlaringizga yozilgan izohlar shu yerda ko&apos;rinadi.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
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
              <p className="text-sm font-semibold">{comment.user_name}</p>
              <time className="text-[12px] text-ink-600 dark:text-ink-400">
                {formatDate(comment.created_at)}
              </time>
            </div>

            {comment.rating != null && <StaticStars value={comment.rating} />}

            <p className="mt-2 leading-relaxed">{comment.text}</p>

            <Link
              href={`/mahsulot/${comment.product_slug}`}
              className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
            >
              “{comment.product_title}” sahifasida javob berish →
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
