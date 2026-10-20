import Phaser from 'phaser';

/* ============================================================
 * ⚔️ BOOT SCENE ⚔️ — DOMAIN EXPANSION: PROCEDURAL TEXTURE FACTORY
 *
 * listen. we're not preloading 30 pngs like some kind of npc
 * side character. that's giving "i didn't study for the exam"
 * energy. we're drawing EVERY texture on a live canvas like
 * it's a domain expansion. everything insta-casts. no load time.
 * no waiting. we move at infinity speed. periodt.
 *
 * THREAT LEVEL: YONKO tier pixel factory
 *
 * tanjiro haori? check. wisteria? check. torii gates? check.
 * mt fuji in the background? check. domain expansion aura?
 * check check check. we're cooking with gas fr fr no cap.
 *
 * shoutout to #game-dev senpai for teaching me addCanvas.
 * notice me senpai. anya wants to see it. waku waku
 *
 * *** READ BEFORE YOU GET ONE-TAPPED ***
 * - player frame indices are LOAD-BEARING. one wrong index and
 *   you're getting cooked like sukuna vs jogo. row 0 = down,
 *   1 = up, 2 = left, 3 = right. col 0 = idle, 1 = left foot,
 *   2 = right foot. DO NOT TOUCH. DO NOT REORDER. i will know.
 * - every texture is guarded by textures.exists() so re-entering
 *   the scene won't dupe anything. gaslight gatekeep girlboss.
 * - pixel art mode is forced in newCanvas. removing it = mush.
 *   mush is giving "unranked lobby" energy. we don't do that.
 * - PAL is at the bottom. tweak the vibe THERE, not inline.
 *   touching it inline is giving "i can fix him" energy. no.
 * - tsc strict is on so the `!` on getContext is legit. the 2d
 *   context technically can be null but in every browser it
 *   isn't. trust the process. trust the plan. eren did.
 *
 * SITUATIONSHIP NOTES (things i'm delulu about but won't fix):
 * - mist_cloud is blurry. it's aesthetic. it's fine. (cope)
 * - wisteria strands long af. might tighten. might not. flex.
 * - snow_flake_big unused. saving it for the final arc. the
 *   rumbling. the big moment. the chapter 139 of textures.
 * - you can't see it but the hit_spark has 1.5x crit multiplier.
 * ============================================================ */


export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    // cook the textures first
    this.createProceduralTextures();
  }

  create(): void {
    // yeet into the actual game
    this.scene.start('GameScene');
  }

  private createProceduralTextures(): void {
    // =========================================================================
    // 1. 16x16 snowy tileset (6 frames)
    // soft powder, packed trail, icy wall, windy snow, frozen pond, deep shade
    // =========================================================================
    if (!this.textures.exists('tiles')) {
      const canvas = document.createElement('canvas');
      canvas.width = 96; // 6 * 16
      canvas.height = 16;
      const ctx = canvas.getContext('2d')!;

      // frame 0 - fresh powder (the soft soft one)
      ctx.fillStyle = '#dceefb';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#c2def3';
      ctx.fillRect(3, 4, 3, 2);
      ctx.fillRect(10, 11, 3, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 3, 2, 1);

      // frame 1 - packed snow path (the one people actually walk on)
      ctx.fillStyle = '#8eaccd';
      ctx.fillRect(16, 0, 16, 16);
      ctx.fillStyle = '#b6d0e7';
      ctx.fillRect(16, 0, 16, 2);
      ctx.fillRect(16, 14, 16, 2);
      ctx.fillStyle = '#6c8aa8';
      ctx.fillRect(19, 5, 4, 3);
      ctx.fillRect(25, 9, 4, 3);
      ctx.fillStyle = '#dceefb';
      ctx.fillRect(20, 4, 2, 1);

      // frame 2 - icy cliff wall (dont fall off king)
      ctx.fillStyle = '#2b3a4a';
      ctx.fillRect(32, 0, 16, 16);
      ctx.fillStyle = '#415a77';
      ctx.fillRect(33, 3, 14, 11);
      ctx.fillStyle = '#e0fbfc';
      ctx.fillRect(32, 0, 16, 4);
      ctx.fillStyle = '#90e0ef';
      ctx.fillRect(34, 4, 12, 1);

      // frame 3 - wind swept snow
      ctx.fillStyle = '#d5eaf8';
      ctx.fillRect(48, 0, 16, 16);
      ctx.fillStyle = '#b4d4ec';
      ctx.fillRect(50, 6, 6, 2);
      ctx.fillRect(55, 12, 6, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(50, 5, 5, 1);
      ctx.fillRect(55, 11, 5, 1);

      // frame 4 - frozen pond (looks cold as hell)
      ctx.fillStyle = '#56abdf';
      ctx.fillRect(64, 0, 16, 16);
      ctx.fillStyle = '#7ec4f2';
      ctx.fillRect(65, 1, 14, 14);
      ctx.fillStyle = '#e1f5fe';
      ctx.fillRect(66, 3, 5, 2);
      ctx.fillRect(69, 5, 5, 2);
      ctx.fillRect(72, 10, 4, 2);

      // frame 5 - deep forest shade snow
      ctx.fillStyle = '#bfd8ed';
      ctx.fillRect(80, 0, 16, 16);
      ctx.fillStyle = '#9fc0de';
      ctx.fillRect(82, 3, 5, 3);
      ctx.fillRect(88, 10, 5, 3);


      const tilesCanvasTex = this.textures.addCanvas('tiles_proc', canvas)!;
      this.textures.addSpriteSheet(
        'tiles',
        tilesCanvasTex.getSourceImage() as HTMLImageElement,
        {
        frameWidth: 16,
        frameHeight: 16,
        endFrame: 5
      });
    }

    // =========================================================================
    // 2. player spritesheet 32x32
    // 4 directions x 3 frames
    // winter haori + crimson scarf energy
    // soft anime walk bounce
    // =========================================================================
    if (!this.textures.exists('player')) {
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          const baseX = col * 32;
          const baseY = row * 32;

          // little bounce on the middle step so it feels alive
          const bounce = col === 1 ? -1 : 0;

          // soft shadow on snow
          ctx.fillStyle = 'rgba(43, 58, 74, 0.35)';
          ctx.fillRect(baseX + 9, baseY + 26, 14, 3);

          // deep indigo winter haori
          ctx.fillStyle = '#1a3a5c';
          ctx.fillRect(baseX + 8, baseY + 10 + bounce, 16, 18);

          // icy cyan trim at the bottom (cold but cute)
          ctx.fillStyle = '#48cae4';
          ctx.fillRect(baseX + 8, baseY + 26 + bounce, 16, 2);

          // that warm crimson scarf tho
          ctx.fillStyle = '#c0392b';
          ctx.fillRect(baseX + 9, baseY + 10 + bounce, 14, 3);

          // head
          ctx.fillStyle = '#1b1b1b';
          ctx.fillRect(baseX + 12, baseY + 2 + bounce, 8, 8);

          // dark hair
          ctx.fillStyle = '#2c1a1a';
          ctx.fillRect(baseX + 11, baseY + 1 + bounce, 10, 5);

          // tiny white headband
          ctx.fillStyle = '#f5f5f5';
          ctx.fillRect(baseX + 12, baseY + 3 + bounce, 8, 1);

          // eyes (soft look)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(baseX + 13, baseY + 4 + bounce, 2, 2);
          ctx.fillRect(baseX + 17, baseY + 4 + bounce, 2, 2);
          ctx.fillStyle = '#000000';
          ctx.fillRect(baseX + 14, baseY + 5 + bounce, 1, 1);
          ctx.fillRect(baseX + 18, baseY + 5 + bounce, 1, 1);

          // direction markers so we know which way they looking
          ctx.fillStyle = '#ffffff';
          if (row === 0) {
            // facing down
            ctx.fillRect(baseX + 12, baseY + 8 + bounce, 2, 2);
            ctx.fillRect(baseX + 18, baseY + 8 + bounce, 2, 2);
          } else if (row === 2) {
            // left
            ctx.fillRect(baseX + 10, baseY + 8 + bounce, 2, 2);
          } else if (row === 3) {
            // right
            ctx.fillRect(baseX + 20, baseY + 8 + bounce, 2, 2);
          }

          // boots
          ctx.fillStyle = '#1b1b1b';
          ctx.fillRect(baseX + 9, baseY + 28, 6, 4);
          ctx.fillRect(baseX + 17, baseY + 28, 6, 4);

          // hood / cloak top
          ctx.fillStyle = '#1a3a5c';
          ctx.fillRect(baseX + 8, baseY + 2 + bounce, 16, 8);

          // cyan hood trim
          ctx.fillStyle = '#48cae4';
          ctx.fillRect(baseX + 8, baseY + 2 + bounce, 16, 2);
        }
      }

      const playerTex = this.textures.addCanvas('player_proc', canvas)!;
      this.textures.addSpriteSheet('player', playerTex.getSourceImage() as HTMLImageElement, {
        frameWidth: 32,
        frameHeight: 32,
        endFrame: 11
      });
    }

    // =========================================================================
    // 3. training dummy (frosted up)
    // =========================================================================
    if (!this.textures.exists('dummy')) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;

      // shadow
      ctx.fillStyle = 'rgba(43, 58, 74, 0.35)';
      ctx.fillRect(8, 26, 16, 3);

      // wood post
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(14, 6, 4, 22);

      // red target body
      ctx.fillStyle = '#922b21';
      ctx.fillRect(8, 8, 16, 16);

      // gold belt
      ctx.fillStyle = '#d4ac0d';
      ctx.fillRect(8, 15, 16, 2);

      // snow on top
      ctx.fillStyle = '#e0fbfc';
      ctx.fillRect(8, 7, 16, 3);

      // little frost lines
      ctx.fillStyle = '#90e0ef';
      ctx.fillRect(8, 10, 16, 1);
      ctx.fillStyle = 'rgba(10, 89, 141, 0.8)';
      ctx.fillRect(8, 23, 16, 1);

      this.textures.addCanvas('dummy', canvas);
    }

    // day 2 props + atmosphere
    this.createDay2PropTextures();
    this.createDay2AtmosphereTextures();
  }

  private createDay2PropTextures(): void {
    // snow pine (tall and soft)
    if (!this.textures.exists('snow_tree')) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 40;
      const ctx = canvas.getContext('2d')!;

      // soft shadow under the tree
      ctx.fillStyle = 'rgba(65, 90, 119, 0.45)';
      ctx.fillRect(4, 34, 24, 5);

      // trunk
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(13, 28, 6, 9);

      // dark pine layers
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(3, 22, 26, 8);
      ctx.fillRect(5, 14, 22, 9);
      ctx.fillRect(8, 7, 16, 8);
      ctx.fillRect(12, 2, 8, 6);

      // bright snow caps (the cute part)
      ctx.fillStyle = '#e0fbfc';
      ctx.fillRect(4, 22, 24, 3);
      ctx.fillRect(6, 14, 20, 3);
      ctx.fillRect(9, 7, 14, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 2, 8, 3);

      this.textures.addCanvas('snow_tree', canvas);
    }

    // frost rock
    if (!this.textures.exists('frost_rock')) {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = 'rgba(65, 90, 119, 0.4)';
      ctx.fillRect(2, 13, 12, 2);

      ctx.fillStyle = '#33415c';
      ctx.fillRect(2, 6, 12, 8);
      ctx.fillRect(4, 3, 8, 4);

      ctx.fillStyle = '#5c677d';
      ctx.fillRect(3, 7, 8, 5);

      // snow crest
      ctx.fillStyle = '#e0fbfc';
      ctx.fillRect(4, 3, 8, 3);
      ctx.fillRect(2, 6, 5, 2);

      this.textures.addCanvas('frost_rock', canvas);
    }

    // glowing ice crystal (pretty)
    if (!this.textures.exists('ice_crystal')) {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 24;
      const ctx = canvas.getContext('2d')!;

      // soft cyan reflection on ground
      ctx.fillStyle = 'rgba(0, 180, 216, 0.35)';
      ctx.fillRect(2, 19, 12, 4);

      // outer crystal
      ctx.fillStyle = '#0077b6';
      ctx.fillRect(3, 10, 10, 10);
      ctx.fillRect(6, 3, 4, 17);

      // bright core
      ctx.fillStyle = '#48cae4';
      ctx.fillRect(5, 7, 6, 12);
      ctx.fillRect(7, 4, 2, 15);

      // white shine
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 5, 1, 9);
      ctx.fillRect(5, 10, 1, 6);

      this.textures.addCanvas('ice_crystal', canvas);
    }
  }

  private createDay2AtmosphereTextures(): void {
    // tiny snowflake particle
    if (!this.textures.exists('snow_flake')) {
      const canvas = document.createElement('canvas');
      canvas.width = 3;
      canvas.height = 3;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(1, 0, 1, 3);
      ctx.fillRect(0, 1, 3, 1);
      this.textures.addCanvas('snow_flake', canvas);
    }

    // soft valley mist
    if (!this.textures.exists('mist_cloud')) {
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 24;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'rgba(202, 240, 248, 0.16)';
      ctx.fillRect(8, 4, 80, 16);
      ctx.fillStyle = 'rgba(224, 251, 252, 0.22)';
      ctx.fillRect(20, 8, 56, 8);
      this.textures.addCanvas('mist_cloud', canvas);
    }

    // distant mountain strip
    if (!this.textures.exists('mountain_horizon')) {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 36;
      const ctx = canvas.getContext('2d')!;

      // deep night blue sky
      ctx.fillStyle = '#0d1b2a';
      ctx.fillRect(0, 0, 320, 36);

      // jagged peaks
      ctx.fillStyle = '#1b263b';
      const peaks = [0, 36, 40, 6, 85, 28, 135, 4, 185, 26, 235, 8, 280, 28, 320, 10, 320, 36];
      ctx.beginPath();
      ctx.moveTo(peaks[0], peaks[1]);
      for (let i = 2; i < peaks.length; i += 2) {
        ctx.lineTo(peaks[i], peaks[i + 1]);
      }
      ctx.closePath();
      ctx.fill();

      // soft glow at the base
      ctx.fillStyle = 'rgba(144, 224, 239, 0.25)';
      ctx.fillRect(0, 28, 320, 8);

      this.textures.addCanvas('mountain_horizon', canvas);
    }
  }
}