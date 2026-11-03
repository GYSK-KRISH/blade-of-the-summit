import Phaser from 'phaser';

export class Enemy extends Phaser.Physics.Arcade.Sprite{

    //A. Add Health variable 

    public hp: number = 5;

    constructor(scene: Phaser.Scene, x: number, y:number , texture: string) {

        // 1. CAll the parent constructor
        super (scene, x ,y , texture);

        // 2. Add this enemy to the scene display list and physics engine
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 3.set the hitbox 
        this.setSize(8, 8).setOffset(4, 8);
        this.setCollideWorldBounds(true);

    }

    //B. add damage
    takeDamage() {
        this.hp -= 1;
        if (this.hp <= 0) {
            this.destroy();
        }
    }

    updateAI(target: Phaser.Physics.Arcade.Sprite) {
        
        //if enemy is already moving fast, don't update AI
        if (this.body!.velocity.length() >100) return; 
        
        const speed = 100; 

        // calculate distance between enemy and player
        const dist = Phaser.Math.Distance.Between(this.x ,this.y, target.x, target.y);
    
        // if player is close around 150 pixels, then chase them
        if (dist < 150) {

            //find out if palyer at left or rigth
            if (target.x < this.x - 5) {
                this.setVelocityX(-40);  //Move Left
                this.setFlipX(true);
                this.anims.play('ninja-red-walk-side', true);
            }
            else if (target.x > this.x + 5) {
                this.setVelocityX(40);  //move right
                this.setFlipX(false);
                this.anims.play('ninja-red-walk-side', true);
            }
            else {
                this.setVelocityX(0); //stop moving x
            }
        }

        //if palyer is far away 
        else{
            this.setVelocity(0); 
            this.anims.stop();
            this.setFrame(0);
        }
    }
}
