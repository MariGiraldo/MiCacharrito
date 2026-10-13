import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Mis datos — Mi Cacharrito" },
      { name: "description", content: "Actualiza tus datos de cliente." },
      { property: "og:title", content: "Mis datos — Mi Cacharrito" },
      { property: "og:description", content: "Datos del cliente." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { user } = Route.useRouteContext();
  const { data } = useQuery({
    queryKey: ["perfil", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });
  const [f, setF] = useState({ nombre: "", documento: "", telefono: "", ciudad: "", direccion: "" });
  useEffect(() => {
    if (data) setF({ nombre: data.nombre ?? "", documento: data.documento ?? "", telefono: data.telefono ?? "", ciudad: data.ciudad ?? "", direccion: data.direccion ?? "" });
  }, [data]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...f });
    if (error) toast.error(error.message);
    else toast.success("Datos guardados");
  }

  return (
    <form onSubmit={guardar} className="card-pop mx-auto max-w-lg space-y-3 p-8">
      <h1 className="text-3xl font-extrabold">Mis datos de cliente</h1>
      <p className="text-sm text-muted-foreground">{user.email}</p>
      {(["nombre", "documento", "telefono", "ciudad", "direccion"] as const).map((k) => (
        <label key={k} className="block text-sm font-semibold capitalize">
          {k === "telefono" ? "Teléfono" : k === "direccion" ? "Dirección" : k}
          <input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="mt-1 w-full rounded-lg border-2 border-ink bg-background px-3 py-2 font-normal" />
        </label>
      ))}
      <button className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground">Guardar</button>
    </form>
  );
}
