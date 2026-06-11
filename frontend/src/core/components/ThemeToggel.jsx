import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("kruncuy_theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  function toggleTheme() {
    const nextDark = !isDark;

    setIsDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("kruncuy_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("kruncuy_theme", "light");
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="h-10 w-10 grid place-items-center rounded-xl border"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}