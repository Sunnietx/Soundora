import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import ImageUploader from "./components/ImageUploader";
import SongList from "./components/SongList";
import { getMoodKey, MOOD_THEMES } from "./utils/moods";

function App() {
  const songListRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestionData, setSuggestionData] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [glowColor, setGlowColor] = useState(null);

  const handleSuggestionComplete = (data, photoInfo) => {
    setSuggestionData(data);
    setPhoto({ ...photoInfo, color: glowColor });
  };

  const handleImageRemove = () => {
    setSuggestionData(null);
    setPhoto(null);
    setGlowColor(null);
    setError("");
  };

  const handleColorExtract = (color) => {
    setGlowColor(color);
    setPhoto((current) => (current ? { ...current, color } : current));
  };

  useEffect(() => {
    if (suggestionData) {
      const timer = setTimeout(() => {
        songListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [suggestionData]);

  const commonMoods =
    suggestionData?.suggested_songs?.flatMap((song) => song.mood_tags || []) || [];
  const moodKey = getMoodKey(commonMoods);
  const moodTheme = MOOD_THEMES[moodKey];

  return (
    <div
      data-mood={moodKey}
      className="relative min-h-screen overflow-x-hidden bg-page text-fg"
      style={{ "--glow": glowColor || "30 215 96" }}
    >
      <div className="photo-glow" aria-hidden="true" />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Gợi ý bài hát bằng hình ảnh
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted sm:text-lg">
            Tải lên một bức ảnh và tìm giai điệu phù hợp
          </p>

          <div className="mt-8">
            <ImageUploader
              isLoading={isLoading}
              onImageRemove={handleImageRemove}
              onSuggestionComplete={handleSuggestionComplete}
              onColorExtract={handleColorExtract}
              setIsLoading={setIsLoading}
              setError={setError}
            />
          </div>

          {isLoading && (
            <p className="mt-5 text-sm font-semibold text-accent-text" aria-live="polite">
              Đang phân tích ảnh, vui lòng chờ...
            </p>
          )}
          {error && (
            <p className="mt-5 text-sm font-semibold text-red-500" role="alert">
              {error}
            </p>
          )}
        </section>

        {suggestionData?.suggested_songs?.length > 0 && (
          <section ref={songListRef} className="mt-16 scroll-mt-20 sm:mt-20">
            <SongList
              description={suggestionData.description}
              songs={suggestionData.suggested_songs}
              photo={photo}
              accentColor={moodTheme.accent}
            />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
