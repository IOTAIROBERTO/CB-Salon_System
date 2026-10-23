/** Encabezado claro de cada pantalla: rótulo, título grande y bajada */
export default function Encabezado({ rotulo, titulo, bajada }: { rotulo?: string; titulo: string; bajada?: string }) {
  return (
    <header className="px-6 pb-6 pt-[calc(env(safe-area-inset-top)+2.25rem)]">
      <img src="./icons/monograma.svg" alt="" className="mb-6 h-7 w-auto opacity-90" />
      {rotulo && <p className="rotulo">{rotulo}</p>}
      <h1 className="titulo mt-2 text-[2.6rem]">{titulo}</h1>
      {bajada && <p className="mt-3 max-w-xs text-sm leading-relaxed text-marca-gris">{bajada}</p>}
      <div className="mt-6 h-px w-12 bg-marca-dorado" />
    </header>
  )
}
