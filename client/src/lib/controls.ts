export enum Controls {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
  jump = 'jump',
  shoot = 'shoot',
  reload = 'reload',
  cameraView = 'cameraView',
  interact = 'interact',
  brake = 'brake',
  teleport = 'teleport'
}

export const controlsMap = [
  { name: Controls.forward, keys: ['KeyW', 'ArrowUp'] },
  { name: Controls.backward, keys: ['KeyS', 'ArrowDown'] },
  { name: Controls.left, keys: ['KeyA', 'ArrowLeft'] },
  { name: Controls.right, keys: ['KeyD', 'ArrowRight'] },
  { name: Controls.jump, keys: ['Space'] },
  { name: Controls.shoot, keys: ['KeyF'] }, // Use F key for shooting as backup
  { name: Controls.reload, keys: ['KeyR'] },
  { name: Controls.cameraView, keys: ['KeyV'] }, // V key to cycle camera views
  { name: Controls.interact, keys: ['KeyE'] }, // E key to enter/exit vehicles
  { name: Controls.brake, keys: ['ShiftLeft', 'ShiftRight'] }, // Shift keys for braking in vehicles
  { name: Controls.teleport, keys: ['KeyT'] } // T key to teleport to shooting ground
];
