import type { DialogueScript } from './DialogueManager';
import { QUEST_MAIN_1 } from './questions';

export const ELDER_SCRIPT: DialogueScript = {
    id: 'elder',

    entry: (gs) => {
        const q = gs.question(QUEST_MAIN_1.id);

        if (!q) return 'first_meet';
        if (q.status === 'completed') return 'post_quest';

        const returnObj = q.objectives.find(
            o => o.id === 'return_elder'
        );

        if (returnObj?.done) return 'post_quest';

        const inspectObj = q.objectives.find(
            o => o.id === 'inspect_smithy'
        );

        if (inspectObj?.done) return 'clue_found';

        return 'quest_active';
    },

    nodes: {
        first_meet: {
            id: 'first_meet',
            speaker: 'Elder Kaen',
            title: 'Village Elder',
            text: 'Hey. Hold up. You are not from here, are you.',
            next: 'first_meet_2',
        },

        first_meet_2: {
            id: 'first_meet_2',
            speaker: 'Elder Kaen',
            text: 'Six nights ago, four of our people vanished into thin air. No blood. No tracks. Nothing but strange markings in the snow... and the eerie sound of a bell echoing from the old shrine.',
            next: 'first_meet_3',
        },

        first_meet_3: {
            id: 'first_meet_3',
            speaker: 'Elder Kaen',
            text: 'I have watched this mountain claim too many lives. I refuse to lose anyone else to the shadows...',
            choices: [
                {
                    text: 'Tell me where to start. I will bring them back.',
                    next: 'accept_quest',
                },
                {
                    text: 'You speak as if a demon is hunting us.',
                    next: 'ask_afraid',
                },
            ],
        },

        ask_afraid: {
            id: 'ask_afraid',
            speaker: 'Elder Kaen',
            text: 'Because it is. Whatever is out there... it does not have a human face. It does not leave human tracks. Toma, our blacksmith, was the last one to actually see it. His forge is east of the market.',
            next: 'accept_quest',
        },

        accept_quest: {
            id: 'accept_quest',
            speaker: 'Elder Kaen',
            text: 'Find Toma\'s smithy. Look for whatever he left behind. And kid — do NOT ring that shrine bell. No matter what you hear.',
            onEnter: (gs) => {
                if (!gs.question(QUEST_MAIN_1.id)) {
                    gs.startQuestion(QUEST_MAIN_1);

                    gs.addObjective(
                        QUEST_MAIN_1.id,
                        'speak_elder',
                        {
                            id: 'speak_elder',
                            description: 'Speak with Elder Kaen about the missing villagers.',
                            done: true,
                        }
                    );

                    gs.addJournal({
                        id: 'j_main1_start',
                        title: 'A Stranger in the Snow',
                        body: 'Four villagers vanished six nights ago. Elder Kaen thinks Toma the blacksmith might have seen something.',
                        date: new Date().toISOString().slice(0, 10),
                        kind: 'question',
                    });
                }
            },
        },

        quest_active: {
            id: 'quest_active',
            speaker: 'Elder Kaen',
            text: 'The smithy is east of the market. Toma was stubborn, but he never left a job half-finished. Whatever he saw — it is still in that forge.',
        },

        clue_found: {
            id: 'clue_found',
            speaker: 'Elder Kaen',
            text: 'You made it back. Wait — what is that? That paper. Where did you get that?',
            choices: [
                {
                    text: 'Inside Toma\'s smithy. Read it yourself.',
                    next: 'clue_reveal',
                },
            ],
        },

        clue_reveal: {
            id: 'clue_reveal',
            speaker: 'Elder Kaen',
            text: '...No. That is Toma\'s handwriting. "They came from the shrine. Do not ring the bell." Not again. Not after all these years.',
            onEnter: (gs) => {
                gs.addObjective(
                    QUEST_MAIN_1.id,
                    'return_elder',
                    {
                        id: 'return_elder',
                        description: 'Take Toma\'s note to Elder Kaen.',
                        done:true ,
                    }
                );

                gs.addJournal({
                    id: 'j_main1_done',
                    title: 'A Stranger in the Snow — The Warning',
                    body: 'Toma left a warning about the old shrine. Elder Kaen clearly knows more than he is letting on.',
                    date: new Date().toISOString().slice(0, 10),
                    kind: 'story',
                });
            },
        },

        post_quest: {
            id: 'post_quest',
            speaker: 'Elder Kaen',
            text: 'The truth is finally clawing its way out of the snow. But this mountain is far from done with us.\n\nSeek out the shrine caretaker. And traveler... if you hear three bells tonight, do NOT look back.',
        },
    },
};

export const LETTER_SCRIPT: DialogueScript = {
    id: 'letter',
    entry: () => 'read_letter',
    nodes: {
        read_letter: {
            id: 'read_letter',
            speaker: 'Mysterious Letter',
            title: 'Parchment and Wax',
            text: 'To whoever finds this...\n\nThe mountain path is no longer safe. I saw something moving between the trees after midnight. It had too many eyes.\n\nIf the lantern near the northern bridge is still burning, do not follow its light.\n\n— An unknown villager',
        }
    }
};