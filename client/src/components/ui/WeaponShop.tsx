import { useState } from 'react';
import { useEconomy } from '@/lib/stores/useEconomy';
import { useInventory, SHOP_ITEMS } from '@/lib/stores/useInventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WeaponShopProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WeaponShop({ isOpen, onClose }: WeaponShopProps) {
  const { money, spendMoney } = useEconomy();
  const { purchaseWeapon, isWeaponOwned } = useInventory();
  const [selectedWeapon, setSelectedWeapon] = useState<string | null>(null);
  const [confirmPurchase, setConfirmPurchase] = useState<{weaponId: string, price: number, name: string} | null>(null);

  const handlePurchaseClick = (weaponId: string, price: number, name: string) => {
    // Open confirmation dialog
    setConfirmPurchase({ weaponId, price, name });
  };
  
  const handleConfirmPurchase = () => {
    if (!confirmPurchase) return;
    
    const { weaponId, price } = confirmPurchase;
    // Atomic transaction: check affordability and ownership before proceeding
    if (money >= price && !isWeaponOwned(weaponId)) {
      // Try to purchase first, then spend money only if successful
      if (purchaseWeapon(weaponId)) {
        if (spendMoney(price)) {
          console.log(`Successfully purchased ${weaponId} for $${price}`);
        } else {
          // This should never happen, but rollback if it does
          console.error('Failed to spend money after weapon purchase');
        }
      } else {
        console.error('Failed to purchase weapon');
      }
    }
    setConfirmPurchase(null);
  };
  
  const handleCancelPurchase = () => {
    setConfirmPurchase(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 pointer-events-auto">
      <div className="bg-gray-900 border-2 border-cyan-500 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Weapon Shop</h2>
          <div className="flex items-center gap-4">
            <div className="text-green-400 font-bold text-xl">
              ${money}
            </div>
            <Button 
              variant="destructive"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>

        {selectedWeapon && (
          <div className="mb-4 p-3 bg-cyan-900/30 border border-cyan-500/50 rounded">
            <p className="text-cyan-300 text-sm">
              <strong>Selected:</strong> {SHOP_ITEMS.find(item => item.id === selectedWeapon)?.name}
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SHOP_ITEMS.map((item) => {
            const owned = isWeaponOwned(item.id);
            const canAfford = money >= item.price;

            return (
              <Card 
                key={item.id} 
                className={`cursor-pointer transition-all duration-200 ${
                  selectedWeapon === item.id 
                    ? "bg-cyan-900 border-cyan-400 shadow-lg shadow-cyan-500/20" 
                    : "bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500"
                }`}
                onClick={() => setSelectedWeapon(selectedWeapon === item.id ? null : item.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg flex items-center justify-between">
                    {item.name}
                    <div className="flex gap-2">
                      {selectedWeapon === item.id && <Badge variant="default">Selected</Badge>}
                      {owned && <Badge variant="secondary">Owned</Badge>}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-3">{item.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div className="text-red-400">
                      Damage: {item.damage}
                    </div>
                    <div className="text-blue-400">
                      Fire Rate: {item.fireRate}
                    </div>
                    <div className="text-green-400">
                      Range: {item.range}m
                    </div>
                    <div className="text-yellow-400">
                      Type: {item.weaponType}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-green-400 font-bold text-lg">
                      ${item.price}
                    </span>
                    
                    {owned ? (
                      <Badge variant="default">Owned</Badge>
                    ) : item.price === 0 ? (
                      <Badge variant="secondary">Free</Badge>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!canAfford}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchaseClick(item.id, item.price, item.name);
                        }}
                        className={canAfford ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {canAfford ? "Buy" : "Not enough $"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-gray-800 rounded border border-gray-600">
          <h3 className="text-white font-bold mb-2">How to earn money:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Kill enemy: <span className="text-green-400">$10</span></li>
            <li>• Double kill (2 kills within 3 seconds): <span className="text-green-400">$20</span></li>
          </ul>
        </div>
        
        <div className="mt-4 p-3 bg-cyan-900/20 border border-cyan-500/50 rounded">
          <p className="text-cyan-300 text-sm">
            💡 <strong>Tip:</strong> Visit the shooting ground at coordinates (68, 68) to practice with your weapons!
          </p>
        </div>
      </div>
      
      {/* Purchase Confirmation Dialog */}
      <Dialog open={!!confirmPurchase} onOpenChange={handleCancelPurchase}>
        <DialogContent className="bg-gray-900 border-cyan-500">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Purchase</DialogTitle>
            <DialogDescription className="text-gray-300">
              Are you sure you want to purchase <strong>{confirmPurchase?.name}</strong> for <strong className="text-green-400">${confirmPurchase?.price}</strong>?
              {(money < (confirmPurchase?.price || 0) || isWeaponOwned(confirmPurchase?.weaponId || '')) && (
                <div className="mt-2 text-red-400 text-sm">
                  {money < (confirmPurchase?.price || 0) ? '⚠️ Insufficient funds!' : '⚠️ Already owned!'}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded">
              <span className="text-gray-300">Current Balance:</span>
              <span className="text-green-400 font-bold">${money}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded mt-2">
              <span className="text-gray-300">After Purchase:</span>
              <span className="text-green-400 font-bold">${Math.max(money - (confirmPurchase?.price || 0), 0)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelPurchase}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmPurchase}
              disabled={!confirmPurchase || money < confirmPurchase.price || isWeaponOwned(confirmPurchase.weaponId)}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}