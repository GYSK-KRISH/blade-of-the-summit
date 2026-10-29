import Phaser from 'phaser';

/* -----------------------------------------------------------
 * GameState - the single hare brain cell
 * 
 * Every system (HUD, dialogue, quests, the guide arrow, the
 * interiors scene) 
 * 
 * we are not doing that arc. it's not even a good arc. it's a
 * filler episode and we are NOT in filler seasona as per demon slayer 
 * 
 *  lives on the scene registry so it survives scene swaps.
 *  it is the single source of truth for the state of the game.
 * if you ever catch yourself doing `this.qState = ...` anywhere
 * else in the codebase, please come back and read this comment again.
 * we're not doing that. it's not the vibe.
 * 
 *  
 * ----------------------------------------------------------- */


export type QuestionStatus = 'locked' | 'active' | 'completed'
// locked = not handed to player yet
// answered = he will get answered 
// active = he will be on it
// completed = done, move on

export interface QuestionObjective { id: string; description: string; done: boolean; }

export interface Question {
    id: string;
    title: string;
    status: QuestionStatus;
    objectives: QuestionObjective[];
}

// journal = player's memory. if it's not in here, player forgot
// it happened 5 min later. put everything here. everything.
export interface JournalEntry {
    id: string;
    title: string;
    body: string;
    date: string;
    kind : 'clue' | 'character' | 'question' | 'story';
}

// add a field ,bump version ,handle old saves in fromJSON.
// corrupt save should NEVER brick the game. rule 1.
export interface GameStateData {
    version: 1;
    questions: Record<string, Question>;
    journal: JournalEntry[];
    flags: Record<string, boolean>;
    tutorialSteps: Record<string, boolean>;
    chapter: number;
}


// the state of a fresh boot. no quests, no flags, no memories
const DEFAULT_STATE : GameStateData = {
    version: 1,
    questions: {},
    journal: [],
    flags: {},
    tutorialSteps: {},
    chapter: 1,
}

export class GameState extends Phaser.Events.EventEmitter {
    private data : GameStateData =structuredClone(DEFAULT_STATE);

     // grab the shared one or make one. don't `new GameState()` yourself.
     //  // two states = two truths = bad time.
    static fromRegistry(scene: Phaser.Scene) : GameState {
        let gs = scene.registry.get('gameState') as GameState;
        if (!gs) {
            gs = new GameState();
            scene.registry.set('gameState', gs);
        }
        return gs;
    }


    // read-only view for the journal UI, debug dumps
    get raw(): Readonly<GameStateData> { return this.data; }

    //-------------------------------
    // FLAGS
    //-------------------------------
    // he can seen ,without a whole quest

    flag(key: string): boolean{ 
        return !!this.data.flags[key]; 
    }



    setFlag(key: string, on = true) {
    // no-op if nothing changed. avoids spamming HUD re-renders
        if (this.data.flags[key] === on) return;
        this.data.flags[key] = on;
        this.emit('changed', { type: 'flag', key });
    } 

    // QUESTIONS

    question(id: string) : Question | undefined {
        return this.data.questions[id];
    }

    startQuestion(def: Omit<Question,'status'>) {
        if (this.data.questions[def.id]) 
            return;
        this.data.questions[def.id] = { ...def, status: 'active' };
        this.emit('changed', { type: 'question-started', id: def.id });
    }

    // no-op if already exists. so elder's dialogue can call this
    // every time he's talked to without duping. safe to spam.
    addObjective(questionId: string, objId: string, objective: QuestionObjective) {
        const q = this.data.questions[questionId];
        if (!q) 
            return;
        const obj = q.objectives.find(o => o.id === objId);
        if (!obj || obj.done) return; // idempotent. click twice? nothing happens.
        obj.done = true;
        this.emit('changed', { type: 'objective-done', questionId: questionId, objId });
        if (q.objectives.every(o => o.done)) {
        q.status = 'completed';
        this.emit('changed', { type: 'question-completed', id: questionId });
        }
    }


    //-------------------------------
    // JOURNAL
    //-------------------------------

    // dedupes by id. onEnter runs twice. always. don't ask why.
    // this line is why you don't get doubled journal entries
    addJournal(e: JournalEntry) {
        if(this.data.journal.some(j => j.id === e.id))
            return;
        this.data.journal.push(e);
        this.emit('changed', { type: 'journal-entry', id: e.id });
    }


    //-------------------------------
    // TUTORIAL
    //-------------------------------

    //press SPACE to talk 
    markTutorial(step: string) {
    if (this.data.tutorialSteps[step])
        return;
    this.data.tutorialSteps[step] = true;
    this.emit('changed', { type: 'tutorial', step });
    }

    tutorialDone(step: string): boolean { return !!this.data.tutorialSteps[step]; }


    //-------------------------------
    // GUIDE ARROW
    //-------------------------------

    //arrow calls this every frame

    currentObjective(): { questId: string; objectiveId: string; description: string } | null {
    for (const q of Object.values(this.data.questions)) {
        if (q.status !== 'active') continue;
        const next = q.objectives.find(o => !o.done);
        if (next) return { questId: q.id, objectiveId: next.id, description: next.description };
    }
    return null;
     // nothing to point at → arrow hides
    }
}