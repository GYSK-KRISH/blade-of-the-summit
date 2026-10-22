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
    const speed = 150;
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
    // 1. Fill the whole map with snow first, then paint everything
    // else on top of it. Way simpler than trying to only draw snow
    // where it's needed.
    for (let r = 0; r < MAP_HEIGHT; r++) {
      for (let c = 0; c < MAP_WIDTH; c++) {
        this.drawTile(c, r, TILE.SNOW, 0);
      }
    }

    // 2. River. sin() gives it a natural curve without needing to
    // hand-author waypoints. Amplitude 3 and period 15 are both
    // eyeballed — if the river looks too wiggly just bump the 15 up.
    for (let r = 0; r < MAP_HEIGHT; r++) {
      const offset = Math.floor(Math.sin(r / 15) * 3);
      const start = 15 + offset;
      const end = 22 + offset;
      for (let c = start; c < end; c++) {
        this.drawTile(c, r, TILE.ICE, 1);
        // No swimming in this game. Every ice tile gets a hitbox.
        // TODO: this creates ~880 static bodies just for the river.
        // Should really be 3 or 4 big rectangle zones instead. Not
        // hurting perf yet, but it will when there's more in the map.
        this.addHitbox(c, r);
      }
    }

    // 3. Main path down the middle. Kept clear of trees so the player
    // can actually get from spawn to shrine without getting stuck.
    for (let r = 10; r < MAP_HEIGHT - 5; r++) {
      for (let c = 60; c < 66; c++) {
        this.drawTile(c, r, TILE.PATH, 0);
      }
    }

    // 4. Cliff / shrine plateau at the north end of the map.
    // Fully blocked off so the player has to enter through the torii.
    for (let r = 5; r < 15; r++) {
      for (let c = 50; c < 75; c++) {
        this.drawTile(c, r, TILE.CLIFF, 1);
        this.addHitbox(c, r);
      }
    }
    // Placeholder shrine marker for now. Was originally trying to
    // spawn a 'shrine' texture that doesn't exist, so this just drops
    // an extra torii down as a landmark. Real shrine comes later.
    this.addTorii(63, 16);

    // 5. Torii gates — one at the shrine entrance, one at the south
    // edge of the map. Decorative more than functional right now.
    this.addTorii(63, 18);
    this.addTorii(63, 110);

    // 6. Houses. Hardcoded positions because there are only four and
    // a proper prefab system is overkill for a level that might change
    // layout next week.
    this.addHouse(45, 40);
    this.addHouse(80, 40);
    this.addHouse(40, 45);
    this.addHouse(85, 45);
    this.addHouse(40, 55);
    this.addHouse(55, 75);
    this.addHouse(10, 85);
    this.addHouse(20, 55);
    

    // 7. Trees. 300 random ones, but skip the path column so the
    // corridor stays walkable. 
    // check is a lazy band around the path (60-65) with a bit of
    // buffer on each side so trees don't spawn right on the edge.
    //
    // This is not great — a tree can still land on top of a house
    // or the torii. Hasn't been noticeable yet because there's enough
    // open space, but worth checking if the map gets denser.
    for (let i = 0; i < 300; i++) {
      const randC = Phaser.Math.Between(5, MAP_WIDTH - 5);
      const randR = Phaser.Math.Between(5, MAP_HEIGHT - 5);
      if (randC > 55 && randC < 70) continue;

      const x = randC * TILE_SIZE;
      const y = randR * TILE_SIZE;
      const tree = this.walls.create(x, y, 'snow_tree').setDepth(y);
      // Small hitbox at the trunk so the player can walk behind the
      // branches without getting bumped by them.
      tree.setSize(12, 12).setOffset(10, 26);
    }
  }

  // --- helpers ---

  private drawTile(
    c: number,
    r: number,
    frame: number,
    depth: number,
  ): void {
    // +TILE_SIZE/2 centers the sprite on the tile cell. Phaser's
    // default origin is 0.5,0.5, so without the offset everything
    // shifts down-right by half a tile.
    const x = c * TILE_SIZE + TILE_SIZE / 2;
    const y = r * TILE_SIZE + TILE_SIZE / 2;
    this.add.image(x, y, 'tiles', frame).setDepth(depth);
  }

  private addHitbox(c: number, r: number): void {
    // Invisible physics zone, one per tile. See the TODO in
    // generateMassiveWorld — this should really be batched.
    const x = c * TILE_SIZE + TILE_SIZE / 2;
    const y = r * TILE_SIZE + TILE_SIZE / 2;
    const zone = this.add.zone(x, y, TILE_SIZE, TILE_SIZE);
    this.physics.add.existing(zone, true);
    this.walls.add(zone);
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
    house.setSize(32, 20).setOffset(0, 12);
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
    // Snow particles, screen-space. Scroll factor 0 so the snow is
    // always in front of the camera rather than anchored to world
    // coords — makes it feel like it's falling on the player, not
    // just falling in a particular world region.
    //
    // blendMode ADD makes the flakes brighter where they overlap,
    // which reads better against the snow-colored ground than a
    // plain white sprite would.
    this.add.particles(0, -10, 'snow_flake', {
      x: { min: 0, max: this.cameras.main.width },
      y: -10,
      lifespan: 4000,
      speedY: { min: 50, max: 100 },
      speedX: { min: -20, max: 20 },
      scale: { start: 0.5, end: 0.5 },
      quantity: 2,
      frequency: 50,
      blendMode: 'ADD',
    }).setScrollFactor(0).setDepth(999);
  }
}