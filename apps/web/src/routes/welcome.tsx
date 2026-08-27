import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "../features/landing/LandingPage.js";

/**
 * La puerta publica.
 *
 * SIN guarda, a proposito: es la unica pantalla del sistema que no exige nada.
 * Todas las demas exigen cuenta, perfil o ambos, y por eso desde `add-landing-page`
 * es aqui donde acaba todo el que llega sin sesion.
 */
export const Route = createFileRoute("/welcome")({
  // A sangre completa: es la unica pantalla que no quiere el ancho de lectura
  // que la raiz da por defecto a lo previo a tener un rol.
  staticData: { fullBleed: true },
  component: LandingPage,
});
