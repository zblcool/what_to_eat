import { Link, type LinkProps, useLocation, useNavigate } from "react-router-dom";

export type Language = "zh" | "en";

function normalizeLanguage(value: string | null): Language {
  return value === "en" ? "en" : "zh";
}

export function getLanguageFromSearch(search: string): Language {
  const params = new URLSearchParams(search);
  return normalizeLanguage(params.get("lang"));
}

export function applyLanguageToPath(path: string, language: Language): string {
  const [pathWithSearch, hashPart] = path.split("#");
  const [pathname, searchPart] = pathWithSearch.split("?");
  const params = new URLSearchParams(searchPart ?? "");

  if (language === "en") {
    params.set("lang", "en");
  } else {
    params.delete("lang");
  }

  const nextSearch = params.toString();
  const nextHash = hashPart ? `#${hashPart}` : "";

  return `${pathname}${nextSearch ? `?${nextSearch}` : ""}${nextHash}`;
}

export function useI18n() {
  const location = useLocation();
  const navigate = useNavigate();
  const language = getLanguageFromSearch(location.search);

  function text(zh: string, en: string) {
    return language === "en" ? en : zh;
  }

  function localizePath(path: string) {
    return applyLanguageToPath(path, language);
  }

  function setLanguage(nextLanguage: Language) {
    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    navigate(applyLanguageToPath(currentPath, nextLanguage));
  }

  function toggleLanguage() {
    setLanguage(language === "en" ? "zh" : "en");
  }

  return {
    language,
    isEnglish: language === "en",
    text,
    localizePath,
    setLanguage,
    toggleLanguage
  };
}

type LocalizedLinkProps = Omit<LinkProps, "to"> & {
  to: string;
};

export function LocalizedLink({ to, ...props }: LocalizedLinkProps) {
  const { localizePath } = useI18n();

  return <Link {...props} to={localizePath(to)} />;
}
