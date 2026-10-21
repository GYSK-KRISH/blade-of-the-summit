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

const PAL = {
  // ─── snow ❄️ soft like yor forger's maternal instincts ───
  snowHi: '#f4fcff',
  snow: '#dceefb',
  snowMid: '#c2def3',
  snowLow: '#a4c6e3',
  snowShadow: '#87a8c6',

  // ─── ice 🧊 colder than ayanokoji's personality ───
  iceDeep: '#14425f',
  iceMid: '#3d8fbd',
  ice: '#56abdf',
  iceHi: '#8fd8f5',
  iceGlow: '#c9f2ff',

  // ─── slate 🪨 rock solid like thorfinn's character arc ───
  slateDeep: '#0f1720',
  slate: '#2b3a4a',
  slateMid: '#415a77',
  slateHi: '#6b7f96',

  // ─── pine 🌲 evergreen like anya's "waku waku" energy ───
  pineDeep: '#0b2419',
  pine: '#173f30',
  pineHi: '#2e6650',

  // ─── wood / straw 🪵 cozy like the spy x family home ───
  woodDeep: '#2b1c13',
  wood: '#4e342e',
  woodHi: '#7a5544',
  straw: '#a8823f',
  strawHi: '#d8b45f',

  // ─── demon slayer accents ⚔️ the whole entire vibe ───
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
  skin: '#f2c9a0',
  skinShade: '#d7a87f',
  hair: '#33100f',
  hairHi: '#7a2626',
  steel: '#c8d6e5',
  steelDark: '#5a6b7d',
} as const;

type Ctx2D = CanvasRenderingContext2D;

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    // doing all the heavy lifting in preload so create() runs smooth
    // like levi carrying the survey corps. nothing's actually loading 
    // from disk, but this means everything exists by the time create() runs (:
    this.domainExpansion();
  }

  create(): void {
    // starting the actual game like eren starting the rumbling.
    // no going back now. shinzou sasageyo. etc etc.
    // NOTE: change 'GameScene' to 'MainMenu' if u deleted GameScene!
    this.scene.start('MainMenu');
  }

  // ==========================================================
  // DOMAIN EXPANSION: MANIFEST DESTINY (the to-do list) ⚔️
  // activating every texture in sequence like it's a combo
  // ==========================================================
  private domainExpansion(): void {

    

    this.makeTiles();       // the battlefield
    this.makePlayer();      // the main character
    this.makeDummy();       // the practice target

    // world props — the side characters that lowkey carry
    this.makePine();
    this.makeRock();
    this.makeCrystal();
    this.makeWisteria();

    // architecture — the a e s t h e t i c backdrop
    this.makeTorii();
    this.makeLantern();

    // atmosphere — the ✨cinematic✨ vibe
    this.makeSnowflakes();
    this.makeMist();
    this.makeHorizon();

    // fx — the "domain expansion" moment
    this.makeSlashFx();

    this.makeHouse();


  }
    private makeHouse(): void {
    if (this.textures.exists('house')) return;

    const canvas = this.newCanvas(32, 32);
    const ctx = this.ctxOf(canvas);

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(4, 28, 24, 4);

    // walls (wood)
    ctx.fillStyle = '#5c3a2b';
    ctx.fillRect(4, 12, 24, 18);

    // paper doors (shoji)
    ctx.fillStyle = '#f2e8d5';
    ctx.fillRect(8, 16, 6, 12);
    ctx.fillRect(18, 16, 6, 12);

    // roof (blue-grey)
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(16, 2);
    ctx.lineTo(32, 16);
    ctx.closePath();
    ctx.fill();

    // snow on the roof
    ctx.fillStyle = PAL.snow;
    ctx.beginPath();
    ctx.moveTo(2, 14);
    ctx.lineTo(16, 2);
    ctx.lineTo(30, 14);
    ctx.closePath();
    ctx.fill();

    this.addImage('house', canvas);
  }

  // ==========================================================
  // helpers — the jujutsu tech support squad
  // ==========================================================

  // if I have to type document.createElement one more time I'm going
  // to lose it. cursed technique: canvas
  private newCanvas(w: number, h: number): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    // pixel art mode. without this, fills get anti-aliased and
    // the whole thing looks like an SNES rom resized in mspaint.
    // that's giving "bought the game off wish.com" energy. no.
    if (ctx) ctx.imageSmoothingEnabled = false;
    return c;
  }

  // `!` here is fine. 2d context always exists in practice.
  // gojo said "nah i'd win" and the context was null. it wasn't.
  private ctxOf(canvas: HTMLCanvasElement): Ctx2D {
    return canvas.getContext('2d')!;
  }

  private addImage(key: string, canvas: HTMLCanvasElement): void {
    if (this.textures.exists(key)) return;
    this.textures.addCanvas(key, canvas);
  }

  // frame math so i don't have to hardcode endFrame each time.
  // phaser counts frames inclusively fyi, so -1 not `total`.
  // lowkey tripped on this for 20 min. deadass. skill issue.
  private addSheet(
    key: string,
    canvas: HTMLCanvasElement,
    fw: number,
    fh: number,
  ): void {
    if (this.textures.exists(key)) return;
    const cols = Math.floor(canvas.width / fw);
    const rows = Math.floor(canvas.height / fh);
    this.textures.addSpriteSheet(key, canvas, {
      frameWidth: fw,
      frameHeight: fh,
      endFrame: cols * rows - 1,
    });
  }

  // tiny triangle rasterizer. fillRect on a path gets anti-aliased
  // and that defeats the entire point of pixel art. learned that
  // the hard way. cried about it. moved on. character development.
  private pixelTriangle(
    ctx: Ctx2D,
    cx: number,
    topY: number,
    halfW: number,
    h: number,
    color: string,
  ): void {
    ctx.fillStyle = color;
    for (let i = 0; i < h; i++) {
      const t = h === 1 ? 1 : i / (h - 1);
      // the +1 is NOT a typo, single-pixel rows just don't render
      // without it. don't ask me why. the canvas gods are
      // mysterious and we do not question them. b-baka.
      const w = Math.max(1, Math.round(t * halfW * 2) + 1);
      ctx.fillRect(cx - (w >> 1), topY + i, w, 1);
    }
  }

  // ==========================================================
  // 1. TILESET. 6 frames of 16x16 = 96x16 canvas. the MAP.
  //    frame order (DON'T REORDER, game uses these indices
  //    like they're the survey corps formation. one wrong slot
  //    and everyone dies. no pressure. yeager energy):
  //      0 = fresh powder
  //      1 = packed trail
  //      2 = icy cliff wall
  //      3 = wind-swept snow
  //      4 = frozen pond
  //      5 = forest-floor shade
  // ==========================================================
  private makeTiles(): void {
    if (this.textures.exists('tiles')) return;

    const canvas = this.newCanvas(96, 16);
    const ctx = this.ctxOf(canvas);

    // --- 0 --- clean snow with a couple sparkles ✨
    // this is the "opening scene where everything is peaceful" of tiles.
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

    // --- 1 --- walked-on trail. snow's been flattened + you can
    // see a couple exposed stones from somebody walking through.
    ctx.fillStyle = PAL.snowLow;
    ctx.fillRect(16, 0, 16, 16);
    ctx.fillStyle = PAL.snow;
    ctx.fillRect(16, 0, 16, 3);
    ctx.fillRect(16, 13, 16, 3);
    ctx.fillStyle = PAL.snowShadow;
    ctx.fillRect(19, 5, 5, 3);
    ctx.fillRect(25, 9, 5, 3);
    ctx.fillStyle = PAL.slateHi;
    ctx.fillRect(20, 6, 3, 1);
    ctx.fillRect(26, 10, 3, 1);

    // --- 2 --- solid rock wall with snow cap. this one blocks
    // movement. it's giving "i'm not letting you past until
    // you confess your feelings" energy. tsundere wall fr.
    ctx.fillStyle = PAL.slateDeep;
    ctx.fillRect(32, 0, 16, 16);
    ctx.fillStyle = PAL.slate;
    ctx.fillRect(33, 4, 14, 11);
    ctx.fillStyle = PAL.iceMid;
    ctx.fillRect(35, 7, 2, 5);
    ctx.fillRect(41, 6, 1, 7);
    ctx.fillStyle = PAL.snowHi;
    ctx.fillRect(32, 0, 16, 4);
    ctx.fillStyle = PAL.iceGlow;
    ctx.fillRect(34, 4, 12, 1);

    // --- 3 --- snow that got blown around (wind streaks). very
    // "mikasa's scarf in the wind" energy. either way, iconic.
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

    // --- 4 --- frozen pond. diagonal ice shine lines.
    // it's giving ice skating date arc. just don't fall through.
    ctx.fillStyle = PAL.iceDeep;
    ctx.fillRect(64, 0, 16, 16);
    ctx.fillStyle = PAL.ice;
    ctx.fillRect(65, 1, 14, 14);
    ctx.fillStyle = PAL.iceMid;
    ctx.fillRect(66, 3, 6, 3);
    ctx.fillRect(70, 8, 6, 3);
    ctx.fillStyle = PAL.iceGlow;
    ctx.fillRect(67, 4, 4, 1);
    ctx.fillRect(71, 9, 4, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(68, 6, 1, 1);
    ctx.fillRect(74, 12, 1, 1);
    ctx.fillRect(66, 12, 1, 1);

    // --- 5 --- darker snow, under trees. slight pine tint so
    // you can tell you're in a forest and not just a dim room.
    ctx.fillStyle = PAL.snowShadow;
    ctx.fillRect(80, 0, 16, 16);
    ctx.fillStyle = PAL.snowLow;
    ctx.fillRect(82, 3, 5, 3);
    ctx.fillRect(88, 10, 5, 3);
    ctx.fillStyle = PAL.pineDeep;
    ctx.fillRect(84, 6, 1, 4);
    ctx.fillRect(91, 2, 1, 3);

    this.addSheet('tiles', canvas, 16, 16);
  }

  // ==========================================================
  // 2. PLAYER SHEET. tanjiro-style. THE MAIN CHARACTER.
  //    4 directions x 3 frames. 32x32 each = 96x128.
  //    rows = direction (D/U/L/R) — LOAD-BEARING.
  //    cols = idle / step-L / step-R
  // ==========================================================
  private makePlayer(): void {
    if (this.textures.exists('player')) return;

    const FW = 32;
    const FH = 32;
    const ROWS = 4; // D U L R
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

  // one frame. dir = 0..3 (D/U/L/R), frame = 0..2.
  // drawing senpai one frame at a time because they deserve the effort.
  private drawTheMainCharacter(
    ctx: Ctx2D,
    ox: number,
    oy: number,
    dir: number,
    frame: number,
  ): void {
    // quick leg anim: frame 1 lifts left, frame 2 lifts right.
    // body bobs -1 px on frame 1 so it doesn't feel so stiff.
    const bob = frame === 1 ? -1 : 0;
    const legL = frame === 1 ? -1 : 0;
    const legR = frame === 2 ? -1 : 0;

    // ---- shadow (does NOT bob, it's on the ground, gravity
    // is real and we respect it no cap.) ----
    ctx.fillStyle = 'rgba(20, 32, 48, 0.35)';
    ctx.fillRect(ox + 9, oy + 28, 14, 3);

    // ---- legs. training arc energy. never skip leg day. ----
    ctx.fillStyle = PAL.uniform;
    ctx.fillRect(ox + 11, oy + 23 + legL, 4, 5);
    ctx.fillRect(ox + 17, oy + 23 + legR, 4, 5);
    ctx.fillStyle = PAL.slateDeep;
    ctx.fillRect(ox + 10, oy + 27 + legL, 6, 2);
    ctx.fillRect(ox + 16, oy + 27 + legR, 6, 2);

    // ---- checkered haori. the "tanjiro" bit. drawing cell by cell
    // because a pattern fill would blur on resize and i'd cry.
    const bodyY = oy + 12 + bob;
    const CHECK = 4;
    for (let cy = 0; cy < 12; cy += CHECK) {
      for (let cx = 0; cx < 16; cx += CHECK) {
        const green = (cx / CHECK + cy / CHECK) % 2 === 0;
        ctx.fillStyle = green ? PAL.haoriGreen : PAL.haoriDark;
        ctx.fillRect(ox + 8 + cx, bodyY + cy, CHECK, CHECK);
      }
    }
    // subtle highlights on top/bottom edges so it doesn't look flat.
    ctx.fillStyle = PAL.haoriGreenHi;
    ctx.fillRect(ox + 8, bodyY, 16, 1);
    ctx.fillRect(ox + 8, bodyY + 11, 16, 1);

    // ---- arms + hands. reaching out for senpai. jk... unless? ----
    ctx.fillStyle = PAL.haoriDark;
    ctx.fillRect(ox + 6, bodyY + 1, 2, 7);
    ctx.fillRect(ox + 24, bodyY + 1, 2, 7);
    ctx.fillStyle = PAL.skin;
    ctx.fillRect(ox + 6, bodyY + 8, 2, 2);
    ctx.fillRect(ox + 24, bodyY + 8, 2, 2);

    // ---- nichirin blade. only visible from the side views —
    // drawing it in the down/up frames looked like a floating stick.
    if (dir === 2 || dir === 3) {
      const bx = dir === 2 ? ox + 23 : ox + 8;
      ctx.fillStyle = PAL.steelDark;
      ctx.fillRect(bx, bodyY + 3, 2, 9);
      ctx.fillStyle = PAL.steel;
      ctx.fillRect(bx, bodyY + 3, 1, 8);
      ctx.fillStyle = PAL.gold; // tsuba (guard) — she's cute, she's functional
      ctx.fillRect(bx - 1, bodyY + 11, 4, 1);
    }

    // ---- head. the money maker. the icon. the protagonist. ----
    const headY = oy + 2 + bob;
    ctx.fillStyle = PAL.skin;
    ctx.fillRect(ox + 11, headY, 10, 9);
    ctx.fillStyle = PAL.skinShade;
    ctx.fillRect(ox + 11, headY + 7, 10, 2);

    // ---- hair + face per direction. expressions matter. ----
    ctx.fillStyle = PAL.hair;
    switch (dir) {
      case 0: // down / facing camera — the "notice me" face
        ctx.fillRect(ox + 10, headY - 1, 12, 5);
        ctx.fillRect(ox + 10, headY + 2, 2, 4);
        ctx.fillRect(ox + 20, headY + 2, 2, 4);
        ctx.fillStyle = '#1b1b1b';
        ctx.fillRect(ox + 13, headY + 5, 2, 2);
        ctx.fillRect(ox + 17, headY + 5, 2, 2);
        // forehead scar. canon. iconic. from protecting tanjuro.
        ctx.fillStyle = PAL.crimsonHi;
        ctx.fillRect(ox + 15, headY + 2, 2, 1);
        break;
      case 1: // up / back of head — the tsundere "i don't care" angle
        ctx.fillRect(ox + 10, headY - 1, 12, 10);
        ctx.fillStyle = PAL.hairHi;
        ctx.fillRect(ox + 12, headY + 1, 8, 2);
        break;
      case 2: // left — the "looking away blushing" angle >///<
        ctx.fillRect(ox + 10, headY - 1, 12, 5);
        ctx.fillRect(ox + 16, headY + 2, 6, 7);
        ctx.fillStyle = '#1b1b1b';
        ctx.fillRect(ox + 12, headY + 5, 2, 2);
        break;
      case 3: // right — the "glancing over" angle. kyaaa~
        ctx.fillRect(ox + 10, headY - 1, 12, 5);
        ctx.fillRect(ox + 10, headY + 2, 6, 7);
        ctx.fillStyle = '#1b1b1b';
        ctx.fillRect(ox + 18, headY + 5, 2, 2);
        break;
    }

    // hanafuda earrings. only from front/side, back of head
    // doesn't have ears duh. this detail is 90% of why i picked
    // this design. sun breathing. hinokami kagura. GOATed.
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
  // 3. TRAINING DUMMY. straw bundle + kasa (straw hat) + snow.
  //    the demon slayer corps needs a punching bag.
  // ==========================================================
  private makeDummy(): void {
    if (this.textures.exists('dummy')) return;

    const canvas = this.newCanvas(32, 32);
    const ctx = this.ctxOf(canvas);

    // shadow. everyone has one. even the training dummy.
    ctx.fillStyle = 'rgba(20, 32, 48, 0.40)';
    ctx.fillRect(7, 29, 18, 3);

    // wooden post sticking out the bottom
    ctx.fillStyle = PAL.woodDeep;
    ctx.fillRect(14, 12, 4, 18);
    ctx.fillStyle = PAL.woodHi;
    ctx.fillRect(14, 12, 1, 18);

    // straw body. the build. the gains.
    ctx.fillStyle = PAL.straw;
    ctx.fillRect(7, 11, 18, 14);
    ctx.fillStyle = PAL.strawHi;
    ctx.fillRect(8, 12, 16, 3);

    // rope bands.
    ctx.fillStyle = PAL.slateDeep;
    ctx.fillRect(7, 15, 18, 2);
    ctx.fillRect(7, 21, 18, 2);

    // target ring (crimson = demon slayer accent). aim for the
    // heart. that's where feelings live.
    ctx.fillStyle = PAL.crimson;
    ctx.fillRect(11, 17, 10, 3);
    ctx.fillStyle = PAL.crimsonHi;
    ctx.fillRect(13, 18, 6, 1);

    // kasa (cone straw hat). very cottagecore.
    ctx.fillStyle = PAL.wood;
    ctx.fillRect(9, 5, 14, 5);
    ctx.fillRect(6, 9, 20, 2);
    ctx.fillStyle = PAL.woodHi;
    ctx.fillRect(9, 5, 14, 1);

    // snow on the hat, obviously. we're on a mountain. in winter.
    ctx.fillStyle = PAL.snowHi;
    ctx.fillRect(9, 3, 14, 2);
    ctx.fillStyle = PAL.iceGlow;
    ctx.fillRect(9, 5, 14, 1);

    // frost creep along the bottom
    ctx.fillStyle = 'rgba(10, 89, 141, 0.82)';
    ctx.fillRect(7, 24, 18, 1);

    this.addImage('dummy', canvas);
  }

  // ==========================================================
  // 4. WORLD PROPS — the supporting cast.
  // ==========================================================

  // japanese black pine (matsu) covered in snow. 32x40.
  private makePine(): void {
    if (this.textures.exists('snow_tree')) return;

    const canvas = this.newCanvas(32, 40);
    const ctx = this.ctxOf(canvas);

    ctx.fillStyle = 'rgba(20, 32, 48, 0.40)';
    ctx.fillRect(3, 34, 26, 4);

    // trunk. strong. reliable.
    ctx.fillStyle = PAL.woodDeep;
    ctx.fillRect(13, 26, 6, 10);
    ctx.fillStyle = PAL.woodHi;
    ctx.fillRect(13, 26, 2, 10);

    // 3 tiers, drawn bottom to top so the ones above overlap naturally.
    const tiers = [
      { top: 17, half: 14, h: 11 },
      { top: 10, half: 10, h: 10 },
      { top: 3, half: 7, h: 9 },
    ];
    for (const t of tiers) {
      this.pixelTriangle(ctx, 16, t.top, t.half, t.h, PAL.pine);
      // snow cap follows the same triangle shape. like a little hat.
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

  // frost rock. 16x16. pretty boring, honestly. but even boring
  // characters get love arcs. i see you frost rock.
  private makeRock(): void {
    if (this.textures.exists('frost_rock')) return;

    const canvas = this.newCanvas(16, 16);
    const ctx = this.ctxOf(canvas);

    ctx.fillStyle = 'rgba(20, 32, 48, 0.42)';
    ctx.fillRect(2, 13, 12, 2);

    ctx.fillStyle = PAL.slate;
    ctx.fillRect(2, 6, 12, 8);
    ctx.fillRect(4, 3, 8, 4);

    ctx.fillStyle = PAL.slateHi;
    ctx.fillRect(3, 7, 8, 5);

    ctx.fillStyle = PAL.snowHi;
    ctx.fillRect(4, 3, 8, 3);
    ctx.fillRect(2, 6, 5, 2);

    ctx.fillStyle = PAL.iceGlow;
    ctx.fillRect(5, 3, 6, 1);

    this.addImage('frost_rock', canvas);
  }

  // ice crystal spire. 16x24.
  private makeCrystal(): void {
    if (this.textures.exists('ice_crystal')) return;

    const canvas = this.newCanvas(16, 24);
    const ctx = this.ctxOf(canvas);

    ctx.fillStyle = 'rgba(0, 180, 216, 0.35)';
    ctx.fillRect(2, 19, 12, 4);

    ctx.fillStyle = PAL.iceDeep;
    ctx.fillRect(3, 10, 10, 10);
    ctx.fillRect(6, 3, 4, 17);

    ctx.fillStyle = PAL.ice;
    ctx.fillRect(5, 7, 6, 12);
    ctx.fillRect(7, 4, 2, 15);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 5, 1, 9);
    ctx.fillRect(5, 10, 1, 6);

    // fake outer glow. cheap but reads fine on snow. delulu
    // but in a functional way.
    ctx.fillStyle = 'rgba(159, 227, 255, 0.18)';
    ctx.fillRect(2, 8, 12, 14);

    this.addImage('ice_crystal', canvas);
  }

  // wisteria tree. THE tree. the love tree. the emblem tree.
  // demon slayer corps HQ. took the longest to get right ngl.
  private makeWisteria(): void {
    if (this.textures.exists('wisteria_tree')) return;

    const canvas = this.newCanvas(32, 44);
    const ctx = this.ctxOf(canvas);

    ctx.fillStyle = 'rgba(20, 32, 48, 0.35)';
    ctx.fillRect(5, 40, 22, 3);

    // trunk + branching. growing toward the sky.
    ctx.fillStyle = PAL.woodDeep;
    ctx.fillRect(14, 24, 4, 17);
    ctx.fillRect(8, 20, 16, 3);
    ctx.fillRect(6, 16, 6, 3);
    ctx.fillRect(20, 16, 6, 3);
    ctx.fillStyle = PAL.woodHi;
    ctx.fillRect(14, 24, 1, 17);

    // canopy is just rectangles with shrinking insets for a blobby feel.
    const blobs: Array<[number, number, number, number]> = [
      [6, 8, 8, 7],
      [13, 4, 9, 8],
      [21, 8, 7, 7],
      [10, 13, 7, 6],
      [18, 13, 7, 6],
    ];
    for (const [x, y, w, h] of blobs) {
      ctx.fillStyle = PAL.wisteriaDeep;
      ctx.fillRect(x, y, w, h);
    }
    for (const [x, y, w, h] of blobs) {
      ctx.fillStyle = PAL.wisteria;
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    }
    // highlights where light hits.
    ctx.fillStyle = PAL.wisteriaHi;
    ctx.fillRect(14, 5, 6, 3);
    ctx.fillRect(8, 9, 4, 2);
    ctx.fillRect(22, 9, 4, 2);

    // hanging blossom strands.
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

    // snow on the canopy since we're on a mountain in winter.
    ctx.fillStyle = PAL.snowHi;
    ctx.fillRect(13, 3, 9, 2);
    ctx.fillRect(6, 7, 6, 1);
    ctx.fillRect(21, 7, 6, 1);

    this.addImage('wisteria_tree', canvas);
  }

  // ==========================================================
  // 5. JAPANESE ARCHITECTURE — the romantic backdrop bestie.
  // ==========================================================

  // vermilion torii gate. 48x44.
  private makeTorii(): void {
    if (this.textures.exists('torii_gate')) return;

    const canvas = this.newCanvas(48, 44);
    const ctx = this.ctxOf(canvas);

    ctx.fillStyle = 'rgba(20, 32, 48, 0.35)';
    ctx.fillRect(4, 40, 40, 3);

    // two pillars. 3-tone: dark edge, mid, highlight.
    for (const px of [10, 34]) {
      ctx.fillStyle = PAL.vermilionDark;
      ctx.fillRect(px, 12, 4, 28);
      ctx.fillStyle = PAL.vermilion;
      ctx.fillRect(px, 12, 3, 28);
      ctx.fillStyle = PAL.vermilionHi;
      ctx.fillRect(px, 12, 1, 28);
    }

    // nuki (lower crossbeam)
    ctx.fillStyle = PAL.vermilionDark;
    ctx.fillRect(5, 18, 38, 4);
    ctx.fillStyle = PAL.vermilion;
    ctx.fillRect(5, 18, 38, 3);

    // gakuzuka (little vertical strut in the middle).
    ctx.fillStyle = PAL.vermilion;
    ctx.fillRect(22, 14, 4, 5);

    // shimaki (upper crossbeam)
    ctx.fillStyle = PAL.vermilionDark;
    ctx.fillRect(3, 11, 42, 4);

    // kasagi (top lintel). iconic. legendary.
    ctx.fillStyle = PAL.vermilionDark;
    ctx.fillRect(0, 6, 48, 6);
    ctx.fillStyle = PAL.vermilion;
    ctx.fillRect(0, 6, 48, 4);
    ctx.fillStyle = PAL.vermilionHi;
    ctx.fillRect(0, 6, 48, 1);

    // snow on the roof.
    ctx.fillStyle = PAL.snow;
    ctx.fillRect(0, 3, 48, 4);
    ctx.fillStyle = PAL.snowHi;
    ctx.fillRect(0, 3, 48, 1);
    
    // a few drips of snow hanging off the edges.
    ctx.fillStyle = PAL.snow;
    ctx.fillRect(2, 7, 6, 1);
    ctx.fillRect(20, 7, 8, 1);
    ctx.fillRect(40, 7, 6, 1);

    this.addImage('torii_gate', canvas);
  }

  // stone lantern (toro). 16x24. glows warm against all the cold
  // blue tones, which is the WHOLE reason it's here.
  private makeLantern(): void {
    if (this.textures.exists('stone_lantern')) return;

    const canvas = this.newCanvas(16, 24);
    const ctx = this.ctxOf(canvas);

    ctx.fillStyle = 'rgba(20, 32, 48, 0.38)';
    ctx.fillRect(2, 21, 12, 3);

    ctx.fillStyle = PAL.slateMid;
    ctx.fillRect(3, 19, 10, 3);

    ctx.fillStyle = PAL.slate;
    ctx.fillRect(6, 13, 4, 7);
    ctx.fillStyle = PAL.slateHi;
    ctx.fillRect(6, 13, 1, 7);

    ctx.fillStyle = PAL.slateMid;
    ctx.fillRect(4, 11, 8, 3);

    // firebox. the glow. the warmth.
    ctx.fillStyle = PAL.slate;
    ctx.fillRect(4, 5, 8, 7);
    ctx.fillStyle = '#f6c96b';
    ctx.fillRect(6, 6, 4, 5);
    ctx.fillStyle = '#fff2c4';
    ctx.fillRect(7, 7, 2, 3);

    // roof.
    ctx.fillStyle = PAL.slateMid;
    ctx.fillRect(1, 3, 14, 3);
    ctx.fillStyle = PAL.slateHi;
    ctx.fillRect(3, 2, 10, 2);

    // snow cap.
    ctx.fillStyle = PAL.snowHi;
    ctx.fillRect(1, 1, 14, 2);

    // finial.
    ctx.fillStyle = PAL.slateMid;
    ctx.fillRect(7, 0, 2, 1);

    this.addImage('stone_lantern', canvas);
  }

  // ==========================================================
  // 6. ATMOSPHERE BITS — the ✨mood✨.
  // ==========================================================

  private makeSnowflakes(): void {
    // small flake 3x3. this is the one particles use.
    if (!this.textures.exists('snow_flake')) {
      const canvas = this.newCanvas(3, 3);
      const ctx = this.ctxOf(canvas);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(1, 0, 1, 3);
      ctx.fillRect(0, 1, 3, 1);
      this.addImage('snow_flake', canvas);
    }

    // big flake. not wired into anything yet — saving it for
    // when i add the blizzard phase.
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

  // drifting mist. 96x24, radial gradient stretched wide.
  private makeMist(): void {
    if (this.textures.exists('mist_cloud')) return;

    const canvas = this.newCanvas(96, 24);
    const ctx = this.ctxOf(canvas);

    ctx.save();
    ctx.translate(48, 12);
    ctx.scale(2.4, 1); // squish wide so it's an ellipse not a circle
    const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, 20);
    grad.addColorStop(0, 'rgba(214, 242, 255, 0.30)');
    grad.addColorStop(0.6, 'rgba(214, 242, 255, 0.12)');
    grad.addColorStop(1, 'rgba(214, 242, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(-20, -20, 40, 40);
    ctx.restore();

    this.addImage('mist_cloud', canvas);
  }

  // horizon strip. 320x48. mt fuji + moon + stars.
  private makeHorizon(): void {
    if (this.textures.exists('mountain_horizon')) return;

    const canvas = this.newCanvas(320, 48);
    const ctx = this.ctxOf(canvas);

    // night sky, banded. chunky bands look more pixel-art.
    const sky = ['#070d17', '#0b1524', '#101d30', '#152740', '#1b3149'];
    const bandH = 6;
    sky.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, i * bandH, 320, bandH);
    });
    ctx.fillStyle = '#1b3149';
    ctx.fillRect(0, sky.length * bandH, 320, 48 - sky.length * bandH);

    // stars. hand-placed so they don't cluster.
    ctx.fillStyle = '#ffffff';
    const stars: Array<[number, number]> = [
      [18, 5], [46, 12], [74, 3], [103, 9], [128, 4], [157, 13], [190, 6],
      [214, 11], [243, 4], [268, 9], [292, 14], [310, 6], [60, 16], [176, 17],
    ];
    for (const [x, y] of stars) ctx.fillRect(x, y, 1, 1);

    // moon + halo.
    ctx.fillStyle = 'rgba(220, 238, 255, 0.16)';
    ctx.beginPath();
    ctx.arc(272, 14, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eaf6ff';
    ctx.beginPath();
    ctx.arc(272, 14, 7, 0, Math.PI * 2);
    ctx.fill();

    // distant ridge. draw as a path, fill once. efficient.
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

    // mt fuji silhouette.
    ctx.fillStyle = '#16233a';
    ctx.beginPath();
    ctx.moveTo(60, 48);
    ctx.lineTo(140, 11);
    ctx.lineTo(180, 11);
    ctx.lineTo(260, 48);
    ctx.closePath();
    ctx.fill();

    // snow cap. jagged bottom edge is important, otherwise it
    // looks like a lampshade instead of a mountain.
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

    // rim light on the peak.
    ctx.fillStyle = 'rgba(159, 227, 255, 0.35)';
    ctx.fillRect(140, 11, 40, 1);

    // fog band at the base.
    ctx.fillStyle = 'rgba(159, 227, 255, 0.20)';
    ctx.fillRect(0, 40, 320, 8);
    ctx.fillStyle = 'rgba(220, 245, 255, 0.12)';
    ctx.fillRect(0, 43, 320, 5);

    this.addImage('mountain_horizon', canvas);
  }

  // ==========================================================
  // 7. COMBAT FX — slash arc + hit sparks + wisteria petal.
  // ==========================================================

  private makeSlashFx(): void {
    // cyan slash arc. 32x32.
    if (!this.textures.exists('nichirin_slash')) {
      const canvas = this.newCanvas(32, 32);
      const ctx = this.ctxOf(canvas);

      ctx.lineCap = 'round';

      // outer glow stroke.
      ctx.strokeStyle = '#7fe9ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(16, 16, 12, -0.75 * Math.PI, 0.25 * Math.PI);
      ctx.stroke();

      // inner white core stroke.
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(16, 16, 12, -0.7 * Math.PI, 0.2 * Math.PI);
      ctx.stroke();

      this.addImage('nichirin_slash', canvas);
    }

    // hit spark. 7x7, star-shaped. tiny but MIGHTY.
    if (!this.textures.exists('hit_spark')) {
      const canvas = this.newCanvas(7, 7);
      const ctx = this.ctxOf(canvas);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 0, 1, 7);
      ctx.fillRect(0, 3, 7, 1);

      // 4 small diagonal specks.
      ctx.fillStyle = '#9fe3ff';
      ctx.fillRect(2, 2, 1, 1);
      ctx.fillRect(4, 2, 1, 1);
      ctx.fillRect(2, 4, 1, 1);
      ctx.fillRect(4, 4, 1, 1);

      this.addImage('hit_spark', canvas);
    }

    // wisteria petal. 5x3. drifts during the "victory" moment.
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
}