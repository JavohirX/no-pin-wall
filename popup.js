document.getElementById('cleanBtn').addEventListener('click', async () => {
  const statusMsg = document.getElementById('statusMsg');
  statusMsg.textContent = 'Cleaning page...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'clean_page' }, (response) => {
        if (chrome.runtime.lastError) {
          statusMsg.textContent = 'Refresh the Pinterest tab to activate.';
        } else {
          statusMsg.textContent = 'Done! Modals removed & scroll unlocked.';
          setTimeout(() => {
            statusMsg.textContent = '';
          }, 2500);
        }
      });
    }
  } catch (err) {
    statusMsg.textContent = 'Error connecting to tab.';
  }
});
