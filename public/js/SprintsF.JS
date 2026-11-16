//Modales Agregar y Modificar
const modalAgregarSprint = document.getElementById("modalAgregarSprint");
const modalModificarSprint = document.getElementById("modalModificarSprint");

//Botones de apertura de modales
const btnAgregarSprint = document.getElementById("btnAgregarSprint");
const btnModificarSprint = document.getElementById("btnModSprint");

// Listener para el botón "+ Añadir nueva historia"
btnAgregarSprint.addEventListener("click", function () {
    modalAgregarSprint.classList.add('activo');// Muestra el modal
});

// Listener para el botón "# Modificar historia"
btnModificarSprint.addEventListener("click", function () {
    modalModificarSprint.classList.add('activo');// Muestra el modal
});
