import { create } from 'zustand';

export type Character = {
    id: number;
    name: string;
    image: string;
    skillImage?: string;
    objectImage?: string;
    x: number;
    speed: number;
    isFinished: boolean;
    isUsingSkill?: boolean;
    skillEndTime?: number;
    hasShield?: boolean;
    isFrozen?: boolean;
    isSlowed?: boolean;
};

export type SkillObject = {
    id: number;
    ownerId: number;
    image: string;
    x: number;
    y: number;
    speed: number;
    effect: "slow" | "block" | "freeze";
    duration: number;
    createdAt: number;
};

type GameState = {
    characters: Character[];
    ranking: string[];
    objects: SkillObject[];
    setCharacters: (chars: Character[]) => void;
    updateX: (id: number, x: number) => void;
    markFinished: (id: number) => void;
    resetCharacters: () => void;
    setObjects: (objects: SkillObject[]) => void;
};

export const useGameStore = create<GameState>((set) => ({
    characters: [],
    ranking: [],
    objects: [],
    setCharacters: (chars) => set({ characters: chars, ranking: [], objects: [] }),
    updateX: (id, x) =>
        set((state) => ({
            characters: state.characters.map((c) => (c.id === id ? { ...c, x } : c)),
        })),
    markFinished: (id) =>
        set((state) => {
            const char = state.characters.find((c) => c.id === id);
            if (!char || char.isFinished) return {};
            return {
                characters: state.characters.map((c) =>
                    c.id === id ? { ...c, isFinished: true } : c
                ),
                ranking: [...state.ranking, char.name],
            };
        }),
    resetCharacters: () => set({ characters: [], ranking: [], objects: [] }),
    setObjects: (objects) => set({ objects }),
}));