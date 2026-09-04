import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * `next dev` se anuncia como `localhost`, y desde Next 16 bloquea por defecto
   * sus recursos de desarrollo pedidos desde cualquier otro origen — entre
   * ellos `127.0.0.1`, que es la URL que este proyecto documenta y la que usan
   * las pruebas end-to-end.
   *
   * El bloqueo no se ve como un error: la página llega bien desde el servidor,
   * pero React nunca hidrata. La app queda de adorno — el formulario de "la
   * entrada" recarga la página en vez de pedir el código— y en la consola sólo
   * aparece un fallo del websocket de HMR, que parece inofensivo. El aviso real
   * queda en la salida de `next dev`.
   *
   * No aplica en producción: `allowedDevOrigins` sólo gobierna el servidor de
   * desarrollo.
   */
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
