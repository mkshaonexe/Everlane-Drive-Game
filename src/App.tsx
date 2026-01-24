import { Scene } from './Scene'
import { HUD } from './ui/HUD'
import { MenuOverlay } from './ui/MenuOverlay'
import { GameErrorBoundary } from './components/GameErrorBoundary'

function App() {
  return (
    <GameErrorBoundary>
      {/* Main container */}
      <div className="fixed inset-0 w-full h-full">
        {/* 3D Scene - Base Layer */}
        <div className="absolute inset-0 w-full h-full">
          <Scene />
        </div>

        {/* UI Overlay Layer - pointer-events-none to allow canvas interaction */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 p-4 text-white font-bold select-none drop-shadow-md z-10 opacity-50">
            Slow Roads Recreation
          </div>

          {/* UI Layer */}
          <HUD />
        </div>

        {/* Menu Overlay - has its own pointer events */}
        <MenuOverlay />
      </div>
    </GameErrorBoundary>
  )
}

export default App
