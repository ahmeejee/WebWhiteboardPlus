// Advanced Draw-on-page content script
class AdvancedDrawOnPageWhiteboard {
    constructor() {
        this.isActive = false;
        this.whiteboard = null;
        this.overlay = null;
        this.toolbar = null;
        this.toggleButton = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.storageKey = 'draw_on_page_whiteboard_data';
        this.currentTool = 'pen';
        
        this.init();
    }
    
    init() {
        // Don't initialize on iframes or if already initialized
        if (window !== window.top || document.getElementById('whiteboard-overlay')) {
            return;
        }
        
        // Wait for page to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.createOverlay();
        this.createToolbar();
        this.setupEventListeners();
        this.loadFromStorage();
    }
    

    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'whiteboard-overlay';
        this.overlay.className = 'whiteboard-overlay';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'whiteboard-overlay-canvas';
        canvas.className = 'whiteboard-canvas';
        canvas.style.cursor = 'crosshair';
        canvas.style.background = 'transparent';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        // Set actual canvas dimensions to full viewport
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        this.overlay.appendChild(canvas);
        document.body.appendChild(this.overlay);
        console.log('Created overlay and canvas covering full viewport');
    }
    
    createToolbar() {
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'whiteboard-overlay-toolbar fade-in';
        this.toolbar.innerHTML = `
            <div class="toolbar-drag-handle">
                <span class="drag-icon">⋮⋮</span>
                <span style="font-size: 11px; font-weight: 500; color: #666;">WebWhiteboard+</span>
                <button id="close-btn-overlay" style="background: none; border: none; color: #999; font-size: 14px; cursor: pointer; padding: 2px 4px;" title="Close">✕</button>
            </div>
            <div class="top-toolbar" id="overlay-top-toolbar">
                <div class="toolbar-group">
                    <button class="top-tool-btn active" id="select-tool" title="Select Tool">
                        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M1 1l4 13 3-8 8-3L1 1z" fill="currentColor"/></svg>
                    </button>
                    <button class="top-tool-btn" id="pen-tool" title="Pen Tool">
                        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" fill="currentColor"/></svg>
                    </button>
                    <div class="shapes-dropdown">
                        <button class="top-tool-btn" id="shapes-btn" title="Shapes">
                            <svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
                            <svg width="8" height="8" viewBox="0 0 8 8" class="dropdown-arrow"><path d="M2 3l2 2 2-2z" fill="currentColor"/></svg>
                        </button>
                        <div class="shapes-menu" id="shapes-menu">
                            <button class="shape-option" id="rectangle-tool" data-tool="rectangle">
                                <svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
                                <span>Rectangle</span>
                    </button>
                            <button class="shape-option" id="circle-tool" data-tool="circle">
                                <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
                                <span>Circle</span>
                    </button>
                            <button class="shape-option" id="line-tool" data-tool="line">
                                <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 14l12-12" stroke="currentColor" stroke-width="1.5"/></svg>
                                <span>Line</span>
                    </button>
                </div>
            </div>
                    <button class="top-tool-btn" id="text-tool" title="Text">
                        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M5.5 2a.5.5 0 0 0 0 1h1.09L5.09 14H4a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1H6.91L8.41 3h1.09a.5.5 0 0 0 0-1H5.5z" fill="currentColor"/></svg>
                    </button>
                    <button class="top-tool-btn" id="eraser-tool" title="Eraser">
                        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828l6.879-6.879zm2.121.707a1 1 0 0 0-1.414 0L4.16 7.547l5.293 5.293 4.633-4.633a1 1 0 0 0 0-1.414l-3.879-3.879zM8.746 13.547 3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293l.16-.16z" fill="currentColor"/></svg>
                    </button>
                </div>
                
                <div class="toolbar-divider"></div>
                
                <div class="toolbar-group">
                    <button class="top-tool-btn" id="undo-btn" title="Undo">
                        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z" fill="currentColor"/><path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z" fill="currentColor"/></svg>
                    </button>
                    <button class="top-tool-btn" id="redo-btn" title="Redo">
                        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" fill="currentColor"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966a.25.25 0 0 1 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" fill="currentColor"/></svg>
                    </button>
                    <button class="top-tool-btn" id="clear-btn" title="Clear Canvas">
                        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z" fill="currentColor"/></svg>
                    </button>
                </div>
            </div>
            
            <div class="color-panel top-panel" id="color-panel" style="display: none;">
                <div class="color-section">
                    <div class="color-header">
                        <div class="thickness-control">
                            <span class="thickness-dot" style="width: 4px; height: 4px;"></span>
                            <input type="range" id="size-slider" min="1" max="20" value="2" class="thickness-slider">
                            <span class="thickness-label">Thickness</span>
                </div>
            </div>
                    <div class="all-colors">
                        <h4>All colors</h4>
                        <div class="color-grid">
                            <div class="color-swatch" data-color="#000000" style="background-color: #000000;"></div>
                            <div class="color-swatch" data-color="#ff0000" style="background-color: #ff0000;"></div>
                            <div class="color-swatch" data-color="#00ff00" style="background-color: #00ff00;"></div>
                            <div class="color-swatch" data-color="#0000ff" style="background-color: #0000ff;"></div>
                            <div class="color-swatch" data-color="#ffff00" style="background-color: #ffff00;"></div>
                            <div class="color-swatch" data-color="#ff00ff" style="background-color: #ff00ff;"></div>
                            <div class="color-swatch" data-color="#00ffff" style="background-color: #00ffff;"></div>
                            <div class="color-swatch add-color">
                                <input type="color" id="color-picker" value="#000000" style="opacity: 0; position: absolute;">
                                <span style="font-size: 18px; color: #999;">+</span>
                            </div>
                </div>
            </div>
                </div>
            </div>
            
            <div class="eraser-panel top-panel" id="eraser-panel" style="display: none;">
                <div class="thickness-control">
                    <span class="thickness-dot" id="eraser-dot" style="width: 8px; height: 8px;"></span>
                    <input type="range" id="eraser-size-slider" min="5" max="50" value="20" class="thickness-slider">
                    <span class="thickness-label">Size</span>
                </div>
            </div>
            
            <div class="selection-info" id="selection-info" style="margin-top: 8px;">
                <span id="selection-count">0</span> objects selected
                <div class="selection-controls">
                    <button class="toolbar-button" id="delete-selected-btn" title="Delete Selected">
                        <span class="tool-icon">🗑️</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.toolbar);
        this.toolbar.style.display = 'none';
        this.setupToolbarDragging();
        this.setupToolbarEvents();
    }
    
    setupToolbarDragging() {
        const dragHandle = this.toolbar.querySelector('.toolbar-drag-handle');
        
        dragHandle.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.toolbar.classList.add('dragging');
            
            const rect = this.toolbar.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            
            // Keep toolbar within viewport
            const maxX = window.innerWidth - this.toolbar.offsetWidth;
            const maxY = window.innerHeight - this.toolbar.offsetHeight;
            
            this.toolbar.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
            this.toolbar.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
            this.toolbar.style.right = 'auto';
            
            e.preventDefault();
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.toolbar.classList.remove('dragging');
            }
        });
    }
    
    setupToolbarEvents() {
        // Tool buttons
        const toolButtons = {
            'pen-tool': 'pen',
            'eraser-tool': 'eraser',
            'select-tool': 'select',
            'rectangle-tool': 'rectangle',
            'circle-tool': 'circle',
            'line-tool': 'line',
            'text-tool': 'text'
        };
        
        Object.entries(toolButtons).forEach(([buttonId, tool]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    this.setActiveTool(buttonId, tool);
                    const shapesMenu = document.getElementById('shapes-menu');
                    if (shapesMenu) shapesMenu.classList.remove('show');
                });
            }
        });

        // Shapes dropdown toggle
        const shapesBtn = document.getElementById('shapes-btn');
        const shapesMenu = document.getElementById('shapes-menu');
        if (shapesBtn && shapesMenu) {
            shapesBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideAllPanels();
                shapesMenu.classList.toggle('show');
            });
            document.addEventListener('click', () => shapesMenu.classList.remove('show'));
        }

        // Action buttons
        const actionButtons = {
            'undo-btn': () => this.whiteboard.undo(),
            'redo-btn': () => this.whiteboard.redo(),
            'clear-btn': () => this.confirmClear(),
            'delete-selected-btn': () => this.whiteboard.deleteSelectedObjects(),
            'close-btn-overlay': () => this.deactivate()
        };
        Object.entries(actionButtons).forEach(([buttonId, action]) => {
            const button = document.getElementById(buttonId);
            if (button) button.addEventListener('click', action);
        });
        
        // Color swatches
        const colorSwatches = document.querySelectorAll('.color-panel .color-swatch');
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                const color = swatch.getAttribute('data-color');
                this.setColor(color);
                this.setActiveColorSwatch(swatch);
            });
        });
        
        // Custom color picker
        const colorPicker = document.getElementById('color-picker');
        if (colorPicker) {
            colorPicker.addEventListener('change', (e) => {
                this.setColor(e.target.value);
                this.clearActiveColorSwatch();
            });
        }
        
        // Size slider in color panel
        const sizeSlider = document.getElementById('size-slider');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                this.whiteboard.setSize(size);
                const thicknessDot = document.querySelector('.thickness-dot');
                if (thicknessDot) {
                    const dotSize = Math.max(2, Math.min(12, size));
                    thicknessDot.style.width = dotSize + 'px';
                    thicknessDot.style.height = dotSize + 'px';
                }
            });
        }

        // Eraser size slider
        const eraserSizeSlider = document.getElementById('eraser-size-slider');
        if (eraserSizeSlider) {
            eraserSizeSlider.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                this.whiteboard.setSize(size);
                const eraserDot = document.getElementById('eraser-dot');
                if (eraserDot) {
                    const dotSize = Math.max(4, Math.min(20, size / 2));
                    eraserDot.style.width = dotSize + 'px';
                    eraserDot.style.height = dotSize + 'px';
                }
            });
        }
    }
    
    setupEventListeners() {
        // ESC key to exit
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.deactivate();
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            if (this.isActive && this.whiteboard) {
                const canvas = document.getElementById('whiteboard-overlay-canvas');
                if (canvas) {
                    // Always use full viewport dimensions
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    canvas.style.width = '100vw';
                    canvas.style.height = '100vh';
                    this.whiteboard.setupCanvas();
                }
            }
        });
        
        // Auto-save
        this.setupAutoSave();
        
        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'toggleDrawOnPage') {
                console.log('Received toggleDrawOnPage message');
                this.toggle();
                sendResponse({ success: true });
            }
        });
    }
    
    toggle() {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }
    
    activate() {
        this.isActive = true;
        this.overlay.classList.add('active');
        this.toolbar.style.display = 'flex'; // Show the toolbar
        console.log('Activating draw-on-page mode');
        
        // Initialize whiteboard if not already done
        if (!this.whiteboard) {
            this.whiteboard = new AdvancedWhiteboardEngine('whiteboard-overlay-canvas');
            this.whiteboard.setColor('#000000'); // Default to black
            this.whiteboard.setSize(3);
            
            // Set up callback to close panels when drawing starts
            this.whiteboard.onDrawingStart = () => {
                this.hideAllPanels();
            };
            
            this.loadFromStorage();
            this.setupAutoSave();
        }
        
        // Prevent page scrolling and zooming
        this.preventScrollAndZoom();
        
        // Update UI
        this.updateUI();
    }
    
    deactivate() {
        this.isActive = false;
        this.overlay.classList.remove('active');
        this.toolbar.style.display = 'none';
        console.log('Deactivating draw-on-page mode');
        
        // Restore page scrolling and zooming
        this.restoreScrollAndZoom();
        
        // Save current state
        this.saveToStorage();
    }
    
    setActiveTool(activeButtonId, tool) {
        // Remove active class from all tool buttons
        const toolButtons = document.querySelectorAll('.top-tool-btn, .shape-option');
        toolButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to selected button
        const activeButton = document.getElementById(activeButtonId);
        if (activeButton) activeButton.classList.add('active');

        // Update shapes button active state
        const shapesBtn = document.getElementById('shapes-btn');
        if (shapesBtn) {
            if (tool === 'rectangle' || tool === 'circle' || tool === 'line') shapesBtn.classList.add('active');
            else shapesBtn.classList.remove('active');
        }
        
        // Set tool in whiteboard
        this.whiteboard.setTool(tool);
        this.currentTool = tool;

        // Show appropriate panel
        this.showToolPanel(tool);
        
        // Update size slider for current tool
        this.updateSizeSlider();
        
        // Update UI
        this.updateUI();
    }
    
    setColor(color) {
        this.whiteboard.setColor(color);
        
        // Update color picker
        const colorPicker = document.getElementById('color-picker-overlay');
        if (colorPicker) {
            colorPicker.value = color;
        }
    }
    
    setActiveColorSwatch(activeSwatch) {
        // Remove active class from all color swatches
        const colorSwatches = this.toolbar.querySelectorAll('.color-swatch');
        colorSwatches.forEach(swatch => swatch.classList.remove('active'));
        
        // Add active class to selected swatch
        if (activeSwatch) {
            activeSwatch.classList.add('active');
        }
    }
    
    clearActiveColorSwatch() {
        const colorSwatches = this.toolbar.querySelectorAll('.color-swatch');
        colorSwatches.forEach(swatch => swatch.classList.remove('active'));
    }
    
    updateSizeSlider() {
        const sizeSlider = document.getElementById('size-slider');
        const eraserSizeSlider = document.getElementById('eraser-size-slider');
        const currentSize = this.whiteboard ? this.whiteboard.getSize() : 2;

        if (this.currentTool === 'eraser' && eraserSizeSlider) {
            eraserSizeSlider.value = currentSize;
            const eraserDot = document.getElementById('eraser-dot');
            if (eraserDot) {
                const dotSize = Math.max(4, Math.min(20, currentSize / 2));
                eraserDot.style.width = dotSize + 'px';
                eraserDot.style.height = dotSize + 'px';
            }
        } else if (sizeSlider) {
            sizeSlider.value = currentSize;
            const thicknessDot = document.querySelector('.thickness-dot');
            if (thicknessDot) {
                const dotSize = Math.max(2, Math.min(12, currentSize));
                thicknessDot.style.width = dotSize + 'px';
                thicknessDot.style.height = dotSize + 'px';
            }
        }
    }
    
    updateUI() {
        if (!this.whiteboard) return;
        const selectionInfo = document.getElementById('selection-info');
        const selectionCount = document.getElementById('selection-count');
        if (selectionInfo && selectionCount) {
            const selectedCount = this.whiteboard.selectedObjects.length;
            if (selectedCount > 0) {
                selectionInfo.classList.add('show');
                selectionCount.textContent = selectedCount;
            } else {
                selectionInfo.classList.remove('show');
            }
        }
    }

    hideAllPanels() {
        const colorPanel = document.getElementById('color-panel');
        const eraserPanel = document.getElementById('eraser-panel');
        const shapesMenu = document.getElementById('shapes-menu');
        if (colorPanel) colorPanel.style.display = 'none';
        if (eraserPanel) eraserPanel.style.display = 'none';
        if (shapesMenu) shapesMenu.classList.remove('show');
    }

    showToolPanel(tool) {
        const colorPanel = document.getElementById('color-panel');
        const eraserPanel = document.getElementById('eraser-panel');
        const shapesMenu = document.getElementById('shapes-menu');
        if (!colorPanel || !eraserPanel) return;
        colorPanel.style.display = 'none';
        eraserPanel.style.display = 'none';
        if (shapesMenu) shapesMenu.classList.remove('show');
        if (tool === 'eraser') eraserPanel.style.display = 'block';
        else if (tool !== 'select') colorPanel.style.display = 'block';
    }

    preventScrollAndZoom() {
        // Store original values to restore later
        this.originalBodyStyle = {
            overflow: document.body.style.overflow,
            position: document.body.style.position,
            touchAction: document.body.style.touchAction
        };
        this.originalHtmlStyle = {
            overflow: document.documentElement.style.overflow,
            touchAction: document.documentElement.style.touchAction
        };
        
        // Prevent scrolling
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // Prevent touch gestures (pinch-to-zoom, swipe scrolling)
        document.body.style.touchAction = 'none';
        document.documentElement.style.touchAction = 'none';
        
        // Prevent wheel events from scrolling/zooming the page
        this.wheelHandler = (e) => {
            // Only prevent if the event is not on the toolbar
            if (!e.target.closest('.whiteboard-overlay-toolbar')) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        
        // Prevent keyboard scrolling
        this.keyHandler = (e) => {
            const scrollKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' '];
            if (scrollKeys.includes(e.key) && !e.target.closest('.whiteboard-overlay-toolbar')) {
                e.preventDefault();
            }
        };
        
        // Add event listeners with passive: false to ensure preventDefault works
        document.addEventListener('wheel', this.wheelHandler, { passive: false });
        document.addEventListener('touchmove', this.wheelHandler, { passive: false });
        document.addEventListener('keydown', this.keyHandler, { passive: false });
        
        // Prevent context menu which can interfere with drawing
        this.contextMenuHandler = (e) => {
            if (!e.target.closest('.whiteboard-overlay-toolbar')) {
                e.preventDefault();
            }
        };
        document.addEventListener('contextmenu', this.contextMenuHandler);
    }

    restoreScrollAndZoom() {
        // Restore original body styles
        if (this.originalBodyStyle) {
            document.body.style.overflow = this.originalBodyStyle.overflow;
            document.body.style.position = this.originalBodyStyle.position;
            document.body.style.touchAction = this.originalBodyStyle.touchAction;
        }
        
        // Restore original html styles
        if (this.originalHtmlStyle) {
            document.documentElement.style.overflow = this.originalHtmlStyle.overflow;
            document.documentElement.style.touchAction = this.originalHtmlStyle.touchAction;
        }
        
        // Remove event listeners
        if (this.wheelHandler) {
            document.removeEventListener('wheel', this.wheelHandler);
            document.removeEventListener('touchmove', this.wheelHandler);
        }
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
        if (this.contextMenuHandler) {
            document.removeEventListener('contextmenu', this.contextMenuHandler);
        }
        
        // Clean up references
        this.wheelHandler = null;
        this.keyHandler = null;
        this.contextMenuHandler = null;
        this.originalBodyStyle = null;
        this.originalHtmlStyle = null;
    }
    
    confirmClear() {
        if (confirm('Are you sure you want to clear all drawings on this page?')) {
            this.whiteboard.clear();
            this.updateUI();
        }
    }
    
    setupAutoSave() {
        if (!this.whiteboard) return;
        
        // Save to storage after drawing operations
        let saveTimeout;
        const originalSaveState = this.whiteboard.saveState.bind(this.whiteboard);
        
        this.whiteboard.saveState = () => {
            originalSaveState();
            
            // Update UI immediately
            this.updateUI();
            
            // Debounce saving to storage
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                this.saveToStorage();
            }, 2000);
        };
        
        // Also update UI on render
        const originalRender = this.whiteboard.render.bind(this.whiteboard);
        this.whiteboard.render = () => {
            originalRender();
            this.updateUI();
        };
    }
    
    async saveToStorage() {
        if (!this.whiteboard) return;
        
        try {
            const state = {
                objects: this.whiteboard.objects,
                canvasOffset: this.whiteboard.canvasOffset,
                zoom: this.whiteboard.zoom,
                toolSettings: this.whiteboard.toolSettings
            };
            
            const url = window.location.href;
            const key = `${this.storageKey}_${btoa(url).slice(0, 50)}`;
            
            await chrome.storage.local.set({
                [key]: JSON.stringify(state)
            });
        } catch (error) {
            console.error('Failed to save to storage:', error);
        }
    }
    
    async loadFromStorage() {
        if (!this.whiteboard) return;
        
        try {
            const url = window.location.href;
            const key = `${this.storageKey}_${btoa(url).slice(0, 50)}`;
            const result = await chrome.storage.local.get([key]);
            const savedData = result[key];
            
            if (savedData) {
                const state = JSON.parse(savedData);
                
                // Restore objects
                this.whiteboard.objects = state.objects || [];
                
                // Restore view
                if (state.canvasOffset) {
                    this.whiteboard.canvasOffset = state.canvasOffset;
                }
                if (state.zoom) {
                    this.whiteboard.zoom = state.zoom;
                }
                
                // Restore tool settings
                if (state.toolSettings) {
                    this.whiteboard.toolSettings = { ...this.whiteboard.toolSettings, ...state.toolSettings };
                }
                
                // Update display
                this.whiteboard.render();
                this.updateUI();
            }
        } catch (error) {
            console.error('Failed to load from storage:', error);
        }
    }
}

// Initialize advanced draw-on-page whiteboard
if (typeof chrome !== 'undefined' && chrome.storage) {
    new AdvancedDrawOnPageWhiteboard();
}