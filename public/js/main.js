document.addEventListener('DOMContentLoaded', () => {
  // Flash message dismissal
  const flashAlerts = document.querySelectorAll('.flash-alert');
  flashAlerts.forEach((alert) => {
    const closeBtn = alert.querySelector('.flash-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 200);
      });
    }

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      if (document.body.contains(alert)) {
        alert.style.transition = 'opacity 0.5s ease';
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 500);
      }
    }, 6000);
  });

  // Action confirmation prompts
  const confirmForms = document.querySelectorAll('[data-confirm]');
  confirmForms.forEach((element) => {
    element.addEventListener('submit', (e) => {
      const message = element.getAttribute('data-confirm') || 'Are you sure you want to perform this action?';
      if (!confirm(message)) {
        e.preventDefault();
      }
    });
  });

  // Interactive star picker rating
  const starPicker = document.querySelector('.star-rating-picker');
  if (starPicker) {
    const inputs = starPicker.querySelectorAll('input[type="radio"]');
    const ratingDisplay = document.getElementById('selectedRatingText');
    const labels = {
      1: '1 Star - Poor',
      2: '2 Stars - Fair',
      3: '3 Stars - Good',
      4: '4 Stars - Very Good',
      5: '5 Stars - Excellent'
    };

    inputs.forEach((input) => {
      input.addEventListener('change', () => {
        if (ratingDisplay) {
          ratingDisplay.textContent = labels[input.value] || `${input.value} Stars`;
        }
      });
    });
  }
});
