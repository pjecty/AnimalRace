import { useState } from 'react';

type Props = {
    onStart: (names: string[]) => void;
};

const NameInputForm = ({ onStart }: Props) => {
    const [count, setCount] = useState(2); // 기본 2명
    const [names, setNames] = useState<string[]>(Array(2).fill(''));

    const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(2, Math.min(10, parseInt(e.target.value)));
        setCount(value);
        setNames(Array(value).fill(''));
    };

    const handleNameChange = (index: number, value: string) => {
        const updated = [...names];
        updated[index] = value;
        setNames(updated);
    };

    const handleStart = () => {
        const trimmedNames = names.map(name => name.trim()).filter(name => name);
        if (trimmedNames.length < 2) {
            alert("최소 2명 이상 이름을 입력해야 합니다.");
            return;
        }
        onStart(trimmedNames);
    };

    return (
        <div>
            <h2>참가 인원 수 (2~10)</h2>
            <input
                type="number"
                min={2}
                max={10}
                value={count}
                onChange={handleCountChange}
            />

            <h3>이름 입력</h3>
            {names.map((name, i) => (
                <input
                    key={i}
                    type="text"
                    placeholder={`이름 ${i + 1}`}
                    value={name}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                    style={{ display: 'block', marginBottom: 8 }}
                />
            ))}

            <button onClick={handleStart}>게임 시작</button>
        </div>
    );
};

export default NameInputForm;
