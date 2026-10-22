/** Franja negra con el título de cada pantalla */
export default function Encabezado({ titulo, bajada }: { titulo: string; bajada?: string }) {
  return (
    <header className="bg-marca-negro px-5 pb-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] text-white">
      <h1 className="font-display text-3xl text-marca-dorado">{titulo}</h1>
      {bajada && <p className="mt-1 text-sm text-marca-champan">{bajada}</p>}
    </header>
  )
}
