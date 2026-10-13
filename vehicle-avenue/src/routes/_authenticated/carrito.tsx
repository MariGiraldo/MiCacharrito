import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cop, imagenVehiculo, stockDe, VEHICULO_SELECT } from "@/lib/vehiculos";

export const Route = createFileRoute("/_authenticated/carrito")({
  head: () => ({
    meta: [
      { title: "Mi carrito — Mi Cacharrito" },
      { name: "description", content: "Revisa tu carrito y finaliza tu compra." },
      { property: "og:title", content: "Mi carrito — Mi Cacharrito" },
      { property: "og:description", content: "Tu carrito de compras." },
    ],
  }),
  component: Carrito,
});

function Carrito() {
  const qc = useQueryClient();
  const [metodo, setMetodo] = useState("Tarjeta de crédito");
  const [pagando, setPagando] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["carrito"],
    queryFn: async () => {
      const { data, error } = await supabase.from("carrito_items").select(`id, cantidad, vehiculos(${VEHICULO_SELECT})`).order("created_at");
      if (error) throw error;
      return data as any[];
    },
  });
  const { data: pedidos = [] } = useQuery({
    queryKey: ["pedidos"],
    queryFn: async () => {
      const { data } = await supabase.from("pedidos").select("id,total,estado,created_at, pagos(metodo), detalle_pedido(cantidad, vehiculos(modelo))").order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ["carrito"] });
    qc.invalidateQueries({ queryKey: ["carrito-count"] });
  };
  const total = items.reduce((a, i) => a + i.cantidad * i.vehiculos.precio, 0);

  async function cambiar(id: string, cantidad: number, max: number) {
    if (cantidad > max) { toast.error("Sin más stock"); return; }
    if (cantidad < 1) await supabase.from("carrito_items").delete().eq("id", id);
    else await supabase.from("carrito_items").update({ cantidad }).eq("id", id);
    refrescar();
  }

  async function pagar() {
    setPagando(true);
    const { error } = await supabase.rpc("realizar_pedido", { p_metodo: metodo });
    setPagando(false);
    if (error) { toast.error(error.message); return; }
    toast.success("¡Compra realizada! El vendedor te contactará.");
    refrescar();
    qc.invalidateQueries({ queryKey: ["pedidos"] });
    qc.invalidateQueries({ queryKey: ["vehiculos"] });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section>
        <h1 className="mb-6 text-4xl font-extrabold">Tu carrito</h1>
        {items.length === 0 ? (
          <div className="card-pop p-8 text-center">
            <p className="text-muted-foreground">Tu carrito está vacío.</p>
            <Link to="/" className="mt-4 inline-block rounded-full bg-primary px-6 py-2 font-bold text-primary-foreground">Ver catálogo</Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((i) => (
              <li key={i.id} className="card-pop fade-up flex items-center gap-4 p-3">
                <img src={imagenVehiculo(i.vehiculos)} alt="" className="h-20 w-28 rounded-lg border-2 border-ink object-cover" />
                <div className="flex-1">
                  <p className="font-bold">{i.vehiculos.marcas?.nombre} {i.vehiculos.modelo}</p>
                  <p className="text-sm text-muted-foreground">{cop(i.vehiculos.precio)} c/u</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => cambiar(i.id, i.cantidad - 1, stockDe(i.vehiculos))} className="rounded-full border-2 border-ink p-1"><Minus className="h-4 w-4" /></button>
                  <span className="w-6 text-center font-bold">{i.cantidad}</span>
                  <button onClick={() => cambiar(i.id, i.cantidad + 1, stockDe(i.vehiculos))} className="rounded-full border-2 border-ink p-1"><Plus className="h-4 w-4" /></button>
                  <button onClick={() => cambiar(i.id, 0, 0)} className="ml-2 text-destructive" aria-label="Quitar"><Trash2 className="h-5 w-5" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {pedidos.length > 0 && (
          <>
            <h2 className="mb-4 mt-12 text-2xl font-bold">Mis compras</h2>
            <ul className="space-y-3">
              {pedidos.map((p) => (
                <li key={p.id} className="rounded-xl border-2 border-ink bg-card p-4 text-sm">
                  <div className="flex justify-between font-semibold">
                    <span>{new Date(p.created_at).toLocaleDateString("es-CO")} · {p.pagos?.[0]?.metodo}</span>
                    <span className="text-primary">{cop(p.total)}</span>
                  </div>
                  <p className="text-muted-foreground">{p.detalle_pedido.map((d: any) => `${d.cantidad}× ${d.vehiculos?.modelo}`).join(", ")}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <aside className="card-pop h-fit p-6 lg:sticky lg:top-24">
        <h2 className="text-xl font-bold">Resumen</h2>
        <p className="font-display mt-4 text-3xl font-extrabold">{cop(total)}</p>
        <label className="mt-6 block text-sm font-semibold">Método de pago</label>
        <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="mt-1 w-full rounded-lg border-2 border-ink bg-background px-3 py-2">
          <option>Tarjeta de crédito</option>
          <option>PSE</option>
          <option>Transferencia bancaria</option>
          <option>Financiación</option>
        </select>
        <button disabled={!items.length || pagando} onClick={pagar} className="mt-6 w-full rounded-full bg-primary py-3 font-bold text-primary-foreground disabled:opacity-40">
          {pagando ? "Procesando…" : "Finalizar compra"}
        </button>
        <p className="mt-3 text-xs text-muted-foreground">Pago simulado para demostración.</p>
      </aside>
    </div>
  );
}
