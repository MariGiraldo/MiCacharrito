import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { cop, stockDe } from "@/lib/vehiculos";

export const Route = createFileRoute("/bi")({
  head: () => ({
    meta: [
      { title: "Modelo de datos y BI — Mi Cacharrito" },
      { name: "description", content: "Esquema relacional de 10 tablas e integración con herramientas de inteligencia de negocios." },
      { property: "og:title", content: "Modelo de datos y BI — Mi Cacharrito" },
      { property: "og:description", content: "Esquema relacional y guía de integración BI." },
    ],
  }),
  component: BI,
});

const tablas = [
  ["profiles", "Datos del cliente: nombre, documento, teléfono, ciudad, dirección", "PK id → usuario"],
  ["vendedores", "Datos del vendedor: nombre comercial, NIT, teléfono, email, ciudad, calificación", "PK id"],
  ["categorias", "Carros, Motos, Bicicletas", "PK id"],
  ["marcas", "Marca y país de origen", "FK categoria_id → categorias"],
  ["vehiculos", "Modelo, año, precio, km, color, condición, combustible, transmisión", "FK vendedor_id, categoria_id, marca_id"],
  ["inventario", "Stock y ubicación por vehículo", "FK vehiculo_id → vehiculos (1:1)"],
  ["carrito_items", "Vehículos en el carrito de cada cliente", "FK vehiculo_id; user_id"],
  ["pedidos", "Compra del cliente: total, estado, fecha", "user_id → cliente"],
  ["detalle_pedido", "Líneas de cada pedido con precio histórico", "FK pedido_id, vehiculo_id"],
  ["pagos", "Método, monto y estado del pago", "FK pedido_id → pedidos"],
];

const er = `profiles 1──* pedidos 1──* detalle_pedido *──1 vehiculos
                  │                                   │ │ │
                  └──1 pagos            vendedores 1──*┘ │ └──1 inventario
profiles 1──* carrito_items *──1 vehiculos   categorias 1──* marcas 1──* vehiculos`;

function BI() {
  const { data: v = [] } = useQuery({
    queryKey: ["bi-vehiculos"],
    queryFn: async () => ((await supabase.from("vehiculos").select("precio, categoria_id, categorias(nombre), inventario(stock)")).data ?? []) as any[],
  });
  const porCat = [1, 2, 3].map((id) => {
    const l = v.filter((x) => x.categoria_id === id);
    return {
      nombre: l[0]?.categorias?.nombre ?? "",
      unidades: l.reduce((a, x) => a + stockDe(x), 0),
      promedio: l.length ? Math.round(l.reduce((a, x) => a + x.precio, 0) / l.length) : 0,
    };
  });

  return (
    <div className="space-y-10">
      <h1 className="text-5xl font-extrabold">Datos e inteligencia de negocios</h1>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="card-pop p-6">
          <h2 className="mb-4 text-xl font-bold">Unidades en inventario por categoría</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porCat}><XAxis dataKey="nombre" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="unidades" fill="var(--chart-1)" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card-pop p-6">
          <h2 className="mb-4 text-xl font-bold">Precio promedio por categoría</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porCat}><XAxis dataKey="nombre" /><YAxis tickFormatter={(n) => `${Math.round(n / 1e6)}M`} /><Tooltip formatter={(n: number) => cop(n)} /><Bar dataKey="promedio" fill="var(--chart-2)" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">Esquema relacional (10 tablas)</h2>
        <div className="overflow-x-auto rounded-xl border-2 border-ink bg-card">
          <table className="w-full text-sm">
            <thead className="bg-ink text-left text-ink-foreground"><tr><th className="p-3">#</th><th className="p-3">Tabla</th><th className="p-3">Contenido</th><th className="p-3">Relaciones</th></tr></thead>
            <tbody>
              {tablas.map(([t, d, r], i) => (
                <tr key={t} className="border-t"><td className="p-3">{i + 1}</td><td className="p-3 font-mono font-bold">{t}</td><td className="p-3">{d}</td><td className="p-3 text-muted-foreground">{r}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 text-xs text-ink-foreground">{er}</pre>
      </section>

      <section className="card-pop space-y-3 p-6 text-sm">
        <h2 className="text-2xl font-bold">Integración con servicios externos de BI</h2>
        <p>La base de datos es PostgreSQL, compatible con Power BI, Tableau, Looker Studio y Metabase.</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Conecta la herramienta BI con el conector nativo de PostgreSQL usando las credenciales de solo lectura del proyecto.</li>
          <li>Hechos: <b>detalle_pedido</b> y <b>pagos</b>. Dimensiones: <b>vehiculos</b>, <b>marcas</b>, <b>categorias</b>, <b>vendedores</b>, <b>profiles</b> y fecha de <b>pedidos</b>.</li>
          <li>Métricas sugeridas: ventas por categoría y ciudad, ticket promedio, rotación de inventario, ranking de vendedores, métodos de pago más usados.</li>
          <li>Alternativa: exportar con la API REST (cada tabla expone un endpoint JSON) hacia Google Sheets o un data warehouse.</li>
        </ol>
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{`SELECT c.nombre AS categoria, date_trunc('month', p.created_at) AS mes,
       SUM(d.cantidad * d.precio_unitario) AS ventas
FROM detalle_pedido d
JOIN pedidos p ON p.id = d.pedido_id
JOIN vehiculos v ON v.id = d.vehiculo_id
JOIN categorias c ON c.id = v.categoria_id
GROUP BY 1, 2 ORDER BY 2;`}</pre>
      </section>
    </div>
  );
}
