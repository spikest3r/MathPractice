import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Game from './Game.jsx'
import { StateProvider } from './StateContext.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <h1>Math Practice</h1>
        <Game />
      </div>
    </>
  )
}

export default App
