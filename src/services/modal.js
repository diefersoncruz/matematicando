const openModal = (modalId) => {
  const modal = document.getElementById(modalId);

  if (!modal) return;

  modal.style.display = "block";
  document.body.style.overflow = "hidden";
};

const closeModal = (modalId) => {
  const modal = document.getElementById(modalId);

  if (!modal) return;

  modal.style.display = "none";
  document.body.style.overflow = "auto";
};
