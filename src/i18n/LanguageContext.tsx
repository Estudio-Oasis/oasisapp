import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "es" | "en";

/** Bilingual string pair used across content data files. */
export type Bi = { es: string; en: string };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  /** Returns the English string when available, Spanish otherwise. */
  t: (es: string, en?: string) => string;
  /** Resolves a bilingual pair to the active language. */
  pick: (v: Bi) => string;
};

const LanguageContext = createContext<Ctx | null>(null);
const KEY = "oasis-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "es";
    const stored = window.localStorage.getItem(KEY);
    if (stored === "en" || stored === "es") return stored;
    return "es";
  });

  useEffect(() => {
    window.localStorage.setItem(KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(() => setLangState((p) => (p === "es" ? "en" : "es")), []);
  const t = useCallback((es: string, en?: string) => (lang === "en" && en ? en : es), [lang]);
  const pick = useCallback((v: Bi) => (lang === "en" ? v.en : v.es), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t, pick }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
