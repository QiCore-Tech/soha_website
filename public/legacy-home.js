(() => {
  if (window.__QICORE_LEGACY_INITED__) return;
  window.__QICORE_LEGACY_INITED__ = true;

        // ==========================================
        // 1. ✨ 设备检测与 IMU (重力感应) 初始化 ✨
        // ==========================================
        const GRID_SIZE = 40; 
        const paperCanvas = document.getElementById('canvas-area');
        const gridPlane = document.getElementById('grid-plane');
        const voxelsContainer = document.getElementById('voxels-container');
        const previewContainer = document.getElementById('preview-container');
        const magneticContainer = document.getElementById('magnetic-container');
        
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
        let drawStartX = 0, drawStartY = 0, drawStartZ = 0;
        let magneticPos = null;
        let previewVoxelEl = null;
        let magneticVoxelEl = null;

        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
        const PALETTE_TILE_SIZE = 48;
        const PALETTE_GAP = 12;
        const PALETTE_GRID_SIZE = PALETTE_TILE_SIZE * 3 + PALETTE_GAP * 2;
        const FACE_KEYS = ['top', 'front', 'right', 'left', 'back', 'bottom'];
        const MULTICOLOR_POOL = ['top', 'front', 'right', 'left', 'back', 'bottom', 'white', 'black'];
        const MULTICOLOR_GRADIENT = 'conic-gradient(from 180deg, #6FA7A1, #C08EA1, #9A92B8, #C97B72, #D8C27A, #9BB8A5, #F3F1EC, #3A3D40, #6FA7A1)';
        const COLOR_OPTIONS = {
            top: { hex: '#C97B72' },
            front: { hex: '#6FA7A1' },
            right: { hex: '#D8C27A' },
            left: { hex: '#9BB8A5' },
            back: { hex: '#9A92B8' },
            bottom: { hex: '#C08EA1' },
            white: { hex: '#F3F1EC' },
            black: { hex: '#3A3D40' }
        };
        let activeColorMode = 'multicolor';
        let pendingPlacementColor = null;
        let paletteState = 'closed';
        let interactionLocked = false;
        let paletteAnchorX = window.innerWidth / 2;
        let paletteAnchorY = window.innerHeight / 2;
        let paletteTimers = [];
        const VOXEL_STORAGE_KEY = 'qicore-voxel-layout-v1';
        const VALID_COLOR_KEYS = new Set([...FACE_KEYS, 'white', 'black']);

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

        const getFaceName = (el) => FACE_KEYS.find((key) => el.classList.contains(key)) || 'front';
        const pickRandomColorKey = () => MULTICOLOR_POOL[Math.floor(Math.random() * MULTICOLOR_POOL.length)];
        const isPaletteBusy = () => paletteState !== 'closed';

        function ensurePendingPlacementColor() {
            if (activeColorMode !== 'multicolor') return activeColorMode;
            if (!pendingPlacementColor) {
                pendingPlacementColor = pickRandomColorKey();
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
            el.querySelectorAll('.face').forEach((face) => {
                face.style.background = getVoxelFaceBackground(getFaceName(face), resolvedColorKey);
            });
            if (isPreview) {
                el.style.setProperty('--preview-face-bg', getPreviewFaceBackground(resolvedColorKey));
            } else {
                el.style.removeProperty('--preview-face-bg');
            }
        }

        function getPreviewColorKey() {
            return activeColorMode === 'multicolor' ? ensurePendingPlacementColor() : activeColorMode;
        }

        function syncVoxelDOM(el, v) {
            el.style.left = `${v.x * GRID_SIZE}px`;
            el.style.top = `${v.y * GRID_SIZE}px`;
            el.style.width = `${v.w * GRID_SIZE}px`;
            el.style.height = `${v.h * GRID_SIZE}px`;
            el.dataset.x = String(v.x);
            el.dataset.y = String(v.y);
            el.dataset.w = String(v.w);
            el.dataset.h = String(v.h);
            el.dataset.z = String(v.z);

            const faces = el.querySelectorAll('.face');
            faces.forEach(face => {
                if (face.classList.contains('bottom')) face.style.transform = `translateZ(${v.z * 40}px)`;
                else if (face.classList.contains('top')) face.style.transform = `translateZ(${(v.z + 1) * 40}px)`;
                else if (face.classList.contains('front')) face.style.transform = `translateZ(${v.z * 40}px) rotateX(90deg)`;
                else if (face.classList.contains('back')) face.style.transform = `translateZ(${v.z * 40}px) rotateX(-90deg)`;
                else if (face.classList.contains('left')) face.style.transform = `translateZ(${v.z * 40}px) rotateY(-90deg)`;
                else if (face.classList.contains('right')) face.style.transform = `translateZ(${v.z * 40}px) rotateY(90deg)`;
            });
            applyVoxelColorsToElement(el, v.colorKey, el.classList.contains('preview'));
        }

        function ensurePreviewVoxel(v) {
            if (!previewVoxelEl) {
                previewVoxelEl = createVoxelDOM(v, true);
                previewContainer.appendChild(previewVoxelEl);
            } else if (!previewContainer.contains(previewVoxelEl)) {
                previewContainer.appendChild(previewVoxelEl);
            }
            syncVoxelDOM(previewVoxelEl, v);
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
            magneticPos = null;
            hidePreviewVoxel();
            hideMagneticVoxel();
            document.body.classList.remove('is-deleting');
            axisH.style.opacity = '0';
            axisV.style.opacity = '0';
            coordTracker.style.opacity = '0';
        }

        function applyViewMode() {
            gridPlane.style.pointerEvents = isMobileView ? 'none' : 'auto';
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
        });
        window.addEventListener('orientationchange', () => {
            resetImuBaseline();
            markShadowGeometryDirty();
        });
        
        // 移动端首次触摸时仅申请陀螺仪权限，不改变重力立方体的位置基线
        window.addEventListener('touchstart', (e) => { 
            if (isMobileView) {
                requestImuPermission();
                if (e.touches.length > 0) {
                    const cubeHalf = 24;
                    const boundaryX = Math.max(0, window.innerWidth / 2 - cubeHalf - 6);
                    const boundaryY = Math.max(0, window.innerHeight / 2 - cubeHalf - 6);
                    const touch = e.touches[0];
                    mobileTapTargetX = clamp(touch.clientX - window.innerWidth / 2, -boundaryX, boundaryX);
                    mobileTapTargetY = clamp(touch.clientY - window.innerHeight / 2, -boundaryY, boundaryY);
                    mobileTapActive = true;
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

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && paletteState === 'open') {
                closePalette();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !isPaletteBusy()) undo();
        });

        function getMaxZInArea(x1, y1, x2, y2, ignoreId = null) {
            let maxZ = 0;
            const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
            
            voxels.forEach(v => {
                if (v.id === ignoreId) return;
                if (minX < v.x + v.w && maxX >= v.x && minY < v.y + v.h && maxY >= v.y) {
                    maxZ = Math.max(maxZ, v.z + 1);
                }
            });
            return maxZ;
        }

        function createVoxelDOM(v, isPreview = false) {
            const el = document.createElement('div');
            el.className = `voxel ${isPreview ? 'preview' : ''}`;
            if (!isPreview) el.id = `voxel-${v.id}`;
            
            el.style.left = `${v.x * GRID_SIZE}px`; el.style.top = `${v.y * GRID_SIZE}px`;
            el.style.width = `${v.w * GRID_SIZE}px`; el.style.height = `${v.h * GRID_SIZE}px`;
            el.dataset.id = v.id; el.dataset.x = String(v.x); el.dataset.y = String(v.y);
            el.dataset.w = String(v.w); el.dataset.h = String(v.h); el.dataset.z = String(v.z);

            const faces = ['top', 'bottom', 'front', 'back', 'left', 'right'];
            faces.forEach(f => {
                const face = document.createElement('div');
                face.className = `face ${f}`;
                if (f === 'bottom') face.style.transform = `translateZ(${v.z * 40}px)`;
                else if (f === 'top') face.style.transform = `translateZ(${(v.z + 1) * 40}px)`;
                else if (f === 'front') face.style.transform = `translateZ(${v.z * 40}px) rotateX(90deg)`;
                else if (f === 'back') face.style.transform = `translateZ(${v.z * 40}px) rotateX(-90deg)`;
                else if (f === 'left') face.style.transform = `translateZ(${v.z * 40}px) rotateY(-90deg)`;
                else if (f === 'right') face.style.transform = `translateZ(${v.z * 40}px) rotateY(90deg)`;
                el.appendChild(face);
            });
            applyVoxelColorsToElement(el, v.colorKey, isPreview);
            return el;
        }

        function renderAllVoxels() {
            voxelsContainer.innerHTML = '';
            voxels.forEach(v => voxelsContainer.appendChild(createVoxelDOM(v)));
            persistVoxels();
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
                    .map((voxel, index) => ({
                        id: Number.isFinite(Number(voxel.id)) ? Number(voxel.id) : Date.now() + index,
                        x: Math.max(0, Math.floor(Number(voxel.x) || 0)),
                        y: Math.max(0, Math.floor(Number(voxel.y) || 0)),
                        w: Math.max(1, Math.floor(Number(voxel.w) || 1)),
                        h: Math.max(1, Math.floor(Number(voxel.h) || 1)),
                        z: Math.max(0, Math.floor(Number(voxel.z) || 0)),
                        colorKey: VALID_COLOR_KEYS.has(voxel.colorKey) ? voxel.colorKey : 'white'
                    }))
                    .filter(voxel => Number.isFinite(voxel.id));
            } catch (error) {
                voxels = [];
            }
        }

        restoreVoxels();
        renderAllVoxels();

        function resolveGridCoords(e) {
            const target = e.target;
            if (target.id === 'grid-plane') {
                return { x: Math.floor(e.offsetX / GRID_SIZE), y: Math.floor(e.offsetY / GRID_SIZE), z: 0 };
            }
            if (target.classList.contains('top')) {
                const voxelEl = target.closest('.voxel');
                if (!voxelEl) return null;
                const v = voxels.find(vx => vx.id == voxelEl.dataset.id);
                if (v) return {
                    x: v.x + Math.floor(e.offsetX / GRID_SIZE),
                    y: v.y + Math.floor(e.offsetY / GRID_SIZE),
                    z: v.z + 1
                };
            }
            return null;
        }

        paperCanvas.addEventListener('contextmenu', (e) => {
            if (!isMobileView) e.preventDefault();
        });

        window.addEventListener('contextmenu', (e) => {
            if (isMobileView) return;
            const target = e.target;
            const voxelEl = target.closest('.voxel');
            const shouldBlockMenu =
                isPaletteBusy() ||
                (voxelEl && !voxelEl.classList.contains('preview')) ||
                target.id === 'grid-plane' ||
                !paperCanvas.contains(target);

            if (shouldBlockMenu) e.preventDefault();
        });

        window.addEventListener('pointerdown', (e) => {
            if (isMobileView || interactionLocked || isPaletteBusy()) return;
            if (e.button !== 2) return;
            const target = e.target;
            const voxelEl = target.closest('.voxel');
            if (voxelEl && !voxelEl.classList.contains('preview')) return;
            if (paperCanvas.contains(target) || cursorWrapper.contains(target)) return;
            openPaletteAt(e.clientX, e.clientY);
        });

        paperCanvas.addEventListener('pointerdown', (e) => {
            if (isMobileView || interactionLocked || isPaletteBusy()) return;
            const target = e.target;
            
            if (e.button === 2) {
                e.stopPropagation();
                const voxelEl = target.closest('.voxel');
                if (voxelEl && !voxelEl.classList.contains('preview')) {
                    clearPendingPlacementColor();
                    saveState(); mode = 'deleting'; document.body.classList.add('is-deleting');
                    voxels = voxels.filter(v => v.id != voxelEl.dataset.id);
                    renderAllVoxels();
                } else if (target.id === 'grid-plane') {
                    openPaletteAt(e.clientX, e.clientY);
                }
                return;
            }

            if (e.button === 0) {
                const coords = resolveGridCoords(e);
                if (coords) {
                    const previewColorKey = getPreviewColorKey();
                    saveState(); mode = 'drawing';
                    drawStartX = coords.x; drawStartY = coords.y; drawStartZ = coords.z;
                    ensurePreviewVoxel({x: drawStartX, y: drawStartY, w: 1, h: 1, z: drawStartZ, colorKey: previewColorKey});
                }
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (isMobileView || isPaletteBusy()) return;
            
            const coords = resolveGridCoords(e);
            
            if (coords) {
                magneticPos = coords;
                const crossX = coords.x * GRID_SIZE + GRID_SIZE/2; 
                const crossY = coords.y * GRID_SIZE + GRID_SIZE/2;
                axisH.style.transform = `translate3d(0, ${crossY}px, 1px)`; 
                axisV.style.transform = `translate3d(${crossX}px, 0, 1px)`;
                coordTracker.style.transform = `translate3d(${crossX + 16}px, ${crossY - 24}px, 1px)`;
                coordTracker.textContent = `X: ${coords.x} | Y: ${coords.y} | Z: ${coords.z}`;
                axisH.style.opacity = '1'; axisV.style.opacity = '1'; coordTracker.style.opacity = '1';

                if (mode === 'none') {
                    ensureMagneticVoxel({x: coords.x, y: coords.y, w: 1, h: 1, z: coords.z, colorKey: getPreviewColorKey()});
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
                    voxels = voxels.filter(v => v.id != voxelEl.dataset.id);
                    renderAllVoxels();
                }
                return;
            }

            if (mode === 'drawing' && magneticPos) {
                hideMagneticVoxel(); 
                const minX = Math.min(drawStartX, magneticPos.x); 
                const minY = Math.min(drawStartY, magneticPos.y);
                const w = Math.abs(magneticPos.x - drawStartX) + 1; 
                const h = Math.abs(magneticPos.y - drawStartY) + 1;
                const dynamicZ = Math.max(drawStartZ, getMaxZInArea(minX, minY, minX + w - 1, minY + h - 1));

                ensurePreviewVoxel({x: minX, y: minY, w: w, h: h, z: dynamicZ, colorKey: getPreviewColorKey()});
                return;
            }
        });

        window.addEventListener('pointerup', () => {
            if (isMobileView || isPaletteBusy()) return;
            if (mode === 'drawing') {
                const preview = previewVoxelEl && previewVoxelEl.style.display !== 'none' ? previewVoxelEl : null;
                if (preview) {
                    voxels.push({
                        id: Date.now(),
                        x: parseInt(preview.dataset.x), y: parseInt(preview.dataset.y),
                        w: parseInt(preview.dataset.w), h: parseInt(preview.dataset.h),
                        z: parseInt(preview.dataset.z),
                        colorKey: preview.dataset.colorKey || getPreviewColorKey()
                    });
                    renderAllVoxels();
                    hidePreviewVoxel();
                }
                clearPendingPlacementColor();
            } else if (mode === 'deleting') {
                document.body.classList.remove('is-deleting');
                clearPendingPlacementColor();
            }
            mode = 'none';
        });

        // ==========================================
        // 3. ✨ 全局全境视差与重力引擎 ✨
        // ==========================================
        const cursorWrapper = document.getElementById('cursor-wrapper');
        const cursorCube = document.getElementById('cursor-cube');
        const plxTitle = document.getElementById('plx-title');
        const plxSlogan = document.getElementById('plx-slogan');
        const sloganCard = plxSlogan.closest('.slogan-card');
        const plxFooter = document.getElementById('plx-footer');
        const footerLink = plxFooter.querySelector('.terminal-footer-link');
        const footerSlotTrack = document.getElementById('footer-slot-track');
        const footerShadowTrack = document.getElementById('footer-shadow-track');
        const ambientGlow = document.getElementById('ambient-glow');
        const titleShadow = document.getElementById('title-shadow');
        const sloganShadow = document.getElementById('slogan-shadow');
        const footerShadow = document.getElementById('footer-shadow');
        const paletteOverlay = document.getElementById('palette-overlay');
        const paletteBackdrop = document.getElementById('palette-backdrop');
        const cursorFaces = Object.fromEntries(FACE_KEYS.map((faceKey) => [faceKey, cursorCube.querySelector(`.face.${faceKey}`)]));
        const cursorExtras = {
            multicolor: cursorCube.querySelector('.extra-face.multi'),
            white: cursorCube.querySelector('.extra-face.white'),
            black: cursorCube.querySelector('.extra-face.black')
        };
        const paletteBlocks = Array.from(cursorCube.querySelectorAll('.face, .extra-face'));

        let mouseX = window.innerWidth / 2; let mouseY = window.innerHeight / 2;
        let lerpX = mouseX; let lerpY = mouseY;
        let rotX = 45; let rotY = 45;
        let vX = 0; let vY = 0; 
        let prevMouseX = mouseX; let prevMouseY = mouseY;
        let mobileCubeOffsetX = 0; let mobileCubeOffsetY = 0;
        let mobileCubeVelX = 0; let mobileCubeVelY = 0;
        let mobileRollX = 0; let mobileRollY = 0;
        let mobileTapTargetX = 0; let mobileTapTargetY = 0;
        let mobileTapActive = false;
        let titleWeightState = 430;
        let appliedTitleWeight = 430;
        let sloganExpanded = false;
        let footerSlotIndex = 0;
        let footerSlotPaused = false;
        let footerSlotAdvanceAt = performance.now() + 2200;

        const footerSlotAliases = ['info', 'hr'];
        const footerSlotLineHeight = 16;
        const footerSlotTracks = [footerSlotTrack, footerShadowTrack].filter(Boolean);

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

        function syncCursorBrushVisuals() {
            if (isPaletteBusy()) return;
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

        function openPaletteAt(x, y) {
            if (isMobileView || isPaletteBusy()) return;

            clearPaletteTimers();
            resetInteractionState();
            clearPendingPlacementColor();
            interactionLocked = true;
            paletteState = 'opening';
            positionPaletteAt(x, y);

            mouseX = paletteAnchorX;
            mouseY = paletteAnchorY;
            lerpX = paletteAnchorX;
            lerpY = paletteAnchorY;
            prevMouseX = mouseX;
            prevMouseY = mouseY;

            paletteOverlay.classList.add('is-active');
            paletteOverlay.setAttribute('aria-hidden', 'false');
            cursorWrapper.classList.remove('is-contrast-text');
            cursorWrapper.classList.add('is-palette-mode');
            cursorCube.classList.add('is-palette-mode');
            cursorCube.classList.remove('is-colored');
            cursorCube.classList.remove('is-palette');
            cursorCube.style.transform = 'translate(-50%, -50%)';
            applyPaletteFaceColors();

            requestAnimationFrame(() => {
                cursorCube.classList.add('is-palette');
                queuePaletteTimer(180, () => {
                    paletteState = 'open';
                    interactionLocked = false;
                });
            });
        }

        function closePalette(nextColorMode = null) {
            if (paletteState !== 'open') return;

            clearPaletteTimers();
            interactionLocked = true;
            paletteState = 'closing';

            if (nextColorMode) activeColorMode = nextColorMode;
            clearPendingPlacementColor();

            const displayColorKey = getDisplayedBrushColorKey();
            if (displayColorKey) {
                cursorCube.style.setProperty('--selected-color', COLOR_OPTIONS[displayColorKey].hex);
                cursorCube.classList.add('is-colored');
            } else {
                cursorCube.classList.remove('is-colored');
            }

            cursorCube.classList.remove('is-palette');
            queuePaletteTimer(720, () => {
                paletteOverlay.classList.remove('is-active');
                paletteOverlay.setAttribute('aria-hidden', 'true');
                cursorWrapper.classList.remove('is-palette-mode');
                cursorCube.classList.remove('is-palette', 'is-palette-mode');
                cursorCube.style.transform = '';
                syncCursorBrushVisuals();
                paletteState = 'closed';
                interactionLocked = false;
                refreshTransientVoxelColors();
            });
        }

        function forceClosePalette() {
            clearPaletteTimers();
            paletteOverlay.classList.remove('is-active');
            paletteOverlay.setAttribute('aria-hidden', 'true');
            cursorWrapper.classList.remove('is-palette-mode');
            cursorWrapper.classList.remove('is-contrast-text');
            cursorCube.classList.remove('is-palette', 'is-palette-mode');
            cursorCube.style.transform = '';
            paletteState = 'closed';
            interactionLocked = false;
            clearPendingPlacementColor();
            syncCursorBrushVisuals();
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

        syncCursorBrushVisuals();

        function syncFooterLinkAlias() {
            const alias = footerSlotAliases[footerSlotIndex] || footerSlotAliases[0];
            const email = `${alias}@qicore.ai`;
            footerLink.href = `mailto:${email}`;
            footerLink.setAttribute('aria-label', `Email ${email}`);
        }

        function setFooterSlotTransform(index, isResetting = false) {
            footerSlotTracks.forEach((track) => {
                track.classList.toggle('is-resetting', isResetting);
                track.style.transform = `translateY(${-footerSlotLineHeight * index}px)`;
            });
        }

        function resetFooterSlotLoop() {
            setFooterSlotTransform(0, true);
            footerSlotIndex = 0;
            syncFooterLinkAlias();
            requestAnimationFrame(() => {
                footerSlotTracks.forEach((track) => track.classList.remove('is-resetting'));
            });
        }

        function advanceFooterSlot() {
            if (footerSlotPaused) return;

            if (footerSlotIndex === 0) {
                footerSlotIndex = 1;
                setFooterSlotTransform(1);
                syncFooterLinkAlias();
                footerSlotAdvanceAt = performance.now() + 2200;
                return;
            }

            footerSlotIndex = 2;
            setFooterSlotTransform(2);
            syncFooterLinkAlias();

            window.setTimeout(() => {
                if (footerSlotIndex !== 2) return;
                resetFooterSlotLoop();
                footerSlotAdvanceAt = performance.now() + 2200;
            }, 700);
        }

        syncFooterLinkAlias();

        plxFooter.addEventListener('pointerenter', () => {
            footerSlotPaused = true;
        });

        plxFooter.addEventListener('pointerleave', () => {
            footerSlotPaused = false;
            footerSlotAdvanceAt = performance.now() + 900;
        });

        footerLink.addEventListener('focus', () => {
            footerSlotPaused = true;
        });

        footerLink.addEventListener('blur', () => {
            footerSlotPaused = false;
            footerSlotAdvanceAt = performance.now() + 900;
        });

        const shadowState = {
            dirty: true,
            paperRect: null,
            title: {
                rect: null, centerX: 0, centerY: 0,
                currentOffsetX: 0, currentOffsetY: 0, currentScaleX: 1, currentScaleY: 1,
                currentSkewX: 0, currentSkewY: 0, currentBlur: 0, currentOpacity: 0
            },
            slogan: {
                rect: null, centerX: 0, centerY: 0,
                currentOffsetX: 0, currentOffsetY: 0, currentScaleX: 1, currentScaleY: 1,
                currentSkewX: 0, currentSkewY: 0, currentBlur: 0, currentOpacity: 0
            },
            footer: {
                rect: null, centerX: 0, centerY: 0,
                currentOffsetX: 0, currentOffsetY: 0, currentScaleX: 1, currentScaleY: 1,
                currentSkewX: 0, currentSkewY: 0, currentBlur: 0, currentOpacity: 0
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
                stateEntry.centerX = sourceRect.left + sourceRect.width / 2;
                stateEntry.centerY = sourceRect.top + sourceRect.height / 2;
                shadowEl.style.left = `${rect.left}px`;
                shadowEl.style.top = `${rect.top}px`;
                shadowEl.style.width = `${rect.width}px`;
                shadowEl.style.height = `${rect.height}px`;
            };

            syncShadowGeometry(plxTitle, titleShadow, shadowState.title);
            syncShadowGeometry(plxSlogan, sloganShadow, shadowState.slogan);
            syncShadowGeometry(plxFooter, footerShadow, shadowState.footer);
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
            const targetBlur = isMobileView
                ? (options.mobileBlur ?? options.baseBlur)
                : options.baseBlur + energy * options.blurBoost;
            const targetOpacity = clamp(options.baseOpacity + energy * options.opacityBoost, options.baseOpacity, options.maxOpacity);
            const lerpFactor = options.smoothing;

            stateEntry.currentOffsetX += (targetOffsetX - stateEntry.currentOffsetX) * lerpFactor;
            stateEntry.currentOffsetY += (targetOffsetY - stateEntry.currentOffsetY) * lerpFactor;
            stateEntry.currentScaleX += (targetScaleX - stateEntry.currentScaleX) * lerpFactor;
            stateEntry.currentScaleY += (targetScaleY - stateEntry.currentScaleY) * lerpFactor;
            stateEntry.currentSkewX += (targetSkewX - stateEntry.currentSkewX) * lerpFactor;
            stateEntry.currentSkewY += (targetSkewY - stateEntry.currentSkewY) * lerpFactor;
            stateEntry.currentBlur += (targetBlur - stateEntry.currentBlur) * (lerpFactor * 0.85);
            stateEntry.currentOpacity += (targetOpacity - stateEntry.currentOpacity) * (lerpFactor * 0.9);

            shadowEl.style.transform = `translate3d(${stateEntry.currentOffsetX}px, ${stateEntry.currentOffsetY}px, 1px) scale(${stateEntry.currentScaleX}, ${stateEntry.currentScaleY}) skewX(${stateEntry.currentSkewX}deg) skewY(${stateEntry.currentSkewY}deg)`;
            if (shadowEl.style.filter !== `blur(${stateEntry.currentBlur}px)`) {
                shadowEl.style.filter = `blur(${stateEntry.currentBlur}px)`;
            }
            shadowEl.style.opacity = String(stateEntry.currentOpacity);
        }
        
        window.addEventListener('mousemove', (e) => {
            if (isMobileView || isPaletteBusy()) return;
            mouseX = e.clientX; mouseY = e.clientY;
        });

        let lastTime = performance.now();
        function renderLoop() {
            const now = performance.now();
            const dt = Math.max(1, now - lastTime);
            lastTime = now;

            if (!footerSlotPaused && now >= footerSlotAdvanceAt) {
                advanceFooterSlot();
            }

            let normX = 0, normY = 0;
            let scaleCube = 1;
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
                const cubeHalf = 24;
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
            
            const offsetX = lerpX - mouseX; 
            const offsetY = lerpY - mouseY;
            
            vX = (mouseX - prevMouseX) / dt; 
            vY = (mouseY - prevMouseY) / dt;
            prevMouseX = mouseX; 
            prevMouseY = mouseY;

            // 无论 PC 还是移动端，都保留基于速度的旋转翻滚和最基础的自转！
            const speed = Math.sqrt(vX * vX + vY * vY);
            scaleCube = 1 + Math.min(speed * 0.05, 0.3); 
            
            rotX -= 0.05 + vY * 8.0; 
            rotY += 0.08 + vX * 8.0;

            if (isMobileView) {
                normX = clamp(mobileTiltX * 0.42 + mobileCubeOffsetX / Math.max(1, window.innerWidth), -0.5, 0.5);
                normY = clamp(mobileTiltY * 0.42 + mobileCubeOffsetY / Math.max(1, window.innerHeight), -0.5, 0.5);
            } else {
                normX = clamp(lerpX / window.innerWidth - 0.5, -0.5, 0.5);
                normY = clamp(lerpY / window.innerHeight - 0.5, -0.5, 0.5);
            }

            if (sloganCard) {
                if (isMobileView) {
                    if (sloganExpanded) {
                        sloganExpanded = false;
                        sloganCard.classList.remove('is-expanded');
                    }
                } else {
                    const sloganRect = plxSlogan.getBoundingClientRect();
                    const padX = sloganExpanded ? 28 : 10;
                    const padY = sloganExpanded ? 24 : 10;
                    const isInsideSloganZone =
                        mouseX >= sloganRect.left - padX &&
                        mouseX <= sloganRect.right + padX &&
                        mouseY >= sloganRect.top - padY &&
                        mouseY <= sloganRect.bottom + padY;

                    if (isInsideSloganZone !== sloganExpanded) {
                        sloganExpanded = isInsideSloganZone;
                        sloganCard.classList.toggle('is-expanded', sloganExpanded);
                    }
                }
            }

            // 更新多色光标的物理坐标与旋转
            if (isPaletteBusy()) {
                cursorWrapper.style.transform = `translate3d(${paletteAnchorX}px, ${paletteAnchorY}px, 0)`;
            } else if (isMobileView) {
                const mobileRotX = normY * -12 + mobileRollX;
                const mobileRotY = normX * 12 + mobileRollY;
                cursorWrapper.style.transform = `translate3d(${window.innerWidth / 2}px, ${window.innerHeight / 2}px, 0)`;
                cursorCube.style.transform = `translate3d(${mobileCubeOffsetX}px, ${mobileCubeOffsetY}px, 0) scale(${1.02 + Math.min(speed * 0.015, 0.08)}) rotateX(${mobileRotX}deg) rotateY(${mobileRotY}deg)`;
            } else {
                cursorWrapper.style.transform = `translate3d(${lerpX}px, ${lerpY}px, 0)`;
                cursorCube.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scaleCube}) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
            }

            if (isPaletteBusy() || isMobileView) {
                cursorWrapper.classList.remove('is-contrast-text');
            } else {
                const cubeRect = cursorCube.getBoundingClientRect();
                const titleRect = plxTitle.getBoundingClientRect();
                const sloganRect = sloganCard ? sloganCard.getBoundingClientRect() : plxSlogan.getBoundingClientRect();
                const footerRect = plxFooter.getBoundingClientRect();
                const intersectsRect = (rect, padX = 0, padY = 0) =>
                    cubeRect.left <= rect.right + padX &&
                    cubeRect.right >= rect.left - padX &&
                    cubeRect.top <= rect.bottom + padY &&
                    cubeRect.bottom >= rect.top - padY;

                const useContrastBlend =
                    intersectsRect(titleRect, 10, 10) ||
                    intersectsRect(sloganRect, 10, 10) ||
                    intersectsRect(footerRect, 8, 8);

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

            // 全境 3D 倾斜
            const sceneRotX = isMobileView ? normY * -38 : normY * -25; 
            const sceneRotY = isMobileView ? normX * 38 : normX * 25;  
            paperCanvas.style.transform = `rotateX(${sceneRotX}deg) rotateY(${sceneRotY}deg)`;
            
            paperCanvas.style.boxShadow = isMobileView
                ? `${normX * -120}px ${normY * -120 + 44}px 120px rgba(0, 0, 0, 0.72)`
                : `${normX * -80}px ${normY * -80 + 40}px 100px rgba(0, 0, 0, 0.7)`;

            // 字体引力反馈
            if (shadowState.dirty || !shadowState.paperRect) {
                refreshProjectionGeometry();
            }
            const gravityX = isMobileView ? window.innerWidth / 2 + mobileCubeOffsetX : mouseX;
            const gravityY = isMobileView ? window.innerHeight / 2 + mobileCubeOffsetY : mouseY;
            const distToTitle = Math.hypot(gravityX - shadowState.title.centerX, gravityY - shadowState.title.centerY);
            const distRatio = distToTitle / (window.innerWidth * 0.4);
            const focusWeight = clamp(900 - distRatio * 700, 260, 900);
            const recoveryWeight = 430;
            const recoveryMix = clamp((distRatio - 0.55) / 0.75, 0, 1);
            const targetTitleWeight = focusWeight * (1 - recoveryMix) + recoveryWeight * recoveryMix;
            const titleWeightLerp = recoveryMix > 0 ? 0.045 : 0.14;
            titleWeightState += (targetTitleWeight - titleWeightState) * titleWeightLerp;
            const currentTitleWeight = Math.round(clamp(titleWeightState, 380, 900));
            if (currentTitleWeight !== appliedTitleWeight) {
                plxTitle.style.fontWeight = String(currentTitleWeight);
                appliedTitleWeight = currentTitleWeight;
            }
            if (shadowState.dirty) {
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
                baseBlur: 11,
                blurBoost: 18,
                mobileBlur: 10,
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
                baseBlur: 9,
                blurBoost: 13,
                mobileBlur: 8,
                baseOpacity: 0.22,
                opacityBoost: 0.18,
                maxOpacity: 0.48,
                smoothing: 0.16
            }, normX, normY);
            updateProjectionShadow(shadowState.footer, footerShadow, {
                depth: 34,
                baseDrop: 8,
                baseScaleY: 0.7,
                scaleXBoost: 0.07,
                scaleYDrop: 0.06,
                skewX: 10,
                skewY: 4,
                baseBlur: 7,
                blurBoost: 11,
                mobileBlur: 6,
                baseOpacity: 0.18,
                opacityBoost: 0.14,
                maxOpacity: 0.38,
                smoothing: 0.18
            }, normX, normY);

            requestAnimationFrame(renderLoop);
        }
        requestAnimationFrame(renderLoop);


})();
