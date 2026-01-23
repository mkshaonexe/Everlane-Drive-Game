import { Scene } from './Scene'
import { HUD } from './ui/HUD'
import { MenuOverlay } from './ui/MenuOverlay'
import { VehicleSelect } from './ui/VehicleSelect'

function App() {
  return (
    <>
      <Scene />
      <div className="absolute top-0 left-0 p-4 text-white font-bold select-none pointer-events-none drop-shadow-md z-10 opacity-50">
        Slow Roads Recreation
      </div>

      {/* UI Layer */}
      <HUD />
      <VehicleSelect />
      <MenuOverlay />
    </>
  )
}

export default App
