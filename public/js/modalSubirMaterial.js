document.addEventListener('DOMContentLoaded', () => {
  const btnAbrir = document.getElementById('btn-compartir-material');
  const modalMaterial = document.getElementById('modal-material');
  const btnCancelar = document.getElementById('btn-cancelar-modal');

  // 1. Al hacer clic en el botón, mostramos el modal
  if (btnAbrir && modalMaterial) {
    btnAbrir.addEventListener('click', () => {
      modalMaterial.style.display = 'flex'; // Cambia el display de 'none' a 'flex' para que aparezca
    });
  }

  // 2. Al hacer clic en cancelar, ocultamos el modal
  if (btnCancelar && modalMaterial) {
    btnCancelar.addEventListener('click', () => {
      modalMaterial.style.display = 'none';
    });
  }

  // 3. (Opcional) Si hacen clic fuera de la caja blanca del modal, también se cierra
  if (modalMaterial) {
    modalMaterial.addEventListener('click', (e) => {
      if (e.target === modalMaterial) {
        modalMaterial.style.display = 'none';
      }
    });
  }
});