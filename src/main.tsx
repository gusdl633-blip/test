console.log('KEY:', import.meta.env.VITE_GEMINI_API_KEY);
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Debug: confirm Vite env is available in browser (remove in production)
console.log('KEY:', import.meta.env.VITE_GEMINI_API_KEY);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
