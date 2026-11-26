import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";

import { auth } from "../../api/endpoints.js";
import { useAccion } from "../../hooks/useAccion.js";
import { Boton } from "../ui/Boton.jsx";
import { Campo } from "../ui/Campo.jsx";
import { Aviso, AvisoDeError } from "../ui/Aviso.jsx";
import { Marca } from "./Marca.jsx";

/**
 * Pantalla "Confirmá tu email": pide el código de 6 dígitos que llegó por mail.
 *
 * Es la única puerta de entrada de una cuenta que todavía no confirmó su email. La
 * comparten los dos caminos que terminan acá: el registro (la cuenta queda creada pero
 * sin sesión) y el ingreso de una cuenta que nunca llegó a confirmar. En ambos, cuando el
 * código es correcto el backend devuelve la sesión ya iniciada, así que no hace falta pedir
 * la contraseña de nuevo; a dónde ir después lo decide quien la usa con `alConfirmar`.
 *
 * @param email Dirección a la que se mandó el código.
 * @param descripcion Texto de la bajada, que cambia según cómo se llegó a la pantalla.
 * @param alConfirmar Recibe la sesión que devolvió el backend.
 * @param alVolver Vuelve a la pantalla anterior.
 */
export function VerificacionDeEmail({ email, descripcion, alConfirmar, alVolver }) {
  const [codigo, setCodigo] = useState("");
  const [mensajeDeReenvio, setMensajeDeReenvio] = useState(null);

  const verificar = useAccion(() => auth.verificarEmail({ email, codigo }));
  const reenviar = useAccion(() => auth.reenviarVerificacion({ email }));

  async function confirmar(evento) {
    evento.preventDefault();
    reenviar.limpiarError();
    setMensajeDeReenvio(null);

    const sesion = await verificar.ejecutar();

    if (sesion) alConfirmar(sesion);
  }

  async function reenviarCodigo() {
    verificar.limpiarError();
    setMensajeDeReenvio(null);

    const respuesta = await reenviar.ejecutar();

    if (respuesta) setMensajeDeReenvio(respuesta.mensaje);
  }

  return (
    <div className="acceso superficie-oscura">
      <div className="acceso__caja">
        <Marca grande />

        <h1 className="acceso__titulo">Confirmá tu email</h1>
        <p className="acceso__bajada">{descripcion}</p>

        <form className="acceso__formulario" onSubmit={confirmar} noValidate>
          <AvisoDeError error={verificar.error ?? reenviar.error} />

          {mensajeDeReenvio && <Aviso tono="ok">{mensajeDeReenvio}</Aviso>}

          <Campo
            etiqueta="Código"
            value={codigo}
            // Al pegar "123 456" o "123-456" se descartan los separadores. No se usa
            // maxLength: recortaría el texto pegado ANTES de limpiarlo y se perdería un dígito.
            onChange={(evento) => setCodigo(evento.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            autoFocus
          />

          {/* "disabled" pisa al que calcula Boton a partir de "enCurso", por eso se
              le suma acá: si no, durante el pedido el botón volvería a quedar activo. */}
          <Boton
            type="submit"
            variante="principal"
            grande
            bloque
            enCurso={verificar.enCurso}
            disabled={verificar.enCurso || codigo.length !== 6}
          >
            Confirmar y entrar
          </Boton>

          <Boton
            type="button"
            variante="fantasma"
            icono={MailCheck}
            bloque
            enCurso={reenviar.enCurso}
            onClick={reenviarCodigo}
          >
            Reenviar código
          </Boton>
        </form>

        <p className="acceso__pie">
          <Link
            to="#"
            onClick={(evento) => {
              evento.preventDefault();
              alVolver();
            }}
          >
            Volver
          </Link>
        </p>
      </div>
    </div>
  );
}
