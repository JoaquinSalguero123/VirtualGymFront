import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useSesion } from "../../contexto/SesionContexto.jsx";
import { useTitulo } from "../../hooks/useTitulo.js";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Campo } from "../../componentes/ui/Campo.jsx";
import { AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Marca } from "../../componentes/estructura/Marca.jsx";
import { VerificacionDeEmail } from "../../componentes/estructura/VerificacionDeEmail.jsx";

/** Pantalla de inicio de sesión. */
export default function Ingresar() {
  useTitulo("Ingresar");

  const { iniciarSesion, aplicarSesion } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);
  const [enCurso, setEnCurso] = useState(false);

  /* Si el login se rechaza porque el email no está verificado, se pasa a la pantalla del
     código en vez de mostrar sólo un cartel de error: ahí mismo se puede reenviar el
     código y confirmarlo, sin tener que loguearse de nuevo después. */
  const [necesitaVerificar, setNecesitaVerificar] = useState(false);

  /* Si llegó acá por intentar entrar a una pantalla protegida, se vuelve a esa
     pantalla después de entrar. */
  const destino = ubicacion.state?.destino ?? "/app";

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    setEnCurso(true);

    try {
      await iniciarSesion({ email, contrasena });
      navegar(destino, { replace: true });
    } catch (err) {
      setError(err);
      if (err.codigo === "EMAIL_NO_VERIFICADO") setNecesitaVerificar(true);
    } finally {
      setEnCurso(false);
    }
  }

  if (necesitaVerificar) {
    return (
      <VerificacionDeEmail
        email={email}
        descripcion={`Todavía no verificaste ${email}. Ingresá el código que te mandamos por mail, o pedí uno nuevo si no te llegó o ya venció.`}
        alConfirmar={(sesion) => {
          aplicarSesion(sesion);
          navegar(destino, { replace: true });
        }}
        alVolver={() => {
          setNecesitaVerificar(false);
          setError(null);
        }}
      />
    );
  }

  return (
    <div className="acceso superficie-oscura">
      <div className="acceso__caja">
        <Marca grande />

        <h1 className="acceso__titulo">Entrá a tu cuenta</h1>
        <p className="acceso__bajada">Con el mismo mail con el que te registraste en el gimnasio.</p>

        <form className="acceso__formulario" onSubmit={enviar} noValidate>
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

          <Campo
            etiqueta="Contraseña"
            type="password"
            value={contrasena}
            onChange={(evento) => setContrasena(evento.target.value)}
            autoComplete="current-password"
            required
          />

          <Boton type="submit" variante="principal" grande bloque enCurso={enCurso}>
            Ingresar
          </Boton>
        </form>

        <p className="acceso__pie">
          ¿No tenés cuenta? <Link to="/crear-cuenta">Creá una</Link>
          <br />
          <Link to="/recuperar-clave">Olvidé mi contraseña</Link>
        </p>
      </div>
    </div>
  );
}
