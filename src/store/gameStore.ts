import { create } from 'zustand';

// 캐릭터 상태에 블록 기능을 위한 필드 추가
export type Character = {
    id: number;
    name: string;
    image: string;
    skillImage?: string;
    objectImage?: string;
    x: number;
    speed: number;
    isFinished: boolean;
    // 스킬 사용 상태
    isUsingSkill?: boolean;
    skillEndTime?: number;
    // 상태 효과
    hasShield?: boolean;
    isFrozen?: boolean;
    isSlowed?: boolean;
    // 얼음벽(block) 상태
    isBlocked?: boolean;
    blockEndTime?: number;
    originalSpeed?: number;
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

    // 캐릭터 초기화 (reset 포함)
    setCharacters: (chars) => set({ characters: chars, ranking: [], objects: [] }),

    // x 좌표 업데이트
    updateX: (id, x) =>
        set((state) => ({
            characters: state.characters.map((c) =>
                c.id === id ? { ...c, x } : c
            ),
        })),

    // 결승 처리 및 순위 추가
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

    // 스토어 초기화
    resetCharacters: () => set({ characters: [], ranking: [], objects: [] }),

    // 스킬 오브젝트 설정
    setObjects: (objects) => set({ objects }),
}));
