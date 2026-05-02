const TYPING_DELAY_WPM = 60;

function injectButton() {
  if (document.getElementById('ofm-cheat-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'ofm-cheat-btn';
  btn.innerText = 'Start Cheat (60 WPM)';
  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    padding: 12px 24px;
    background-color: #006E42;
    color: white;
    border: none;
    border-radius: 24px;
    cursor: pointer;
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    transition: transform 0.2s, background-color 0.2s;
  `;

  btn.onmouseover = () => btn.style.backgroundColor = '#013822';
  btn.onmouseout = () => btn.style.backgroundColor = '#006E42';
  btn.onmousedown = () => btn.style.transform = 'scale(0.95)';
  btn.onmouseup = () => btn.style.transform = 'scale(1)';

  btn.onclick = async () => {
    btn.disabled = true;
    btn.innerText = 'Cheating...';
    try {
      await startCheating();
    } catch (e) {
      console.error(e);
      alert('Error during typing: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.innerText = 'Start Cheat (60 WPM)';
    }
  };

  document.body.appendChild(btn);
}

async function startCheating() {
  const input = document.querySelector('input[name="word"]');
  if (!input) {
    throw new Error('Input field not found. Make sure you are on the test page.');
  }

  // Focus the input to start the test if it hasn't started
  input.focus();

  // Get WPM from storage or default
  const settings = await chrome.storage.local.get(['wpm']);
  const wpm = settings.wpm || TYPING_DELAY_WPM;

  while (true) {
    const words = getVisibleWords();
    if (words.length === 0) break;

    for (const word of words) {
      await typeWord(input, word, wpm);
    }
    
    // Small delay before checking for more words (if the test is multi-page/infinite)
    await new Promise(r => setTimeout(r, 500));
    
    // Check if test is over (timer or input disappeared)
    if (!document.querySelector('input[name="word"]')) break;
  }
}

function getVisibleWords() {
  const container = document.querySelector('.css-124vo9o');
  if (!container) return [];

  return Array.from(container.children)
    .filter(el => el.tagName === 'SPAN')
    .map(span => span.innerText.replace('→', '').trim())
    .filter(text => text.length > 0);
}

async function typeWord(input, word, wpm) {
  // Average word is 5 chars.
  // Delay = 60,000 / (WPM * 5) ms per character
  const charDelay = 60000 / (wpm * 5);

  for (const char of word) {
    // Simulate real keyboard events
    simulateKeyEvent(input, 'keydown', char);
    simulateKeyEvent(input, 'keypress', char);
    
    input.value += char;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    simulateKeyEvent(input, 'keyup', char);

    // Human-like jitter
    const jitter = (Math.random() - 0.5) * (charDelay * 0.3);
    await new Promise(resolve => setTimeout(resolve, charDelay + jitter));
  }

  // Type space to submit word
  simulateKeyEvent(input, 'keydown', ' ');
  simulateKeyEvent(input, 'keypress', ' ');
  input.value += ' ';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  simulateKeyEvent(input, 'keyup', ' ');
  
  // Wait a bit after space
  await new Promise(resolve => setTimeout(resolve, charDelay));
  
  // The site likely clears the input after space
  // We don't want to double space if it auto-clears
  if (input.value.endsWith(' ')) {
     // Optional: check if we need to clear it manually
  }
}

function simulateKeyEvent(element, type, key) {
  const event = new KeyboardEvent(type, {
    key: key,
    code: key === ' ' ? 'Space' : `Key${key.toUpperCase()}`,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
}

// Run injection
injectButton();

// Re-inject if navigation happens (for SPA)
const observer = new MutationObserver(injectButton);
observer.observe(document.body, { childList: true, subtree: true });
