import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ingresar o crear cuenta — Mi Cacharrito" },
      { name: "description", content: "Inicia sesión o crea tu cuenta en Mi Cacharrito con tu correo electrónico." },
      { property: "og:title", content: "Ingresar — Mi Cacharrito" },
      { property: "og:description", content: "Accede a tu cuenta de Mi Cacharrito." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const navigate = useNavigate();

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    if (modo === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setCargando(false);
      if (error) { toast.error("Correo o contraseña incorrectos"); return; }
      toast.success("¡Bienvenido!");
      navigate({ to: "/" });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { nombre } },
      });
      setCargando(false);
      if (error) { toast.error(error.message); return; }
      setEnviado(true);
    }
  }

  const input = "w-full rounded-lg border-2 border-ink bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="mx-auto max-w-md fade-up">
      <div className="card-pop p-8">
        <h1 className="text-3xl font-extrabold">{modo === "login" ? "Ingresar" : "Crear cuenta"}</h1>
        {enviado ? (
          <p className="mt-4 text-muted-foreground">
            Te enviamos un correo a <b>{email}</b>. Ábrelo y confirma tu cuenta para poder ingresar.
          </p>
        ) : (
          <form onSubmit={enviar} className="mt-6 space-y-4">
            {modo === "registro" && (
              <input className={input} placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            )}
            <input className={input} type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={input} type="password" placeholder="Contraseña (mín. 6 caracteres)" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button disabled={cargando} className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground disabled:opacity-50">
              {cargando ? "Un momento…" : modo === "login" ? "Ingresar" : "Crear cuenta"}
            </button>
          </form>
        )}
        <button
          onClick={() => { setModo(modo === "login" ? "registro" : "login"); setEnviado(false); }}
          className="mt-6 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          {modo === "login" ? "¿No tienes cuenta? Créala aquí" : "¿Ya tienes cuenta? Ingresa"}
        </button>
      </div>
    </div>
  );
}
