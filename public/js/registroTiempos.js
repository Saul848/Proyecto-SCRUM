let cronometroActivo = false;
let idRegistroActual = null;

const btnRegistro = document.getElementById('btn-registro-tiempos');
const cuerpoTabla = document.getElementById('cuerpo-tabla-tiempos');

function formatearHora(fechaISO) {
    return new Date(fechaISO).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatearFecha(fechaISO) {
    return new Date(fechaISO).toLocaleDateString('es-MX');
}

function formatearIntervalo(intervalo) {
    // PostgreSQL devuelve el INTERVAL como objeto {hours, minutes, seconds} vía pg,
    // o como string "HH:MM:SS" dependiendo del driver/configuración. Cubrimos ambos:
    if (typeof intervalo === 'string') return intervalo;
    const h = String(intervalo.hours || 0).padStart(2, '0');
    const m = String(intervalo.minutes || 0).padStart(2, '0');
    const s = String(Math.floor(intervalo.seconds || 0)).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

async function crearRegistroTiempo(actividad, idUsuario) {
    const respuesta = await fetch('/registro-tiempos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actividad, idUsuario })
    });
    const resultado = await respuesta.json();

    if (!respuesta.ok || !resultado.ok) {
        throw new Error(resultado.mensaje || 'Error al crear el registro');
    }
    return resultado.data;
}

async function finalizarRegistroTiempo(idRegistro, hecho, pendiente) {
    const respuesta = await fetch(`/registro-tiempos/${idRegistro}/finalizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hecho, pendiente })
    });
    const resultado = await respuesta.json();

    if (!respuesta.ok || !resultado.ok) {
        throw new Error(resultado.mensaje || 'Error al finalizar el registro');
    }
    return resultado.data;
}

function agregarFilaATabla(registro) {
    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td>${formatearFecha(registro.hora_inicio)}</td>
        <td>${registro.actividad}</td>
        <td>${formatearHora(registro.hora_inicio)}</td>
        <td>${formatearHora(registro.hora_final)}</td>
        <td>${formatearIntervalo(registro.tiempo_total)}</td>
        <td>${registro.hecho || ''}</td>
        <td>${registro.pendiente || ''}</td>
    `;
    cuerpoTabla.appendChild(fila);
}

async function listarRegistros(idUsuario) {
    try {
        const respuesta = await fetch(`/registro-tiempos/usuario/${idUsuario}`, {
            method: 'GET',
            headers: { "Accept": "application/json" }
        });
        const resultado = await respuesta.json();
        const registros = resultado.data || [];

        const tarjetasR = registros.map(registro => `
            <tr>
                <td>${formatearFecha(registro.hora_inicio)}</td>
                <td>${registro.actividad}</td>
                <td>${formatearHora(registro.hora_inicio)}</td>
                <td>${formatearHora(registro.hora_final)}</td>
                <td>${formatearIntervalo(registro.tiempo_total)}</td>
                <td>${registro.hecho || ''}</td>
                <td>${registro.pendiente || ''}</td>
            </tr>
        `).join("");

        cuerpoTabla.innerHTML = tarjetasR;
        console.log("filas insertadas");
    } catch (error) {
        console.error("Error al listar los registros:", error);
    }
}

btnRegistro.addEventListener('click', async () => {
    const usuarioActivo = JSON.parse(sessionStorage.getItem('usuarioActivo'));

    if (!usuarioActivo) {
        console.error("No hay usuario activo en sessionStorage.");
        return;
    }

    if (!cronometroActivo) {
        // --- Iniciar registro ---
        const actividad = prompt("¿Qué actividad vas a realizar?");
        if (!actividad) return;

        try {
            const registro = await crearRegistroTiempo(actividad, usuarioActivo.id);
            idRegistroActual = registro.id_registro;

            cronometroActivo = true;
            btnRegistro.textContent = "Detener registro de tiempos";
            btnRegistro.classList.add('activo');
        } catch (error) {
            console.error("Error al iniciar el registro:", error);
            alert("No se pudo iniciar el registro de tiempo.");
        }

    } else {
        // --- Detener registro ---
        const hecho = prompt("¿Qué hiciste?") || "";
        const pendiente = prompt("¿Qué harás después?") || "";

        try {
            const registro = await finalizarRegistroTiempo(idRegistroActual, hecho, pendiente);
            agregarFilaATabla(registro);

            cronometroActivo = false;
            btnRegistro.textContent = "Iniciar registro de tiempos +";
            btnRegistro.classList.remove('activo');
            idRegistroActual = null;
        } catch (error) {
            console.error("Error al finalizar el registro:", error);
            alert("No se pudo finalizar el registro de tiempo.");
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const usuarioActivo = JSON.parse(sessionStorage.getItem('usuarioActivo'));
    console.log(usuarioActivo);

    if (!usuarioActivo) {
        console.error("No hay usuario activo en sessionStorage.");
        return;
    }

    listarRegistros(usuarioActivo.id);
});