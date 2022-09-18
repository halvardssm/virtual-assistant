import React from 'react'
import ReactDOM from 'react-dom/client'
import {useVirtualAssistant} from './dist/virtual-assistant'
import Clippy from '../agents/Clippy'

export function App() {
  useVirtualAssistant(Clippy)

  return <div>Hello World</div>
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
