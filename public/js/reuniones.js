const reuniones = [
  {
    id: 'planificacion',
    titulo: 'Planificación de la iteración (Sprint Planning)',
    fecha: '11 Oct',
    duracion: '2-4 h',
    fases: '2 fases (Qué y Cómo)',
    estado: 'en-curso',
    conectados: '5/7 conectados'
  },
  {
    id: 'daily',
    titulo: 'Reunión diaria Iteración 3 - Día 4',
    fecha: '12 Oct',
    duracion: '9:00 - 9:15',
    fases: '15 min (timebox)',
    estado: 'programada',
    conectados: null
  }
];

const ROL_ACTUAL = 'facilitador';

document.querySelector('.btn-editar').addEventListener('click', () => {
  alert('Función "Editar reunión" en desarrollo.')
})

//agenda una nueva reunión
document.querySelector('.btn-agendar').addEventListener('click', () => {
  alert('Función "Agendar nueva reunión" en desarrollo.');
});