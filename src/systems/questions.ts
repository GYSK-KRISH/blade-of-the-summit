import type { Question } from './GameState';

export const QUEST_MAIN_1: Omit<Question, 'status'> = {
    id: 'main_1',
    title: 'A Stranger in the Snow',
    objectives: [
        { id: 'speak_elder',   description: 'Speak with Elder Kaen', done: false },
        { id: 'inspect_smithy', description: 'Investigate the smithy', done: false },
        { id: 'return_elder',  description: 'Return to Elder Kaen',  done: false },
    ],
};