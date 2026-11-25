import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LedgerDemo } from './LedgerDemo.tsx'
import './demo.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LedgerDemo />
  </StrictMode>,
)
