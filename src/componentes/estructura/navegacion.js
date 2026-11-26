import {
  Apple,
  Building2,
  CalendarCheck,
  ClipboardList,
  Clock,
  CreditCard,
  Dumbbell,
  House,
  Image,
  LineChart,
  MessagesSquare,
  Receipt,
  Tags,
  Users,
  Wallet,
} from "lucide-react";

import { ROLES } from "../../dominio/roles.js";

/**
 * Mapa de navegación de la aplicación.
 *
 * Cada grupo declara qué roles lo ven. La barra lateral filtra con esto, así
 * nadie ve un enlace que va a terminar en un 403. El backend igual verifica
 * los permisos en cada endpoint: esto es sólo para no mostrar puertas cerradas.
 */
export const GRUPOS_DE_NAVEGACION = [
  {
    titulo: null,
    items: [{ ruta: "/app", texto: "Inicio", icono: House, exacto: true }],
  },
  {
    titulo: "Mi cuenta",
    items: [
      { ruta: "/app/rutina", texto: "Mi rutina", icono: Dumbbell },
      { ruta: "/app/alimentacion", texto: "Mi alimentación", icono: Apple },
      { ruta: "/app/cuotas", texto: "Mis cuotas", icono: Wallet },
      { ruta: "/app/asistencias", texto: "Mis asistencias", icono: CalendarCheck },
      { ruta: "/app/progreso", texto: "Mi progreso", icono: LineChart },
      { ruta: "/app/sumarme", texto: "Sumarme a otra sucursal", icono: Building2 },
    ],
  },
  {
    titulo: "Mostrador",
    roles: [ROLES.recepcionista, ROLES.administrador],
    items: [
      { ruta: "/app/socios", texto: "Socios", icono: Users },
      { ruta: "/app/cobranzas", texto: "Cobranzas", icono: Receipt },
      { ruta: "/app/control-de-acceso", texto: "Control de acceso", icono: ClipboardList },
    ],
  },
  {
    titulo: "Entrenamiento",
    roles: [ROLES.entrenador, ROLES.administrador],
    items: [
      { ruta: "/app/ejercicios", texto: "Ejercicios", icono: Dumbbell },
      { ruta: "/app/plantillas", texto: "Plantillas de rutina", icono: ClipboardList },
      { ruta: "/app/socios", texto: "Asignar rutinas", icono: Users },
    ],
  },
  {
    titulo: "Nutrición",
    roles: [ROLES.nutricionista, ROLES.administrador],
    items: [
      { ruta: "/app/alimentos", texto: "Alimentos", icono: Apple },
      { ruta: "/app/socios", texto: "Asignar dietas", icono: Users },
    ],
  },
  {
    titulo: "Administración",
    roles: [ROLES.administrador],
    items: [
      { ruta: "/app/personal", texto: "Personal", icono: Users },
      { ruta: "/app/planes", texto: "Planes", icono: CreditCard },
      { ruta: "/app/formas-de-pago", texto: "Formas de pago", icono: Wallet },
      { ruta: "/app/sucursales", texto: "Sucursales", icono: Building2 },
      { ruta: "/app/horarios", texto: "Horarios", icono: Clock },
      { ruta: "/app/catalogos", texto: "Catálogos", icono: Tags },
      { ruta: "/app/sitio-web", texto: "Sitio web", icono: Image },
    ],
  },
  {
    titulo: "Comunidad",
    items: [{ ruta: "/app/foro", texto: "Foro", icono: MessagesSquare }],
  },
];
