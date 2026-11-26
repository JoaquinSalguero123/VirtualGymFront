import { useState } from "react";
import { Building2, Pencil, Plus, UserMinus, Users } from "lucide-react";

import { usuarios } from "../../api/endpoints.js";
import { useSesion } from "../../contexto/SesionContexto.jsx";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { ROLES } from "../../dominio/roles.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Buscador } from "../../componentes/ui/Buscador.jsx";
import { Campo, Casilla, Seleccion } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Tabla, Paginador } from "../../componentes/ui/Tabla.jsx";
import { Dialogo, DialogoDeConfirmacion } from "../../componentes/ui/Dialogo.jsx";
import { Aviso, AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Insignia } from "../../componentes/ui/Insignia.jsx";
import { EstadoVacio } from "../../componentes/ui/Estados.jsx";

/**
 * Casos de uso de "Personal y roles": alta de empleados, cambio de rol,
 * asignación en varias sucursales y baja de la asignación.
 */
export default function GestionDePersonal() {
  const { esDuenio, sucursalActiva } = useSesion();

  const [texto, setTexto] = useState("");
  const [pagina, setPagina] = useState(1);
  const [enEdicion, setEnEdicion] = useState(null);
  const [aQuitar, setAQuitar] = useState(null);
  const [aAsignar, setAAsignar] = useState(null);
  const [recienDadoDeAlta, setRecienDadoDeAlta] = useState(null);

  const { datos: roles } = usePeticion(() => usuarios.roles(), []);

  const { datos, cargando, recargar } = usePeticion(
    () => usuarios.listar({ texto: texto || undefined, pagina, tamanioPagina: 20 }),
    [texto, pagina],
  );

  const quitar = useAccion((id) => usuarios.quitarDeSucursal(id));

  /* El rol Dueño no se asigna a mano: surge de ser titular de la organización.
     Y sólo el dueño puede designar administradores. */
  const rolesAsignables = (roles ?? []).filter(
    (rol) =>
      rol.nombre !== ROLES.duenio &&
      (esDuenio || rol.nombre !== ROLES.administrador),
  );

  const columnas = [
    {
      clave: "persona",
      titulo: "Persona",
      principal: true,
      celda: (usuario) => (
        <>
          {usuario.nombre} {usuario.apellido}
          <span className="texto-tenue" style={{ display: "block" }}>
            {usuario.email}
          </span>
        </>
      ),
    },
    { clave: "usuario", titulo: "Usuario", celda: (usuario) => usuario.username },
    {
      clave: "rol",
      titulo: "Rol en esta sucursal",
      celda: (usuario) =>
        usuario.rol ? <Insignia tono="marca">{usuario.rol}</Insignia> : <span className="texto-tenue">—</span>,
    },
    {
      clave: "estado",
      titulo: "Cuenta",
      celda: (usuario) =>
        usuario.activo ? (
          <Insignia tono="ok">Activa</Insignia>
        ) : (
          <Insignia tono="neutra">Desactivada</Insignia>
        ),
    },
    {
      clave: "acciones",
      titulo: "",
      acciones: true,
      celda: (usuario) => (
        <div className="fila" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
          <Boton
            variante="fantasma"
            soloIcono
            title="Asignar en otra sucursal"
            aria-label={`Asignar ${usuario.nombre} en otra sucursal`}
            onClick={() => setAAsignar(usuario)}
          >
            <Building2 size={15} />
          </Boton>

          <Boton
            variante="fantasma"
            soloIcono
            title="Editar"
            aria-label={`Editar ${usuario.nombre}`}
            onClick={() => setEnEdicion(usuario)}
          >
            <Pencil size={15} />
          </Boton>

          <Boton
            variante="fantasma"
            soloIcono
            title="Quitar de esta sucursal"
            aria-label={`Quitar ${usuario.nombre} de la sucursal`}
            onClick={() => setAQuitar(usuario)}
          >
            <UserMinus size={15} />
          </Boton>
        </div>
      ),
    },
  ];

  return (
    <>
      <EncabezadoDePagina
        titulo="Personal"
        descripcion={`Empleados que trabajan en ${sucursalActiva?.gimnasio ?? "la sucursal activa"}.`}
        acciones={
          <Boton variante="principal" icono={Plus} onClick={() => setEnEdicion({})}>
            Dar de alta
          </Boton>
        }
      />

      <div className="pila">
        <AvisoDeError error={quitar.error} />

        {recienDadoDeAlta && (
          <Aviso
            tono="ok"
            titulo={`Se dio de alta a ${recienDadoDeAlta.nombre} ${recienDadoDeAlta.apellido}`}
          >
            Le mandamos un código de verificación a {recienDadoDeAlta.email}. Tiene que
            confirmarlo la primera vez que ingrese; si no le llega, lo puede volver a pedir
            desde la pantalla de ingreso.
          </Aviso>
        )}

        {!esDuenio && (
          <Aviso tono="info">
            Sólo el titular de la organización puede designar administradores.
          </Aviso>
        )}

        <Panel ajustado>
          <Buscador
            valor={texto}
            alCambiar={(valor) => {
              setTexto(valor);
              setPagina(1);
            }}
            marcador="Buscar por nombre o email"
          />
        </Panel>

        <Panel sinRelleno>
          <Tabla
            columnas={columnas}
            filas={datos?.items}
            cargando={cargando}
            vacio={
              <EstadoVacio
                icono={Users}
                titulo="No hay personal asignado a esta sucursal."
                accion={{ texto: "Dar de alta", icono: Plus, onClick: () => setEnEdicion({}) }}
              >
                <p>Los socios no aparecen acá: están en el padrón de socios.</p>
              </EstadoVacio>
            }
          />

          <Paginador resultado={datos} alCambiarPagina={setPagina} />
        </Panel>
      </div>

      {/* Se montan sólo mientras están abiertos: así cada apertura arranca con el
          formulario y los errores limpios, sin arrastrar nada de la anterior. */}
      {enEdicion && (
        <DialogoDePersona
          key={enEdicion.id ?? "nueva"}
          usuario={enEdicion}
          roles={rolesAsignables}
          alCerrar={() => setEnEdicion(null)}
          alGuardar={(creada) => {
            setEnEdicion(null);
            setRecienDadoDeAlta(creada ?? null);
            recargar();
          }}
        />
      )}

      {aAsignar && (
        <DialogoDeAsignacion
          key={aAsignar.id}
          usuario={aAsignar}
          roles={rolesAsignables}
          alCerrar={() => setAAsignar(null)}
          alGuardar={() => {
            setAAsignar(null);
            recargar();
          }}
        />
      )}

      <DialogoDeConfirmacion
        abierto={aQuitar !== null}
        titulo="Quitar de la sucursal"
        mensaje={`${aQuitar?.nombre} ${aQuitar?.apellido} deja de operar en esta sucursal. Conserva su cuenta y los roles que tenga en otras sedes.`}
        textoDeAccion="Quitar de la sucursal"
        peligrosa
        enCurso={quitar.enCurso}
        alCerrar={() => setAQuitar(null)}
        alConfirmar={async () => {
          if (await quitar.ejecutar(aQuitar.id)) {
            setAQuitar(null);
            recargar();
          }
        }}
      />
    </>
  );
}

function DialogoDePersona({ usuario, roles, alCerrar, alGuardar }) {
  const [formulario, setFormulario] = useState(() => ({
    nombre: usuario.nombre ?? "",
    apellido: usuario.apellido ?? "",
    email: usuario.email ?? "",
    telefono: usuario.telefono ?? "",
    username: usuario.username ?? "",
    contrasena: "",
    idRol: usuario.idRol ?? "",
    activo: usuario.activo ?? true,
  }));

  const guardar = useAccion((id, datos) =>
    id ? usuarios.actualizar(id, datos) : usuarios.crear(datos),
  );

  const esNuevo = !usuario.id;

  /* Si la persona ya tiene un rol que quien edita no puede asignar (por ejemplo
     el de administrador, para alguien que no es el dueño), se lo muestra igual
     para que el selector no aparezca vacío. */
  const opcionesDeRol = roles.map((rol) => ({ valor: rol.id, texto: rol.nombre }));

  if (usuario.idRol && !roles.some((rol) => rol.id === usuario.idRol))
    opcionesDeRol.push({ valor: usuario.idRol, texto: usuario.rol });

  const cambiar = (campo) => (evento) =>
    setFormulario({
      ...formulario,
      [campo]: evento.target.type === "checkbox" ? evento.target.checked : evento.target.value,
    });

  async function confirmar() {
    const datos = esNuevo
      ? {
          nombre: formulario.nombre,
          apellido: formulario.apellido,
          email: formulario.email,
          telefono: formulario.telefono || null,
          username: formulario.username || null,
          contrasena: formulario.contrasena,
          idRol: Number(formulario.idRol),
        }
      : {
          nombre: formulario.nombre,
          apellido: formulario.apellido,
          telefono: formulario.telefono || null,
          username: formulario.username || null,
          activo: formulario.activo,
          idRol: formulario.idRol ? Number(formulario.idRol) : null,
        };

    const resultado = await guardar.ejecutar(usuario.id, datos);

    /* En un alta se devuelve la cuenta creada, para que la pantalla avise a quién se
       le mandó el código de verificación. */
    if (resultado) alGuardar(esNuevo ? resultado : null);
  }

  const completo =
    formulario.nombre &&
    formulario.apellido &&
    formulario.idRol &&
    (!esNuevo || (formulario.email && formulario.contrasena));

  return (
    <Dialogo
      abierto
      titulo={esNuevo ? "Dar de alta personal" : "Editar la persona"}
      descripcion={
        esNuevo
          ? "Se crea la cuenta, se le asigna el rol en la sucursal activa y se le manda un código para que confirme su email."
          : "El rol que elijas se aplica en la sucursal activa."
      }
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>

          <Boton
            variante="principal"
            enCurso={guardar.enCurso}
            disabled={!completo}
            onClick={confirmar}
          >
            {esNuevo ? "Dar de alta" : "Guardar cambios"}
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={guardar.error} />

        <div className="rejilla-formulario">
          <Campo etiqueta="Nombre" value={formulario.nombre} onChange={cambiar("nombre")} required />
          <Campo etiqueta="Apellido" value={formulario.apellido} onChange={cambiar("apellido")} required />
        </div>

        {esNuevo && (
          <Campo
            etiqueta="Email"
            type="email"
            value={formulario.email}
            onChange={cambiar("email")}
            ayuda="Con este mail va a iniciar sesión y ahí le llega el código: revisá que esté bien escrito."
            required
          />
        )}

        <div className="rejilla-formulario">
          <Campo etiqueta="Teléfono" value={formulario.telefono} onChange={cambiar("telefono")} ayuda="Opcional" />

          <Campo
            etiqueta="Nombre de usuario"
            value={formulario.username}
            onChange={cambiar("username")}
            ayuda={esNuevo ? "Si lo dejás vacío se genera del email." : undefined}
          />
        </div>

        {esNuevo && (
          <Campo
            etiqueta="Contraseña inicial"
            type="password"
            value={formulario.contrasena}
            onChange={cambiar("contrasena")}
            ayuda="Al menos 6 caracteres. La persona la puede cambiar después desde su cuenta."
            required
          />
        )}

        <Seleccion
          etiqueta="Rol en esta sucursal"
          value={formulario.idRol}
          onChange={cambiar("idRol")}
          vacio="Elegí un rol"
          opciones={opcionesDeRol}
        />

        {!esNuevo && (
          <Casilla
            etiqueta="La cuenta está activa y puede iniciar sesión"
            checked={formulario.activo}
            onChange={cambiar("activo")}
          />
        )}
      </div>
    </Dialogo>
  );
}

/** Caso de uso "Asignar roles en varias sucursales". */
function DialogoDeAsignacion({ usuario, roles, alCerrar, alGuardar }) {
  const { sucursales } = useSesion();

  const [idGimnasio, setIdGimnasio] = useState("");
  const [idRol, setIdRol] = useState("");

  const asignar = useAccion((id, datos) => usuarios.asignarEnSucursal(id, datos));

  const { datos: asignaciones } = usePeticion(() => usuarios.asignaciones(usuario.id), []);

  return (
    <Dialogo
      abierto
      titulo={`Sucursales de ${usuario.nombre} ${usuario.apellido}`}
      descripcion="La misma persona puede trabajar en más de una sede, con el mismo rol o con otro."
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cerrar
          </Boton>

          <Boton
            variante="principal"
            enCurso={asignar.enCurso}
            disabled={!idGimnasio || !idRol}
            onClick={async () => {
              const ok = await asignar.ejecutar(usuario.id, {
                idGimnasio: Number(idGimnasio),
                idRol: Number(idRol),
              });

              if (ok) alGuardar();
            }}
          >
            Asignar
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={asignar.error} />

        {asignaciones && asignaciones.length > 0 && (
          <div>
            <span className="etiqueta-dato">Asignaciones actuales</span>

            <div className="pila-corta" style={{ marginTop: "var(--e-corto)" }}>
              {asignaciones.map((asignacion) => (
                <div className="fila-separada" key={asignacion.idAsignacion}>
                  <span>{asignacion.sucursal}</span>

                  <div className="fila">
                    <Insignia tono={asignacion.activo ? "marca" : "neutra"}>
                      {asignacion.rol}
                    </Insignia>

                    {!asignacion.activo && <span className="texto-tenue">dado de baja</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rejilla-formulario">
          <Seleccion
            etiqueta="Sucursal"
            value={idGimnasio}
            onChange={(evento) => setIdGimnasio(evento.target.value)}
            vacio="Elegí una sucursal"
            opciones={sucursales.map((sucursal) => ({
              valor: sucursal.idGimnasio,
              texto: sucursal.gimnasio,
            }))}
          />

          <Seleccion
            etiqueta="Rol"
            value={idRol}
            onChange={(evento) => setIdRol(evento.target.value)}
            vacio="Elegí un rol"
            opciones={roles.map((rol) => ({ valor: rol.id, texto: rol.nombre }))}
          />
        </div>
      </div>
    </Dialogo>
  );
}
