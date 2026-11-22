import React, { useState, useMemo } from "react";
import {
  FiHeart,
  FiPlay,
  FiPause,
  FiGrid,
  FiList,
  FiShare2,
  FiLoader,
} from "react-icons/fi";
import useFavorites from "../hooks/useFavorites";
import { moodLabel } from "../utils/moods";
import { createShareImage } from "../utils/shareCard";

/* ---------- Tiện ích ---------- */

const toPercent = (score) => Math.min(100, Math.max(0, Number(score ?? 0) * 100));

const hashHue = (seed) =>
  [...String(seed)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

const truncateText = (text, maxLength = 20) =>
  text.length <= maxLength ? text : text.substring(0, maxLength) + "...";

// Spotify dùng player thấp (152px), nguồn khác dùng tỉ lệ video
function getPlayerProps(url) {
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    // url không hợp lệ, dùng mặc định
  }
  let src = url;
  if (host.includes("youtube") || host === "youtu.be") {
    try {
      const u = new URL(url);
      u.searchParams.set("autoplay", "1");
      src = u.toString();
    } catch {
      // giữ nguyên url
    }
  }
  return { src, className: host.includes("spotify") ? "h-[152px]" : "aspect-video" };
}

function buildPageNumbers(current, total) {
  if (total <= 1) return [1];
  const pages = [1];
  if (total > 5) {
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push("...");
    pages.push(total);
  } else {
    for (let i = 2; i <= total; i++) pages.push(i);
  }
  return pages;
}

/* ---------- Thành phần nhỏ ---------- */

function VinylDisc({ seed, spinning, className = "" }) {
  return (
    <div
      className={`vinyl ${spinning ? "is-spinning" : ""} ${className}`}
      style={{ "--hue": hashHue(seed) }}
      aria-hidden="true"
    >
      <span className="vinyl-label" />
    </div>
  );
}

function FavButton({ active, onToggle, className = "" }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
      title={active ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
      className={`grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full transition-colors hover:bg-fg/10 ${
        active ? "text-accent-text" : "text-muted hover:text-fg"
      } ${className}`}
    >
      <FiHeart size={18} fill={active ? "currentColor" : "none"} />
    </button>
  );
}

function MatchBar({ percent, showLabel = true }) {
  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
      {showLabel && (
        <p className="mt-1.5 text-xs font-semibold">
          Mức độ phù hợp: {percent.toFixed(2)}%
        </p>
      )}
    </div>
  );
}

function SongPlayer({ song }) {
  const { src, className } = getPlayerProps(song.url);
  return (
    <div className="mt-3 overflow-hidden rounded-lg">
      <iframe
        className={`w-full ${className}`}
        src={src}
        title={song.title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}

/* ---------- Thẻ dạng lưới ---------- */

function SongCard({ song, active, favorite, onToggleActive, onToggleFavorite }) {
  const percent = toPercent(song.score);
  return (
    <article
      className={`card flex flex-col rounded-xl p-2.5 transition-colors hover:border-fg/40 hover:bg-surface-2 ${
        active ? "ring-2 ring-accent" : ""
      }`}
    >
      <div className="relative">
        <button
          type="button"
          onClick={onToggleActive}
          aria-pressed={active}
          aria-label={`${active ? "Đóng" : "Phát"} ${song.title}`}
          className="group relative grid aspect-square w-full cursor-pointer place-items-center rounded-lg bg-page"
        >
          <VinylDisc seed={song.id} spinning={active} className="w-[84%]" />
          <span className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-fg shadow-lg transition-transform group-hover:scale-110">
            {active ? <FiPause size={16} /> : <FiPlay size={16} className="translate-x-px" />}
          </span>
        </button>
        <FavButton
          active={favorite}
          onToggle={onToggleFavorite}
          className="absolute left-1.5 top-1.5 bg-page/70 backdrop-blur-sm"
        />
      </div>

      <div className="mt-3 flex flex-col px-0.5">
        <h3 className="truncate font-display text-sm font-bold sm:text-base" title={song.title}>
          {song.title}
        </h3>
        <p className="mb-3 truncate text-xs text-muted sm:text-sm" title={song.artist}>
          {song.artist}
        </p>
        <MatchBar percent={percent} />
      </div>

      {active && <SongPlayer song={song} />}
    </article>
  );
}

/* ---------- Hàng dạng danh sách (kiểu playlist) ---------- */

function SongRow({ song, index, active, favorite, onToggleActive, onToggleFavorite }) {
  const percent = toPercent(song.score);
  return (
    <article
      className={`card rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2 ${
        active ? "ring-2 ring-accent" : ""
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-muted">
          {index}
        </span>

        <button
          type="button"
          onClick={onToggleActive}
          aria-pressed={active}
          aria-label={`${active ? "Đóng" : "Phát"} ${song.title}`}
          className="group relative grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-full"
        >
          <VinylDisc seed={song.id} spinning={active} className="w-full" />
          <span
            className={`absolute inset-0 m-auto grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-fg transition-opacity ${
              active
                ? "opacity-100"
                : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100"
            }`}
          >
            {active ? <FiPause size={12} /> : <FiPlay size={12} className="translate-x-px" />}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-sm font-bold sm:text-base" title={song.title}>
            {song.title}
          </h3>
          <p className="truncate text-xs text-muted sm:text-sm" title={song.artist}>
            {song.artist}
          </p>
        </div>

        <div className="hidden w-44 shrink-0 items-center gap-3 sm:flex">
          <div className="flex-1">
            <MatchBar percent={percent} showLabel={false} />
          </div>
          <span className="w-12 text-right text-sm font-semibold tabular-nums">
            {percent.toFixed(1)}%
          </span>
        </div>
        <span className="text-xs font-semibold tabular-nums sm:hidden">
          {percent.toFixed(0)}%
        </span>

        <FavButton active={favorite} onToggle={onToggleFavorite} />
      </div>

      {active && <SongPlayer song={song} />}
    </article>
  );
}

/* ---------- Danh sách chính ---------- */

function SongListInner({ description, songs, photo, accentColor }) {
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [tab, setTab] = useState("suggested");
  const [view, setView] = useState("grid");
  const [selectedArtist, setSelectedArtist] = useState("all");
  const [selectedMood, setSelectedMood] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeId, setActiveId] = useState(null);
  const [share, setShare] = useState({ busy: false, message: "" });

  // Bỏ bài không có link phát; đảm bảo mọi bài đều có id
  const playable = useMemo(
    () => songs.filter((s) => s.url).map((s) => ({ ...s, id: s.id ?? s.url })),
    [songs]
  );
  const source = tab === "favorites" ? favorites : playable;

  const uniqueArtists = useMemo(
    () => [
      "all",
      ...[...new Set(source.map((s) => s.artist))].sort((a, b) => a.localeCompare(b)),
    ],
    [source]
  );

  const moodCounts = useMemo(() => {
    const counts = {};
    source.forEach((s) =>
      (s.mood_tags || []).forEach((m) => {
        counts[m] = (counts[m] || 0) + 1;
      })
    );
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [source]);

  // Nếu bộ lọc đang chọn không còn tồn tại (đổi tab, bỏ yêu thích...) thì quay về "tất cả"
  const artist = uniqueArtists.includes(selectedArtist) ? selectedArtist : "all";
  const mood = moodCounts.some(([m]) => m === selectedMood) ? selectedMood : "all";

  const filtered = source.filter(
    (s) =>
      (artist === "all" || s.artist === artist) &&
      (mood === "all" || (s.mood_tags || []).includes(mood))
  );

  const pageSize = view === "grid" ? 12 : 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(page * pageSize, filtered.length);
  const pageItems = filtered.slice(startIdx, endIdx);
  const pageNumbers = buildPageNumbers(page, totalPages);

  const changeTab = (id) => {
    setTab(id);
    setSelectedArtist("all");
    setSelectedMood("all");
    setCurrentPage(1);
  };
  const changeView = (id) => {
    setView(id);
    setCurrentPage(1);
  };
  const resetFilters = () => {
    setSelectedArtist("all");
    setSelectedMood("all");
    setCurrentPage(1);
  };

  const handleShare = async () => {
    if (!photo?.url || share.busy) return;
    setShare({ busy: true, message: "" });
    let message = "";
    try {
      const blob = await createShareImage({
        photoUrl: photo.url,
        color: photo.color,
        accent: accentColor,
        songs: playable,
        description,
      });
      const file = new File([blob], "soundora-goi-y.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Soundora" });
      } else {
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = "soundora-goi-y.png";
        a.click();
        URL.revokeObjectURL(href);
        message = "Đã tải ảnh về máy.";
      }
    } catch (err) {
      if (err?.name !== "AbortError") message = "Không thể tạo ảnh. Vui lòng thử lại.";
    }
    setShare({ busy: false, message });
    if (message) setTimeout(() => setShare((s) => ({ ...s, message: "" })), 4000);
  };

  const pageBtn =
    "flex h-10 min-w-10 items-center justify-center rounded-lg px-2.5 text-sm font-semibold transition-colors";
  const pageBtnIdle =
    "card cursor-pointer hover:border-fg/40 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface";
  const chipBase =
    "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors";

  const tabs = [
    { id: "suggested", label: "Gợi ý", count: playable.length },
    { id: "favorites", label: "Yêu thích", count: favorites.length },
  ];
  const views = [
    { id: "grid", label: "Dạng lưới" },
    { id: "list", label: "Dạng danh sách" },
  ];

  return (
    <div className="w-full">
      <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
        Bài hát gợi ý cho bạn
      </h2>

      <div className="mt-8 grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-10">
        {/* Cột trái: ảnh gốc, mô tả, chia sẻ. Dính lại khi cuộn trên máy tính */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-start gap-4 lg:flex-col lg:gap-6">
            {photo?.url && (
              <div className="relative w-28 shrink-0 rotate-1 rounded-sm bg-white p-1.5 pb-6 shadow-[0_18px_36px_-16px_rgba(0,0,0,0.55)] sm:w-40 lg:w-full lg:p-2.5 lg:pb-10">
                <img
                  src={photo.url}
                  alt="Ảnh bạn đã tải lên"
                  className="aspect-square w-full bg-neutral-100 object-cover"
                />
                <p className="absolute bottom-2 left-3 hidden font-display text-sm font-semibold text-neutral-500 lg:block">
                  Ảnh của bạn
                </p>
              </div>
            )}

            <div className="min-w-0">
              <blockquote className="border-l-4 border-accent pl-3 italic leading-relaxed text-muted">
                {description}
              </blockquote>

              {photo?.url && (
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={share.busy}
                  className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-fg px-4 py-2 text-sm font-semibold transition-colors hover:bg-fg hover:text-page disabled:cursor-wait disabled:opacity-60"
                >
                  {share.busy ? <FiLoader className="animate-spin" /> : <FiShare2 />}
                  Chia sẻ ảnh kết quả
                </button>
              )}
              <p aria-live="polite" className="mt-2 min-h-5 text-sm text-muted">
                {share.message}
              </p>
            </div>
          </div>
        </aside>

        {/* Cột phải: điều khiển + danh sách */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Nguồn bài hát" className="card inline-flex rounded-full p-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => changeTab(t.id)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    tab === t.id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {t.id === "favorites" && (
                    <FiHeart size={14} fill={tab === t.id ? "currentColor" : "none"} />
                  )}
                  {t.label}
                  <span className="tabular-nums opacity-70">{t.count}</span>
                </button>
              ))}
            </div>

            <div className="card inline-flex rounded-full p-1" role="group" aria-label="Kiểu hiển thị">
              {views.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => changeView(id)}
                  aria-pressed={view === id}
                  aria-label={label}
                  title={label}
                  className={`grid h-8 w-9 cursor-pointer place-items-center rounded-full transition-colors ${
                    view === id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {id === "grid" ? <FiGrid size={16} /> : <FiList size={16} />}
                </button>
              ))}
            </div>
          </div>

          {moodCounts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Lọc theo tâm trạng">
              <button
                onClick={() => {
                  setSelectedMood("all");
                  setCurrentPage(1);
                }}
                aria-pressed={mood === "all"}
                className={`${chipBase} ${
                  mood === "all" ? "bg-accent text-accent-fg" : "card hover:border-fg/40"
                }`}
              >
                Tất cả
              </button>
              {moodCounts.map(([m, count]) => (
                <button
                  key={m}
                  onClick={() => {
                    setSelectedMood(m);
                    setCurrentPage(1);
                  }}
                  aria-pressed={mood === m}
                  className={`${chipBase} ${
                    mood === m ? "bg-accent text-accent-fg" : "card hover:border-fg/40"
                  }`}
                >
                  {moodLabel(m)}
                  <span className="tabular-nums opacity-70">{count}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <label htmlFor="artist-filter" className="font-semibold">
              Lọc theo ca sĩ:
            </label>
            <select
              id="artist-filter"
              value={artist}
              onChange={(e) => {
                setSelectedArtist(e.target.value);
                setCurrentPage(1);
              }}
              className="card min-w-60 rounded-lg px-4 py-2.5 text-fg transition-colors focus:border-accent-text"
            >
              {uniqueArtists.map((a) => (
                <option key={a} value={a}>
                  {a === "all" ? "Tất cả ca sĩ" : truncateText(a)}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted">
              <span className="font-bold text-fg">{filtered.length}</span> bài hát
              {artist !== "all" && ` của ${truncateText(artist)}`}
            </p>
          </div>

          <div className="mt-6">
            {tab === "favorites" && favorites.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-fg/25 bg-surface/60 px-6 py-14 text-center">
                <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-fg">
                  <FiHeart size={24} />
                </span>
                <h3 className="font-display text-2xl font-bold">Chưa có bài hát yêu thích</h3>
                <p className="mx-auto mt-3 max-w-md text-muted">
                  Nhấn biểu tượng trái tim trên một bài hát để lưu lại. Danh sách này được giữ
                  trên trình duyệt của bạn cho những lần sau.
                </p>
                <button
                  onClick={() => changeTab("suggested")}
                  className="mt-6 cursor-pointer rounded-full bg-accent px-6 py-2.5 font-bold text-accent-fg transition hover:brightness-105"
                >
                  Xem bài hát gợi ý
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-fg/25 bg-surface/60 px-6 py-14 text-center">
                <h3 className="font-display text-2xl font-bold">Không tìm thấy bài hát phù hợp</h3>
                <p className="mx-auto mt-3 max-w-lg text-muted">
                  Không có bài hát nào khớp với bộ lọc hiện tại. Hãy thử chọn ca sĩ hoặc tâm
                  trạng khác.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-6 cursor-pointer rounded-full bg-accent px-6 py-2.5 font-bold text-accent-fg transition hover:brightness-105"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 items-start gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-5 lg:grid-cols-3">
                {pageItems.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    active={activeId === song.id}
                    favorite={isFavorite(song.id)}
                    onToggleActive={() => setActiveId((id) => (id === song.id ? null : song.id))}
                    onToggleFavorite={() => toggleFavorite(song)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {pageItems.map((song, i) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    index={startIdx + i + 1}
                    active={activeId === song.id}
                    favorite={isFavorite(song.id)}
                    onToggleActive={() => setActiveId((id) => (id === song.id ? null : song.id))}
                    onToggleFavorite={() => toggleFavorite(song)}
                  />
                ))}
              </div>
            )}
          </div>

          {filtered.length > 0 && totalPages > 1 && (
            <nav
              aria-label="Phân trang"
              className="mt-10 flex flex-col items-center justify-between gap-5 sm:flex-row"
            >
              <p className="order-2 text-sm text-muted sm:order-1">
                Hiển thị <span className="font-bold text-fg">{startIdx + 1}</span> –{" "}
                <span className="font-bold text-fg">{endIdx}</span> trong{" "}
                <span className="font-bold text-fg">{filtered.length}</span> bài hát
              </p>

              <div className="order-1 flex items-center gap-1.5 sm:order-2">
                <button
                  onClick={() => setCurrentPage(Math.max(page - 1, 1))}
                  disabled={page === 1}
                  className={`${pageBtn} ${pageBtnIdle}`}
                >
                  <span className="leading-none sm:mr-1">‹</span>
                  <span className="hidden sm:inline">Trước</span>
                </button>

                {pageNumbers.map((p, index) =>
                  p === "..." ? (
                    <span key={`dots-${index}`} className="px-1 text-muted">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      aria-current={page === p ? "page" : undefined}
                      className={`${pageBtn} ${
                        page === p ? "cursor-default bg-accent text-accent-fg" : pageBtnIdle
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage(Math.min(page + 1, totalPages))}
                  disabled={page === totalPages}
                  className={`${pageBtn} ${pageBtnIdle}`}
                >
                  <span className="hidden sm:mr-1 sm:inline">Sau</span>
                  <span className="leading-none">›</span>
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function SongList(props) {
  if (!props.songs || props.songs.length === 0) return null;
  return <SongListInner {...props} />;
}

export default SongList;
