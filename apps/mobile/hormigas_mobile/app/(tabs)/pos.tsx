import { Redirect } from 'expo-router'

/**
 * Pestaña "Punto de venta" del ADMIN. El tabPress del layout abre el POS encima del panel;
 * si se llega a esta ruta por otro camino, redirige al POS.
 */
export default function PosTabRoute() {
    return <Redirect href="/(pos)/venta" />
}
