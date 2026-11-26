import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { auth, sucursales } from "../../api/endpoints.js";
import { useSesion } from "../../contexto/SesionContexto.jsx";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Campo, Seleccion } from "../../componentes/ui/Campo.jsx";
import { AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Marca } from "../../componentes/estructura/Marca.jsx";
import { VerificacionDeEmail } from "../../componentes/estructura/VerificacionDeEmail.jsx";

/**
 * Caso de uso "Registrarse en una sucursal".
 *
 * El visitante elige la sede a la que se asocia. Registrarse NO inicia sesión: la cuenta
 * queda creada pero sin acceso hasta que confirme el código que le llega por mail. Recién
 * ahí el backend devuelve la sesión y entra a su cuenta.
 */
export default function CrearCuenta() {
  useTitulo("Crear cuenta");

  const { aplicarSesion } = useSesion();
  const navegar = useNavigate();

  const { datos: sedes } = usePeticion(() => sucursales.publicas(), []);

  const [formulario, setFormulario] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    contrasena: "",
    idGimnasio: "",
  });

  const [error, setError] = useState(null);
  const [enCurso, setEnCurso] = useState(false);

  /* Respuesta del registro (email y mensaje). Mientras tenga valor se muestra la pantalla
     del código en lugar del formulario. */
  const [pendiente, setPendiente] = useState(null);

  const cambiar = (campo) => (evento) =>
    setFormulario((anterior) => ({ ...anterior, [campo]: evento.target.value }));

  /** Busca el mensaje que el backend devolvió para un campo puntual. */
  const errorDe = (campo) => {
    if (!error?.errores) return undefined;

    const clave = Object.keys(error.errores).find(
      (k) => k.toLowerCase() === campo.toLowerCase(),
    );

    return clave ? error.errores[clave][0] : undefined;
  };

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    setEnCurso(true);

    try {
      const { data } = await auth.registrar({
        ...formulario,
        telefono: formulario.telefono || null,
        idGimnasio: formulario.idGimnasio ? Number(formulario.idGimnasio) : null,
      });

      setPendiente(data);
    } catch (err) {
      setError(err);
    } finally {
      setEnCurso(false);
    }
  }

  if (pendiente) {
    return (
      <VerificacionDeEmail
        email={pendiente.email}
        descripcion={pendiente.mensaje}
        alConfirmar={(sesion) => {
          aplicarSesion(sesion);
          navegar("/app", { replace: true });
        }}
        alVolver={() => setPendiente(null)}
      />
    );
  }

  return (
    <div className="acceso superficie-oscura">
      <div className="acceso__caja" style={{ maxWidth: 520 }}>
        <Marca grande />

        <h1 className="acceso__titulo">Creá tu cuenta</h1>
        <p className="acceso__bajada">
          Te vas a registrar como socio de la sucursal que elijas.
        </p>

        <form className="acceso__formulario" onSubmit={enviar} noValidate>
          <AvisoDeError error={error} />

          <div className="rejilla-formulario">
            <Campo
              etiqueta="Nombre"
              value={formulario.nombre}
              onChange={cambiar("nombre")}
              error={errorDe("nombre")}
              autoComplete="given-name"
              required
              autoFocus
            />

            <Campo
              etiqueta="Apellido"
              value={formulario.apellido}
              onChange={cambiar("apellido")}
              error={errorDe("apellido")}
              autoComplete="family-name"
              required
            />
          </div>

          <Campo
            etiqueta="Email"
            type="email"
            value={formulario.email}
            onChange={cambiar("email")}
            error={errorDe("email")}
            autoComplete="email"
            required
          />

          <div className="rejilla-formulario">
            <Campo
              etiqueta="Teléfono"
              value={formulario.telefono}
              onChange={cambiar("telefono")}
              error={errorDe("telefono")}
              ayuda="Opcional"
              autoComplete="tel"
            />

            <Campo
              etiqueta="Contraseña"
              type="password"
              value={formulario.contrasena}
              onChange={cambiar("contrasena")}
              error={errorDe("contrasena")}
              ayuda="Al menos 6 caracteres"
              autoComplete="new-password"
              required
            />
          </div>

          <Seleccion
            etiqueta="Sucursal"
            value={formulario.idGimnasio}
            onChange={cambiar("idGimnasio")}
            vacio="La sede principal"
            opciones={(sedes ?? []).map((sede) => ({
              valor: sede.id,
              texto: `${sede.nombre} — ${sede.direccion}`,
            }))}
            ancho
          />

          <Boton type="submit" variante="principal" grande bloque enCurso={enCurso}>
            Crear mi cuenta
          </Boton>
        </form>

        <p className="acceso__pie">
          ¿Ya tenés cuenta? <Link to="/ingresar">Ingresá</Link>
          <br />
          Si ya te registraste y te falta confirmar el email, ingresá y te pedimos el código.
        </p>
      </div>
    </div>
  );
}
