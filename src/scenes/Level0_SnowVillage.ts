import Phaser from 'phaser';

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
 * TODO close: this whole "draw every tile as an individual sprite"
 * approach works but it's heavy. 15.8k sprites in the scene
 * graph at all times. A real tilemap layer (or a RenderTexture
 * baked once at boot) would be way faster. Leaving it as-is
 * until the level is actually done and I know what the final
 * layout looks like.
 * ----------------------------------------------------------- */


const TILE_SIZE = 16;
const MAP_WIDTH = 126;
const MAP_HEIGHT = 126;

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

export class Level0_SnowVillage extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private tileLayer!: Phaser.Tilemaps.TilemapLayer;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  // wasd is typed as any because Phaser's addKeys returns a dynamic
  // object keyed by the strings you passed in. There's a tighter type
  // available but it's more annoying to use than just leaving it any.
  private wasd!: any;

  private objectiveText!: Phaser.GameObjects.Text;
  // Tracks which objective the player is currently on. Only one right
  // now, will get used more once the shrine actually triggers something.
  private currentObjective: number = 0;

  constructor() {
    super('Level0_SnowVillage');
  }

  create(): void {
    // Set world bounds FIRST. If you forget this, the player falls off
    // the bottom of the map forever and you spend an hour debugging
    // nothing. Ask me how I know.
    this.physics.world.setBounds(
      0, 0,
      MAP_WIDTH * TILE_SIZE,
      MAP_HEIGHT * TILE_SIZE,
    );

    this.walls = this.physics.add.staticGroup();

    this.generateMassiveWorld();
    this.spawnVillagePopulation();


    // Spawn at the bottom of the path so the player has to walk north
    // to reach the shrine. Down-facing idle frame for a clean start.
    const spawnX = 63 * TILE_SIZE;
    const spawnY = 100 * TILE_SIZE;

    this.player = this.physics.add.sprite(spawnX, spawnY, 'ninja-dark-walk', 0);

    // Hitbox is 8x8 at the feet, not the full 16x16 frame. Otherwise
    // the top of the sprite clips into house roofs and torii crossbeams
    // and it looks wrong.
    this.player.setSize(8, 8).setOffset(4, 8);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.tileLayer);

    // Demo enemy. Just standing on the path so you can see it works.
    // Not stored as a class field yet because there's no AI or combat
    // system to hook it up to. Will get moved into a proper spawn
    // function once enemies exist.
    const red = this.physics.add.sprite(
      63 * TILE_SIZE,
      60 * TILE_SIZE,
      'ninja-red-walk',
      0,
    );
    red.setSize(8, 8).setOffset(4, 8);
    red.setDepth(red.y);
    red.anims.play('ninja-red-walk-down');
    this.physics.add.collider(red, this.walls);
    this.physics.add.collider(red, this.tileLayer);

    // Camera. 2x zoom because at 1x the 16px tiles are tiny. Lerp
    // of 0.1 on both axes so it trails the player slightly instead of
    // feeling stuck to them.
    this.cameras.main.setBounds(
      0, 0,
      MAP_WIDTH * TILE_SIZE,
      MAP_HEIGHT * TILE_SIZE,
    );
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);
    this.cameras.main.fadeIn(1000, 10, 25, 47);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D');

    this.createHUD();
    this.createAtmosphere();
  }

  update(): void {
    const speed = 800;
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
    this.player.setDepth(this.player.y);
  }

 private generateMassiveWorld(): void {
    // 1. Build the tile grid as plain numbers. Everything starts as
    // snow, then we paint the river / path / cliff over the top.
    // This is the same layout as before, just expressed as data
    // instead of ~15.8k individual Image game objects.
    const data: number[][] = [];
    for (let r = 0; r < MAP_HEIGHT; r++) {
      const row: number[] = [];
      for (let c = 0; c < MAP_WIDTH; c++) row.push(TILE.SNOW);
      data.push(row);
    }

    // 2. River. sin() gives it a natural curve without needing to
    // hand-author waypoints. Amplitude 3 and period 15 are both
    // eyeballed — if the river looks too wiggly just bump the 15 up.
    for (let r = 0; r < MAP_HEIGHT; r++) {
      const offset = Math.floor(Math.sin(r / 15) * 3);
      const start = 15 + offset;
      const end = 22 + offset;
      for (let c = start; c < end; c++) {
        data[r][c] = TILE.ICE;
      }
    }

    // 3. Main path down the middle. Kept clear of trees so the player
    // can actually get from spawn to shrine without getting stuck.
    for (let r = 10; r < MAP_HEIGHT - 5; r++) {
      for (let c = 60; c < 66; c++) {
        data[r][c] = TILE.PATH;
      }
    }

    // 4. Cliff / shrine plateau at the north end of the map.
    // Fully blocked off so the player has to enter through the torii.
    for (let r = 0; r < 20; r++) {
      for (let c = 40; c < 90; c++) {
         if (c > 58 && c < 68 && r > 10) continue; // Gap for stairs
        data[r][c] = TILE.CLIFF;
      }
    }

    // 5. The Bridge visual path data (Must happen BEFORE baking)
    for (let r = 53; r < 59; r++) {
      for (let c = 10; c < 35; c++) {
        data[r][c] = TILE.PATH;
      }
    }

    // 6. The Frozen Pond (Right side)
    const pondX = 90;
    const pondY = 50;
    const pondRadius = 12;
    for (let r = pondY - pondRadius; r < pondY + pondRadius; r++) {
      for (let c = pondX - pondRadius; c < pondX + pondRadius; c++) {
        if (Phaser.Math.Distance.Between(c, r, pondX, pondY) < pondRadius) {
          data[r][c] = TILE.ICE;
        }
      }
    }

    // Bake into a single tilemap layer. This is the perf fix for the
    // two Level0 TODOs: one GameObject instead of 15,876, and the
    // river/cliff collision is handled by setCollision below (which
    // the engine merges into shared rectangles) instead of ~1,130
    // individual physics zones.
    const map = this.make.tilemap({
      data,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });
    // Non-null asserted: BootScene.makeTiles() registers 'tiles' in
    // preload, so this is guaranteed to exist by the time Level0 runs.
    const tileset = map.addTilesetImage(
      'tiles', 'tiles', TILE_SIZE, TILE_SIZE, 0, 0,
    )!;
    this.tileLayer = map.createLayer(0, tileset, 0, 0)!;
    this.tileLayer.setDepth(0);
    // Cliff + ice are impassable. Everything else is walkable.
    this.tileLayer.setCollision([TILE.CLIFF, TILE.ICE]);

    // 7. Real shrine landmark at the north end of the path.
    this.addShrine(63, 10);

    // 6. Torii gates — one at the shrine entrance, one at the south
    // edge of the map. Decorative more than functional right now.
    this.addTorii(63, 115);
    this.addTorii(63, 22);
    // 7. Houses & Japanese Houses. Hardcoded positions for the village.
    // Large Japanese houses maths always win 
    this.addJapaneseHouse(50, 45);
    this.addJapaneseHouse(75, 45);
    this.addJapaneseHouse(50, 65);
    this.addJapaneseHouse(75, 65);
    this.addJapaneseHouse(50, 90);
    this.addJapaneseHouse(75, 90);
    this.addJapaneseHouse(45, 105);
    this.addJapaneseHouse(80, 105);

    // Small houses bro maths 
     this.addHouse(40, 35); // Left Top
     this.addHouse(85, 35); // Right Top
     this.addHouse(40, 75); // Left Mid
     this.addHouse(85, 75); // Right Mid;

    // 8. Rocks scattered around the village
    this.addRock(35, 55);
    this.addRock(80, 25);
    this.addRock(80, 95);
    this.addRock(35, 95);
    

    // 9. Trees. 400 random ones, but skip the path column so the
    // corridor stays walkable.  Fill borders with dense forest 
    // This time we also use the new 'snow-spike' asset occasionally.
    for (let i = 0; i < 400; i++) {
      const randC = Phaser.Math.Between(2, MAP_WIDTH - 2);
      const randR = Phaser.Math.Between(2, MAP_HEIGHT - 2);

    // ok, Don't place trees on paths, ice, or cliffs
      if (data[randR][randC] !== TILE.SNOW) continue;   // ai help me  thank ypu chat gpt  
      
    //ok now, I havemake village at center and don't place trees in the village area
      if (randC > 35 && randC < 95 && randR > 30 && randR < 100) continue;

      const x = randC * TILE_SIZE;
      const y = randR * TILE_SIZE;
      
      // 20% chance to use the snow-spike tree asset
      if (Phaser.Math.Between(0, 100) > 70) {
        const tree = this.walls.create(x, y, 'snow-spike').setDepth(y);
        tree.setSize(12, 12).setOffset(10, 20);
      } else {
        const tree = this.walls.create(x, y, 'snow_tree').setDepth(y);
        tree.setSize(12, 12).setOffset(10, 26);
      }
    }
  
    // 10. Lanterns lining the path
    for (let r = 30; r < 110; r += 10) {
      this.addLantern(58, r); // Left side of path
      this.addLantern(68, r); // Right side of path
    }

    // 11. The Bridge visual Image (Now outside the loop!)
    this.add.image(25 * TILE_SIZE, 56 * TILE_SIZE, 'bridge').setDepth(56 * TILE_SIZE);
  }
  // --- helpers --

  private addLantern(c: number, r: number): void {
    const x = c * TILE_SIZE + TILE_SIZE / 2;
    const y = r * TILE_SIZE + TILE_SIZE / 2;
    const lantern = this.walls.create(x, y, 'stone_lantern') as Phaser.Physics.Arcade.Sprite;
      lantern.setDepth(y);
      // 16x32 texture. Hitbox is 12x12 at the base so the player can walk behind the top.
      lantern.setSize(12, 12).setOffset(2, 10);
    }

  private addTorii(c: number, r: number): void {
    const x = c * TILE_SIZE + TILE_SIZE / 2;
    const y = r * TILE_SIZE + TILE_SIZE / 2;
    const gate = this.walls.create(x, y, 'torii_gate').setDepth(y);
    // Only the two pillars block movement, not the crossbeams or the
    // top lintel. Hitbox is 40 wide starting 4px in from the left,
    // and 10 tall positioned near the base of the sprite.
    gate.setSize(40, 10).setOffset(4, 34);
  }

  private addHouse(c: number, r: number): void {
    const x = c * TILE_SIZE + TILE_SIZE / 2;
    const y = r * TILE_SIZE + TILE_SIZE / 2;
    const house = this.walls.create(x, y, 'house') as Phaser.Physics.Arcade.Sprite;
    house.setDepth(y);
    // One hitbox for the whole building. 32x20 at the base — the roof
    // extends above the hitbox so the player can walk "behind" it.
  house.setSize(80, 30).setOffset(8, 60);  
  }

  private addJapaneseHouse(c: number, r: number): void {
    const x = c * TILE_SIZE + TILE_SIZE / 2;
    const y = r * TILE_SIZE + TILE_SIZE / 2;
    const house = this.walls.create(x, y, 'japanese_house') as Phaser.Physics.Arcade.Sprite;
    house.setDepth(y);
    // 64x64 texture. 52x24 hitbox at the base so the player walks behind the roof
    house.setSize(52, 24).setOffset(6, 36);
  }

  private addRock(c: number, r: number): void {
    const x = c * TILE_SIZE + TILE_SIZE / 2;
    const y = r * TILE_SIZE + TILE_SIZE / 2;
    const rock = this.walls.create(x, y, 'frost_rock') as Phaser.Physics.Arcade.Sprite;
    rock.setDepth(y);
    // 24x20 texture. 20x10 hitbox at the bottom
    rock.setSize(20, 10).setOffset(2, 10);
  }

  private addShrine(c: number, r: number): void {
    const x = c * TILE_SIZE + TILE_SIZE / 2;
    const y = r * TILE_SIZE + TILE_SIZE / 2;
    const shrine = this.walls.create(x, y, 'shrine') as Phaser.Physics.Arcade.Sprite;
    shrine.setDepth(y);
    // 48x56 texture. Base hitbox at the bottom.
    shrine.setSize(40, 16).setOffset(4, 40);
  }

  private createHUD(): void {
    // Fixed to the camera (scrollFactor 0) so it doesn't move with the
    // world. depth 1000 puts it above everything else in the scene.
    this.objectiveText = this.add.text(
      20, 20,
      'Objective: Reach the Shrine (Go North)',
      {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 },
      },
    ).setScrollFactor(0).setDepth(1000);
  }


  private createAtmosphere(): void {
    // 1. Falling Snow
    this.add.particles(0, -10, 'snow_flake', {
      x: { min: 0, max: this.scale.width }, // Use scale.width for full screen
      y: -10,
      lifespan: 4000,
      speedY: { min: 50, max: 100 },
      speedX: { min: -20, max: 20 },
      scale: { start: 0.5, end: 0.5 },
      quantity: 2,
      frequency: 50,
      blendMode: 'ADD',
    }).setScrollFactor(0).setDepth(999);

    // 2. Drifting Mist
    if (this.textures.exists('mist_cloud')) {
      this.add.particles(0, 0, 'mist_cloud', {
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
      }).setScrollFactor(0).setDepth(998);
    }
  }
  
  private spawnVillagePopulation(): void {
    // Spawn some villagers in the village
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * 10) + 10;
      const y = Math.floor(Math.random() * 10) + 10;
      this.add.image(x * TILE_SIZE, y * TILE_SIZE, 'villager').setDepth(y * TILE_SIZE);
    }
  }

}