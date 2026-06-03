import { useEffect, useState } from "react";

function ProgressBar({ isLoading, onComplete }) {
    const [filled, setFilled] = useState(0);

    useEffect(() => {
        if (!isLoading) {
            setFilled(0);
            return;
        }

        if (filled >= 100) {
            onComplete();
            return;
        }

        const timer = setTimeout(() => {
            setFilled((previousValue) => {
                const nextValue = previousValue + 5;
                return nextValue > 100 ? 100 : nextValue;
            });
        }, 80);

        return () => clearTimeout(timer);
    }, [filled, isLoading, onComplete]);

    if (!isLoading) {
        return null;
    }

    return (
        <div className="progressbar-wrapper">
            <div className="progressbar-header">
                <span>Datei wird eingelesen und analysiert...</span>
                <strong>{filled}%</strong>
            </div>

            <div className="progressbar">
                <div
                    className="progressbar-fill"
                    style={{ width: `${filled}%` }}
                />
            </div>
        </div>
    );
}

export default ProgressBar;