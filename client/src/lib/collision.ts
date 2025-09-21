import * as THREE from 'three';

export interface AABB {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export function createAABB(position: THREE.Vector3, size: THREE.Vector3): AABB {
  const halfSize = size.clone().multiplyScalar(0.5);
  return {
    min: position.clone().sub(halfSize),
    max: position.clone().add(halfSize)
  };
}

export function checkAABBCollision(a: AABB, b: AABB): boolean {
  return (
    a.min.x <= b.max.x &&
    a.max.x >= b.min.x &&
    a.min.y <= b.max.y &&
    a.max.y >= b.min.y &&
    a.min.z <= b.max.z &&
    a.max.z >= b.min.z
  );
}

export function checkCollision(
  position: THREE.Vector3, 
  size: THREE.Vector3, 
  obstacles: AABB[]
): boolean {
  const playerAABB = createAABB(position, size);
  
  return obstacles.some(obstacle => checkAABBCollision(playerAABB, obstacle));
}

export function raycastHit(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  targets: { position: THREE.Vector3; size: THREE.Vector3 }[],
  maxDistance: number = 100
): { hit: boolean; target?: any; distance?: number } {
  const ray = new THREE.Ray(origin, direction.normalize());
  let closestHit = null;
  let closestDistance = maxDistance;

  for (const target of targets) {
    const box = new THREE.Box3().setFromCenterAndSize(target.position, target.size);
    const intersectionPoint = new THREE.Vector3();
    
    if (ray.intersectBox(box, intersectionPoint)) {
      const distance = origin.distanceTo(intersectionPoint);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestHit = target;
      }
    }
  }

  return closestHit ? 
    { hit: true, target: closestHit, distance: closestDistance } : 
    { hit: false };
}
