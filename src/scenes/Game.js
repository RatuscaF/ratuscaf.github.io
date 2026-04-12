// "Every great game begins with a single scene. Let's make this one unforgettable!"
export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        this.song = data?.song ?? null;
        console.log('Selected song:', this.song); 
    }

    preload() {
        // Load assets
    }

    create() {
        this.createButtons();
        this.createDancingNote();
        this.currentTargetNote = null;
        this.graphics = this.add.graphics();

        this.lastPosition = {
            x: this.dancingNote.x,
            y: this.dancingNote.y
        };
        this.lastNoteTime = 0;


        const chartKey = this.song.name + '_chart';
        const audioKey = this.song.name + '_audio';

        const chart = this.cache.json.get(chartKey);
        this.offset = this.song?.offset ?? 0;
        this.notes = chart.notes.map(note => ({
            ...note,
            startTime: note.time - 0.65, 
            active: true
        }));
        this.songTime = 0;
        this.hitWindow = 0.195;
        this.score = 0;
        this.totalNotes = this.notes.length; // save total before any are removed
        this.hits = 0;
        this.misses = 0;
        this.music = this.sound.add(audioKey);
        this.music.on('complete', () => {
            this.showFinalScreen();
        });
        this.start();
        this.isPaused = false;
        this.createPauseButton();

    }

    createDancingNote() {
        const {width, height} = this.scale;
        // Add these variables to your create() method
        this.dancingNote = this.add.image(width/2, height/2, 'apple').setDepth(10);
        this.nextNoteToTarget = null;

        // Define your BPM and beat timing
        this.bpm = this.song.bpm || 120; 
        this.msPerBeat = (60 / this.bpm) * 1000;
        this.dancingNote.setOrigin(0.5, 1);

    }


    createPauseButton() {
        const { width } = this.scale;

        this.pauseBtn = this.add.text(60, 20, '⏸', {
            fontSize: '40px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(1, 0).setInteractive().setDepth(500);

        this.pauseBtn.on('pointerdown', () => this.togglePause());
    }

    togglePause() {
        const { width, height } = this.scale;
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            // Pause
            this.music.pause();
            this.pauseBtn.setText('▶');

            // Dim overlay
            this.pauseOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
                .setDepth(498);

            this.pauseText = this.add.text(width / 2, height / 2, 'PAUSED', {
                fontSize: '64px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6
            }).setOrigin(0.5).setDepth(499);

            // Resume button in center
            this.resumeBtn = this.add.text(width / 2, height * 0.65, '▶ RESUME', {
                fontSize: '28px',
                fill: '#000000',
                backgroundColor: '#ffffff',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive().setDepth(500);

            this.resumeBtn.on('pointerdown', () => this.togglePause());

            // Quit button
            this.quitBtn = this.add.text(width / 2, height * 0.75, '🚪 QUIT', {
                fontSize: '28px',
                fill: '#000000',
                backgroundColor: '#ff4444',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive().setDepth(500);

            this.quitBtn.on('pointerdown', () => {
                this.music.stop();
                this.scene.start('SongSelect');
            });

        } else {
            // Resume
            this.music.resume();
            this.pauseBtn.setText('⏸');
            this.pauseOverlay.destroy();
            this.pauseText.destroy();
            this.resumeBtn.destroy();
            this.quitBtn.destroy();
        }
    }

    start() {
        const { width, height } = this.scale;

        const timerText = this.add.text(width / 2, height / 2, '3', {
            fontSize: '120px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(999);

        let count = 3;

        const countdown = this.time.addEvent({
            delay: 1000,        // every 1 second
            repeat: 2,          // runs 3 times total (0, 1, 2)
            callback: () => {
                count--;

                if (count === 0) {
                    timerText.destroy();
                    this.music.play();
                } else {
                    timerText.setText(count.toString());
                }
            }
        });
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
            this.scene.start('SongSelect');
        });
    }

    update(time, delta) {
        if (this.isPaused) return;
        this.songTime = this.music.seek - this.offset;
        this.graphics.clear();
        
        

        // 1. Find the next note the player needs to hit

        this.nextNoteToTarget = this.notes.find(n => n.active);


        if (this.nextNoteToTarget) {
            const targetBtn = this.buttons[this.nextNoteToTarget.lane];
            
            // 1. Calculate Progress based on the time BETWEEN notes
            // This makes the movement take the entire available time.
            const totalTravelTime = this.nextNoteToTarget.time - this.lastNoteTime;
            const timeElapsedSinceLast = this.songTime - this.lastNoteTime;

            let moveProgress;

            if (totalTravelTime < 0.05) {
                moveProgress = 1; // prevent teleport snap
            } else {
                moveProgress = Phaser.Math.Clamp(
                    timeElapsedSinceLast / totalTravelTime,
                    0,
                    1
                );
            }
            // 2. Pure Linear Interpolation (No "Smooth Follow" fighting the offset)
            let easedProgress = 1 - Math.pow(1 - moveProgress, 3); 

            let posX = Phaser.Math.Linear(this.lastPosition.x, targetBtn.x, easedProgress);
            let posY = Phaser.Math.Linear(this.lastPosition.y, targetBtn.y, easedProgress);

            // 3. The "Hop" Logic (The Arc)
            const begin = 0.1; // Start hopping almost immediately
            const end = 0.9;   // Finish landing just before the hit
            let xOffset = 0;
            let yOffset = 0;

            if (moveProgress > begin && moveProgress < end) {
                // This creates a parabola shape (y = x^2) for the jump
                const jumpProgress = (moveProgress - begin) / (end - begin);
                // Use a sine wave for the arc height
                yOffset = Math.sin(jumpProgress * Math.PI) * -200; // Increased to -200 for a better "pop"
                
                // Add a slight "wobble" to the x-axis based on the side it's jumping to
                const direction = targetBtn.x > this.lastPosition.x ? 1 : -1;
                xOffset = Math.sin(jumpProgress * Math.PI) * (30 * direction);
            }

            this.dancingNote.x = posX + xOffset;
            this.dancingNote.y = posY + yOffset;
            
            // 4. Attractive Rotation
            // Lean forward during the first half, lean back during landing
            this.dancingNote.angle = Math.sin(moveProgress * Math.PI) * 15;
        }

        // 5. BPM Vibe (Pulse)
        const beatProgress = (this.music.seek * 1000) / this.msPerBeat;
        const bounce = 1 + Math.abs(Math.sin(beatProgress * Math.PI)) * 0.15;
        this.dancingNote.setScale(1.2 * bounce);


        for (const note of this.notes) {
            if (!note.active) continue;
            const btn = this.buttons[note.lane];
            if (!btn) continue;

            const progress = (this.songTime - note.startTime) / (note.time - note.startTime);

            if (progress < 0) continue;

            const clampedProgress = Math.min(progress, 1);

            if (clampedProgress > 0.9) {
                const pulse = (clampedProgress - 0.9) / 0.1; 
                this.graphics.lineStyle(4, 0xffff00, 1 - pulse); 
            }

            const maxRadius = 120;
            const minRadius = 55;
            const radius = maxRadius - (maxRadius - minRadius) * clampedProgress;
            this.graphics.lineStyle(4, 0xffffff, 1); 
            this.graphics.strokeCircle(btn.x, btn.y, radius);
        }
        this.checkMissedNotes();

    }

    checkMissedNotes() {
        this.notes = this.notes.filter(note => {
            if (note.active && note.time < this.songTime - this.hitWindow) {
                note.active = false;
                
                // Set the path to start EXACTLY at the missed button
                this.lastPosition = {
                    x: this.dancingNote.x,
                    y: this.dancingNote.y
                };
                this.lastNoteTime = this.songTime; // Sync to the chart time

                this.flashButton(note.lane, 0xff0000);
                this.misses++;
                return false;
            }
            return true;
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
        const marginX = 160;
        const startY = 120;
        const endY = height - 100;
        const middleY = (startY + endY) / 2;
        const spacingY = 220;

        this.buttons = {};
        for (const button of buttonConfigs) {
            const x = button.side == 'left'
                ? marginX
                : width - marginX;

            const y = startY + button.row * spacingY;

            const btn = this.add.image(x, y, 'apple')
                .setScale(2)
                .setInteractive()
                .setName(button.name);
            btn.on('pointerdown',  () => this.onButtonPressed(button.name));
            this.buttons[button.name] = btn;
            this.input.enableDebug(btn);
        }
    }

    onButtonPressed(name) {


        const index = this.notes.findIndex(note => note.lane === name && note.active);

        if(index === -1) {
            console.log("wrong");
            return;
        }
        const note = this.notes[index];
        const diff = Math.abs(note.time - this.songTime);
        if (diff <= this.hitWindow) {
            note.active = false;
            this.lastPosition = { x: this.dancingNote.x, y: this.dancingNote.y };
            this.lastNoteTime = this.songTime;
            this.notes.splice(index, 1);
            this.flashButton(name, 0x00ff00); 
            this.score += 1;
            this.hits++;
            console.log(`HIT! diff: ${diff.toFixed(3)}s`);
        } else {
            this.flashButton(name, 0xff0000); 
            console.log(`MISS! diff: ${diff.toFixed(3)}s`);
        }
    }

    flashButton(name, color) {
        const btn = this.buttons[name];
        btn.setTint(color);
        // Reset tint after 200ms
        this.time.delayedCall(200, () => btn.clearTint());
    }

}
