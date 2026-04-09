export type LevelQuestion = {
  id: number;
  title: string;
  description: string;
  hint: string;
  passcode: string;
  revealNumber: number;
};

export const QUESTION_BANK: Record<number, LevelQuestion> = {
  1: {
    id: 1,
    title: 'Ground Floor',
    description: 'On the Ground Floor, where vigilance never sleeps and every entry is silently observed.',
    hint: 'Find the QR code at this location. Scan it and enter the passcode to unlock the next level.',
    passcode: 'AI-SECURE-101',
    revealNumber: 16,
  },
  2: {
    id: 2,
    title: '3rd Floor',
    description: 'On the 3rd Floor, where energy is refilled and conversations quietly fuel ideas.',
    hint: 'Find the QR code at this location. Scan it and enter the passcode to unlock the next level.',
    passcode: 'NEURAL-BOOST-303',
    revealNumber: 18,
  },
  3: {
    id: 3,
    title: '2nd Floor',
    description: 'On the 2nd Floor, a space of comfort where thoughts sink before they rise stronger.',
    hint: 'Find the QR code at this location. Scan it and enter the passcode to unlock the next level.',
    passcode: 'DEEP-MIND-202',
    revealNumber: 1,
  },
  4: {
    id: 4,
    title: '5th Floor',
    description: 'On the 5th Floor, where first impressions are crafted and every arrival is acknowledged.',
    hint: 'Find the QR code at this location. Scan it and enter the passcode to unlock the next level.',
    passcode: 'ELEVATE-505',
    revealNumber: 11,
  },
  5: {
    id: 5,
    title: '4th Floor',
    description: 'On the 4th Floor, where information rests quietly, waiting to be discovered.',
    hint: 'Find the QR code at this location. Scan it and enter the passcode to complete the challenge.',
    passcode: 'FINAL-KEY-404',
    revealNumber: 25,
  },
};

// Eight fixed shuffle patterns for level slots 1-4 (level 5 is always question 5).
export const QUESTION_SHUFFLES: number[][] = [
  [1, 2, 3, 4],
  [1, 3, 2, 4],
  [2, 1, 4, 3],
  [2, 4, 1, 3],
  [3, 1, 4, 2],
  [3, 4, 2, 1],
  [4, 2, 1, 3],
  [4, 3, 1, 2],
];

export function getQuestionOrderForSlot(slot: number): number[] {
  const safeSlot = ((slot % QUESTION_SHUFFLES.length) + QUESTION_SHUFFLES.length) % QUESTION_SHUFFLES.length;
  return [...QUESTION_SHUFFLES[safeSlot], 5];
}

export function getQuestionIdForLevel(level: number, questionOrder: number[]) {
  return questionOrder[level - 1];
}
