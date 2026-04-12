// "Every great game begins with a single scene. Let's make this one unforgettable!"
export class Ratusca extends Phaser.Scene {
    constructor() {
        super('Ratusca');
    }

    init(data) {
       this.songs = data?.songs ?? [];
    }

    preload() {
        this.load.json('songsList', 'assets/songs.json');
        this.load.image('apple', 'assets/apple.png');
        for (const song of this.songs) {
            this.load.audio(song.name, song.audio);
            this.load.json(song.name + '_chart', song.chart);
        }
    }

    create() {
        this.songs = this.cache.json.get('songsList');
        this.recording = [];
        this.isRecording = false; 
        this.songSelectObjects = [];
        this.createButtons();
        this.showSongSelect();
        this.graphics = this.add.graphics();
        
        const chart = this.cache.json.get('chart');
        this.offset = chart.offset ?? 0;
        this.notes = chart.notes.map(note => ({
            ...note,
            startTime: note.time - 0.7, 
            active: true
        }));
        this.songTime = 0;
        this.hitWindow = 0.15;
        this.score = 0;
        this.totalNotes = this.notes.length; // save total before any are removed
        this.hits = 0;
        this.misses = 0;
        this.music = this.sound.add('song');
        this.music.on('complete', () => {
            this.showFinalScreen();
        });
        this.start();
    }

    showFinalScreen() {
        const { width, height } = this.scale;
        const accuracy = ((this.hits / this.totalNotes) * 100).toFixed(1);

        // Dark overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
            .setDepth(1000);

        // Title
        const title = this.add.text(width / 2, height * 0.2, '🎵 SONG COMPLETE!', {
            fontSize: '36px',
            fill: '#ffffff',
        }).setOrigin(0.5).setDepth(1001);

        // Score
        const score_text = this.add.text(width / 2, height * 0.4, `Score: ${this.score}`, {
            fontSize: '48px',
            fill: '#ffff00',
        }).setOrigin(0.5).setDepth(1001);

        // Accuracy
        const accuracy_text = this.add.text(width / 2, height * 0.55, `Accuracy: ${accuracy}%`, {
            fontSize: '32px',
            fill: '#00ff00',
        }).setOrigin(0.5).setDepth(1001);

        // Hits and misses breakdown
        const hits_text = this.add.text(width / 2, height * 0.67, `✅ Hits: ${this.hits}   ❌ Misses: ${this.misses}`, {
            fontSize: '24px',
            fill: '#ffffff',
        }).setOrigin(0.5).setDepth(1001);

        // Letter grade
        const grade = accuracy >= 90 ? 'S' 
                    : accuracy >= 75 ? 'A'
                    : accuracy >= 60 ? 'B'
                    : accuracy >= 40 ? 'C'
                    : 'F';

        const gradeColor = accuracy >= 90 ? '#ffd700'
                        : accuracy >= 75 ? '#00ff00'
                        : accuracy >= 60 ? '#ffffff'
                        : accuracy >= 40 ? '#ff8800'
                        : '#ff0000';

        const grade_text = this.add.text(width * 0.75, height * 0.4, grade, {
            fontSize: '96px',
            fill: gradeColor,
        }).setOrigin(0.5).setDepth(1001);

        // Retry button
        const retryBtn = this.add.text(width / 2, height * 0.85, '🔄 PLAY AGAIN', {
            fontSize: '28px',
            fill: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive().setDepth(1001);

        retryBtn.on('pointerdown', () => {
            this.scene.restart(); // restarts the whole scene
        });

        //more songs
        const songsBtn = this.add.text(width / 2, height * 0.93, '🎵 MORE SONGS', {
            fontSize: '28px',
            fill: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive().setDepth(1001);

        songsBtn.on('pointerdown', () => {
            retryBtn.destroy();
            grade_text.destroy();
            hits_text.destroy();
            accuracy_text.destroy();
            score_text.destroy();
            title.destroy();
            songsBtn.destroy();

            this.showSongSelect();
        });
    }

    showSongSelect() {
        const { width, height } = this.scale;
        this.songSelectObjects = []; // track objects so we can clean them up

        const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9)
            .setDepth(1000);
        this.songSelectObjects.push(bg);

        const title = this.add.text(width / 2, 60, '🎵 SELECT A SONG', {
            fontSize: '32px',
            fill: '#ffffff',
        }).setOrigin(0.5).setDepth(1001);
        this.songSelectObjects.push(title);

        // List songs
        this.songs.forEach((song, index) => {
            const y = 160 + index * 100;

            const btn = this.add.text(width / 2, y, song.name, {
                fontSize: '24px',
                fill: '#000000',
                backgroundColor: '#ffffff',
                padding: { x: 20, y: 12 }
            }).setOrigin(0.5).setInteractive().setDepth(1001);

            // Hover effect
            btn.on('pointerover', () => btn.setStyle({ fill: '#000000', backgroundColor: '#ffff00' }));
            btn.on('pointerout',  () => btn.setStyle({ fill: '#000000', backgroundColor: '#ffffff' }));

            btn.on('pointerdown', () => {
                this.startSong(song);
            });

            this.songSelectObjects.push(btn);
        });
    }

    startSong(song) {
        // Clean up song select screen
        for (const obj of this.songSelectObjects) {
            obj.destroy();
        }
        this.songSelectObjects = [];

        // Stop current music if playing
        if (this.music) {
            this.music.stop();
            this.music.destroy();
        }

        // Reset state
        this.score = 0;
        this.hits = 0;
        this.misses = 0;

        const audioKey = song.name + '_audio';
        const chartKey = song.name + '_chart';

        // Check if already loaded (player came back from another song)
        const alreadyLoaded = this.cache.audio.has(audioKey);

        if (alreadyLoaded) {
            this.loadSongReady(song, audioKey, chartKey);
            return;
        }

        // ✅ Load on demand
        this.load.audio(audioKey, song.audio);
        this.load.json(chartKey, song.chart);

        // Show loading text while assets load
        const { width, height } = this.scale;
        const loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(999);

        this.load.once('complete', () => {
            loadingText.destroy();
            this.loadSongReady(song, audioKey, chartKey);
        });

        this.load.start(); // manually trigger the loader
    }

    loadSongReady(song, audioKey, chartKey) {
        const chart = this.cache.json.get(chartKey);
        this.offset = chart.offset ?? 0;
        this.notes = chart.notes.map(note => ({
            ...note,
            startTime: note.time - 0.7,
            active: true
        }));
        this.totalNotes = this.notes.length;
        this.hitWindow = 0.15;
        this.songTime = 0;

        this.music = this.sound.add(audioKey);
        this.music.on('complete', () => this.showFinalScreen());

        this.start(); // show the tap to start button
    }


    start() {
        const { width, height } = this.scale;
        // Big start button in the middle of the screen
        const startBtn = this.add.text(width / 2, height / 2, '▶ TAP TO START', {
            fontSize: '32px',
            fill: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 20, y: 10 }
        })
        startBtn.setOrigin(0.5)
        startBtn.setInteractive()
        startBtn.setDepth(999);

        startBtn.on('pointerdown', () => {
            this.music.play();
            //this.isRecording = true;
            this.recording = [];
            startBtn.destroy();
        });
    }

    test() {
        const { width, height } = this.scale;

        //export json button
        const exportBtn = this.add.text(width / 2, height - 40, '📋 EXPORT', {
            fontSize: '24px',
            fill: '#000000',
            backgroundColor: '#ffff00',
            padding: { x: 16, y: 8 }
        })
        exportBtn.setOrigin(0.5)
        exportBtn.setInteractive()
        exportBtn.setDepth(999);

        exportBtn.on('pointerdown', () => {
            const json = JSON.stringify({ 
                bpm: 120, 
                offset: 0, 
                notes: this.recording 
            }, null, 2);

            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'chart.json';
            a.click();
        });
    }

    update(time, delta) {
        this.songTime = this.music.seek - this.offset;
        this.graphics.clear();
        

        for (const note of this.notes) {
            if (!note.active) continue;
            const btn = this.buttons[note.lane];
            if (!btn) continue;

            const progress = (this.songTime - note.startTime) / (note.time - note.startTime);

            if (progress < 0) continue;

            const clampedProgress = Math.min(progress, 1);

            if (clampedProgress > 0.9) {
                const pulse = (clampedProgress - 0.9) / 0.1; // 0 to 1 in last 10%
                this.graphics.lineStyle(4, 0xffff00, 1 - pulse); // fade to yellow
            }

            const maxRadius = 80;
            const minRadius = 30;
            const radius = maxRadius - (maxRadius - minRadius) * clampedProgress;
            this.graphics.lineStyle(4, 0xffffff, 1); 
            this.graphics.strokeCircle(btn.x, btn.y, radius);
        }
        this.checkMissedNotes();

    }

    checkMissedNotes() {
        // Remove notes that are past the hit window
        this.notes = this.notes.filter(note => {
            if (note.active && note.time < this.songTime - this.hitWindow) {
                note.active = false;
                console.log(`MISSED: ${note.lane} at ${note.time}`);
                this.flashButton(note.lane, 0xff0000);
                this.misses++;
                return false; // remove from array
            }
            return true; // keep
        });
    }
    createButtons() {
        const {width, height} = this.scale;

        const buttonConfigs = [
            { name: 'lane_L1', side: 'left',  row: 0 },
            { name: 'lane_L2', side: 'left',  row: 1 },
            { name: 'lane_L3', side: 'left',  row: 2 },
            { name: 'lane_R1', side: 'right', row: 0 },
            { name: 'lane_R2', side: 'right', row: 1 },
            { name: 'lane_R3', side: 'right', row: 2 },
        ]
        const marginX = 80;
        const startY = 100;
        const endY = height - 100;
        const middleY = (startY + endY) / 2;
        const spacingY = 130;

        this.buttons = {};
        for (const button of buttonConfigs) {
            const x = button.side == 'left'
                ? marginX
                : width - marginX;

            const y = startY + button.row * spacingY;

            const btn = this.add.image(x, y, 'apple')
                .setScale(1)
                .setInteractive()
                .setName(button.name);
            btn.on('pointerdown',  () => this.onButtonPressed(button.name));
            this.buttons[button.name] = btn;
            this.input.enableDebug(btn);
        }
    }
    onButtonPressed(name) {

        if (this.isRecording) {
            this.recording.push({ time: this.songTime, lane: name });
            console.log(JSON.stringify(this.recording)); // copy from console
            return;
        }

        const index = this.notes.findIndex(note => note.lane === name && note.active);

        if(index === -1) {
            console.log("wrong");
            return;
        }
        const note = this.notes[index];
        const diff = Math.abs(note.time - this.songTime);
        if (diff <= this.hitWindow) {
            note.active = false;
            this.notes.splice(index, 1); // remove the note from the list
            this.flashButton(name, 0x00ff00); // green flash
            this.score += 1;
            this.hits++;
            console.log(`HIT! diff: ${diff.toFixed(3)}s`);
        } else {
            this.flashButton(name, 0xff0000); // red flash
            console.log(`MISS! diff: ${diff.toFixed(3)}s`);
        }
    }
    flashButton(name, color) {
        const btn = this.buttons[name];
        btn.setTint(color);
        // Reset tint after 200ms
        this.time.delayedCall(200, () => btn.clearTint());
    }
    startRecording() {
        this.recording = [];
        this.isRecording = true;
        this.songTime = 0;
        console.log('Recording started!');
    }
}
