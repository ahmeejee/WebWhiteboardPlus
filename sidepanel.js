// Advanced Side panel whiteboard implementation
class AdvancedSidePanelWhiteboard {
    constructor() {
        this.whiteboard = null;
        this.storageKey = 'sidepanel_whiteboard_data';
        this.currentTool = 'pen';
        this.activePanelTool = null; // Track which tool has its panel open
        this.defaultColors = [
            '#000000', '#ff0000', '#00ff00', '#0000ff', 
            '#ffff00', '#ff00ff', '#00ffff', '#ffa500'
        ];
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        // Initialize whiteboard engine
        this.whiteboard = new AdvancedWhiteboardEngine('whiteboard-canvas', 'canvas-container');
        
        // Set up callback to close panels when drawing starts
        this.whiteboard.onDrawingStart = () => {
            this.hideAllPanels();
        };
        
        // Setup all event listeners
        this.setupToolbar();
        this.setupColorPalette();
        this.setupSizeControl();
        this.setupViewControls();
        this.setupKeyboardShortcuts();
        
        // Load saved state
        this.loadFromStorage();
        
        // Auto-save setup
        this.setupAutoSave();
        
        // Update UI
        this.updateUI();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            setTimeout(() => this.whiteboard.resize(), 100);
        });
        
        // Update status on canvas changes
        this.whiteboard.canvas.addEventListener('mousemove', (e) => {
            this.updateCanvasPosition(e);
        });
    }
    
    setupToolbar() {
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
                    // Close shapes menu if it was open
                    const shapesMenu = document.getElementById('shapes-menu');
                    if (shapesMenu) {
                        shapesMenu.classList.remove('show');
                    }
                });
            }
        });
        
        // Shapes dropdown toggle
        const shapesBtn = document.getElementById('shapes-btn');
        const shapesMenu = document.getElementById('shapes-menu');
        if (shapesBtn && shapesMenu) {
            shapesBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // If shapes menu is already open, close all panels
                if (shapesMenu.classList.contains('show')) {
                    this.hideAllPanels();
                } else {
                    // Close color/thickness panels and open shapes menu
                    this.hideAllPanels();
                    shapesMenu.classList.add('show');
                }
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                shapesMenu.classList.remove('show');
            });
        }
        
        // Action buttons
        const actionButtons = {
            'undo-btn': () => this.whiteboard.undo(),
            'redo-btn': () => this.whiteboard.redo(),
            'clear-btn': () => this.confirmClear(),
            'save-btn': () => this.whiteboard.saveAsImage(),
            'delete-selected-btn': () => this.whiteboard.deleteSelectedObjects()
        };
        
        Object.entries(actionButtons).forEach(([buttonId, action]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', action);
            }
        });
        
        // Eraser size slider
        const eraserSizeSlider = document.getElementById('eraser-size-slider');
        if (eraserSizeSlider) {
            eraserSizeSlider.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                this.whiteboard.setSize(size);
                
                // Update eraser dot size
                const eraserDot = document.getElementById('eraser-dot');
                if (eraserDot) {
                    const dotSize = Math.max(4, Math.min(20, size / 2));
                    eraserDot.style.width = dotSize + 'px';
                    eraserDot.style.height = dotSize + 'px';
                }
            });
        }

        // Draw on page button
        const drawOnPageBtn = document.getElementById('draw-on-page-btn');
        if (drawOnPageBtn) {
            drawOnPageBtn.addEventListener('click', async () => {
                try {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (!tab || !tab.id) throw new Error('No active tab');

                    // Ensure CSS and script are injected (for pages where content_scripts didn't run)
                    try { await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['whiteboard.css'] }); } catch (_) {}
                    try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['draw-on-page.js'] }); } catch (_) {}

                    // Toggle draw-on-page
                    await chrome.tabs.sendMessage(tab.id, { action: 'toggleDrawOnPage' });
                } catch (err) {
                    chrome.runtime.sendMessage({ action: 'toggleDrawOnPageForActive' });
                } finally {
                    // Attempt to close the side panel window
                    try { window.close(); } catch (_) {}
                }
            });
        }
    }
    
    setupColorPalette() {
        // Color swatches
        const colorSwatches = document.querySelectorAll('.color-swatch');
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
        
        // Size slider in color panel (for drawing tools)
        const sizeSlider = document.getElementById('size-slider');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                this.whiteboard.setSize(size);
                
                // Update thickness dot visualization
                const thicknessDot = document.querySelector('.thickness-dot');
                if (thicknessDot) {
                    const dotSize = Math.max(2, Math.min(12, size));
                    thicknessDot.style.width = dotSize + 'px';
                    thicknessDot.style.height = dotSize + 'px';
                }
            });
        }
    }
    
    setupSizeControl() {
        const sizeSlider = document.getElementById('size-slider');
        const sizeDisplay = document.getElementById('size-display');
        
        if (sizeSlider && sizeDisplay) {
            // Set initial value based on current tool
            const currentSize = this.whiteboard.getSize();
            sizeSlider.value = currentSize;
            sizeDisplay.textContent = currentSize + 'px';
            
            sizeSlider.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                this.whiteboard.setSize(size);
                sizeDisplay.textContent = size + 'px';
            });
        }
    }
    
    setupViewControls() {
        const viewButtons = {
            'zoom-in-btn': () => this.zoomIn(),
            'zoom-out-btn': () => this.zoomOut(),
            'fit-btn': () => this.whiteboard.fitToContent(),
            'reset-view-btn': () => this.whiteboard.resetView()
        };
        
        Object.entries(viewButtons).forEach(([buttonId, action]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', action);
            }
        });
        
        // Update zoom display periodically
        setInterval(() => this.updateZoomDisplay(), 100);
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Prevent default behavior for our shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.whiteboard.redo();
                        } else {
                            this.whiteboard.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.whiteboard.redo();
                        break;
                    case 'a':
                        e.preventDefault();
                        this.whiteboard.selectAll();
                        break;
                    case 's':
                        e.preventDefault();
                        this.whiteboard.saveAsImage();
                        break;
                }
            } else {
                // Tool shortcuts
                switch (e.key.toLowerCase()) {
                    case 'p':
                        this.setActiveTool('pen-tool', 'pen');
                        break;
                    case 'e':
                        this.setActiveTool('eraser-tool', 'eraser');
                        break;
                    case 'v':
                        this.setActiveTool('select-tool', 'select');
                        break;
                    case 'r':
                        this.setActiveTool('rectangle-tool', 'rectangle');
                        break;
                    case 'c':
                        this.setActiveTool('circle-tool', 'circle');
                        break;
                    case 'l':
                        this.setActiveTool('line-tool', 'line');
                        break;
                    case 't':
                        this.setActiveTool('text-tool', 'text');
                        break;
                }
            }
        });
    }
    
    setActiveTool(activeButtonId, tool) {
        // Remove active class from all tool buttons
        const toolButtons = document.querySelectorAll('.top-tool-btn, .shape-option');
        toolButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to selected button
        const activeButton = document.getElementById(activeButtonId);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        // Update shapes button if a shape tool is selected
        const shapesBtn = document.getElementById('shapes-btn');
        if (tool === 'rectangle' || tool === 'circle' || tool === 'line') {
            if (shapesBtn) {
                shapesBtn.classList.add('active');
            }
        } else {
            if (shapesBtn) {
                shapesBtn.classList.remove('active');
            }
        }
        
        // Set tool in whiteboard
        this.whiteboard.setTool(tool);
        this.currentTool = tool;
        
        // Show appropriate panel based on tool
        this.showToolPanel(tool);
        
        // Update size slider for current tool
        this.updateSizeSlider();
        
        // Update UI
        this.updateUI();
    }
    
    showToolPanel(tool) {
        const colorPanel = document.getElementById('color-panel');
        const eraserPanel = document.getElementById('eraser-panel');
        const shapesMenu = document.getElementById('shapes-menu');
        
        // Check if clicking the same tool that already has its panel open
        const shouldToggleOff = (this.activePanelTool === tool);
        
        // Hide all panels first
        colorPanel.style.display = 'none';
        eraserPanel.style.display = 'none';
        if (shapesMenu) shapesMenu.classList.remove('show');
        
        // If toggling off, clear the active panel and return
        if (shouldToggleOff) {
            this.activePanelTool = null;
            return;
        }
        
        // Show appropriate panel and track it
        if (tool === 'eraser') {
            eraserPanel.style.display = 'block';
            this.activePanelTool = tool;
        } else if (tool !== 'select' && tool !== 'undo' && tool !== 'redo' && tool !== 'clear') {
            // Show color panel for drawing tools (including shapes)
            colorPanel.style.display = 'block';
            this.activePanelTool = tool;
        } else {
            // Utility tools don't have panels
            this.activePanelTool = null;
        }
    }
    
    setColor(color) {
        this.whiteboard.setColor(color);
        
        // Update color picker
        const colorPicker = document.getElementById('color-picker');
        if (colorPicker) {
            colorPicker.value = color;
        }
    }
    
    setActiveColorSwatch(activeSwatch) {
        // Remove active class and checkmarks from all color swatches
        const colorSwatches = document.querySelectorAll('.color-swatch');
        colorSwatches.forEach(swatch => {
            swatch.classList.remove('active');
            // Remove any existing checkmark SVGs
            const existingCheck = swatch.querySelector('svg');
            if (existingCheck) {
                existingCheck.remove();
            }
        });
        
        // Add active class to selected swatch
        if (activeSwatch) {
            activeSwatch.classList.add('active');
            // Add checkmark to active swatch
            const checkmark = document.createElement('svg');
            checkmark.setAttribute('width', '12');
            checkmark.setAttribute('height', '12');
            checkmark.setAttribute('viewBox', '0 0 12 12');
            checkmark.style.color = 'white';
            checkmark.innerHTML = '<path d="M10 3L4.5 8.5 2 6" stroke="currentColor" stroke-width="2" fill="none"/>';
            activeSwatch.appendChild(checkmark);
        }
    }
    
    clearActiveColorSwatch() {
        const colorSwatches = document.querySelectorAll('.color-swatch');
        colorSwatches.forEach(swatch => swatch.classList.remove('active'));
    }
    
    confirmClear() {
        if (confirm('Are you sure you want to clear the entire canvas? This action cannot be undone.')) {
            this.whiteboard.clear();
        }
    }
    
    hideAllPanels() {
        const colorPanel = document.getElementById('color-panel');
        const eraserPanel = document.getElementById('eraser-panel');
        const shapesMenu = document.getElementById('shapes-menu');
        
        if (colorPanel) colorPanel.style.display = 'none';
        if (eraserPanel) eraserPanel.style.display = 'none';
        if (shapesMenu) shapesMenu.classList.remove('show');
        
        // Clear active panel tracking
        this.activePanelTool = null;
    }
    
    updateSizeSlider() {
        const sizeSlider = document.getElementById('size-slider');
        const eraserSizeSlider = document.getElementById('eraser-size-slider');
        
        if (this.currentTool === 'eraser' && eraserSizeSlider) {
            const currentSize = this.whiteboard.getSize();
            eraserSizeSlider.value = currentSize;
            
            // Update eraser dot size
            const eraserDot = document.getElementById('eraser-dot');
            if (eraserDot) {
                const dotSize = Math.max(4, Math.min(20, currentSize / 2));
                eraserDot.style.width = dotSize + 'px';
                eraserDot.style.height = dotSize + 'px';
            }
        } else if (sizeSlider) {
            const currentSize = this.whiteboard.getSize();
            sizeSlider.value = currentSize;
            
            // Update thickness dot visualization
            const thicknessDot = document.querySelector('.thickness-dot');
            if (thicknessDot) {
                const dotSize = Math.max(2, Math.min(12, currentSize));
                thicknessDot.style.width = dotSize + 'px';
                thicknessDot.style.height = dotSize + 'px';
            }
        }
    }
    
    updateZoomDisplay() {
        const zoomDisplay = document.getElementById('zoom-display');
        if (zoomDisplay && this.whiteboard) {
            const zoom = Math.round(this.whiteboard.zoom * 100);
            zoomDisplay.textContent = zoom + '%';
        }
    }
    
    updateCanvasPosition(e) {
        const canvasPosition = document.getElementById('canvas-position');
        if (canvasPosition && this.whiteboard) {
            const pos = this.whiteboard.getMousePos(e);
            canvasPosition.textContent = `${Math.round(pos.x)}, ${Math.round(pos.y)}`;
        }
    }
    
    updateUI() {
        // Update tool status
        const toolStatus = document.getElementById('tool-status');
        if (toolStatus) {
            const toolNames = {
                'pen': 'Pen Tool',
                'eraser': 'Eraser Tool',
                'select': 'Select Tool',
                'rectangle': 'Rectangle Tool',
                'circle': 'Circle Tool',
                'line': 'Line Tool',
                'text': 'Text Tool'
            };
            toolStatus.textContent = toolNames[this.currentTool] || 'Unknown Tool';
        }
        
        // Update object count
        const objectCount = document.getElementById('object-count');
        if (objectCount && this.whiteboard) {
            const count = this.whiteboard.objects.length;
            objectCount.textContent = `${count} object${count !== 1 ? 's' : ''}`;
        }
        
        // Update selection info
        this.updateSelectionInfo();
        
        // Schedule next update
        requestAnimationFrame(() => {
            if (this.whiteboard) {
                this.updateSelectionInfo();
            }
        });
    }
    
    updateSelectionInfo() {
        const selectionInfo = document.getElementById('selection-info');
        const selectionCount = document.getElementById('selection-count');
        
        if (selectionInfo && selectionCount && this.whiteboard) {
            const selectedCount = this.whiteboard.selectedObjects.length;
            
            if (selectedCount > 0) {
                selectionInfo.classList.add('show');
                selectionCount.textContent = selectedCount;
            } else {
                selectionInfo.classList.remove('show');
            }
        }
    }
    
    zoomIn() {
        if (this.whiteboard) {
            const newZoom = Math.min(this.whiteboard.zoom * 1.2, this.whiteboard.maxZoom);
            this.whiteboard.zoomTo(newZoom, 
                this.whiteboard.canvas.width / 2, 
                this.whiteboard.canvas.height / 2
            );
        }
    }
    
    zoomOut() {
        if (this.whiteboard) {
            const newZoom = Math.max(this.whiteboard.zoom / 1.2, this.whiteboard.minZoom);
            this.whiteboard.zoomTo(newZoom, 
                this.whiteboard.canvas.width / 2, 
                this.whiteboard.canvas.height / 2
            );
        }
    }
    
    confirmClear() {
        if (confirm('Are you sure you want to clear the whiteboard? This action cannot be undone.')) {
            this.whiteboard.clear();
            this.updateUI();
        }
    }
    
    setupAutoSave() {
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
            }, 1000);
        };
        
        // Also update UI on render
        const originalRender = this.whiteboard.render.bind(this.whiteboard);
        this.whiteboard.render = () => {
            originalRender();
            this.updateUI();
        };
    }
    
    async saveToStorage() {
        try {
            const state = {
                objects: this.whiteboard.objects,
                canvasOffset: this.whiteboard.canvasOffset,
                zoom: this.whiteboard.zoom,
                toolSettings: this.whiteboard.toolSettings
            };
            
            await chrome.storage.local.set({
                [this.storageKey]: JSON.stringify(state)
            });
        } catch (error) {
            console.error('Failed to save to storage:', error);
        }
    }
    
    async loadFromStorage() {
        try {
            const result = await chrome.storage.local.get([this.storageKey]);
            const savedData = result[this.storageKey];
            
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

// Initialize advanced side panel whiteboard
new AdvancedSidePanelWhiteboard();