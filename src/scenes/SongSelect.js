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
        const startY = instructions.y + 120; // Start 100px below the title

        if (Array.isArray(data)) {
            data.forEach((song, index) => {
                const col = index % columns;          // 0, 1, 2, 0, 1, 2...
                const row = Math.floor(index / columns); // 0, 0, 0, 1, 1, 1...

                const xPos = startX + (col * (buttonWidth + spacing));
                const yPos = startY + (row * (buttonHeight + spacing));
                this.createSongBox(xPos, yPos, song, buttonWidth, buttonHeight);

            });
        }
        const editorBtn = this.add.text(width / 2, height - 40, '🎼 CHART EDITOR', {
            fontSize: '22px',
            fill: '#000000',
            backgroundColor: '#ffaa00',
            padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setInteractive();

        editorBtn.on('pointerdown', () => this.scene.start('ChartEditor'));

    }

    createSongBox(x, y, song, w, h) {
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
    }

    toGame(song) {
        this.scene.start('Game', { song });
    }
}