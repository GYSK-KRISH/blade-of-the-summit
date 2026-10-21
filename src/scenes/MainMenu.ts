import Phaser from 'phaser';

/* ============================================================
 * ⚔️ MAIN MENU  ⚔️
 * 
 * 
 * you know how when the wifi dies on the pc, 
 * you get the EDGE SURF game in microsoft edge browsers? 
 * how simple web games let u 
 * just scroll the mouse wheel to pick a skin?
 * 
 * yeah. we will implemented that also 
 * scroll wheel goes brrr to change ur character.
 * arrow keys for the menu. 
 * just pure browser game aura.
 * ============================================================ */


// menu items type
interface MenuOption {
  text: string;
  action: () => void;
}

export class MainMenu extends Phaser.Scene {
  private menuOptions: MenuOption[] = [];
  private buttonTexts: Phaser.GameObjects.Text[] = [];
  private selectedIndex: number = 0; 

  // Scroll wheel character stuff
  private characters: string[] = ['Ninja', 'Samurai', 'Viking', 'Knight', 'Pirate'];
  private selectedCharacterIndex: number = 0;
  private characterText!: Phaser.GameObjects.Text;

  constructor() {
    super('MainMenu');
  }

  create(): void {
    // 1. BACKGROUND (800x600 now, not 1024x768)
    this.add.rectangle(0, 0, 800, 600, 0x0a192f).setOrigin(0);

    // Add the mountain horizon we generated in BootScene for free
    // (scaled up 2.5x so it fits the bottom nicely)
    this.add.image(400, 500, 'mountain_horizon').setScale(2.5).setAlpha(0.8);

    // Generate a tiny snow particle on the fly so it doesn't crash
    if (!this.textures.exists('menu-snow')) {
      const snowTex = this.textures.createCanvas('menu-snow', 4, 4);
      const ctx = snowTex!.getContext();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 4, 4);
      snowTex!.refresh();
    }

    // Snow falling over the whole screen
    this.add.particles(0, -10, 'menu-snow', {
      x: { min: 0, max: 800 },
      y: -10,
      lifespan: 6000,
      speedY: { min: 30, max: 80 },
      speedX: { min: -15, max: 15 },
      scale: { start: 0.5, end: 0.8 },
      alpha: { start: 1, end: 0 },
      quantity: 2,
      frequency: 50,
      blendMode: 'ADD'
    });

    // 2. TITLE (Centered at 400 instead of 512)
    const title = this.add.text(400, 120, 'BLADE OF THE SUMMIT', {
      fontSize: '48px', // shrunk from 64 so it fits perfectly
      fontFamily: 'monospace', 
      color: '#ffffff', 
      fontStyle: 'bold'
    }).setOrigin(0.5);
    title.setShadow(0, 0, '#48cae4', 15, true, true);

    // 3. CHARACTER SELECTOR
    this.add.text(400, 220, 'SELECT YOUR SLAYER (Scroll Wheel)', {
      fontSize: '18px', fontFamily: 'monospace', color: '#5c677d'
    }).setOrigin(0.5);

    this.characterText = this.add.text(400, 260, `> ${this.characters[this.selectedCharacterIndex]} <`, {
      fontSize: '32px', fontFamily: 'monospace', color: '#ffcc00', fontStyle: 'bold'
    }).setOrigin(0.5);

    // 4. MENU OPTIONS
    this.menuOptions = [
      {
        text: 'NEW GAME',
        action: () => {
          // Save the character choice so Level0 knows who u picked
          this.registry.set('selectedCharacter', this.characters[this.selectedCharacterIndex]);
          this.cameras.main.fadeOut(500, 0, 0, 0);
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('Level0_SnowVillage');
          });
        }
      },
      {
        text: 'CONTINUE',
        action: () => {
          console.log("no save data found bro");
          this.flashText("NO SAVE DATA FOUND", 400);
        }
      },
      {
        text: 'CREDITS',
        action: () => this.showCredits()
      }
    ];

    this.buildMenuUI();
    this.setupInputs();

    this.cameras.main.fadeIn(800, 10, 25, 47);
  }

  private buildMenuUI(): void {
    const startY = 350;
    const spacing = 60;

    this.menuOptions.forEach((option, index) => {
      // Changed from 512 to 400 so it's centered
      const btn = this.add.text(400, startY + (index * spacing), option.text, {
        fontSize: '24px', fontFamily: 'monospace', color: '#ffffff',
        backgroundColor: '#112240', padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      this.buttonTexts.push(btn);
      btn.on('pointerover', () => this.updateSelection(index));
      btn.on('pointerup', () => option.action());
    });
    this.updateSelection(0);
  }

  private setupInputs(): void {
    this.input.keyboard!.on('keydown-UP', () => {
      this.selectedIndex = (this.selectedIndex > 0) ? this.selectedIndex - 1 : this.menuOptions.length - 1;
      this.updateSelection(this.selectedIndex);
    });
    this.input.keyboard!.on('keydown-DOWN', () => {
      this.selectedIndex = (this.selectedIndex < this.menuOptions.length - 1) ? this.selectedIndex + 1 : 0;
      this.updateSelection(this.selectedIndex);
    });

    // THE SCROLL WHEEL
    this.input.on('wheel', (pointer: any, currentlyOver: any, deltaX: number, deltaY: number) => {
      if (deltaY > 0) {
        this.selectedCharacterIndex = (this.selectedCharacterIndex + 1) % this.characters.length;
      } else if (deltaY < 0) {
        this.selectedCharacterIndex = (this.selectedCharacterIndex - 1 + this.characters.length) % this.characters.length;
      }
      this.updateCharacterText();
    });

    this.input.keyboard!.on('keydown-ENTER', () => this.menuOptions[this.selectedIndex].action());
    this.input.keyboard!.on('keydown-SPACE', () => this.menuOptions[this.selectedIndex].action());
  }

  private updateSelection(index: number): void {
    this.selectedIndex = index;
    this.buttonTexts.forEach((btn, i) => {
      if (i === index) {
        btn.setStyle({ color: '#48cae4', backgroundColor: '#1a3a5c' });
        btn.setScale(1.1);
      } else {
        btn.setStyle({ color: '#ffffff', backgroundColor: '#112240' });
        btn.setScale(1.0);
      }
    });
  }

  private updateCharacterText(): void {
    this.characterText.setText(`> ${this.characters[this.selectedCharacterIndex]} <`);
    this.characterText.setScale(1.2);
    this.tweens.add({ targets: this.characterText, scale: 1.0, duration: 150, ease: 'Back.easeOut' });
  }

  private flashText(message: string, yOffset: number): void {
    // Changed to 400
    const warning = this.add.text(400, yOffset, message, { fontSize: '18px', color: '#ff4d4d', fontFamily: 'monospace' }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: warning, alpha: 1, duration: 200, yoyo: true, hold: 1000, onComplete: () => warning.destroy() });
  }

  private showCredits(): void {
    // Changed 1024x768 to 800x600
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setInteractive();
    const creditsText = this.add.text(400, 300, "CREATED BY: YOU\n\nART: NINJA ADVENTURE PACK\nENGINE: PHASER 3\n\nPress anywhere to close", { fontSize: '24px', align: 'center', color: '#48cae4', fontFamily: 'monospace' }).setOrigin(0.5);
    overlay.on('pointerdown', () => { overlay.destroy(); creditsText.destroy(); });
  }
}