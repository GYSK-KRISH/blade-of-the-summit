import Phaser from 'phaser';
import { Dummy } from '../entities/Dummy';
import { Player } from '../entities/Player';
import { PlayerState } from '../types';

export class GameScene extends Phaser.Scene {
private wallGroup!: Phaser.Physics.Arcade.StaticGroup;
private player!: Player;
private dummy!: Dummy;

constructor() {
    super('GameScene');
}

create(): void {
    this.wallGroup = this.physics.add.staticGroup();

    // Render a 20x15 clearing (320x240 pixels)
    for (let c = 0; c < 20; c++) {
    for (let r = 0; r < 15; r++) {
        const isBorder = c === 0 || c === 19 || r === 0 || r === 14;
        const posX = c * 16 + 8;
        const posY = r * 16 + 8;

        if (isBorder) {
        const wall = this.wallGroup.create(
            posX,
            posY,
            'tiles',
            2
        ) as Phaser.Physics.Arcade.Sprite;
        wall.refreshBody();
        } else {
        const isCenterPath = c >= 8 && c <= 11;
        const frame = isCenterPath ? 1 : 0;
        this.add.image(posX, posY, 'tiles', frame);
        }
    }
    }

    // Spawn playable hero and target dummy
    this.player = new Player(this, 80, 120);
    this.dummy = new Dummy(this, 220, 120);

    // Register physics collisions and sword hit detection
    this.physics.add.collider(this.player, this.wallGroup);
    this.physics.add.collider(this.player, this.dummy);

    this.physics.add.overlap(
    this.player.attackHitbox,
    this.dummy,
    () => {
        if (this.player.playerState === PlayerState.ATTACKING) {
        this.dummy.takeHit(this.player.facing);
        }
    },
    undefined,
    this
    );

    // On-screen Day 1 confirmation & controls HUD
    this.add.text(
    6,
    6,
    'Day 1: Scaffolding Complete | WASD/Arrows: Move | SPACE/J: Attack',
    {
        fontSize: '7px',
        fontFamily: 'monospace',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 }
    }
    );
}

update(): void {
    this.player.update();
}
}