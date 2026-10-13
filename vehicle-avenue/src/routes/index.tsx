import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Car, Bike, Search, MapPin, Star, Gauge } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { cop, imagenVehiculo, stockDe, VEHICULO_SELECT } from "@/lib/vehiculos";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mi Cacharrito — Catálogo de carros, motos y bicicletas" },
      { name: "description", content: "Explora, filtra y compra carros, motos y bicicletas de vendedores verificados." },
      { property: "og:title", content: "Mi Cacharrito — Catálogo" },
      { property: "og:description", content: "Compra y venta de carros, motos y bicicletas." },
    ],
  }),
  component: Catalogo,
});

const categorias = [
  { id: 0, label: "Todo", icon: Search },
  { id: 1, label: "Carros", icon: Car },
  { id: 2, label: "Motos", icon: Gauge },
  { id: 3, label: "Bicicletas", icon: Bike },
];

function Catalogo() {
  const [cat, setCat] = useState(0);
  const [q, setQ] = useState("");
  const [orden, setOrden] = useState("reciente");
  const [maxPrecio, setMaxPrecio] = useState(150_000_000);
  const [sel, setSel] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: vehiculos = [], isLoading } = useQuery({
    queryKey: ["vehiculos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehiculos").select(VEHICULO_SELECT).eq("activo", true);
      if (error) throw error;
      return data as any[];
    },
  });

  const lista = useMemo(() => {
    let l = vehiculos.filter(
      (v) =>
        (cat === 0 || v.categoria_id === cat) &&
        v.precio <= maxPrecio &&
        `${v.marcas?.nombre} ${v.modelo}`.toLowerCase().includes(q.toLowerCase()),
    );
    if (orden === "menor") l = [...l].sort((a, b) => a.precio - b.precio);
    if (orden === "mayor") l = [...l].sort((a, b) => b.precio - a.precio);
    return l;
  }, [vehiculos, cat, q, orden, maxPrecio]);

  async function agregar(v: any) {
    if (!user) {
      toast("Inicia sesión para usar el carrito");
      navigate({ to: "/auth" });
      return;
    }
    const { data: existe } = await supabase.from("carrito_items").select("id,cantidad").eq("vehiculo_id", v.id).maybeSingle();
    const nueva = (existe?.cantidad ?? 0) + 1;
    if (nueva > stockDe(v)) { toast.error("No hay más unidades disponibles"); return; }
    const { error } = existe
      ? await supabase.from("carrito_items").update({ cantidad: nueva }).eq("id", existe.id)
      : await supabase.from("carrito_items").insert({ user_id: user.id, vehiculo_id: v.id, cantidad: 1 });
    if (error) { toast.error(error.message); return; }
    toast.success(`${v.modelo} agregado al carrito`);
    qc.invalidateQueries({ queryKey: ["carrito-count"] });
    qc.invalidateQueries({ queryKey: ["carrito"] });
  }

  return (
    <div>
      <section className="fade-up mb-10 grid items-end gap-6 md:grid-cols-[1.4fr_1fr]">
        <h1 className="text-5xl font-extrabold leading-[0.95] md:text-7xl">
          Tu próximo <span className="text-primary">cacharrito</span> te está esperando.
        </h1>
        <p className="text-lg text-muted-foreground">
          Carros, motos y bicicletas de vendedores verificados. Filtra, compara y compra en minutos.
        </p>
      </section>

      {/* DASHBOARD RESPONSIVO DE LOOKER STUDIO */}
      <section className="fade-up mb-10 w-full overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-lg">
        <div className="border-b-2 border-ink bg-muted/50 p-4">
          <h2 className="text-lg font-bold">Análisis e Inteligencia de Datos</h2>
        </div>
        <div className="relative w-full min-h-[500px] md:min-h-[600px] overflow-hidden">
          <iframe
            src="https://datastudio.google.com/embed/reporting/a90c8d91-5ba7-4881-8648-2b818da48240/page/CqyAG"
            className="absolute inset-0 h-full w-full border-0"
            allowFullScreen
            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            title="Dashboard Looker Studio"
          />
        </div>
      </section>

      <div className="card-pop mb-8 flex flex-col gap-4 p-4 md:flex-row md:items-center">
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`flex items-center gap-1.5 rounded-full border-2 border-ink px-4 py-2 text-sm font-semibold transition-all ${
                cat === c.id ? "bg-ink text-ink-foreground" : "hover:bg-secondary"
              }`}
            >
              <c.icon className="h-4 w-4" /> {c.label}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar marca o modelo…"
          className="flex-1 rounded-full border-2 border-ink bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <select value={orden} onChange={(e) => setOrden(e.target.value)} className="rounded-full border-2 border-ink bg-background px-3 py-2 text-sm">
          <option value="reciente">Más recientes</option>
          <option value="menor">Precio: menor a mayor</option>
          <option value="mayor">Precio: mayor a menor</option>
        </select>
      </div>
      <div className="mb-8 flex items-center gap-4 text-sm">
        <span className="font-semibold">Precio máx: {cop(maxPrecio)}</span>
        <input type="range" min={1_000_000} max={150_000_000} step={500_000} value={maxPrecio} onChange={(e) => setMaxPrecio(+e.target.value)} className="flex-1 accent-primary" />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando catálogo…</p>
      ) : lista.length === 0 ? (
        <p className="text-muted-foreground">No hay vehículos con esos filtros.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((v, i) => {
            const stock = stockDe(v);
            return (
              <article key={v.id} className="card-pop card-pop-hover fade-up overflow-hidden" style={{ animationDelay: `${i * 40}ms` }}>
                <button onClick={() => setSel(v)} className="block w-full text-left">
                  <div className="relative">
                    <img src={imagenVehiculo(v)} alt={v.modelo} loading="lazy" width={1024} height={768} className="aspect-[4/3] w-full border-b-2 border-ink object-cover" />
                    <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase text-accent-foreground">{v.condicion}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{v.marcas?.nombre} · {v.anio}</p>
                    <h3 className="text-xl font-bold">{v.modelo}</h3>
                    <p className="font-display mt-1 text-2xl font-extrabold text-primary">{cop(v.precio)}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.vendedores?.ciudad}</span>
                      <span>{v.kilometraje.toLocaleString("es-CO")} km</span>
                      <span>{stock > 0 ? `${stock} en stock` : "Agotado"}</span>
                    </div>
                  </div>
                </button>
                <div className="px-4 pb-4">
                  <button
                    disabled={stock === 0}
                    onClick={() => agregar(v)}
                    className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-40"
                  >
                    Agregar al carrito
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-2xl">
          {sel && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{sel.marcas?.nombre} {sel.modelo}</DialogTitle>
              </DialogHeader>
              <img src={imagenVehiculo(sel)} alt={sel.modelo} className="aspect-[4/3] w-full rounded-lg object-cover" />
              <p className="text-muted-foreground">{sel.descripcion}</p>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Categoría", sel.categorias?.nombre],
                  ["Año", sel.anio],
                  ["Kilometraje", `${sel.kilometraje.toLocaleString("es-CO")} km`],
                  ["Color", sel.color],
                  ["Combustible", sel.combustible ?? "—"],
                  ["Transmisión", sel.transmision ?? "—"],
                  ["Vendedor", sel.vendedores?.nombre_comercial],
                  ["Teléfono", sel.vendedores?.telefono],
                ].map(([k, val]) => (
                  <div key={k as string} className="rounded-md bg-muted p-2">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="font-semibold">{val}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-primary text-primary" />{sel.vendedores?.calificacion}</span>
                <button onClick={() => agregar(sel)} className="rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground">
                  Agregar · {cop(sel.precio)}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}