import { useEffect, useRef, useState } from "react";
import { Application, Sprite, Texture } from "pixi.js";
import { Loader } from "@pixi/loaders";
import { useGameStore } from "../store/gameStore";

// 타입 정의
type Props = {
    onReset: () => void;
};

const GameCanvas = ({ onReset }: Props) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [gameOver, setGameOver] = useState(false);
    const characters = useGameStore((state) => state.characters);
    const ranking = useGameStore((state) => state.ranking);
    const updateX = useGameStore((state) => state.updateX);
    const markFinished = useGameStore((state) => state.markFinished);
    const setCharacters = useGameStore((state) => state.setCharacters);
    const setObjects = useGameStore((state) => state.setObjects);

    useEffect(() => {
        const app = new Application({
            width: 1000,
            height: 400,
            backgroundColor: 0xffffff,
        });

        if (canvasRef.current) {
            canvasRef.current.innerHTML = "";
            canvasRef.current.appendChild(app.view as HTMLCanvasElement);
        }

        const loader = new Loader();
        loader.add("track", "/assets/backgrounds/track.png");

        characters.forEach((char) => {
            const key = `${char.name}-${char.id}`;
            loader.add(key, char.image);
            if (char.skillImage) loader.add(`${key}-skill`, char.skillImage);
            if (char.objectImage) loader.add(`${key}-object`, char.objectImage);
        });

        const sprites: Record<number, Sprite> = {};

        loader.load((_, resources) => {
            const bgTexture = resources["track"]?.texture;
            if (bgTexture) {
                const bgSprite = new Sprite(bgTexture as unknown as Texture);
                bgSprite.width = 1000;
                bgSprite.height = 400;
                app.stage.addChild(bgSprite);
            }

            characters.forEach((char, index) => {
                const key = `${char.name}-${char.id}`;
                const texture = resources[key]?.texture;
                if (!texture) return;

                const sprite = new Sprite(texture as unknown as Texture);
                sprite.x = char.x;
                sprite.y = 35 + index * 44;
                sprite.width = 50;
                sprite.height = 50;

                app.stage.addChild(sprite);
                sprites[char.id] = sprite;
            });

            let tick = 0;

            app.ticker.add(() => {
                tick += 0.1;
                const now = Date.now();
                let latestCharacters = useGameStore.getState().characters;
                const latestRanking = useGameStore.getState().ranking;
                let newObjects = useGameStore.getState().objects || [];

                latestCharacters = latestCharacters.map((char) => {
                    const sprite = sprites[char.id];
                    if (!sprite) return char;

                    const baseY = 35 + char.id * 44;

                    if (char.isUsingSkill && char.skillEndTime && now > char.skillEndTime) {
                        char.isUsingSkill = false;
                    }

                    const textureKey = char.isUsingSkill && char.skillImage
                        ? `${char.name}-${char.id}-skill`
                        : `${char.name}-${char.id}`;
                    const newTexture = resources[textureKey]?.texture;
                    if (newTexture && sprite.texture !== (newTexture as unknown as Texture)) {
                        sprite.texture = newTexture as unknown as Texture;
                    }

                    let speed = char.speed;
                    if (char.isSlowed) speed *= 0.5;
                    if (char.isFrozen) speed = 0;

                    const newX = sprite.x + speed;
                    sprite.rotation = Math.sin(tick * 2 + char.id) * 0.1;

                    if (!char.isFinished) {
                        if (newX >= 900) {
                            sprite.x = 900;
                            sprite.y = baseY;
                            updateX(char.id, 900);
                            markFinished(char.id);
                        } else {
                            sprite.x = newX;
                            sprite.y = baseY;
                            updateX(char.id, newX);
                        }
                    }

                    if (Math.random() < 0.05 && !char.isUsingSkill && char.skillImage) {
                        char.isUsingSkill = true;
                        char.skillEndTime = now + 2000;

                        if (char.objectImage) {
                            newObjects.push({
                                id: Math.random(),
                                ownerId: char.id,
                                image: char.objectImage,
                                x: sprite.x,
                                y: sprite.y,
                                speed: 2,
                                effect: "slow",
                                duration: 2000,
                                createdAt: now,
                            });
                        }
                    }

                    return char;
                });

                // 게임 종료 체크
                if (!gameOver && latestRanking.length === latestCharacters.length) {
                    setGameOver(true);
                }

                newObjects = newObjects.filter((obj) => now < obj.createdAt + obj.duration);

                newObjects = newObjects.filter((obj) => {
                    const target = latestCharacters.find((c) =>
                        c.id !== obj.ownerId &&
                        !c.isFinished &&
                        Math.abs(sprites[c.id]?.x - obj.x) < 30 &&
                        Math.abs(sprites[c.id]?.y - obj.y) < 30
                    );

                    if (target) {
                        if (!target.hasShield) {
                            if (obj.effect === "slow") target.isSlowed = true;
                            if (obj.effect === "freeze") target.isFrozen = true;
                        }
                        return false;
                    }

                    return true;
                });

                newObjects.forEach((obj) => {
                    let tex: Texture | undefined;
                    try {
                        tex = Texture.from(obj.image);
                    } catch {
                        console.warn("🚨 오브젝트 이미지 로드 실패:", obj.image);
                        return;
                    }

                    if (!tex) return;

                    const sprite = new Sprite(tex);
                    obj.x += obj.speed;
                    sprite.x = obj.x;
                    sprite.y = obj.y;
                    sprite.width = 40;
                    sprite.height = 40;
                    app.stage.addChild(sprite);
                });

                setObjects(newObjects);
                setCharacters(latestCharacters);
            });
        });

        return () => {
            app.destroy(true, true);
        };
    }, [gameOver]);

    return (
        <div>
            <div ref={canvasRef}></div>
            {gameOver && ranking.length > 0 && (
                <div style={{ padding: 20 }}>
                    <h2>🏁 결과 순위</h2>
                    <ol>
                        {ranking.map((name, i) => (
                            <li key={i}>{i + 1}등: {name}</li>
                        ))}
                    </ol>
                    <button onClick={onReset} style={{ marginTop: 16 }}>
                        🔁 다시 시작
                    </button>
                </div>
            )}
        </div>
    );
};

export default GameCanvas;