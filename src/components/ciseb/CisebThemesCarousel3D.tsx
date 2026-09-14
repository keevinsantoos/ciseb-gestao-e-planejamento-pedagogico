import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Rotate3d } from 'lucide-react';

import roboticaSvg from './icons/robotica.svg?raw';
import iaSvg from './icons/ia.svg?raw';
import prototipagemSvg from './icons/prototipagem.svg?raw';
import cameraSvg from './icons/camera.svg?raw';
import notebookSvg from './icons/notebook.svg?raw';
import impressora3dSvg from './icons/impressora3d.svg?raw';
import { ICON_BUILDERS, IconKey } from './cisebModels3D';

/* =========================================================
   TIPOS
========================================================= */
export type ThemeItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  svg: string;
  accent: string;
};

/* =========================================================
   OS 6 TEMAS OFICIAIS CISEB (ORDEM E PADRÃO VISUAL OFICIAL)
========================================================= */
export const CISEB_THEMES: ThemeItem[] = [
  {
    id: 'maker',
    title: 'Cultura Maker',
    subtitle: 'Criar, construir e experimentar',
    description:
      'Aprendizagem prática baseada em criatividade, ferramentas, prototipagem rápida e resolução colaborativa de problemas.',
    svg: prototipagemSvg,
    accent: '#F39200',
  },
  {
    id: 'digital',
    title: 'Cultura Digital',
    subtitle: 'Tecnologia e cidadania digital',
    description:
      'Tecnologias digitais, fotografia, mídias criativas e participação ativa e consciente no mundo conectado.',
    svg: cameraSvg,
    accent: '#38BDF8',
  },
  {
    id: 'ia',
    title: 'Inteligência Artificial',
    subtitle: 'IA aplicada à educação',
    description:
      'Exploração ética e inovadora da inteligência artificial para personalização da aprendizagem e automação criativa.',
    svg: iaSvg,
    accent: '#A78BFA',
  },
  {
    id: 'programacao',
    title: 'Programação Criativa',
    subtitle: 'Código como ferramenta de criação',
    description:
      'Pensamento computacional, lógica algorítmica, desenvolvimento de software e projetos digitais interativos.',
    svg: notebookSvg,
    accent: '#22C55E',
  },
  {
    id: 'prototipagem',
    title: 'Prototipagem e Fabricação Digital',
    subtitle: 'Da ideia ao protótipo real',
    description:
      'Modelagem tridimensional, impressão 3D, manufatura aditiva e materialização de ideias em protótipos funcionais.',
    svg: impressora3dSvg,
    accent: '#F97316',
  },
  {
    id: 'robotica',
    title: 'Robótica e Modelagem',
    subtitle: 'Sistemas inteligentes e automação',
    description:
      'Robótica educacional, braços mecânicos industriais, sensores, atuadores e automação de sistemas.',
    svg: roboticaSvg,
    accent: '#06B6D4',
  },
];

/* =========================================================
   CONFIGURAÇÕES & UTILITÁRIOS
========================================================= */
const AUTO_CHANGE_TIME = 10000; // 10 segundos por tema (1 giro completo de 360°)
const ROTATION_SPEED_RAD_PER_SEC = (2 * Math.PI) / (AUTO_CHANGE_TIME / 1000); // Exatamente 2π radianos no tempo do tema
const FALLBACK_DEG_PER_SEC = 360 / (AUTO_CHANGE_TIME / 1000); // 360° em 10s
const TRANSITION_TIME = 750; // 750ms

function normalizeIndex(index: number, total: number) {
  return ((index % total) + total) % total;
}

function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/* =========================================================
   FÁBRICA CENTRAL DOS 6 MODELOS 3D DO CISEB
========================================================= */
function createCiseb3DModel(themeId: string, accent: string): THREE.Group {
  const root = new THREE.Group();
  root.name = `CISEB_MODEL_${themeId.toUpperCase()}`;

  const builder = ICON_BUILDERS[themeId as IconKey] || ICON_BUILDERS.maker;
  const content = builder(accent);

  root.add(content);
  return root;
}

/* =========================================================
   AJUSTE DE OPACIDADE EM MATERIAIS
========================================================= */
function setOpacity(object: THREE.Object3D, opacity: number) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach((item) => {
        item.transparent = true;
        item.opacity = opacity;
      });
    } else if (material) {
      material.transparent = true;
      material.opacity = opacity;
    }
  });
}

/* =========================================================
   DESCARTA RECURSOS THREE.JS
========================================================= */
function disposeModel(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((mat) => mat.dispose());
    } else if (mesh.material) {
      mesh.material.dispose();
    }
  });
}

/* =========================================================
   COMPONENTE PRINCIPAL DO EXPOSITOR 3D CISEB
========================================================= */
export default function CisebThemesCarousel3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const activeModelRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const modelsRef = useRef<Map<string, THREE.Group>>(new Map());
  const themeLightRef = useRef<THREE.PointLight | null>(null);

  const transitionRef = useRef({
    active: false,
    start: 0,
    oldModel: null as THREE.Group | null,
    newModel: null as THREE.Group | null,
  });

  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const draggingRef = useRef(false);
  const pointerXRef = useRef(0);
  const clockRef = useRef(new THREE.Clock());

  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [webglSupported, setWebglSupported] = useState(false); // Force false to remove canvas
  const [fallbackRotationDeg, setFallbackRotationDeg] = useState(0);

  const currentTheme = CISEB_THEMES[currentIndex];

  /* -------------------------------------------------------
     PREFERS REDUCED MOTION
  ------------------------------------------------------- */
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  /* -------------------------------------------------------
     NAVEGAÇÃO ENTRE TEMAS
  ------------------------------------------------------- */
  const goTo = useCallback((index: number) => {
    setCurrentIndex((prev) => {
      const next = normalizeIndex(index, CISEB_THEMES.length);
      return next === prev ? prev : next;
    });
  }, []);

  const next = useCallback(() => {
    goTo(currentIndex + 1);
  }, [currentIndex, goTo]);

  const previous = useCallback(() => {
    goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  /* -------------------------------------------------------
     CARROSSEL AUTOMÁTICO (10s)
  ------------------------------------------------------- */
  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      next();
    }, AUTO_CHANGE_TIME);

    return () => clearInterval(interval);
  }, [paused, next]);

  /* -------------------------------------------------------
     FALLBACK 2.5D: ROTAÇÃO AUTOMÁTICA
  ------------------------------------------------------- */
  useEffect(() => {
    if (webglSupported || paused || prefersReducedMotion) return;

    let rafId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      setFallbackRotationDeg((deg) => (deg + delta * FALLBACK_DEG_PER_SEC) % 360);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [webglSupported, paused, prefersReducedMotion]);

  /* -------------------------------------------------------
     TROCA DE MODELO 3D NA CENA
  ------------------------------------------------------- */
  const switch3DModel = useCallback((themeIndex: number) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const targetTheme = CISEB_THEMES[themeIndex];
    if (!targetTheme) return;

    if (themeLightRef.current) {
      themeLightRef.current.color.set(targetTheme.accent);
    }

    let model = modelsRef.current.get(targetTheme.id);
    if (!model) {
      model = createCiseb3DModel(targetTheme.id, targetTheme.accent);
      modelsRef.current.set(targetTheme.id, model);
    }

    const oldModel = activeModelRef.current;
    if (oldModel === model) {
      setOpacity(model, 1);
      model.scale.setScalar(1);
      return;
    }

    // Se o novo modelo já estava na cena por algum motivo, remove antes de reposicionar
    if (model.parent) {
      model.parent.remove(model);
    }

    model.position.set(0, 4, 0);
    model.scale.setScalar(0.72);
    model.rotation.y = rotationRef.current;
    setOpacity(model, 0.1);
    scene.add(model);

    // Finaliza transição anterior se houver
    if (transitionRef.current.active && transitionRef.current.oldModel) {
      scene.remove(transitionRef.current.oldModel);
    }

    transitionRef.current = {
      active: true,
      start: performance.now(),
      oldModel,
      newModel: model,
    };

    activeModelRef.current = model;

    // Pré-carrega o modelo seguinte na memória sem destruí-lo
    const nextIdx = normalizeIndex(themeIndex + 1, CISEB_THEMES.length);
    const nextTheme = CISEB_THEMES[nextIdx];
    if (!modelsRef.current.has(nextTheme.id)) {
      const nextModel = createCiseb3DModel(nextTheme.id, nextTheme.accent);
      modelsRef.current.set(nextTheme.id, nextModel);
    }
  }, []);

  /* -------------------------------------------------------
     INICIALIZAÇÃO DA CENA THREE.JS
  ------------------------------------------------------- */
  useEffect(() => {
    if (!isWebGLAvailable()) {
      setWebglSupported(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 450;
    const height = container.clientHeight || 360;

    // SCENE
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // CAMERA
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);
    camera.position.set(0, 14, 115);
    camera.lookAt(0, 5, 0);
    cameraRef.current = camera;

    // RENDERER COM CAPTURA DE ERRO E CONTEXT LOSS
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'default',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;
    } catch (err) {
      console.warn('WebGL indisponível, ativando visualizador 2.5D', err);
      setWebglSupported(false);
      return;
    }

    const onContextLost = (e: Event) => {
      e.preventDefault();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setWebglSupported(false);
    };

    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // LUZES
    const ambient = new THREE.AmbientLight(0xffffff, 2.6);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    keyLight.position.set(50, 70, 80);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xa5f3fc, 2.0);
    fillLight.position.set(-50, 40, -50);
    scene.add(fillLight);

    const blueLight = new THREE.PointLight(0x005bac, 4.5, 300);
    blueLight.position.set(-60, 20, 50);
    scene.add(blueLight);

    const initialTheme = CISEB_THEMES[currentIndex] || CISEB_THEMES[0];
    const themeLight = new THREE.PointLight(new THREE.Color(initialTheme.accent), 6.0, 280);
    themeLight.position.set(50, 25, 50);
    scene.add(themeLight);
    themeLightRef.current = themeLight;

    // PEDESTAL TECNOLÓGICO
    const baseGeometry = new THREE.CylinderGeometry(34, 38, 2.5, 48);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x012454,
      metalness: 0.9,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -17;
    base.receiveShadow = true;
    scene.add(base);

    // ANÉIS HOLOGRÁFICOS CONCÊNTRICOS
    const ringGeometry = new THREE.TorusGeometry(36, 0.6, 16, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -16;
    scene.add(ring);

    const ringAccentGeometry = new THREE.TorusGeometry(40, 0.4, 12, 64);
    const ringAccentMaterial = new THREE.MeshBasicMaterial({
      color: 0xf39200,
      transparent: true,
      opacity: 0.5,
    });
    const ringAccent = new THREE.Mesh(ringAccentGeometry, ringAccentMaterial);
    ringAccent.rotation.x = Math.PI / 2;
    ringAccent.position.y = -16;
    scene.add(ringAccent);

    // INSERE O MODELO ATUAL IMEDIATAMENTE NA CENA
    let currentModel = modelsRef.current.get(initialTheme.id);
    if (!currentModel) {
      currentModel = createCiseb3DModel(initialTheme.id, initialTheme.accent);
      modelsRef.current.set(initialTheme.id, currentModel);
    }
    currentModel.position.set(0, 5, 0);
    currentModel.scale.setScalar(0.95);
    setOpacity(currentModel, 1);
    scene.add(currentModel);
    activeModelRef.current = currentModel;

    // EVENTOS DE PONTEIRO / ARRASTE
    const pointerDown = (event: PointerEvent) => {
      draggingRef.current = true;
      pointerXRef.current = event.clientX;
      try {
        container.setPointerCapture?.(event.pointerId);
      } catch {
        // Ignora
      }
    };

    const pointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const delta = event.clientX - pointerXRef.current;
      pointerXRef.current = event.clientX;
      targetRotationRef.current += delta * 0.015;
    };

    const pointerUp = (event: PointerEvent) => {
      draggingRef.current = false;
      try {
        container.releasePointerCapture?.(event.pointerId);
      } catch {
        // Ignora
      }
    };

    container.addEventListener('pointerdown', pointerDown);
    container.addEventListener('pointermove', pointerMove);
    container.addEventListener('pointerup', pointerUp);
    container.addEventListener('pointercancel', pointerUp);

    // RESIZE OBSERVER SEGURO
    let resizeFrameId: number | null = null;
    let lastW = width;
    let lastH = height;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const newW = Math.floor(entry.contentRect.width);
      const newH = Math.floor(entry.contentRect.height);

      if (newW <= 0 || newH <= 0) return;
      if (newW === lastW && newH === lastH) return;

      if (resizeFrameId !== null) {
        cancelAnimationFrame(resizeFrameId);
      }

      resizeFrameId = requestAnimationFrame(() => {
        lastW = newW;
        lastH = newH;
        if (!cameraRef.current || !rendererRef.current) return;
        cameraRef.current.aspect = newW / newH;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newW, newH, false);
      });
    });

    resizeObserver.observe(container);

    // LOOP DE ANIMAÇÃO THREE.JS
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();

      if (!draggingRef.current && !prefersReducedMotion) {
        targetRotationRef.current += delta * ROTATION_SPEED_RAD_PER_SEC;
      }

      rotationRef.current +=
        (targetRotationRef.current - rotationRef.current) * Math.min(delta * 8, 1);

      if (activeModelRef.current) {
        activeModelRef.current.rotation.y = rotationRef.current;
        if (!prefersReducedMotion) {
          activeModelRef.current.position.y = 5 + Math.sin(performance.now() * 0.0018) * 1.2;

          // Animação interna de nós da IA
          const iaNodes = activeModelRef.current.children[0]?.userData?.iaNodes as THREE.Mesh[] | undefined;
          if (iaNodes) {
            const t = performance.now() * 0.004;
            iaNodes.forEach((node, i) => {
              const scale = 1 + Math.sin(t + i * 0.5) * 0.15;
              node.scale.setScalar(scale);
            });
          }
        }
      }

      ring.rotation.z += delta * 0.1;
      ringAccent.rotation.z -= delta * 0.06;

      // TRANSIÇÃO FLUIDA ENTRE MODELOS
      const transition = transitionRef.current;
      if (transition.active && transition.newModel) {
        const elapsed = performance.now() - transition.start;
        const progress = Math.min(elapsed / TRANSITION_TIME, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        transition.newModel.scale.setScalar(0.75 + eased * 0.25);
        setOpacity(transition.newModel, Math.max(eased, 0.1));

        if (transition.oldModel && transition.oldModel !== transition.newModel) {
          transition.oldModel.scale.setScalar(1 - eased * 0.15);
          transition.oldModel.rotation.y += delta * 0.3;
          setOpacity(transition.oldModel, Math.max(1 - eased, 0));
        }

        if (progress >= 1) {
          if (transition.oldModel && transition.oldModel !== transition.newModel) {
            scene.remove(transition.oldModel);
            // IMPORTANTE: Não chamamos disposeModel aqui para manter o modelo reutilizável no cache!
          }
          transition.oldModel = null;
          transition.active = false;
          transition.newModel.scale.setScalar(1);
          setOpacity(transition.newModel, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      if (resizeFrameId !== null) {
        cancelAnimationFrame(resizeFrameId);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
      container.removeEventListener('pointerdown', pointerDown);
      container.removeEventListener('pointermove', pointerMove);
      container.removeEventListener('pointerup', pointerUp);
      container.removeEventListener('pointercancel', pointerUp);

      modelsRef.current.forEach((mod) => disposeModel(mod));
      modelsRef.current.clear();

      baseGeometry.dispose();
      baseMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      ringAccentGeometry.dispose();
      ringAccentMaterial.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, [prefersReducedMotion]);

  /* -------------------------------------------------------
     SINCRONIZAÇÃO COM O ÍNDICE ATUAL DO TEMA
  ------------------------------------------------------- */
  useEffect(() => {
    switch3DModel(currentIndex);
  }, [currentIndex, switch3DModel]);

  /* -------------------------------------------------------
     ATALHOS DE TECLADO (ArrowLeft, ArrowRight, Space)
  ------------------------------------------------------- */
  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        previous();
      } else if (event.key === 'ArrowRight') {
        next();
      } else if (event.key === ' ') {
        event.preventDefault();
        setPaused((v) => !v);
      }
    };

    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [next, previous]);

  /* -------------------------------------------------------
     RENDER DO EXPOSITOR
  ------------------------------------------------------- */
  return (
    <section
      className="relative flex h-full min-h-full w-full flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#012d6a] via-[#005BAC] to-[#013780] text-white select-none"
      aria-label="Expositor 3D dos seis temas do CISEB"
    >
      {/* ── ILUMINAÇÃO DINÂMICA DE FUNDO ─── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full blur-3xl transition-colors duration-1000 opacity-30"
          style={{ backgroundColor: currentTheme.accent }}
        />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#F39200]/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '22px 22px',
          }}
        />
      </div>

      {/* ── CORPO PRINCIPAL DO EXPOSITOR (FLEX COM CABEÇALHO, 3D E RODAPÉ) ─── */}
      <div className="relative z-10 flex h-full min-h-full min-w-0 flex-1 flex-col justify-between p-4 sm:p-6 lg:p-8">
        
        {/* 1. TOPO: Identidade Institucional */}
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1 text-left min-w-0">
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
              Tecnologia, Criatividade <span className="text-sky-200">& Inovação</span>
            </h2>
            <p className="text-xs sm:text-sm text-sky-100/80 leading-relaxed max-w-md hidden sm:block">
              Conheça os seis pilares metodológicos e tecnológicos que orientam as atividades práticas nos Centros de Inovação.
            </p>
          </div>
        </div>

        {/* 2. ÁREA CENTRAL: CANVAS 3D INTERATIVO OU FALLBACK 2.5D */}
        <div className="relative my-auto flex min-h-[220px] sm:min-h-[260px] lg:min-h-[300px] flex-1 items-center justify-center min-w-0">
          {webglSupported ? (
            <div
              ref={containerRef}
              className="h-full w-full min-h-[220px] sm:min-h-[260px] lg:min-h-[300px] max-w-[620px] touch-none cursor-grab active:cursor-grabbing flex items-center justify-center"
              title="Arraste para girar o modelo 3D"
            />
          ) : (
            <div
              className="relative flex h-full w-full min-h-[220px] sm:min-h-[260px] lg:min-h-[290px] max-w-[500px] flex-col items-center justify-center select-none cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                const startX = e.clientX;
                const startDeg = fallbackRotationDeg;
                const onMove = (moveEvent: PointerEvent) => {
                  const deltaX = moveEvent.clientX - startX;
                  setFallbackRotationDeg(startDeg + deltaX * 0.8);
                };
                const onUp = () => {
                  window.removeEventListener('pointermove', onMove);
                  window.removeEventListener('pointerup', onUp);
                };
                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp);
              }}
            >
              <div className="relative flex flex-col items-center justify-center">
                <div
                  className="relative z-10 p-6 sm:p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-700 flex items-center justify-center"
                  style={{
                    transform: `perspective(800px) rotateY(${fallbackRotationDeg}deg) rotateX(8deg)`,
                    boxShadow: `0 20px 50px -10px ${currentTheme.accent}50, inset 0 1px 1px 0 rgba(255,255,255,0.3)`,
                  }}
                >
                  <div
                    className="w-24 h-24 sm:w-32 sm:h-32 transition-all duration-700 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:drop-shadow-lg"
                    style={{
                      filter: `drop-shadow(0 0 16px ${currentTheme.accent})`,
                    }}
                    dangerouslySetInnerHTML={{ __html: currentTheme.svg }}
                  />
                </div>

                <div className="relative -mt-3 flex flex-col items-center">
                  <div
                    className="h-3.5 w-40 sm:w-52 rounded-full bg-slate-900/80 border border-white/20 shadow-inner"
                    style={{ boxShadow: `0 0 25px ${currentTheme.accent}60` }}
                  />
                  <div
                    className="h-1.5 w-48 sm:w-60 rounded-full -mt-2 opacity-80 animate-pulse transition-colors duration-700"
                    style={{
                      backgroundColor: currentTheme.accent,
                      boxShadow: `0 0 16px ${currentTheme.accent}`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Selo Centralizador */}
          <div className="pointer-events-none absolute left-1/2 top-1 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-slate-900/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-md shadow-xs">
            <Rotate3d className="h-3.5 w-3.5 text-sky-300 animate-spin-slow" />
            <span>{webglSupported ? 'Modelo 3D Interativo' : 'Expositor Interativo CISEB'}</span>
          </div>
        </div>

        {/* 3. BASE: INFORMAÇÕES DO TEMA ATIVO (NA FRENTE DO 3D) */}
        <div className="relative z-20 space-y-3 rounded-2xl bg-[#011a40]/80 backdrop-blur-lg p-4 sm:p-5 border border-white/20 shadow-2xl shrink-0 mt-2">
          {/* Título e Descrição do Tema */}
          <div className="space-y-0.5 text-left max-w-2xl min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-xs sm:text-sm font-black uppercase tracking-wider transition-colors duration-500"
                style={{ color: currentTheme.accent }}
              >
                {currentTheme.title}
              </span>
              <span className="text-white/30">•</span>
              <span className="text-xs text-sky-100 font-medium truncate">
                {currentTheme.subtitle}
              </span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed line-clamp-2 sm:line-clamp-none">
              {currentTheme.description}
            </p>
          </div>

          {/* Indicadores dos 6 Temas */}
          <div
            className="flex items-center gap-1.5 pt-0.5"
            role="tablist"
            aria-label="Seletor de temas CISEB"
          >
            {CISEB_THEMES.map((theme, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={theme.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Ir para tema ${theme.title}`}
                  onClick={() => goTo(index)}
                  className="group flex h-5 items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/40 rounded-full px-1 cursor-pointer"
                >
                  <span
                    className="rounded-full transition-all duration-500"
                    style={{
                      width: isActive ? 24 : 8,
                      height: 7,
                      backgroundColor: isActive ? theme.accent : 'rgba(255,255,255,0.3)',
                      boxShadow: isActive ? `0 0 10px ${theme.accent}` : 'none',
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
