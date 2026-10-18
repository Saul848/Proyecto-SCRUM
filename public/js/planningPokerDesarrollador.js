/**
 * Snippet JavaScript para alternar la selección:
 * Para que la clase .selected se active al hacer clic en un botón 
 * y desmarque los demás.
 */
document.querySelectorAll('.card-choice').forEach(button => {
    button.addEventListener('click', () => {
        // Remover la clase 'selected' de todas las cartas
        document.querySelectorAll('.card-choice').forEach(btn => btn.classList.remove('selected'));
        // Agregar la clase 'selected' a la carta cliqueada
        button.classList.add('selected');
    });
});