import Phaser from 'phaser';
import { FacingDirection, HitboxOffset, PlayerState } from '../types';

// How long the hitbox stays live (overlap window).
const ATTACK_HIT_ACTIVE_MS = 120;
// How long the player is locked out of movement/input after a swing.
// Must be >= ATTACK_HIT_ACTIVE_MS. Also serves as the visual flash duration.
const ATTACK_LOCK_MS = 200;

const ATTACK_OFFSET: Record<FacingDirection, HitboxOffset> = {
  down:  { x: 0,  y: 16, width: 22, height: 14 },
  up:    { x: 0,  y: -16, width: 22, height: 14 },
  left:  { x: -16, y: 2,  width: 14, height: 22 },
  right: { x: 16,  y: 2,  width: 14, height: 22 }
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  public playerState: PlayerState = PlayerState.IDLE;
  public facing: FacingDirection = 'down';
  public attackHitbox!: Phaser.GameObjects.Zone;
  public attackHitboxActive: boolean = false;

  private readonly speed: number = 90;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    T: Phaser.Input.Keyboard.Key;
    J: Phaser.Input.Keyboard.Key;
    ONE: Phaser.Input.Keyboard.Key;
    TWO: Phaser.Input.Keyboard.Key;
    THREE: Phaser.Input.Keyboard.Key;
    FOUR: Phaser.Input.Keyboard.Key;
    FIVE: Phaser.Input.Keyboard.Key;   // was missing from the type
    SPACE: Phaser.Input.Keyboard.Key;
  };
  private slashGraphic!: Phaser.GameObjects.Graphics;
  private attackCooldown: number = 300;
  private lastAttackTime: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Compact foot collider for top-down wall navigation
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(14, 14);
    body.setOffset(9, 14);
    this.setCollideWorldBounds(true);

    this.createAnimations();
    this.setupInput();
    this.createAttackHitbox();

    // Tear down scene-owned objects when this sprite is destroyed or the
    // scene shuts down (avoids leaks on scene restart / game over).
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
  }

  private onShutdown(): void {
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    this.attackHitbox?.destroy();
    this.slashGraphic?.destroy();
  }

  private createAnimations(): void {
    const directions: FacingDirection[] = ['down', 'up', 'left', 'right'];

    directions.forEach((dir, rowIndex) => {
      const idleKey = `player-idle-${dir}`;
      const walkKey = `player-walk-${dir}`;

      if (!this.scene.anims.exists(idleKey)) {
        this.scene.anims.create({
          key: idleKey,
          frames: [{ key: 'player', frame: rowIndex * 3 }],
          frameRate: 1,
          repeat: -1
        });
      }

      if (!this.scene.anims.exists(walkKey)) {
        this.scene.anims.create({
          key: walkKey,
          frames: this.scene.anims.generateFrameNumbers('player', {
            start: rowIndex * 3,
            end: rowIndex * 3 + 2
          }),
          frameRate: 8,
          repeat: -1
        });
      }
    });
  }

  private setupInput(): void {
    const keyboard = this.scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      T: Phaser.Input.Keyboard.KeyCodes.T,
      J: Phaser.Input.Keyboard.KeyCodes.J,
      ONE: Phaser.Input.Keyboard.KeyCodes.ONE,
      TWO: Phaser.Input.Keyboard.KeyCodes.TWO,
      THREE: Phaser.Input.Keyboard.KeyCodes.THREE,
      FOUR: Phaser.Input.Keyboard.KeyCodes.FOUR,
      FIVE: Phaser.Input.Keyboard.KeyCodes.FIVE,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
    }) as typeof this.keys;
  }

  private createAttackHitbox(): void {
    this.attackHitbox = this.scene.add.zone(this.x, this.y, 16, 16);
    this.scene.physics.add.existing(this.attackHitbox);

    const hitboxBody = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
    hitboxBody.enable = false;

    this.slashGraphic = this.scene.add.graphics();
  }

  // 🔥 FIXED: now accepts the Phaser update signature
  public update(_time?: number, _delta?: number): void {
    if (this.playerState === PlayerState.ATTACKING) {
      this.setVelocity(0, 0);
      return;
    }

    const now = this.scene.time.now;
    if (
      (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
        Phaser.Input.Keyboard.JustDown(this.keys.J)) &&
      now - this.lastAttackTime >= this.attackCooldown
    ) {
      this.lastAttackTime = now;
      this.performAttack();
      return;
    }

    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.keys.A.isDown) {
      vx = -1;
      this.facing = 'left';
    } else if (this.cursors.right.isDown || this.keys.D.isDown) {
      vx = 1;
      this.facing = 'right';
    }

    if (this.cursors.up.isDown || this.keys.W.isDown) {
      vy = -1;
      this.facing = 'up';
    } else if (this.cursors.down.isDown || this.keys.S.isDown) {
      vy = 1;
      this.facing = 'down';
    }

    // Normalize diagonal speed so diagonal movement isn't faster
    if (vx !== 0 && vy !== 0) {
      const norm = Math.SQRT1_2;
      vx *= norm;
      vy *= norm;
    }

    this.setVelocity(vx * this.speed, vy * this.speed);

    if (vx !== 0 || vy !== 0) {
      this.playerState = PlayerState.WALKING;
      this.anims.play(`player-walk-${this.facing}`, true);
    } else {
      this.playerState = PlayerState.IDLE;
      this.anims.play(`player-idle-${this.facing}`, true);
    }
  }

  private performAttack(): void {
    this.playerState = PlayerState.ATTACKING;
    this.attackHitboxActive = true;
    this.setVelocity(0, 0);

    const offset = ATTACK_OFFSET[this.facing];
    const hitboxX = this.x + offset.x;
    const hitboxY = this.y + offset.y;

    this.attackHitbox.setPosition(hitboxX, hitboxY);
    this.attackHitbox.setSize(offset.width, offset.height);

    const hitboxBody = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
    hitboxBody.setSize(offset.width, offset.height, true);
    hitboxBody.enable = true;

    // Draw sword slash flash
    this.slashGraphic.clear();
    this.slashGraphic.fillStyle(0xffffff, 0.75);
    this.slashGraphic.fillRect(
      hitboxX - offset.width / 2,
      hitboxY - offset.height / 2,
      offset.width,
      offset.height
    );

    // Short window: hitbox live
    this.scene.time.delayedCall(ATTACK_HIT_ACTIVE_MS, () => {
      if (!this.active) return;
      hitboxBody.enable = false;
      this.attackHitboxActive = false;
    });

    // Longer window: player locked, visual cleared, back to idle
    this.scene.time.delayedCall(ATTACK_LOCK_MS, () => {
      if (!this.active) return;
      this.slashGraphic.clear();
      this.playerState = PlayerState.IDLE;
      this.anims.play(`player-idle-${this.facing}`, true);
    });
  }
}