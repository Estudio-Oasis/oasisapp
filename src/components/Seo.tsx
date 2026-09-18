import { useEffect } from "react";
import { useLang, type Bi } from "@/i18n/LanguageContext";

const BASE = "https://estudiooasis.com";

export function Seo({ title, description, path, type = "website" }: { title: Bi; description: Bi; path: string; type?: string }) {
  const { pick, lang } = useLang();
  useEffect(() => {
    const resolvedTitle = pick(title);
    const resolvedDescription = pick(description);
    const url = `${BASE}${path}`;
    document.title = resolvedTitle;
    const set = (selector: string, attr: string, value: string) => {
      const element = document.head.querySelector<HTMLMetaElement>(selector);
      if (element) element.setAttribute(attr, value);
    };
    set('meta[name="description"]', "content", resolvedDescription);
    set('meta[property="og:title"]', "content", resolvedTitle);
    set('meta[property="og:description"]', "content", resolvedDescription);
    set('meta[property="og:url"]', "content", url);
    set('meta[property="og:type"]', "content", type);
    set('meta[name="twitter:title"]', "content", resolvedTitle);
    set('meta[name="twitter:description"]', "content", resolvedDescription);
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = url;
  }, [description, lang, path, pick, title, type]);
  return null;
}
