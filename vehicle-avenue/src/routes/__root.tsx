import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { ShoppingCart, LogOut, User as UserIcon } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Esta página no cargó</h1>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mi Cacharrito" },
      { name: "description", content: "Compra y venta de carros, motos y bicicletas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Header() {
  const { user } = useAuth();
  const { data: count = 0 } = useQuery({
    queryKey: ["carrito-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("carrito_items").select("cantidad");
      return (data ?? []).reduce((a, b) => a + b.cantidad, 0);
    },
  });
  const nav = "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-secondary";
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link to="/" className="font-display mr-auto text-2xl font-extrabold">
          mi<span className="text-primary">cacharrito</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          <Link to="/" className={nav} activeProps={{ className: "bg-secondary" }} activeOptions={{ exact: true }}>Catálogo</Link>
          <Link to="/vender" className={nav} activeProps={{ className: "bg-secondary" }}>Vender e inventario</Link>
          <Link to="/bi" className={nav} activeProps={{ className: "bg-secondary" }}>Datos y BI</Link>
        </nav>
        <Link to="/carrito" className="relative rounded-full border-2 border-ink p-2 hover:bg-secondary" aria-label="Carrito">
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </Link>
        {user ? (
          <>
            <Link to="/perfil" className="rounded-full border-2 border-ink p-2 hover:bg-secondary" aria-label="Mi perfil">
              <UserIcon className="h-5 w-5" />
            </Link>
            <button onClick={() => supabase.auth.signOut()} className="rounded-full border-2 border-ink p-2 hover:bg-secondary" aria-label="Cerrar sesión">
              <LogOut className="h-5 w-5" />
            </button>
          </>
        ) : (
          <Link to="/auth" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground">
            Ingresar
          </Link>
        )}
      </div>
      <nav className="flex justify-center gap-1 pb-2 sm:hidden">
        <Link to="/" className={nav}>Catálogo</Link>
        <Link to="/vender" className={nav}>Vender</Link>
        <Link to="/bi" className={nav}>BI</Link>
      </nav>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      else queryClient.removeQueries({ queryKey: ["carrito"] });
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t-2 border-ink py-6 text-center text-sm text-muted-foreground">
        Mi Cacharrito · Carros, motos y bicicletas en Colombia
      </footer>
      <Toaster />
    </QueryClientProvider>
  );
}
