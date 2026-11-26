# VirtualGymAssistant — FrontEnd

Interfaz web del sistema de gestión de gimnasios, hecha con **React 19 + Vite**.
Consume la API REST en ASP.NET Core que está en `VirtualGymAssistant_BackEnd`.

Trabajo Final Integrador — Tecnicatura Universitaria en Programación (UTN).

---

## Cómo levantarlo

**Requisitos:** Node 20 o superior, y el backend corriendo.

```bash
npm install
npm run dev
```

Queda en `http://localhost:5173`.

La dirección del backend se configura en `.env.development`:

```
VITE_API_URL=http://localhost:5180
```

> Si cambiás el puerto del front, acordate de agregarlo a `Cors:OrigenesPermitidos`
> en el `appsettings.json` del backend, o las peticiones van a fallar por CORS.

### Otros comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compila para producción en `dist/` |
| `npm run preview` | Sirve lo compilado, para probar el build |
| `npm run lint` | Revisa el código con oxlint |

---

## El diseño

La identidad se llama **"Sala"** y sale de los materiales de un gimnasio boutique
bien hecho, en vez de los colores genéricos de un panel de administración:

| Material | Uso | Color |
|---|---|---|
| Cuero verde botella | Marca y acciones principales | `#17372B` |
| Verde profundo | Superficies inmersivas del sitio público | `#0E241B` |
| Hormigón pulido | Fondo de la aplicación | `#E8EAE7` |
| Roble claro | El único acento cálido | `#C08A4A` |
| Acero cepillado | Bordes y texto secundario | `#8C9490` |

**Tipografía:** una sola familia, **Archivo**, aprovechando su eje de *ancho*. El
texto va en ancho normal y los títulos y las cifras en expandido. Un gimnasio
funciona a base de números —3×10, 82,4 kg, 22 %, $25.000—, así que la cifra es el
elemento protagonista y va siempre con figuras tabulares para que las columnas se
alineen.

**Tres decisiones que sostienen el resto:**

1. **Radios diferenciados en lugar de uno solo.** Las filas de datos van a canto
   vivo, los controles apenas redondeados y sólo los paneles de verdad llevan curva
   visible. Un radio único para todo aplana la jerarquía.
2. **Líneas en vez de sombras.** La sombra aparece únicamente en lo que realmente
   flota sobre la página: los menús y los diálogos.
3. **La portada abre con el estado real del gimnasio**, no con una imagen de
   archivo: qué sedes hay y hasta qué hora abren hoy, traído de la API. Es lo
   primero que quiere saber alguien que está pensando en ir a entrenar.

Todo el sistema vive en `src/styles/tokens.css`. Ningún componente escribe un color
a mano, así que se puede reafinar la identidad entera desde ese archivo.

---

## Estructura

```
src/
├── api/
│   ├── cliente.js       Axios + interceptores (token y sucursal activa)
│   └── endpoints.js     Todas las rutas del backend, agrupadas por módulo
│
├── contexto/
│   └── SesionContexto   Quién soy y desde qué sucursal estoy operando
│
├── dominio/
│   ├── roles.js         Espejo de los roles del backend
│   ├── formato.js       Moneda, fechas y números en español de Argentina
│   └── pdf.js           Exportación de rutina y dieta a PDF
│
├── hooks/
│   ├── usePeticion.js   Lectura con estado de carga y error
│   ├── useAccion.js     Escritura con estado "en curso" y error
│   └── useTitulo.js     Título de la pestaña
│
├── componentes/
│   ├── ui/              Botón, Campo, Panel, Tabla, Diálogo, Métrica, Insignia...
│   ├── estructura/      Cascarones, barra lateral, selector de sucursal
│   └── app/             Calendario de asistencias y mapa de sucursales
│
├── paginas/
│   ├── publico/         Portada, planes, sucursales
│   ├── acceso/          Ingresar, crear cuenta, recuperar contraseña
│   ├── app/             Inicio del panel y foro
│   ├── socio/           Rutina, alimentación, cuotas, asistencias, progreso
│   └── gestion/         Padrón, cobranzas, personal, catálogos, sitio...
│
├── rutas/               Rutas protegidas y por rol
└── styles/              tokens, base, ui, estructura, publico, app
```

---

## Cómo se conecta con el backend

### El token y la sucursal activa viajan solos

El backend espera dos cosas en cada petición protegida: el token JWT y la cabecera
`X-Gimnasio-Id` con la sucursal sobre la que se está trabajando. Las dos las pone
el interceptor de `api/cliente.js`, así que **ninguna pantalla tiene que acordarse
de mandarlas**.

### Al cambiar de sucursal se recarga todo

Esta es la parte menos obvia del sistema. Como el rol de una persona depende de la
sede, cambiar de sucursal puede cambiar lo que puede hacer y cambia siempre los
datos que ve.

Por eso `usePeticion` agrega la sucursal activa a sus dependencias **por su
cuenta**. Si cada pantalla tuviera que acordarse de incluirla, bastaría con
olvidarla una vez para que alguien cambie de sede y siga viendo los datos de la
anterior, sin ningún indicio de que algo anda mal.

### Los errores ya vienen listos para mostrar

El backend responde siempre en formato ProblemDetails. El interceptor lo traduce a
un `Error` con el mensaje en `.message` y, cuando son errores de validación, el
detalle por campo en `.errores`. En la pantalla alcanza con:

```jsx
<AvisoDeError error={error} />
```

### Registrarse no inicia sesión

El registro crea la cuenta pero el backend **no devuelve token**: la persona entra
recién cuando confirma el código de 6 dígitos que le llega por mail. Por eso
`CrearCuenta` no usa `SesionContexto`: llama a `auth.registrar` y muestra
`VerificacionDeEmail`, la misma pantalla que usa `Ingresar` cuando el login se rechaza
con el código `EMAIL_NO_VERIFICADO`. Al confirmar, el backend devuelve la sesión y
recién ahí se llama a `aplicarSesion`.

### Los permisos se piden dos veces

La barra lateral y los botones se filtran por rol para que nadie vea una puerta
cerrada, pero **eso es sólo una cortesía de la interfaz**: el backend vuelve a
verificar los permisos en cada endpoint. Nunca es la única defensa.

---

## Qué pantallas hay

**Sitio público** (sin iniciar sesión): portada con el estado de hoy, planes con
precios, sucursales con un mapa grande y sus horarios, registro y recuperación de
contraseña.

**Cuenta del socio:** su estado y cuota del mes, rutina (generar, guardar, exportar
a PDF), plan de alimentación (ídem), las doce cuotas del año con el pago en línea,
calendario de asistencias con marcado de entrada y salida, y evolución de sus
mediciones.

**Mostrador:** padrón con filtros, asignación de plan, cobranzas con bandeja de
aprobación, grilla anual, cobro presencial y control de acceso.

**Administración:** personal y roles por sucursal, planes, formas de pago,
sucursales, horarios, catálogos, ejercicios, plantillas de rutina, alimentos y
contenido del sitio.

**Comunidad:** foro de la sucursal con respuestas y adjuntos.

---

## Usuarios de prueba

En desarrollo, la pantalla de ingreso muestra botones que completan las
credenciales de cada rol. La contraseña del seed es `123456`, salvo
`admin@vga.com`, que en la base actual tiene `admin`.

---

## Decisiones técnicas y por qué

**Sin framework de CSS.** Bootstrap o Tailwind hubieran sido más rápidos, pero con
Bootstrap no hay forma de que el resultado no se vea a plantilla, y el pedido era
un diseño con identidad propia. El sistema de tokens propio son unas 200 líneas y
da control total.

**Contexto de React en lugar de Redux.** El estado global de esta aplicación es
chico: quién sos y en qué sucursal estás. Redux agregaría ceremonia sin resolver
ningún problema que hoy exista.

**jsPDF se carga recién al exportar.** Pesa unos 400 kB, y sólo se usa al tocar
"Descargar en PDF". Con la importación dinámica en `dominio/pdf.js`, ese peso no
entra en el paquete inicial: bajó de 905 kB a 476 kB.

**JavaScript, no TypeScript.** Lo lee y lo modifica todo el equipo. Para el tamaño
del proyecto, los tipos hubieran agregado una barrera de entrada mayor que el
beneficio. Los DTOs que devuelve cada endpoint están documentados en Swagger.

**Nombres en español para el dominio, en inglés para lo técnico.** Igual que en el
backend: `PadronDeSocios`, `useSesion`, `Boton`, pero `src/components`, `hooks`,
`api`. El vocabulario del negocio es el del gimnasio.

**MapLibre con mapas de OpenFreeMap para el mapa de sucursales.** mapcn (que usa MapLibre
por debajo) pide Tailwind y shadcn/ui, y este front decidió no usar ningún framework de
CSS; Google Maps exige API key y cuenta de facturación para mostrar varios pines. Se usa
MapLibre directo y OpenFreeMap, que no pide clave ni tiene límites, aunque se ofrece "tal
cual", sin garantía de disponibilidad: si algún día se cae, alcanza con cambiar la
constante `ESTILO_DE_MAPA` de `dominio/mapas.js` por la de otro proveedor compatible.
MapLibre pesa unos 430 kB comprimidos, así que se carga con `lazy` recién al entrar a
Sucursales y el resto del sitio no lo paga. Las coordenadas de cada sede se cargan desde
el formulario de sucursales: sirve pegar en Latitud el "lat, lng" que copia Google Maps.
