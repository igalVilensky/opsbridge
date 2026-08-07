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

type NodeVisual = {
  id: string;
  mesh: THREE.Mesh;
  glow: THREE.Sprite;
  label: THREE.Sprite;
  basePosition: THREE.Vector3;
  baseColor: THREE.Color;
  phase: number;
  status: InfrastructureNode["status"];
};

type ConnectionVisual = {
  from: string;
  to: string;
  line: THREE.Line;
  material: THREE.LineBasicMaterial;
  targetStatus: InfrastructureNode["status"];
  baseOpacity: number;
  baseColor: THREE.Color;
};

type FlowParticle = {
  from: THREE.Vector3;
  to: THREE.Vector3;
  sourceId: string;
  targetId: string;
  sprite: THREE.Sprite;
  progress: number;
  baseSpeed: number;
  targetStatus: InfrastructureNode["status"];
  baseOpacity: number;
};

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
let pointerLeaveHandler: ((event: PointerEvent) => void) | null = null;
let connectionGroup: THREE.Group | null = null;
let flowGroup: THREE.Group | null = null;
let nodeGroup: THREE.Group | null = null;
let starGroup: THREE.Points | null = null;
let gridHelper: THREE.GridHelper | null = null;
let selectionRing: THREE.Mesh | null = null;
let glowTexture: THREE.Texture | null = null;
let backgroundTexture: THREE.Texture | null = null;
let autoRotateTimeoutId: number | null = null;
const clock = new THREE.Clock();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const nodeMeshes: THREE.Mesh[] = [];
const nodeMap = new Map<string, InfrastructureNode>();
const connectedNodeIds = new Map<string, Set<string>>();
const nodeVisuals: NodeVisual[] = [];
const connectionVisuals: ConnectionVisual[] = [];
const flowParticles: FlowParticle[] = [];
let hoveredMeshId: string | null = null;
let lastInteractionAt = 0;

const highlightTint = new THREE.Color(0xe2f0ff);
const connectionTint = new THREE.Color(0x334155);

function clearGroup(group: THREE.Group) {
  group.traverse((object: THREE.Object3D) => {
    disposeRenderable(object);
  });
  group.clear();
}

function disposeRenderable(object: THREE.Object3D) {
  const renderable = object as {
    geometry?: THREE.BufferGeometry;
    material?: THREE.Material | THREE.Material[];
    userData?: Record<string, unknown>;
  };

  renderable.geometry?.dispose();

  const material = renderable.material;
  if (!material) return;

  const disposeTexture = renderable.userData?.disposeTexture === true;

  const disposeMaterial = (entry: THREE.Material) => {
    const texturedMaterial = entry as THREE.SpriteMaterial & { map?: THREE.Texture | null };
    if (disposeTexture && texturedMaterial.map) {
      texturedMaterial.map.dispose();
    }
    entry.dispose();
  };

  if (Array.isArray(material)) {
    for (const entry of material) disposeMaterial(entry);
    return;
  }

  disposeMaterial(material);
}

function statusColor(status: InfrastructureNode["status"]) {
  if (status === "healthy") return 0x34d399;
  if (status === "degraded") return 0xf59e0b;
  return 0x64748b;
}

function statusPulseSpeed(status: InfrastructureNode["status"]) {
  if (status === "healthy") return 0.95;
  if (status === "degraded") return 2.4;
  return 0.45;
}

function typeColor(type: InfrastructureNode["type"]) {
  if (type === "application") return 0x5b8dee;
  if (type === "integration") return 0x22d3ee;
  if (type === "database") return 0xa78bfa;
  return 0xfb923c;
}

function createNodeGeometry(type: InfrastructureNode["type"]) {
  if (type === "integration") {
    return new THREE.CylinderGeometry(0.53, 0.53, 1.08, 20);
  }
  if (type === "database") {
    return new THREE.SphereGeometry(0.61, 32, 24);
  }
  if (type === "ai") {
    return new THREE.IcosahedronGeometry(0.68, 1);
  }
  return new THREE.BoxGeometry(1.2, 0.78, 0.82, 2, 2, 2);
}

function getGlowTexture() {
  if (glowTexture) return glowTexture;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,0.98)");
  gradient.addColorStop(0.25, "rgba(255,255,255,0.42)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.12)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  glowTexture = new THREE.CanvasTexture(canvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  return glowTexture;
}

function createGlowSprite(colorHex: number, scale: number, opacity = 0.2) {
  const material = new THREE.SpriteMaterial({
    map: getGlowTexture(),
    color: colorHex,
    transparent: true,
    depthWrite: false,
    opacity,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.setScalar(scale);
  return sprite;
}

function createLabelSprite(text: string) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const paddingX = 16;
  const fontSize = 24;
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d")!;
  measureCtx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  const textWidth = measureCtx.measureText(text).width;

  const width = Math.ceil(textWidth + paddingX * 2);
  const height = 44;

  const canvas = document.createElement("canvas");
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "rgba(6, 12, 24, 0.64)";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.28)";
  ctx.lineWidth = 1;
  roundRect(ctx, 0.5, 0.5, width - 1, height - 1, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(226, 232, 240, 0.96)";
  ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.userData.disposeTexture = true;
  const aspect = width / height;
  const spriteHeight = 0.56;
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
  gradient.addColorStop(0, "#040812");
  gradient.addColorStop(0.55, "#08111d");
  gradient.addColorStop(1, "#0c1727");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createStarField() {
  const count = 140;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const radius = 15 + Math.random() * 12;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(radius * Math.cos(phi)) * 0.55 + 0.8;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.045,
    map: getGlowTexture(),
    color: 0x8ca6c4,
    transparent: true,
    opacity: 0.23,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

function getBaseGlowScale(status: InfrastructureNode["status"]) {
  if (status === "healthy") return 1.62;
  if (status === "degraded") return 1.76;
  return 1.46;
}

function getBaseGlowOpacity(status: InfrastructureNode["status"]) {
  if (status === "healthy") return 0.16;
  if (status === "degraded") return 0.22;
  return 0.1;
}

function getFlowSpeed(status: InfrastructureNode["status"], direction: "outbound" | "inbound") {
  const base =
    status === "healthy"
      ? 0.22
      : status === "degraded"
        ? 0.15
        : 0.08;

  return direction === "outbound" ? base : base * 0.9;
}

function getFlowOpacity(status: InfrastructureNode["status"]) {
  if (status === "healthy") return 0.42;
  if (status === "degraded") return 0.3;
  return 0.16;
}

function registerConnection(sourceId: string, targetId: string) {
  if (!connectedNodeIds.has(sourceId)) connectedNodeIds.set(sourceId, new Set());
  if (!connectedNodeIds.has(targetId)) connectedNodeIds.set(targetId, new Set());
  connectedNodeIds.get(sourceId)?.add(targetId);
  connectedNodeIds.get(targetId)?.add(sourceId);
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
  connectedNodeIds.clear();
  nodeVisuals.length = 0;
  connectionVisuals.length = 0;
  flowParticles.length = 0;

  for (const node of props.nodes) {
    nodeMap.set(node.id, node);

    const geometry = createNodeGeometry(node.type);
    const baseColor = new THREE.Color(typeColor(node.type));
    const material = new THREE.MeshStandardMaterial({
      color: baseColor.clone(),
      emissive: new THREE.Color(statusColor(node.status)),
      emissiveIntensity: node.status === "healthy" ? 0.18 : node.status === "degraded" ? 0.34 : 0.08,
      roughness: 0.42,
      metalness: 0.12,
    });

    const mesh = new THREE.Mesh(geometry, material);
    const basePosition = new THREE.Vector3(node.position.x, node.position.y, node.position.z);
    mesh.position.copy(basePosition);
    mesh.userData.nodeId = node.id;
    nodeGroup.add(mesh);
    nodeMeshes.push(mesh);

    const glow = createGlowSprite(statusColor(node.status), getBaseGlowScale(node.status), getBaseGlowOpacity(node.status));
    glow.position.copy(basePosition);
    nodeGroup.add(glow);

    const label = createLabelSprite(node.name);
    label.position.set(basePosition.x, basePosition.y + 1.13, basePosition.z);
    nodeGroup.add(label);

    nodeVisuals.push({
      id: node.id,
      mesh,
      glow,
      label,
      basePosition,
      baseColor,
      phase: Math.random() * Math.PI * 2,
      status: node.status,
    });
  }

  for (const connection of props.connections) {
    const fromNode = nodeMap.get(connection.from);
    const toNode = nodeMap.get(connection.to);
    if (!fromNode || !toNode) continue;

    registerConnection(fromNode.id, toNode.id);

    const start = new THREE.Vector3(fromNode.position.x, fromNode.position.y, fromNode.position.z);
    const end = new THREE.Vector3(toNode.position.x, toNode.position.y, toNode.position.z);
    const midpoint = start.clone().lerp(end, 0.5);
    midpoint.y += 1.08;

    const curve = new THREE.QuadraticBezierCurve3(start, midpoint, end);
    const points = curve.getPoints(28);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const baseColor = connectionTint.clone();
    const material = new THREE.LineBasicMaterial({
      color: baseColor.clone(),
      transparent: true,
      opacity: 0.26,
    });
    const line = new THREE.Line(geometry, material);
    connectionGroup.add(line);
    connectionVisuals.push({
      from: fromNode.id,
      to: toNode.id,
      line,
      material,
      targetStatus: toNode.status,
      baseOpacity: 0.26,
      baseColor,
    });

    const accentColor = new THREE.Color(statusColor(toNode.status));
    const outboundSprite = createGlowSprite(
      accentColor.getHex(),
      0.4,
      getFlowOpacity(toNode.status),
    );
    flowGroup.add(outboundSprite);
    flowParticles.push({
      from: start,
      to: end,
      sourceId: fromNode.id,
      targetId: toNode.id,
      sprite: outboundSprite,
      progress: Math.random(),
      baseSpeed: getFlowSpeed(toNode.status, "outbound"),
      targetStatus: toNode.status,
      baseOpacity: getFlowOpacity(toNode.status),
    });

    const inboundSprite = createGlowSprite(
      accentColor.getHex(),
      0.25,
      getFlowOpacity(toNode.status) * 0.8,
    );
    flowGroup.add(inboundSprite);
    flowParticles.push({
      from: end,
      to: start,
      sourceId: toNode.id,
      targetId: fromNode.id,
      sprite: inboundSprite,
      progress: Math.random(),
      baseSpeed: getFlowSpeed(toNode.status, "inbound"),
      targetStatus: toNode.status,
      baseOpacity: getFlowOpacity(toNode.status) * 0.8,
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

function handlePointerLeave() {
  hoveredMeshId = null;
  updateHoverCursor(null);
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

function getConnectionHighlight(selectedId: string | null, connection: ConnectionVisual) {
  if (!selectedId) {
    return {
      isDirect: false,
      opacity: connection.baseOpacity,
      color: connection.baseColor,
    };
  }

  const isDirect = connection.from === selectedId || connection.to === selectedId;
  return {
    isDirect,
    opacity: isDirect ? 0.72 : 0.12,
    color: isDirect ? new THREE.Color(statusColor(connection.targetStatus)) : connection.baseColor,
  };
}

function getNodeRelationship(selectedId: string | null, nodeId: string) {
  if (!selectedId) {
    return {
      isSelected: false,
      isDirect: false,
      isDimmed: false,
    };
  }

  const isSelected = selectedId === nodeId;
  const isDirect = connectedNodeIds.get(selectedId)?.has(nodeId) ?? false;

  return {
    isSelected,
    isDirect,
    isDimmed: !isSelected && !isDirect,
  };
}

function animate() {
  if (!renderer || !scene || !camera) return;

  animationFrameId = window.requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();
  const delta = clock.getDelta();
  const selectedId = props.selectedNodeId ?? null;
  const relationshipDarken = new THREE.Color(0x0f172a);

  for (const visual of nodeVisuals) {
    const bob = Math.sin(elapsed * 0.78 + visual.phase) * 0.07;
    visual.mesh.position.y = visual.basePosition.y + bob;
    visual.glow.position.y = visual.mesh.position.y;
    visual.label.position.y = visual.basePosition.y + 1.13 + bob * 0.45;
    visual.mesh.rotation.y += delta * 0.13;

    const relationship = getNodeRelationship(selectedId, visual.id);
    const isHovered = hoveredMeshId === visual.id;
    const material = visual.mesh.material as THREE.MeshStandardMaterial;
    const baseEmissive =
      visual.status === "healthy" ? 0.18 : visual.status === "degraded" ? 0.34 : 0.08;

    material.color.copy(visual.baseColor);
    if (relationship.isDimmed) {
      material.color.lerp(relationshipDarken, 0.34);
    } else if (relationship.isDirect) {
      material.color.lerp(highlightTint, relationship.isSelected ? 0.1 : 0.06);
    }

    const hoverBoost = isHovered ? 0.08 : 0;
    const directBoost = relationship.isDirect ? 0.05 : 0;
    const selectionBoost = relationship.isSelected ? 0.08 : 0;
    const dimPenalty = relationship.isDimmed ? 0.06 : 0;
    material.emissiveIntensity = Math.max(
      0.04,
      baseEmissive + hoverBoost + directBoost + selectionBoost - dimPenalty,
    );
    visual.mesh.scale.setScalar(
      relationship.isSelected
        ? 1.08
        : isHovered
          ? 1.05
          : relationship.isDimmed
            ? 0.97
            : 1,
    );

    const glowMaterial = visual.glow.material as THREE.SpriteMaterial;
    const pulseSpeed = statusPulseSpeed(visual.status);
    const pulse =
      0.8 + Math.sin(elapsed * pulseSpeed + visual.phase) * (visual.status === "unknown" ? 0.04 : 0.14);
    const dimScale = relationship.isDimmed ? 0.9 : 1;
    const focusScale = relationship.isSelected ? 1.06 : relationship.isDirect ? 1.02 : 1;
    visual.glow.scale.setScalar(getBaseGlowScale(visual.status) * pulse * dimScale * focusScale);
    glowMaterial.opacity =
      getBaseGlowOpacity(visual.status) * (relationship.isDimmed ? 0.72 : 1) * (isHovered ? 1.18 : 1);

    const labelMaterial = visual.label.material as THREE.SpriteMaterial;
    labelMaterial.opacity = relationship.isDimmed ? 0.72 : relationship.isDirect || relationship.isSelected ? 1 : 0.9;
  }

  for (const connection of connectionVisuals) {
    const highlight = getConnectionHighlight(selectedId, connection);
    connection.material.color.copy(highlight.color);
    connection.material.opacity = highlight.opacity;
  }

  for (const particle of flowParticles) {
    const selected = selectedId
      ? particle.sourceId === selectedId || particle.targetId === selectedId
      : true;
    const directBoost = selected ? 1 : 0.55;
    const statusFactor =
      particle.targetStatus === "healthy"
        ? 1
        : particle.targetStatus === "degraded"
          ? 0.72
          : 0.45;

    particle.progress += particle.baseSpeed * statusFactor * delta * directBoost;
    if (particle.progress > 1) particle.progress -= 1;

    const eased = particle.progress;
    particle.sprite.position.lerpVectors(particle.from, particle.to, eased);
    particle.sprite.position.y += Math.sin(eased * Math.PI) * 1.06;

    const material = particle.sprite.material as THREE.SpriteMaterial;
    material.color.setHex(
      particle.targetStatus === "healthy"
        ? 0x7dd3fc
        : particle.targetStatus === "degraded"
          ? 0xfbbf24
          : 0x94a3b8,
    );
    const fade = Math.sin(eased * Math.PI);
    material.opacity = Math.max(
      0.06,
      particle.baseOpacity * statusFactor * fade * (selected ? 1 : 0.88),
    );
  }

  if (selectionRing && selectionRing.visible) {
    const visual = selectedId ? nodeVisuals.find((entry) => entry.id === selectedId) : null;
    if (visual) {
      selectionRing.position.copy(visual.mesh.position);
      selectionRing.rotation.z += delta * 0.6;
      const scalePulse = 1 + Math.sin(elapsed * 2.1) * 0.05;
      selectionRing.scale.setScalar(scalePulse);
    }
  }

  if (starGroup) {
    const material = starGroup.material as THREE.PointsMaterial;
    material.opacity = 0.18 + Math.sin(elapsed * 0.55) * 0.05;
    starGroup.rotation.y += delta * 0.008;
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

  if (!isMounted || !containerRef.value || isInitialized) return;

  scene = new THREE.Scene();
  backgroundTexture = createBackgroundTexture();
  scene.background = backgroundTexture;
  scene.fog = new THREE.Fog(0x08111d, 15, 32);

  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 6.3, 15.2);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x040812, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.domElement.className = "block h-full w-full touch-none";
  renderer.domElement.style.cursor = "grab";
  containerRef.value.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.22);
  const hemisphereLight = new THREE.HemisphereLight(0x7fb7ff, 0x08101c, 0.42);
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.82);
  keyLight.position.set(8, 12, 10);
  const rimLight = new THREE.PointLight(0x60a5fa, 0.65, 20);
  rimLight.position.set(-8, 4, -6);
  const fillLight = new THREE.PointLight(0xf97316, 0.2, 18);
  fillLight.position.set(6, -2, 8);

  scene.add(ambientLight, hemisphereLight, keyLight, rimLight, fillLight);

  gridHelper = new THREE.GridHelper(22, 22, 0x16304d, 0x0d1c2e);
  gridHelper.position.y = -4;
  (gridHelper.material as THREE.Material).transparent = true;
  (gridHelper.material as THREE.Material).opacity = 0.3;
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
    opacity: 0.76,
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

  const pauseAutoRotate = () => {
    controls.autoRotate = false;
    lastInteractionAt = performance.now();

    if (autoRotateTimeoutId !== null) {
      window.clearTimeout(autoRotateTimeoutId);
    }

    autoRotateTimeoutId = window.setTimeout(() => {
      if (performance.now() - lastInteractionAt >= 4000 && controls) {
        controls.autoRotate = true;
      }
    }, 4100);
  };

  controls.addEventListener("start", pauseAutoRotate);
  controls.addEventListener("end", pauseAutoRotate);

  pointerDownHandler = handlePointerDown;
  pointerMoveHandler = handlePointerMove;
  pointerLeaveHandler = handlePointerLeave;
  renderer.domElement.addEventListener("pointerdown", pointerDownHandler);
  renderer.domElement.addEventListener("pointermove", pointerMoveHandler);
  renderer.domElement.addEventListener("pointerleave", pointerLeaveHandler);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const { width, height } = containerRef.value.getBoundingClientRect();
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width || 1, height || 1),
    0.3,
    0.24,
    0.42,
  );
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

  if (autoRotateTimeoutId !== null) {
    window.clearTimeout(autoRotateTimeoutId);
    autoRotateTimeoutId = null;
  }

  if (renderer?.domElement) {
    if (pointerDownHandler) renderer.domElement.removeEventListener("pointerdown", pointerDownHandler);
    if (pointerMoveHandler) renderer.domElement.removeEventListener("pointermove", pointerMoveHandler);
    if (pointerLeaveHandler) renderer.domElement.removeEventListener("pointerleave", pointerLeaveHandler);
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

  if (backgroundTexture) {
    backgroundTexture.dispose();
    backgroundTexture = null;
  }

  if (glowTexture) {
    glowTexture.dispose();
    glowTexture = null;
  }

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
  pointerLeaveHandler = null;
  hoveredMeshId = null;
  nodeMeshes.length = 0;
  nodeMap.clear();
  connectedNodeIds.clear();
  nodeVisuals.length = 0;
  connectionVisuals.length = 0;
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
