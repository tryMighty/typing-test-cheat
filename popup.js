document.addEventListener('DOMContentLoaded', () => {
  const wpmInput = document.getElementById('wpm');
  const saveBtn = document.getElementById('save');
  const status = document.getElementById('status');

  // Load saved WPM
  chrome.storage.local.get(['wpm'], (result) => {
    if (result.wpm) {
      wpmInput.value = result.wpm;
    }
  });

  // Save WPM
  saveBtn.addEventListener('click', () => {
    const wpm = parseInt(wpmInput.value, 10);
    if (isNaN(wpm) || wpm < 1) {
      alert('Please enter a valid number');
      return;
    }

    chrome.storage.local.set({ wpm }, () => {
      status.textContent = 'Settings saved!';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    });
  });
});
