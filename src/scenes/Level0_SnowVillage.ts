import Phaser from 'phaser';

/* ============================================================
 * ⚔️ LEVEL 0 — SNOW VILLAGE ⚔️
 * 
 * chat, we are building an ACTUAL city. 
 * 126x126 tiles = 15,876 tiles. Do you know how long it 
 * would take to hardcode that? I'd literally be in a nursing 
 * home by the time I finished. 
 * 
 * So we're using MATH. Domain Expansion: Procedural Map Gen.
 * We paint the river, bridge, pond, and shrine with math, 
 * then let RNGesus handle the trees. 
 * 
 * if it lags, my laptop is going out the window. we ball.
 *
 * ============================================================ */


const TILE_SIZE = 16; 
const MAP_WIDTH = 126; 
const MAP_HEIGHT = 126;

// these frames HAVE to match the canvas code in BootScene
// if the game looks like a glitchy mess, i probably messed up these numbers
const TILE = {
  SNOW: 0,
  PATH: 1,
  CLIFF: 2,
  WIND: 3,
  ICE: 4, 
  FOREST: 5
};

export class Level0_SnowVillage extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: any;
  
  private objectiveText!: Phaser.GameObjects.Text;
  private currentObjective: number = 0;
  private signboard!: Phaser.Physics.Arcade.Sprite;

  constructor() {
    super('Level0_SnowVillage');
  }

  create(): void {
    // BRO. i spent like 2 hours wondering why i couldn't walk down
    // until i realized i forgot to tell phaser how big the world is.
    // physics bounds are actually the most important thing ever lmao.
    this.physics.world.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

    this.walls = this.physics.add.staticGroup();
    
    this.generateMassiveWorld();

    // spawn the boy at the bottom so he has to walk all the way up
    const spawnX = 63 * TILE_SIZE;
    const spawnY = 100 * TILE_SIZE;
    
    this.player = this.physics.add.sprite(spawnX, spawnY, 'player', 0);
    this.player.setSize(16, 16).setOffset(8, 16); // hitbox at the feet so we don't clip into roofs
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.walls);

    // camera zoomed in so it feels cinematic
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(2); 
    this.cameras.main.fadeIn(1000, 10, 25, 47);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D');

    this.createHUD();
    this.createAtmosphere();
  }

  update(): void {
    const speed = 200;
    this.player.setVelocity(0);

    // W key go brrrr. else-if stops diagonal movement from 
    // making us move at 2x speed (speedrunners hate this one trick)
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-speed);
      this.player.anims.play('walk-left', true);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(speed);
      this.player.anims.play('walk-right', true);
    } else if (this.cursors.up.isDown || this.wasd.W.isDown) {
      this.player.setVelocityY(-speed);
      this.player.anims.play('walk-up', true);
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      this.player.setVelocityY(speed);
      this.player.anims.play('walk-down', true);
    } else {
      // standing menacingly
      this.player.anims.stop();
      this.player.setFrame(0); 
    }

    // depth sorting so we walk behind trees and not on top of them
    this.player.setDepth(this.player.y);
  }

  private generateMassiveWorld(): void {
    // 1. paint the whole canvas snow white. literally 15,876 loops. 
    // my cpu is crying but we move.
    for (let r = 0; r < MAP_HEIGHT; r++) {
      for (let c = 0; c < MAP_WIDTH; c++) {
        this.drawTile(c, r, TILE.SNOW, 0);
      }
    }

    // 2. carve the river. using Math.sin makes it curve naturally 
    // which is basically a cheat code for making things look good.
    for (let r = 0; r < MAP_HEIGHT; r++) {
      const riverOffset = Math.floor(Math.sin(r / 15) * 3); 
      const riverStart = 15 + riverOffset;
      const riverEnd = 22 + riverOffset;

      for (let c = riverStart; c < riverEnd; c++) {
        this.drawTile(c, r, TILE.ICE, 1);
        this.addHitbox(c, r); // no swimming allowed, this isn't minecraft
      }
    }

    // 3. main path. if you put trees here, the game is unplayable.
    for (let r = 10; r < MAP_HEIGHT - 5; r++) {
      for (let c = 60; c < 66; c++) {
        this.drawTile(c, r, TILE.PATH, 0);
      }
    }

    // 4. shrine at the top. this is the final boss arena.
    for (let r = 5; r < 15; r++) {
      for (let c = 50; c < 75; c++) {
        this.drawTile(c, r, TILE.CLIFF, 1); 
        this.addHitbox(c, r);
      }
    }
    // dropping the actual shrine sprite on top of the cliff base
    this.walls.create(63 * TILE_SIZE, 10 * TILE_SIZE, 'shrine').setDepth(10 * TILE_SIZE);

    // 5. torii gates. gateway to the spirit world or whatever.
    this.addTorii(63, 18);
    this.addTorii(63, 110);

    // 6. houses. just hardcoding the coords because i am NOT 
    // building a whole prefab system right now. 
    this.addHouse(45, 40); 
    this.addHouse(80, 40); 
    this.addHouse(40, 75); 
    this.addHouse(85, 75); 

    // 7. trees. RNGesus take the wheel. 
    // just sprinkle 150 of them around the edges.
    for (let i = 0; i < 150; i++) {
       const randC = Phaser.Math.Between(5, MAP_WIDTH - 5);
       const randR = Phaser.Math.Between(5, MAP_HEIGHT - 5);
       
       // don't put trees on the main path or you'll get stuck
       if (randC > 55 && randC < 70) continue;
       
       const x = randC * TILE_SIZE;
       const y = randR * TILE_SIZE;
       const tree = this.walls.create(x, y, 'snow_tree').setDepth(y);
       tree.setSize(12, 12).setOffset(10, 26); // tiny hitbox at the trunk
    }
  }

  // --- HELPER FUNCTIONS ---

  private drawTile(c: number, r: number, frame: number, depth: number): void {
    const x = c * TILE_SIZE + TILE_SIZE / 2;
    const y = r * TILE_SIZE + TILE_SIZE / 2;
    this.add.image(x, y, 'tiles', frame).setDepth(depth);
  }

  private addHitbox(c: number, r: number): void {
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
    gate.setSize(40, 10).setOffset(4, 34); // only the pillars block us
  }

  // fixed the house generation so we don't get green boxes anymore
  private addHouse(c: number, r: number): void {
    const x = c * TILE_SIZE + TILE_SIZE / 2;
    const y = r * TILE_SIZE + TILE_SIZE / 2;
    
    // we use 'house' now, not 'house-tiles'
    const house = this.walls.create(x, y, 'house') as Phaser.Physics.Arcade.Sprite;
    house.setDepth(y);
    
    // one big hitbox for the whole house, not 20 tiny ones
    // if you clip through it, skill issue.
    house.setSize(32, 20).setOffset(0, 12);
  }

  private createHUD(): void {
    this.objectiveText = this.add.text(20, 20, 'Objective: Reach the Shrine (Go North)', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0).setDepth(1000); // scrollfactor 0 keeps it on screen
  }

  private createAtmosphere(): void {
    // snow go brrr
    this.add.particles(0, -10, 'snow_flake', {
      x: { min: 0, max: this.cameras.main.width },
      y: -10,
      lifespan: 4000,
      speedY: { min: 50, max: 100 },
      speedX: { min: -20, max: 20 },
      scale: { start: 0.5, end: 0.5 },
      quantity: 2,
      frequency: 50,
      blendMode: 'ADD'
    }).setScrollFactor(0).setDepth(999); 
  }
}