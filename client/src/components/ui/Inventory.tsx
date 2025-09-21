import { useInventory } from '@/lib/stores/useInventory';
import { useWeapons } from '@/lib/stores/useWeapons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface InventoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Inventory({ isOpen, onClose }: InventoryProps) {
  const { weapons, equippedWeapon, equipWeapon, getOwnedWeapons } = useInventory();
  const { switchWeapon } = useWeapons();

  const handleEquipWeapon = (weaponId: string) => {
    equipWeapon(weaponId);
    switchWeapon(weaponId as any); // Update the weapons store
  };

  const ownedWeapons = getOwnedWeapons();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 pointer-events-auto">
      <div className="bg-gray-900 border-2 border-purple-500 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Inventory</h2>
          <Button 
            variant="destructive"
            onClick={onClose}
          >
            Close
          </Button>
        </div>

        {ownedWeapons.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No weapons owned yet</p>
            <p className="text-gray-500 text-sm mt-2">Visit the weapon shop to purchase new weapons</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ownedWeapons.map((weapon) => (
              <Card 
                key={weapon.id} 
                className={`bg-gray-800 border-gray-600 ${
                  weapon.equipped ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                <CardContent className="flex justify-between items-center p-4">
                  <div>
                    <h3 className="text-white font-bold flex items-center gap-2">
                      {weapon.name}
                      {weapon.equipped && <Badge variant="default">Equipped</Badge>}
                    </h3>
                    <p className="text-gray-400 text-sm capitalize">{weapon.type}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {weapon.equipped ? (
                      <Badge variant="secondary">Current</Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleEquipWeapon(weapon.id)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Equip
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-800 rounded border border-gray-600">
          <h3 className="text-white font-bold mb-2">Controls:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Switch weapons: <span className="text-yellow-400">1, 2, 3 keys</span></li>
            <li>• Reload: <span className="text-yellow-400">R key</span></li>
            <li>• Open inventory: <span className="text-yellow-400">I key</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}