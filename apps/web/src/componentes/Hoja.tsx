import React, { useEffect } from 'react';

/** Hoja inferior modal. Se cierra con Escape o tocando fuera. */
export function Hoja({
  abierta,
  onCerrar,
  titulo,
  entradilla,
  children,
}: {
  abierta: boolean;
  onCerrar: () => void;
  titulo: string;
  entradilla?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!abierta) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [abierta, onCerrar]);

  if (!abierta) return null;

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="grab" />
        <h2>{titulo}</h2>
        {entradilla && <p className="lead">{entradilla}</p>}
        {children}
      </div>
    </div>
  );
}

/** Aviso efímero. Es donde la app explica qué ha hecho FEFO. */
export function Aviso({ texto, onFin }: { texto: string | null; onFin: () => void }) {
  useEffect(() => {
    if (!texto) return;
    const t = setTimeout(onFin, 3600);
    return () => clearTimeout(t);
  }, [texto, onFin]);

  if (!texto) return null;
  return (
    <div id="toast" role="status">
      {texto}
    </div>
  );
}

export function Vacio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="empty">
      <p>{titulo}</p>
      <small>{texto}</small>
    </div>
  );
}
