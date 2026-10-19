import Phaser from "phaser";
import {FacingDirection } from '../types';

export class Dummy extends Phaser.Physics.Arcade.Sprite {
    private isInvulnerable = false;
    private hitCount = 0;
    private readonly spawnX : number;
    private readonly spawnY : number;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'dummy', 0);
        this.spawnX = x;
        this.spawnY = y;

        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);
        body.setSize(14, 14);
        body.setOffset(9, 14);
    }

    public takeHit(fromDirection: FacingDirection): void {
    if (this.isInvulnerable) {
    return;
    }

    this.hitCount++;
    this.isInvulnerable = true;

    //flash white hit
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
    this.clearTint();
    this.isInvulnerable = false;
    });

    // Slight directional nudge
    const nudgeDistance = 3;
    const dx = fromDirection === 'left' ? -nudgeDistance : fromDirection === 'right' ? nudgeDistance : 0;
    const dy = fromDirection === 'up' ? -nudgeDistance : fromDirection === 'down' ? nudgeDistance : 0;
    this.setVelocity(dx, dy);

    this.scene.tweens.add({
    targets: this,
    x: this.spawnX + dx,
    y: this.spawnY + dy,
    duration: 50,
    yoyo: true,
    onComplete: () => {
        this.setPosition(this.spawnX, this.spawnY);
    }
    });

    this.scene.tweens.add({
    targets: this,
    x: this.spawnX + dx,
    y: this.spawnY + dy,
    duration: 50,
    yoyo: true,
    onComplete: () => {
        this.setPosition(this.spawnX, this.spawnY);
    }
    });
}

private spaeFlotingtext(message: string) : void {
    const popup = this.scene.add.text(this.x, this.y - 16, message, {
        fontSize: '8px',
        fontFamily: 'monospace',
        color: '#ffeb3b',
        stroke: '#000000',
        strokeThickness: 2
    })
    .setOrigin(0.5);

    this.scene.tweens.add({
        targets: popup,
        y: popup.y - 14,
        alpha: 0,
        duration: 450,
        ease: 'Cubic.easeOut',
        onComplete: () => popup.destroy()
        
    });
    }
}
