// Use this import style. It ALWAYS works with Vite + Phaser
import * as Phaser from 'phaser'; 

import { BootScene } from './scenes/BootScene';
import { MainMenu } from './scenes/MainMenu';
import { Level0_SnowVillage } from './scenes/Level0_SnowVillage';

console.log("🔥 main.ts is running!");

const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,       
  height: 600,
  pixelArt: true,   
  backgroundColor: '#0c0d12', 
scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: { 
      debug: false, 
      gravity: { y: 0 } 
    }
  },
  scene: [BootScene, MainMenu, Level0_SnowVillage] 
};

// Start the game
new Phaser.Game(GameConfig);