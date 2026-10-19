import type Phaser from 'phaser';

// ─────────────────────────────────────────────────────────────────────────────
// DIRECTIONS
// ─────────────────────────────────────────────────────────────────────────────

export type FacingDirection = 'down' | 'up' | 'left' | 'right';

export const DIRECTION_VECTORS: Record<FacingDirection, { x: number; y: number }> = {
    down:  { x: 0,  y: 1  },
    up:    { x: 0,  y: -1 },
    left:  { x: -1, y: 0  },
    right: { x: 1,  y: 0  }
};

export function oppositeDirection(dir: FacingDirection): FacingDirection {
    switch (dir) {
    case 'down': return 'up';
    case 'up': return 'down';
    case 'left': return 'right';
    case 'right': return 'left';
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE MACHINE
// ─────────────────────────────────────────────────────────────────────────────

export enum PlayerState {
    IDLE = 'IDLE',
    WALKING = 'WALKING',
    ATTACKING = 'ATTACKING',
    DASHING = 'DASHING',
    DODGING = 'DODGING',
    CASTING = 'CASTING',    // breathing form mid-cast
    HIT = 'HIT',            // brief stun
    STAGGERED = 'STAGGERED',// longer recovery, chainable into counter
    DEAD = 'DEAD'
}

export enum EnemyState {
    IDLE = 'IDLE',
    PATROL = 'PATROL',
    AGGRO = 'AGGRO',
    CHASE = 'CHASE',
    WINDUP = 'WINDUP',
    ATTACK = 'ATTACK',
    RECOVERY = 'RECOVERY',
    STAGGERED = 'STAGGERED',
    DEAD = 'DEAD'
}

// ─────────────────────────────────────────────────────────────────────────────
// HITBOXES
// ─────────────────────────────────────────────────────────────────────────────

export interface HitboxOffset {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type HitboxShape = 'rect' | 'circle' | 'arc';

export interface HitboxDef extends HitboxOffset {
  shape?: HitboxShape;   // default 'rect'
  radius?: number;       // required if shape === 'circle'
  arcDegrees?: number;   // required if shape === 'arc'
}

// ─────────────────────────────────────────────────────────────────────────────
// BREATHING STYLES & BLADE COLORS  (the Demon Slayer core)
// ─────────────────────────────────────────────────────────────────────────────

export type BreathingStyleId =
    | 'fire'  | 'water' | 'flame' | 'thunder' | 'wind' | 'stone'
    | 'mist'  | 'insect'| 'serpent'| 'love' | 'sound'
    | 'moon'  | 'sun';

export type BladeColor =
    | 'black'    // Sun Breathing — the protagonist's blade
    | 'blue'     // Water
    | 'red'      // Flame
    | 'yellow'   // Thunder
    | 'green'    // Wind
    | 'white'    // Mist
    | 'lavender' // Insect
    | 'indigo'   // Serpent
    | 'pink'     // Love
    | 'uncolored';

export interface NichirinBlade {
  id: string;
  color: BladeColor;
  style: BreathingStyleId;
  level: number;           // 1..5
  damageBonus: number;     // flat
  guardianName?: string;   // e.g. 'Hotaru Haganezuka' for flavor
}

// ─────────────────────────────────────────────────────────────────────────────
// BREATHING FORMS (the numbered techniques)
// ─────────────────────────────────────────────────────────────────────────────

export type FormEffectType = 'burn' | 'shock' | 'poison' | 'freeze' | 'bleed';

export interface BreathingForm {
  id: string;                // e.g. 'water-01'
  styleId: BreathingStyleId;
  formNumber: number;        // 1..N within the style
  name: string;              // e.g. 'Water Surface Slash'
  description?: string;
  staminaCost: number;
  cooldownMs: number;
  damage: number;
  hitbox: HitboxDef;
  windupMs: number;
  activeMs: number;
  recoveryMs: number;
  knockback: number;
  effect?: FormEffectType;
  chainTo?: string[];        // form ids this can combo into
  iframesMs?: number;        // hard-coded invulnerability window (e.g. Water Wheel)
}

// ─────────────────────────────────────────────────────────────────────────────
// DAMAGE & HIT RESOLUTION
// ─────────────────────────────────────────────────────────────────────────────

export interface DamageInfo {
  amount: number;
  sourceFormId: string;      // form id or 'basic'
  attackerFacing: FacingDirection;
  effect?: FormEffectType;
  knockback: number;
  isCrit: boolean;
}

export type DamageResult = 'hit' | 'blocked' | 'parried' | 'immune' | 'missed';

export interface HitEvent {
  target: Phaser.GameObjects.GameObject;
  damage: DamageInfo;
  result: DamageResult;
  /** world coords for floating damage numbers */
  worldX: number;
  worldY: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS EFFECTS (burn from Flame, shock from Thunder, poison from Insect…)
// ─────────────────────────────────────────────────────────────────────────────

export interface StatusEffect {
  type: FormEffectType;
  durationMs: number;
  remainingMs: number;
  tickDamage?: number;       // damage per second if applicable
  stackable: boolean;
  stacks: number;            // 0 when absent, 1..N when active
}

// ─────────────────────────────────────────────────────────────────────────────
// COMBAT STATS
// ─────────────────────────────────────────────────────────────────────────────

export interface CombatStats {
  maxHp: number;
  hp: number;
  maxStamina: number;
  stamina: number;
  staminaRegenPerSec: number;
  attack: number;
  defense: number;
  moveSpeed: number;         // px/sec in world space
  poise: number;             // stagger resistance
}

// ─────────────────────────────────────────────────────────────────────────────
// DODGE / DASH / PARRY WINDOWS
// ─────────────────────────────────────────────────────────────────────────────

export interface DodgeDef {
  distance: number;          // px
  durationMs: number;
  iframesMs: number;         // must be <= durationMs
  cooldownMs: number;
  staminaCost: number;
}

export interface ParryWindow {
  /** ms before an incoming hit that the parry must be pressed */
  perfectWindowMs: number;
  /** cooldown after a successful parry */
  cooldownMs: number;
  staminaReward: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMONS & AI
// ─────────────────────────────────────────────────────────────────────────────

export enum DemonTier {
  MINION = 'MINION',             // basic fodder
  LOWER_MOON = 'LOWER_MOON',     // numbered lower-rank
  UPPER_MOON = 'UPPER_MOON',     // numbered upper-rank boss
  DEMON_KING = 'DEMON_KING'      // final boss tier
}

export interface DemonAttackDef {
  id: string;
  name: string;
  damage: number;
  windupMs: number;
  activeMs: number;
  recoveryMs: number;
  range: number;             // px, used for AI decision
  hitbox: HitboxDef;
  bloodDemonArt?: string;
}

export interface DemonDef {
  id: string;
  name: string;
  tier: DemonTier;
  stats: CombatStats;
  attacks: DemonAttackDef[];
  aggroRange: number;
  attackRange: number;
  bloodDemonArt?: string;    // flavor + effect id
  xpReward: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESSION (Demon Slayer Corps ranks)
// ─────────────────────────────────────────────────────────────────────────────

export type SlayerRank =
  | 'mizunoto' | 'mizunoe'
  | 'kanoe'    | 'kanoto'
  | 'tsuchinoto' | 'tsuchinoe'
  | 'hinoto'   | 'hinoe'
  | 'kinoto'   | 'kinoe'
  | 'hashira';

export const SLAYER_RANK_ORDER: SlayerRank[] = [
  'mizunoto', 'mizunoe', 'kanoe', 'kanoto', 'tsuchinoto',
  'tsuchinoe', 'hinoto', 'hinoe', 'kinoto', 'kinoe', 'hashira'
];