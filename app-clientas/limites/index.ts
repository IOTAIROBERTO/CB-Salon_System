// Contadores atómicos para los topes de la entrada con código (Durable Object: atiende una petición a la vez, así
// dos intentos simultáneos nunca cuentan como uno). Ventana fija: al llegar al tope deja de sumar hasta que vence.
// La usa la app por el binding LIMITES (app-clientas/wrangler.toml). Publicar: npx wrangler deploy --config limites/wrangler.toml
export class Contador {
  constructor(private state: DurableObjectState) {}

  async fetch(request: Request) {
    const { limite, segundos } = await request.json() as { limite: number; segundos: number };
    const ahora = Date.now();
    let v = await this.state.storage.get<{ n: number; vence: number }>('v');
    if (!v || v.vence <= ahora) {
      v = { n: 0, vence: ahora + segundos * 1000 };
      await this.state.storage.setAlarm(v.vence);   // al vencer se borra solo
    }
    if (v.n >= limite) return Response.json({ permitido: false });
    v.n++;
    await this.state.storage.put('v', v);
    return Response.json({ permitido: true });
  }

  async alarm() { await this.state.storage.deleteAll(); }
}

export default { fetch: () => new Response('Contadores de CB', { status: 404 }) } satisfies ExportedHandler;
