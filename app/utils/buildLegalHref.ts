// buildLegalHref.ts
// Helper para construir href legal y guardar contexto en sessionStorage

export interface LegalContext {
  from: string;
  modal: string;
  scroll: number;
  ts: number;
}

export function buildLegalHref(
  modalId: string,
  type: "terms" | "privacy" = "terms"
): string {
  if (typeof window === "undefined")
    return type === "privacy" ? "/privacy" : "/terms";
  const from = location.pathname + location.search;
  const modal = modalId;
  const scroll = Math.round(window.scrollY || 0);
  const ts = Date.now();
  const params = new URLSearchParams({
    from,
    modal,
    scroll: String(scroll),
    ts: String(ts),
  });
  const href = type === "privacy" ? `/privacy?${params}` : `/terms?${params}`;
  // Guardar contexto en sessionStorage
  try {
    sessionStorage.setItem(
      "legal:context",
      JSON.stringify({ from, modal, scroll, ts })
    );
  } catch {}
  return href;
}
