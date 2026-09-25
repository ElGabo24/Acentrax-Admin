import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AdminApp } from './AdminApp'
import { setupInterceptors } from './api/setupInterceptors'

setupInterceptors()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>
)
