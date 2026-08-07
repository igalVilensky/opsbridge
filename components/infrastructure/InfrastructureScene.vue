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
}>();

const emit = defineEmits<{
  (event: "select-node", node: InfrastructureNode): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let controls: { update: () => void; dispose: () => void } | null = null;
let animationFrameId = 0;
let resizeObserver: ResizeObserver | null = null;
let isMounted = false;
let isInitialized = false;
let pointerDownHandler: ((event: PointerEvent) => void) | null = null;
let connectionGroup: THREE.Group | null = null;
let nodeGroup: THREE.Group | null = null;
let gridHelper: THREE.GridHelper | null = null;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const nodeMeshes: THREE.Mesh[] = [];
const nodeMap = new Map<string, InfrastructureNode>();

function clearGroup(group: THREE.Group) {
  group.traverse((object) => {
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

  if (!material) {
    return;
  }

  if (Array.isArray(material)) {
    for (const entry of material) {
      entry.dispose();
    }
    return;
  }

  material.dispose();
}

function statusColor(status: InfrastructureNode["status"]) {
  if (status === "healthy") return 0x22c55e;
  if (status === "degraded") return 0xf59e0b;
  return 0x94a3b8;
}

function typeColor(type: InfrastructureNode["type"]) {
  if (type === "application") return 0x60a5fa;
  if (type === "integration") return 0x38bdf8;
  if (type === "database") return 0xa78bfa;
  return 0xf97316;
}

function createNodeGeometry(type: InfrastructureNode["type"]) {
  if (type === "integration") {
    return new THREE.CylinderGeometry(0.55, 0.55, 1.1, 12);
  }

  if (type === "database") {
    return new THREE.SphereGeometry(0.6, 24, 16);
  }

  if (type === "ai") {
    return new THREE.IcosahedronGeometry(0.65, 0);
  }

  return new THREE.BoxGeometry(1.25, 0.8, 0.85);
}

function rebuildSceneGraph() {
  if (!scene || !nodeGroup || !connectionGroup) {
    return;
  }

  clearGroup(nodeGroup);
  clearGroup(connectionGroup);
  nodeMeshes.length = 0;
  nodeMap.clear();

  for (const node of props.nodes) {
    nodeMap.set(node.id, node);

    const geometry = createNodeGeometry(node.type);
    const material = new THREE.MeshStandardMaterial({
      color: typeColor(node.type),
      emissive: statusColor(node.status),
      emissiveIntensity: node.status === "healthy" ? 0.18 : node.status === "degraded" ? 0.12 : 0.04,
      roughness: 0.45,
      metalness: 0.08,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(node.position.x, node.position.y, node.position.z);
    mesh.userData.nodeId = node.id;
    mesh.userData.nodeType = node.type;
    nodeGroup.add(mesh);
    nodeMeshes.push(mesh);

    const outline = new THREE.Mesh(
      geometry.clone(),
      new THREE.MeshBasicMaterial({
        color: statusColor(node.status),
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      }),
    );
    outline.position.copy(mesh.position);
    outline.scale.setScalar(1.05);
    outline.userData.nodeId = node.id;
    nodeGroup.add(outline);
  }

  for (const connection of props.connections) {
    const fromNode = nodeMap.get(connection.from);
    const toNode = nodeMap.get(connection.to);

    if (!fromNode || !toNode) {
      continue;
    }

    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(fromNode.position.x, fromNode.position.y, fromNode.position.z),
      new THREE.Vector3(toNode.position.x, toNode.position.y, toNode.position.z),
    ]);

    const material = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.65,
    });

    const line = new THREE.Line(geometry, material);
    connectionGroup.add(line);
  }
}

function resizeRenderer() {
  if (!containerRef.value || !camera || !renderer) {
    return;
  }

  const { width, height } = containerRef.value.getBoundingClientRect();

  if (!width || !height) {
    return;
  }

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function handlePointerDown(event: PointerEvent) {
  if (!camera || !renderer) {
    return;
  }

  const rect = renderer.domElement.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return;
  }

  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const intersections = raycaster.intersectObjects(nodeMeshes, false);
  const hit = intersections[0];

  if (!hit) {
    return;
  }

  const nodeId = hit.object.userData.nodeId;
  const selectedNode = nodeMap.get(nodeId);

  if (selectedNode) {
    emit("select-node", selectedNode);
  }
}

function animate() {
  if (!renderer || !scene || !camera) {
    return;
  }

  animationFrameId = window.requestAnimationFrame(animate);
  controls?.update();
  renderer.render(scene, camera);
}

async function initializeScene() {
  if (!containerRef.value || isInitialized) {
    return;
  }

  const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08111f);
  scene.fog = new THREE.Fog(0x08111f, 12, 30);

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 6.5, 15);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x08111f, 1);
  renderer.domElement.className = "block h-full w-full";
  containerRef.value.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
  const hemisphereLight = new THREE.HemisphereLight(0x8bc5ff, 0x0f172a, 0.9);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
  directionalLight.position.set(8, 12, 10);

  scene.add(ambientLight, hemisphereLight, directionalLight);

  gridHelper = new THREE.GridHelper(22, 22, 0x223045, 0x152233);
  gridHelper.position.y = -4;
  scene.add(gridHelper);

  nodeGroup = new THREE.Group();
  connectionGroup = new THREE.Group();
  scene.add(connectionGroup, nodeGroup);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 6;
  controls.maxDistance = 24;
  controls.target.set(0, 0, 0);
  controls.update();

  pointerDownHandler = handlePointerDown;
  renderer.domElement.addEventListener("pointerdown", pointerDownHandler);

  resizeRenderer();
  rebuildSceneGraph();
  animate();
  isInitialized = true;

  resizeObserver = new ResizeObserver(() => {
    resizeRenderer();
  });

  resizeObserver.observe(containerRef.value);
}

function cleanupScene() {
  window.cancelAnimationFrame(animationFrameId);

  if (pointerDownHandler && renderer?.domElement) {
    renderer.domElement.removeEventListener("pointerdown", pointerDownHandler);
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

  if (gridHelper) {
    scene?.remove(gridHelper);
    disposeRenderable(gridHelper);
    gridHelper = null;
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
  nodeMeshes.length = 0;
  nodeMap.clear();
  isInitialized = false;
}

watch(
  () => [props.nodes, props.connections],
  () => {
    if (!isMounted || !isInitialized) {
      return;
    }

    rebuildSceneGraph();
  },
  { deep: true },
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
  </div>
</template>
