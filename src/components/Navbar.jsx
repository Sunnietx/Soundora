import React, { useState, useEffect, useRef } from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import useTheme from "../hooks/useTheme";

function LogoMark() {
  // Năm thanh sóng âm
  const bars = [
    { x: 1.2, h: 6 },
    { x: 5.8, h: 14 },
    { x: 10.4, h: 20 },
    { x: 15, h: 11 },
    { x: 19.6, h: 7 },
  ];
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      {bars.map((b) => (
        <rect key={b.x} x={b.x} y={12 - b.h / 2} width="2.4" height={b.h} rx="1.2" />
      ))}
    </svg>
  );
}

function Navbar() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setIsVisible(!(y > lastScrollY.current && y > 100));
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScrollToTop = (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-line bg-page/85 backdrop-blur-md
                  transition-transform duration-300 ease-out
                  ${isVisible ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="/" onClick={handleScrollToTop} className="group flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-fg transition-transform group-hover:scale-110">
            <LogoMark />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">Soundora</span>
        </a>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
          title={isDark ? "Chế độ sáng" : "Chế độ tối"}
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-line text-fg transition-colors hover:bg-surface-2"
        >
          {isDark ? <FiSun size={17} /> : <FiMoon size={17} />}
        </button>
      </div>
    </header>
  );
}

export default Navbar;
