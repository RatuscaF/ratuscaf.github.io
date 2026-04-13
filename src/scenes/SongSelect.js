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
        const startY = instructions.y + 65; // Start below instructions
        
        // Pagination setup
        const songsPerPage = 6; // 2 rows of 3 columns
        const songCount = Array.isArray(data) ? data.length : 0;
        const totalPages = Math.ceil(songCount / songsPerPage);
        this.currentPage = 0;
        this.totalPages = totalPages;
        this.data = data;
        this.columns = columns;
        this.startX = startX;
        this.startY = startY;
        this.buttonWidth = buttonWidth;
        this.buttonHeight = buttonHeight;
        this.spacing = spacing;
        this.songsPerPage = songsPerPage;
        
        // Create container to hold current page song boxes
        const songContainer = this.add.container(0, startY);
        this.songContainer = songContainer;
        
        // Function to render songs for current page
        const renderPage = () => {
            // Clear existing children
            songContainer.removeAll(true);
            
            const pageStartIndex = this.currentPage * this.songsPerPage;
            const pageEndIndex = Math.min(pageStartIndex + this.songsPerPage, this.data.length);
            const pageSongs = this.data.slice(pageStartIndex, pageEndIndex);
            
            if (Array.isArray(pageSongs)) {
                pageSongs.forEach((song, index) => {
                    const col = index % this.columns;
                    const row = Math.floor(index / this.columns);

                    const xPos = this.startX + (col * (this.buttonWidth + this.spacing));
                    const yPos = 80 + (row * (this.buttonHeight + this.spacing));
                    this.createSongBox(xPos, yPos, song, this.buttonWidth, this.buttonHeight, songContainer);
                });
            }
        };
        
        this.renderPage = renderPage;
        renderPage(); // Render first page
        
        // Pagination buttons
        const buttonPadding = 12;
        const pageButtonWidth = 120;
        const pageButtonHeight = 40;
        const pageButtonY = height - 100; // Above the editor button
        
        // Previous button
        const prevBtn = this.add.text(width / 2 - pageButtonWidth - 20, pageButtonY, '← PREV', {
            fontSize: '16px',
            fill: '#000000',
            backgroundColor: '#ff9900',
            padding: { x: buttonPadding, y: buttonPadding }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        prevBtn.on('pointerdown', () => {
            if (this.currentPage > 0) {
                this.currentPage--;
                this.renderPage();
                this.updatePageButtons();
            }
        });
        
        this.prevBtn = prevBtn;
        
        // Next button
        const nextBtn = this.add.text(width / 2 + pageButtonWidth + 20, pageButtonY, 'NEXT →', {
            fontSize: '16px',
            fill: '#000000',
            backgroundColor: '#ff9900',
            padding: { x: buttonPadding, y: buttonPadding }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        nextBtn.on('pointerdown', () => {
            if (this.currentPage < this.totalPages - 1) {
                this.currentPage++;
                this.renderPage();
                this.updatePageButtons();
            }
        });
        
        this.nextBtn = nextBtn;
        
        // Page counter
        const pageCounterText = this.add.text(width / 2, pageButtonY, '', {
            fontSize: '18px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        this.pageCounterText = pageCounterText;
        
        // Function to update button states
        const updatePageButtons = () => {
            const pageText = `Page ${this.currentPage + 1} of ${this.totalPages}`;
            pageCounterText.setText(pageText);
            
            // Disable prev button if on first page
            if (this.currentPage === 0) {
                prevBtn.setAlpha(0.4).setInteractive({ useHandCursor: false });
            } else {
                prevBtn.setAlpha(1).setInteractive({ useHandCursor: true });
            }
            
            // Disable next button if on last page
            if (this.currentPage === this.totalPages - 1) {
                nextBtn.setAlpha(0.4).setInteractive({ useHandCursor: false });
            } else {
                nextBtn.setAlpha(1).setInteractive({ useHandCursor: true });
            }
        };
        
        this.updatePageButtons = updatePageButtons;
        updatePageButtons(); // Initialize button states
        
        // Keyboard pagination support
        this.input.keyboard.on('keydown', (event) => {
            if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
                // Previous page
                if (this.currentPage > 0) {
                    this.currentPage--;
                    this.renderPage();
                    this.updatePageButtons();
                }
            } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
                // Next page
                if (this.currentPage < this.totalPages - 1) {
                    this.currentPage++;
                    this.renderPage();
                    this.updatePageButtons();
                }
            }
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