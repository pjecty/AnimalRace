import { useEffect, useRef, useState } from "react";
import { Application, Sprite, Texture, Text } from "pixi.js";
import { Loader } from "@pixi/loaders";
import { useGameStore } from "../store/gameStore";

// 타입 정의
interface Props {
    onReset: () => void;
}

const GameCanvas = ({ onReset }: Props) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [gameOver, setGameOver] = useState(false);
    const characters = useGameStore((state) => state.characters);
    const ranking = useGameStore((state) => state.ranking);
    const updateX = useGameStore((state) => state.updateX);
    const markFinished = useGameStore((state) => state.markFinished);
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

        const sprites: Record<number, Sprite & { nameText?: Text }> = {};
        const objectSprites: Sprite[] = [];

        loader.load((_, resources) => {
            const bgTexture = resources["track"]?.texture;
            if (bgTexture) {
                const bg = new Sprite(bgTexture as unknown as Texture);
                bg.width = 1000;
                bg.height = 400;
                app.stage.addChild(bg);
            }

            characters.forEach((char, idx) => {
                const key = `${char.name}-${char.id}`;
                const tex = resources[key]?.texture;
                if (!tex) return;
                const sprite = new Sprite(tex as unknown as Texture) as Sprite & { nameText?: Text };
                sprite.x = char.x;
                sprite.y = 35 + idx * 44;
                sprite.width = 50;
                sprite.height = 50;
                app.stage.addChild(sprite);

                const nameText = new Text(char.name, {
                    fontFamily: "Arial",
                    fontSize: 12,
                    fill: "white",
                    stroke: "black",
                    strokeThickness: 3,
                    align: "center",
                });
                nameText.anchor.set(0.5, 1);
                nameText.x = sprite.x + sprite.width / 2;
                nameText.y = sprite.y - 5;
                app.stage.addChild(nameText);

                sprite.nameText = nameText;
                sprites[char.id] = sprite;
            });

            let tick = 0;

            app.ticker.add(() => {
                tick += 0.1;
                const now = Date.now();
                let newObjects = useGameStore.getState().objects || [];
                const latestChars = useGameStore.getState().characters;

                // 오브젝트 수명 관리
                newObjects = newObjects.filter((obj) => now < obj.createdAt + obj.duration);

                // 캐릭터 이동 처리
                latestChars.forEach((char) => {
                    const sprite = sprites[char.id];
                    if (!sprite) return;
                    const baseY = 35 + char.id * 44;

                    const isBlockedNow = newObjects.some(
                        (obj) =>
                            obj.effect === "block" &&
                            Math.abs(sprite.x - obj.x) < 30 &&
                            Math.abs(sprite.y - obj.y) < 30
                    );

                    let speed = char.speed;
                    if (char.isSlowed) speed *= 0.5;
                    if (char.isFrozen || isBlockedNow) speed = 0;

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

                    if (sprite.nameText) {
                        sprite.nameText.x = sprite.x + sprite.width / 2;
                        sprite.nameText.y = sprite.y - 5;
                    }
                });

                // 스킬 발동 처리
                latestChars.forEach((char) => {
                    const sprite = sprites[char.id];
                    if (!sprite) return;

                    if (!char.isFinished && !char.isUsingSkill && char.skillImage && Math.random() < 0.00238) {
                        char.isUsingSkill = true;
                        char.skillEndTime = now + 1500;
                        const skillTex = resources[`${char.name}-${char.id}-skill`]?.texture;
                        if (skillTex) sprite.texture = skillTex as unknown as Texture;

                        const skillFile = char.skillImage!.split("/").pop()!;
                        if (skillFile === "penguin_skill.png") {
                            characters.forEach((_, laneIdx) => {
                                const y = 35 + laneIdx * 44;
                                newObjects.push({
                                    id: Math.random(),
                                    ownerId: char.id,
                                    image: char.objectImage!,
                                    x: sprite.x - 50,
                                    y,
                                    speed: 0,
                                    effect: "block",
                                    duration: 3000,
                                    createdAt: now,
                                });
                            });
                        } else if (skillFile === "rabbit_skill.png") {
                            char.originalSpeed = char.speed;
                            char.speed = 2;
                            useGameStore.getState().setCharacters(
                                latestChars.map((c) =>
                                    c.id === char.id
                                        ? { ...c, speed: 2, originalSpeed: char.originalSpeed }
                                        : c
                                )
                            );
                        } else {
                            newObjects.push({
                                id: Math.random(),
                                ownerId: char.id,
                                image: char.objectImage!,
                                x: sprite.x,
                                y: sprite.y,
                                speed: 0,
                                effect: "slow",
                                duration: 2000,
                                createdAt: now,
                            });
                        }
                    }

                    if (char.isUsingSkill && char.skillEndTime! < now) {
                        char.isUsingSkill = false;
                        const normalTex = resources[`${char.name}-${char.id}`]?.texture;
                        if (normalTex) sprite.texture = normalTex as unknown as Texture;

                        const skillFile = char.skillImage?.split("/").pop();
                        if (skillFile === "rabbit_skill.png" && char.originalSpeed !== undefined) {
                            char.speed = char.originalSpeed;
                            char.originalSpeed = undefined;
                            const currentChars = useGameStore.getState().characters;
                            useGameStore.getState().setCharacters(
                                currentChars.map((c) =>
                                    c.id === char.id
                                        ? { ...c, speed: char.speed, originalSpeed: undefined }
                                        : c
                                )
                            );
                        }
                    }
                });

                // 게임 종료 체크
                if (!gameOver && useGameStore.getState().ranking.length === useGameStore.getState().characters.length) {
                    setGameOver(true);
                }

                // 이전 오브젝트 sprite 제거
                objectSprites.forEach((s) => app.stage.removeChild(s));
                objectSprites.length = 0;

                // 오브젝트 렌더링
                newObjects.forEach((obj) => {
                    let tex: Texture;
                    try {
                        tex = Texture.from(obj.image);
                    } catch {
                        console.warn("🚨 오브젝트 이미지 로드 실패:", obj.image);
                        return;
                    }
                    const sprite = new Sprite(tex);
                    sprite.x = obj.x;
                    sprite.y = obj.y;
                    sprite.width = 40;
                    sprite.height = 40;
                    app.stage.addChild(sprite);
                    objectSprites.push(sprite);
                });

                setObjects(newObjects);
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
