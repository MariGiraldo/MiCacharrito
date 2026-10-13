import carro from "@/assets/carro.jpg";
import moto from "@/assets/moto.jpg";
import bicicleta from "@/assets/bicicleta.jpg";

export const imagenPorCategoria: Record<number, string> = { 1: carro, 2: moto, 3: bicicleta };

export function imagenVehiculo(v: { imagen_url: string | null; categoria_id: number }) {
  return v.imagen_url || imagenPorCategoria[v.categoria_id] || carro;
}

export const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export const VEHICULO_SELECT =
  "*, marcas(nombre), categorias(nombre, slug), vendedores(nombre_comercial, ciudad, calificacion, telefono), inventario(stock, ubicacion)";

export function stockDe(v: { inventario: { stock: number } | { stock: number }[] | null }) {
  const i = Array.isArray(v.inventario) ? v.inventario[0] : v.inventario;
  return i?.stock ?? 0;
}
