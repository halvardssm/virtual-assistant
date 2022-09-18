import React from 'react'
import ReactDOM from 'react-dom/client'
import {useVirtualAssistant} from '../lib'
// import {useVirtualAssistant} from './dist/virtual-assistant'
import Clippy from '../agents/Clippy'

export function App() {
  const va = useVirtualAssistant(Clippy,{debug: true})

  return <div>
    Hello World
    <button onClick={() => va.current?.speak('Hello World')}>Say Hello</button>
    </div>
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
