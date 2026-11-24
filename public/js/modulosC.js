//Aquí irá la lógica de los modulos recuperados (frontend)
// modulosC.js
document.addEventListener("DOMContentLoaded", cargarModulosCapacitacion);

async function cargarModulosCapacitacion() {
  const lista = document.getElementById("contenedor-modulos");
  const contenido = document.getElementById("contenido-modulo");

  if (!lista || !contenido) return;

  lista.textContent = "Cargando módulos…";
  contenido.textContent = "Selecciona un módulo.";

  try {
    const respuesta = await fetch("/modulos");

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    const modulos = await respuesta.json();

    if (!Array.isArray(modulos)) {
      throw new Error("La respuesta de módulos no es válida.");
    }

    lista.replaceChildren();

    if (modulos.length === 0) {
      lista.textContent = "No hay módulos disponibles.";
      return;
    }
    const avances = await calcularProgresoModulos(modulos);

    function mostrarAvance(elemento, avance) {
      elemento.textContent = avance.porcentaje === null
        ? avance.estado
        : `${avance.estado} · ${avance.porcentaje} %`;

      elemento.title = `${avance.terminadas} de ${avance.total} secciones terminadas`;
    }

    for (const modulo of modulos) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "modulo-btn";
      boton.dataset.moduloId = modulo.id;

      const nombre = document.createElement("span");
      nombre.textContent = `Módulo ${modulo.numero_modulo}: ${modulo.nombre}`;

      const flecha = document.createElement("span");
      flecha.className = "flecha";
      flecha.textContent = "▶";

      const detalle = document.createElement("div");
      detalle.className = "modulo-detalle";

      const resumen = document.createElement("small");
      resumen.className = "modulo-progreso";

      const avance = avances.find(
        elemento => elemento.id === Number(modulo.id)
      );

      mostrarAvance(resumen, avance);

      detalle.append(nombre, resumen);
      boton.append(detalle, flecha);

      boton.addEventListener("click", async () => {
        lista.querySelectorAll(".modulo-btn").forEach((elemento) => {
          elemento.classList.remove("activo");
        });

        boton.classList.add("activo");

        const titulo = document.createElement("h2");
        titulo.textContent = `Módulo ${modulo.numero_modulo}: ${modulo.nombre}`;

        const objetivo = document.createElement("p");
        objetivo.className = "modulo-objetivo";

        const etiqueta = document.createElement("strong");
        etiqueta.textContent = "Objetivo: ";

        objetivo.append(etiqueta);
        objetivo.append(document.createTextNode(modulo.objetivo || ""));

        contenido.replaceChildren(titulo, objetivo);

        await cargarSeccionesCapacitacion(modulo, contenido);

        // Actualizar los porcentajes, también después de terminar una sección.
        try {
          const avancesActualizados = await calcularProgresoModulos(modulos);

          lista.querySelectorAll(".modulo-btn").forEach(elemento => {
            const avance = avancesActualizados.find(
              dato => dato.id === Number(elemento.dataset.moduloId)
            );

            if (avance) {
              mostrarAvance(
                elemento.querySelector(".modulo-progreso"),
                avance
              );
            }
          });
        } catch (error) {
          console.error("No se pudieron actualizar los porcentajes:", error);
        }
      });

      lista.append(boton);
    }
  } catch (error) {
    console.error("Error cargando módulos:", error);
    lista.textContent = "No se pudieron cargar los módulos.";
  }
}