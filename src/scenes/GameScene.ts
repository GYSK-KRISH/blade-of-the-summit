import Phaser from 'phaser';
import { Dummy } from '../entities/Dummy';
import { Player } from '../entities/Player';
import { PlayerState } from '../types';

/* ============================================================
 * ⚔️ GAME SCENE ⚔️ — SNOWY VALLEY DOMAIN
 *
 * Day 2 arc: we actually put the pixels on the map now.
 * no more empty clearing. we got trees. we got crystals.
 * we got a whole vibe. tanjiro would approve.
 *
 * threat level: still training arc but the production values
 * are mid-season movie tier. respect the process.
 * ============================================================ */


const TILE_SIZE = 16;
const MAP_COLS = 20; // 20 * 16 = 320px
const MAP_ROWS = 15; // 15 * 16 = 240px

const LEVEL_0_MAP: number[][] = [
  // 0 = Powder Snow
  // 1 = Packed-Snow Trail
  // 2 = Icy Cliff Wall (solid)
  // 3 = Wind-Swept Snow
  // 4 = Frozen Pond (solid)
  // 5 = Deep Forest Snow

  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 5, 5, 5, 5, 5, 5, 5, 1, 1, 5, 5, 5, 5, 5, 5, 5, 5, 5, 2],
  [2, 5, 5, 0, 3, 0, 0, 1, 1, 1, 0, 0, 3, 0, 0, 0, 5, 5, 5, 2],
  [2, 5, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 3, 0, 0, 5, 5, 2],
  [2, 5, 0, 3, 0, 1, 1, 1, 0, 0, 4, 4, 4, 4, 0, 0, 0, 0, 5, 2],
  [2, 0, 0, 0, 0, 1, 1, 0, 0, 4, 4, 4, 4, 4, 4, 0, 3, 0, 0, 2],
  [2, 0, 3, 0, 1, 1, 0, 0, 0, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 1, 1, 1, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0, 3, 0, 2],
  [2, 5, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 5, 2],
  [2, 5, 0, 3, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 3, 0, 0, 0, 5, 2],
  [2, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 3, 0, 0, 2],
  [2, 0, 3, 0, 0, 3, 0, 0, 1, 1, 0, 0, 3, 0, 0, 0, 0, 0, 0, 2],
  [2, 5, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 3, 0, 0, 5, 5, 2],
  [2, 5, 5, 5, 0, 0, 1, 1, 1, 0, 0, 0, 0, 5, 5, 5, 5, 5, 5, 2],
  [2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
];
interface MistCloud {
  sprite: Phaser.GameObjects.Image;
  speed: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private dummy!: Dummy;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private mistClouds: MistCloud[] = [];
  private crystalHalos: Phaser.GameObjects.Arc[] = [];

  constructor() {
    super('GameScene');
  }

  create(): void {
    // 1. Keep player inside the 320x240 world bounds
    this.physics.world.setBounds(0, 0, 320, 240);

    // 2. Create static collision group for walls, trees, rocks, crystals, and pond
    this.walls = this.physics.add.staticGroup();

    // 3. Build the 20x15 Snowy Valley tilemap using the 'tiles' spritesheet
    this.buildSnowyTilemap();

    // 4. Add distant anime mountain silhouette along the northern ridge
    if (this.textures.exists('mountain_horizon')) {
      const horizon = this.add.image(160, 18, 'mountain_horizon');
      horizon.setDepth(2);
      horizon.setAlpha(0.88);
    }

    // 5. Place snow-covered pine trees, frost rocks, and glowing ice crystals
    this.placeSnowTrees();
    this.placeRocksAndCrystals();

    // 6. Spawn Day 1 Entities (Dummy & Player) in the clearing
    this.dummy = new Dummy(this, 136, 92);
    this.player = new Player(this, 128, 196);

    this.dummy.setDepth(this.dummy.y);
    this.player.setDepth(this.player.y);

    // 7. Wire up Colliders (Player & Dummy vs Walls/Trees/Rocks/Pond)
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.dummy);
    this.physics.add.collider(this.dummy, this.walls);

    // 8. Add Anime Winter Atmosphere (Drifting Mist, Snowfall, Icy Blue Lighting)
    this.createAtmosphereEffects();
  }

  update(time: number, delta: number): void {
    // Update Day 1 Player
    this.player.update(time, delta);
    this.player.setDepth(this.player.y);

    // Check Day 1 sword attack hitbox against the Training Dummy
    this.handlePlayerAttackOverlap();

    // Drift valley mist slowly across the screen
    const dt = delta / 1000;
    for (const cloud of this.mistClouds) {
      cloud.sprite.x += cloud.speed * dt;
      if (cloud.sprite.x > 380) {
        cloud.sprite.x = -60;
      }
    }

    // Pulse cyan crystal glow halos
    const alphaPulse = 0.22 + Math.sin(time * 0.004) * 0.08;
    for (const halo of this.crystalHalos) {
      halo.setAlpha(alphaPulse);
    }
  }

  private buildSnowyTilemap(): void {
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const frame = LEVEL_0_MAP[r][c];
        const x = c * TILE_SIZE + TILE_SIZE / 2;
        const y = r * TILE_SIZE + TILE_SIZE / 2;

        if (frame === 2) {
          // Frame 2: Icy Cliff Boundary Wall (Static Physics Collider)
          const wallTile = this.walls.create(x, y, 'tiles', 2) as Phaser.Physics.Arcade.Sprite;
          wallTile.setDepth(1);
        } else {
          // Ground tiles (Powder Snow, Packed Trail, Wind-Swept Snow, Pond Ice, Deep Snow)
          const groundTile = this.add.image(x, y, 'tiles', frame);
          groundTile.setDepth(0);

          // Make Frozen Pond tiles (Frame 4) solid so player cannot walk over thin ice
          if (frame === 4) {
            const iceBlocker = this.add.zone(x, y, TILE_SIZE, TILE_SIZE);
            this.physics.add.existing(iceBlocker, true);
            this.walls.add(iceBlocker);
          }
        }
      }
    }
  }

  private placeSnowTrees(): void {
    const treeCoords: Array<[number, number]> = [
      // Northern forest treeline
      [36, 36], [68, 38], [168, 36], [204, 38], [244, 36], [280, 38],
      // Left valley edge
      [28, 76], [32, 124], [28, 172], [36, 208],
      // Right valley edge
      [292, 76], [288, 128], [292, 176], [280, 208],
      // Interior clearing accents
      [68, 148], [236, 156],
    ];

    for (const [x, y] of treeCoords) {
      const tree = this.walls.create(x, y, 'snow_tree') as Phaser.Physics.Arcade.Sprite;
      tree.setDepth(y);
      // Small trunk collider at base of tree so player can walk behind upper canopy
      tree.body?.setSize(12, 10);
      tree.body?.setOffset(10, 26);
    }
  }

  private placeRocksAndCrystals(): void {
    const rockCoords: Array<[number, number]> = [
      [88, 60], [164, 68], [260, 112], [92, 176], [184, 184],
    ];

    for (const [x, y] of rockCoords) {
      const rock = this.walls.create(x, y, 'frost_rock') as Phaser.Physics.Arcade.Sprite;
      rock.setDepth(y);
      rock.body?.setSize(12, 8);
      rock.body?.setOffset(2, 6);
    }

    const crystalCoords: Array<[number, number]> = [
      [152, 48], [252, 68], [248, 124], [52, 104], [168, 208],
    ];

    for (const [x, y] of crystalCoords) {
      // Soft icy-blue glow circle under each crystal
      const halo = this.add.circle(x, y + 4, 14, 0x48cae4, 0.25);
      halo.setDepth(y - 1);
      this.crystalHalos.push(halo);

      const crystal = this.walls.create(x, y, 'ice_crystal') as Phaser.Physics.Arcade.Sprite;
      crystal.setDepth(y);
      crystal.body?.setSize(10, 8);
      crystal.body?.setOffset(3, 14);
    }
  }

  private handlePlayerAttackOverlap(): void {
    const p = this.player as unknown as {
      isAttacking?: boolean;
      attackHitbox?: Phaser.GameObjects.GameObject;
      hitbox?: Phaser.GameObjects.GameObject;
      getAttackHitbox?: () => Phaser.GameObjects.GameObject | null;
    };

    const activeHitbox =
      typeof p.getAttackHitbox === 'function'
        ? p.getAttackHitbox()
        : p.attackHitbox || p.hitbox;

    if (activeHitbox && (p.isAttacking ?? true)) {
      this.physics.overlap(activeHitbox, this.dummy, () => {
        const d = this.dummy as unknown as {
          takeHit?: () => void;
          onHit?: () => void;
          hit?: () => void;
        };
        if (typeof d.takeHit === 'function') d.takeHit();
        else if (typeof d.onHit === 'function') d.onHit();
        else if (typeof d.hit === 'function') d.hit();
      });
    }
  }

  private createAtmosphereEffects(): void {
    // 1. Drifting valley mist clouds
    const mists = [
      { x: 64, y: 58, speed: 6, scale: 1.2 },
      { x: 224, y: 118, speed: 4.5, scale: 1.0 },
      { x: 116, y: 188, speed: 7, scale: 1.25 },
    ];
    for (const m of mists) {
      const sprite = this.add.image(m.x, m.y, 'mist_cloud');
      sprite.setScale(m.scale);
      sprite.setDepth(400);
      this.mistClouds.push({ sprite, speed: m.speed });
    }

    // 2. Diagonal drifting snow particles
    const snowEmitter = this.add.particles(0, -8, 'snow_flake', {
      x: { min: -30, max: 330 },
      y: -8,
      lifespan: 5000,
      speedY: { min: 22, max: 45 },
      speedX: { min: 8, max: 20 },
      scale: { start: 1, end: 0.6 },
      alpha: { start: 0.9, end: 0.2 },
      quantity: 1,
      frequency: 100,
    });
    snowEmitter.setDepth(500);

    // 3. Cool anime twilight blue wash + top-left moonlight glow
    const blueTint = this.add.rectangle(160, 120, 320, 240, 0x0a192f, 0.16);
    blueTint.setDepth(600);

    const moonlight = this.add.circle(44, 28, 85, 0x90e0ef, 0.08);
    moonlight.setDepth(601);
  }
}