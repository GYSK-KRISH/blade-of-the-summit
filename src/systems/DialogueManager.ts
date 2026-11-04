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


// 1. Choice
export interface DialogueChoice {
    text: string;
    next: string;
    visibleIf?: (gs: GameState) => boolean;
    onChoose?: (gs: GameState) => void;
}

// 2. Node
export interface DialogueNode {
    id: string;
    speaker: string;
    title?: string;
    text: string;
    visibleIf?: (gs: GameState) => boolean;
    fallback?: string;
    next?: string;
    choices?: DialogueChoice[];
    onEnter?: (gs: GameState) => void;
}

// 3. Script
export interface DialogueScript {
    id: string;
    entry: (gs: GameState) => string;
    nodes: Record<string, DialogueNode>;
}

// 4. UI
class DialogueUI {
    private container: Phaser.GameObjects.Container;
    private panel: Phaser.GameObjects.Rectangle;
    private nameText: Phaser.GameObjects.Text;
    private titleText: Phaser.GameObjects.Text;
    private bodyText: Phaser.GameObjects.Text;
    private hintText: Phaser.GameObjects.Text;
    private choiceLabels: Phaser.GameObjects.Text[] = [];
    private onChoicePick: ((i: number) => void) | null = null;
    private scene: Phaser.Scene;
    private panelW: number;
    private panelH: number;

        constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.panelW = Math.min(640, scene.scale.width * 0.85);
        this.panelH = 130;

        this.container = scene.add.container(0, 0).setDepth(20_000).setVisible(false).setScrollFactor(0);
        const panelY = -this.panelH - 10;

        // 1. Outer Wooden Border (Dark Brown)
        this.panel = scene.add.rectangle(0, panelY, this.panelW, this.panelH, 0x4e342e, 1)
            .setOrigin(0.5, 0).setStrokeStyle(6, 0x2b1c13);

        // 2. Inner Parchment (Cream)
        const innerPanel = scene.add.rectangle(0, panelY, this.panelW - 16, this.panelH - 16, 0xf2e8d5, 1)
            .setOrigin(0.5, 0).setStrokeStyle(2, 0x8b6b4a);

                // 3. Speaker Nameplate (Wooden Tag)
        const nameBg = scene.add.rectangle(-this.panelW / 2 + 50, panelY - 12, 140, 28, 0x4e342e)
            .setStrokeStyle(2, 0xb3242c); // Red border for anime flair
            
        this.nameText = scene.add.text(-this.panelW / 2 + 50, panelY - 12, '', {
            fontFamily: 'sans-serif', // Clean font
            fontSize: '16px', 
            color: '#f2e8d5', // Cream text
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // 4. Title (Dark Grey, smaller)
        this.titleText = scene.add.text(this.panelW / 2 - 20, panelY + 12, '', {
            fontFamily: 'sans-serif', 
            fontSize: '12px', 
            color: '#5c677d',
        }).setOrigin(1, 0);

        // 5. Body Text (Easy to read)
        this.bodyText = scene.add.text(-this.panelW / 2 + 25, panelY + 40, '', {
            fontFamily: 'sans-serif', // Clean font
            fontSize: '15px',         // Bigger text
            color: '#2b1c13',
            wordWrap: { width: this.panelW - 50 }, 
            lineSpacing: 8,           // More breathing room between lines
        });

        // 6. Hint Text (Dark Gold)
        this.hintText = scene.add.text(this.panelW / 2 - 20, panelY + this.panelH - 14, '▼ [E] to continue', {
            fontFamily: 'sans-serif', fontSize: '12px', color: '#a8823f',
        }).setOrigin(1, 0.5);

        // 7. Add all to container
        this.container.add([this.panel, innerPanel, nameBg, this.nameText, this.titleText, this.bodyText, this.hintText]);
    }

    show(speaker: string, title?: string) {
        this.nameText.setText(speaker);
        this.titleText.setText(title ?? '');
        this.hintText.setVisible(false);
        this.clearChoices();
        this.container.setVisible(true);
    }

    setText(t: string) { this.bodyText.setText(t); }
    setContinueHint() { this.hintText.setVisible(true); }
    hide() { this.container.setVisible(false); this.clearChoices(); }

    setChoices(texts: string[], onPick: (i: number) => void) {
        this.clearChoices();
        this.onChoicePick = onPick;
        this.hintText.setVisible(false);

        const panelY = -this.panelH - 10;
        const baseY = panelY + 46;

        texts.forEach((t, i) => {
                const label = this.scene.add.text(
                -this.panelW / 2 + 20, baseY + i * 16, `▸ ${i + 1}. ${t}`, {
                    fontFamily: 'monospace', fontSize: '12px',
                    color: '#2b1c13', backgroundColor: '#e6d5b8', padding: { x: 6, y: 2 },
                },
            ).setInteractive({ useHandCursor: true });

            label.on('pointerover', () => label.setColor('#b3242c')); // Red on hover
            label.on('pointerout', () => label.setColor('#2b1c13'));  // Dark brown normal
            label.on('pointerdown', () => this.onChoicePick?.(i));
            this.choiceLabels.push(label);
            this.container.add(label);
        });

        ['ONE', 'TWO', 'THREE', 'FOUR'].slice(0, texts.length).forEach((key, i) => {
            this.scene.input.keyboard!.once(`keydown-${key}`, () => this.onChoicePick?.(i));
        });
    }

    private clearChoices() {
        for (const c of this.choiceLabels) c.destroy();
        this.choiceLabels = [];
        this.onChoicePick = null;
    }

    reposition(cam: Phaser.Cameras.Scene2D.Camera) {
        // Lock to the exact center-bottom of the screen, no zoom math needed
        this.container.setPosition(
            cam.centerX, 
            cam.centerY + (this.scene.scale.height / 2 / cam.zoom)
        ).setScale(1 / cam.zoom);
    }
}
// 5. Manager
export class DialogueManager {
    private ui: DialogueUI;
    private active = false;
    private node: DialogueNode | null = null;
    private script: DialogueScript | null = null;
    private typed = '';
    private full = '';
    private revealTimer?: Phaser.Time.TimerEvent;
    private openedAt = 0;
    private keyE: Phaser.Input.Keyboard.Key;

    constructor(private scene: Phaser.Scene, private gs: GameState) {
        this.ui = new DialogueUI(scene);
        this.keyE = scene.input.keyboard!.addKey('E');
        this.keyE.on('down', () => this.advanceOrSkip());
    }

    isOpen(): boolean { return this.active; }

    start(script: DialogueScript) {
        if (this.active) return;

        for (const [id, n] of Object.entries(script.nodes)) {
            const targets = [n.next, n.fallback, ...(n.choices?.map(c => c.next) ?? [])].filter((t): t is string => !!t);
            for (const t of targets) {
                if (!script.nodes[t]) {
                    console.error(`[Dialogue] "${script.id}" node "${id}" → missing "${t}"`);
                    return;
                }
            }
        }

        const entryId = script.entry(this.gs);
        const entry = script.nodes[entryId];
        if (!entry) return;

        this.script = script;
        this.active = true;
        this.openedAt = this.scene.time.now;
        this.ui.show(entry.speaker, entry.title);
        this.goTo(entryId);
        this.scene.events.emit('dialogue-opened');     
    }

    update() {
        if (!this.active) return;
        this.ui.reposition(this.scene.cameras.main);
    }

    private goTo(id: string) {
        if (!this.script) return;
        const n = this.script.nodes[id];
        if (!n) { this.close(); return; }

        if (n.visibleIf && !n.visibleIf(this.gs) && n.fallback) {
            this.goTo(n.fallback);
            return;
        }

        this.node = n;
        this.full = n.text;
        this.typed = '';
        this.ui.setChoices([], () => {});
        n.onEnter?.(this.gs);
        this.ui.show(n.speaker, n.title);

        this.revealTimer?.remove();
        this.revealTimer = this.scene.time.addEvent({
            delay: 22, loop: true, callback: () => {
                if (this.typed.length >= this.full.length) {
                    this.revealTimer?.remove();
                    this.onRevealed();
                    return;
                }
                this.typed = this.full.slice(0, this.typed.length + 1);
                this.ui.setText(this.typed);
            },
        });
    }

    private onRevealed() {
        const n = this.node!;
        const choices = (n.choices ?? []).filter(c => !c.visibleIf || c.visibleIf(this.gs));
        if (choices.length) {
            this.ui.setChoices(choices.map(c => c.text), (i) => {
                const c = choices[i];
                c.onChoose?.(this.gs);
                this.goTo(c.next);
            });
        } else {
            this.ui.setContinueHint();
        }
    }

    private advanceOrSkip() {
        if (!this.active) return;
        if (this.scene.time.now - this.openedAt < 300) return;

        if (this.typed.length < this.full.length) {
            this.typed = this.full;
            this.ui.setText(this.full);
            this.revealTimer?.remove();
            this.onRevealed();
            return;
        }

        const n = this.node!;
        if (n.choices?.length) return;
        if (n.next) this.goTo(n.next);
        else this.close();
    }

    close() {
        const wasActive = this.active;
        this.active = false;
        this.node = null;
        this.script = null;
        this.revealTimer?.remove();
        this.ui.hide();
        if (wasActive) this.scene.events.emit('dialogue-closed');
    }

    destroy() {
        this.keyE.removeAllListeners();
        this.revealTimer?.remove();
    }
}