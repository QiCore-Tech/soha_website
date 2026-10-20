(() => {
  if (window.__QICORE_LEGACY_INITED__) return;
  window.__QICORE_LEGACY_INITED__ = true;
  const copy = JSON.parse(document.getElementById('qicore-i18n-data').textContent);

        // ==========================================
        // 1. ✨ 设备检测与 IMU (重力感应) 初始化 ✨
        // ==========================================
        const GRID_SIZE = 40; 
        const paperCanvas = document.getElementById('canvas-area');
        const gridPlane = document.getElementById('grid-plane');
        const voxelsContainer = document.getElementById('voxels-container');
        const previewContainer = document.getElementById('preview-container');
        const magneticContainer = document.getElementById('magnetic-container');
        const canvasHint = document.getElementById('canvas-hint');
        
        const axisH = document.getElementById('axis-h');
        const axisV = document.getElementById('axis-v');
        const coordTracker = document.getElementById('coord-tracker');
        
        const coarsePointerMedia = window.matchMedia('(pointer: coarse)');
        const hoverNoneMedia = window.matchMedia('(hover: none)');
        const mobileUaPattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|HarmonyOS/i;
        
        const detectMobileView = () => {
            const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
            const coarsePointer = coarsePointerMedia.matches;
            const noHover = hoverNoneMedia.matches;
            const mobileUA = mobileUaPattern.test(navigator.userAgent);
            return mobileUA || (hasTouch && (coarsePointer || noHover));
        };
        let isMobileView = detectMobileView();
        
        const imuState = {
            supported: typeof window.DeviceOrientationEvent !== 'undefined',
            permission: 'idle',
            listening: false,
            active: false,
            baseBeta: null,
            baseGamma: null,
            targetBeta: 0,
            targetGamma: 0,
            filteredBeta: 0,
            filteredGamma: 0
        };

        let voxels = []; 
        let historyStack = []; 
        
        let mode = 'none'; 
        let drawStartPoint = null;
        let drawPlane = null;
        let drawFaceName = null;
        let drawStartClientX = 0;
        let drawStartClientY = 0;
        let magneticPos = null;
        let previewVoxelEl = null;
        let previewVoxelData = null;
        let magneticVoxelEl = null;

        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
        const PALETTE_TILE_SIZE = 48;
        const PALETTE_GAP = 12;
        const PALETTE_GRID_SIZE = PALETTE_TILE_SIZE * 3 + PALETTE_GAP * 2;
        const FACE_KEYS = ['top', 'front', 'right', 'left', 'back', 'bottom'];
        const MULTICOLOR_POOL = ['top', 'front', 'right', 'left', 'back', 'bottom', 'white', 'black'];
        const MULTICOLOR_GRADIENT = 'conic-gradient(from 180deg, #C9857C, #D2A06E, #D8C27A, #8FA892, #7E98B7, #A08FB5, #F3F1EC, #3A3D40, #C9857C)';
        const COLOR_OPTIONS = {
            top: { hex: '#C9857C' },
            front: { hex: '#D2A06E' },
            right: { hex: '#D8C27A' },
            left: { hex: '#8FA892' },
            back: { hex: '#7E98B7' },
            bottom: { hex: '#A08FB5' },
            white: { hex: '#F3F1EC' },
            black: { hex: '#3A3D40' }
        };
        let activeColorMode = 'multicolor';
        let pendingPlacementColor = null;
        let multicolorSequenceIndex = 0;
        let paletteState = 'closed';
        let interactionLocked = false;
        let isClearChargeActive = false;
        let paletteAnchorX = window.innerWidth / 2;
        let paletteAnchorY = window.innerHeight / 2;
        let paletteTimers = [];
        const VOXEL_STORAGE_KEY = 'qicore-voxel-layout-v1';
        const VALID_COLOR_KEYS = new Set([...FACE_KEYS, 'white', 'black']);
        // 积木种类：方块可拉伸成长方体；板 / 玻璃板固定 ¼ 格高、只能水平铺开；轮子占一格，贴在侧面时立起
        const PIECE_KINDS = ['cube', 'plate', 'glass', 'wheel'];
        const THIN_PIECE_HEIGHT = 0.25;
        const GLASS_FACE_ALPHA = 0.32;
        const WHEEL_RADIUS = 18;
        const WHEEL_THICKNESS = GRID_SIZE / 2;
        const WHEEL_TREAD_SEGMENTS = 16;
        let activePieceKind = 'cube';
        // 积木预览模型（积木库面板、按钮和光标共用）；多彩模式下每种积木用各自的代表色
        const PIECE_PREVIEW_MODELS = {
            cube: { voxel: {}, scale: 0.78, colorKey: 'front' },
            plate: { voxel: { sx: 2, sy: 2 }, scale: 0.46, colorKey: 'left' },
            glass: { voxel: { sx: 2, sy: 2 }, scale: 0.46, colorKey: 'back' },
            wheel: { voxel: { axis: 'x' }, scale: 0.9, colorKey: 'top' }
        };
        const CURSOR_PREVIEW_FIT = 1.3;
        const toQuarterGrid = (value) => Math.round(value * 4) / 4;
        const getCellSpan = (size) => Math.max(1, Math.ceil(size));

        const hexToRgb = (hex) => {
            const normalized = hex.replace('#', '');
            const value = parseInt(normalized, 16);
            return {
                r: (value >> 16) & 255,
                g: (value >> 8) & 255,
                b: value & 255
            };
        };

        const toRgba = (hex, alpha) => {
            const { r, g, b } = hexToRgb(hex);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        function applyRainbowPresetCssVars() {
            const rootStyle = document.documentElement.style;
            FACE_KEYS.forEach((faceKey) => {
                const { r, g, b } = hexToRgb(COLOR_OPTIONS[faceKey].hex);
                rootStyle.setProperty(`--cursor-${faceKey}-rgb`, `${r}, ${g}, ${b}`);
            });
        }

        applyRainbowPresetCssVars();

        const getFaceName = (el) => FACE_KEYS.find((key) => el.classList.contains(key)) || 'front';
        const pickNextMulticolorKey = () => {
            const colorKey = MULTICOLOR_POOL[multicolorSequenceIndex % MULTICOLOR_POOL.length];
            multicolorSequenceIndex = (multicolorSequenceIndex + 1) % MULTICOLOR_POOL.length;
            return colorKey;
        };
        const isPaletteBusy = () => paletteState !== 'closed';

        function ensurePendingPlacementColor() {
            if (activeColorMode !== 'multicolor') return activeColorMode;
            if (!pendingPlacementColor) {
                pendingPlacementColor = pickNextMulticolorKey();
                syncCursorBrushVisuals();
            }
            return pendingPlacementColor;
        }

        function getBrushFaceColorKey(faceName, mode = activeColorMode) {
            return mode === 'multicolor' ? (pendingPlacementColor || faceName) : mode;
        }

        function resolveVoxelFaceColorKey(faceName, colorKey) {
            if (!colorKey || colorKey === 'multicolor') return faceName;
            return colorKey;
        }

        function getVoxelFaceBackground(faceName, colorKey) {
            return COLOR_OPTIONS[resolveVoxelFaceColorKey(faceName, colorKey)].hex;
        }

        function getPreviewFaceBackground(colorKey) {
            const resolvedKey = colorKey === 'multicolor' ? ensurePendingPlacementColor() : colorKey;
            return toRgba(COLOR_OPTIONS[resolvedKey].hex, 0.32);
        }

        function getCursorFaceBackground(colorKey, solid = false) {
            return toRgba(COLOR_OPTIONS[colorKey].hex, solid ? 0.7 : 0.16);
        }

        function clearPendingPlacementColor() {
            if (!pendingPlacementColor) return;
            pendingPlacementColor = null;
            syncCursorBrushVisuals();
        }

        function applyVoxelColorsToElement(el, colorKey, isPreview = false) {
            const resolvedColorKey = colorKey || 'multicolor';
            el.dataset.colorKey = resolvedColorKey;
            const isGlass = el.dataset.kind === 'glass';
            el.querySelectorAll('.face').forEach((face) => {
                const hex = getVoxelFaceBackground(getFaceName(face), resolvedColorKey);
                face.style.background = isGlass ? toRgba(hex, GLASS_FACE_ALPHA) : hex;
            });
            // 轮子的轮毂颜色
            el.style.setProperty('--piece-color', getVoxelFaceBackground('top', resolvedColorKey));
            if (isPreview) {
                el.style.setProperty('--preview-face-bg', getPreviewFaceBackground(resolvedColorKey));
            } else {
                el.style.removeProperty('--preview-face-bg');
            }
        }

        function getPreviewColorKey() {
            return activeColorMode === 'multicolor' ? ensurePendingPlacementColor() : activeColorMode;
        }

        function syncVoxelDOM(el, v, isPreview = el.classList.contains('preview')) {
            const heightPx = v.sz * GRID_SIZE;

            el.style.left = `${v.x * GRID_SIZE}px`;
            el.style.top = `${v.y * GRID_SIZE}px`;
            el.style.width = `${v.sx * GRID_SIZE}px`;
            el.style.height = `${v.sy * GRID_SIZE}px`;
            el.dataset.id = String(v.id);
            el.dataset.x = String(v.x);
            el.dataset.y = String(v.y);
            el.dataset.z = String(v.z);
            el.dataset.sx = String(v.sx);
            el.dataset.sy = String(v.sy);
            el.dataset.sz = String(v.sz);
            el.dataset.w = String(v.sx);
            el.dataset.h = String(v.sy);
            el.dataset.kind = v.kind;
            if (el.dataset.parts !== getVoxelPartsType(v.kind)) buildVoxelParts(el, v.kind);
            if (v.kind === 'wheel') {
                syncWheelDOM(el, v);
                applyVoxelColorsToElement(el, v.colorKey, isPreview);
                return;
            }

            const faces = el.querySelectorAll('.face');
            faces.forEach((face) => {
                face.style.top = '';
                face.style.right = '';
                face.style.bottom = '';
                face.style.left = '';
                face.style.width = '';
                face.style.height = '';

                if (face.classList.contains('bottom')) {
                    face.style.width = '100%';
                    face.style.height = '100%';
                    face.style.transform = `translateZ(${v.z * GRID_SIZE}px)`;
                } else if (face.classList.contains('top')) {
                    face.style.width = '100%';
                    face.style.height = '100%';
                    face.style.transform = `translateZ(${(v.z + v.sz) * GRID_SIZE}px)`;
                } else if (face.classList.contains('front')) {
                    face.style.top = '0';
                    face.style.width = '100%';
                    face.style.height = `${heightPx}px`;
                    face.style.transform = `translateZ(${v.z * GRID_SIZE}px) rotateX(90deg)`;
                } else if (face.classList.contains('back')) {
                    face.style.bottom = '0';
                    face.style.width = '100%';
                    face.style.height = `${heightPx}px`;
                    face.style.transform = `translateZ(${v.z * GRID_SIZE}px) rotateX(-90deg)`;
                } else if (face.classList.contains('left')) {
                    face.style.left = '0';
                    face.style.width = `${heightPx}px`;
                    face.style.height = '100%';
                    face.style.transform = `translateZ(${v.z * GRID_SIZE}px) rotateY(-90deg)`;
                } else if (face.classList.contains('right')) {
                    face.style.right = '0';
                    face.style.width = `${heightPx}px`;
                    face.style.height = '100%';
                    face.style.transform = `translateZ(${v.z * GRID_SIZE}px) rotateY(90deg)`;
                }
            });
            applyVoxelColorsToElement(el, v.colorKey, isPreview);
        }

        function ensurePreviewVoxel(v) {
            if (!previewVoxelEl) {
                previewVoxelEl = createVoxelDOM(v, true);
                previewContainer.appendChild(previewVoxelEl);
            } else if (!previewContainer.contains(previewVoxelEl)) {
                previewContainer.appendChild(previewVoxelEl);
            }
            syncVoxelDOM(previewVoxelEl, v);
            previewVoxelData = v;
            previewVoxelEl.style.display = '';
        }

        function hidePreviewVoxel() {
            if (previewVoxelEl) previewVoxelEl.style.display = 'none';
        }

        function ensureMagneticVoxel(v) {
            if (!magneticVoxelEl) {
                magneticVoxelEl = createVoxelDOM(v, true);
                magneticContainer.appendChild(magneticVoxelEl);
            } else if (!magneticContainer.contains(magneticVoxelEl)) {
                magneticContainer.appendChild(magneticVoxelEl);
            }
            syncVoxelDOM(magneticVoxelEl, v);
            magneticVoxelEl.style.display = '';
        }

        function hideMagneticVoxel() {
            if (magneticVoxelEl) magneticVoxelEl.style.display = 'none';
        }

        function resetInteractionState() {
            mode = 'none';
            drawStartPoint = null;
            drawPlane = null;
            drawFaceName = null;
            drawStartClientX = 0;
            drawStartClientY = 0;
            magneticPos = null;
            hidePreviewVoxel();
            hideMagneticVoxel();
            document.body.classList.remove('is-deleting');
            axisH.style.opacity = '0';
            axisV.style.opacity = '0';
            coordTracker.style.opacity = '0';
        }

        function clearAllVoxels() {
            resetInteractionState();
            if (voxels.length > 0) saveState();
            voxels = [];
            renderAllVoxels();
        }

        function applyViewMode() {
            gridPlane.style.pointerEvents = 'auto';
            if (isMobileView) resetInteractionState();
        }

        function handleDeviceOrientation(e) {
            if (typeof e.beta !== 'number' || typeof e.gamma !== 'number') return;

            if (imuState.baseBeta === null || imuState.baseGamma === null) {
                imuState.baseBeta = e.beta;
                imuState.baseGamma = e.gamma;
            }

            imuState.targetBeta = clamp(e.beta - imuState.baseBeta, -45, 45);
            imuState.targetGamma = clamp(e.gamma - imuState.baseGamma, -45, 45);
            imuState.active = true;
        }

        function startImuTracking() {
            if (imuState.listening || !imuState.supported) return;
            window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
            imuState.listening = true;
        }

        async function requestImuPermission() {
            if (!isMobileView || !imuState.supported || imuState.permission === 'granted' || imuState.permission === 'denied') {
                return;
            }
            if (typeof window.DeviceOrientationEvent.requestPermission === 'function') {
                imuState.permission = 'pending';
                try {
                    const result = await window.DeviceOrientationEvent.requestPermission();
                    if (result === 'granted') {
                        imuState.permission = 'granted';
                        startImuTracking();
                    } else {
                        imuState.permission = 'denied';
                    }
                } catch (error) {
                    imuState.permission = 'denied';
                }
                return;
            }
            imuState.permission = 'granted';
            startImuTracking();
        }

        function ensureImuTracking() {
            if (!isMobileView || !imuState.supported) return;
            if (typeof window.DeviceOrientationEvent.requestPermission === 'function') return;
            if (imuState.permission !== 'granted') imuState.permission = 'granted';
            startImuTracking();
        }

        function resetImuBaseline() {
            imuState.baseBeta = null; imuState.baseGamma = null;
            imuState.targetBeta = 0; imuState.targetGamma = 0;
            imuState.filteredBeta = 0; imuState.filteredGamma = 0;
            imuState.active = false;
            mobileCubeOffsetX = 0; mobileCubeOffsetY = 0;
            mobileCubeVelX = 0; mobileCubeVelY = 0;
            mobileRollX = 0; mobileRollY = 0;
            mobileTapTargetX = 0; mobileTapTargetY = 0;
            mobileTapActive = false;
            markShadowGeometryDirty();
        }

        function syncViewMode() {
            const nextIsMobileView = detectMobileView();
            if (nextIsMobileView === isMobileView) return;
            isMobileView = nextIsMobileView;
            resetImuBaseline();
            applyViewMode();
            ensureImuTracking();
            markShadowGeometryDirty();
        }

        window.addEventListener('resize', () => {
            syncViewMode();
            if (isPaletteBusy()) positionPaletteAt(paletteAnchorX, paletteAnchorY);
            markShadowGeometryDirty();
            scheduleRender(true);
        });
        window.addEventListener('orientationchange', () => {
            resetImuBaseline();
            markShadowGeometryDirty();
            scheduleRender(true);
        });
        // The home board scrolls with the page above the site footer, so the
        // viewport rects used for hover zones go stale on scroll.
        window.addEventListener('scroll', () => {
            if (!document.querySelector('.voxel-home')) return;
            markShadowGeometryDirty();
            scheduleRender(true);
        }, { passive: true });
        
        // 移动端首次触摸时仅申请陀螺仪权限，不改变重力立方体的位置基线
        window.addEventListener('touchstart', (e) => { 
            if (isMobileView) {
                requestImuPermission();
                if (e.touches.length > 0) {
                    const cubeHalf = 23;
                    const boundaryX = Math.max(0, window.innerWidth / 2 - cubeHalf - 6);
                    const boundaryY = Math.max(0, window.innerHeight / 2 - cubeHalf - 6);
                    const touch = e.touches[0];
                    mobileTapTargetX = clamp(touch.clientX - window.innerWidth / 2, -boundaryX, boundaryX);
                    mobileTapTargetY = clamp(touch.clientY - window.innerHeight / 2, -boundaryY, boundaryY);
                    mobileTapActive = true;
                    scheduleRender(true);
                }
            }
        }, { passive: true });

        applyViewMode();
        ensureImuTracking();
        
        // ==========================================
        // 2. ✨ 沙盒数据与建造逻辑 (仅 PC 端生效) ✨
        // ==========================================
        function saveState() {
            historyStack.push(JSON.parse(JSON.stringify(voxels)));
            if (historyStack.length > 30) historyStack.shift(); 
        }
        
        function undo() {
            if (historyStack.length > 0) {
                voxels = historyStack.pop();
                renderAllVoxels();
            }
        }

        // The canvas stays mounted under content routes and beside the site
        // header/footer; building gestures only belong to the home board.
        const isHomeCanvasTarget = (target) => Boolean(document.querySelector('.voxel-home'))
            && !(target instanceof Element && target.closest('[data-site-header], [data-site-footer], input, textarea, select, [contenteditable]'));

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && paletteState === 'open') {
                closePalette();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !isPaletteBusy() && isHomeCanvasTarget(e.target)) undo();
        });

        function getMaxZInArea(x1, y1, x2, y2, ignoreId = null) {
            let maxZ = 0;
            const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
            
            voxels.forEach(v => {
                if (v.id === ignoreId) return;
                if (minX < v.x + v.sx && maxX >= v.x && minY < v.y + v.sy && maxY >= v.y) {
                    maxZ = Math.max(maxZ, v.z + v.sz);
                }
            });
            return maxZ;
        }

        function normalizeVoxel(voxel, index = 0) {
            const kind = PIECE_KINDS.includes(voxel.kind) ? voxel.kind : 'cube';
            const normalized = {
                id: Number.isFinite(Number(voxel.id)) ? Number(voxel.id) : Date.now() + index,
                x: Math.max(0, Math.floor(Number(voxel.x) || 0)),
                y: Math.max(0, Math.floor(Number(voxel.y) || 0)),
                // 板与轮子的高度不是整格，叠在它们上面的积木 z 以 ¼ 格为单位
                z: Math.max(0, toQuarterGrid(Number(voxel.z) || 0)),
                sx: Math.max(1, Math.floor(Number(voxel.sx ?? voxel.w) || 1)),
                sy: Math.max(1, Math.floor(Number(voxel.sy ?? voxel.h) || 1)),
                sz: Math.max(1, Math.floor(Number(voxel.sz) || 1)),
                colorKey: VALID_COLOR_KEYS.has(voxel.colorKey) ? voxel.colorKey : 'white',
                kind
            };
            if (kind === 'plate' || kind === 'glass') normalized.sz = THIN_PIECE_HEIGHT;
            if (kind === 'wheel') {
                // axis 为轮轴方向：z 平放；x / y 立起，hug 表示轮子贴住格子的哪一侧
                normalized.axis = ['x', 'y'].includes(voxel.axis) ? voxel.axis : 'z';
                normalized.hug = ['min', 'max'].includes(voxel.hug) ? voxel.hug : 'center';
                normalized.sx = 1;
                normalized.sy = 1;
                normalized.sz = normalized.axis === 'z' ? WHEEL_THICKNESS / GRID_SIZE : 1;
            }
            return normalized;
        }

        function getGridBounds() {
            return {
                cols: Math.floor(gridPlane.clientWidth / GRID_SIZE),
                rows: Math.floor(gridPlane.clientHeight / GRID_SIZE)
            };
        }

        function isVoxelWithinCanvas(v) {
            const { cols, rows } = getGridBounds();
            return (
                v.x >= 0 &&
                v.y >= 0 &&
                v.z >= 0 &&
                v.x + v.sx <= cols &&
                v.y + v.sy <= rows
            );
        }

        function voxelsIntersect(a, b) {
            return (
                a.x < b.x + b.sx &&
                a.x + a.sx > b.x &&
                a.y < b.y + b.sy &&
                a.y + a.sy > b.y &&
                a.z < b.z + b.sz &&
                a.z + a.sz > b.z
            );
        }

        function doesVoxelIntersectAny(candidate, ignoreId = null) {
            return voxels.some((voxel) => voxel.id !== ignoreId && voxelsIntersect(candidate, voxel));
        }

        function getEventAxisOffset(e, target, axis) {
            const fallbackRect = target.getBoundingClientRect();
            const fallbackOffset = axis === 'x'
                ? e.clientX - fallbackRect.left
                : e.clientY - fallbackRect.top;
            const rawOffset = axis === 'x' ? e.offsetX : e.offsetY;
            const size = axis === 'x' ? target.offsetWidth : target.offsetHeight;

            if (!Number.isFinite(rawOffset) || size <= 0) {
                return clamp(fallbackOffset, 0, Math.max(0, fallbackRect[axis === 'x' ? 'width' : 'height'] - 0.001));
            }

            return clamp(rawOffset, 0, Math.max(0, size - 0.001));
        }

        function getGridIndexFromOffset(offset, count) {
            return clamp(Math.floor(offset / GRID_SIZE), 0, Math.max(0, count - 1));
        }

        // 轮子贴在哪个面上，轮轴就朝哪个方向，并贴住那一侧
        function getWheelOrientation(point) {
            if (point.face === 'left') return { axis: 'x', hug: 'max' };
            if (point.face === 'right') return { axis: 'x', hug: 'min' };
            if (point.face === 'front') return { axis: 'y', hug: 'max' };
            if (point.face === 'back') return { axis: 'y', hug: 'min' };
            return { axis: 'z', hug: 'min' };
        }

        function createUnitVoxel(point, colorKey) {
            return normalizeVoxel({
                id: Date.now(),
                x: point.x,
                y: point.y,
                z: point.z,
                sx: 1,
                sy: 1,
                sz: 1,
                colorKey,
                kind: activePieceKind,
                ...(activePieceKind === 'wheel' ? getWheelOrientation(point) : null)
            });
        }

        function buildVoxelFromDrag(startPoint, endPoint, plane, colorKey) {
            if (!startPoint || !endPoint || startPoint.plane !== plane || endPoint.plane !== plane) return null;
            if (activePieceKind === 'wheel') return createUnitVoxel(startPoint, colorKey);
            // 板与玻璃板只水平铺开，忽略竖向拖动
            if (activePieceKind !== 'cube') endPoint = { ...endPoint, z: startPoint.z };

            if (plane === 'xy') {
                const x = Math.min(startPoint.x, endPoint.x);
                const y = Math.min(startPoint.y, endPoint.y);
                const sx = Math.abs(endPoint.x - startPoint.x) + 1;
                const sy = Math.abs(endPoint.y - startPoint.y) + 1;
                const z = Math.max(startPoint.z, getMaxZInArea(x, y, x + sx - 1, y + sy - 1));
                return normalizeVoxel({ id: Date.now(), x, y, z, sx, sy, sz: 1, colorKey, kind: activePieceKind });
            }

            if (plane === 'xz') {
                return normalizeVoxel({
                    id: Date.now(),
                    x: Math.min(startPoint.x, endPoint.x),
                    y: startPoint.y,
                    z: Math.min(startPoint.z, endPoint.z),
                    sx: Math.abs(endPoint.x - startPoint.x) + 1,
                    sy: 1,
                    sz: Math.abs(endPoint.z - startPoint.z) + 1,
                    colorKey,
                    kind: activePieceKind
                });
            }

            if (plane === 'yz') {
                return normalizeVoxel({
                    id: Date.now(),
                    x: startPoint.x,
                    y: Math.min(startPoint.y, endPoint.y),
                    z: Math.min(startPoint.z, endPoint.z),
                    sx: 1,
                    sy: Math.abs(endPoint.y - startPoint.y) + 1,
                    sz: Math.abs(endPoint.z - startPoint.z) + 1,
                    colorKey,
                    kind: activePieceKind
                });
            }

            if (plane === 'xy-side') {
                return normalizeVoxel({
                    id: Date.now(),
                    x: Math.min(startPoint.x, endPoint.x),
                    y: Math.min(startPoint.y, endPoint.y),
                    z: startPoint.z,
                    sx: Math.abs(endPoint.x - startPoint.x) + 1,
                    sy: Math.abs(endPoint.y - startPoint.y) + 1,
                    sz: 1,
                    colorKey,
                    kind: activePieceKind
                });
            }

            return null;
        }

        function getPlacementVoxel(point, colorKey) {
            const voxel = createUnitVoxel(point, colorKey);
            if (!isVoxelWithinCanvas(voxel) || doesVoxelIntersectAny(voxel)) return null;
            return voxel;
        }

        function resolveDragCoords(e, hoverCoords) {
            if (!drawStartPoint || !drawPlane) return hoverCoords;
            if (drawPlane === 'xy') {
                return hoverCoords && hoverCoords.plane === 'xy' ? hoverCoords : magneticPos;
            }

            const deltaX = Math.round((e.clientX - drawStartClientX) / GRID_SIZE);
            const deltaY = Math.round((e.clientY - drawStartClientY) / GRID_SIZE);

            if (drawPlane === 'xy-side') {
                return {
                    plane: 'xy-side',
                    x: Math.max(0, drawStartPoint.x + deltaX),
                    y: Math.max(0, drawStartPoint.y + deltaY),
                    z: drawStartPoint.z
                };
            }

            if (drawPlane === 'xz') {
                return {
                    plane: 'xz',
                    x: drawStartPoint.x + deltaX,
                    y: drawStartPoint.y,
                    z: Math.max(
                        0,
                        drawStartPoint.z +
                            (drawFaceName === 'back' ? -deltaY : deltaY)
                    )
                };
            }

            if (drawPlane === 'yz') {
                return {
                    plane: 'yz',
                    x: drawStartPoint.x,
                    y: Math.max(0, drawStartPoint.y + deltaY),
                    z: drawStartPoint.z
                };
            }

            return hoverCoords;
        }

        function createVoxelDOM(v, isPreview = false) {
            const el = document.createElement('div');
            el.className = `voxel ${isPreview ? 'preview' : ''}`;
            if (!isPreview) el.id = `voxel-${v.id}`;
            syncVoxelDOM(el, normalizeVoxel(v), isPreview);
            return el;
        }

        const getVoxelPartsType = (kind) => kind === 'wheel' ? 'wheel' : 'box';

        function buildVoxelParts(el, kind) {
            el.replaceChildren();
            el.dataset.parts = getVoxelPartsType(kind);
            if (kind !== 'wheel') {
                ['top', 'bottom', 'front', 'back', 'left', 'right'].forEach(f => {
                    const face = document.createElement('div');
                    face.className = `face ${f}`;
                    el.appendChild(face);
                });
                return;
            }

            // 轮子：两片轮毂圆面 + 一圈胎面条，围成绕本地 Z 轴的柱体
            const body = document.createElement('div');
            body.className = 'wheel-body';
            const diameter = WHEEL_RADIUS * 2;
            [-1, 1].forEach((side) => {
                const disc = document.createElement('div');
                disc.className = 'wheel-part wheel-disc';
                disc.style.cssText = `left:${-WHEEL_RADIUS}px;top:${-WHEEL_RADIUS}px;width:${diameter}px;height:${diameter}px;transform:translateZ(${side * WHEEL_THICKNESS / 2}px)`;
                body.appendChild(disc);
            });
            const treadWidth = 2 * WHEEL_RADIUS * Math.tan(Math.PI / WHEEL_TREAD_SEGMENTS) + 0.6;
            for (let i = 0; i < WHEEL_TREAD_SEGMENTS; i += 1) {
                const tread = document.createElement('div');
                tread.className = 'wheel-part wheel-tread';
                tread.style.cssText = `left:${-treadWidth / 2}px;top:${-WHEEL_THICKNESS / 2}px;width:${treadWidth}px;height:${WHEEL_THICKNESS}px;transform:rotateZ(${i * 360 / WHEEL_TREAD_SEGMENTS}deg) translateY(${WHEEL_RADIUS}px) rotateX(90deg)`;
                body.appendChild(tread);
            }
            el.appendChild(body);
        }

        function syncWheelDOM(el, v) {
            const half = WHEEL_THICKNESS / 2;
            const along = v.hug === 'min' ? half : v.hug === 'max' ? GRID_SIZE - half : GRID_SIZE / 2;
            let x = GRID_SIZE / 2;
            let y = GRID_SIZE / 2;
            let z = v.z * GRID_SIZE + half;
            let turn = '';
            if (v.axis === 'x') { x = along; z = v.z * GRID_SIZE + WHEEL_RADIUS; turn = ' rotateY(90deg)'; }
            if (v.axis === 'y') { y = along; z = v.z * GRID_SIZE + WHEEL_RADIUS; turn = ' rotateX(90deg)'; }
            el.firstElementChild.style.transform = `translate3d(${x}px, ${y}px, ${z}px)${turn}`;
        }

        function renderAllVoxels() {
            const existingVoxels = Array.from(voxelsContainer.children);
            const canReuseFirstPaintVoxels =
                document.documentElement.dataset.qicoreVoxelsReady === 'true' &&
                existingVoxels.length === voxels.length &&
                existingVoxels.every((element, index) => Number(element.dataset.id) === Number(voxels[index].id));

            if (canReuseFirstPaintVoxels) {
                existingVoxels.forEach((element, index) => syncVoxelDOM(element, voxels[index]));
            } else {
                voxelsContainer.innerHTML = '';
                voxels.forEach(v => voxelsContainer.appendChild(createVoxelDOM(v)));
            }
            delete document.documentElement.dataset.qicoreVoxelsReady;
            persistVoxels();
            syncCanvasHint();
        }

        function appendVoxel(v) {
            voxels.push(v);
            voxelsContainer.appendChild(createVoxelDOM(v));
            persistVoxels();
            syncCanvasHint();
        }

        function removeVoxel(id) {
            voxels = voxels.filter((voxel) => voxel.id != id);
            document.getElementById(`voxel-${id}`)?.remove();
            persistVoxels();
            syncCanvasHint();
        }

        function syncCanvasHint() {
            if (!canvasHint) return;
            const hasVoxels = voxels.length > 0;
            canvasHint.classList.toggle('is-hidden', hasVoxels);
            canvasHint.setAttribute('aria-hidden', String(hasVoxels));
        }

        function persistVoxels() {
            try {
                window.localStorage.setItem(VOXEL_STORAGE_KEY, JSON.stringify(voxels));
            } catch (error) {}
        }

        function restoreVoxels() {
            try {
                const raw = window.localStorage.getItem(VOXEL_STORAGE_KEY);
                if (!raw) return;
                const parsed = JSON.parse(raw);
                if (!Array.isArray(parsed)) return;
                voxels = parsed
                    .map((voxel, index) => normalizeVoxel(voxel, index))
                    .filter((voxel) => Number.isFinite(voxel.id));
            } catch (error) {
                voxels = [];
            }
        }

        restoreVoxels();
        renderAllVoxels();

        function resolveGridCoords(e) {
            const target = e.target;
            if (target.id === 'grid-plane') {
                return {
                    plane: 'xy',
                    face: 'grid',
                    x: Math.floor(e.offsetX / GRID_SIZE),
                    y: Math.floor(e.offsetY / GRID_SIZE),
                    z: 0
                };
            }
            if (!target.classList.contains('face')) return null;

            const voxelEl = target.closest('.voxel');
            if (!voxelEl) return null;

            const v = voxels.find(vx => vx.id == voxelEl.dataset.id);
            if (!v) return null;

            const faceName = getFaceName(target);
            const offsetX = getEventAxisOffset(e, target, 'x');
            const offsetY = getEventAxisOffset(e, target, 'y');

            if (faceName === 'top') {
                return {
                    plane: 'xy',
                    face: 'top',
                    x: v.x + getGridIndexFromOffset(offsetX, v.sx),
                    y: v.y + getGridIndexFromOffset(offsetY, v.sy),
                    z: v.z + v.sz
                };
            }

            if (faceName === 'front') {
                return {
                    plane: 'xz',
                    face: 'front',
                    x: v.x + getGridIndexFromOffset(offsetX, v.sx),
                    y: v.y - 1,
                    z: v.z + getGridIndexFromOffset(offsetY, v.sz)
                };
            }

            if (faceName === 'back') {
                return {
                    plane: 'xz',
                    face: 'back',
                    x: v.x + getGridIndexFromOffset(offsetX, v.sx),
                    y: v.y + v.sy,
                    z: v.z + (getCellSpan(v.sz) - 1 - getGridIndexFromOffset(offsetY, v.sz))
                };
            }

            if (faceName === 'left') {
                return {
                    plane: 'xy-side',
                    face: 'left',
                    x: v.x - 1,
                    y: v.y + getGridIndexFromOffset(offsetY, v.sy),
                    z: v.z + getGridIndexFromOffset(offsetX, v.sz)
                };
            }

            if (faceName === 'right') {
                return {
                    plane: 'xy-side',
                    face: 'right',
                    x: v.x + v.sx,
                    y: v.y + getGridIndexFromOffset(offsetY, v.sy),
                    z: v.z + (getCellSpan(v.sz) - 1 - getGridIndexFromOffset(offsetX, v.sz))
                };
            }

            return null;
        }

        document.addEventListener('contextmenu', (e) => {
            if (!isMobileView && isHomeCanvasTarget(e.target)) e.preventDefault();
        });

        paperCanvas.addEventListener('pointerdown', (e) => {
            if (isMobileView || interactionLocked || isPaletteBusy()) return;
            const target = e.target;
            
            if (e.button === 2) {
                e.stopPropagation();
                return;
            }

            if (e.button === 0) {
                const heldVoxelEl = target.closest('.voxel');
                if (heldVoxelEl && !heldVoxelEl.classList.contains('preview') && voxels.length) {
                    beginVoxelClearHold(e);
                }
                const point = resolveGridCoords(e);
                if (point) {
                    const previewColorKey = getPreviewColorKey();
                    const previewVoxel = buildVoxelFromDrag(point, point, point.plane, previewColorKey);
                    if (!previewVoxel || !isVoxelWithinCanvas(previewVoxel) || doesVoxelIntersectAny(previewVoxel)) return;

                    saveState();
                    mode = 'drawing';
                    drawStartPoint = point;
                    drawPlane = point.plane;
                    drawFaceName = target.classList.contains('face')
                        ? getFaceName(target)
                        : point.plane === 'xy'
                            ? 'top'
                            : null;
                    drawStartClientX = e.clientX;
                    drawStartClientY = e.clientY;
                    magneticPos = point;
                    ensurePreviewVoxel(previewVoxel);
                }
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (isMobileView || isPaletteBusy() || isClearChargeActive || isLuonTransitioned || isLuonAnimating) return;
            if (voxelClearOrigin && Math.hypot(e.clientX - voxelClearOrigin.x, e.clientY - voxelClearOrigin.y) > 8) {
                cancelVoxelClearHold();
            }
            
            const hoverCoords = resolveGridCoords(e);
            const coords = mode === 'drawing'
                ? resolveDragCoords(e, hoverCoords)
                : hoverCoords;
            
            if (coords) {
                magneticPos = coords;
                const crossX = coords.x * GRID_SIZE + GRID_SIZE/2; 
                const crossY = coords.y * GRID_SIZE + GRID_SIZE/2;
                axisH.style.transform = `translate3d(0, ${crossY}px, 1px)`; 
                axisV.style.transform = `translate3d(${crossX}px, 0, 1px)`;
                coordTracker.style.transform = `translate3d(${crossX + 16}px, ${crossY - 24}px, 1px)`;
                coordTracker.textContent = copy.staticArchive.coordinates.zh.replace(/\{(\w+)\}/g, (_, key) => String(coords[key]));
                axisH.style.opacity = '1'; axisV.style.opacity = '1'; coordTracker.style.opacity = '1';

                if (mode === 'none') {
                    const magneticVoxel = getPlacementVoxel(coords, getPreviewColorKey());
                    if (magneticVoxel) ensureMagneticVoxel(magneticVoxel);
                    else hideMagneticVoxel();
                }
            } else {
                axisH.style.opacity = '0'; axisV.style.opacity = '0'; coordTracker.style.opacity = '0';
                if (mode === 'none') {
                    hideMagneticVoxel();
                    clearPendingPlacementColor();
                }
            }

            if (mode === 'deleting') {
                const voxelEl = e.target.closest('.voxel');
                if (voxelEl && !voxelEl.classList.contains('preview')) {
                    removeVoxel(voxelEl.dataset.id);
                }
                return;
            }

            if (mode === 'drawing' && coords && coords.plane === drawPlane) {
                magneticPos = coords;
            }

            if (mode === 'drawing' && magneticPos) {
                hideMagneticVoxel(); 
                const previewVoxel = buildVoxelFromDrag(drawStartPoint, magneticPos, drawPlane, getPreviewColorKey());
                if (previewVoxel && isVoxelWithinCanvas(previewVoxel) && !doesVoxelIntersectAny(previewVoxel)) {
                    ensurePreviewVoxel(previewVoxel);
                } else {
                    hidePreviewVoxel();
                }
                return;
            }
        });

        window.addEventListener('pointerup', () => {
            cancelVoxelClearHold();
            if (isMobileView || isPaletteBusy() || isLuonTransitioned || isLuonAnimating) return;
            if (mode === 'drawing') {
                if (previewVoxelEl && previewVoxelEl.style.display !== 'none' && previewVoxelData) {
                    appendVoxel(normalizeVoxel({
                        ...previewVoxelData,
                        id: Date.now(),
                        colorKey: previewVoxelEl.dataset.colorKey || previewVoxelData.colorKey
                    }));
                    hidePreviewVoxel();
                }
                clearPendingPlacementColor();
            } else if (mode === 'deleting') {
                document.body.classList.remove('is-deleting');
                clearPendingPlacementColor();
            }
            mode = 'none';
            drawStartPoint = null;
            drawPlane = null;
            drawFaceName = null;
            drawStartClientX = 0;
            drawStartClientY = 0;
        });

        // ==========================================
        // 3. ✨ 全局全境视差与重力引擎 ✨
        // ==========================================
        const cursorWrapper = document.getElementById('cursor-wrapper');
        const cubeWrapper = document.getElementById('cube-wrapper');
        const cursorCube = document.getElementById('cursor-cube');
        const cursorPiece = document.getElementById('cursor-piece');
        let cursorPieceKind = '';
        let cursorPieceColorKey = '';
        const shockwave = document.getElementById('shockwave');
        const chargeHint = document.getElementById('charge-hint');
        const empFlash = document.getElementById('emp-flash');
        const plxTitle = document.getElementById('plx-title');
        const plxSlogan = document.getElementById('plx-slogan');
        const sloganCard = plxSlogan.closest('.slogan-card');
        const ambientGlow = document.getElementById('ambient-glow');
        const titleShadow = document.getElementById('title-shadow');
        const sloganShadow = document.getElementById('slogan-shadow');
        const paletteOverlay = document.getElementById('palette-overlay');
        const paletteBackdrop = document.getElementById('palette-backdrop');
        const btnReturn = document.getElementById('btn-return');
        const sceneLuon = document.getElementById('scene-luon');
        const typewriterEl = document.getElementById('luon-typewriter');
        const tesseractWrapper = document.getElementById('tesseract-wrapper');
        const luonTextGroup = document.getElementById('luon-text-group');
        const macroEnvironment = document.getElementById('macro-environment');
        const cursorFaces = Object.fromEntries(FACE_KEYS.map((faceKey) => [faceKey, cursorCube.querySelector(`.face.${faceKey}`)]));
        const cursorExtras = {
            multicolor: cursorCube.querySelector('.extra-face.multi'),
            white: cursorCube.querySelector('.extra-face.white'),
            black: cursorCube.querySelector('.extra-face.black')
        };
        const paletteBlocks = Array.from(cursorCube.querySelectorAll('.face, .extra-face'));

        let mouseX = window.innerWidth / 2; let mouseY = window.innerHeight / 2;
        let lerpX = mouseX; let lerpY = mouseY;
        let mobileCubeOffsetX = 0; let mobileCubeOffsetY = 0;
        let mobileCubeVelX = 0; let mobileCubeVelY = 0;
        let mobileRollX = 0; let mobileRollY = 0;
        let mobileTapTargetX = 0; let mobileTapTargetY = 0;
        let mobileTapActive = false;
        let sloganExpanded = false;
        let pressTimer = 0;
        let voxelClearTimer = 0;
        let voxelClearOrigin = null;
        let rightPressOrigin = null;
        let rightPressVoxelId = null;
        let isLongPressTriggered = false;
        let isLuonTransitioned = false;
        let isLuonAnimating = false;
        let luonTypeIndex = 0;
        let luonTypeTimeout = 0;
        let renderFrameId = 0;
        let renderSettleFrames = 0;
        let lastRenderedAt = 0;
        const LONG_PRESS_THRESHOLD = 1200;
        const PALETTE_OPEN_DURATION = 700;
        const PALETTE_CLOSE_DURATION = 700;
        const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
        const lowPowerMode = reducedMotionMedia.matches
            || navigator.connection?.saveData === true
            || (Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= 4)
            || (Number.isFinite(navigator.hardwareConcurrency) && navigator.hardwareConcurrency <= 4);

        document.documentElement.dataset.motionQuality = lowPowerMode ? 'reduced' : 'full';
        window.__QICORE_PERF__ = { renderFrames: 0, lowPowerMode };
        const currentLocale = () => document.documentElement.dataset.locale === 'en' ? 'en' : 'zh';
        const localizedNode = text => {
            const fragment = document.createDocumentFragment();
            for (const locale of ['zh', 'en']) {
                const span = document.createElement('span');
                span.dataset.lang = locale;
                span.textContent = text[locale];
                fragment.append(span);
            }
            return fragment;
        };
        const syncLabel = (node, text) => {
            node.dataset.ariaLabelZh = text.zh;
            node.dataset.ariaLabelEn = text.en;
            node.setAttribute('aria-label', text[currentLocale()]);
        };
        const typeText = () => copy.runtime.intentFlow[currentLocale()];

        function clearLuonTypewriter() {
            if (luonTypeTimeout) {
                window.clearTimeout(luonTypeTimeout);
                luonTypeTimeout = 0;
            }
            luonTypeIndex = 0;
            typewriterEl.textContent = '';
        }

        function runLuonTypewriter() {
            if (!isLuonTransitioned || luonTypeIndex >= typeText().length) return;
            typewriterEl.textContent += typeText().charAt(luonTypeIndex);
            luonTypeIndex += 1;
            luonTypeTimeout = window.setTimeout(runLuonTypewriter, Math.random() * 40 + 30);
        }

        new MutationObserver(() => {
            clearLuonTypewriter();
            if (isLuonTransitioned) runLuonTypewriter();
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-locale'] });

        function updateLuonParallax(normX, normY) {
            if (!isLuonTransitioned || isLuonAnimating) return;
            tesseractWrapper.style.transform = `rotateX(${normY * 12}deg) rotateY(${normX * -12}deg)`;
            luonTextGroup.style.transform = `translateZ(150px) rotateX(${normY * -6}deg) rotateY(${normX * 6}deg)`;
            macroEnvironment.style.transform = `rotateX(${normY * 5}deg) rotateY(${normX * -5}deg)`;
        }

        function returnFromLuonScene() {
            if (!isLuonTransitioned || isLuonAnimating) return;

            isLuonAnimating = true;
            sceneLuon.classList.remove('assemble');
            sceneLuon.classList.add('disassemble');
            clearLuonTypewriter();

            window.setTimeout(() => {
                document.body.classList.remove('is-transitioning', 'is-luon-active');
                document.body.classList.add('is-returning');
                sceneLuon.classList.remove('active', 'disassemble');
                sceneLuon.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('luon-theme');
                void paperCanvas.offsetWidth;

                isLuonTransitioned = false;

                window.setTimeout(() => {
                    document.body.classList.remove('is-returning');
                    isLuonAnimating = false;
                    interactionLocked = false;
                    markShadowGeometryDirty();
                }, 1500);
            }, 800);
        }

        function clearPaletteTimers() {
            paletteTimers.forEach((timerId) => window.clearTimeout(timerId));
            paletteTimers = [];
        }

        function queuePaletteTimer(delay, callback) {
            const timerId = window.setTimeout(callback, delay);
            paletteTimers.push(timerId);
            return timerId;
        }

        function getPaletteBlockBackground(colorKey, solid = false) {
            if (colorKey === 'multicolor') return MULTICOLOR_GRADIENT;
            return solid ? COLOR_OPTIONS[colorKey].hex : getCursorFaceBackground(colorKey, solid);
        }

        function applyCursorBrushColors(mode = activeColorMode, solid = false) {
            FACE_KEYS.forEach((faceName) => {
                const faceEl = cursorFaces[faceName];
                const colorKey = getBrushFaceColorKey(faceName, mode);
                faceEl.dataset.colorKey = colorKey;
                faceEl.style.background = getCursorFaceBackground(colorKey, solid);
            });
        }

        function applyCursorExtraColors() {
            cursorExtras.multicolor.style.background = MULTICOLOR_GRADIENT;
            cursorExtras.multicolor.style.color = 'rgba(255, 255, 255, 0.95)';
            cursorExtras.multicolor.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.28)';
            cursorExtras.white.style.background = COLOR_OPTIONS.white.hex;
            cursorExtras.white.style.color = 'rgba(20, 20, 25, 0.78)';
            cursorExtras.black.style.background = COLOR_OPTIONS.black.hex;
            cursorExtras.black.style.color = 'rgba(255, 255, 255, 0.88)';
        }

        function getDisplayedBrushColorKey() {
            if (activeColorMode === 'multicolor') return pendingPlacementColor;
            return activeColorMode;
        }

        // 选中板 / 玻璃板 / 轮子时，跟随鼠标的光标换成该积木；右键色盘仍从方块展开
        function syncCursorPiece() {
            const showPiece = activePieceKind !== 'cube';
            cursorWrapper.classList.toggle('has-piece-cursor', showPiece);
            if (!showPiece) return;
            const colorKey = getDisplayedBrushColorKey() || PIECE_PREVIEW_MODELS[activePieceKind].colorKey;
            if (cursorPieceKind === activePieceKind) {
                // 只换颜色时原地上色，不打断旋转动画
                if (cursorPieceColorKey !== colorKey) applyVoxelColorsToElement(cursorPiece.querySelector('.voxel'), colorKey);
            } else {
                renderPieceModel(cursorPiece, activePieceKind, CURSOR_PREVIEW_FIT, colorKey);
            }
            cursorPieceKind = activePieceKind;
            cursorPieceColorKey = colorKey;
        }

        function syncCursorBrushVisuals() {
            if (isPaletteBusy()) return;
            syncCursorPiece();
            applyCursorBrushColors('multicolor', false);
            applyCursorExtraColors();

            const displayColorKey = getDisplayedBrushColorKey();
            if (displayColorKey) {
                cursorCube.style.setProperty('--selected-color', COLOR_OPTIONS[displayColorKey].hex);
                cursorCube.classList.add('is-colored');
            } else {
                cursorCube.classList.remove('is-colored');
            }
        }

        function applyPaletteFaceColors() {
            FACE_KEYS.forEach((faceName) => {
                const faceEl = cursorFaces[faceName];
                faceEl.dataset.colorKey = faceName;
                faceEl.style.background = getPaletteBlockBackground(faceName, true);
            });
            applyCursorExtraColors();
        }

        function refreshTransientVoxelColors() {
            if (magneticVoxelEl && magneticVoxelEl.style.display !== 'none') {
                applyVoxelColorsToElement(magneticVoxelEl, getPreviewColorKey(), true);
            }
            if (previewVoxelEl && previewVoxelEl.style.display !== 'none') {
                applyVoxelColorsToElement(previewVoxelEl, getPreviewColorKey(), true);
            }
        }

        function positionPaletteAt(x, y) {
            const inset = PALETTE_GRID_SIZE / 2 + 20;
            paletteAnchorX = clamp(x, inset, window.innerWidth - inset);
            paletteAnchorY = clamp(y, inset, window.innerHeight - inset);
        }

        function clearChargeTimer() {
            if (!pressTimer) return;
            window.clearTimeout(pressTimer);
            pressTimer = 0;
        }

        function resetChargeVisualState() {
            clearChargeTimer();
            isClearChargeActive = false;
            cubeWrapper.classList.remove('is-charging');
            chargeHint.classList.remove('show');
        }

        function cancelRightPressState() {
            rightPressOrigin = null;
            rightPressVoxelId = null;
            isLongPressTriggered = false;
            resetChargeVisualState();
        }

        function cancelVoxelClearHold() {
            if (!voxelClearTimer && !voxelClearOrigin) return;
            window.clearTimeout(voxelClearTimer);
            voxelClearTimer = 0;
            voxelClearOrigin = null;
            if (!rightPressOrigin) {
                cubeWrapper.classList.remove('is-charging');
                chargeHint.classList.remove('show');
            }
        }

        function beginVoxelClearHold(e) {
            cancelVoxelClearHold();
            voxelClearOrigin = { x: e.clientX, y: e.clientY };
            cubeWrapper.classList.remove('is-imploding', 'is-charging');
            void cubeWrapper.offsetWidth;
            cubeWrapper.classList.add('is-charging');
            chargeHint.classList.add('show');
            voxelClearTimer = window.setTimeout(() => {
                voxelClearTimer = 0;
                voxelClearOrigin = null;
                executeClearAnimation();
            }, LONG_PRESS_THRESHOLD);
        }

        function shouldHandleRightPress(target) {
            if (!isHomeCanvasTarget(target)) return false;
            if (cursorWrapper.contains(target)) return false;
            if (target.closest('[data-home-interactive-control]')) return false;

            if (target === paletteBackdrop || paletteBackdrop.contains(target)) return true;

            return target.id === 'grid-plane'
                || Boolean(target.closest('.voxel'))
                || !paperCanvas.contains(target);
        }

        function beginRightPress(e) {
            if (isMobileView || interactionLocked) return;
            if (e.button !== 2) return;
            if (!shouldHandleRightPress(e.target)) return;
            if (paletteState === 'opening' || paletteState === 'closing') return;

            resetInteractionState();
            clearChargeTimer();
            isLongPressTriggered = false;
            isClearChargeActive = true;
            rightPressOrigin = { x: e.clientX, y: e.clientY };
            const voxelEl = e.target.closest('.voxel');
            rightPressVoxelId = voxelEl && !voxelEl.classList.contains('preview') ? voxelEl.dataset.id : null;
            mouseX = e.clientX;
            mouseY = e.clientY;
            lerpX = e.clientX;
            lerpY = e.clientY;
            scheduleRender(true);

            cubeWrapper.classList.remove('is-imploding', 'is-charging');
            void cubeWrapper.offsetWidth;
            cubeWrapper.classList.add('is-charging');
            chargeHint.classList.add('show');

            pressTimer = window.setTimeout(() => {
                isLongPressTriggered = true;
                executeClearAnimation();
            }, LONG_PRESS_THRESHOLD);
        }

        function togglePaletteAt(x, y) {
            if (paletteState === 'open') {
                closePalette();
                return;
            }
            if (paletteState !== 'closed') return;
            openPaletteAt(x, y);
        }

        function releaseRightPress(e) {
            if (e.button !== 2) return;
            if (!rightPressOrigin) return;

            const origin = rightPressOrigin;
            const pressedVoxelId = rightPressVoxelId;
            rightPressOrigin = null;
            rightPressVoxelId = null;
            clearChargeTimer();

            const longTriggered = isLongPressTriggered;
            isLongPressTriggered = false;
            isClearChargeActive = false;
            cubeWrapper.classList.remove('is-charging');
            chargeHint.classList.remove('show');

            if (longTriggered) return;
            if (pressedVoxelId) {
                saveState();
                removeVoxel(pressedVoxelId);
                return;
            }
            if (paletteState === 'opening' || paletteState === 'closing') return;

            togglePaletteAt(origin.x, origin.y);
        }

        function openPaletteAt(x, y) {
            if (isMobileView || isPaletteBusy()) return;

            clearPaletteTimers();
            resetChargeVisualState();
            resetInteractionState();
            clearPendingPlacementColor();
            interactionLocked = true;
            paletteState = 'opening';
            positionPaletteAt(x, y);

            mouseX = paletteAnchorX;
            mouseY = paletteAnchorY;
            lerpX = paletteAnchorX;
            lerpY = paletteAnchorY;
            scheduleRender(true);

            paletteOverlay.classList.add('is-active');
            paletteOverlay.setAttribute('aria-hidden', 'false');
            document.body.classList.add('is-system-cursor');
            cursorWrapper.classList.remove('is-contrast-text');
            cursorWrapper.classList.add('is-palette-mode');
            cubeWrapper.classList.remove('is-imploding');
            cursorCube.classList.add('is-palette-mode');
            cursorCube.classList.add('is-opening');
            cursorCube.classList.remove('is-spinning');
            cursorCube.classList.remove('is-colored');
            cursorCube.classList.remove('is-palette');
            cursorCube.style.transform = '';
            applyPaletteFaceColors();

            requestAnimationFrame(() => {
                cursorCube.classList.add('is-palette');
                queuePaletteTimer(PALETTE_OPEN_DURATION, () => {
                    cursorCube.classList.remove('is-opening');
                    paletteState = 'open';
                    interactionLocked = false;
                });
            });
        }

        function closePalette(nextColorMode = null) {
            if (paletteState !== 'open') return;

            clearPaletteTimers();
            resetChargeVisualState();
            interactionLocked = true;
            paletteState = 'closing';

            if (nextColorMode) activeColorMode = nextColorMode;
            clearPendingPlacementColor();
            cursorCube.classList.remove('is-opening');

            const displayColorKey = getDisplayedBrushColorKey();
            if (displayColorKey) {
                cursorCube.style.setProperty('--selected-color', COLOR_OPTIONS[displayColorKey].hex);
                cursorCube.classList.add('is-colored');
            } else {
                cursorCube.classList.remove('is-colored');
            }

            cursorCube.classList.remove('is-palette');
            queuePaletteTimer(PALETTE_CLOSE_DURATION, () => {
                paletteOverlay.classList.remove('is-active');
                paletteOverlay.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('is-system-cursor');
                cursorWrapper.classList.remove('is-palette-mode');
                cursorCube.classList.remove('is-palette', 'is-palette-mode', 'is-opening');
                cursorCube.style.transform = '';
                cursorCube.classList.add('is-spinning');
                syncCursorBrushVisuals();
                paletteState = 'closed';
                interactionLocked = false;
                refreshTransientVoxelColors();
            });
        }

        function forceClosePalette() {
            clearPaletteTimers();
            resetChargeVisualState();
            paletteOverlay.classList.remove('is-active');
            paletteOverlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('is-system-cursor');
            cursorWrapper.classList.remove('is-palette-mode');
            cursorWrapper.classList.remove('is-contrast-text');
            cursorCube.classList.remove('is-palette', 'is-palette-mode', 'is-opening');
            cursorCube.style.transform = '';
            cursorCube.classList.add('is-spinning');
            paletteState = 'closed';
            interactionLocked = false;
            clearPendingPlacementColor();
            syncCursorBrushVisuals();
        }

        function executeClearAnimation() {
            clearChargeTimer();
            isClearChargeActive = false;
            if (paletteState !== 'closed') {
                forceClosePalette();
            }

            cubeWrapper.classList.remove('is-charging');
            cubeWrapper.classList.add('is-imploding');
            chargeHint.classList.remove('show');

            shockwave.classList.remove('fire');
            void shockwave.offsetWidth;
            shockwave.classList.add('fire');

            empFlash.classList.add('fire');
            window.setTimeout(() => {
                empFlash.classList.remove('fire');
            }, 50);

            clearAllVoxels();

            window.setTimeout(() => {
                cubeWrapper.classList.remove('is-imploding');
                cursorCube.classList.add('is-spinning');
                syncCursorBrushVisuals();
            }, 600);
        }

        paletteBlocks.forEach((block) => {
            block.setAttribute('role', 'button');
            block.tabIndex = -1;
            block.addEventListener('pointerdown', (e) => {
                if (paletteState !== 'open') return;
                e.stopPropagation();
                closePalette(block.dataset.colorKey);
            });
        });

        paletteBackdrop.addEventListener('pointerdown', (e) => {
            if (paletteState !== 'open') return;
            e.stopPropagation();
            closePalette();
        });

        btnReturn.addEventListener('click', (e) => {
            e.preventDefault();
            returnFromLuonScene();
        });

        window.addEventListener('mousedown', beginRightPress);
        window.addEventListener('mouseup', releaseRightPress);
        window.addEventListener('pointercancel', cancelRightPressState);
        window.addEventListener('blur', cancelRightPressState);
        window.addEventListener('pointercancel', cancelVoxelClearHold);
        window.addEventListener('blur', cancelVoxelClearHold);

        syncCursorBrushVisuals();

        function renderPieceModel(container, kind, fit = 1, colorKey = null) {
            const model = PIECE_PREVIEW_MODELS[kind];
            const scale = model.scale * fit;
            const resolvedColorKey = colorKey || (activeColorMode === 'multicolor' ? model.colorKey : activeColorMode);
            const voxel = normalizeVoxel({ id: 0, x: 0, y: 0, z: 0, colorKey: resolvedColorKey, kind, ...model.voxel });
            const stage = document.createElement('span');
            stage.className = 'piece-stage';
            stage.style.transform = `scale3d(${scale}, ${scale}, ${scale}) rotateX(58deg)`;
            // 绕竖轴的 -45° 放在单独一层，光标上的积木靠它旋转
            const spin = document.createElement('span');
            spin.className = 'piece-spin';
            const el = createVoxelDOM(voxel);
            el.removeAttribute('id');
            el.classList.add('piece-model');
            el.style.left = `${-voxel.sx * GRID_SIZE / 2}px`;
            el.style.top = `${-voxel.sy * GRID_SIZE / 2}px`;
            el.style.transform = `translateZ(${-voxel.sz * GRID_SIZE / 2}px)`;
            spin.appendChild(el);
            stage.appendChild(spin);
            container.replaceChildren(stage);
        }

        const shadowState = {
            dirty: true,
            paperRect: null,
            title: {
                rect: null, viewportRect: null, centerX: 0, centerY: 0,
                currentOffsetX: 0, currentOffsetY: 0, currentScaleX: 1, currentScaleY: 1,
                currentSkewX: 0, currentSkewY: 0, currentOpacity: 0
            },
            slogan: {
                rect: null, viewportRect: null, centerX: 0, centerY: 0,
                currentOffsetX: 0, currentOffsetY: 0, currentScaleX: 1, currentScaleY: 1,
                currentSkewX: 0, currentSkewY: 0, currentOpacity: 0
            }
        };

        function markShadowGeometryDirty() {
            shadowState.dirty = true;
        }

        function refreshProjectionGeometry() {
            const paperRect = paperCanvas.getBoundingClientRect();
            shadowState.paperRect = paperRect;

            const syncShadowGeometry = (sourceEl, shadowEl, stateEntry) => {
                const sourceRect = sourceEl.getBoundingClientRect();
                const rect = {
                    left: sourceRect.left - paperRect.left,
                    top: sourceRect.top - paperRect.top,
                    width: sourceRect.width,
                    height: sourceRect.height
                };
                stateEntry.rect = rect;
                stateEntry.viewportRect = sourceRect;
                stateEntry.centerX = sourceRect.left + sourceRect.width / 2;
                stateEntry.centerY = sourceRect.top + sourceRect.height / 2;
                shadowEl.style.left = `${rect.left}px`;
                shadowEl.style.top = `${rect.top}px`;
                shadowEl.style.width = `${rect.width}px`;
                shadowEl.style.height = `${rect.height}px`;
            };

            syncShadowGeometry(plxTitle, titleShadow, shadowState.title);
            syncShadowGeometry(plxSlogan, sloganShadow, shadowState.slogan);
            shadowState.dirty = false;
        }

        function updateProjectionShadow(stateEntry, shadowEl, options, normX, normY) {
            if (!stateEntry.rect) return;
            const energy = Math.abs(normX) + Math.abs(normY);
            const targetOffsetX = -normX * options.depth * 2.15;
            const targetOffsetY = options.baseDrop + normY * -options.depth * 1.6 + Math.abs(normX) * options.depth * 0.22;
            const targetScaleX = 1 + Math.abs(normX) * options.scaleXBoost;
            const targetScaleY = clamp(options.baseScaleY - energy * options.scaleYDrop, 0.35, 0.92);
            const targetSkewX = normX * -options.skewX;
            const targetSkewY = normY * options.skewY;
            const targetOpacity = clamp(options.baseOpacity + energy * options.opacityBoost, options.baseOpacity, options.maxOpacity);
            const lerpFactor = options.smoothing;

            stateEntry.currentOffsetX += (targetOffsetX - stateEntry.currentOffsetX) * lerpFactor;
            stateEntry.currentOffsetY += (targetOffsetY - stateEntry.currentOffsetY) * lerpFactor;
            stateEntry.currentScaleX += (targetScaleX - stateEntry.currentScaleX) * lerpFactor;
            stateEntry.currentScaleY += (targetScaleY - stateEntry.currentScaleY) * lerpFactor;
            stateEntry.currentSkewX += (targetSkewX - stateEntry.currentSkewX) * lerpFactor;
            stateEntry.currentSkewY += (targetSkewY - stateEntry.currentSkewY) * lerpFactor;
            stateEntry.currentOpacity += (targetOpacity - stateEntry.currentOpacity) * (lerpFactor * 0.9);

            shadowEl.style.transform = `translate3d(${stateEntry.currentOffsetX}px, ${stateEntry.currentOffsetY}px, 1px) scale(${stateEntry.currentScaleX}, ${stateEntry.currentScaleY}) skewX(${stateEntry.currentSkewX}deg) skewY(${stateEntry.currentSkewY}deg)`;
            shadowEl.style.opacity = String(stateEntry.currentOpacity);
        }

        function scheduleRender(settle = true) {
            if (settle) {
                renderSettleFrames = Math.max(renderSettleFrames, lowPowerMode ? 12 : 28);
            }
            if (renderFrameId || document.hidden) return;
            renderFrameId = window.requestAnimationFrame(renderLoop);
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (renderFrameId) window.cancelAnimationFrame(renderFrameId);
                renderFrameId = 0;
                return;
            }
            lastTime = performance.now();
            scheduleRender(true);
        });
        
        window.addEventListener('mousemove', (e) => {
            if (isMobileView || isPaletteBusy()) return;
            mouseX = e.clientX; mouseY = e.clientY;
            scheduleRender(true);
        });

        let lastTime = performance.now();
        function renderLoop() {
            renderFrameId = 0;
            const now = performance.now();
            const isQiCoreContentRoute = document.body.classList.contains('is-qicore-content-route');
            const minimumFrameInterval = lowPowerMode || isMobileView || isQiCoreContentRoute ? 1000 / 30 : 0;
            if (minimumFrameInterval && now - lastRenderedAt < minimumFrameInterval) {
                scheduleRender(false);
                return;
            }
            lastRenderedAt = now;
            window.__QICORE_PERF__.renderFrames += 1;
            const dt = Math.max(1, now - lastTime);
            lastTime = now;

            let normX = 0, normY = 0;
            let mobileTiltX = 0;
            let mobileTiltY = 0;

            if (isMobileView) {
                imuState.filteredBeta += (imuState.targetBeta - imuState.filteredBeta) * 0.06;
                imuState.filteredGamma += (imuState.targetGamma - imuState.filteredGamma) * 0.06;

                const hasActiveImu = imuState.permission === 'granted' && imuState.active;
                
                let tiltX = 0;
                let tiltY = 0;

                if (hasActiveImu) {
                    tiltX = clamp(imuState.filteredGamma / 60, -1, 1);
                    tiltY = clamp(imuState.filteredBeta / 60, -1, 1);
                } else {
                    tiltX = Math.sin(now * 0.0007) * 0.14;
                    tiltY = Math.cos(now * 0.0009) * 0.14;
                }
                mobileTiltX = tiltX;
                mobileTiltY = tiltY;

                const cubeInset = 72;
                const mobileRangeX = Math.min(window.innerWidth * 0.18, Math.max(56, window.innerWidth / 2 - cubeInset));
                const mobileRangeY = Math.min(window.innerHeight * 0.16, Math.max(48, window.innerHeight / 2 - cubeInset));
                const targetMobileX = window.innerWidth / 2 + tiltX * mobileRangeX;
                const targetMobileY = window.innerHeight / 2 + tiltY * mobileRangeY;

                mouseX = clamp(targetMobileX, cubeInset, window.innerWidth - cubeInset);
                mouseY = clamp(targetMobileY, cubeInset, window.innerHeight - cubeInset);

                const frameScale = dt / 16.67;
                const cubeHalf = 23;
                const cubeBoundaryX = Math.max(0, window.innerWidth / 2 - cubeHalf - 6);
                const cubeBoundaryY = Math.max(0, window.innerHeight / 2 - cubeHalf - 6);
                const edgeSoftZoneX = Math.min(120, cubeBoundaryX || 120);
                const edgeSoftZoneY = Math.min(120, cubeBoundaryY || 120);
                const remainingEdgeX = Math.max(0, cubeBoundaryX - Math.abs(mobileCubeOffsetX));
                const remainingEdgeY = Math.max(0, cubeBoundaryY - Math.abs(mobileCubeOffsetY));
                const edgeFactorX = clamp(remainingEdgeX / Math.max(1, edgeSoftZoneX), 0.18, 1);
                const edgeFactorY = clamp(remainingEdgeY / Math.max(1, edgeSoftZoneY), 0.18, 1);
                const cubeAccelX = tiltX * 1.2 * frameScale * edgeFactorX;
                const cubeAccelY = tiltY * 1.2 * frameScale * edgeFactorY;
                const cubeFriction = Math.pow(0.955, frameScale);
                const cubeMaxVel = 5.5;
                const rollDegPerPixel = 1.9;

                if (mobileTapActive) {
                    const toTargetX = mobileTapTargetX - mobileCubeOffsetX;
                    const toTargetY = mobileTapTargetY - mobileCubeOffsetY;
                    const targetDistance = Math.hypot(toTargetX, toTargetY);
                    if (targetDistance < 10) {
                        mobileTapActive = false;
                        mobileCubeOffsetX = mobileTapTargetX;
                        mobileCubeOffsetY = mobileTapTargetY;
                        mobileCubeVelX *= 0.4;
                        mobileCubeVelY *= 0.4;
                    } else {
                        mobileCubeVelX = (toTargetX / targetDistance) * cubeMaxVel;
                        mobileCubeVelY = (toTargetY / targetDistance) * cubeMaxVel;
                    }
                } else {
                    mobileCubeVelX = clamp((mobileCubeVelX + cubeAccelX) * cubeFriction, -cubeMaxVel, cubeMaxVel);
                    mobileCubeVelY = clamp((mobileCubeVelY + cubeAccelY) * cubeFriction, -cubeMaxVel, cubeMaxVel);
                }
                mobileCubeOffsetX += mobileCubeVelX * frameScale;
                mobileCubeOffsetY += mobileCubeVelY * frameScale;
                mobileRollY += mobileCubeVelX * frameScale * rollDegPerPixel;
                mobileRollX -= mobileCubeVelY * frameScale * rollDegPerPixel;

                if (mobileCubeOffsetX <= -cubeBoundaryX) {
                    mobileCubeOffsetX = -cubeBoundaryX;
                    if (mobileCubeVelX < 0) mobileCubeVelX *= 0.18;
                    if (mobileTapActive && mobileTapTargetX <= -cubeBoundaryX) mobileTapActive = false;
                } else if (mobileCubeOffsetX >= cubeBoundaryX) {
                    mobileCubeOffsetX = cubeBoundaryX;
                    if (mobileCubeVelX > 0) mobileCubeVelX *= 0.18;
                    if (mobileTapActive && mobileTapTargetX >= cubeBoundaryX) mobileTapActive = false;
                }

                if (mobileCubeOffsetY <= -cubeBoundaryY) {
                    mobileCubeOffsetY = -cubeBoundaryY;
                    if (mobileCubeVelY < 0) mobileCubeVelY *= 0.18;
                    if (mobileTapActive && mobileTapTargetY <= -cubeBoundaryY) mobileTapActive = false;
                } else if (mobileCubeOffsetY >= cubeBoundaryY) {
                    mobileCubeOffsetY = cubeBoundaryY;
                    if (mobileCubeVelY > 0) mobileCubeVelY *= 0.18;
                    if (mobileTapActive && mobileTapTargetY >= cubeBoundaryY) mobileTapActive = false;
                }
            } 
            
            // 下方这段物理缓动与自转逻辑，现在移动端与 PC 端完美共用！
            lerpX += (mouseX - lerpX) * 0.15; 
            lerpY += (mouseY - lerpY) * 0.15;
            if (isMobileView) {
                normX = clamp(mobileTiltX * 0.42 + mobileCubeOffsetX / Math.max(1, window.innerWidth), -0.5, 0.5);
                normY = clamp(mobileTiltY * 0.42 + mobileCubeOffsetY / Math.max(1, window.innerHeight), -0.5, 0.5);
            } else {
                normX = clamp(lerpX / window.innerWidth - 0.5, -0.5, 0.5);
                normY = clamp(lerpY / window.innerHeight - 0.5, -0.5, 0.5);
            }

            if (isLuonTransitioned || isLuonAnimating) {
                cursorWrapper.classList.remove('is-contrast-text');
                updateLuonParallax(normX, normY);
                renderSettleFrames = Math.max(0, renderSettleFrames - 1);
                if (isMobileView || renderSettleFrames > 0) scheduleRender(false);
                return;
            }

            if (isQiCoreContentRoute) {
                renderSettleFrames = Math.max(0, renderSettleFrames - 1);
                if (isMobileView || renderSettleFrames > 0) scheduleRender(false);
                return;
            }

            if (shadowState.dirty || !shadowState.paperRect) {
                refreshProjectionGeometry();
            }

            if (sloganCard) {
                if (isMobileView) {
                    if (sloganExpanded) {
                        sloganExpanded = false;
                        sloganCard.classList.remove('is-expanded');
                    }
                } else {
                    const sloganRect = shadowState.slogan.viewportRect;
                    const sloganCardRect = sloganCard.getBoundingClientRect();
                    const padX = sloganExpanded ? 14 : 10;
                    const hoverBottom = sloganRect && (sloganExpanded
                        ? Math.max(sloganCardRect.bottom + 12, sloganRect.bottom + 164)
                        : sloganRect.bottom + 10);
                    const isInsideSloganZone = !!sloganRect &&
                        mouseX >= sloganRect.left - padX &&
                        mouseX <= sloganRect.right + padX &&
                        mouseY >= sloganRect.top - 10 &&
                        mouseY <= hoverBottom;

                    if (isInsideSloganZone !== sloganExpanded) {
                        sloganExpanded = isInsideSloganZone;
                        sloganCard.classList.toggle('is-expanded', sloganExpanded);
                        markShadowGeometryDirty();
                    }
                }
            }

            // 更新多色光标的物理坐标与旋转
            if (isClearChargeActive && rightPressOrigin) {
                cursorWrapper.style.transform = `translate3d(${rightPressOrigin.x}px, ${rightPressOrigin.y}px, 0)`;
            } else if (isPaletteBusy()) {
                cursorWrapper.style.transform = `translate3d(${paletteAnchorX}px, ${paletteAnchorY}px, 0)`;
            } else if (isMobileView) {
                cursorWrapper.style.transform = `translate3d(${window.innerWidth / 2 + mobileCubeOffsetX}px, ${window.innerHeight / 2 + mobileCubeOffsetY}px, 0)`;
            } else {
                cursorWrapper.style.transform = `translate3d(${lerpX}px, ${lerpY}px, 0)`;
            }

            if (isPaletteBusy() || isMobileView) {
                cursorWrapper.classList.remove('is-contrast-text');
            } else {
                const cubeHalf = 24;
                const cubeRect = {
                    left: lerpX - cubeHalf,
                    right: lerpX + cubeHalf,
                    top: lerpY - cubeHalf,
                    bottom: lerpY + cubeHalf
                };
                const titleRect = shadowState.title.viewportRect;
                const sloganRect = shadowState.slogan.viewportRect;
                const intersectsRect = (rect, padX = 0, padY = 0) =>
                    rect &&
                    cubeRect.left <= rect.right + padX &&
                    cubeRect.right >= rect.left - padX &&
                    cubeRect.top <= rect.bottom + padY &&
                    cubeRect.bottom >= rect.top - padY;

                const useContrastBlend =
                    intersectsRect(titleRect, 10, 10) ||
                    intersectsRect(sloganRect, 10, 10);

                cursorWrapper.classList.toggle('is-contrast-text', useContrastBlend);
            }

            // ================== 公共渲染区 ==================
            if (isMobileView) {
                const glowX = window.innerWidth / 2 + mobileCubeOffsetX * 1.2 + mobileTiltX * window.innerWidth * 0.12;
                const glowY = window.innerHeight / 2 + mobileCubeOffsetY * 1.2 + mobileTiltY * window.innerHeight * 0.12;
                ambientGlow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;
            } else {
                ambientGlow.style.transform = `translate3d(${lerpX}px, ${lerpY}px, 0) translate(-50%, -50%)`;
            }

            // The whole paper board behaves like a loose card: the pointer pulls
            // its rotation and the projected shadow drifts in the opposite
            // direction. Reduced-motion and touch layouts stay perfectly flat.
            const paperTiltStrength = isMobileView || lowPowerMode ? 0 : 14;
            const paperRotX = normY * -paperTiltStrength;
            const paperRotY = normX * paperTiltStrength;
            const paperShadowX = normX * -36;
            const paperShadowY = normY * -36 + 40;
            paperCanvas.style.transform = `rotateX(${paperRotX}deg) rotateY(${paperRotY}deg)`;
            paperCanvas.style.boxShadow = `${paperShadowX}px ${paperShadowY}px 100px rgba(0, 0, 0, 0.56)`;

            // 标题字重固定（见 voxel-home.css），不再随光标距离变粗变细
            if (shadowState.dirty || !shadowState.paperRect) {
                refreshProjectionGeometry();
            }

            updateProjectionShadow(shadowState.title, titleShadow, {
                depth: 86,
                baseDrop: 14,
                baseScaleY: 0.54,
                scaleXBoost: 0.12,
                scaleYDrop: 0.12,
                skewX: 18,
                skewY: 6,
                baseOpacity: 0.28,
                opacityBoost: 0.24,
                maxOpacity: 0.64,
                smoothing: 0.14
            }, normX, normY);
            updateProjectionShadow(shadowState.slogan, sloganShadow, {
                depth: 54,
                baseDrop: 12,
                baseScaleY: 0.62,
                scaleXBoost: 0.09,
                scaleYDrop: 0.08,
                skewX: 15,
                skewY: 5,
                baseOpacity: 0.22,
                opacityBoost: 0.18,
                maxOpacity: 0.48,
                smoothing: 0.16
            }, normX, normY);

            renderSettleFrames = Math.max(0, renderSettleFrames - 1);
            if (isMobileView || renderSettleFrames > 0) {
                scheduleRender(false);
            }
        }

        // Touch building uses the same voxel model, collision checks and persistence.
        const touchPoints = new Map();
        let touchStart = null, touchHold = 0, touchMoved = false, touchCandidate = null;
        let nativeTouchGesture = false;
        let touchRedo = [];
        const touchBar = document.createElement('div');
        touchBar.className = 'touch-builder';
        touchBar.setAttribute('data-home-interactive-control', '');
        touchBar.hidden = true;
        touchBar.innerHTML = `<div class="touch-colors"></div><div class="touch-actions"></div>`;
        const closeTouchPalette = () => { touchBar.hidden = true; };
        function openTouchPalette(x, y) {
            touchBar.style.left = `${clamp(x - 84, 12, innerWidth - 180)}px`;
            touchBar.style.top = `${clamp(y >= 320 ? y - 260 : y + 28, 80, innerHeight - 252)}px`;
            touchBar.hidden = false;
            touchBar.querySelectorAll('.touch-colors button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.colorKey === activeColorMode)));
            const buttons = touchBar.querySelectorAll('.touch-actions button');
            buttons[0].disabled = !historyStack.length;
            buttons[1].disabled = !voxels.length;
        }
        document.addEventListener('pointerdown', e => {
            if (touchBar.hidden || touchBar.contains(e.target) || touchPoints.size || e.pointerType !== 'touch') return;
            closeTouchPalette();
            e.preventDefault(); e.stopImmediatePropagation();
        }, true);
        paperCanvas.addEventListener('contextmenu', e => { if (isMobileView) e.preventDefault(); });
        const colors = touchBar.querySelector('.touch-colors');
        ['front', 'back', 'left', 'right', 'multicolor', 'top', 'bottom', 'white', 'black'].forEach(key => {
            const button = document.createElement('button');
            button.style.background = getPaletteBlockBackground(key, true);
            button.dataset.colorKey = key;
            button.setAttribute('aria-pressed', String(activeColorMode === key));
            if (['multicolor', 'white', 'black'].includes(key)) button.append(localizedNode(copy.runtime[key]));
            syncLabel(button, copy.runtime[key]);
            button.onclick = () => {
                activeColorMode = key;
                colors.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
                clearPendingPlacementColor();
                closeTouchPalette();
            };
            colors.append(button);
        });
        function touchAction(text, action) {
            const button = document.createElement('button');
            button.append(localizedNode(text));
            button.onclick = action;
            touchBar.querySelector('.touch-actions').append(button);
        }
        touchAction(copy.runtime.undo, () => { if (historyStack.length) { touchRedo.push(JSON.parse(JSON.stringify(voxels))); undo(); } closeTouchPalette(); });
        touchAction(copy.runtime.clear, () => {
            closeTouchPalette();
            if (!voxels.length) return;
            const dialog = document.createElement('dialog');
            dialog.className = 'clear-confirm';
            dialog.setAttribute('aria-labelledby', 'clear-confirm-title');
            dialog.setAttribute('aria-describedby', 'clear-confirm-description');
            dialog.innerHTML = `<span class="clear-confirm-kicker"></span>
                <h2 id="clear-confirm-title"></h2>
                <p id="clear-confirm-description"></p>
                <div class="clear-confirm-actions"><button type="button" data-cancel></button><button type="button" data-confirm></button></div>`;
            dialog.querySelector('.clear-confirm-kicker').append(localizedNode(copy.runtime.clearKicker));
            dialog.querySelector('h2').append(localizedNode(copy.runtime.clearTitle));
            dialog.querySelector('p').append(localizedNode(copy.runtime.clearDescription));
            dialog.querySelector('[data-cancel]').append(localizedNode(copy.runtime.keepBuilding));
            dialog.querySelector('[data-confirm]').append(localizedNode(copy.runtime.clearCanvas));
            document.body.append(dialog);
            interactionLocked = true;
            const close = () => { dialog.close(); dialog.remove(); interactionLocked = false; };
            dialog.querySelector('[data-cancel]').onclick = close;
            dialog.oncancel = event => { event.preventDefault(); close(); };
            dialog.onclick = event => { if (event.target === dialog) {
                const r = dialog.getBoundingClientRect();
                if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
            } };
            dialog.querySelector('[data-confirm]').onclick = () => {
                close();
                touchRedo = [];
                executeClearAnimation();
            };
            dialog.showModal();
            dialog.querySelector('[data-cancel]').focus();
        });
        document.body.append(touchBar);
        const touchEnabled = () => isMobileView && Boolean(document.querySelector('.voxel-home')) && !interactionLocked;
        function cancelTouchPreview() { clearTimeout(touchHold); touchCandidate = null; hidePreviewVoxel(); }
        paperCanvas.addEventListener('pointerdown', e => {
            if (!touchEnabled() || nativeTouchGesture || e.pointerType !== 'touch' || e.target.closest('a,button')) return;
            paperCanvas.setPointerCapture(e.pointerId);
            touchPoints.set(e.pointerId, {x:e.clientX,y:e.clientY});
            if (touchPoints.size > 1) { touchMoved = true; cancelTouchPreview(); return; }
            const point = resolveGridCoords(e);
            touchStart = { x:e.clientX, y:e.clientY, point, voxel:e.target.closest('.voxel')?.dataset.id };
            touchMoved = false;
            touchCandidate = point ? getPlacementVoxel(point, getPreviewColorKey()) : null;
            if (touchCandidate) ensurePreviewVoxel(touchCandidate);
            drawStartPoint = point;
            drawPlane = point?.plane;
            drawFaceName = e.target.classList.contains('face') ? getFaceName(e.target) : 'top';
            drawStartClientX = e.clientX;
            drawStartClientY = e.clientY;
            touchHold = setTimeout(() => {
                if (touchMoved || !touchStart || touchPoints.size !== 1) return;
                touchMoved = true; touchCandidate = null; hidePreviewVoxel();
                if (touchStart.voxel) {
                    touchRedo = [];
                    executeClearAnimation();
                } else if (touchStart.point) {
                    openTouchPalette(touchStart.x, touchStart.y);
                }
            }, 480);
        });
        paperCanvas.addEventListener('pointermove', e => {
            const previous = touchPoints.get(e.pointerId);
            if (!previous) return;
            const next = {x:e.clientX,y:e.clientY};
            if (nativeTouchGesture || touchPoints.size > 1) {
                touchMoved = true;
                cancelTouchPreview();
            } else if (touchStart && Math.hypot(next.x-touchStart.x,next.y-touchStart.y) > 9) {
                clearTimeout(touchHold);
                if (!touchMoved && touchStart.point) {
                    const target = document.elementFromPoint(e.clientX, e.clientY);
                    let hit = null;
                    if (target) {
                        const rect = target.getBoundingClientRect();
                        hit = resolveGridCoords({ target, clientX: e.clientX, clientY: e.clientY,
                            offsetX: (e.clientX - rect.left) * target.clientWidth / rect.width,
                            offsetY: (e.clientY - rect.top) * target.clientHeight / rect.height });
                    }
                    const end = resolveDragCoords(e, hit);
                    const candidate = end ? buildVoxelFromDrag(touchStart.point, end, touchStart.point.plane, getPreviewColorKey()) : null;
                    touchCandidate = candidate && isVoxelWithinCanvas(candidate) && !doesVoxelIntersectAny(candidate) ? candidate : null;
                    if (touchCandidate) ensurePreviewVoxel(touchCandidate); else hidePreviewVoxel();
                }
            }
            touchPoints.set(e.pointerId,next); scheduleRender(true);
        });
        function finishTouch(e) {
            if (!touchPoints.has(e.pointerId)) return;
            const candidate = touchCandidate;
            cancelTouchPreview();
            if (e.type === 'pointerup' && touchEnabled() && !nativeTouchGesture && !touchMoved && candidate) {
                if (isVoxelWithinCanvas(candidate) && !doesVoxelIntersectAny(candidate)) {
                    saveState(); touchRedo = []; appendVoxel(candidate); clearPendingPlacementColor();
                }
            }
            touchPoints.delete(e.pointerId);
            if (!touchPoints.size) touchStart = null;
        }
        // Keep browser pinch gestures separate until every physical finger lifts.
        document.addEventListener('touchstart', event => {
            if (event.touches.length < 2) return;
            nativeTouchGesture = true;
            touchMoved = true;
            cancelTouchPreview();
            closeTouchPalette();
        }, { passive: true, capture: true });
        const finishNativeTouchGesture = event => {
            if (event.touches.length) return;
            nativeTouchGesture = false;
            touchPoints.clear();
            touchStart = null;
            cancelTouchPreview();
        };
        document.addEventListener('touchend', finishNativeTouchGesture, { passive: true });
        document.addEventListener('touchcancel', finishNativeTouchGesture, { passive: true });
        paperCanvas.addEventListener('pointerup', finishTouch);
        paperCanvas.addEventListener('pointercancel', finishTouch);

        scheduleRender(true);


})();
