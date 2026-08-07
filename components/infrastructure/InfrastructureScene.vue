<script setup lang="ts">
import * as THREE from "three";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type {
  InfrastructureConnection,
  InfrastructureNode,
} from "~/shared/infrastructure";

const props = defineProps<{
  nodes: InfrastructureNode[];
  connections: InfrastructureConnection[];
  selectedNodeId?: string | null;
}>();

const emit = defineEmits<{
  (event: "select-node", node: InfrastructureNode): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let composer: any = null;
let bloomPass: any = null;
let controls: any = null;
let animationFrameId = 0;
let resizeObserver: ResizeObserver | null = null;
let isMounted = false;
let isInitialized = false;
let pointerDownHandler: ((event: PointerEvent) => void) | null = null;
let pointerMoveHandler: ((event: PointerEvent) => void) | null = null;
let connectionGroup: THREE.Group | null = null;
let flowGroup: THREE.Group | null = null;
let nodeGroup: THREE.Group | null = null;
let starGroup: THREE.Points | null = null;
let gridHelper: THREE.GridHelper | null = null;
let selectionRing: THREE.Mesh | null = null;
let glowTexture: THREE.Texture | null = null;
const clock = new THREE.Clock();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const nodeMeshes: THREE.Mesh[] = [];
const nodeMap = new Map<string, InfrastructureNode>();

type NodeVisual = {
  id: string;
  mesh: THREE.Mesh;
  glow: THREE.Sprite;
  label: THREE.Sprite;
  basePosition: THREE.Vector3;
  phase: number;
  status: InfrastructureNode["status"];
};

type FlowParticle = {
  from: THREE.Vector3;
  to: THREE.Vector3;
  sprite: THREE.Sprite;
  progress: number;
  speed: number;
};

const nodeVisuals: NodeVisual[] = [];
const flowParticles: FlowParticle[] = [];
let hoveredMeshId: string | null = null;
let lastInteractionAt = 0;

function clearGroup(group: THREE.Group) {
  group.traverse((object: any) => {
    disposeRenderable(object);
  });
  group.clear();
}

function disposeRenderable(object: THREE.Object3D) {
  const renderable = object as {
    geometry?: THREE.BufferGeometry;
    material?: THREE.Material | THREE.Material[];
  };

  renderable.geometry?.dispose();

  const material = renderable.material;
  if (!material) return;

  if (Array.isArray(material)) {
    for (const entry of material) entry.dispose();
    return;
  }

  material.dispose();
}

function statusColor(status: InfrastructureNode["status"]) {
  if (status === "healthy") return 0x34d399;
  if (status === "degraded") return 0xfbbf24;
  return 0x64748b;
}

function statusPulseSpeed(status: InfrastructureNode["status"]) {
  if (status === "healthy") return 1.1;
  if (status === "degraded") return 3.4;
  return 0.5;
}

function typeColor(type: InfrastructureNode["type"]) {
  if (type === "application") return 0x5b8dee;
  if (type === "integration") return 0x22d3ee;
  if (type === "database") return 0xa78bfa;
  return 0xfb923c;
}

function createNodeGeometry(type: InfrastructureNode["type"]) {
  if (type === "integration") {
    return new THREE.CylinderGeometry(0.55, 0.55, 1.1, 20);
  }
  if (type === "database") {
    return new THREE.SphereGeometry(0.6, 32, 24);
  }
  if (type === "ai") {
    return new THREE.IcosahedronGeometry(0.68, 1);
  }
  return new THREE.BoxGeometry(1.25, 0.8, 0.85, 2, 2, 2);
}

function getGlowTexture() {
  if (glowTexture) return glowTexture;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.45)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  glowTexture = new THREE.CanvasTexture(canvas);
  return glowTexture;
}

function createGlowSprite(colorHex: number, scale: number) {
  const material = new THREE.SpriteMaterial({
    map: getGlowTexture(),
    color: colorHex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.setScalar(scale);
  return sprite;
}

function createLabelSprite(text: string) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const paddingX = 18;
  const fontSize = 26;
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d")!;
  measureCtx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  const textWidth = measureCtx.measureText(text).width;

  const width = Math.ceil(textWidth + paddingX * 2);
  const height = 48;

  const canvas = document.createElement("canvas");
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "rgba(6, 12, 24, 0.72)";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
  ctx.lineWidth = 1;
  roundRect(ctx, 0.5, 0.5, width - 1, height - 1, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(226, 232, 240, 0.95)";
  ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const aspect = width / height;
  const spriteHeight = 0.62;
  sprite.scale.set(spriteHeight * aspect, spriteHeight, 1);
  return sprite;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function createBackgroundTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#050a16");
  gradient.addColorStop(0.55, "#0a1526");
  gradient.addColorStop(1, "#0d1c30");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4, 256);
  return new THREE.CanvasTexture(canvas);
}

function createStarField() {
  const count = 260;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const radius = 16 + Math.random() * 14;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(radius * Math.cos(phi)) * 0.6 + 1;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.06,
    map: getGlowTexture(),
    color: 0x9db6da,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

function rebuildSceneGraph() {
  if (!scene || !nodeGroup || !connectionGroup || !flowGroup) {
    return;
  }

  clearGroup(nodeGroup);
  clearGroup(connectionGroup);
  clearGroup(flowGroup);
  nodeMeshes.length = 0;
  nodeMap.clear();
  nodeVisuals.length = 0;
  flowParticles.length = 0;

  for (const node of props.nodes) {
    nodeMap.set(node.id, node);

    const geometry = createNodeGeometry(node.type);
    const material = new THREE.MeshStandardMaterial({
      color: typeColor(node.type),
      emissive: statusColor(node.status),
      emissiveIntensity: node.status === "healthy" ? 0.35 : node.status === "degraded" ? 0.5 : 0.12,
      roughness: 0.35,
      metalness: 0.25,
    });

    const mesh = new THREE.Mesh(geometry, material);
    const basePosition = new THREE.Vector3(node.position.x, node.position.y, node.position.z);
    mesh.position.copy(basePosition);
    mesh.userData.nodeId = node.id;
    nodeGroup.add(mesh);
    nodeMeshes.push(mesh);

    const glow = createGlowSprite(statusColor(node.status), 2.4);
    glow.position.copy(basePosition);
    nodeGroup.add(glow);

    const label = createLabelSprite(node.name);
    label.position.set(basePosition.x, basePosition.y + 1.15, basePosition.z);
    nodeGroup.add(label);

    nodeVisuals.push({
      id: node.id,
      mesh,
      glow,
      label,
      basePosition,
      phase: Math.random() * Math.PI * 2,
      status: node.status,
    });
  }

  for (const connection of props.connections) {
    const fromNode = nodeMap.get(connection.from);
    const toNode = nodeMap.get(connection.to);
    if (!fromNode || !toNode) continue;

    const start = new THREE.Vector3(fromNode.position.x, fromNode.position.y, fromNode.position.z);
    const end = new THREE.Vector3(toNode.position.x, toNode.position.y, toNode.position.z);
    const midpoint = start.clone().lerp(end, 0.5);
    midpoint.y += 1.1;

    const curve = new THREE.QuadraticBezierCurve3(start, midpoint, end);
    const points = curve.getPoints(32);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.35,
    });
    connectionGroup.add(new THREE.Line(geometry, material));

    const accent = typeColor(toNode.type);

    const outboundSprite = createGlowSprite(accent, 0.5);
    flowGroup.add(outboundSprite);
    flowParticles.push({
      from: start,
      to: end,
      sprite: outboundSprite,
      progress: Math.random(),
      speed: 0.22,
    });

    const inboundSprite = createGlowSprite(accent, 0.28);
    (inboundSprite.material as THREE.SpriteMaterial).opacity = 0.55;
    flowGroup.add(inboundSprite);
    flowParticles.push({
      from: end,
      to: start,
      sprite: inboundSprite,
      progress: Math.random(),
      speed: 0.3,
    });
  }

  updateSelectionRing();
}

function updateSelectionRing() {
  if (!selectionRing) return;

  const selectedId = props.selectedNodeId;
  const visual = selectedId ? nodeVisuals.find((entry) => entry.id === selectedId) : null;

  if (!visual) {
    selectionRing.visible = false;
    return;
  }

  const material = selectionRing.material as THREE.MeshBasicMaterial;
  material.color.setHex(statusColor(visual.status));
  selectionRing.visible = true;
}

function resizeRenderer() {
  if (!containerRef.value || !camera || !renderer) return;

  const { width, height } = containerRef.value.getBoundingClientRect();
  if (!width || !height) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  composer?.setSize(width, height);
}

function updateHoverCursor(nodeId: string | null) {
  if (!renderer) return;
  renderer.domElement.style.cursor = nodeId ? "pointer" : "grab";
}

function handlePointerMove(event: PointerEvent) {
  if (!camera || !renderer) return;

  const rect = renderer.domElement.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(nodeMeshes, false)[0];
  const hitId = (hit?.object.userData.nodeId as string | undefined) ?? null;

  if (hitId !== hoveredMeshId) {
    hoveredMeshId = hitId;
    updateHoverCursor(hitId);
  }
}

function handlePointerDown(event: PointerEvent) {
  if (!camera || !renderer) return;

  const rect = renderer.domElement.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(nodeMeshes, false)[0];
  if (!hit) return;

  const nodeId = hit.object.userData.nodeId;
  const selectedNode = nodeMap.get(nodeId);
  if (selectedNode) {
    emit("select-node", selectedNode);
  }
}

function animate() {
  if (!renderer || !scene || !camera) return;

  animationFrameId = window.requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();
  const delta = clock.getDelta();

  for (const visual of nodeVisuals) {
    const bob = Math.sin(elapsed * 0.8 + visual.phase) * 0.08;
    visual.mesh.position.y = visual.basePosition.y + bob;
    visual.glow.position.y = visual.mesh.position.y;
    visual.label.position.y = visual.basePosition.y + 1.15 + bob * 0.5;
    visual.mesh.rotation.y += delta * 0.15;

    const pulseSpeed = statusPulseSpeed(visual.status);
    const pulse = 0.75 + Math.sin(elapsed * pulseSpeed + visual.phase) * (visual.status === "unknown" ? 0.08 : 0.25);
    visual.glow.scale.setScalar(2.4 * pulse);

    const isHovered = hoveredMeshId === visual.id;
    const material = visual.mesh.material as THREE.MeshStandardMaterial;
    const baseIntensity = visual.status === "healthy" ? 0.35 : visual.status === "degraded" ? 0.5 : 0.12;
    material.emissiveIntensity = isHovered ? baseIntensity + 0.4 : baseIntensity;
    visual.mesh.scale.setScalar(isHovered ? 1.08 : 1);
  }

  for (const particle of flowParticles) {
    particle.progress += particle.speed * delta;
    if (particle.progress > 1) particle.progress -= 1;

    const eased = particle.progress;
    particle.sprite.position.lerpVectors(particle.from, particle.to, eased);
    particle.sprite.position.y += Math.sin(eased * Math.PI) * 1.1;

    const material = particle.sprite.material as THREE.SpriteMaterial;
    const fade = Math.sin(eased * Math.PI);
    material.opacity = Math.max(0.15, fade);
  }

  if (selectionRing && selectionRing.visible) {
    const selectedId = props.selectedNodeId;
    const visual = selectedId ? nodeVisuals.find((entry) => entry.id === selectedId) : null;
    if (visual) {
      selectionRing.position.copy(visual.mesh.position);
      selectionRing.rotation.z += delta * 0.6;
      const scalePulse = 1 + Math.sin(elapsed * 2.2) * 0.06;
      selectionRing.scale.setScalar(scalePulse);
    }
  }

  if (starGroup) {
    const material = starGroup.material as THREE.PointsMaterial;
    material.opacity = 0.4 + Math.sin(elapsed * 0.6) * 0.1;
    starGroup.rotation.y += delta * 0.01;
  }

  controls?.update();

  if (composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

async function initializeScene() {
  if (!containerRef.value || isInitialized) return;

  const [{ OrbitControls }, { EffectComposer }, { RenderPass }, { UnrealBloomPass }] = await Promise.all([
    import("three/examples/jsm/controls/OrbitControls.js"),
    import("three/examples/jsm/postprocessing/EffectComposer.js"),
    import("three/examples/jsm/postprocessing/RenderPass.js"),
    import("three/examples/jsm/postprocessing/UnrealBloomPass.js"),
  ]);

  scene = new THREE.Scene();
  scene.background = createBackgroundTexture();
  scene.fog = new THREE.Fog(0x0a1526, 14, 32);

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 6.5, 15);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x050a16, 1);
  renderer.domElement.className = "block h-full w-full";
  renderer.domElement.style.cursor = "grab";
  containerRef.value.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  const hemisphereLight = new THREE.HemisphereLight(0x6ea8ff, 0x0a0f1c, 0.7);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
  keyLight.position.set(8, 12, 10);
  const rimLight = new THREE.PointLight(0x38bdf8, 1.4, 20);
  rimLight.position.set(-8, 4, -6);
  const fillLight = new THREE.PointLight(0xf97316, 0.5, 18);
  fillLight.position.set(6, -2, 8);

  scene.add(ambientLight, hemisphereLight, keyLight, rimLight, fillLight);

  gridHelper = new THREE.GridHelper(22, 22, 0x1e3a5f, 0x0f1e33);
  gridHelper.position.y = -4;
  (gridHelper.material as THREE.Material).transparent = true;
  (gridHelper.material as THREE.Material).opacity = 0.5;
  scene.add(gridHelper);

  starGroup = createStarField();
  scene.add(starGroup);

  nodeGroup = new THREE.Group();
  connectionGroup = new THREE.Group();
  flowGroup = new THREE.Group();
  scene.add(connectionGroup, nodeGroup, flowGroup);

  const ringGeometry = new THREE.TorusGeometry(1.05, 0.03, 12, 48);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    transparent: true,
    opacity: 0.85,
  });
  selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
  selectionRing.rotation.x = Math.PI / 2.4;
  selectionRing.visible = false;
  scene.add(selectionRing);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 6;
  controls.maxDistance = 24;
  controls.target.set(0, 0, 0);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.update();

  controls.addEventListener("start", () => {
    controls.autoRotate = false;
    lastInteractionAt = performance.now();
  });
  controls.addEventListener("end", () => {
    lastInteractionAt = performance.now();
    window.setTimeout(() => {
      if (performance.now() - lastInteractionAt >= 4000) {
        controls.autoRotate = true;
      }
    }, 4100);
  });

  pointerDownHandler = handlePointerDown;
  pointerMoveHandler = handlePointerMove;
  renderer.domElement.addEventListener("pointerdown", pointerDownHandler);
  renderer.domElement.addEventListener("pointermove", pointerMoveHandler);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const { width, height } = containerRef.value.getBoundingClientRect();
  bloomPass = new UnrealBloomPass(new THREE.Vector2(width || 1, height || 1), 0.85, 0.55, 0.18);
  composer.addPass(bloomPass);

  resizeRenderer();
  rebuildSceneGraph();
  clock.start();
  animate();
  isInitialized = true;

  resizeObserver = new ResizeObserver(() => {
    resizeRenderer();
  });
  resizeObserver.observe(containerRef.value);
}

function cleanupScene() {
  window.cancelAnimationFrame(animationFrameId);

  if (renderer?.domElement) {
    if (pointerDownHandler) renderer.domElement.removeEventListener("pointerdown", pointerDownHandler);
    if (pointerMoveHandler) renderer.domElement.removeEventListener("pointermove", pointerMoveHandler);
  }

  resizeObserver?.disconnect();
  resizeObserver = null;

  controls?.dispose();
  controls = null;

  if (nodeGroup) {
    clearGroup(nodeGroup);
    scene?.remove(nodeGroup);
    nodeGroup = null;
  }

  if (connectionGroup) {
    clearGroup(connectionGroup);
    scene?.remove(connectionGroup);
    connectionGroup = null;
  }

  if (flowGroup) {
    clearGroup(flowGroup);
    scene?.remove(flowGroup);
    flowGroup = null;
  }

  if (gridHelper) {
    scene?.remove(gridHelper);
    disposeRenderable(gridHelper);
    gridHelper = null;
  }

  if (starGroup) {
    scene?.remove(starGroup);
    disposeRenderable(starGroup);
    starGroup = null;
  }

  if (selectionRing) {
    scene?.remove(selectionRing);
    disposeRenderable(selectionRing);
    selectionRing = null;
  }

  if (composer) {
    composer.renderTarget1?.dispose();
    composer.renderTarget2?.dispose();
    composer = null;
  }
  bloomPass = null;

  if (renderer) {
    renderer.forceContextLoss();
    renderer.dispose();
    renderer.domElement.remove();
    renderer = null;
  }

  scene = null;
  camera = null;
  pointerDownHandler = null;
  pointerMoveHandler = null;
  hoveredMeshId = null;
  glowTexture = null;
  nodeMeshes.length = 0;
  nodeMap.clear();
  nodeVisuals.length = 0;
  flowParticles.length = 0;
  isInitialized = false;
}

watch(
  () => [props.nodes, props.connections],
  () => {
    if (!isMounted || !isInitialized) return;
    rebuildSceneGraph();
  },
  { deep: true },
);

watch(
  () => props.selectedNodeId,
  () => {
    if (!isMounted || !isInitialized) return;
    updateSelectionRing();
  },
);

onMounted(async () => {
  isMounted = true;
  await initializeScene();
});

onBeforeUnmount(() => {
  cleanupScene();
  isMounted = false;
});
</script>

<template>
  <div
    ref="containerRef"
    class="relative min-h-[32rem] overflow-hidden rounded-lg border border-slate-200 bg-slate-950"
  >
    <div class="pointer-events-none absolute left-4 top-4 z-10 rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-200">
      OpsBridge infrastructure model
    </div>
    <div class="pointer-events-none absolute bottom-4 left-4 z-10 rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-400">
      Drag to orbit · scroll to zoom · click a node to inspect
    </div>
  </div>
</template>