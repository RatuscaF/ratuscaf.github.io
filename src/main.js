import { Boot } from './scenes/Boot.js';
import { Preloader } from './scenes/Preloader.js';
import { Game } from './scenes/Game.js';
import { GameOver } from './scenes/GameOver.js';
import { SongSelect } from './scenes//SongSelect.js';
import { ChartEditor } from './scenes/ChartEditor.js';

const config = {
    type: Phaser.AUTO,
    title: 'Danseaza pana mori',
    description: '',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#123456',
    pixelArt: false,
    scene: [
        Boot,
        Preloader,
        SongSelect,
        ChartEditor,
        Game,
        GameOver
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        forceOrientation: true,
        orientation: Phaser.Scale.LANDSCAPE,
        width: 1280,
        height: 720,
        expandParent: true 
    },
}

const game = new Phaser.Game(config);

// 2. Add the global listener here
window.addEventListener('pointerdown', () => {
    // Check if the game is booted and not already fullscreen
    if (game.isBooted && !game.scale.isFullscreen) {
        game.scale.startFullscreen();
    }
});
            