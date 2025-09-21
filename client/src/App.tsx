import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useGame } from "./lib/stores/useGame";
import { useMultiplayer } from "./lib/stores/useMultiplayer";
import { useAudio } from "./lib/stores/useAudio";
import { controlsMap } from "./lib/controls";
import GameCanvas from "./components/game/GameCanvas";
import GameHUD from "./components/ui/GameHUD";
import GameMenu from "./components/ui/GameMenu";
import CharacterSelect from "./components/ui/CharacterSelect";
import "@fontsource/inter";

function App() {
  const { phase } = useGame();
  const { isConnected, connect } = useMultiplayer();
  const [showCanvas, setShowCanvas] = useState(false);

  useEffect(() => {
    setShowCanvas(true);
    // Connect to game server
    connect();
  }, [connect]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {showCanvas && (
        <KeyboardControls map={controlsMap}>
          {phase === 'ready' && <GameMenu />}
          {phase === 'playing' && (
            <>
              <Canvas
                shadows
                camera={{
                  position: [0, 1.8, 0],
                  fov: 75,
                  near: 0.1,
                  far: 1000
                }}
                gl={{
                  antialias: true,
                  powerPreference: "high-performance"
                }}
                style={{ cursor: 'none' }}
              >
                <color attach="background" args={["#87CEEB"]} />
                <Suspense fallback={null}>
                  <GameCanvas />
                </Suspense>
              </Canvas>
              <GameHUD />
            </>
          )}
          {phase === 'ended' && <CharacterSelect />}
        </KeyboardControls>
      )}
    </div>
  );
}

export default App;
