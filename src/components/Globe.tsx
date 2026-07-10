import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Globe() {
  const groupRef = useRef<THREE.Group>(null);

  // Create a high-detail icosahedron for the geodesic dome look
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(2.5, 3), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  // Create some scattered highlighted triangles to mimic the reference image
  const highlightGeometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(2.51, 3);
    // Remove most faces to leave only a few highlights
    const positions = geo.attributes.position.array;
    const newPositions = [];
    for (let i = 0; i < positions.length; i += 9) {
      if (Math.random() > 0.95) { // Keep only 5% of faces
        for (let j = 0; j < 9; j++) {
          newPositions.push(positions[i + j]);
        }
      }
    }
    const finalGeo = new THREE.BufferGeometry();
    finalGeo.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
    return finalGeo;
  }, []);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
      groupRef.current.rotation.x += delta * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Dark inner core to occlude back lines */}
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#020617" transparent opacity={0.8} />
      </mesh>

      {/* Wireframe network lines */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color="#06b6d4" transparent opacity={0.15} />
      </lineSegments>

      {/* Highlighted glowing triangles */}
      <mesh geometry={highlightGeometry}>
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Small network nodes (points) */}
      <points geometry={geometry}>
        <pointsMaterial 
          size={0.02} 
          color="#3b82f6" 
          transparent 
          opacity={0.6} 
          sizeAttenuation={true} 
        />
      </points>
      
      {/* Outer faint glow sphere */}
      <mesh>
        <sphereGeometry args={[2.8, 32, 32]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.02} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
