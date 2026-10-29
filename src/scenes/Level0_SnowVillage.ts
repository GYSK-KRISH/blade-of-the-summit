import Phaser from 'phaser';
import { GameState } from '../systems/GameState';  
import { InteractionManager } from '../systems/InteractionManager';
import { GuideArrow } from '../systems/GuideArrow';

/* -----------------------------------------------------------
 *  Level0 — Snow Village
 *
 * The level layout is generated in code rather than stored as a
 * tilemap file. 126x126 tiles = 15,876 tiles, which is way too
 * many to place by hand. So the map is drawn procedurally:
 * everything starts as snow, then the river / path / cliff areas
 * get painted on top.
 *
 * Player is NinjaDark from the asset pack. Walk anims are
 * registered in BootScene, so this file just plays them and
 * handles flipX for left/right (the pack doesn't ship a true
 * side-profile walk, so we mirror the down-facing frames —
 * details in BootScene.makeAnimations).
 * 
 * 
 * 
 * TODO : list at 149 work on dialogue system 
 * ----------------------------------------------------------- */


const TILE_SIZE = 16;
const MAP_WIDTH = 126;
const MAP_HEIGHT = 126;
const ROAD_X = 58; 
const NPC_SPEED = 30;
const PLAYER_SPEED = 800;

// Frame indices into the procedural 'tiles' spritesheet.
// Order matches the order they were drawn in BootScene.makeTiles().
// If you reorder one, reorder the other — they're coupled.
const TILE = {
  SNOW: 0,
  PATH: 1,
  CLIFF: 2,
  WIND: 3,
  ICE: 4,
  FOREST: 5,
} as const;


interface PropOpts {
  scale?: number;
  bw: number;   // blocker WIDTH  
  bh: number;   // blocker HEIGHT 
  by: number;   // blocker bottom 
}

interface NpcZone { cx: number; cy: number; r: number; n: number; }

interface Area { name: string; cx: number; cy: number; r: number; }


export class Level0_SnowVillage extends Phaser.Scene {
  // party members
  private player!: Phaser.Physics.Arcade.Sprite;     
  private walls!: Phaser.Physics.Arcade.StaticGroup; 
  private solids: Phaser.GameObjects.Zone[] = [];    
  private tileLayer!: Phaser.Tilemaps.TilemapLayer;  
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: any;
  private gs!: GameState;                            

  // world state
  private grid: number[][] = [];
  private riverMask: boolean[][] = [];       // river canon tracking
  private reserved = new Set<string>();      // claimed tiles 
  private bridges: Array<{ r: number; c: number }> = [];
  private chimneys: Array<{ x: number; y: number }> = [];
  private npcs: Phaser.Physics.Arcade.Sprite[] = [];

  // gojo's six eyes = seeded RNG 
  private rng = new Phaser.Math.RandomDataGenerator(['frostveil']);

  // HUD
  private objectiveText!: Phaser.GameObjects.Text;
  private locationText!: Phaser.GameObjects.Text;


  // class fields
  private interactions!: InteractionManager;
  private guide!: GuideArrow;

  //area names for the HUD label
  private readonly areas: Area[] = [
    { name: 'North Gate',            cx: 58, cy: 10,  r: 7  },
    { name: 'Residential District',  cx: 58, cy: 25,  r: 20 },
    { name: 'Market Square',         cx: 58, cy: 46,  r: 11 },
    { name: 'Smithy',                cx: 86, cy: 46,  r: 8  },
    { name: 'Bakery',                cx: 31, cy: 46,  r: 7  },
    { name: 'Stable',                cx: 96, cy: 57,  r: 7  },
    { name: 'Shrine Area',           cx: 58, cy: 72,  r: 10 },
    { name: 'Training Dojo',         cx: 30, cy: 72,  r: 8  },
    { name: 'Inn',                   cx: 92, cy: 74,  r: 8  },
    { name: "Elder's House",         cx: 66, cy: 92,  r: 8  },
    { name: 'Frozen Lake District',  cx: 30, cy: 106, r: 20 },
    { name: 'South Exit',            cx: 58, cy: 120, r: 7  },
  ];

  constructor() {
    super('Level0_SnowVillage');
  }

  create(): void {
    this.gs = GameState.fromRegistry(this);
  
    //1.bounds
    // Set world bounds FIRST. If you forget this, the player falls off
    // the bottom of the map forever and you spend an hour debugging
    // nothing. Ask me how I know.
    this.physics.world.setBounds(
      0, 0,
      MAP_WIDTH * TILE_SIZE,
      MAP_HEIGHT * TILE_SIZE,
    );

    //2.wall group
    this.walls = this.physics.add.staticGroup();

    // 3. world building
    this.makeExtraTextures();      // sprites on-the-fly 
    this.buildGround();            // bake tilemap into 1 layer
    this.buildBackdrop();          // mountain panorama for the north
    this.buildVillage();           // houses, shrines, stalls, bridges
    this.buildForest();            // 750 trees, seeded 
    this.buildRiverBlockers();     // river = domain barriers
    //this.spawnVillagePopulation(); // spawn the village population


    //4.charater
    // Spawn at the bottom of the path so the player has to walk north
    // to reach the shrine. Down-facing idle frame for a clean start.
    
    const spawnX =  ROAD_X * TILE_SIZE;
    const spawnY = 100 * TILE_SIZE;

    this.player = this.physics.add.sprite(spawnX, spawnY, 'ninja-dark-walk', 0);

    // Hitbox is 8x8 at the feet, not the full 16x16 frame. Otherwise
    // the top of the sprite clips into house roofs and torii crossbeams
    // and it looks wrong.
    this.player.setSize(8, 8).setOffset(4, 8);
    this.player.setCollideWorldBounds(true);
    this.addCollisions(this.player);

    

    // 5. demo enemy
    // Demo enemy. Just standing on the path so you can see it works.
    // Not stored as a class field yet because there's no AI or combat
    // system to hook it up to. Will get moved into a proper spawn
    // function once enemies exist.
    const red = this.physics.add.sprite(
      ROAD_X  * TILE_SIZE,
      60 * TILE_SIZE,
      'ninja-red-walk',
      0,
    );
    red.setSize(8, 8).setOffset(4, 8);
    red.setDepth(red.y);
    red.anims.play('ninja-red-walk-down');
    this.addCollisions(red); 

     // 6. NPCs
    this.spawnNPCs();
  
    
    // 7.CAMERA
    // Camera. 2x zoom because at 1x the 16px tiles are tiny. Lerp
    // of 0.1 on both axes so it trails the player slightly instead of
    // feeling stuck to them.
  
    this.cameras.main.setBounds(
      0, 0,
      MAP_WIDTH * TILE_SIZE,
      MAP_HEIGHT * TILE_SIZE,
    );
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);                 // 16px tiles too tiny at 1x
    this.cameras.main.fadeIn(1000, 10, 25, 47);   // cold blue entry

    // 8.INPUT
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D');

    // 9.HUD + vibes
    this.createHUD();
    this.createAtmosphere();
    this.createChimneySmoke();

   // 10. interaction + guide 
    this.interactions = new InteractionManager(
        this,
        () => this.player,
        () => false,   // TODO tomorrow: () => this.dialogue.isOpen()
    );
    this.guide = new GuideArrow(this, this.gs, () => this.player);

  }


  update(): void {
    const speed = PLAYER_SPEED;
    this.player.setVelocity(0);

    // else-if chain rather than separate checks. If you check X and Y
    // independently the player moves at 1.41x speed on diagonals
    // (sqrt(2)), which is the classic "why does my character feel
    // faster going up-right" bug.
    //
    // setFlipX handles left/right because row 2 of the walk sheet is
    // the same as row 0 (both face down). Flipping is the only way to
    // get a distinct left/right look with these assets.
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      this.player.anims.play('ninja-dark-walk-side', true);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      this.player.anims.play('ninja-dark-walk-side', true);
    } else if (this.cursors.up.isDown || this.wasd.W.isDown) {
      this.player.setVelocityY(-speed);
      this.player.setFlipX(false);
      this.player.anims.play('ninja-dark-walk-up', true);
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      this.player.setVelocityY(speed);
      this.player.setFlipX(false);
      this.player.anims.play('ninja-dark-walk-down', true);
    } else {
      
      // Not moving. Freeze on frame 0 and reset flip so the idle frame
      // isn't backwards. Not using the ninja-dark-idle-anim yet because
      // the idle frames are subtle enough that stopping on frame 0 reads
      // fine — will switch to the idle anim once combat is in and the
      // player spends more time standing still.
      this.player.anims.stop();
      this.player.setFrame(0);
      this.player.setFlipX(false);
    }

    // Depth sort by Y position so things lower on screen draw on top.
    // Means the player walks behind trees when they're above them and
    // in front when below. Standard top-down trick.
    // walk behind tall stuff 
    this.player.setDepth(this.player.y + 4);
    for (const npc of this.npcs) npc.setDepth(npc.y + 4);
    this.updateLocationLabel();
    this.interactions?.update();
    this.guide?.update();

  }
    
   // _________________________________________________________
   //  GROUND — bake the whole map in ONE call
   // _________________________________________________________
  
  // paint a rectangle of tiles
  private paint(c0: number, r0: number, c1: number, r1: number, tile: number): void {
    for (let r = Math.max(0, r0); r < Math.min(MAP_HEIGHT, r1); r++) {
      for (let c = Math.max(0, c0); c < Math.min(MAP_WIDTH, c1); c++) {
        this.grid[r][c] = tile;
      }
    }
  }

  // paint an ellipse of tiles (fountain, lake, plazas)
  private disc(cx: number, cy: number, rx: number, ry: number, tile: number): void {
    for (let r = Math.floor(cy - ry); r <= Math.ceil(cy + ry); r++) {
      for (let c = Math.floor(cx - rx); c <= Math.ceil(cx + rx); c++) {
        if (r < 0 || c < 0 || r >= MAP_HEIGHT || c >= MAP_WIDTH) continue;
        if (((c - cx) / rx) ** 2 + ((r - cy) / ry) ** 2 <= 1) this.grid[r][c] = tile;
      }
    }
  }

  // normalized distance from village centre (ellipse)
  private ringNorm(c: number, r: number): number {
    return ((c - 56) / 54) ** 2 + ((r - 66) / 62) ** 2;
  }

  
  //_____________________________________________________
  // map data -> tilemap layer
  //______________________________________________________


  private buildGround(): void {

    // SNOW 
    for (let y = 0; y < MAP_HEIGHT; y++) {
      this.grid.push(new Array(MAP_WIDTH).fill(TILE.SNOW));
      this.riverMask.push(new Array(MAP_WIDTH).fill(false));
    }

    // 1.mountain cilff 
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const wobble = 0.05 * Math.sin(x / 4) + 0.05 * Math.cos(y / 5);
        const north  = y < 11 + Math.round(Math.sin(x / 6) * 1.5);
        if (this.ringNorm(x, y) > 1 + wobble || north) this.grid[y][x] = TILE.CLIFF;
      }
    }

    // 2.river west side
    const riverX = (y: number) => 18 + Math.round(3 * Math.sin(y / 9));
    for (let y = 34; y <= 97; y++) {
      const a = riverX(y);
      for (let x = a - 2; x <= a + 2; x++) {
        this.grid[y][x]       = TILE.ICE;
        this.riverMask[y][x]  = true;
      }
    }

    // 3,frozenlake east side
    this.disc(30, 108, 20, 11, TILE.ICE);

    // 4.road
    this.paint(ROAD_X - 3, 0, ROAD_X + 3, MAP_HEIGHT, TILE.PATH);
    this.paint(10, 22, 98, 25, TILE.PATH);  
    this.paint(26, 37, 90, 39, TILE.PATH);  
    this.paint(10, 51, 100, 54, TILE.PATH);  
    this.paint(10, 76, 98, 79, TILE.PATH);   
    this.paint(30, 98, 56, 101, TILE.PATH);  
    this.paint(28, 96, 33, 114, TILE.PATH); 
    this.paint(25, 112, 36, 116, TILE.PATH); 

    // 5.bridges 
    for (const r of [52, 77]) {
      this.bridges.push({ r, c: riverX(r) });
    }

    // 6.plaza
    this.disc(ROAD_X, 46, 10, 10, TILE.PATH);   // market square
    this.disc(ROAD_X, 46, 4, 4, TILE.WIND);     // fountain ring
    this.disc(ROAD_X, 72, 9, 9, TILE.WIND);     // shrine plaza
    this.disc(ROAD_X, 72, 3, 3, TILE.FOREST);   // shade under sacred tree

    
    const map = this.make.tilemap({
      data: this.grid,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE_SIZE, TILE_SIZE, 0, 0)!;
    this.tileLayer = map.createLayer(0, tileset, 0, 0)!;
    this.tileLayer.setDepth(0);
    // 7.River zones 
    this.tileLayer.setCollision([TILE.CLIFF]);
  }

  // 8.mountain
  private buildBackdrop(): void {
    if (!this.textures.exists('mountain_horizon')) return;
    this.add
      .image(0, 0, 'mountain_horizon')
      .setOrigin(0, 0)
      .setDisplaySize(MAP_WIDTH * TILE_SIZE, 11 * TILE_SIZE)
      .setDepth(1);
  }

  // 9.river blockers
  private buildRiverBlockers(): void {
    for (let r = 0; r < MAP_HEIGHT; r++) {
      let start = -1;
      for (let c = 0; c <= MAP_WIDTH; c++) {
        const blocked =
          c < MAP_WIDTH && this.riverMask[r][c] && this.grid[r][c] === TILE.ICE;
        if (blocked && start < 0) start = c;
        if (!blocked && start >= 0) {
          this.addBlocker(
            ((start + c) / 2) * TILE_SIZE,
            (r + 0.5) * TILE_SIZE,
            (c - start) * TILE_SIZE,
            TILE_SIZE,
          );
          start = -1;
        }
      }
    }
  }

  //______________________________________________________
  //  VILLAGE
  //______________________________________________________

    private buildVillage(): void {

    //1.north wall maria
    this.addGate(ROAD_X, 9);
    this.addProp('watchtower', 38, 8, { bw: 32, bh: 14, by: 2 });
    this.addProp('watchtower', 80, 8, { bw: 32, bh: 14, by: 2 });

    //2.village residential houses
    const houses: Array<[number, number]> = [
      [32, 17], [40, 17], [48, 17],  // H1-H3
      [68, 17], [77, 17],            // H4-H5
      [36, 31], [82, 31],            // H6, H7
      [96, 36], [22, 62],            // extras
    ];
    for (const [x , y] of houses) this.addHouse(x, y);

    //3.maeket
    this.addProp('fountain', ROAD_X, 46, { bw: 36, bh: 18, by: 3 });
    const stallAngles = [30, 90, 150, 210, 270, 330];
    for (const deg of stallAngles) {
      const a = Phaser.Math.DegToRad(deg);
      this.addProp(
        'stall',
        ROAD_X + Math.cos(a) * 7.5,
        46 + Math.sin(a) * 7.5,
        { bw: 24, bh: 10, by: 3 },
      );
    }
    this.addProp('questboard', 66, 50, { bw: 18, bh: 8, by: 2 });

    // 4.houses around market 
    this.addJapaneseHouse(31, 46);
    this.addJapaneseHouse(86, 45);
    this.addJapaneseHouse(96, 57);
    // forge glow from village entrance warm ahh light)
    this.lights.enable().setAmbientColor(0x101820);
    this.lights.addLight(86 * TILE_SIZE,47 * TILE_SIZE, 90,0xff8a3d,0.35,);

    //5.shrine area (torii gates , sacred tree , memorial)
    this.addGate(ROAD_X, 63, 1.4);
    this.addGate(ROAD_X, 80, 1.4);
    
    const tree = this.addProp('wisteria_tree', ROAD_X, 71, {
      scale: 2, bw: 10, bh: 8, by: 2,
    });
    tree.setTint(0xbfe9ff);
    this.lights.addLight(ROAD_X * TILE_SIZE, 70 * TILE_SIZE,110, 0x7fe9ff, 0.3,);
    this.addProp('shrine', 70, 69, { bw: 40, bh: 16, by: 0 });
    for (const [x, y] of [[52, 66], [64, 66], [52, 76], [64, 76]]) {
      this.addProp('stone_lantern', x, y, { bw: 8, bh: 8, by: 2 });
    }

    // 6.sparring arc
    this.addJapaneseHouse(30, 71);
    for (const [x, y] of [[39, 73], [42, 75], [45, 73]]) {
      this.addProp('dummy', x, y, { bw: 10, bh: 8, by: 3 });
    }
    //7.elders house
    this.addJapaneseHouse(68, 92);
    this.addJapaneseHouse(92, 72);
    this.addProp('stone_lantern', 63, 93, { bw: 8, bh: 8, by: 2 });
    this.addProp('stone_lantern', 63, 90, { bw: 8, bh: 8, by: 2 });

    //8.fronzen lake
    for (const [x, y] of [[14, 106], [20, 112], [44, 105]]) {
      this.addProp('fishing_hut', x, y, { bw: 24, bh: 10, by: 2 });
    }

    //9.exit gate
      this.addGate(ROAD_X, 119);

    //10.bridges
    for (const b of this.bridges) {

    // bridge texture is N-S rotate 90 and stretch to span 5 tiles
      this.add
        .image((b.c + 0.5) * TILE_SIZE, (b.r + 0.5) * TILE_SIZE, 'bridge')
        .setAngle(90)
        .setScale(0.6, 1.3)
        .setDepth(1);
    }

   // 11. stone lanterns with point lights
    for (let r = 28; r <= 110; r += 8) {
    if ((r > 34 && r < 58) || (r > 62 && r < 82)) continue;
    this.addProp('stone_lantern', ROAD_X - 4.5, r, { bw: 8, bh: 8, by: 2 });
    this.addProp('stone_lantern', ROAD_X + 4.5, r, { bw: 8, bh: 8, by: 2 });

    this.lights.addLight(
      (ROAD_X - 4.5) * TILE_SIZE, r * TILE_SIZE - 8,36,0xffd27a,0.16,);
    this.lights.addLight(
      (ROAD_X + 4.5) * TILE_SIZE, r * TILE_SIZE - 8,36,0xffd27a,0.16,);
    }

    // 12.rock
    for (const [x, y] of [[28, 30], [90, 28], [96, 90], [24, 92], [74, 60], [44, 62]]) {
      this.addProp('frost_rock', x, y, { bw: 20, bh: 10, by: 0 });
    }
  }

  
    // 13. Trees. 2200 attempts max, 750 placements max, but skip the path column so the
    // corridor stays walkable.  Fill borders with dense forest 
    // This time we also use the new 'snow-spike' asset occasionally.
    // keep trees off the ice and plazas and use a density curve to make
    // them sparse in the village centre and dense on the outskirts.
    private nearTile(x: number, y: number, tile: number, d: number): boolean {
    for (let rr = y - d; rr <= y + d; rr++) {
      for (let cc = x - d; cc <= x + d; cc++) {
        if (rr < 0 || cc < 0 || rr >= MAP_HEIGHT || cc >= MAP_WIDTH) continue;
        if (this.grid[rr][cc] === tile) return true;
      }
    }
    return false;
  }

  private buildForest(): void {
    let placed = 0;
    for (let i = 0; i < 2200 && placed < 750; i++) {
      const x = this.rng.between(2, MAP_WIDTH - 3);
      const y = this.rng.between(2, MAP_HEIGHT - 3);
      const norm = this.ringNorm(x, y);

      if (this.grid[y][x] !== TILE.SNOW) continue;   
      if (this.reserved.has(`${y},${x}`)) continue;  
      if (this.nearTile(x, y,TILE.PATH, 2)) continue; // keep roads clear
      if (this.nearTile(x, y, TILE.ICE, 1)) continue;  
      if (this.nearTile(x, y, TILE.WIND, 1)) continue; 

      // density 100% outside ring, 35% mid, 8% inside village
      const keep = norm > 0.8 ? 1 : norm > 0.55 ? 0.35 : 0.08;
      if (this.rng.frac() > keep) continue;

      const a = x * TILE_SIZE + TILE_SIZE / 2;
      const b = y * TILE_SIZE + TILE_SIZE / 2;
      if (this.rng.between(0, 100) > 70) {
        // 30% spike trees
        const t = this.walls.create(a, b, 'snow-spike').setDepth(b);
        t.setSize(12, 12).setOffset(10, 20);
      } else {
        const t = this.walls.create(a, b, 'snow_tree').setDepth(b);
        t.setSize(12, 12).setOffset(10, 26);
      }
      placed++;
    }
  }


  //___________________________________________________________
  //  ---HELPER FUNCTIONS---
  //____________________________________________________________

  // no trees spawn around for houses, shrines, bridges, etc
  private reserve(cx: number, cy: number, rad: number): void {
    for (let y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++) {
      for (let x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++) {
        this.reserved.add(`${y},${x}`);
      }
    }
  }

  // invisible 
  private addBlocker(x: number, y: number, w: number, h: number): void {
    const z = this.add.zone(x, y, w, h);
    this.physics.add.existing(z, true);
    this.solids.push(z);
  }

  // we can move behind roofs
  private addProp(key: string, cx: number, cy: number, o: PropOpts): Phaser.GameObjects.Image {
    const s = o.scale ?? 1;
    const x = cx * TILE_SIZE;
    const y = cy * TILE_SIZE;
    const img = this.add.image(x, y, key).setScale(s);
    const bottom = y + img.displayHeight / 2;
    const blockerBottom = bottom - o.by * s;
    img.setDepth(blockerBottom); 
    this.addBlocker(x, blockerBottom - (o.bh * s) / 2, o.bw * s, o.bh * s);
    const rad = Math.max(2, Math.max(img.displayWidth, img.displayHeight) / TILE_SIZE / 2 + 1,);
this.reserve(cx, cy, rad);
    return img;
  }

  // smoke particles moveup and sanp 
    private addHouse(x: number, y: number): void {
    const img = this.addProp('house', x, y, { bw: 80, bh: 30, by: 6 });
    this.chimneys.push({ x: img.x + 21, y: img.y - 32 });
  }


  private addJapaneseHouse(x: number, y: number): void {
    this.addProp('japanese_house', x, y, { bw: 52, bh: 24, by: 4 });
  }

  // torii gate with blockers side so you can't walk
  private addGate(x: number, y: number, scale = 2): void {
    const a = x * TILE_SIZE;
    const b = y * TILE_SIZE;
    const gate = this.add.image(a, b, 'torii_gate').setScale(scale);
    gate.setDepth(b + gate.displayHeight / 2);
    for (const side of [-1, 1]) {
      this.addBlocker(
        a + side * 12 * scale,
        b + 15 * scale,
        4 * scale,
        8 * scale,
      );
    }
    this.reserve(x, y, 5); 
  }

  // one helper three colliders
  private addCollisions(obj: Phaser.Physics.Arcade.Sprite): void {
    this.physics.add.collider(obj, this.walls);
    this.physics.add.collider(obj, this.solids);
    this.physics.add.collider(obj, this.tileLayer);
  }


  //_________________________________________________________________
  //  NPC
  //_________________________________________________________________


  private spawnNPCs(): void {
    // bail if samurai texture missing (defensive, no crash)
    if (!this.textures.exists('samurai-walk')) return;

    const zones: NpcZone[] = [
      { cx: ROAD_X, cy: 28, r: 10, n: 8 }, // north
      { cx: ROAD_X, cy: 88, r: 10, n: 7 }, // south
      { cx: ROAD_X, cy: 46, r: 9,  n: 9 }, 
      { cx: 92,     cy: 75, r: 6,  n: 5 }, 
      { cx: 32,     cy: 75, r: 6,  n: 4 }, 
    ];

    // cute pastel tints
    const tints = [0xffffff, 0xffd9d9, 0xd9e8ff, 0xe6ffd9, 0xfff0c9];

    for (const z of zones) {
      for (let i = 0; i < z.n; i++) {
        // up to 12 times to find a walkable tile in the zone
        let x = z.cx, y = z.cy;
        for (let tries = 0; tries < 12; tries++) {
          x = Math.round(z.cx + this.rng.between(-z.r, z.r));
          y = Math.round(z.cy + this.rng.between(-z.r, z.r));
          const t = this.grid[y]?.[x];
          if (t === TILE.PATH || t === TILE.WIND || t === TILE.SNOW) break;
        }

        const npc = this.physics.add.sprite(
          x * TILE_SIZE + 8,
          y * TILE_SIZE + 8,
          'samurai-walk',
          0,
        );
        npc.setSize(8, 8).setOffset(4, 8);
        npc.setTint(this.rng.pick(tints));  
        this.addCollisions(npc);
        this.npcs.push(npc);

        // wander loop
        this.time.addEvent({
          delay: this.rng.between(1200, 2800),
          loop: true,
          callback: () => this.wander(npc, z),
        });
      }
    }
  }

  // NPC wander just vibes
  private wander(npc: Phaser.Physics.Arcade.Sprite, z: NpcZone): void {
    const homeX = z.cx * TILE_SIZE;
    const homeY = z.cy * TILE_SIZE;
    let vx = 0;
    let vy = 0;

    // too far from home? walk back (one axis at a time)
    if (Phaser.Math.Distance.Between(npc.x, npc.y, homeX, homeY) > z.r * TILE_SIZE) {
      if (Math.abs(homeX - npc.x) > Math.abs(homeY - npc.y)) vx = Math.sign(homeX - npc.x);
      else vy = Math.sign(homeY - npc.y);
    } else {
      // random direction or stand and chat
      switch (this.rng.between(0, 4)) {
        case 1: vx = -1; break;
        case 2: vx =  1; break;
        case 3: vy = -1; break;
        case 4: vy =  1; break;
        default: break; // 20% chance stand
      }
    }

    npc.setVelocity(vx * NPC_SPEED, vy * NPC_SPEED);

    // not moving? freeze
    if (vx === 0 && vy === 0) {
      npc.anims.stop();
      npc.setFrame(0);
      return;
    }
    // pick animation (guard: anim may not exist)
    const key = vx !== 0 ? 'samurai-walk-side' : vy < 0 ? 'samurai-walk-up' : 'samurai-walk-down';
    npc.setFlipX(vx < 0);
    if (this.anims.exists(key)) npc.anims.play(key, true);
  }

  //______________________________________________________
  //  HUD + ATMOSPHERE — the vibes layer
  //______________________________________________________ 

  private createHUD(): void {
    // objective text 
    this.objectiveText = this.add
      .text(20, 20, "Objective: Find the Elder's House (Go North)", {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 },
      })
      .setScrollFactor(0)
      .setDepth(1000);

    //
    this.locationText = this.add
      .text(20, 60, '', {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#bfe9ff',
        backgroundColor: '#0a192f',
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(1000);
  }

  // update the location label based on player position and area definitions
  private updateLocationLabel(): void {
    const px = this.player.x / TILE_SIZE;
    const py = this.player.y / TILE_SIZE;
    let best = 'Frostveil Village';
    let bestD = Infinity;
    for (const a of this.areas) {
      const d = Phaser.Math.Distance.Between(px, py, a.cx, a.cy);
      if (d <= a.r && d < bestD) {
        best  = a.name;
        bestD = d;
      }
    }
    if (this.locationText.text !== best) this.locationText.setText(best);
  }

  // winter atmosphere
  private createAtmosphere(): void {
    // 1.falling snow
    this.add
      .particles(0, -10, 'snow_flake', {
        x: { min: 0, max: this.scale.width },
        y: -10,
        lifespan: 4000,
        speedY: { min: 50, max: 100 },
        speedX: { min: -20, max: 20 },
        scale: { start: 0.5, end: 0.5 },
        quantity: 2,
        frequency: 50,
        blendMode: 'ADD',
      })
      .setScrollFactor(0)
      .setDepth(999);

    //2. mist
    if (this.textures.exists('mist_cloud')) {
      this.add
        .particles(0, 0, 'mist_cloud', {
          x: { min: -200, max: this.scale.width },
          y: { min: 0, max: this.scale.height },
          lifespan: 12000,
          speedX: { min: 10, max: 25 },
          speedY: { min: -5, max: 5 },
          alpha: { start: 0, end: 0.15, ease: 'Linear' },
          scale: { start: 1, end: 1.5 },
          quantity: 1,
          frequency: 2000,
          blendMode: 'ADD',
        })
        .setScrollFactor(0)
        .setDepth(998);
    }
  }


  //________________________________________________
  //  TEXTURES (no assets needeed for now )
  //________________________________________________

  private makeTex(
    key: string,
    w: number,
    h: number,
    draw: (g: Phaser.GameObjects.Graphics) => void,
  ): void {
    if (this.textures.exists(key)) return;  
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private makeExtraTextures(): void {
    // market centre piece anime fountain )
    this.makeTex('fountain', 48, 40, (g) => {
      // shadow
      g.fillStyle(0x142030, 0.35).fillRect(4, 35, 40, 4);  
      // stone 
      g.fillStyle(0x6b7f96).fillRect(4, 14, 40, 22);        
      g.fillStyle(0x415a77).fillRect(4, 30, 40, 6); 
      // water
      g.fillStyle(0x56abdf).fillRect(8, 18, 32, 11);         
      // shine
      g.fillStyle(0x8fd8f5).fillRect(10, 20, 10, 2);        
      // snow cap
      g.fillStyle(0xf4fcff).fillRect(4, 14, 40, 3);       
      // pillar
      g.fillStyle(0x6b7f96).fillRect(21, 4, 6, 16);         
      // top plate
      g.fillStyle(0xc9f2ff).fillRect(18, 2, 12, 3);        
    });

    //striped awning
    this.makeTex('stall', 32, 32, (g) => {
      g.fillStyle(0x142030, 0.35).fillRect(2, 28, 28, 3);
      g.fillStyle(0x4e342e).fillRect(3, 12, 2, 17).fillRect(27, 12, 2, 17);
      g.fillStyle(0x7a5544).fillRect(3, 20, 26, 8);
      g.fillStyle(0x2b1c13).fillRect(3, 20, 26, 1);
      // candy stripes
      for (let i = 0; i < 6; i++) {
        g.fillStyle(i % 2 === 0 ? 0xb3242c : 0xf2e8d5).fillRect(2 + i * 5, 6, 5, 8);
      }
      g.fillStyle(0xf4fcff).fillRect(2, 4, 28, 3);
    });

    // wall-maria guard post
    this.makeTex('watchtower', 48, 80, (g) => {
      g.fillStyle(0x142030, 0.4).fillRect(6, 76, 36, 4);
      g.fillStyle(0x2b3a4a).fillRect(10, 40, 28, 38);
      g.fillStyle(0x415a77).fillRect(10, 40, 4, 38);
      g.fillStyle(0xf4fcff).fillRect(10, 40, 28, 3);
      g.fillStyle(0x4e342e).fillRect(6, 28, 36, 14);
      g.fillStyle(0x2b1c13).fillRect(6, 38, 36, 4);  
      // lit window
      g.fillStyle(0xffcc76).fillRect(19, 48, 10, 12);      
      g.fillStyle(0x2b1c13).fillRect(23, 48, 2, 12);
      // roof
      g.fillStyle(0x283b50).fillTriangle(0, 30, 24, 4, 48, 30);    
      // snow
      g.fillStyle(0xf4fcff).fillTriangle(7, 26, 24, 8, 41, 26);  
      g.fillStyle(0x283b50).fillTriangle(12, 26, 24, 12, 36, 26);
    });

    // side quests go here
    this.makeTex('questboard', 24, 28, (g) => {
      g.fillStyle(0x142030, 0.35).fillRect(2, 25, 20, 3);
      g.fillStyle(0x4e342e).fillRect(3, 10, 3, 16).fillRect(18, 10, 3, 16);
      g.fillStyle(0x7a5544).fillRect(2, 2, 20, 14);
      g.fillStyle(0x2b1c13).fillRect(2, 2, 20, 1).fillRect(2, 15, 20, 1);
      g.fillStyle(0xf2e8d5).fillRect(5, 5, 6, 5).fillRect(13, 6, 6, 6); 
      g.fillStyle(0xf4fcff).fillRect(1, 0, 22, 3);
    });

    // frozen lake chill spot
    this.makeTex('fishing_hut', 32, 32, (g) => {
      g.fillStyle(0x142030, 0.35).fillRect(3, 29, 26, 3);
      g.fillStyle(0x4e342e).fillRect(4, 14, 24, 16);
      // door
      g.fillStyle(0x2b1c13).fillRect(13, 20, 6, 10);
      // window         
      g.fillStyle(0xffcc76).fillRect(6, 19, 5, 5); 
       // roof          
      g.fillStyle(0x2c3e50).fillTriangle(0, 16, 16, 2, 32, 16); 
       // snow
      g.fillStyle(0xf4fcff).fillTriangle(3, 14, 16, 4, 29, 14); 
    });
  }

   // chimney smoke on every house 
  private createChimneySmoke(): void {
    for (const ch of this.chimneys) {
      this.add
        .particles(ch.x, ch.y, 'snow_flake', {
          lifespan: 2600,
          speedY: { min: -26, max: -16 },
          speedX: { min: 4, max: 14 },
          alpha: { start: 0.55, end: 0 },
          scale: { start: 1, end: 3.5 },
          tint: 0xd5dde6,
          frequency: 380,
          quantity: 1,
        })
        .setDepth(5000);
    }
  }
}