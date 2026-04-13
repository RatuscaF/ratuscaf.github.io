// "Every great game begins with a single scene. Let's make this one unforgettable!"

export class SongSelect extends Phaser.Scene {
    constructor() {
        super('SongSelect');
    }

    init() {
        // Initialize scene
    }

    preload() {
        // Load assets
        this.load.json('songs', 'assets/songs/songs.json');
    }

    create() {
        const {width, height} = this.scale
        const data = this.cache.json.get('songs');
        
        // Title
        const title = this.add.text(width / 2, height * 0.15, 'Danseaza pana mori! :D', {
            fontSize: '36px',
            fill: '#ffffff',
        }).setOrigin(0.5);
        const instructions = this.add.text(width / 2, title.y + 50,
             'Two player game, click the buttons based on the rhythm. Player 1 clicks the buttons from the left side of the screen; Player 2 from the right side',
              {
            fontSize: '16px',
            fill: '#ffffff',
            wordWrap: { width: width - 40 },
            align: 'center'
        }).setOrigin(0.5);

        // Grid Configuration
        const columns = 3;
        const buttonWidth = 360;
        const buttonHeight = 160;
        const spacing = 20; // Gap between buttons
        const gridWidth = (columns * buttonWidth) + ((columns - 1) * spacing);  
        const startX = (width - gridWidth) / 2 + (buttonWidth / 2);
        const startY = instructions.y + 120; // Start below instructions
        
        // Scrolling setup
        const viewportHeight = 350; // Height of visible song area (reduced to avoid overlaps)
        const viewportWidth = width;
        const buttonTopPadding = 80; // Padding at top to fully show first row (accounts for button origin)
        const songCount = Array.isArray(data) ? data.length : 0;
        const totalRows = Math.ceil(songCount / columns);
        const gridHeight = buttonTopPadding + ((totalRows * (buttonHeight + spacing)) - spacing); // Total grid height with padding
        this.scrollOffset = 0;
        this.maxScrollOffset = Math.max(0, gridHeight - viewportHeight);
        
        // Create container to hold all song boxes
        const songContainer = this.add.container(0, startY);
        this.songContainer = songContainer;
        this.startY = startY;
        this.viewportHeight = viewportHeight;
        this.buttonTopPadding = buttonTopPadding;
        
        // Create viewport mask to clip content
        const maskGraphics = this.make.graphics({ x: 0, y: startY, add: false });
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillRect(0, 0, viewportWidth, viewportHeight);
        const mask = maskGraphics.createGeometryMask();
        songContainer.setMask(mask);

        if (Array.isArray(data)) {
            data.forEach((song, index) => {
                const col = index % columns;
                const row = Math.floor(index / columns);

                const xPos = startX + (col * (buttonWidth + spacing));
                const yPos = buttonTopPadding + (row * (buttonHeight + spacing));
                this.createSongBox(xPos, yPos, song, buttonWidth, buttonHeight, songContainer);
            });
        }
        
        // Add scroll input handlers
        this.input.on('pointerwheel', (pointer, over, deltaX, deltaY) => {
            const scrollAmount = 40;
            this.scrollOffset -= deltaY > 0 ? scrollAmount : -scrollAmount;
            this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, 0, this.maxScrollOffset);
            songContainer.setY(this.startY - this.scrollOffset);
            // Update scrollbar after scroll happens
            if (this.updateScrollbar) this.updateScrollbar();
        });
        
        // Keyboard scroll (Arrow Up/Down and W/S)
        this.input.keyboard.on('keydown', (event) => {
            const scrollAmount = 40;
            if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
                this.scrollOffset -= scrollAmount;
            } else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
                this.scrollOffset += scrollAmount;
            }
            this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, 0, this.maxScrollOffset);
            songContainer.setY(this.startY - this.scrollOffset);
            // Update scrollbar after scroll happens
            if (this.updateScrollbar) this.updateScrollbar();
        });
        
        // Scrollbar setup
        const scrollbarWidth = 20;
        const scrollbarX = width - scrollbarWidth / 2;
        const scrollbarTrackY = this.startY + this.viewportHeight / 2;
        const scrollbarHeight = this.viewportHeight;
        
        // Create scrollbar track (background)
        const scrollbarTrack = this.add.rectangle(scrollbarX, scrollbarTrackY, scrollbarWidth - 4, scrollbarHeight, 0x333333, 0.3);
        scrollbarTrack.setOrigin(0.5);
        
        // Create scrollbar thumb (draggable handle)
        const thumbHeight = Math.max(20, (this.viewportHeight / (this.gridHeight || this.viewportHeight)) * scrollbarHeight);
        const scrollbarThumb = this.add.rectangle(scrollbarX, scrollbarTrackY, scrollbarWidth - 6, thumbHeight, 0xccaa00, 0.8);
        scrollbarThumb.setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        this.scrollbarThumb = scrollbarThumb;
        this.scrollbarTrackY = scrollbarTrackY;
        this.scrollbarHeight = scrollbarHeight;
        this.scrollbarWidth = scrollbarWidth;
        this.scrollbarX = scrollbarX;
        
        // Update scrollbar position function
        const updateScrollbar = () => {
            const thumbY = scrollbarTrackY - (scrollbarHeight / 2) + ((this.scrollOffset / this.maxScrollOffset) * (scrollbarHeight - thumbHeight));
            scrollbarThumb.setY(thumbY);
        };
        updateScrollbar();
        
        // Store reference for use in other handlers
        this.updateScrollbar = updateScrollbar;
        this.gridHeight = gridHeight;
        let dragStartY = 0;
        let dragStartOffset = 0;
        let isDraggingScrollbar = false;
        
        this.input.on('pointerdown', (pointer) => {
            // Check if dragging scrollbar
            if (this.maxScrollOffset > 0 && Math.abs(pointer.x - scrollbarX) < scrollbarWidth && 
                pointer.y >= scrollbarTrackY - scrollbarHeight / 2 && pointer.y <= scrollbarTrackY + scrollbarHeight / 2) {
                isDraggingScrollbar = true;
                dragStartY = pointer.y;
                dragStartOffset = this.scrollOffset;
                return;
            }
            
            // Only drag scroll if pointer is over the viewport area and not over scrollbar
            if (pointer.y >= this.startY && pointer.y <= this.startY + this.viewportHeight
                && pointer.x < scrollbarX - scrollbarWidth / 2) {
                dragStartY = pointer.y;
                dragStartOffset = this.scrollOffset;
            }
        });
        
        this.input.on('pointermove', (pointer) => {
            if (!pointer.isDown) return;
            
            if (isDraggingScrollbar && this.maxScrollOffset > 0) {
                const dragDelta = pointer.y - dragStartY;
                const scrollbarRange = this.scrollbarHeight - thumbHeight;
                this.scrollOffset = (dragDelta / scrollbarRange) * this.maxScrollOffset + dragStartOffset;
                this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, 0, this.maxScrollOffset);
            } else if (dragStartY > 0) {
                const dragDelta = dragStartY - pointer.y;
                this.scrollOffset = dragStartOffset + dragDelta;
                this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, 0, this.maxScrollOffset);
            }
            
            songContainer.setY(this.startY - this.scrollOffset);
            updateScrollbar();
        });
        
        this.input.on('pointerup', () => {
            dragStartY = 0;
            isDraggingScrollbar = false;
        });

        const editorBtn = this.add.text(width / 2, height - 40, '🎼 CHART EDITOR', {
            fontSize: '22px',
            fill: '#000000',
            backgroundColor: '#ffaa00',
            padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setInteractive();

        editorBtn.on('pointerdown', () => this.scene.start('ChartEditor'));
    }

    createSongBox(x, y, song, w, h, parentContainer) {
        const container = this.add.container(x, y);

        // Background
        const bg = this.add.rectangle(0, 0, w, h, 0xe3c240, 0.5)
            .setInteractive({ useHandCursor: true });

        // Text
        const txt = this.add.text(0, 0, song.name || 'Song', {
            fontSize: '19px',
            fill: '#ffffff',
            wordWrap: { width: w - 10 }
        }).setOrigin(0.5);

        container.add([bg, txt]);

        bg.on('pointerdown', () => {
            this.toGame(song);
        });
        
        // Add the song box container to the parent scrollable container
        parentContainer.add(container);
    }

    toGame(song) {
        this.scene.start('Game', { song });
    }
}