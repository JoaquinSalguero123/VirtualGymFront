import { useState } from "react";
import { Plus, Trash2, Wand2, X } from "lucide-react";

import { alimentos, dietas, objetivos } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { fecha } from "../../dominio/formato.js";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Campo, Seleccion } from "../../componentes/ui/Campo.jsx";
import { Dialogo } from "../../componentes/ui/Dialogo.jsx";
import { Aviso, AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Insignia } from "../../componentes/ui/Insignia.jsx";
import { Cargando } from "../../componentes/ui/Estados.jsx";
import { DiasDeDieta } from "../socio/MiAlimentacion.jsx";

const FORMULARIO_VACIO = { nombre: "", idObjetivo: "", dias: [{ dia: "Día 1", comidas: [] }] };

/**
 * Caso de uso "el nutricionista arma y asigna una dieta a un socio de su sucursal".
 *
 * Muestra la dieta vigente del socio para tener contexto y, debajo, un editor día
 * por día para asignarle una nueva: partiendo de una propuesta automática según el
 * objetivo, ajustándola a mano, o armándola íntegramente desde cero.
 */
export default function DialogoAsignarDieta({ socio, alCerrar, alGuardar }) {
  const { datos: vigente, cargando: cargandoVigente } = usePeticion(
    () => (socio ? dietas.deSocio(socio.id) : Promise.resolve({ data: null })),
    [socio?.id],
  );

  const { datos: historial } = usePeticion(
    () => (socio ? dietas.historialDeSocio(socio.id) : Promise.resolve({ data: [] })),
    [socio?.id],
  );

  const { datos: listaDeObjetivos } = usePeticion(() => objetivos.listar(), []);
  const { datos: catalogo } = usePeticion(() => alimentos.listar(), []);

  // El padre monta este diálogo con key={idDelSocio}: React lo remonta entero cada vez
  // que cambia de socio (o se cierra y se vuelve a abrir), así que arranca en blanco sin
  // necesidad de un efecto que lo resetee a mano.
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [diasAGenerar, setDiasAGenerar] = useState(7);

  const asignar = useAccion((datos) => dietas.asignar(datos));
  const generar = useAccion((datos) => dietas.generar(datos));

  if (!socio) return <Dialogo abierto={false} alCerrar={alCerrar} titulo="" />;

  async function generarPropuesta() {
    const propuesta = await generar.ejecutar({
      idObjetivo: formulario.idObjetivo ? Number(formulario.idObjetivo) : null,
      dias: Number(diasAGenerar),
      idsDeCategorias: [],
    });

    if (!propuesta) return;

    setFormulario({
      ...formulario,
      dias: propuesta.map((dia) => ({
        dia: dia.dia,
        comidas: dia.comidas.map((comida) => ({
          idAlimento: comida.idAlimento,
          alimento: comida.alimento,
          categoria: comida.categoria,
        })),
      })),
    });
  }

  const agregarDia = () =>
    setFormulario({
      ...formulario,
      dias: [...formulario.dias, { dia: `Día ${formulario.dias.length + 1}`, comidas: [] }],
    });

  const cambiarEtiquetaDeDia = (indiceDia, etiqueta) => {
    const dias = [...formulario.dias];
    dias[indiceDia] = { ...dias[indiceDia], dia: etiqueta };
    setFormulario({ ...formulario, dias });
  };

  const quitarDia = (indice) =>
    setFormulario({ ...formulario, dias: formulario.dias.filter((_, i) => i !== indice) });

  const agregarComida = (indiceDia, idAlimento) => {
    const elegido = catalogo?.find((a) => String(a.id) === String(idAlimento));
    if (!elegido) return;

    const dias = formulario.dias.map((dia, i) =>
      i === indiceDia
        ? {
            ...dia,
            comidas: [
              ...dia.comidas,
              { idAlimento: elegido.id, alimento: elegido.nombre, categoria: elegido.categoria },
            ],
          }
        : dia,
    );

    setFormulario({ ...formulario, dias });
  };

  const quitarComida = (indiceDia, indiceComida) => {
    const dias = formulario.dias.map((dia, i) =>
      i === indiceDia
        ? { ...dia, comidas: dia.comidas.filter((_, j) => j !== indiceComida) }
        : dia,
    );

    setFormulario({ ...formulario, dias });
  };

  async function confirmar() {
    const datos = {
      idSocio: socio.id,
      nombre: formulario.nombre || `Dieta de ${socio.nombreCompleto}`,
      idObjetivo: formulario.idObjetivo ? Number(formulario.idObjetivo) : null,
      dias: formulario.dias.map((dia) => ({
        dia: dia.dia,
        comidas: dia.comidas.map((comida) => ({
          categoria: comida.categoria,
          alimento: comida.alimento,
          idAlimento: comida.idAlimento,
        })),
      })),
    };

    if (await asignar.ejecutar(datos)) alGuardar();
  }

  const hayComidas = formulario.dias.some((dia) => dia.comidas.length > 0);
  const historialAnterior = (historial ?? []).filter((d) => !d.activa);

  return (
    <Dialogo
      abierto
      titulo={`Dieta de ${socio.nombreCompleto}`}
      descripcion="Lo que asignes acá reemplaza la dieta vigente del socio; la anterior queda en su historial."
      ancho
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cerrar
          </Boton>

          <Boton
            variante="principal"
            enCurso={asignar.enCurso}
            disabled={!hayComidas}
            onClick={confirmar}
          >
            Asignar esta dieta
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={asignar.error} />

        {cargandoVigente ? (
          <Cargando texto="Buscando la dieta vigente" />
        ) : vigente ? (
          <div className="pila-corta">
            <div className="fila-separada">
              <strong>Dieta vigente: {vigente.nombre}</strong>
              <Insignia tono="ok">Desde el {fecha(vigente.fechaInicio)}</Insignia>
            </div>
            <DiasDeDieta dias={vigente.dias} />
          </div>
        ) : (
          <Aviso tono="info">Todavía no tiene una dieta asignada.</Aviso>
        )}

        {historialAnterior.length > 0 && (
          <div>
            <Boton variante="fantasma" onClick={() => setMostrarHistorial(!mostrarHistorial)}>
              {mostrarHistorial ? "Ocultar historial" : `Ver historial (${historialAnterior.length})`}
            </Boton>

            {mostrarHistorial && (
              <ul className="pila-corta" style={{ marginTop: "var(--e-corto)" }}>
                {historialAnterior.map((d) => (
                  <li key={d.id} className="texto-tenue">
                    {d.nombre} — {fecha(d.fechaInicio)}
                    {d.fechaFin ? ` a ${fecha(d.fechaFin)}` : ""}
                    {d.nutricionista ? ` · ${d.nutricionista}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <strong>Asignar una dieta nueva</strong>

        <div className="rejilla-formulario">
          <Campo
            etiqueta="Nombre de la dieta"
            value={formulario.nombre}
            onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })}
            placeholder={`Dieta de ${socio.nombreCompleto}`}
          />

          <Seleccion
            etiqueta="Objetivo"
            value={formulario.idObjetivo}
            onChange={(evento) => setFormulario({ ...formulario, idObjetivo: evento.target.value })}
            vacio="Sin objetivo puntual"
            opciones={(listaDeObjetivos ?? []).map((o) => ({ valor: o.id, texto: o.nombre }))}
          />
        </div>

        <AvisoDeError error={generar.error} />

        <div className="fila-separada">
          <span className="texto-tenue">
            O partí de una propuesta automática con el catálogo de alimentos:
          </span>

          <div className="fila">
            <Campo
              etiqueta="Días"
              type="number"
              min={1}
              max={30}
              value={diasAGenerar}
              onChange={(evento) => setDiasAGenerar(evento.target.value)}
              style={{ width: 90 }}
            />

            <Boton icono={Wand2} enCurso={generar.enCurso} onClick={generarPropuesta}>
              Generar propuesta
            </Boton>
          </div>
        </div>

        <div className="pila-corta">
          {formulario.dias.map((dia, indiceDia) => (
            <div className="editor-dia" key={indiceDia}>
              <div className="fila-separada" style={{ marginBottom: "var(--e-corto)" }}>
                <input
                  className="campo__control"
                  style={{ maxWidth: 160, fontWeight: 600 }}
                  value={dia.dia}
                  aria-label={`Etiqueta del día ${indiceDia + 1}`}
                  onChange={(evento) => cambiarEtiquetaDeDia(indiceDia, evento.target.value)}
                />

                <Boton
                  variante="fantasma"
                  soloIcono
                  aria-label={`Quitar ${dia.dia}`}
                  onClick={() => quitarDia(indiceDia)}
                >
                  <Trash2 size={14} />
                </Boton>
              </div>

              {dia.comidas.map((comida, indiceComida) => (
                <div className="editor-dia__fila" key={indiceComida}>
                  <span className="dieta__categoria">{comida.categoria}</span>
                  <span className="editor-dia__nombre">{comida.alimento}</span>

                  <Boton
                    variante="fantasma"
                    soloIcono
                    aria-label={`Quitar ${comida.alimento}`}
                    onClick={() => quitarComida(indiceDia, indiceComida)}
                  >
                    <X size={14} />
                  </Boton>
                </div>
              ))}

              <select
                className="campo__control"
                style={{ marginTop: "var(--e-corto)" }}
                value=""
                aria-label={`Agregar un alimento a ${dia.dia}`}
                onChange={(evento) => {
                  agregarComida(indiceDia, evento.target.value);
                  evento.target.value = "";
                }}
              >
                <option value="">Agregar un alimento</option>

                {(catalogo ?? []).map((alimento) => (
                  <option key={alimento.id} value={alimento.id}>
                    {alimento.nombre} — {alimento.categoria}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <Boton icono={Plus} onClick={agregarDia}>
          Agregar un día
        </Boton>
      </div>
    </Dialogo>
  );
}
