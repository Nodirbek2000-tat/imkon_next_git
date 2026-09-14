"use client";

import { useState } from "react";
import { api, ApiError, type ApiPost } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

/** Instagram uslubidagi post: karusel + like */
export function PostCard({ post }: { post: ApiPost }) {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState(post.is_liked);
  const [likes, setLikes] = useState(post.likes_count);
  const [busy, setBusy] = useState(false);

  const images = post.images ?? [];

  const toggleLike = async () => {
    if (!user || busy) return;

    // Optimistik yangilash — javob kutilmaydi, xato bo'lsa qaytariladi
    const previous = { liked, likes };
    setLiked(!liked);
    setLikes((n) => n + (liked ? -1 : 1));
    setBusy(true);

    try {
      const result = await api.likePost(post.id);
      setLiked(result.liked);
    } catch (err) {
      setLiked(previous.liked);
      setLikes(previous.likes);
      if (err instanceof ApiError && err.status !== 401) console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface)] shadow-[var(--shadow-soft)]">
      {/* Sarlavha */}
      <div className="flex items-center gap-3 p-4">
        {post.artisan_avatar ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={post.artisan_avatar} alt="" className="size-10 rounded-full object-cover" />
        ) : (
          <span className="grid size-10 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {post.artisan_name.charAt(0)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold">{post.artisan_name}</p>
          <p className="text-[12px] text-ink-600 dark:text-ink-400">
            {new Date(post.created_at).toLocaleDateString("uz-UZ", {
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </div>

      {/* Rasm karuseli */}
      {images.length > 0 ? (
        <div className="relative aspect-square bg-ink-100 dark:bg-ink-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[index].image}
            alt={post.caption || "Post rasmi"}
            className="size-full object-cover"
            loading="lazy"
          />

          {images.length > 1 && (
            <>
              <CarouselButton
                side="left"
                disabled={index === 0}
                onClick={() => setIndex((i) => i - 1)}
              />
              <CarouselButton
                side="right"
                disabled={index === images.length - 1}
                onClick={() => setIndex((i) => i + 1)}
              />
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                {images.map((image, i) => (
                  <span
                    key={image.id}
                    className={cn(
                      "size-1.5 rounded-full transition-all duration-300",
                      i === index ? "w-4 bg-white" : "bg-white/50",
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          className="grain relative aspect-square"
          style={{ background: "linear-gradient(135deg, #dc1b38, #490611)" }}
          aria-hidden="true"
        />
      )}

      {/* Amallar */}
      <div className="p-4">
        <button
          type="button"
          onClick={toggleLike}
          disabled={!user}
          aria-pressed={liked}
          aria-label={liked ? "Like'ni olib tashlash" : "Like bosish"}
          title={user ? undefined : "Like bosish uchun kiring"}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-300",
            "[transition-timing-function:var(--ease-spring)]",
            liked ? "text-brand-600" : "text-ink-600 dark:text-ink-400",
            user ? "hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950" : "cursor-not-allowed opacity-60",
          )}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill={liked ? "currentColor" : "none"}
            className={cn("transition-transform duration-300", liked && "scale-110")}
            aria-hidden="true"
          >
            <path
              d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6C20.5 15 12 20.5 12 20.5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-sm font-semibold tabular-nums">{likes}</span>
        </button>

        {post.caption && (
          <p className="mt-3 leading-relaxed whitespace-pre-line text-ink-800 dark:text-ink-200">
            {post.caption}
          </p>
        )}
      </div>
    </article>
  );
}

function CarouselButton({
  side,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Oldingi rasm" : "Keyingi rasm"}
      className={cn(
        "absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full",
        "bg-ink-950/50 text-white backdrop-blur transition-opacity duration-300",
        "hover:bg-ink-950/70 disabled:pointer-events-none disabled:opacity-0",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d={side === "left" ? "M10 3 6 8l4 5" : "M6 3l4 5-4 5"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
