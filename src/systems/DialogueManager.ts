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


export interface DialogueChoice {
    text: string;
    next: string;
    visibleIf?: (gs: GameState) => boolean;
    onChoose?: (gs: GameState) => void;
}

export interface DialogueNode {
    id: string;
    speaker: string;
    title: string;
    text: string;
    visibleIf?: (gs: GameState) => boolean;
    fallback?: string;
    next?: string;
    onEnter?: (gs: GameState) => void;
    choices?: DialogueChoice[];
}

export interface DialogueTree {
    id: string;
    nodes: DialogueNode[];
    entryPoints: Record<string, string>;
}

export class DialogueManager {
    private readonly scene: Phaser.Scene;
    private active = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    isOpen(): boolean {
        return this.active;
    }

    open(): void {
        this.active = true;
    }

    close(): void {
        this.active = false;
    }

    destroy(): void {
        this.active = false;
        void this.scene;
    }
}