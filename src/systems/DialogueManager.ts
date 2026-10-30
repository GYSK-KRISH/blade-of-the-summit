import Phaser from 'phaser';
import type { GameState } from './GameState';

/* -----------------------------------------------------------
 * DialogueManager — every conversation in the game 
 *
 * typed nodes. typewriter text. choice branching. quest-aware
 * entry points. one conversation at a time, no overlapping.
 *
 * built to survive onEnter running twice (it always does).
 * built to survive E being mashed (skip reveal, not skip node).
 * built to survive you forgetting to close it (close is idempotent).
 *
 * UI positions itself from camera scroll each frame — no
 * scrollFactor(0) zoom math. this one trick ate 30 min of my
 * life. don't touch it. 
 * ----------------------------------------------------------- */


export class DialogueManager {
    text : string;
    next : string;
    visibleIf? : (gs: GameState) => boolean;
    onChoose? : (gs: GameState ) => void;
}

export interface DialogueNode {
    id : string;
    speaker : string;
    title: string;
    text : string ;
    visibleIf? : (gs: GameState) => boolean;
    fallback? : string;
    next? : string;
    onChoose? : (gs: GameState ) => void;
    onEnter? : (gs: GameState ) => void;
    choices? : DialogueNode[];
}

export interface DialogueTree {
    id : string;
    nodes : DialogueNode[];
    entryPoints : Record<string, string>;      

}      

class DialogueUI {
    private container : Phaser.GameObjects.Container;
    private panel : Phaser.GameObjects.Rectangle;
    private nameText : Phaser.GameObjects.Text;
    private tileText : Phaser.GameObjects.Text;
    private bodyText : Phaser.GameObjects.Text;
    private choiceButtons : Phaser.GameObjects.Text[];
    private hintText : Phaser.GameObjects.Text;
    private onChoicePick: ((i: number) => void) | null = null;
    private scene: Phaser.Scene;
    private panelW: number;
    private panelH: number;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        const W = scene.scale.width;
        const H = scene.scale.height;
        this.panelW = Math.min(600, W * 0.8);
        this.panelH = Math.min(400, H * 0.5);


        // container at (0,0) local coords — repositioned per-frame in
        // DialogueManager.update() to stay pinned to screen bottom.
        this.container = scene.add.container(0, 0)
            .setDepth(1000)
            .setVisible(false);

        const panelY = H - this.panelH - 10;
        this.panel = scene.add.rectangle(0, panelY, this.panelW, this.panelH, 0x0a1420, 0.94)
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0xbfe9ff, 0.7);

        this.nameText = scene.add.text(-this.panelW / 2 + 12, panelY + 8, '', {
            fontFamily: 'monospace', fontSize: '13px',
            color: '#ffe27a', fontStyle: 'bold',
        });

        this.bodyText = scene.add.text(-this.panelW / 2 + 12, panelY + 30, '', {
            fontFamily: 'monospace', fontSize: '11px', color: '#f4fcff',
            wordWrap: { width: this.panelW - 24 },
            lineSpacing: 3,
        });

        this.hintText = scene.add.text(this.panelW / 2 - 12, panelY + this.panelH - 14, '▼ E', {
            fontFamily: 'monospace', fontSize: '10px', color: '#ffe27a',
        }).setOrigin(1, 0.5);

        this.container.add([this.panel, this.nameText, this.titleText, this.bodyText, this.hintText]);
    }


    show(speaker: string, title: string){
        this.nameText.setText(speaker);
        this.tileText.setText(title ?? '');
        this.hintText.setVisible(false)
        this.container.setVisible(true);
        this.clearChoices();
    }

    setText(t : string[]) {this.bodyText.setText(t.join('\n'))}
    setChoices(choices : string[], onPick: (i: number) => void) {
        this.clearChoices();
        this.onChoicePick = onPick;
        this.hintText.setVisible(flase);

        const panelY = -this.panelH - 10;
        const baseY = panelY = 32;

        texts.forEach((t, i) => {
        const label = this.scene.add.text(
            -this.panelW / 2 + 20, baseY + i * 16, `▸ ${i + 1}. ${t}`, {
                fontFamily: 'monospace', fontSize: '10px',
                color: '#bfe9ff', backgroundColor: '#1a2a3f',
                padding: { x: 4, y: 1 },
            },
        ).setInteractive({ useHandCursor: true });


            label.on('pointerover', () => label.setColor('#ffe27a'));
            label.on('pointerout', () => label.setColor('#bfe9ff'));
            label.on('pointerdown', () => this.onChoicePick?.(i));
            this.choiceLabels.push(label);
            this.container.add(label);
    });

    ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'].forEach((key, i) => {
                this.scene.input.keyboard!.once(`keydown-${key}`, () => this.onChoicePick?.(i));
        });
    }

    private advanceOrSkip() {
        if (!this.active) return;
        // ignore the E press that opened us
        if (this.scene.time.now - this.openedAt < 80) return;

        if (this.typed.length < this.full.length) {
            this.typed = this.full;
            this.ui.setText(this.full);
            this.revealTimer?.remove();
            this.onRevealed();
            return;
        }

        const n = this.node!;
        if (n.choices?.length) return;   // must pick a choice
        if (n.next) this.goTo(n.next);
        else this.close();
    }

    close() {
        this.active = false;
        this.node = null;
        this.script = null;
        this.revealTimer?.remove();
        this.ui.hide();
    }

    destroy() {
        this.keyE.removeAllListeners();
        this.revealTimer?.remove();
    }
}