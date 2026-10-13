import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cop, stockDe } from "@/lib/vehiculos";

export const Route = createFileRoute("/_authenticated/vender")({
  head: () => ({
    meta: [
      { title: "Vender e inventario — Mi Cacharrito" },
      { name: "description", content: "Registra tu tienda, publica vehículos y gestiona tu inventario." },
      { property: "og:title", content: "Vender en Mi Cacharrito" },
      { property: "og:description", content: "Publica carros, motos y bicicletas." },
    ],
  }),
  component: Vender,
});

const input = "w-full rounded-lg border-2 border-ink bg-background px-3 py-2 text-sm";

function Vender() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();

  const { data: vendedor, isLoading } = useQuery({
    queryKey: ["mi-vendedor", user.id],
    queryFn: async () => (await supabase.from("vendedores").select("*").eq("user_id", user.id).maybeSingle()).data,
  });
  const { data: marcas = [] } = useQuery({
    queryKey: ["marcas"],
    queryFn: async () => (await supabase.from("marcas").select("*").order("nombre")).data ?? [],
  });
  const { data: mios = [] } = useQuery({
    queryKey: ["mis-vehiculos", vendedor?.id],
    enabled: !!vendedor,
    queryFn: async () =>
      ((await supabase.from("vehiculos").select("*, marcas(nombre), inventario(stock, ubicacion)").eq("vendedor_id", vendedor!.id).order("created_at", { ascending: false })).data ?? []) as any[],
  });

  const [tienda, setTienda] = useState({ nombre_comercial: "", nit: "", telefono: "", ciudad: "" });
  const [v, setV] = useState({ categoria_id: 1, marca_id: 0, modelo: "", anio: 2024, precio: 0, kilometraje: 0, color: "", condicion: "usado", combustible: "", transmision: "", descripcion: "", imagen_url: "", stock: 1 });

  async function crearTienda(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("vendedores").upsert(
      { ...tienda, user_id: user.id, email: user.email ?? null },
      { onConflict: "user_id" }
    );
    if (error) { toast.error(error.message); return; }
    toast.success("¡Ya eres vendedor!");
    qc.invalidateQueries({ queryKey: ["mi-vendedor"] });
  }

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    if (!v.marca_id) { toast.error("Elige una marca"); return; }
    const { stock, ...rest } = v;
    const { data, error } = await supabase
      .from("vehiculos")
      .insert({ ...rest, vendedor_id: vendedor!.id, imagen_url: rest.imagen_url || null, combustible: rest.combustible || null, transmision: rest.transmision || null })
      .select("id")
      .single();
    if (error) { toast.error(error.message); return; }
    await supabase.from("inventario").insert({ vehiculo_id: data.id, stock, ubicacion: vendedor!.ciudad });
    toast.success("Vehículo publicado");
    setV({ ...v, modelo: "", precio: 0, descripcion: "", imagen_url: "" });
    qc.invalidateQueries({ queryKey: ["mis-vehiculos"] });
    qc.invalidateQueries({ queryKey: ["vehiculos"] });
  }

  async function setStock(id: string, stock: number) {
    await supabase.from("inventario").update({ stock: Math.max(0, stock), updated_at: new Date().toISOString() }).eq("vehiculo_id", id);
    qc.invalidateQueries({ queryKey: ["mis-vehiculos"] });
    qc.invalidateQueries({ queryKey: ["vehiculos"] });
  }
  async function toggle(id: string, activo: boolean) {
    await supabase.from("vehiculos").update({ activo }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["mis-vehiculos"] });
    qc.invalidateQueries({ queryKey: ["vehiculos"] });
  }

  if (isLoading) return <p>Cargando…</p>;

  if (!vendedor)
    return (
      <form onSubmit={crearTienda} className="card-pop mx-auto max-w-lg space-y-3 p-8">
        <h1 className="text-3xl font-extrabold">Conviértete en vendedor</h1>
        <p className="text-sm text-muted-foreground">Registra los datos de tu negocio o tus datos personales para publicar.</p>
        <input className={input} placeholder="Nombre comercial" required value={tienda.nombre_comercial} onChange={(e) => setTienda({ ...tienda, nombre_comercial: e.target.value })} />
        <input className={input} placeholder="NIT o cédula" value={tienda.nit} onChange={(e) => setTienda({ ...tienda, nit: e.target.value })} />
        <input className={input} placeholder="Teléfono" required value={tienda.telefono} onChange={(e) => setTienda({ ...tienda, telefono: e.target.value })} />
        <input className={input} placeholder="Ciudad" required value={tienda.ciudad} onChange={(e) => setTienda({ ...tienda, ciudad: e.target.value })} />
        <button className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground">Registrarme como vendedor</button>
      </form>
    );

  const marcasCat = marcas.filter((m) => m.categoria_id === v.categoria_id);
  const unidades = mios.reduce((a, m) => a + stockDe(m), 0);
  const valor = mios.reduce((a, m) => a + stockDe(m) * m.precio, 0);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-extrabold">{vendedor.nombre_comercial}</h1>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[["Publicaciones", mios.length], ["Unidades en inventario", unidades], ["Valor del inventario", cop(valor)]].map(([k, val]) => (
            <div key={k as string} className="card-pop p-4">
              <p className="text-xs uppercase text-muted-foreground">{k}</p>
              <p className="font-display text-2xl font-extrabold">{val}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="card-pop p-6">
        <h2 className="mb-4 text-2xl font-bold">Publicar vehículo</h2>
        <form onSubmit={publicar} className="grid gap-3 sm:grid-cols-3">
          <select className={input} value={v.categoria_id} onChange={(e) => setV({ ...v, categoria_id: +e.target.value, marca_id: 0 })}>
            <option value={1}>Carro</option><option value={2}>Moto</option><option value={3}>Bicicleta</option>
          </select>
          <select className={input} value={v.marca_id} onChange={(e) => setV({ ...v, marca_id: +e.target.value })}>
            <option value={0}>Marca…</option>
            {marcasCat.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          <input className={input} placeholder="Modelo" required value={v.modelo} onChange={(e) => setV({ ...v, modelo: e.target.value })} />
          <label className="text-xs font-semibold">Año<input className={input} type="number" value={v.anio} onChange={(e) => setV({ ...v, anio: +e.target.value })} /></label>
          <label className="text-xs font-semibold">Precio (COP)<input className={input} type="number" required min={1} value={v.precio || ""} onChange={(e) => setV({ ...v, precio: +e.target.value })} /></label>
          <label className="text-xs font-semibold">Kilometraje<input className={input} type="number" value={v.kilometraje} onChange={(e) => setV({ ...v, kilometraje: +e.target.value })} /></label>
          <input className={input} placeholder="Color" value={v.color} onChange={(e) => setV({ ...v, color: e.target.value })} />
          <select className={input} value={v.condicion} onChange={(e) => setV({ ...v, condicion: e.target.value })}>
            <option value="usado">Usado</option><option value="nuevo">Nuevo</option>
          </select>
          <label className="text-xs font-semibold">Unidades en stock<input className={input} type="number" min={0} value={v.stock} onChange={(e) => setV({ ...v, stock: +e.target.value })} /></label>
          <input className={input} placeholder="Combustible" value={v.combustible} onChange={(e) => setV({ ...v, combustible: e.target.value })} />
          <input className={input} placeholder="Transmisión" value={v.transmision} onChange={(e) => setV({ ...v, transmision: e.target.value })} />
          <input className={input} placeholder="URL de foto (opcional)" value={v.imagen_url} onChange={(e) => setV({ ...v, imagen_url: e.target.value })} />
          <textarea className={`${input} sm:col-span-3`} placeholder="Descripción" value={v.descripcion} onChange={(e) => setV({ ...v, descripcion: e.target.value })} />
          <button className="rounded-full bg-primary py-3 font-bold text-primary-foreground sm:col-span-3">Publicar</button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">Inventario</h2>
        {mios.length === 0 ? (
          <p className="text-muted-foreground">Aún no tienes vehículos publicados.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border-2 border-ink bg-card">
            <table className="w-full text-sm">
              <thead className="bg-ink text-left text-ink-foreground">
                <tr><th className="p-3">Vehículo</th><th className="p-3">Precio</th><th className="p-3">Stock</th><th className="p-3">Estado</th></tr>
              </thead>
              <tbody>
                {mios.map((m) => {
                  const s = stockDe(m);
                  return (
                    <tr key={m.id} className="border-t">
                      <td className="p-3 font-semibold">{m.marcas?.nombre} {m.modelo} ({m.anio})</td>
                      <td className="p-3">{cop(m.precio)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setStock(m.id, s - 1)} className="rounded border-2 border-ink px-2">−</button>
                          <span className={`w-6 text-center font-bold ${s === 0 ? "text-destructive" : ""}`}>{s}</span>
                          <button onClick={() => setStock(m.id, s + 1)} className="rounded border-2 border-ink px-2">+</button>
                        </div>
                      </td>
                      <td className="p-3">
                        <button onClick={() => toggle(m.id, !m.activo)} className={`rounded-full px-3 py-1 text-xs font-bold ${m.activo ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                          {m.activo ? "Publicado" : "Oculto"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}