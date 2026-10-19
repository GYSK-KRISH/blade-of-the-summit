import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.createProceduralTextures();
  }

  create(): void {
    this.scene.start('GameScene');
  }

  private createProceduralTextures(): void {
    // 1. Procedural 16x16 Tileset (3 tiles: Grass, Dirt, Stone Wall)
    if (!this.textures.exists('tiles')) {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 16;
      const ctx = canvas.getContext('2d')!;

      // Frame 0: Grass
      ctx.fillStyle = '#2f572a';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#23441f';
      ctx.fillRect(3, 4, 2, 2);
      ctx.fillRect(10, 11, 2, 2);

      // Frame 1: Dirt Path
      ctx.fillStyle = '#8c6d3b';
      ctx.fillRect(16, 0, 16, 16);
      ctx.fillStyle = '#6d542b';
      ctx.fillRect(20, 5, 2, 2);

      // Frame 2: Stone Boundary Wall
      ctx.fillStyle = '#3a3f4b';
      ctx.fillRect(32, 0, 16, 16);
      ctx.fillStyle = '#5c6475';
      ctx.fillRect(32, 0, 16, 2);

      const tilesCanvasTex = this.textures.addCanvas('tiles_proc', canvas)!;
      this.textures.addSpriteSheet(
        'tiles',
        tilesCanvasTex.getSourceImage() as HTMLImageElement,
        { frameWidth: 16, frameHeight: 16 }
      );
    }

    // 2. Procedural Player: 32x32 Placeholder (4 rows x 3 columns)
    if (!this.textures.exists('player')) {
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
          const stepBounce = c === 1 ? -1 : 0;

          // Tunic body
          ctx.fillStyle = '#1b4f72';
          ctx.fillRect(c * 32 + 8, r * 32 + 10 + stepBounce, 16, 18);

          // Head
          ctx.fillStyle = '#f5b041';
          ctx.fillRect(c * 32 + 10, r * 32 + 4 + stepBounce, 12, 8);

          // Directional headband / eyes indicator
          ctx.fillStyle = '#ffffff';
          if (r === 0) {
            ctx.fillRect(c * 32 + 12, r * 32 + 8 + stepBounce, 2, 2);
            ctx.fillRect(c * 32 + 18, r * 32 + 8 + stepBounce, 2, 2);
          } else if (r === 2) {
            ctx.fillRect(c * 32 + 10, r * 32 + 8 + stepBounce, 2, 2);
          } else if (r === 3) {
            ctx.fillRect(c * 32 + 20, r * 32 + 8 + stepBounce, 2, 2);
          }
        }
      }

      const playerCanvasTex = this.textures.addCanvas('player_proc', canvas)!;
      this.textures.addSpriteSheet(
        'player',
        playerCanvasTex.getSourceImage() as HTMLImageElement,
        { frameWidth: 32, frameHeight: 32 }
      );
    }

    // 3. Procedural Training Dummy: 32x32 Placeholder
    if (!this.textures.exists('dummy')) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;

      // Wooden post
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(14, 6, 4, 22);

      // Target body
      ctx.fillStyle = '#922b21';
      ctx.fillRect(8, 8, 16, 16);

      // Belt band
      ctx.fillStyle = '#d4ac0d';
      ctx.fillRect(8, 15, 16, 2);

      this.textures.addCanvas('dummy', canvas);
    }
  }
}