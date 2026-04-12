export class ChartEditor extends Phaser.Scene {
    constructor() {
        super('ChartEditor');
    }

    init() {
        this.recording = [];
        this.isRecording = false;
        this.songTime = 0;
        this.music = null;
        this.songName = 'my_song';
    }

    create() {
        const { width, height } = this.scale;

        // --- Background ---
        this.add.rectangle(width / 2, height / 2, width, height, 0x111111);

        // --- Title ---
        this.add.text(width / 2, 40, '🎵 CHART EDITOR', {
            fontSize: '32px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // --- Instructions ---
        this.add.text(width / 2, 90, 'Load a song, then tap the buttons to record notes!', {
            fontSize: '16px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        // --- Song name display ---
        this.songNameText = this.add.text(width / 2, 130, 'No song loaded', {
            fontSize: '18px',
            fill: '#ffff00'
        }).setOrigin(0.5);

        // --- Note counter ---
        this.noteCountText = this.add.text(width / 2, 160, 'Notes recorded: 0', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // --- Timer display ---
        this.timerText = this.add.text(width / 2, 195, '⏱ 0.000s', {
            fontSize: '20px',
            fill: '#00ff00'
        }).setOrigin(0.5);

        this.createButtons();
        this.createUI();
    }

    createUI() {
        const { width, height } = this.scale;

        // --- LOAD SONG button ---
        const loadBtn = this.add.text(width / 2 - 160, height - 60, '📂 LOAD SONG', {
            fontSize: '20px',
            fill: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 14, y: 8 }
        }).setOrigin(0.5).setInteractive().setDepth(10);

        loadBtn.on('pointerover', () => loadBtn.setStyle({ backgroundColor: '#dddddd' }));
        loadBtn.on('pointerout',  () => loadBtn.setStyle({ backgroundColor: '#ffffff' }));
        loadBtn.on('pointerdown', () => this.loadSongFromFile());

        // --- RECORD / STOP button ---
        this.recordBtn = this.add.text(width / 2, height - 60, '⏺ RECORD', {
            fontSize: '20px',
            fill: '#000000',
            backgroundColor: '#ff4444',
            padding: { x: 14, y: 8 }
        }).setOrigin(0.5).setInteractive().setDepth(10);

        this.recordBtn.on('pointerover', () => this.recordBtn.setStyle({ backgroundColor: '#ff0000' }));
        this.recordBtn.on('pointerout',  () => this.recordBtn.setStyle({ backgroundColor: '#ff4444' }));
        this.recordBtn.on('pointerdown', () => this.toggleRecording());

        // --- EXPORT button ---
        const exportBtn = this.add.text(width / 2 + 160, height - 60, '💾 EXPORT', {
            fontSize: '20px',
            fill: '#000000',
            backgroundColor: '#44ff44',
            padding: { x: 14, y: 8 }
        }).setOrigin(0.5).setInteractive().setDepth(10);

        exportBtn.on('pointerover', () => exportBtn.setStyle({ backgroundColor: '#00dd00' }));
        exportBtn.on('pointerout',  () => exportBtn.setStyle({ backgroundColor: '#44ff44' }));
        exportBtn.on('pointerdown', () => this.exportChart());

        // --- UNDO last note button ---
        const undoBtn = this.add.text(width - 80, height - 120, '↩ UNDO', {
            fontSize: '18px',
            fill: '#000000',
            backgroundColor: '#ffaa00',
            padding: { x: 10, y: 6 }
        }).setOrigin(0.5).setInteractive().setDepth(10);

        undoBtn.on('pointerdown', () => this.undoLastNote());

        // --- CLEAR ALL button ---
        const clearBtn = this.add.text(width - 80, height - 170, '🗑 CLEAR', {
            fontSize: '18px',
            fill: '#000000',
            backgroundColor: '#ff4444',
            padding: { x: 10, y: 6 }
        }).setOrigin(0.5).setInteractive().setDepth(10);

        clearBtn.on('pointerdown', () => this.clearAll());

        // --- BACK button ---
        const backBtn = this.add.text(60, height - 60, '← BACK', {
            fontSize: '18px',
            fill: '#000000',
            backgroundColor: '#aaaaaa',
            padding: { x: 10, y: 6 }
        }).setOrigin(0.5).setInteractive().setDepth(10);

        backBtn.on('pointerdown', () => {
            if (this.music) this.music.stop();
            this.scene.start('SongSelect');
        });

        // --- Recent notes log ---
        this.add.text(width / 2, height - 100, 'Recent notes:', {
            fontSize: '14px',
            fill: '#888888'
        }).setOrigin(0.5);

        this.recentLog = this.add.text(width / 2, height - 82, '', {
            fontSize: '13px',
            fill: '#cccccc'
        }).setOrigin(0.5);
    }

    createButtons() {
        const { width, height } = this.scale;

        const buttonConfigs = [
            { name: 'lane_L1', side: 'left',  row: 0 },
            { name: 'lane_L2', side: 'left',  row: 1 },
            { name: 'lane_L3', side: 'left',  row: 2 },
            { name: 'lane_R1', side: 'right', row: 0 },
            { name: 'lane_R2', side: 'right', row: 1 },
            { name: 'lane_R3', side: 'right', row: 2 },
        ];

        const marginX = 160;
        const startY = 280;
        const spacingY = 140;

        this.buttons = {};

        for (const button of buttonConfigs) {
            const x = button.side === 'left' ? marginX : width - marginX;
            const y = startY + button.row * spacingY;

            // Lane label
            this.add.text(x, y - 50, button.name, {
                fontSize: '13px',
                fill: '#888888'
            }).setOrigin(0.5);

            const btn = this.add.image(x, y, 'apple')
                .setScale(2)
                .setInteractive()
                .setName(button.name);

            btn.on('pointerdown', () => this.onButtonPressed(button.name));
            btn.on('pointerover', () => btn.setTint(0xffff00));
            btn.on('pointerout',  () => btn.clearTint());

            this.buttons[button.name] = btn;
        }
    }

    loadSongFromFile() {
        // Create a hidden file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            this.songName = file.name.replace(/\.[^/.]+$/, ''); // strip extension
            this.songNameText.setText(`🎵 ${this.songName}`);

            const url = URL.createObjectURL(file);

            // Stop previous music if any
            if (this.music) {
                this.music.stop();
                this.music.destroy();
                this.sound.remove('editor_song');
            }

            // Load into Phaser
            this.load.audio('editor_song', url);
            this.load.once('complete', () => {
                this.music = this.sound.add('editor_song');
                this.music.on('complete', () => {
                    this.isRecording = false;
                    this.recordBtn.setText('⏺ RECORD');
                    this.recordBtn.setStyle({ backgroundColor: '#ff4444' });
                });
                this.songNameText.setText(`✅ ${this.songName} — ready!`);
            });
            this.load.start();
        };

        input.click();
    }

    toggleRecording() {
        if (!this.music) {
            this.songNameText.setText('⚠️ Load a song first!');
            return;
        }

        if (!this.isRecording) {
            // Start recording
            this.recording = [];
            this.isRecording = true;
            this.music.stop();
            this.music.play();
            this.recordBtn.setText('⏹ STOP');
            this.recordBtn.setStyle({ backgroundColor: '#888888' });
            this.noteCountText.setText('Notes recorded: 0');
        } else {
            // Stop recording
            this.isRecording = false;
            this.music.stop();
            this.recordBtn.setText('⏺ RECORD');
            this.recordBtn.setStyle({ backgroundColor: '#ff4444' });
        }
    }

    onButtonPressed(name) {
        if (!this.isRecording) return;

        const time = parseFloat(this.music.seek.toFixed(3));

        this.recording.push({ time, lane: name });
        this.noteCountText.setText(`Notes recorded: ${this.recording.length}`);

        // Flash button
        this.buttons[name].setTint(0x00ff00);
        this.time.delayedCall(150, () => this.buttons[name].clearTint());

        // Update recent log — show last 3 notes
        const recent = this.recording.slice(-3)
            .map(n => `${n.lane} @ ${n.time}s`)
            .join('   ');
        this.recentLog.setText(recent);
    }

    undoLastNote() {
        if (this.recording.length === 0) return;
        const removed = this.recording.pop();
        this.noteCountText.setText(`Notes recorded: ${this.recording.length}`);
        this.recentLog.setText(`↩ Removed: ${removed.lane} @ ${removed.time}s`);
    }

    clearAll() {
        this.recording = [];
        this.noteCountText.setText('Notes recorded: 0');
        this.recentLog.setText('');
    }

    exportChart() {
        if (this.recording.length === 0) {
            this.recentLog.setText('⚠️ No notes to export!');
            return;
        }

        const chart = {
            name: this.songName,
            bpm: 120,
            offset: 0,
            notes: this.recording
        };

        const json = JSON.stringify(chart, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.songName + '.json';
        a.click();

        this.recentLog.setText(`✅ Exported ${this.recording.length} notes!`);
    }

    update() {
        if (this.music && this.music.isPlaying) {
            this.timerText.setText(`⏱ ${this.music.seek.toFixed(3)}s`);
        }
    }
}