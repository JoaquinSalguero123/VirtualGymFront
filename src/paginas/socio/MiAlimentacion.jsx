import { useState } from "react";
import { Apple, Download, Wand2 } from "lucide-react";

import { categoriasDeAlimentos, dietas, objetivos } from "../../api/endpoints.js";
import { useSesion } from "../../contexto/SesionContexto.jsx";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { fecha, numero } from "../../dominio/formato.js";
import { descargarDietaEnPdf } from "../../dominio/pdf.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Campo, Casilla, Seleccion } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Dialogo } from "../../componentes/ui/Dialogo.jsx";
import { Aviso, AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Insignia } from "../../componentes/ui/Insignia.jsx";
import { Cargando, EstadoVacio } from "../../componentes/ui/Estados.jsx";

/** Caso de uso "Generar y guardar una dieta" desde la cuenta del socio. */
export default function MiAlimentacion() {
  const { usuario } = useSesion();

  const { datos: dieta, cargando, recargar } = usePeticion(() => dietas.mia(), []);
  const [propuesta, setPropuesta] = useState(null);
  const [generadorAbierto, setGeneradorAbierto] = useState(false);

  const nombreDelSocio = `${usuario?.nombre ?? ""} ${usuario?.apellido ?? ""}`.trim();

  return (
    <>
      <EncabezadoDePagina
        titulo="Mi alimentación"
        descripcion="Tu plan de comidas, día por día."
        acciones={
          <>
            {dieta && (
              <Boton icono={Download} onClick={() => descargarDietaEnPdf(dieta, nombreDelSocio)}>
                Descargar en PDF
              </Boton>
            )}

            <Boton variante="principal" icono={Wand2} onClick={() => setGeneradorAbierto(true)}>
              {dieta ? "Generar otro plan" : "Armar mi plan"}
            </Boton>
          </>
        }
      />

      {cargando ? (
        <Cargando />
      ) : propuesta ? (
        <PropuestaDeDieta
          propuesta={propuesta}
          alDescartar={() => setPropuesta(null)}
          alGuardar={() => {
            setPropuesta(null);
            recargar();
          }}
        />
      ) : dieta ? (
        <div className="pila">
          <div className="fila-separada">
            <div>
              <h2>{dieta.nombre}</h2>
              <p className="texto-tenue">
                Desde el {fecha(dieta.fechaInicio)}
                {dieta.objetivo ? ` · ${dieta.objetivo}` : ""}
                {dieta.nutricionista ? ` · lo armó ${dieta.nutricionista}` : " · lo armaste vos"}
              </p>
            </div>

            {dieta.activa && <Insignia tono="ok">Vigente</Insignia>}
          </div>

          <DiasDeDieta dias={dieta.dias} />
        </div>
      ) : (
        <Panel>
          <EstadoVacio icono={Apple} titulo="Todavía no tenés un plan de comidas.">
            <p>
              Generá uno según tu objetivo, o pedile al nutricionista de tu sucursal que te
              arme uno a medida.
            </p>

            <Boton variante="principal" icono={Wand2} onClick={() => setGeneradorAbierto(true)}>
              Armar mi plan
            </Boton>
          </EstadoVacio>
        </Panel>
      )}

      <GeneradorDeDieta
        abierto={generadorAbierto}
        alCerrar={() => setGeneradorAbierto(false)}
        alGenerar={(dias) => {
          setPropuesta(dias);
          setGeneradorAbierto(false);
        }}
      />
    </>
  );
}

/** Los días del plan en columnas, con las calorías del día al pie. */
export function DiasDeDieta({ dias }) {
  return (
    <div className="dieta">
      {dias.map((dia) => {
        const calorias = dia.comidas.reduce((total, comida) => total + (comida.calorias ?? 0), 0);

        return (
          <section className="dieta__dia" key={dia.dia}>
            <header className="rutina__cabecera">
              <span className="rutina__titulo">{dia.dia}</span>

              {calorias > 0 && (
                <span className="texto-tenue cifra">{numero(calorias)} kcal</span>
              )}
            </header>

            {dia.comidas.map((comida, indice) => (
              <div className="dieta__comida" key={`${comida.categoria}-${indice}`}>
                <span className="dieta__categoria">{comida.categoria}</span>
                <span className="dieta__alimento" style={{ display: "block" }}>
                  {comida.alimento}
                </span>

                {comida.calorias != null && (
                  <span className="dieta__macros">
                    {numero(comida.calorias)} kcal · P {numero(comida.proteinas ?? 0)} g · C{" "}
                    {numero(comida.carbohidratos ?? 0)} g · G {numero(comida.grasas ?? 0)} g
                  </span>
                )}
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

/** Propuesta de dieta, todavía sin guardar. */
function PropuestaDeDieta({ propuesta, alDescartar, alGuardar }) {
  const [nombre, setNombre] = useState("Mi plan de comidas");
  const guardar = useAccion((datos) => dietas.guardarMia(datos));

  async function confirmar() {
    const datos = {
      nombre,
      dias: propuesta.map((dia) => ({
        dia: dia.dia,
        comidas: dia.comidas.map((comida) => ({
          categoria: comida.categoria,
          alimento: comida.alimento,
          idAlimento: comida.idAlimento,
        })),
      })),
    };

    if (await guardar.ejecutar(datos)) alGuardar();
  }

  return (
    <div className="pila">
      <Aviso tono="atencion" titulo="Este plan todavía no está guardado.">
        Revisalo y confirmalo. Si ya tenías uno, el anterior queda archivado.
      </Aviso>

      <AvisoDeError error={guardar.error} />

      <Panel ajustado>
        <div className="fila-separada">
          <Campo
            etiqueta="Nombre del plan"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
          />

          <div className="fila">
            <Boton variante="fantasma" onClick={alDescartar}>
              Descartar
            </Boton>

            <Boton variante="principal" enCurso={guardar.enCurso} onClick={confirmar}>
              Guardar este plan
            </Boton>
          </div>
        </div>
      </Panel>

      <DiasDeDieta dias={propuesta} />
    </div>
  );
}

/** Diálogo que pide objetivo, cantidad de días y categorías a incluir. */
function GeneradorDeDieta({ abierto, alCerrar, alGenerar }) {
  const { datos: listaDeObjetivos } = usePeticion(() => objetivos.listar(), []);
  const { datos: categorias } = usePeticion(() => categoriasDeAlimentos.listar(), []);

  const [idObjetivo, setIdObjetivo] = useState("");
  const [dias, setDias] = useState(7);
  const [elegidas, setElegidas] = useState([]);

  const generar = useAccion((datos) => dietas.generar(datos));

  const alternar = (id) =>
    setElegidas((anteriores) =>
      anteriores.includes(id) ? anteriores.filter((x) => x !== id) : [...anteriores, id],
    );

  async function ejecutar() {
    const resultado = await generar.ejecutar({
      idObjetivo: idObjetivo ? Number(idObjetivo) : null,
      dias: Number(dias),
      idsDeCategorias: elegidas,
    });

    if (resultado) alGenerar(resultado);
  }

  return (
    <Dialogo
      abierto={abierto}
      titulo="Armar un plan de comidas"
      descripcion="El sistema elige alimentos del catálogo del gimnasio según tu objetivo."
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>

          <Boton variante="principal" enCurso={generar.enCurso} onClick={ejecutar}>
            Generar la propuesta
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={generar.error} />

        <Seleccion
          etiqueta="Mi objetivo"
          value={idObjetivo}
          onChange={(evento) => setIdObjetivo(evento.target.value)}
          vacio="Todos los alimentos"
          ayuda="Filtra los alimentos que el nutricionista asoció a ese objetivo."
          opciones={(listaDeObjetivos ?? []).map((objetivo) => ({
            valor: objetivo.id,
            texto: objetivo.nombre,
          }))}
        />

        <Seleccion
          etiqueta="Cantidad de días"
          value={dias}
          onChange={(evento) => setDias(evento.target.value)}
          opciones={[
            { valor: 7, texto: "7 días (una semana)" },
            { valor: 14, texto: "14 días (dos semanas)" },
            { valor: 30, texto: "30 días (un mes)" },
          ]}
        />

        <div className="campo">
          <span className="campo__etiqueta">Comidas a incluir</span>
          <span className="campo__ayuda">Si no elegís ninguna, se incluyen todas.</span>

          <div className="pila-corta" style={{ marginTop: "var(--e-corto)" }}>
            {(categorias ?? []).map((categoria) => (
              <Casilla
                key={categoria.id}
                etiqueta={categoria.nombre}
                checked={elegidas.includes(categoria.id)}
                onChange={() => alternar(categoria.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </Dialogo>
  );
}
