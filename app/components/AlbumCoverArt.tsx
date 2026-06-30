"use client";

import { useState } from "react";
import { cx } from "@/app/components/ui";

type Props = {
  albumName?: string | null;
  artistName?: string | null;
  coverUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClass = {
  sm: "size-14 rounded-xl text-sm",
  md: "size-20 rounded-2xl text-base",
  lg: "size-28 rounded-2xl text-lg sm:size-32",
} as const;

function initials(albumName?: string | null, artistName?: string | null) {
  const album = albumName?.trim();
  if (album) return album.slice(0, 2).toUpperCase();
  const artist = artistName?.trim();
  if (artist) return artist.slice(0, 2).toUpperCase();
  return "♪";
}

function FallbackCover({
  albumName,
  artistName,
  size = "md",
  className,
}: Props) {
  const label = [albumName, artistName].filter(Boolean).join(" by ") || "Album cover";

  return (
    <div
      aria-label={label}
      className={cx(
        "flex shrink-0 items-center justify-center border-2 border-foreground bg-accent-peach/45 font-black uppercase tracking-tight text-accent-peach-fg landing-sticker-sm",
        sizeClass[size],
        className
      )}
    >
      <span>{initials(albumName, artistName)}</span>
    </div>
  );
}

export function AlbumCoverArt({
  albumName,
  artistName,
  coverUrl,
  size = "md",
  className,
}: Props) {
  const [failed, setFailed] = useState(false);
  const label = [albumName, artistName].filter(Boolean).join(" by ") || "Album cover";

  if (!coverUrl || failed) {
    return (
      <FallbackCover
        albumName={albumName}
        artistName={artistName}
        size={size}
        className={className}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external Spotify CDN URLs with inline fallback.
    <img
      src={coverUrl}
      alt={label}
      className={cx(
        "shrink-0 border-2 border-foreground object-cover landing-sticker-sm",
        sizeClass[size],
        className
      )}
      onError={() => setFailed(true)}
    />
  );
}
