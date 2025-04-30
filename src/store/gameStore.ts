import { create } from 'zustand';

// 캐릭터 상태 정의
export type Character = {
    id: number;
    name: string;
    image: string;
    skillImage?: string;
    objectImage?: string;
    x: number;
    y: number;
    speed: number;
    isFinished: boolean;
    isUsingSkill?: boolean;
    skillEndTime?: number;
    hasShield?: boolean;
    isFrozen?: boolean;
    isSlowed?: boolean;
    isBlocked?: boolean;
    blockEndTime?: number;
    isSpinning?: boolean;
    spinEndTime?: number;
    isStunned?: boolean;
    stunEndTime?: number;
};

export type SkillObject = {
    id: number;
    ownerId: number;
    image: string;
    x: number;
    y: number;
    speed: number;
    effect: "slow" | "block" | "freeze" | "spin" | "stun";
    duration: number;
    createdAt: number;
    targetId?: number;
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

    // ✅ 캐릭터 업데이트 (ranking은 유지)
    setCharacters: (chars) =>
        set((state) => ({
            characters: chars,
            ranking: state.ranking,
            objects: state.objects,
        })),

    // 위치 갱신
    updateX: (id, x) =>
        set((state) => ({
            characters: state.characters.map((c) =>
                c.id === id ? { ...c, x } : c
            ),
        })),

    // 결승 처리
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

    // 게임 전체 리셋 (이건 ranking도 같이 초기화)
    resetCharacters: () =>
        set({ characters: [], ranking: [], objects: [] }),

    // 오브젝트 설정
    setObjects: (objects) =>
        set({ objects }),
}));
