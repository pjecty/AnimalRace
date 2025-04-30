const characterImages = [
    "tiger",
    "dog",
    "panda",
    "cat",
    "fox",
    "lion",
    "rabbit",
    "sheep",
    "penguin",
    "monkey",
];

import { useState } from "react";
import NameInputForm from "./components/NameInputForm";
import GameCanvas from "./components/GameCanvas";
import { useGameStore } from "./store/gameStore";

function App() {
    const [started, setStarted] = useState(false);
    const setCharacters = useGameStore((state) => state.setCharacters);
    const resetCharacters = useGameStore((state) => state.resetCharacters);

    const needsObject = (name: string) => ["dog", "monkey", "penguin"].includes(name.toLowerCase());

    const handleStart = (names: string[]) => {
        const images = [...characterImages].sort(() => Math.random() - 0.5);

        const chars = names.map((name, index) => {
            const characterKey = images[index % images.length];
            return {
                id: index,
                name,
                image: `/assets/characters/${characterKey}.png`,
                skillImage: `/assets/characters/${characterKey}_skill.png`,
                objectImage: needsObject(characterKey) ? `/assets/characters/${characterKey}_skill_object.png` : undefined,
                x: 0,
                speed: 1,
                y: 35 + index * 44,
                // 0.7 ~ 1.0 사이의 랜덤 속도
                // speed: Math.random() * 0.3 + 0.7,
                // speed: characterKey === "penguin" ? 1.2 : 1,
                isFinished: false,
            };
        });

        setCharacters(chars);
        setStarted(true);
    };

    const handleReset = () => {
        resetCharacters();
        setStarted(false); // 다시 이름 입력 화면으로
    };

    return (
        <div>
            {!started ? (
                <NameInputForm onStart={handleStart} />
            ) : (
                <GameCanvas onReset={handleReset} />
            )}
        </div>
    );
}

export default App;
