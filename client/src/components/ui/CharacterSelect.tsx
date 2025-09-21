import { useState } from 'react';
import { useGame } from '@/lib/stores/useGame';
import { usePlayer } from '@/lib/stores/usePlayer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CHARACTER_SKINS = [
  { id: 'blue', name: 'Blue Warrior', color: '#4444ff', description: 'Swift and agile fighter' },
  { id: 'red', name: 'Red Commander', color: '#ff4444', description: 'Battle-hardened veteran' },
  { id: 'green', name: 'Green Ranger', color: '#44ff44', description: 'Stealth specialist' },
  { id: 'purple', name: 'Purple Elite', color: '#ff44ff', description: 'Elite operative' }
];

export default function CharacterSelect() {
  const { restart } = useGame();
  const { setSkin } = usePlayer();
  const [selectedSkin, setSelectedSkin] = useState('blue');

  const handleConfirm = () => {
    setSkin(selectedSkin);
    restart();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-purple-900 to-black flex items-center justify-center z-50">
      <div className="max-w-2xl w-full mx-4">
        <Card className="bg-black bg-opacity-80 border-purple-500">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white mb-2">
              Choose Your Character
            </CardTitle>
            <p className="text-purple-300">Select your battle skin</p>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {CHARACTER_SKINS.map((skin) => (
                <div
                  key={skin.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedSkin === skin.id 
                      ? 'border-purple-400 bg-purple-900 bg-opacity-50' 
                      : 'border-gray-600 bg-gray-800 bg-opacity-50 hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedSkin(skin.id)}
                >
                  {/* Character Preview */}
                  <div className="flex justify-center mb-3">
                    <div 
                      className="w-16 h-20 rounded"
                      style={{ backgroundColor: skin.color }}
                    />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-white font-bold mb-1">{skin.name}</h3>
                    <p className="text-gray-300 text-sm">{skin.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Character Info */}
            <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg mb-6">
              <h3 className="text-white font-bold mb-2">Selected Character</h3>
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-16 rounded"
                  style={{ backgroundColor: CHARACTER_SKINS.find(s => s.id === selectedSkin)?.color }}
                />
                <div>
                  <p className="text-white font-bold">
                    {CHARACTER_SKINS.find(s => s.id === selectedSkin)?.name}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {CHARACTER_SKINS.find(s => s.id === selectedSkin)?.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button 
                onClick={handleConfirm}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3"
              >
                CONFIRM SELECTION
              </Button>
              <Button 
                onClick={() => restart()}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                BACK TO MENU
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
