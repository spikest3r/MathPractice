import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { StateProvider } from './StateContext.jsx'
import './i18n'; // make sure this is imported

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StateProvider>
      <App />
      </StateProvider>
  </StrictMode>,
)
