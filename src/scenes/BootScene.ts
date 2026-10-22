import Phaser from 'phaser';

/* ----------------------------------------------------------------
 *  BOOT SCENE  — DOMAIN EXPANSION: PROCEDURAL TEXTURE FACTORY
 *
 * AA SAME ENERGY, NEW LAYER. we're still drawing every tile and prop
 * on a live canvas like gojo opening his eyes for the first time.
 * but NOW we also pull in the REAL ninja boys from the asset pack
 * because bestie let's be real — tanjiro procedurally drawn is cute
 * but the NinjaDark spritesheet is literally the whole aesthetic..
 *
 * *** ROW MAP ***
 * Walk.png is 4 rows × 4 cols, 16×16 frames:
 *   row 0 (frames 0-3)  = walk DOWN
 *   row 1 (frames 4-7)  = walk UP
 *   row 2 (frames 8-11) = walk SIDE (left) — this row is
 *                         pixel-identical to row 0 per the
 *                         audit. so we use flipX for right.
 *   row 3 (frames 12-15)= back-step / unused (dup region)
 *
 * ---------------------------------------------------------------- */

const PAL = {
  // Snow palette — 5 tones for depth. Hi = highlights, Shadow = crevices.
  snowHi: '#f4fcff',
  snow: '#d3e8f7',
  snowMid: '#c2def3',
  snowLow: '#a4c6e3',
  snowShadow: '#87a8c6',

  // Ice — colder blues for frozen water and crystal
  iceDeep: '#14425f',
  iceMid: '#3d8fbd',
  ice: '#56abdf',
  iceHi: '#8fd8f5',
  iceGlow: '#c9f2ff',

  // Slate — rock, stone lanterns, cliff faces
  slateDeep: '#0f1720',
  slate: '#2b3a4a',
  slateMid: '#415a77',
  slateHi: '#6b7f96',

  // Pine — tree foliage
  pineDeep: '#0b2419',
  pine: '#173f30',
  pineHi: '#2e6650',

  // Wood / straw — houses, dummy, torii beams
  woodDeep: '#2b1c13',
  wood: '#4e342e',
  woodHi: '#7a5544',
  straw: '#a8823f',
  strawHi: '#d8b45f',

  // Accent colors — character costume, torii vermilion, wisteria
  haoriGreen: '#1f5c46',
  haoriGreenHi: '#39a37a',
  haoriDark: '#0d1a15',
  uniform: '#141b22',
  crimson: '#b3242c',
  crimsonHi: '#e8535b',
  gold: '#d9b33c',
  vermilion: '#c0392b',
  vermilionHi: '#e8613f',
  vermilionDark: '#7d2018',
  wisteria: '#7b63c9',
  wisteriaHi: '#bcaaf4',
  wisteriaDeep: '#463379',

  // Character skin / hair
  skin: '#f2c9a0',
  skinShade: '#d7a87f',
  hair: '#33100f',
  hairHi: '#7a2626',
  hairDark: '#1a0807',

  // Metal
  steel: '#c8d6e5',
  steelDark: '#5a6b7d',
} as const;

type Ctx2D = CanvasRenderingContext2D;

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.loadRealAssets();
    this.domainExpansion();
  }

  create(): void {
    // Anims have to be registered after preload so the textures exist.
    this.makeAnimations();

    // MainMenu is registered (MainMenu.ts) — start it. If you ever
    // gut that file, the fallback you'd want is 'Level0_SnowVillage'.
    this.scene.start('MainMenu');
  }

  // ---------------
  // Asset loading
  // --------------


  private loadRealAssets(): void {
    // All character sheets in this pack are 16x16 frames.
    // Layout is 4 rows x 4 columns for Walk, 4x1 for single-line anims.
    // NOTE: this needs the assets/ folder to be reachable from the web
    // root. In Vite that means putting it under public/. If you see 404s
    // in console, that's the first thing to check.

    // NinjaDark — main character
    this.load.spritesheet(
      'ninja-dark-walk',
      'assets/characters/player/NinjaDark/SeparateAnim/Walk.png',
      { frameWidth: 16, frameHeight: 16 },
    );
    this.load.spritesheet(
      'ninja-dark-idle',
      'assets/characters/player/NinjaDark/SeparateAnim/Idle.png',
      { frameWidth: 16, frameHeight: 16 },
    );
    this.load.spritesheet(
      'ninja-dark-attack',
      'assets/characters/player/NinjaDark/SeparateAnim/Attack.png',
      { frameWidth: 16, frameHeight: 16 },
    );
    this.load.spritesheet(
      'ninja-dark-jump',
      'assets/characters/player/NinjaDark/SeparateAnim/Jump.png',
      { frameWidth: 16, frameHeight: 16 },
    );
    this.load.image(
      'ninja-dark-dead',
      'assets/characters/player/NinjaDark/SeparateAnim/Dead.png',
    );
    this.load.image(
      'ninja-dark-faceset',
      'assets/characters/player/NinjaDark/Faceset.png',
    );

    // NinjaRed — enemy
    this.load.spritesheet(
      'ninja-red-walk',
      'assets/characters/enemies/NinjaRed/SeparateAnim/Walk.png',
      { frameWidth: 16, frameHeight: 16 },
    );
    this.load.spritesheet(
      'ninja-red-attack',
      'assets/characters/enemies/NinjaRed/SeparateAnim/Attack.png',
      { frameWidth: 16, frameHeight: 16 },
    );

    // Samurai — NPC / guard
    this.load.spritesheet(
      'samurai-walk',
      'assets/characters/npc/Samurai/SeparateAnim/Walk.png',
      { frameWidth: 16, frameHeight: 16 },
    );


    // Tilesets — loaded but not wired into Level0 yet. The level still
    // uses the procedural 'tiles' sheet. Swap these in when we move to
    // a Tiled map or start painting the world with real tiles.
    //
    // TilesetFloor_352x416.png is the cropped derivative. Original is
    // 352x417 because there was 1px of dead transparent rows at the
    // bottom that made Phaser's tile slicing off-by-one. Don't use the
    // original unless you specifically need it.



    this.load.spritesheet(
      'tileset-floor',
      'assets/tilesets/TilesetFloor_352x416.png',
      { frameWidth: 16, frameHeight: 16 },
    );
    this.load.spritesheet(
      'tileset-house',
      'assets/tilesets/TilesetHouse.png',
      { frameWidth: 16, frameHeight: 16 },
    );
    this.load.spritesheet(
      'tileset-nature',
      'assets/tilesets/TilesetNature.png',
      { frameWidth: 16, frameHeight: 16 },
    );
  }

  // ----------------------------------------------------------
  // Animation registration
  //
  // Row mapping for every Walk.png in this pack:
  //   Row 0 (frames 0-3)   -> walking down (facing camera)
  //   Row 1 (frames 4-7)   -> walking up (back to camera)
  //   Row 2 (frames 8-11)  -> walking sideways, faces left by default
  //   Row 3 (frames 12-15) -> back-step / unused duplicate region
  //
  // Important: row 2 in this pack is pixel-identical to row 0 per the
  // asset audit. There are no true side-profile frames. So we use
  // sprite.setFlipX() to mirror row 2 for right-facing movement. Same
  // animation key, different flip.
  //
  // If you reorder these numbers everything breaks — the character will
  // walk sideways when you press up, or moonwalk, or do god knows what.
  // ----------------------------------------------------------

  private makeAnimations(): void {
    // Guard against double-registration on scene re-entry
    if (this.anims.exists('ninja-dark-walk-down')) return;

    const WALKERS = ['ninja-dark', 'ninja-red', 'samurai'];

    for (const key of WALKERS) {
      const sheet = `${key}-walk`;
      // Pack doesn't guarantee every character has every anim file.
      // Skip quietly if a sheet wasn't loaded.
      if (!this.textures.exists(sheet)) continue;

      this.anims.create({
        key: `${key}-walk-down`,
        frames: this.anims.generateFrameNumbers(sheet, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });

      this.anims.create({
        key: `${key}-walk-up`,
        frames: this.anims.generateFrameNumbers(sheet, { start: 4, end: 7 }),
        frameRate: 8,
        repeat: -1,
      });

      // Side walk — caller sets flipX based on direction
      this.anims.create({
        key: `${key}-walk-side`,
        frames: this.anims.generateFrameNumbers(sheet, { start: 8, end: 11 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // Idle only exists for NinjaDark in this pack
    if (this.textures.exists('ninja-dark-idle')) {
      this.anims.create({
        key: 'ninja-dark-idle-anim',
        frames: this.anims.generateFrameNumbers('ninja-dark-idle', {
          start: 0,
          end: 3,
        }),
        frameRate: 6,
        repeat: -1,
      });
    }

    // Attack is a one-shot. repeat: 0 so it plays once and stops on the
    // last frame. Hook this up to an input handler when we add combat.
    if (this.textures.exists('ninja-dark-attack')) {
      this.anims.create({
        key: 'ninja-dark-attack-anim',
        frames: this.anims.generateFrameNumbers('ninja-dark-attack', {
          start: 0,
          end: 3,
        }),
        frameRate: 12,
        repeat: 0,
      });
    }
  }

  // ----------------------------------------------------------
  // Procedural texture generation
  // ----------------------------------------------------------

  private domainExpansion(): void {
    this.makeTiles();      // 6-frame 16x16 tileset for the world grid
    this.makePlayer();     // procedural fallback character (unused in Level0)
    this.makeDummy();      // training dummy prop
    this.makePine();       // snow-covered pine tree
    this.makeRock();       // frost rock
    this.makeCrystal();    // ice crystal spire
    this.makeWisteria();   // wisteria tree
    this.makeTorii();      // vermilion torii gate
    this.makeLantern();    // stone lantern
    this.makeSnowflakes(); // snow particle textures (small + big)
    this.makeMist();       // radial gradient mist cloud
    this.makeHorizon();    // far background: sky, moon, mountains
    this.makeSlashFx();    // attack slash, hit spark, wisteria petal
    this.makeHouse();      // simple Japanese house
    this.makeShrine();     // shrine — real landmark prop for Level0
  }

  // ==========================================================
  // Helpers
  // ==========================================================

  private newCanvas(w: number, h: number): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    // Disable smoothing so our pixel fills don't get blurred. Without
    // this, canvas fills come out anti-aliased and the whole thing looks
    // like a low-res image scaled up in photoshop.
    if (ctx) ctx.imageSmoothingEnabled = false;
    return c;
  }

  private ctxOf(canvas: HTMLCanvasElement): Ctx2D {
    // 2d context is technically nullable but always exists in practice.
    // Asserting here so we don't have to null-check every call site.
    return canvas.getContext('2d')!;
  }

  private addImage(key: string, canvas: HTMLCanvasElement): void {
    // Idempotent — safe to call multiple times, only registers once.
    // Protects against scene restarts duplicating textures.
    if (this.textures.exists(key)) return;
    this.textures.addCanvas(key, canvas);
  }

  private addSheet(
  key: string,
  canvas: HTMLCanvasElement,
  fw: number,
  fh: number,
): void {
  if (this.textures.exists(key)) return;
  const cols = Math.floor(canvas.width / fw);
  const rows = Math.floor(canvas.height / fh);
  // Phaser's runtime accepts HTMLCanvasElement here, but its type
  // signature only advertises HTMLImageElement | Texture. Casting
  // through unknown is the cleanest way to say "I know what I'm
  // doing, the runtime handles this fine".
  this.textures.addSpriteSheet(
    key,
    canvas as unknown as HTMLImageElement,
    {
      frameWidth: fw,
      frameHeight: fh,
      endFrame: cols * rows - 1,
    },
  );
}

  private pixelTriangle(
    ctx: Ctx2D,
    cx: number,
    topY: number,
    halfW: number,
    h: number,
    color: string,
  ): void {

    // Triangle rasterizer that draws row by row with fillRect instead of
    // using ctx.fill() on a path. Path fills get anti-aliased which looks
    // terrible on pixel art. The +1 in the width calc ensures single-pixel
    // rows actually render — without it, Math.round can produce 0.

    ctx.fillStyle = color;
    for (let i = 0; i < h; i++) {
      const t = h === 1 ? 1 : i / (h - 1);
      const w = Math.max(1, Math.round(t * halfW * 2) + 1);
      ctx.fillRect(cx - (w >> 1), topY + i, w, 1);
    }
  }

  // ==========================================================
  // Tilemap — 6 frames of 16x16 packed horizontally (96x16)
  //
  // Frame indices (used by Level0, do not reorder):
  //   0 = clean snow
  //   1 = packed path (walked on)
  //   2 = cliff / rock wall
  //   3 = wind-swept snow
  //   4 = frozen pond
  //   5 = under-tree shade
  // ==========================================================

  private makeTiles(): void {
    if (this.textures.exists('tiles')) return;

    const canvas = this.newCanvas(96, 16);
    const ctx = this.ctxOf(canvas);

    // --- 0 --- clean snow
    ctx.fillStyle = PAL.snow;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = PAL.snowMid;
    ctx.fillRect(2, 5, 4, 2);
    ctx.fillRect(9, 10, 4, 2);
    ctx.fillStyle = PAL.snowHi;
    ctx.fillRect(3, 4, 3, 1);
    ctx.fillRect(10, 9, 3, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 3, 1, 1);
    ctx.fillRect(13, 12, 1, 1);

    // --- 1 --- packed path
    ctx.fillStyle = PAL.snowLow;
    ctx.fillRect(16, 0, 16, 16);
    ctx.fillStyle = PAL.snow;
    ctx.fillRect(16, 0, 16, 3);
    ctx.fillRect(16, 13, 16, 3);
    ctx.fillStyle = PAL.snowShadow;
    ctx.fillRect(19, 5, 5, 3);
    ctx.fillRect(25, 9, 5, 3);
    // Small exposed stone pebbles
    ctx.fillStyle = PAL.slateHi;
    ctx.fillRect(20, 6, 3, 1);
    ctx.fillRect(26, 10, 3, 1);

    // --- 2 --- cliff / wall
    ctx.fillStyle = PAL.slateDeep;
    ctx.fillRect(32, 0, 16, 16);
    ctx.fillStyle = PAL.slate;
    ctx.fillRect(33, 4, 14, 11);
    // Ice streaks in the cracks
    ctx.fillStyle = PAL.iceMid;
    ctx.fillRect(35, 7, 2, 5);
    ctx.fillRect(41, 6, 1, 7);
    // Snow cap on top
    ctx.fillStyle = PAL.snowHi;
    ctx.fillRect(32, 0, 16, 4);
    ctx.fillStyle = PAL.iceGlow;
    ctx.fillRect(34, 4, 12, 1);

    // --- 3 --- wind-swept snow (streaks)
    ctx.fillStyle = PAL.snowMid;
    ctx.fillRect(48, 0, 16, 16);
    ctx.fillStyle = PAL.snowLow;
    ctx.fillRect(50, 6, 7, 2);
    ctx.fillRect(55, 11, 7, 2);
    ctx.fillStyle = PAL.snowHi;
    ctx.fillRect(50, 5, 6, 1);
    ctx.fillRect(55, 10, 6, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(60, 3, 1, 1);
    ctx.fillRect(52, 13, 1, 1);

    // --- 4 --- frozen pond
    ctx.fillStyle = PAL.iceDeep;
    ctx.fillRect(64, 0, 16, 16);
    ctx.fillStyle = PAL.ice;
    ctx.fillRect(65, 1, 14, 14);
    // Ice shine patches
    ctx.fillStyle = PAL.iceMid;
    ctx.fillRect(66, 3, 6, 3);
    ctx.fillRect(70, 8, 6, 3);
    ctx.fillStyle = PAL.iceGlow;
    ctx.fillRect(67, 4, 4, 1);
    ctx.fillRect(71, 9, 4, 1);
    // Sparkles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(68, 6, 1, 1);
    ctx.fillRect(74, 12, 1, 1);
    ctx.fillRect(66, 12, 1, 1);

    // --- 5 --- under-tree shade
    ctx.fillStyle = PAL.snowShadow;
    ctx.fillRect(80, 0, 16, 16);
    ctx.fillStyle = PAL.snowLow;
    ctx.fillRect(82, 3, 5, 3);
    ctx.fillRect(88, 10, 5, 3);
    // Pine needle tips
    ctx.fillStyle = PAL.pineDeep;
    ctx.fillRect(84, 6, 1, 4);
    ctx.fillRect(91, 2, 1, 3);

    this.addSheet('tiles', canvas, 16, 16);
  }

  // ==========================================================
  // Procedural player — kept as fallback. Level0 uses NinjaDark,
  // but leave this here in case anything else references 'player'.
  // Sheet layout: 3 cols (idle, step-L, step-R) x 4 rows (D/U/L/R)
  // ==========================================================

  private makePlayer(): void {
    if (this.textures.exists('player')) return;

    const FW = 32;
    const FH = 32;
    const ROWS = 4;
    const COLS = 3;

    const canvas = this.newCanvas(FW * COLS, FH * ROWS);
    const ctx = this.ctxOf(canvas);

    for (let dir = 0; dir < ROWS; dir++) {
      for (let f = 0; f < COLS; f++) {
        this.drawTheMainCharacter(ctx, f * FW, dir * FH, dir, f);
      }
    }

    this.addSheet('player', canvas, FW, FH);
  }

  private drawTheMainCharacter(
    ctx: Ctx2D,
    ox: number,
    oy: number,
    dir: number,
    frame: number,
  ): void {
    // Small walk-cycle tells: 1px body bob on frame 1, and alternate legs
    // lift on frames 1 and 2. It's crude but it reads as "walking" at the
    // scale this plays at.
    const bob = frame === 1 ? -1 : 0;
    const legL = frame === 1 ? -1 : 0;
    const legR = frame === 2 ? -1 : 0;

    // Ground shadow — stays put even when the body bobs
    ctx.fillStyle = 'rgba(20, 32, 48, 0.35)';
    ctx.fillRect(ox + 9, oy + 28, 14, 3);

    // Legs
    ctx.fillStyle = PAL.uniform;
    ctx.fillRect(ox + 11, oy + 23 + legL, 4, 5);
    ctx.fillRect(ox + 17, oy + 23 + legR, 4, 5);
    ctx.fillStyle = PAL.slateDeep;
    ctx.fillRect(ox + 10, oy + 27 + legL, 6, 2);
    ctx.fillRect(ox + 16, oy + 27 + legR, 6, 2);

    // Checkered haori — drawn cell by cell because a pattern fill would
    // get blurred by the canvas when scaled

    const bodyY = oy + 12 + bob;
    const CHECK = 4;
    for (let cy = 0; cy < 12; cy += CHECK) {
      for (let cx = 0; cx < 16; cx += CHECK) {
        const green = (cx / CHECK + cy / CHECK) % 2 === 0;
        ctx.fillStyle = green ? PAL.haoriGreen : PAL.haoriDark;
        ctx.fillRect(ox + 8 + cx, bodyY + cy, CHECK, CHECK);
      }
    }
    // Edge highlight so the haori reads as a garment, not a flat rectangle
    ctx.fillStyle = PAL.haoriGreenHi;
    ctx.fillRect(ox + 8, bodyY, 16, 1);
    ctx.fillRect(ox + 8, bodyY + 11, 16, 1);

    // Arms + hands
    ctx.fillStyle = PAL.haoriDark;
    ctx.fillRect(ox + 6, bodyY + 1, 2, 7);
    ctx.fillRect(ox + 24, bodyY + 1, 2, 7);
    ctx.fillStyle = PAL.skin;
    ctx.fillRect(ox + 6, bodyY + 8, 2, 2);
    ctx.fillRect(ox + 24, bodyY + 8, 2, 2);

    // Nichirin sword — only drawn on side views. On down/up views it
    // looked like a floating stick so we skip it there.
    if (dir === 2 || dir === 3) {
      const bx = dir === 2 ? ox + 23 : ox + 8;
      ctx.fillStyle = PAL.steelDark;
      ctx.fillRect(bx, bodyY + 3, 2, 9);
      ctx.fillStyle = PAL.steel;
      ctx.fillRect(bx, bodyY + 3, 1, 8);
      // Tsuba (guard)
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(bx - 1, bodyY + 11, 4, 1);
    }

    // Head
    const headY = oy + 2 + bob;
    ctx.fillStyle = PAL.skin;
    ctx.fillRect(ox + 11, headY, 10, 9);
    ctx.fillStyle = PAL.skinShade;
    ctx.fillRect(ox + 11, headY + 7, 10, 2);

    // Hair and face vary per direction
    ctx.fillStyle = PAL.hair;
    switch (dir) {
      case 0: // facing down
        ctx.fillRect(ox + 10, headY - 1, 12, 5);
        ctx.fillRect(ox + 10, headY + 2, 2, 4);
        ctx.fillRect(ox + 20, headY + 2, 2, 4);
        ctx.fillStyle = '#1b1b1b';
        ctx.fillRect(ox + 13, headY + 5, 2, 2);
        ctx.fillRect(ox + 17, headY + 5, 2, 2);
        // Forehead scar
        ctx.fillStyle = PAL.crimsonHi;
        ctx.fillRect(ox + 15, headY + 2, 2, 1);
        break;
      case 1: // facing up (back of head)
        ctx.fillRect(ox + 10, headY - 1, 12, 10);
        ctx.fillStyle = PAL.hairHi;
        ctx.fillRect(ox + 12, headY + 1, 8, 2);
        break;
      case 2: // facing left
        ctx.fillRect(ox + 10, headY - 1, 12, 5);
        ctx.fillRect(ox + 16, headY + 2, 6, 7);
        ctx.fillStyle = '#1b1b1b';
        ctx.fillRect(ox + 12, headY + 5, 2, 2);
        break;
      case 3: // facing right
        ctx.fillRect(ox + 10, headY - 1, 12, 5);
        ctx.fillRect(ox + 10, headY + 2, 6, 7);
        ctx.fillStyle = '#1b1b1b';
        ctx.fillRect(ox + 18, headY + 5, 2, 2);
        break;
    }

    // Hanafuda earrings — visible on all views except back of head
    if (dir !== 1) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ox + 9, headY + 5, 2, 4);
      ctx.fillRect(ox + 21, headY + 5, 2, 4);
      ctx.fillStyle = PAL.crimson;
      ctx.fillRect(ox + 9, headY + 6, 2, 2);
      ctx.fillRect(ox + 21, headY + 6, 2, 2);
    }
  }

  // ==========================================================
  // Training dummy — straw bundle on a wood post, with a straw hat
  // and snow on top. Used in the tutorial area for attack practice.
  // ==========================================================

  private makeDummy(): void {
    if (this.textures.exists('dummy')) return;

    const canvas = this.newCanvas(32, 32);
    const ctx = this.ctxOf(canvas);

    // Ground shadow
    ctx.fillStyle = 'rgba(20, 32, 48, 0.40)';
    ctx.fillRect(7, 29, 18, 3);

    // Wood post behind the body
    ctx.fillStyle = PAL.woodDeep;
    ctx.fillRect(14, 12, 4, 18);
    ctx.fillStyle = PAL.woodHi;
    ctx.fillRect(14, 12, 1, 18);

    // Straw bundle body
    ctx.fillStyle = PAL.straw;
    ctx.fillRect(7, 11, 18, 14);
    ctx.fillStyle = PAL.strawHi;
    ctx.fillRect(8, 12, 16, 3);

    // Rope bands
    ctx.fillStyle = PAL.slateDeep;
    ctx.fillRect(7, 15, 18, 2);
    ctx.fillRect(7, 21, 18, 2);

    // Red target ring (aesthetic + tells the player where to aim)
    ctx.fillStyle = PAL.crimson;
    ctx.fillRect(11, 17, 10, 3);
    ctx.fillStyle = PAL.crimsonHi;
    ctx.fillRect(13, 18, 6, 1);

    // Straw hat (kasa) — cone shape
    ctx.fillStyle = PAL.wood;
    ctx.fillRect(9, 5, 14, 5);
    ctx.fillRect(6, 9, 20, 2);
    ctx.fillStyle = PAL.woodHi;
    ctx.fillRect(9, 5, 14, 1);

    // Snow on hat
    ctx.fillStyle = PAL.snowHi;
    ctx.fillRect(9, 3, 14, 2);
    ctx.fillStyle = PAL.iceGlow;
    ctx.fillRect(9, 5, 14, 1);

    // Frost line at the bottom
    ctx.fillStyle = 'rgba(10, 89, 141, 0.82)';
    ctx.fillRect(7, 24, 18, 1);

    this.addImage('dummy', canvas);
  }

  // -------------
  // World porp
  //-------------

  private makePine(): void {
    if (this.textures.exists('snow_tree')) return;

    const canvas = this.newCanvas(32, 40);
    const ctx = this.ctxOf(canvas);

    // Shadow
    ctx.fillStyle = 'rgba(20, 32, 48, 0.40)';
    ctx.fillRect(3, 34, 26, 4);

    // Trunk
    ctx.fillStyle = PAL.woodDeep;
    ctx.fillRect(13, 26, 6, 10);
    ctx.fillStyle = PAL.woodHi;
    ctx.fillRect(13, 26, 2, 10);

    // Three overlapping tiers of foliage, drawn bottom-to-top so upper
    // tiers naturally overlap lower ones.
    const tiers = [
      { top: 17, half: 14, h: 11 },
      { top: 10, half: 10, h: 10 },
      { top: 3, half: 7, h: 9 },
    ];
    for (const t of tiers) {
      this.pixelTriangle(ctx, 16, t.top, t.half, t.h, PAL.pine);
      // Snow cap follows the same triangle silhouette — shrinks down
      // from the apex, first two rows are bright white, rest is grey
      const capRows = Math.min(4, t.h);
      for (let i = 0; i < capRows; i++) {
        const k = t.h === 1 ? 1 : i / (t.h - 1);
        const w = Math.max(1, Math.round(k * t.half * 2) + 1);
        ctx.fillStyle = i < 2 ? PAL.snowHi : PAL.snow;
        ctx.fillRect(16 - (w >> 1), t.top + i, w, 1);
      }
    }

    this.addImage('snow_tree', canvas);
  }

  private makeRock(): void {
    if (this.textures.exists('frost_rock')) return;

    const canvas = this.newCanvas(16, 16);
    const ctx = this.ctxOf(canvas);

    ctx.fillStyle = 'rgba(20, 32, 48, 0.42)';
    ctx.fillRect(2, 13, 12, 2);

    // Rock body — two rectangles to give it a rough silhouette
    ctx.fillStyle = PAL.slate;
    ctx.fillRect(2, 6, 12, 8);
    ctx.fillRect(4, 3, 8, 4);

    // Highlight face
    ctx.fillStyle = PAL.slateHi;
    ctx.fillRect(3, 7, 8, 5);

    // Snow cap
    ctx.fillStyle = PAL.snowHi;
    ctx.fillRect(4, 3, 8, 3);
    ctx.fillRect(2, 6, 5, 2);

    ctx.fillStyle = PAL.iceGlow;
    ctx.fillRect(5, 3, 6, 1);

    this.addImage('frost_rock', canvas);
  }

  private makeCrystal(): void {
    if (this.textures.exists('ice_crystal')) return;

    const canvas = this.newCanvas(16, 24);
    const ctx = this.ctxOf(canvas);

    // Colored glow underneath
    ctx.fillStyle = 'rgba(0, 180, 216, 0.35)';
    ctx.fillRect(2, 19, 12, 4);

    // Silhouette — wide base plus a thin spire above
    ctx.fillStyle = PAL.iceDeep;
    ctx.fillRect(3, 10, 10, 10);
    ctx.fillRect(6, 3, 4, 17);

    // Mid-tone fill
    ctx.fillStyle = PAL.ice;
    ctx.fillRect(5, 7, 6, 12);
    ctx.fillRect(7, 4, 2, 15);

    // White highlight stripes — fake the specular look
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 5, 1, 9);
    ctx.fillRect(5, 10, 1, 6);

    // Faint outer glow. Cheap but reads as "magic" against snow.
    ctx.fillStyle = 'rgba(159, 227, 255, 0.18)';
    ctx.fillRect(2, 8, 12, 14);

    this.addImage('ice_crystal', canvas);
  }

  private makeWisteria(): void {
    if (this.textures.exists('wisteria_tree')) return;

    const canvas = this.newCanvas(32, 44);
    const ctx = this.ctxOf(canvas);

    // Shadow
    ctx.fillStyle = 'rgba(20, 32, 48, 0.35)';
    ctx.fillRect(5, 40, 22, 3);

    // Trunk + branches
    ctx.fillStyle = PAL.woodDeep;
    ctx.fillRect(14, 24, 4, 17);
    ctx.fillRect(8, 20, 16, 3);
    ctx.fillRect(6, 16, 6, 3);
    ctx.fillRect(20, 16, 6, 3);
    ctx.fillStyle = PAL.woodHi;
    ctx.fillRect(14, 24, 1, 17);

    // Canopy: overlapping rounded blobs
    const blobs: Array<[number, number, number, number]> = [
      [6, 8, 8, 7],
      [13, 4, 9, 8],
      [21, 8, 7, 7],
      [10, 13, 7, 6],
      [18, 13, 7, 6],
    ];
    // Two-pass draw: dark border first, lighter fill inset 1px on each side
    for (const [x, y, w, h] of blobs) {
      ctx.fillStyle = PAL.wisteriaDeep;
      ctx.fillRect(x, y, w, h);
    }
    for (const [x, y, w, h] of blobs) {
      ctx.fillStyle = PAL.wisteria;
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    }
    // Highlights
    ctx.fillStyle = PAL.wisteriaHi;
    ctx.fillRect(14, 5, 6, 3);
    ctx.fillRect(8, 9, 4, 2);
    ctx.fillRect(22, 9, 4, 2);

    // Hanging blossom strands — each one fades from hi to deep over its
    // length using 3 color bands (35% / 40% / 25% of the length)
    const strands: Array<[number, number, number]> = [
      [5, 12, 12],
      [9, 10, 16],
      [13, 8, 20],
      [17, 8, 19],
      [21, 10, 15],
      [25, 12, 11],
    ];
    for (const [x, y, len] of strands) {
      for (let i = 0; i < len; i++) {
        const k = i / len;
        ctx.fillStyle =
          k < 0.35
            ? PAL.wisteriaHi
            : k < 0.75
              ? PAL.wisteria
              : PAL.wisteriaDeep;
        ctx.fillRect(x, y + i, 2, 1);
      }
    }

    // Snow on the canopy
    ctx.fillStyle = PAL.snowHi;
    ctx.fillRect(13, 3, 9, 2);
    ctx.fillRect(6, 7, 6, 1);
    ctx.fillRect(21, 7, 6, 1);

    this.addImage('wisteria_tree', canvas);
  }

  //--------------
  // Architecture
  // -------------

  private makeTorii(): void {
    if (this.textures.exists('torii_gate')) return;

    const canvas = this.newCanvas(48, 44);
    const ctx = this.ctxOf(canvas);

    ctx.fillStyle = 'rgba(20, 32, 48, 0.35)';
    ctx.fillRect(4, 40, 40, 3);

    // Two pillars — 3-tone shading left to right (dark edge, mid, hi)
    for (const px of [10, 34]) {
      ctx.fillStyle = PAL.vermilionDark;
      ctx.fillRect(px, 12, 4, 28);
      ctx.fillStyle = PAL.vermilion;
      ctx.fillRect(px, 12, 3, 28);
      ctx.fillStyle = PAL.vermilionHi;
      ctx.fillRect(px, 12, 1, 28);
    }

    // Lower crossbeam (nuki)
    ctx.fillStyle = PAL.vermilionDark;
    ctx.fillRect(5, 18, 38, 4);
    ctx.fillStyle = PAL.vermilion;
    ctx.fillRect(5, 18, 38, 3);

    // Center strut (gakuzuka)
    ctx.fillStyle = PAL.vermilion;
    ctx.fillRect(22, 14, 4, 5);

    // Upper crossbeam (shimaki)
    ctx.fillStyle = PAL.vermilionDark;
    ctx.fillRect(3, 11, 42, 4);

    // Top lintel (kasagi) — the widest beam
    ctx.fillStyle = PAL.vermilionDark;
    ctx.fillRect(0, 6, 48, 6);
    ctx.fillStyle = PAL.vermilion;
    ctx.fillRect(0, 6, 48, 4);
    ctx.fillStyle = PAL.vermilionHi;
    ctx.fillRect(0, 6, 48, 1);

    // Snow on top
    ctx.fillStyle = PAL.snow;
    ctx.fillRect(0, 3, 48, 4);
    ctx.fillStyle = PAL.snowHi;
    ctx.fillRect(0, 3, 48, 1);

    // A few snow drips hanging off the edges
    ctx.fillStyle = PAL.snow;
    ctx.fillRect(2, 7, 6, 1);
    ctx.fillRect(20, 7, 8, 1);
    ctx.fillRect(40, 7, 6, 1);

    this.addImage('torii_gate', canvas);
  }

  private makeLantern(): void {
    if (this.textures.exists('stone_lantern')) return;

    const canvas = this.newCanvas(16, 24);
    const ctx = this.ctxOf(canvas);

    // Shadow
    ctx.fillStyle = 'rgba(20, 32, 48, 0.38)';
    ctx.fillRect(2, 21, 12, 3);

    // Base
    ctx.fillStyle = PAL.slateMid;
    ctx.fillRect(3, 19, 10, 3);

    // Stem
    ctx.fillStyle = PAL.slate;
    ctx.fillRect(6, 13, 4, 7);
    ctx.fillStyle = PAL.slateHi;
    ctx.fillRect(6, 13, 1, 7);

    // Platform under the firebox
    ctx.fillStyle = PAL.slateMid;
    ctx.fillRect(4, 11, 8, 3);

    // Firebox with warm glow inside — the whole reason this prop exists,
    // it pops against the cold palette
    ctx.fillStyle = PAL.slate;
    ctx.fillRect(4, 5, 8, 7);
    ctx.fillStyle = '#f6c96b';
    ctx.fillRect(6, 6, 4, 5);
    ctx.fillStyle = '#fff2c4';
    ctx.fillRect(7, 7, 2, 3);

    // Roof
    ctx.fillStyle = PAL.slateMid;
    ctx.fillRect(1, 3, 14, 3);
    ctx.fillStyle = PAL.slateHi;
    ctx.fillRect(3, 2, 10, 2);

    // Snow cap
    ctx.fillStyle = PAL.snowHi;
    ctx.fillRect(1, 1, 14, 2);

    // Finial on top
    ctx.fillStyle = PAL.slateMid;
    ctx.fillRect(7, 0, 2, 1);

    this.addImage('stone_lantern', canvas);
  }

  // ----------
  // Atmosphere
  // -----------

  private makeSnowflakes(): void {
    // Small flake — used by particle emitters in Level0
    if (!this.textures.exists('snow_flake')) {
      const canvas = this.newCanvas(3, 3);
      const ctx = this.ctxOf(canvas);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(1, 0, 1, 3);
      ctx.fillRect(0, 1, 3, 1);
      this.addImage('snow_flake', canvas);
    }

    // Big flake — currently unused. Keeping it around for a future
    // blizzard or heavy-snow variant of the weather system.
    if (!this.textures.exists('snow_flake_big')) {
      const canvas = this.newCanvas(5, 5);
      const ctx = this.ctxOf(canvas);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.fillRect(2, 0, 1, 5);
      ctx.fillRect(0, 2, 5, 1);
      ctx.fillRect(1, 1, 1, 1);
      ctx.fillRect(3, 1, 1, 1);
      ctx.fillRect(1, 3, 1, 1);
      ctx.fillRect(3, 3, 1, 1);
      this.addImage('snow_flake_big', canvas);
    }
  }

  private makeMist(): void {
    if (this.textures.exists('mist_cloud')) return;

    const canvas = this.newCanvas(96, 24);
    const ctx = this.ctxOf(canvas);

    // Radial gradient squished horizontally to make an ellipse. The
    // smooth falloff is intentional here — it's meant to be atmospheric
    // haze and pixel art bands would look wrong for that.
    ctx.save();
    ctx.translate(48, 12);
    ctx.scale(2.4, 1);
    const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, 20);
    grad.addColorStop(0, 'rgba(214, 242, 255, 0.30)');
    grad.addColorStop(0.6, 'rgba(214, 242, 255, 0.12)');
    grad.addColorStop(1, 'rgba(214, 242, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(-20, -20, 40, 40);
    ctx.restore();

    this.addImage('mist_cloud', canvas);
  }

  private makeHorizon(): void {
    if (this.textures.exists('mountain_horizon')) return;

    const canvas = this.newCanvas(320, 48);
    const ctx = this.ctxOf(canvas);

    // Night sky in horizontal color bands — flat bands read more like
    // pixel art than a smooth vertical gradient

    const sky = ['#070d17', '#0b1524', '#101d30', '#152740', '#1b3149'];
    const bandH = 6;
    sky.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, i * bandH, 320, bandH);
    });
    ctx.fillStyle = '#1b3149';
    ctx.fillRect(0, sky.length * bandH, 320, 48 - sky.length * bandH);

    // Stars — hand placed so they aren't evenly gridded. Random coords
    // looked worse because half of them clumped.
    ctx.fillStyle = '#ffffff';
    const stars: Array<[number, number]> = [
      [18, 5], [46, 12], [74, 3], [103, 9], [128, 4], [157, 13], [190, 6],
      [214, 11], [243, 4], [268, 9], [292, 14], [310, 6], [60, 16], [176, 17],
    ];
    for (const [x, y] of stars) ctx.fillRect(x, y, 1, 1);

    // Moon with a soft halo
    ctx.fillStyle = 'rgba(220, 238, 255, 0.16)';
    ctx.beginPath();
    ctx.arc(272, 14, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eaf6ff';
    ctx.beginPath();
    ctx.arc(272, 14, 7, 0, Math.PI * 2);
    ctx.fill();

    // Distant ridge silhouette
    ctx.fillStyle = '#101c2c';
    ctx.beginPath();
    ctx.moveTo(0, 48);
    ctx.lineTo(0, 34);
    ctx.lineTo(30, 24);
    ctx.lineTo(64, 33);
    ctx.lineTo(96, 26);
    ctx.lineTo(130, 35);
    ctx.lineTo(170, 28);
    ctx.lineTo(210, 36);
    ctx.lineTo(250, 27);
    ctx.lineTo(290, 34);
    ctx.lineTo(320, 26);
    ctx.lineTo(320, 48);
    ctx.closePath();
    ctx.fill();

    // Mountain peak in front
    ctx.fillStyle = '#16233a';
    ctx.beginPath();
    ctx.moveTo(60, 48);
    ctx.lineTo(140, 11);
    ctx.lineTo(180, 11);
    ctx.lineTo(260, 48);
    ctx.closePath();
    ctx.fill();

    // Snow cap — jagged bottom edge so it reads as snow, not a lampshade
    ctx.fillStyle = PAL.snow;
    ctx.beginPath();
    ctx.moveTo(140, 11);
    ctx.lineTo(180, 11);
    ctx.lineTo(186, 24);
    ctx.lineTo(176, 21);
    ctx.lineTo(168, 26);
    ctx.lineTo(160, 21);
    ctx.lineTo(150, 26);
    ctx.lineTo(140, 22);
    ctx.closePath();
    ctx.fill();

    // Rim light on the peak
    ctx.fillStyle = 'rgba(159, 227, 255, 0.35)';
    ctx.fillRect(140, 11, 40, 1);

    // Fog band at the base to blend the mountain into the ground
    ctx.fillStyle = 'rgba(159, 227, 255, 0.20)';
    ctx.fillRect(0, 40, 320, 8);
    ctx.fillStyle = 'rgba(220, 245, 255, 0.12)';
    ctx.fillRect(0, 43, 320, 5);

    this.addImage('mountain_horizon', canvas);
  }

  // -------------
  // Combat FX
  // -------------

  private makeSlashFx(): void {
    // Cyan slash arc — used as a sprite overlay when the player attacks
    if (!this.textures.exists('nichirin_slash')) {
      const canvas = this.newCanvas(32, 32);
      const ctx = this.ctxOf(canvas);

      // Outer glow stroke
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#7fe9ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(16, 16, 12, -0.75 * Math.PI, 0.25 * Math.PI);
      ctx.stroke();

      // Bright inner core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(16, 16, 12, -0.7 * Math.PI, 0.2 * Math.PI);
      ctx.stroke();

      this.addImage('nichirin_slash', canvas);
    }

    // Hit spark — small star burst on impact
    if (!this.textures.exists('hit_spark')) {
      const canvas = this.newCanvas(7, 7);
      const ctx = this.ctxOf(canvas);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 0, 1, 7);
      ctx.fillRect(0, 3, 7, 1);

      ctx.fillStyle = '#9fe3ff';
      ctx.fillRect(2, 2, 1, 1);
      ctx.fillRect(4, 2, 1, 1);
      ctx.fillRect(2, 4, 1, 1);
      ctx.fillRect(4, 4, 1, 1);

      this.addImage('hit_spark', canvas);
    }

    // Wisteria petal — used for a slow drift effect (victory pose, etc.)
    if (!this.textures.exists('wisteria_petal')) {
      const canvas = this.newCanvas(5, 3);
      const ctx = this.ctxOf(canvas);

      ctx.fillStyle = PAL.wisteriaHi;
      ctx.fillRect(1, 0, 3, 2);
      ctx.fillStyle = PAL.wisteria;
      ctx.fillRect(0, 1, 5, 1);
      ctx.fillStyle = PAL.wisteriaDeep;
      ctx.fillRect(1, 2, 3, 1);

      this.addImage('wisteria_petal', canvas);
    }
  }

private makeHouse(): void {
  if (this.textures.exists('house')) return;

  const canvas = this.newCanvas(32,32);
  const ctx = this.ctxOf(canvas);

  // Ground shadow 
  ctx.fillStyle = "rgba(0,0,0,0.4)" ;
  ctx.fillRect(4,28,24,4);

  //wall body 
  ctx.fillStyle = "#5c3a2b";
  ctx.fillRect(4,12,24,18);

  // shoji doors
  ctx.fillStyle = "#f2e8d5";
  ctx.fillRect(8,16,6,12);
  ctx.fillRect(18,16,6,12);

  // Roof 
  ctx.fillStyle = "#2c3e50";
  ctx.beginPath();
  ctx.moveTo(0,16);
  ctx.lineTo(16,2);
  ctx.lineTo(32,16);
  ctx.closePath();
  ctx.fill();

  // Snow cap on the roof - narrower triangle so a strip of the
  // roof color stays visible along the bottom edge
  ctx.fillStyle = PAL.snow;
  ctx.beginPath();
  ctx.moveTo(2,14);
  ctx.lineTo(16,2);
  ctx.lineTo(30,14);
  ctx.closePath();
  ctx.fill();

  this.addImage("house",canvas);
  }

  // ==========================================================
  // Shrine — the real landmark. Replaces the placeholder torii
  // that Level0 was using at (63, 16). 48x56 canvas, built from
  // stone foundation + vermilion pillars + slate roof + snow cap
  // + gold finial. Level0 attaches a base hitbox of (40, 16) at
  // offset (4, 40) so the player walks behind the roof.
  // ==========================================================
  private makeShrine(): void {
    if (this.textures.exists('shrine')) return;

    const canvas = this.newCanvas(48, 56);
    const ctx = this.ctxOf(canvas);

    // Ground shadow
    ctx.fillStyle = 'rgba(20, 32, 48, 0.40)';
    ctx.fillRect(4, 52, 40, 3);

    // Stone foundation
    ctx.fillStyle = PAL.slate;
    ctx.fillRect(4, 46, 40, 8);
    ctx.fillStyle = PAL.slateHi;
    ctx.fillRect(4, 46, 40, 2);
    ctx.fillStyle = PAL.slateMid;
    ctx.fillRect(18, 52, 12, 3);

    // Wood wall
    ctx.fillStyle = PAL.wood;
    ctx.fillRect(6, 24, 36, 24);
    ctx.fillStyle = PAL.woodHi;
    ctx.fillRect(6, 24, 36, 1);

    // Vermilion pillars (left, center, right)
    for (const px of [6, 22, 38]) {
      ctx.fillStyle = PAL.vermilionDark;
      ctx.fillRect(px, 22, 4, 26);
      ctx.fillStyle = PAL.vermilion;
      ctx.fillRect(px, 22, 3, 26);
      ctx.fillStyle = PAL.vermilionHi;
      ctx.fillRect(px, 22, 1, 26);
    }

    // Shoji doors
    ctx.fillStyle = '#f2e8d5';
    ctx.fillRect(10, 28, 12, 18);
    ctx.fillRect(26, 28, 12, 18);
    ctx.fillStyle = PAL.woodDeep;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(10, 32 + i * 4, 12, 1);
      ctx.fillRect(26, 32 + i * 4, 12, 1);
    }
    ctx.fillRect(15, 28, 1, 18);
    ctx.fillRect(31, 28, 1, 18);

    // Warm interior glow — same amber as the stone lantern
    ctx.fillStyle = 'rgba(246, 201, 107, 0.28)';
    ctx.fillRect(11, 29, 10, 16);
    ctx.fillRect(27, 29, 10, 16);

    // Lower crossbeam
    ctx.fillStyle = PAL.woodDeep;
    ctx.fillRect(4, 24, 40, 2);
    ctx.fillStyle = PAL.woodHi;
    ctx.fillRect(4, 24, 40, 1);

    // Lower eave
    ctx.fillStyle = PAL.slateDeep;
    ctx.fillRect(0, 20, 48, 3);
    ctx.fillStyle = PAL.slate;
    ctx.fillRect(0, 20, 48, 2);
    ctx.fillStyle = PAL.slateHi;
    ctx.fillRect(0, 20, 48, 1);

    // Middle roof section
    ctx.fillStyle = PAL.slateDeep;
    ctx.beginPath();
    ctx.moveTo(2, 20);
    ctx.lineTo(8, 12);
    ctx.lineTo(40, 12);
    ctx.lineTo(46, 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAL.slate;
    ctx.beginPath();
    ctx.moveTo(4, 19);
    ctx.lineTo(9, 13);
    ctx.lineTo(39, 13);
    ctx.lineTo(44, 19);
    ctx.closePath();
    ctx.fill();

    // Upper peak
    ctx.fillStyle = PAL.slateDeep;
    ctx.beginPath();
    ctx.moveTo(10, 12);
    ctx.lineTo(24, 2);
    ctx.lineTo(38, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAL.slate;
    ctx.beginPath();
    ctx.moveTo(12, 11);
    ctx.lineTo(24, 3);
    ctx.lineTo(36, 11);
    ctx.closePath();
    ctx.fill();

    // Snow cap on the peak — thin strip along the ridge
    ctx.fillStyle = PAL.snow;
    ctx.beginPath();
    ctx.moveTo(11, 11);
    ctx.lineTo(24, 2);
    ctx.lineTo(37, 11);
    ctx.lineTo(36, 12);
    ctx.lineTo(24, 4);
    ctx.lineTo(12, 12);
    ctx.closePath();
    ctx.fill();

    // Snow on the eaves
    ctx.fillStyle = PAL.snowHi;
    ctx.fillRect(0, 19, 48, 2);
    ctx.fillStyle = PAL.snow;
    for (const x of [3, 9, 15, 33, 39, 45]) {
      ctx.fillRect(x, 21, 2, 2);
    }

    // Gold finial
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(23, 0, 2, 3);
    ctx.fillStyle = '#f4d76b';
    ctx.fillRect(23, 0, 1, 2);

    this.addImage('shrine', canvas);
  }
}