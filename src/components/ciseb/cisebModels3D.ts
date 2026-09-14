import * as THREE from 'three';

/* =========================================================
   PALETA DE CORES PADRÃO
   Centraliza os tons usados em vários ícones para evitar
   valores mágicos espalhados pelo arquivo.
========================================================= */
export const PALETTE = {
  steel: 0xd1d5db,
  metal: 0xe2e8f0,
  brass: 0xf59e0b,
  blue: 0x005bac,
  darkBlue: 0x012454,
  deepBlue: 0x012d6a,
  cyan: 0x38bdf8,
  filament: 0xf39200,
  white: 0xffffff,
} as const;

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

/** Cria um material padronizado (PBR) com suporte a emissão opcional. */
export function createStdMat(
  color: number | string,
  metalness = 0.4,
  roughness = 0.35,
  emissive?: number | string,
  emissiveIntensity = 0.35
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    metalness,
    roughness,
    emissive: emissive ? new THREE.Color(emissive) : new THREE.Color(0x000000),
    emissiveIntensity: emissive ? emissiveIntensity : 0,
    transparent: true,
    opacity: 1,
  });
}

export type Vec3Tuple = [number, number, number];

/**
 * Cria um Mesh, posiciona/rotaciona e já adiciona ao grupo pai.
 * Substitui o padrão antigo `group.add(new THREE.Mesh(...)).position.set(...)`,
 * que não funcionava como esperado: `Group.add()` retorna o próprio grupo,
 * então a chamada `.position.set(...)` encadeada reposicionava o GRUPO
 * (sobrescrevendo-se a cada chamada) em vez do mesh recém-criado.
 */
export function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position?: Vec3Tuple,
  rotation?: Vec3Tuple
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  if (position) mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

/** Gera uma extrusão com bisel padrão (usado em cabos, tampas e bases). */
export function extrudeWithBevel(
  shape: THREE.Shape,
  depth: number,
  bevelThickness = 0.6,
  bevelSize = 0.6,
  bevelSegments = 3
): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelSegments,
  });
}

/** Retângulo com cantos arredondados, usado nas telas/bases planas. */
export function roundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const w = width / 2;
  const h = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-w + radius, -h);
  shape.lineTo(w - radius, -h);
  shape.quadraticCurveTo(w, -h, w, -h + radius);
  shape.lineTo(w, h - radius);
  shape.quadraticCurveTo(w, h, w - radius, h);
  shape.lineTo(-w + radius, h);
  shape.quadraticCurveTo(-w, h, -w, h - radius);
  shape.lineTo(-w, -h + radius);
  shape.quadraticCurveTo(-w, -h, -w + radius, -h);
  shape.closePath();
  return shape;
}

/**
 * Cria um "ramo" de circuito: duas hastes conectando três pontos e uma
 * esfera (nó) na ponta. Usado no ícone de Inteligência Artificial.
 */
export function addCircuitBranch(
  parent: THREE.Object3D,
  wireMat: THREE.Material,
  nodeMat: THREE.Material,
  start: [number, number],
  mid: [number, number],
  end: [number, number]
): THREE.Mesh {
  const p1 = new THREE.Vector3(start[0], start[1], 0);
  const p2 = new THREE.Vector3(mid[0], mid[1], 0);
  const p3 = new THREE.Vector3(end[0], end[1], 0);

  const addSegment = (a: THREE.Vector3, b: THREE.Vector3) => {
    const length = a.distanceTo(b);
    if (length < 0.1) return;
    const segment = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, length, 12), wireMat);
    segment.position.copy(new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5));
    if (Math.abs(a.x - b.x) > 0.1) segment.rotation.z = Math.PI / 2;
    parent.add(segment);
  };

  addSegment(p1, p2);
  addSegment(p2, p3);

  const orb = new THREE.Mesh(new THREE.SphereGeometry(2.4, 24, 24), nodeMat);
  orb.position.copy(p3);
  parent.add(orb);
  return orb;
}

/** Parafuso/rebite sextavado — detalhe reutilizado em juntas, bases e cabos. */
export function addBolt(
  parent: THREE.Object3D,
  material: THREE.Material,
  position: Vec3Tuple,
  rotation: Vec3Tuple = [Math.PI / 2, 0, 0],
  radius = 1,
  depth = 1
): THREE.Mesh {
  return addMesh(parent, new THREE.CylinderGeometry(radius, radius, depth, 6), material, position, rotation);
}

/* =========================================================
   1. CULTURA MAKER — MARTELO E SERROTE CRUZADOS
========================================================= */
export function buildMaker3D(accent = '#F39200'): THREE.Group {
  const group = new THREE.Group();

  const steelMat = createStdMat(PALETTE.steel, 0.85, 0.2);
  const woodMat = createStdMat(accent, 0.3, 0.4, accent, 0.2);
  const darkMat = createStdMat(PALETTE.deepBlue, 0.6, 0.3);
  const brassMat = createStdMat(PALETTE.brass, 0.9, 0.2);

  // --- Serrote ---
  const sawGroup = new THREE.Group();

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, -6);
  bladeShape.lineTo(44, 4);
  bladeShape.lineTo(40, 14);
  bladeShape.lineTo(0, 10);
  bladeShape.closePath();

  addMesh(
    sawGroup,
    extrudeWithBevel(bladeShape, 1.2, 0.4, 0.4, 2),
    steelMat,
    [-18, -4, 0]
  );

  // Dentes do serrote
  for (let i = -14; i < 24; i += 3.2) {
    addMesh(
      sawGroup,
      new THREE.ConeGeometry(1.6, 2.2, 3),
      steelMat,
      [i, -8 + (i + 14) * 0.25, 0.6],
      [0, 0, Math.PI / 1.1]
    );
  }

  // Cabo com empunhadura vazada
  const handleShape = new THREE.Shape();
  handleShape.moveTo(-22, -14);
  handleShape.lineTo(-12, -8);
  handleShape.lineTo(-14, 12);
  handleShape.lineTo(-26, 8);
  handleShape.closePath();

  const holePath = new THREE.Path();
  holePath.moveTo(-20, -6);
  holePath.lineTo(-16, -4);
  holePath.lineTo(-17, 6);
  holePath.lineTo(-21, 4);
  holePath.closePath();
  handleShape.holes.push(holePath);

  addMesh(
    sawGroup,
    extrudeWithBevel(handleShape, 3.5, 0.8, 0.6, 3),
    woodMat,
    [0, 0, -1.2]
  );

  // Parafusos do cabo
  const screwGeo = () => new THREE.CylinderGeometry(1.2, 1.2, 4, 16);
  addMesh(sawGroup, screwGeo(), brassMat, [-15, 8, 0.5], [Math.PI / 2, 0, 0]);
  addMesh(sawGroup, screwGeo(), brassMat, [-14, -6, 0.5], [Math.PI / 2, 0, 0]);

  // Veios de madeira gravados no cabo (linhas finas mais escuras)
  const grainMat = createStdMat(0x000000, 0.2, 0.6, undefined, 0);
  grainMat.transparent = true;
  grainMat.opacity = 0.18;
  [-3, 1, 5].forEach((yOffset) => {
    addMesh(sawGroup, new THREE.BoxGeometry(9, 0.5, 0.2), grainMat, [-19, yOffset, 1.4], [0, 0, 0.35]);
  });

  sawGroup.rotation.z = -Math.PI / 4;
  sawGroup.position.set(0, 0, -3);
  group.add(sawGroup);

  // --- Martelo ---
  const hammerGroup = new THREE.Group();

  addMesh(hammerGroup, new THREE.CylinderGeometry(2, 2.6, 44, 24), woodMat, [0, -6, 0]);
  addMesh(hammerGroup, new THREE.CylinderGeometry(2.8, 3.2, 16, 24), darkMat, [0, -18, 0]);

  // Anéis de veio no cabo do martelo
  [4, -8, -20].forEach((y) => {
    addMesh(hammerGroup, new THREE.TorusGeometry(2.1, 0.15, 8, 20), darkMat, [0, y, 0], [Math.PI / 2, 0, 0]);
  });

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 16, 0);

  addMesh(headGroup, new THREE.BoxGeometry(9, 8, 7), steelMat);
  addMesh(
    headGroup,
    new THREE.CylinderGeometry(4.2, 4.2, 8, 24),
    steelMat,
    [-7, 0, 0],
    [0, 0, Math.PI / 2]
  );
  // Placa de identificação gravada na face superior do martelo
  addMesh(headGroup, new THREE.BoxGeometry(6, 1.2, 4.5), darkMat, [0, 4.2, 0]);

  const clawShape = new THREE.Shape();
  clawShape.moveTo(4, -3);
  clawShape.quadraticCurveTo(14, -1, 16, 8);
  clawShape.quadraticCurveTo(12, 6, 4, 3);
  clawShape.closePath();

  addMesh(
    headGroup,
    extrudeWithBevel(clawShape, 5, 0.6, 0.4, 2),
    steelMat,
    [0, 0, -2.5]
  );

  hammerGroup.add(headGroup);
  hammerGroup.rotation.z = Math.PI / 4;
  hammerGroup.position.set(0, 0, 3);
  group.add(hammerGroup);

  return group;
}

/* =========================================================
   2. CULTURA DIGITAL — CÂMERA FOTOGRÁFICA
========================================================= */
export function buildDigital3D(accent = '#38BDF8'): THREE.Group {
  const group = new THREE.Group();

  const bodyMat = createStdMat(PALETTE.blue, 0.5, 0.3);
  const darkMat = createStdMat(0x012454, 0.7, 0.2);
  const accentMat = createStdMat(accent, 0.3, 0.3, accent, 0.6);
  const metalMat = createStdMat(PALETTE.metal, 0.9, 0.1);
  const lensGlassMat = createStdMat(PALETTE.cyan, 0.2, 0.1, PALETTE.cyan, 0.8);

  // Corpo da câmera
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-24, -16);
  bodyShape.lineTo(24, -16);
  bodyShape.lineTo(24, 10);
  bodyShape.lineTo(14, 10);
  bodyShape.lineTo(10, 16);
  bodyShape.lineTo(-10, 16);
  bodyShape.lineTo(-14, 10);
  bodyShape.lineTo(-24, 10);
  bodyShape.closePath();

  addMesh(
    group,
    extrudeWithBevel(bodyShape, 12, 1.5, 1.5, 4),
    bodyMat,
    [0, 0, -6]
  );

  // Lente (externa -> anel -> interna, do maior para o menor raio)
  addMesh(
    group,
    new THREE.CylinderGeometry(14, 14, 7, 48),
    darkMat,
    [0, -3, 8],
    [Math.PI / 2, 0, 0]
  );
  addMesh(
    group,
    new THREE.CylinderGeometry(11, 11, 8, 48),
    metalMat,
    [0, -3, 8.5],
    [Math.PI / 2, 0, 0]
  );
  addMesh(
    group,
    new THREE.CylinderGeometry(8, 8, 9, 48),
    lensGlassMat,
    [0, -3, 9],
    [Math.PI / 2, 0, 0]
  );

  // Botões, visor e empunhadura
  addMesh(group, new THREE.CylinderGeometry(2.5, 2.5, 3.5, 24), metalMat, [-18, 12.5, 0]);
  addMesh(group, new THREE.CylinderGeometry(3.5, 3.5, 3, 24), darkMat, [18, 12, 0]);
  addMesh(
    group,
    new THREE.CylinderGeometry(2, 2, 2, 24),
    accentMat,
    [16, 5, 6.5],
    [Math.PI / 2, 0, 0]
  );
  addMesh(group, new THREE.BoxGeometry(4, 18, 13), darkMat, [-22, -3, 0]);

  // Corcova do visor (pentaprisma), saliente no topo central
  const viewfinderShape = new THREE.Shape();
  viewfinderShape.moveTo(-6, 0);
  viewfinderShape.lineTo(6, 0);
  viewfinderShape.lineTo(4, 4.5);
  viewfinderShape.lineTo(-4, 4.5);
  viewfinderShape.closePath();
  const viewfinder = addMesh(
    group,
    extrudeWithBevel(viewfinderShape, 9, 0.4, 0.4, 2),
    darkMat,
    [0, 16, -4.5]
  );
  viewfinder.rotation.x = -Math.PI / 2;

  // Flash pop-up à esquerda do visor
  addMesh(group, new THREE.BoxGeometry(6, 3.5, 3), metalMat, [-9, 18.2, 3]);

  // Luz de autofoco/self-timer à direita do visor
  addMesh(
    group,
    new THREE.CylinderGeometry(1.4, 1.4, 1.2, 20),
    accentMat,
    [9, 17.5, 4.5],
    [Math.PI / 2, 0, 0]
  );

  // Alças da alça de pescoço, nas laterais do corpo
  addMesh(group, new THREE.TorusGeometry(1.6, 0.5, 10, 16), metalMat, [-25, 6, 0], [0, Math.PI / 2, 0]);
  addMesh(group, new THREE.TorusGeometry(1.6, 0.5, 10, 16), metalMat, [25, 6, 0], [0, Math.PI / 2, 0]);

  return group;
}

/* =========================================================
   3. INTELIGÊNCIA ARTIFICIAL — CHIP "AI" COM CIRCUITOS
========================================================= */
export function buildIA3D(accent = '#A78BFA'): THREE.Group {
  const group = new THREE.Group();

  const chipMat = createStdMat(PALETTE.blue, 0.6, 0.3);
  const coreMat = createStdMat(PALETTE.deepBlue, 0.7, 0.3);
  const nodeMat = createStdMat(accent, 0.2, 0.2, accent, 0.9);
  const wireMat = createStdMat(PALETTE.cyan, 0.7, 0.3, PALETTE.cyan, 0.4);
  const letterMat = createStdMat(PALETTE.white, 0.2, 0.2, PALETTE.white, 0.8);

  // Baliza externa do encapsulamento (levemente maior e mais fina que o chip)
  addMesh(group, new THREE.BoxGeometry(23.5, 23.5, 3), chipMat, [0, 0, -1.5]);
  addMesh(group, new THREE.BoxGeometry(22, 22, 6), chipMat);
  addMesh(group, new THREE.BoxGeometry(18, 18, 6.6), coreMat);

  // Indicador de "pino 1", comum em encapsulamentos de chip reais
  addMesh(
    group,
    new THREE.CylinderGeometry(0.7, 0.7, 0.6, 16),
    createStdMat(PALETTE.white, 0.2, 0.3),
    [-9.5, 9.5, 3.4],
    [Math.PI / 2, 0, 0]
  );

  // Letras "AI" em relevo
  const textGroup = new THREE.Group();
  textGroup.position.set(0, 0, 3.6);

  addMesh(textGroup, new THREE.BoxGeometry(1.4, 9, 1), letterMat, [-4.5, 0, 0], [0, 0, -0.22]);
  addMesh(textGroup, new THREE.BoxGeometry(1.4, 9, 1), letterMat, [-1.5, 0, 0], [0, 0, 0.22]);
  addMesh(textGroup, new THREE.BoxGeometry(3, 1.2, 1), letterMat, [-3, -1, 0]);
  addMesh(textGroup, new THREE.BoxGeometry(1.6, 8.5, 1), letterMat, [3.5, 0, 0]);

  group.add(textGroup);

  // 12 ramificações de circuito, distribuídas nas 4 direções
  const nodes: THREE.Mesh[] = [];
  const branches: Array<[[number, number], [number, number], [number, number]]> = [
    [[-5, 11], [-12, 17], [-12, 22]],
    [[0, 11], [0, 16], [0, 24]],
    [[5, 11], [12, 17], [12, 22]],
    [[-5, -11], [-12, -17], [-12, -22]],
    [[0, -11], [0, -16], [0, -24]],
    [[5, -11], [12, -17], [12, -22]],
    [[-11, 5], [-17, 5], [-23, 5]],
    [[-11, 0], [-15, 0], [-20, 0]],
    [[-11, -5], [-17, -5], [-23, -5]],
    [[11, 5], [17, 5], [23, 5]],
    [[11, 0], [15, 0], [20, 0]],
    [[11, -5], [17, -5], [23, -5]],
  ];
  branches.forEach(([start, mid, end]) => {
    nodes.push(addCircuitBranch(group, wireMat, nodeMat, start, mid, end));
  });

  group.userData.iaNodes = nodes;
  return group;
}

/* =========================================================
   4. PROGRAMAÇÃO CRIATIVA — NOTEBOOK
========================================================= */
export function buildProgramacao3D(accent = '#22C55E'): THREE.Group {
  const group = new THREE.Group();

  const darkBlueMat = createStdMat(PALETTE.blue, 0.6, 0.3);
  const innerMat = createStdMat(PALETTE.darkBlue, 0.4, 0.3);
  const screenGlassMat = createStdMat(0x021a3b, 0.2, 0.1);
  const codeMat = createStdMat(accent, 0.2, 0.2, accent, 0.85);
  const baseLineMat = createStdMat(PALETTE.cyan, 0.8, 0.2, PALETTE.cyan, 0.4);

  // --- Tela ---
  const screenGroup = new THREE.Group();
  screenGroup.position.set(0, 6, -4);
  screenGroup.rotation.x = -Math.PI / 14;

  addMesh(
    screenGroup,
    extrudeWithBevel(roundedRectShape(32, 24, 3), 2.2),
    darkBlueMat,
    [0, 0, -1]
  );
  addMesh(screenGroup, new THREE.BoxGeometry(25, 17, 0.8), innerMat);
  addMesh(screenGroup, new THREE.BoxGeometry(23, 15, 0.4), screenGlassMat);

  // Linhas de código
  const codeLines: Array<{ x: number; y: number; w: number }> = [
    { x: -5, y: 3, w: 10 },
    { x: 3, y: 3, w: 6 },
    { x: -3, y: 0, w: 14 },
    { x: -4, y: -3, w: 11 },
  ];
  codeLines.forEach(({ x, y, w }) => {
    addMesh(screenGroup, new THREE.BoxGeometry(w, 1.2, 0.2), codeMat, [x, y, 2.1]);
  });
  group.add(screenGroup);

  // --- Base / teclado ---
  const baseGroup = new THREE.Group();
  baseGroup.position.set(0, -9, 4);

  const baseShape = new THREE.Shape();
  baseShape.moveTo(-16, 5);
  baseShape.lineTo(16, 5);
  baseShape.lineTo(21, -8);
  baseShape.lineTo(-21, -8);
  baseShape.closePath();

  const baseMesh = addMesh(baseGroup, extrudeWithBevel(baseShape, 2.2), darkBlueMat);
  baseMesh.rotation.x = Math.PI / 2.3;

  addMesh(baseGroup, new THREE.BoxGeometry(42, 1.6, 1.8), baseLineMat, [0, -7, 10]);

  // Teclado: grade de teclas sobre a base, seguindo a mesma inclinação
  const keyboardGroup = new THREE.Group();
  keyboardGroup.rotation.x = Math.PI / 2.3;
  keyboardGroup.position.set(0, -4.5, 3.5);
  const keyMat = createStdMat(0x021a3b, 0.3, 0.4);
  const keyCols = 10;
  const keyRows = 3;
  const keySpacing = 2.7;
  for (let row = 0; row < keyRows; row++) {
    for (let col = 0; col < keyCols; col++) {
      const x = (col - (keyCols - 1) / 2) * keySpacing;
      const y = (row - (keyRows - 1) / 2) * keySpacing;
      addMesh(keyboardGroup, new THREE.BoxGeometry(2.1, 2.1, 0.6), keyMat, [x, y, 0]);
    }
  }
  baseGroup.add(keyboardGroup);

  // Trackpad, abaixo do teclado, na mesma inclinação da base
  const trackpad = addMesh(
    baseGroup,
    new THREE.BoxGeometry(11, 7, 0.4),
    createStdMat(0x021a3b, 0.3, 0.3)
  );
  trackpad.rotation.x = Math.PI / 2.3;
  trackpad.position.set(0, -8, 7.5);

  group.add(baseGroup);
  return group;
}

/* =========================================================
   5. PROTOTIPAGEM — IMPRESSORA 3D IMPRIMINDO "3D"
========================================================= */
export function buildPrototipagem3D(accent = '#F97316'): THREE.Group {
  const group = new THREE.Group();

  const blueMat = createStdMat(PALETTE.blue, 0.6, 0.3);
  const metalMat = createStdMat(PALETTE.steel, 0.9, 0.15);
  const accentMat = createStdMat(accent, 0.2, 0.2, accent, 0.85);
  const filamentMat = createStdMat(PALETTE.filament, 0.3, 0.3, PALETTE.filament, 0.6);
  const lcdMat = createStdMat(PALETTE.cyan, 0.2, 0.2, PALETTE.cyan, 0.8);
  const bedMat = createStdMat(PALETTE.darkBlue, 0.8, 0.2);

  // Base e painel LCD
  addMesh(group, new THREE.BoxGeometry(44, 6, 32), blueMat, [0, -16, 0]);
  addMesh(group, new THREE.BoxGeometry(13, 3.8, 0.5), metalMat, [-8, -16, 16.1]);
  addMesh(group, new THREE.BoxGeometry(12, 3, 0.8), lcdMat, [-8, -16, 16.2]);
  addMesh(
    group,
    new THREE.CylinderGeometry(2.5, 2.5, 1.2, 24),
    metalMat,
    [10, -16, 16.4],
    [Math.PI / 2, 0, 0]
  );

  // Pés de apoio nos quatro cantos da base
  const footMat = createStdMat(0x1f2937, 0.2, 0.7);
  [
    [-19, -19.3, -13],
    [19, -19.3, -13],
    [-19, -19.3, 13],
    [19, -19.3, 13],
  ].forEach((pos) => {
    addMesh(group, new THREE.CylinderGeometry(1.6, 1.6, 1.4, 16), footMat, pos as Vec3Tuple);
  });

  // 4 colunas
  const columnPositions: Vec3Tuple[] = [
    [-18, 2, -12],
    [18, 2, -12],
    [-18, 2, 12],
    [18, 2, 12],
  ];
  columnPositions.forEach((pos) => {
    addMesh(group, new THREE.CylinderGeometry(1.2, 1.2, 34, 16), blueMat, pos);
  });

  // Topo e carretel de filamento
  addMesh(group, new THREE.BoxGeometry(44, 3, 30), blueMat, [0, 19, 0]);
  addMesh(
    group,
    new THREE.TorusGeometry(7, 2.2, 16, 32),
    filamentMat,
    [18, 8, 0],
    [0, Math.PI / 2, 0]
  );

  const tubeCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(18, 14, 0),
    new THREE.Vector3(0, 24, 0),
    new THREE.Vector3(0, 12, 0)
  );
  addMesh(group, new THREE.TubeGeometry(tubeCurve, 20, 0.8, 12, false), filamentMat);

  // Extrusor e mesa de impressão
  addMesh(group, new THREE.BoxGeometry(8, 7, 8), blueMat, [0, 7, 0]);
  addMesh(
    group,
    new THREE.ConeGeometry(1.5, 3, 16),
    metalMat,
    [0, 2.5, 0],
    [Math.PI, 0, 0]
  );
  addMesh(group, new THREE.BoxGeometry(28, 2.5, 24), bedMat, [0, -11, 0]);

  // Clipes que prendem a mesa de impressão, nos quatro cantos
  [
    [-12, -9.5, -10],
    [12, -9.5, -10],
    [-12, -9.5, 10],
    [12, -9.5, 10],
  ].forEach((pos) => {
    addMesh(group, new THREE.BoxGeometry(2.5, 1.2, 2.5), metalMat, pos as Vec3Tuple);
  });

  // Peça "3D" sendo impressa
  const printGroup = new THREE.Group();
  printGroup.position.set(0, -5, 0);

  // Número "3" (três segmentos horizontais + haste vertical central)
  addMesh(printGroup, new THREE.BoxGeometry(5.5, 1.8, 3), accentMat, [-4, 3, 0]);
  addMesh(printGroup, new THREE.BoxGeometry(4.5, 1.8, 3), accentMat, [-4.5, 0, 0]);
  addMesh(printGroup, new THREE.BoxGeometry(5.5, 1.8, 3), accentMat, [-4, -3, 0]);
  addMesh(printGroup, new THREE.BoxGeometry(1.8, 7.8, 3), accentMat, [-1.8, 0, 0]);

  // Letra "D" (haste vertical + curva)
  addMesh(printGroup, new THREE.BoxGeometry(1.8, 7.8, 3), accentMat, [2, 0, 0]);
  addMesh(
    printGroup,
    new THREE.TorusGeometry(3.5, 1.2, 16, 24, Math.PI),
    accentMat,
    [2.5, 0, 0],
    [0, 0, -Math.PI / 2]
  );

  group.add(printGroup);
  return group;
}

/* =========================================================
   6. ROBÓTICA — BRAÇO ROBÓTICO ARTICULADO COM GARRA
========================================================= */
export function buildRobotica3D(accent = '#06B6D4'): THREE.Group {
  const group = new THREE.Group();

  const blueMat = createStdMat(PALETTE.blue, 0.6, 0.3);
  const metalMat = createStdMat(PALETTE.metal, 0.9, 0.15);
  const accentMat = createStdMat(accent, 0.2, 0.2, accent, 0.85);

  // Base
  addMesh(group, new THREE.CylinderGeometry(14, 16, 3, 32), blueMat, [-6, -18, 0]);
  addMesh(group, new THREE.BoxGeometry(10, 8, 8), blueMat, [-6, -13, 0]);

  // Parafusos de fixação da base, distribuídos ao redor da placa
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
    addBolt(
      group,
      metalMat,
      [-6 + Math.cos(angle) * 12, -16.5, Math.sin(angle) * 12],
      [Math.PI / 2, 0, 0],
      1
    );
  }

  // Junta 1 — ombro
  addMesh(
    group,
    new THREE.CylinderGeometry(4.5, 4.5, 8, 24),
    metalMat,
    [-6, -8, 0],
    [Math.PI / 2, 0, 0]
  );

  // Braço inferior
  const arm1 = addMesh(group, new THREE.BoxGeometry(5, 22, 6), blueMat, [-11, 0, 0]);
  arm1.rotation.z = Math.PI / 6;

  // Junta 2 — cotovelo
  addMesh(
    group,
    new THREE.CylinderGeometry(6, 6, 8, 24),
    blueMat,
    [-16, 9, 0],
    [Math.PI / 2, 0, 0]
  );
  addMesh(
    group,
    new THREE.CylinderGeometry(2.5, 2.5, 9, 24),
    metalMat,
    [-16, 9, 0],
    [Math.PI / 2, 0, 0]
  );

  // Braço superior
  const arm2 = addMesh(group, new THREE.BoxGeometry(4.5, 20, 5), blueMat, [-3, 16, 0]);
  arm2.rotation.z = -Math.PI / 3;

  // Junta 3 — punho
  addMesh(
    group,
    new THREE.CylinderGeometry(4.5, 4.5, 6, 24),
    metalMat,
    [7, 21, 0],
    [Math.PI / 2, 0, 0]
  );

  const wrist = addMesh(group, new THREE.BoxGeometry(3.5, 9, 4), blueMat, [12, 17, 0]);
  wrist.rotation.z = -Math.PI / 4;

  // Cabo flexível acompanhando o braço, da base até o punho
  const cablePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3, -10, 4),
    new THREE.Vector3(-13, 2, 4),
    new THREE.Vector3(-18, 12, 4),
    new THREE.Vector3(-6, 19, 4),
    new THREE.Vector3(9, 20, 4),
  ]);
  addMesh(group, new THREE.TubeGeometry(cablePath, 32, 0.8, 8, false), createStdMat(0x1f2937, 0.3, 0.6));

  // Parafusos visíveis nas juntas do cotovelo e do punho
  addBolt(group, metalMat, [-16, 9, 4.5], [Math.PI / 2, 0, 0], 1.1);
  addBolt(group, metalMat, [7, 21, 3.5], [Math.PI / 2, 0, 0], 1.1);

  addMesh(
    group,
    new THREE.CylinderGeometry(3.5, 3.5, 5, 24),
    accentMat,
    [16, 13, 0],
    [Math.PI / 2, 0, 0]
  );

  // Dedo superior da garra
  const fingerTop = addMesh(group, new THREE.BoxGeometry(2.8, 10, 3), accentMat, [21, 16, 0]);
  fingerTop.rotation.z = -Math.PI / 3.5;
  const clawTip1 = addMesh(group, new THREE.BoxGeometry(2.8, 6, 3), metalMat, [24, 11, 0]);
  clawTip1.rotation.z = Math.PI / 4;

  // Dedo inferior da garra
  const fingerBot = addMesh(group, new THREE.BoxGeometry(2.8, 10, 3), accentMat, [18, 6, 0]);
  fingerBot.rotation.z = Math.PI / 5;
  const clawTip2 = addMesh(group, new THREE.BoxGeometry(2.8, 6, 3), metalMat, [22, 4, 0]);
  clawTip2.rotation.z = -Math.PI / 4;

  return group;
}

/* =========================================================
   REGISTRO CENTRAL DOS ÍCONES
   Facilita selecionar/iterar os builders por chave (ex.: em um
   componente React que renderiza o ícone de cada categoria).
========================================================= */
export const ICON_BUILDERS = {
  maker: buildMaker3D,
  digital: buildDigital3D,
  ia: buildIA3D,
  programacao: buildProgramacao3D,
  prototipagem: buildPrototipagem3D,
  robotica: buildRobotica3D,
} as const;

export type IconKey = keyof typeof ICON_BUILDERS;
