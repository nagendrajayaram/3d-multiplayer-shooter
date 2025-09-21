import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

interface ParticleSystemProps {
  position: THREE.Vector3;
  type: 'muzzleFlash' | 'bulletImpact' | 'explosion' | 'death';
  intensity?: number;
  onComplete?: () => void;
}

export default function ParticleSystem({ position, type, intensity = 1.0, onComplete }: ParticleSystemProps) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());
  
  // Create particles synchronously so they render immediately
  const initialParticles = useMemo(() => createParticles(type, position, intensity), [type, position, intensity]);
  const particlesRef = useRef<Particle[]>(initialParticles);
  
  useEffect(() => {
    startTime.current = Date.now();
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const particles = particlesRef.current;
    const elapsed = Date.now() - startTime.current;

    // Update particles
    let aliveCount = 0;
    particles.forEach((particle, index) => {
      if (particle.life <= 0) return;

      // Update particle physics
      particle.position.add(particle.velocity.clone().multiplyScalar(delta));
      particle.velocity.multiplyScalar(0.98); // Air resistance
      particle.velocity.y -= 9.8 * delta; // Gravity for some effects

      // Update life
      particle.life -= delta;
      const lifeRatio = particle.life / particle.maxLife;

      if (particle.life > 0) {
        aliveCount++;
        
        // Update visual properties based on life
        particle.color.lerp(new THREE.Color(0x000000), 1 - lifeRatio);
        particle.size = particle.size * lifeRatio;

        // Update mesh if it exists
        const mesh = groupRef.current?.children[index] as THREE.Mesh;
        if (mesh && mesh.material) {
          mesh.position.copy(particle.position);
          mesh.scale.setScalar(particle.size);
          const material = mesh.material as THREE.MeshBasicMaterial;
          material.color.copy(particle.color);
          material.opacity = lifeRatio;
          material.transparent = true;
          material.needsUpdate = true;
          mesh.visible = true;
        }
      } else {
        // Hide dead particle
        const mesh = groupRef.current?.children[index] as THREE.Mesh;
        if (mesh) {
          mesh.visible = false;
        }
      }
    });

    // Clean up when all particles are dead
    if (aliveCount === 0 && elapsed > 500) {
      onComplete?.();
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {initialParticles.map((particle, index) => (
        <mesh key={index}>
          <sphereGeometry args={[0.2]} />
          <meshBasicMaterial color={particle.color} transparent opacity={1.0} />
        </mesh>
      ))}
    </group>
  );
}

function createParticles(type: string, position: THREE.Vector3, intensity: number): Particle[] {
  const particles: Particle[] = [];

  switch (type) {
    case 'muzzleFlash':
      // Enhanced muzzle flash with bright burst
      for (let i = 0; i < 12 * intensity; i++) {
        particles.push({
          position: new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3
          ),
          life: 0.2 + Math.random() * 0.15,
          maxLife: 0.2 + Math.random() * 0.15,
          size: 1.8 + Math.random() * 1.0,
          color: Math.random() > 0.4 
            ? new THREE.Color().setHSL(0.08, 1.0, 0.9 + Math.random() * 0.1) // Bright orange
            : new THREE.Color().setHSL(0.15, 0.8, 0.95) // Yellow-white
        });
      }
      break;

    case 'bulletImpact':
      // Enhanced sparks and debris on surface impact
      for (let i = 0; i < 18 * intensity; i++) {
        particles.push({
          position: new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            Math.random() * 0.1,
            (Math.random() - 0.5) * 0.2
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            Math.random() * 4 + 2,
            (Math.random() - 0.5) * 5
          ),
          life: 0.3 + Math.random() * 0.4,
          maxLife: 0.3 + Math.random() * 0.4,
          size: 0.4 + Math.random() * 0.4,
          color: Math.random() > 0.5
            ? new THREE.Color().setHSL(0.08, 0.9, 0.7 + Math.random() * 0.2) // Orange sparks
            : new THREE.Color().setHSL(0.0, 0.0, 0.8 + Math.random() * 0.2) // Gray debris
        });
      }
      break;

    case 'explosion':
      // Large explosion with debris and variety
      for (let i = 0; i < 35 * intensity; i++) {
        const angle = Math.random() * Math.PI * 2; // Random distribution
        const radius = Math.random() * 0.5;
        const speed = 2 + Math.random() * 6;
        
        particles.push({
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.random() * 0.3,
            Math.sin(angle) * radius
          ),
          velocity: new THREE.Vector3(
            Math.cos(angle) * speed,
            Math.random() * 5 + 3,
            Math.sin(angle) * speed
          ),
          life: 0.8 + Math.random() * 0.7,
          maxLife: 0.8 + Math.random() * 0.7,
          size: 0.8 + Math.random() * 1.2,
          color: Math.random() > 0.3 
            ? new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 1.0, 0.6 + Math.random() * 0.3) // Orange/red
            : new THREE.Color().setHSL(0.0, 0.8, 0.9) // Bright yellow/white
        });
      }
      break;

    case 'death':
      // Player/bot death effect
      for (let i = 0; i < 20 * intensity; i++) {
        particles.push({
          position: new THREE.Vector3(
            (Math.random() - 0.5) * 1.0,
            Math.random() * 1.8,
            (Math.random() - 0.5) * 1.0
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            Math.random() * 2 + 1,
            (Math.random() - 0.5) * 3
          ),
          life: 1.2 + Math.random() * 0.6,
          maxLife: 1.2 + Math.random() * 0.6,
          size: 0.9 + Math.random() * 0.5,
          color: new THREE.Color(0xff4444)
        });
      }
      break;
  }

  return particles;
}