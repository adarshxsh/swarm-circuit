import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    return await originalFetch(...args);
  } catch (error) {
    // Catch fetch failures which indicate server down
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      window.dispatchEvent(new Event('backend-error'));
    }
    throw error;
  }
};

const originalEventSource = window.EventSource;
window.EventSource = class extends originalEventSource {
  constructor(...args: ConstructorParameters<typeof originalEventSource>) {
    super(...args);
    this.addEventListener('error', () => {
      window.dispatchEvent(new Event('backend-error'));
    });
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
