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

    for (const modulo of modulos) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "modulo-btn";

      const nombre = document.createElement("span");
      nombre.textContent = `Módulo ${modulo.numero_modulo}: ${modulo.nombre}`;

      const flecha = document.createElement("span");
      flecha.className = "flecha";
      flecha.textContent = "▶";

      boton.append(nombre, flecha);

      boton.addEventListener("click", () => {
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

        // Cargar secciones para cualquier módulo disponible
        cargarSeccionesCapacitacion(modulo, contenido);
      });

      lista.append(boton);
    }
  } catch (error) {
    console.error("Error cargando módulos:", error);
    lista.textContent = "No se pudieron cargar los módulos.";
  }
}