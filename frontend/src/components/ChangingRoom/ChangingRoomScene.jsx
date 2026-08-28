import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { applyAvatarParamsToMesh } from "../../services/changingRoom/avatarEngine";
import { createGarmentModel } from "../../services/changingRoom/garmentEngine";
import "./ChangingRoomScene.css";

const CAMERA_PRESETS = {
  front: { pos: new THREE.Vector3(0, 1.1, 3.4), target: new THREE.Vector3(0, 0.95, 0) },
  threequarter: { pos: new THREE.Vector3(1.8, 1.1, 2.4), target: new THREE.Vector3(0, 0.95, 0) },
  side: { pos: new THREE.Vector3(3.0, 1.1, 0.4), target: new THREE.Vector3(0, 0.95, 0) },
  back: { pos: new THREE.Vector3(0, 1.1, -3.4), target: new THREE.Vector3(0, 0.95, 0) },
  detail: { pos: new THREE.Vector3(0, 0.82, 1.7), target: new THREE.Vector3(0, 0.8, 0) },
};

const ChangingRoomScene = ({
  bodyParams,
  garmentConfig,
  activeCameraView = "front",
  isAutoRotate = false,
  isTensionMode = false,
  onAvatarLoaded = null,
}) => {
  const containerRef = useRef(null);

  // Scene references to avoid rebuilding
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const bodyRootRef = useRef(null);
  const avatarMeshRef = useRef(null);
  const onAvatarLoadedRef = useRef(onAvatarLoaded);
  onAvatarLoadedRef.current = onAvatarLoaded;
  const bodyParamsRef = useRef(bodyParams);
  bodyParamsRef.current = bodyParams;
  const garmentRootRef = useRef(null);
  const animFrameRef = useRef(null);

  // Orbit & interaction state
  const isDraggingRef = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef({ theta: 0, phi: Math.PI / 2, radius: 3.4 });
  const targetCameraPos = useRef(CAMERA_PRESETS.front.pos.clone());
  const targetLookAt = useRef(CAMERA_PRESETS.front.target.clone());
  const currentLookAt = useRef(CAMERA_PRESETS.front.target.clone());
  const autoRotateSpeed = useRef(0.004);

  // 1. Initial Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Create Scene with luxury studio atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#07080a");
    scene.fog = new THREE.FogExp2("#07080a", 0.075);
    sceneRef.current = scene;

    // Create Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.copy(CAMERA_PRESETS.front.pos);
    cameraRef.current = camera;

    // Create WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Build Luxury Studio Architecture
    buildStudioArchitecture(scene);

    // Build Lighting
    buildStudioLighting(scene);

    // Load Dynamic Avatar Model from GLB
    const loader = new GLTFLoader();
    loader.load(
      "/models/Seemz_avatar.glb",
      (gltf) => {
        const avatarScene = gltf.scene;
        avatarScene.name = "AvatarRoot";
        // Position feet directly at y = 0.0 on top of studio floor
        avatarScene.position.set(0, 0.027, 0);
        avatarScene.scale.set(1.0, 1.0, 1.0);

        let foundMesh = null;
        avatarScene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.roughness = 0.38;
              child.material.metalness = 0.04;
              child.material.color = new THREE.Color("#EFECE6");
              child.material.needsUpdate = true;
            }
            if (child.morphTargetDictionary) {
              foundMesh = child;
            }
          }
        });

        if (foundMesh) {
          // Connected components filter to keep only the clean mannequin pieces:
          // - Head skin: 0
          // - Left Eyeball: 3
          // - Right Eyeball: 6
          // - Bodysuit torso helper: 369
          // - Gloves/Hands: 4, 7
          // - Shoes/Feet: 5, 8
          // This drops the hair, explicit anatomy, and clothing proxy layers.
          const geometry = foundMesh.geometry;
          const position = geometry.attributes.position;
          const index = geometry.index;
          if (index) {
            const vertexCount = position.count;
            const faceCount = index.count / 3;

            // 1. Adjacency list
            const adjList = Array.from({ length: vertexCount }, () => []);
            for (let i = 0; i < faceCount; i++) {
              const v0 = index.getX(i * 3);
              const v1 = index.getY(i * 3);
              const v2 = index.getZ(i * 3);
              adjList[v0].push(v1, v2);
              adjList[v1].push(v0, v2);
              adjList[v2].push(v0, v1);
            }

            // 2. BFS connected components search
            const vertexToComponent = new Int32Array(vertexCount).fill(-1);
            let componentCount = 0;
            for (let i = 0; i < vertexCount; i++) {
              if (vertexToComponent[i] !== -1) continue;
              const queue = [i];
              vertexToComponent[i] = componentCount;
              let head = 0;
              while (head < queue.length) {
                const u = queue[head++];
                const neighbors = adjList[u];
                for (let j = 0; j < neighbors.length; j++) {
                  const v = neighbors[j];
                  if (vertexToComponent[v] === -1) {
                    vertexToComponent[v] = componentCount;
                    queue.push(v);
                  }
                }
              }
              componentCount++;
            }

            // 3. Keep clean components
            const wantedComponents = new Set([0, 3, 6, 369, 4, 7, 5, 8]);
            const newIndices = [];
            for (let i = 0; i < faceCount; i++) {
              const v0 = index.getX(i * 3);
              const v1 = index.getY(i * 3);
              const v2 = index.getZ(i * 3);

              const compId = vertexToComponent[v0];
              if (wantedComponents.has(compId)) {
                newIndices.push(v0, v1, v2);
              }
            }

            // 4. Update index buffer
            geometry.index = new THREE.BufferAttribute(new Uint32Array(newIndices), 1);
            geometry.index.needsUpdate = true;
            geometry.computeVertexNormals();
          }

          avatarMeshRef.current = foundMesh;
          if (bodyParamsRef.current) {
            applyAvatarParamsToMesh(foundMesh, bodyParamsRef.current);
          }
          if (onAvatarLoadedRef.current) {
            onAvatarLoadedRef.current({
              mesh: foundMesh,
              dictionary: { ...foundMesh.morphTargetDictionary },
              influences: [...foundMesh.morphTargetInfluences],
            });
          }
        }

        scene.add(avatarScene);
        bodyRootRef.current = avatarScene;
      },
      undefined,
      (error) => {
        console.error("Error loading Seemz_avatar.glb:", error);
      }
    );

    // Garment disabled for pure avatar inspection
    // const garmentMesh = createGarmentModel(garmentConfig, bodyParams, isTensionMode);
    // scene.add(garmentMesh);
    // garmentRootRef.current = garmentMesh;

    // Animation Render Loop
    let lastTime = performance.now();
    const animate = (time) => {
      animFrameRef.current = requestAnimationFrame(animate);

      // Auto-rotation turntable
      if (isAutoRotate && !isDraggingRef.current) {
        sphericalRef.current.theta += autoRotateSpeed.current;
        targetCameraPos.current.x = sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.sin(sphericalRef.current.theta);
        targetCameraPos.current.z = sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.cos(sphericalRef.current.theta);
      }

      // Smooth camera interpolation
      camera.position.lerp(targetCameraPos.current, 0.08);
      currentLookAt.current.lerp(targetLookAt.current, 0.08);
      camera.lookAt(currentLookAt.current);

      renderer.render(scene, camera);
    };

    animate(lastTime);

    // Responsive Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Pointer Drag Controls
    const onPointerDown = (e) => {
      isDraggingRef.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - prevMousePos.current.x;
      const deltaY = e.clientY - prevMousePos.current.y;
      prevMousePos.current = { x: e.clientX, y: e.clientY };

      sphericalRef.current.theta -= deltaX * 0.008;
      sphericalRef.current.phi = Math.max(
        0.15,
        Math.min(Math.PI / 2 + 0.1, sphericalRef.current.phi - deltaY * 0.006)
      );

      targetCameraPos.current.x =
        sphericalRef.current.radius *
        Math.sin(sphericalRef.current.phi) *
        Math.sin(sphericalRef.current.theta);
      targetCameraPos.current.y =
        currentLookAt.current.y +
        sphericalRef.current.radius * Math.cos(sphericalRef.current.phi);
      targetCameraPos.current.z =
        sphericalRef.current.radius *
        Math.sin(sphericalRef.current.phi) *
        Math.cos(sphericalRef.current.theta);
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      sphericalRef.current.radius = Math.max(
        1.4,
        Math.min(4.8, sphericalRef.current.radius + e.deltaY * 0.002)
      );
      targetCameraPos.current.x =
        sphericalRef.current.radius *
        Math.sin(sphericalRef.current.phi) *
        Math.sin(sphericalRef.current.theta);
      targetCameraPos.current.z =
        sphericalRef.current.radius *
        Math.sin(sphericalRef.current.phi) *
        Math.cos(sphericalRef.current.theta);
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("wheel", onWheel);

      // Clean disposal
      renderer.dispose();
      scene.clear();
    };
  }, []);

  // 2. Camera Preset Transitions
  useEffect(() => {
    const preset = CAMERA_PRESETS[activeCameraView] || CAMERA_PRESETS.front;
    targetCameraPos.current.copy(preset.pos);
    targetLookAt.current.copy(preset.target);

    // Sync spherical coords
    const offset = preset.pos.clone().sub(preset.target);
    sphericalRef.current.radius = offset.length();
    sphericalRef.current.phi = Math.acos(offset.y / sphericalRef.current.radius);
    sphericalRef.current.theta = Math.atan2(offset.x, offset.z);
  }, [activeCameraView]);

  // 3. Dynamic Avatar Morph Updates (Height, Weight, Muscle, Proportions)
  useEffect(() => {
    const mesh = avatarMeshRef.current;
    if (!mesh || !bodyParams) return;
    applyAvatarParamsToMesh(mesh, bodyParams);
  }, [bodyParams]);

  // 4. Dynamic Garment Updates (Disabled for pure avatar inspection)
  useEffect(() => {
    if (!sceneRef.current) return;
    if (garmentRootRef.current) {
      sceneRef.current.remove(garmentRootRef.current);
      garmentRootRef.current = null;
    }
  }, [garmentConfig, bodyParams, isTensionMode]);

  return (
    <div className="changing-room-scene-container" ref={containerRef}>
      <div className="scene-watermark">
        <span>SEEMZ ATELIER</span>
        <p>3D FASHION LAB // V1.0</p>
      </div>
    </div>
  );
};

/**
 * Builds the SEEMZ Luxury Studio Room
 */
function buildStudioArchitecture(scene) {
  // 1. Polished Obsidian Floor Plane
  const floorGeo = new THREE.CircleGeometry(4.5, 64);
  const floorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#0a0b0d"),
    roughness: 0.18,
    metalness: 0.8,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Floor Radial Outer Ring
  const ringGeo = new THREE.RingGeometry(4.45, 4.5, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: "#22252a", side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);

  // 2. Back Architecture Wall
  const wallGeo = new THREE.PlaneGeometry(10, 6);
  const wallMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#0c0d10"),
    roughness: 0.9,
    metalness: 0.1,
  });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(0, 3, -3.2);
  wall.receiveShadow = true;
  scene.add(wall);

  // 3. SEEMZ ATELIER Engraved Backlit Wall Signage
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0c0d10";
  ctx.fillRect(0, 0, 1024, 256);
  ctx.font = "bold 56px Cormorant Garamond, serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.textAlign = "center";
  ctx.letterSpacing = "14px";
  ctx.fillText("S E E M Z", 512, 110);
  ctx.font = "300 24px Inter, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
  ctx.fillText("A T E L I E R   //   P R O T O T Y P E   L A B", 512, 165);

  const signTex = new THREE.CanvasTexture(canvas);
  const signGeo = new THREE.PlaneGeometry(3.6, 0.9);
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
  const signMesh = new THREE.Mesh(signGeo, signMat);
  signMesh.position.set(0, 2.8, -3.18);
  scene.add(signMesh);

  // 4. Luxury Full-Length Fashion Mirror
  const mirrorGroup = new THREE.Group();
  mirrorGroup.position.set(-2.0, 1.4, -1.8);
  mirrorGroup.rotation.y = 0.45;

  const mirrorFrameGeo = new THREE.BoxGeometry(0.9, 2.3, 0.04);
  const frameMat = new THREE.MeshStandardMaterial({ color: "#c0c5cc", roughness: 0.2, metalness: 0.9 });
  const mirrorFrame = new THREE.Mesh(mirrorFrameGeo, frameMat);
  mirrorGroup.add(mirrorFrame);

  const glassGeo = new THREE.PlaneGeometry(0.8, 2.18);
  const glassMat = new THREE.MeshStandardMaterial({ color: "#1a1d24", roughness: 0.05, metalness: 0.95 });
  const mirrorGlass = new THREE.Mesh(glassGeo, glassMat);
  mirrorGlass.position.z = 0.021;
  mirrorGroup.add(mirrorGlass);

  scene.add(mirrorGroup);

  // 5. Minimalist Stainless Steel Clothing Rail
  const railGroup = new THREE.Group();
  railGroup.position.set(1.9, 0, -1.4);
  railGroup.rotation.y = -0.4;

  const railMat = new THREE.MeshStandardMaterial({ color: "#8a909a", roughness: 0.25, metalness: 0.85 });
  // Vertical poles
  [-0.45, 0.45].forEach((x) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8, 16), railMat);
    post.position.set(x, 0.9, 0);
    post.castShadow = true;
    railGroup.add(post);
  });
  // Top bar
  const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.95, 16), railMat);
  topBar.rotation.z = Math.PI / 2;
  topBar.position.set(0, 1.78, 0);
  railGroup.add(topBar);

  scene.add(railGroup);
}

/**
 * Builds Cinematic High-Contrast Studio Lighting
 */
function buildStudioLighting(scene) {
  // 1. Key Spotlight (Soft warm directional beam highlighting front/side contours)
  const keyLight = new THREE.SpotLight(0xfff8ee, 4.5);
  keyLight.position.set(2.4, 4.4, 3.4);
  keyLight.angle = Math.PI / 4.2;
  keyLight.penumbra = 0.55;
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  // 2. High-Contrast Cool Rim Light (Sharp back contour edge separation)
  const rimLight = new THREE.DirectionalLight(0xd2e4ff, 3.6);
  rimLight.position.set(-2.8, 3.4, -3.0);
  scene.add(rimLight);

  // 3. Front Fill Light (Ensures body details & garment drape are crisp and never lost in shadow)
  const frontFillLight = new THREE.DirectionalLight(0xf2efe9, 1.8);
  frontFillLight.position.set(0, 2.0, 4.0);
  scene.add(frontFillLight);

  // 4. Soft Ambient Studio Diffusion
  const fillLight = new THREE.AmbientLight(0x20242c, 1.5);
  scene.add(fillLight);

  // 5. Soft Overhead Studio Downlight
  const downLight = new THREE.PointLight(0xffffff, 1.4, 8);
  downLight.position.set(0, 3.8, 0.5);
  scene.add(downLight);
}

export default ChangingRoomScene;
