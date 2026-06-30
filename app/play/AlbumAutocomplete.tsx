"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cx, inputClass } from "@/app/components/ui";
import { searchSpotifyAlbums } from "@/app/actions/spotify";
import type { SpotifyAlbumSuggestion } from "@/lib/mania/spotify/types";
import { AlbumCoverArt } from "@/app/components/AlbumCoverArt";

type Props = {
  albumName: string;
  artistName: string;
  albumUrl: string;
  spotifyAlbumId: string | null;
  albumCoverUrl: string | null;
  spotifyEnabled: boolean;
  disabled?: boolean;
  onAlbumNameChange: (value: string) => void;
  onArtistNameChange: (value: string) => void;
  onAlbumUrlChange: (value: string) => void;
  onSpotifyMetadataChange: (metadata: {
    spotifyAlbumId: string | null;
    albumCoverUrl: string | null;
  }) => void;
};

const DEBOUNCE_MS = 350;

export function AlbumAutocomplete({
  albumName,
  artistName,
  albumUrl,
  spotifyAlbumId,
  albumCoverUrl,
  spotifyEnabled,
  disabled = false,
  onAlbumNameChange,
  onArtistNameChange,
  onAlbumUrlChange,
  onSpotifyMetadataChange,
}: Props) {
  const listboxId = useId();
  const [query, setQuery] = useState(albumName);
  const [suggestions, setSuggestions] = useState<SpotifyAlbumSuggestion[]>([]);
  const [searchStatus, setSearchStatus] = useState<
    "idle" | "loading" | "empty" | "error" | "unconfigured"
  >("idle");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const blurTimeout = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(albumName);
  }, [albumName]);

  useEffect(() => {
    if (!spotifyEnabled) {
      setSuggestions([]);
      setSearchStatus("unconfigured");
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSearchStatus("idle");
      return;
    }

    setSearchStatus("loading");
    const handle = window.setTimeout(() => {
      void searchSpotifyAlbums(trimmed).then((result) => {
        if (!result.ok) {
          setSuggestions([]);
          setSearchStatus("error");
          return;
        }

        const payload = result.data;
        if (!payload.ok) {
          setSuggestions([]);
          if (payload.reason === "unconfigured") {
            setSearchStatus("unconfigured");
          } else if (payload.reason === "invalid_query") {
            setSearchStatus("idle");
          } else {
            setSearchStatus("error");
          }
          return;
        }

        setSuggestions(payload.suggestions);
        setSearchStatus(payload.suggestions.length > 0 ? "idle" : "empty");
      });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [query, spotifyEnabled]);

  function clearSpotifyMetadata() {
    onSpotifyMetadataChange({ spotifyAlbumId: null, albumCoverUrl: null });
  }

  function selectSuggestion(suggestion: SpotifyAlbumSuggestion) {
    onAlbumNameChange(suggestion.albumName);
    onArtistNameChange(suggestion.artistName);
    onAlbumUrlChange(suggestion.spotifyUrl);
    onSpotifyMetadataChange({
      spotifyAlbumId: suggestion.spotifyAlbumId,
      albumCoverUrl: suggestion.coverUrl,
    });
    setQuery(suggestion.albumName);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleAlbumInputChange(value: string) {
    setQuery(value);
    onAlbumNameChange(value);
    if (spotifyAlbumId || albumCoverUrl) {
      clearSpotifyMetadata();
    }
    setOpen(true);
  }

  function handleArtistInputChange(value: string) {
    onArtistNameChange(value);
    if (spotifyAlbumId || albumCoverUrl) {
      clearSpotifyMetadata();
    }
  }

  function handleAlbumUrlChange(value: string) {
    onAlbumUrlChange(value);
    if (spotifyAlbumId || albumCoverUrl) {
      clearSpotifyMetadata();
    }
  }

  const showSuggestions =
    open && spotifyEnabled && suggestions.length > 0 && query.trim().length >= 2;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div ref={containerRef} className="relative sm:col-span-2">
        <label className="flex flex-col gap-2 text-sm font-bold">
          <span className="text-foreground">Album</span>
          <input
            value={query}
            disabled={disabled}
            autoComplete="off"
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls={showSuggestions ? listboxId : undefined}
            aria-activedescendant={
              showSuggestions && activeIndex >= 0
                ? `${listboxId}-option-${activeIndex}`
                : undefined
            }
            onFocus={() => {
              if (blurTimeout.current != null) {
                window.clearTimeout(blurTimeout.current);
              }
              setOpen(true);
            }}
            onBlur={() => {
              blurTimeout.current = window.setTimeout(() => setOpen(false), 150);
            }}
            onChange={(event) => handleAlbumInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (!showSuggestions) return;
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((current) =>
                  current >= suggestions.length - 1 ? 0 : current + 1
                );
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((current) =>
                  current <= 0 ? suggestions.length - 1 : current - 1
                );
              } else if (event.key === "Enter" && activeIndex >= 0) {
                event.preventDefault();
                const suggestion = suggestions[activeIndex];
                if (suggestion) selectSuggestion(suggestion);
              } else if (event.key === "Escape") {
                setOpen(false);
                setActiveIndex(-1);
              }
            }}
            className={inputClass}
            placeholder="Start typing to search Spotify or enter manually"
          />
        </label>

        {spotifyEnabled && searchStatus === "loading" ? (
          <p className="mt-2 text-xs text-foreground-secondary">Searching Spotify…</p>
        ) : null}

        {spotifyEnabled && searchStatus === "empty" && query.trim().length >= 2 ? (
          <p className="mt-2 text-xs text-foreground-secondary">
            No Spotify matches — you can still enter the album manually below.
          </p>
        ) : null}

        {spotifyEnabled && searchStatus === "error" ? (
          <p className="mt-2 text-xs text-foreground-secondary">
            Spotify search is temporarily unavailable. Enter the album manually.
          </p>
        ) : null}

        {!spotifyEnabled ? (
          <p className="mt-2 text-xs text-foreground-secondary">
            Spotify search is not configured — enter album details manually.
          </p>
        ) : null}

        {showSuggestions ? (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border-2 border-foreground bg-surface p-2 landing-sticker-sm"
          >
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.spotifyAlbumId} role="presentation">
                <button
                  type="button"
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                    index === activeIndex
                      ? "bg-accent-orange/15"
                      : "hover:bg-surface-raised"
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSuggestion(suggestion)}
                >
                  <AlbumCoverArt
                    albumName={suggestion.albumName}
                    artistName={suggestion.artistName}
                    coverUrl={suggestion.coverUrl}
                    size="sm"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-foreground">
                      {suggestion.albumName}
                    </span>
                    <span className="block truncate text-xs text-foreground-secondary">
                      {suggestion.artistName}
                      {suggestion.releaseYear ? ` · ${suggestion.releaseYear}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <label className="flex flex-col gap-2 text-sm font-bold">
        <span className="text-foreground">Artist</span>
        <input
          value={artistName}
          disabled={disabled}
          onChange={(event) => handleArtistInputChange(event.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-bold">
        <span className="text-foreground">Album URL (optional)</span>
        <input
          value={albumUrl}
          disabled={disabled}
          onChange={(event) => handleAlbumUrlChange(event.target.value)}
          className={inputClass}
          placeholder="https://open.spotify.com/album/..."
        />
      </label>

      {albumCoverUrl || albumName.trim() || artistName.trim() ? (
        <div className="sm:col-span-2 flex items-center gap-4 rounded-2xl border-2 border-foreground/10 bg-surface-raised/70 p-4">
          <AlbumCoverArt
            albumName={albumName}
            artistName={artistName}
            coverUrl={albumCoverUrl}
            size="md"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-secondary">
              Preview
            </p>
            <p className="mt-1 truncate text-sm font-bold text-foreground">
              {albumName.trim() || "Album title"}
            </p>
            <p className="truncate text-xs text-foreground-secondary">
              {artistName.trim() || "Artist name"}
              {spotifyAlbumId ? " · from Spotify" : ""}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
