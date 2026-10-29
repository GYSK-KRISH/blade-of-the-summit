import Phaser from 'phaser';
import type { GameState } from './GameState';


/* -----------------------------------------------------------
 *  GuideArrow — "where do I go next?"
 * 
 *  points at the current objective.
 * off-screen -> clamps to screen edge + shows distance.
 * no objective -> arrow hides. no clutter.
 * 
 * 
 * ---------------------------------------------------------- */



export type TargetResolver =
    (questId: string, objectiveId: string) => { x: number; y: number } | null;

export class GuideArrow {
    private arrow: Phaser.GameObjects.Triangle;
    private distText: Phaser.GameObjects.Text;
    private targets: Record<string, TargetResolver> = {};
    private hidden = false;

    constructor(
        private scene: Phaser.Scene,
        private gs: GameState,
        private getPlayer: () => { x: number; y: number },
    ) {
        //1.arrow
        // small pulsing gold triangle. not too big — this isn't a
        // tutorial mobile game. just enough to notice. 🗿
        this.arrow = scene.add.triangle(0, 0, 0, 0, 12, 6, 0, 14, 0xffe27a)
            .setScrollFactor(0)
            .setDepth(9200)
            .setAlpha(0.9)
            .setVisible(false);

        //2.distance text
        // "42m" under the arrow. small font so it doesn't fight HUD.
        this.distText = scene.add.text(0, 0, '', {
            fontFamily: 'monospace',
            fontSize: '9px',
            color: '#ffe27a',
        })
            .setScrollFactor(0)
            .setDepth(9200)
            .setOrigin(0.5, 0)
            .setVisible(false);
    }

    // register a resolver per objective. Level0 sets these up once
    // after registering interactables.
    // eg: registerTarget('main_1', 'speak_elder', () => elderPos)
    registerTarget(questId: string, objId: string, resolver: TargetResolver) {
        this.targets[`${questId}:${objId}`] = resolver;
    }

    setHidden(h: boolean) { this.hidden = h; }

    update() {
        // no quest -> no arrow. don't hover over the player doing nothing
        if (this.hidden) { this.hide(); return; }

        const cur = this.gs.currentObjective();
        if (!cur) { this.hide(); return; }

        // no resolver for THIS objective -> hide. safe fallback
        const resolver = this.targets[`${cur.questId}:${cur.objectiveId}`];
        if (!resolver) { this.hide(); return; }

        const target = resolver(cur.questId, cur.objectiveId);
        if (!target) { this.hide(); return; }

        //3.camera + player
        const cam = this.scene.cameras.main;
        const zoom = cam.zoom;
        const view = cam.worldView;
        const p = this.getPlayer();

        //4.on-screen or edge?
        const onScreen =
            target.x >= view.x && target.x <= view.right &&
            target.y >= view.y && target.y <= view.bottom;

        const angle = Phaser.Math.Angle.Between(p.x, p.y, target.x, target.y);
        let ax: number, ay: number;

        if (onScreen) {
            // above the target. offset -20 so it doesn't cover a name tag
            ax = target.x;
            ay = target.y - 20;
        } else {
            // clamp to screen edge, pointing outward
            // math: project the angle onto the rectangle formed by view bounds
            const cx = view.centerX;
            const cy = view.centerY;
            const halfW = view.width / 2 - 18;
            const halfH = view.height / 2 - 18;
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            const scale = Math.min(
                Math.abs(halfW / (dx || 1e-6)),
                Math.abs(halfH / (dy || 1e-6)),
            );
            ax = cx + dx * scale;
            ay = cy + dy * scale;
        }

        //5.world screen-space
        // multiply by zoom because scrollFactor(0) still gets zoomed.
        // forget this arrow is 3px tall on your first playtest 💀
        this.arrow
            .setPosition(ax * zoom, ay * zoom)
            .setScale(1 / zoom)
            .setRotation(angle + Math.PI / 2)
            .setVisible(true);

        //6.distance label
        // world px. divide by 16 if you want tiles. keeping px for now.
        const dist = Math.round(Phaser.Math.Distance.Between(p.x, p.y, target.x, target.y));
        this.distText
            .setText(`${dist}m`)
            .setScale(1 / zoom)
            .setPosition(ax * zoom, (ay + 12) * zoom)
            .setVisible(true);
    }

    private hide() {
        this.arrow.setVisible(false);
        this.distText.setVisible(false);
    }

    destroy() {
        this.arrow.destroy();
        this.distText.destroy();
    }
}