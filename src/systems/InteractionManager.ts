import Phaser from 'phaser';

/* -----------------------------------------------------------
 *  InteractionManager — one brain for every E press
 *
 * Handles NPCs, doors, weapon racks, clues, torii gates, whatever.
 * Any object the player can "look at" registers itself here.
 * The manager decides which one is closest, priority-wins ties,
 * shows ONE prompt (never two overlapping), fires on E press.
 *
 * Key ponint i have to  designed 
 *   - double-fire from one E press 
 *   - walking-into-a-door auto-trigger 
 *   - prompt showing through dialogue box 
 *   - prompt scaling weirdly under camera zoom
 * ----------------------------------------------------------- */


export interface Interactable {
    id: string;
    getPosition: () => { x: number; y: number };  
    radius: number;                               
    priority: number;                             
    prompt: () => string;                         
    canInteract: () => boolean;                  
    onInteract: () => void;
}

export class InteractionManager {
    private list: Interactable[] = [];
    private current: Interactable | null = null;
    private prompt: Phaser.GameObjects.Text;
    private keyE: Phaser.Input.Keyboard.Key;
    private cooldownUntil = 0;

    constructor(
        private scene: Phaser.Scene,
        private getPlayer: () => { x: number; y: number },
        // dialogue open, journal open, cutscene playing, etc. blocks all interaction.
        private isBlocked: () => boolean,
    ) {
        // prompt floats above the interactable. 
        // bottom-centre sits on anchor point
        this.prompt = scene.add.text(0, 0, '', {
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#fff7e0',
            backgroundColor: '#000000cc',
            padding: { x: 5, y: 2 },
        })
            .setDepth(9500)      
            .setOrigin(0.5, 1)
            .setVisible(false);

    
        this.keyE = scene.input.keyboard!.addKey('E');
        this.keyE.on('down', () => this.tryInteract());
    }

    // -------------------------------
    // REGISTER
    // -------------------------------
    register(i: Interactable) { this.list.push(i); }
    unregister(id: string) { this.list = this.list.filter(x => x.id !== id); }

    // -----------------------------------------------------------------------------------
    // UPDATE LOOP
    // call from scene update() every frame. decides which interactable is closest,
    // shows prompt, fires onInteract() on E press.
    // -----------------------------------------------------------------------------------
    update() {
        
        if (this.isBlocked()) {
            this.current = null;
            this.prompt.setVisible(false);
            return;
        }

        const p = this.getPlayer();
        let best: Interactable | null = null;
        let bestD = Infinity;

        for (const it of this.list) {
            if (!it.canInteract()) continue;       
            const q = it.getPosition();
            const d = Phaser.Math.Distance.Between(p.x, p.y, q.x, q.y);
            if (d > it.radius) continue;            // too far

            // priority wins ties. closer wins otherwise.
            // stops doorway prompt drowning out "elder STANDING IN DOORWAY"
            if (!best || it.priority > best.priority || (it.priority === best.priority && d < bestD)) {
                best = it;
                bestD = d;
            }
        }

        this.current = best;

        if (best) {
            const q = best.getPosition();
            // read zoom EVERY frame.
            // cache it camera zooms later  
            const zoom = this.scene.cameras.main.zoom;
            this.prompt
                .setText(best.prompt())
                .setScale(1 / zoom)               // counter-scale for readability
                .setPosition(q.x, q.y - 14)
                .setVisible(true);
        } else {
            this.prompt.setVisible(false);
        }
    }

    // -------------------------------
    // PRESS E
    // -------------------------------
    private tryInteract() {
        if (this.isBlocked()) return;
        if (!this.current) return;

        // 200ms debounce. keyboards double-fire. 

        if (this.scene.time.now < this.cooldownUntil) return;
        this.cooldownUntil = this.scene.time.now + 200;

        this.current.onInteract();
    }

    // -------------------------------
    // CLEANUP
    // -------------------------------
    // call from scene shutdown. otherwise key binding leaks into
    // other scenes and E starts firing the wrong manager. fun.
    destroy() {
        this.keyE.removeAllListeners();
        this.prompt.destroy();
    }
}