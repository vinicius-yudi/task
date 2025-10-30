import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Login } from './pages/login.tsx'
import { Register } from './pages/Register.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Login />

  </StrictMode>,
)
