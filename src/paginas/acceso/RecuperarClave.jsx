import { useState } from "react";
import { Link } from "react-router-dom";

import { auth } from "../../api/endpoints.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Campo } from "../../componentes/ui/Campo.jsx";
import { Aviso, AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Marca } from "../../componentes/estructura/Marca.jsx";

/**
 * Caso de uso "Recuperar contraseña", en dos pasos.
 *
 * Primero se pide el código con el email y después se cambia la clave con ese
 * código. El backend responde siempre lo mismo exista o no el email, así que
 * el paso 1 nunca revela si la cuenta está registrada.
 */
export default function RecuperarClave() {
  useTitulo("Recuperar contraseña");

  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmacion, setConfirmacion] = useState("");

  const [mensaje, setMensaje] = useState(null);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState(null);
  const [enCurso, setEnCurso] = useState(false);

  async function pedirCodigo(evento) {
    evento.preventDefault();
    setError(null);
    setEnCurso(true);

    try {
      const { data } = await auth.solicitarRecuperacion({ email });

      setMensaje(data.mensaje);
      setPaso(2);
    } catch (err) {
      setError(err);
    } finally {
      setEnCurso(false);
    }
  }

  async function cambiarClave(evento) {
    evento.preventDefault();
    setError(null);
    setEnCurso(true);

    try {
      await auth.restablecerClave({
        email,
        codigo,
        nuevaClave,
        confirmacionClave: confirmacion,
      });

      setListo(true);
    } catch (err) {
      setError(err);
    } finally {
      setEnCurso(false);
    }
  }

  return (
    <div className="acceso superficie-oscura">
      <div className="acceso__caja">
        <Marca grande />

        {listo ? (
          <>
            <h1 className="acceso__titulo">Contraseña actualizada</h1>

            <div className="acceso__formulario">
              <Aviso tono="ok" titulo="Ya podés entrar con tu contraseña nueva." />

              <Link to="/ingresar" className="boton boton--principal boton--grande boton--bloque">
                Ir a ingresar
              </Link>
            </div>
          </>
        ) : paso === 1 ? (
          <>
            <h1 className="acceso__titulo">Recuperá tu contraseña</h1>
            <p className="acceso__bajada">Te enviamos un código de seis dígitos a tu email.</p>

            <form className="acceso__formulario" onSubmit={pedirCodigo} noValidate>
              <AvisoDeError error={error} />

              <Campo
                etiqueta="Email"
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                autoComplete="email"
                required
                autoFocus
              />

              <Boton type="submit" variante="principal" grande bloque enCurso={enCurso}>
                Enviarme el código
              </Boton>
            </form>
          </>
        ) : (
          <>
            <h1 className="acceso__titulo">Ingresá el código</h1>
            <p className="acceso__bajada">{mensaje}</p>

            <form className="acceso__formulario" onSubmit={cambiarClave} noValidate>
              <AvisoDeError error={error} />

              <Campo
                etiqueta="Código"
                value={codigo}
                onChange={(evento) => setCodigo(evento.target.value)}
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
              />

              <Campo
                etiqueta="Contraseña nueva"
                type="password"
                value={nuevaClave}
                onChange={(evento) => setNuevaClave(evento.target.value)}
                ayuda="Al menos 6 caracteres"
                autoComplete="new-password"
                required
              />

              <Campo
                etiqueta="Repetí la contraseña"
                type="password"
                value={confirmacion}
                onChange={(evento) => setConfirmacion(evento.target.value)}
                autoComplete="new-password"
                required
              />

              <Boton type="submit" variante="principal" grande bloque enCurso={enCurso}>
                Cambiar mi contraseña
              </Boton>
            </form>
          </>
        )}

        <p className="acceso__pie">
          <Link to="/ingresar">Volver a ingresar</Link>
        </p>
      </div>
    </div>
  );
}
