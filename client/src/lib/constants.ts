export const PLAYER_SPEED = 8;
export const JUMP_FORCE = 8;
export const GRAVITY = 30;
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_WIDTH = 0.6;

export const BULLET_SPEED = 100;
export const BULLET_LIFETIME = 3000; // milliseconds

export const GAME_SETTINGS = {
  maxPlayers: 8,
  mapSize: 200,
  respawnTime: 3000,
  pointsPerKill: 100,
  winScore: 1000
};

export const SPAWN_POINTS = [
  [10, 0.9, 10],
  [-10, 0.9, 10],
  [10, 0.9, -10],
  [-10, 0.9, -10],
  [0, 0.9, 15],
  [0, 0.9, -15],
  [15, 0.9, 0],
  [-15, 0.9, 0]
];
