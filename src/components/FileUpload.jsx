import { useCallback, useState } from "react";
import { parseFile } from "../utils/fileParser";
import ProgressBar from "./ProgressBar";

function FileUpload({ onFileLoaded }) {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [loadedFileData, setLoadedFileData] = useState(null);

    async function handleFileChange(event) {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        setIsLoading(true);
        setErrorMessage("");
        setLoadedFileData(null);

        try {
            const parsedFile = await parseFile(file);
            setLoadedFileData(parsedFile);
        } catch (error) {
            setErrorMessage(error.message);
            setIsLoading(false);
            setLoadedFileData(null);
        }

        event.target.value = "";
    }

    const handleProgressComplete = useCallback(() => {
        if (!loadedFileData) {
            return;
        }

        onFileLoaded(loadedFileData);
        setIsLoading(false);
    }, [loadedFileData, onFileLoaded]);

    return (
        <section className="upload-page">
            <div className="hero">
                <div className="app-icon">
                    <img
                        src="Marktforschung.png"
                        alt="Marktforschung"
                        className="market-icon"
                    />
                </div>

                <div>
                    <h1>Marktforschungs-Dashboard</h1>
                    <p>CSV- und Excel-Daten einfach analysieren und visualisieren</p>
                </div>
            </div>

            <div className="upload-card">
                <div className="upload-card-header">
                    <img
                        src="File.png"
                        alt="File"
                        className="file-icon"
                    />

                    <div>
                        <h2>Datei importieren</h2>
                        <p>
                            Lade eine CSV- oder Excel-Datei mit Umfragedaten hoch.
                            Die Daten werden direkt im Browser verarbeitet.
                        </p>
                    </div>
                </div>

                <label className="drop-zone">
                    <input
                        type="file"
                        accept=".csv,.xlsx"
                        onChange={handleFileChange}
                    />

                    <span className="drop-zone-icon">
                        <img
                            src="Upload.png"
                            alt="upload"
                            className="upload-icon"
                        />
                    </span>

                    <strong>
                        Datei hier ablegen oder <span className="blue">auswählen</span>
                    </strong>

                    <small>Unterstützte Formate: CSV, XLSX</small>

                    <span className="primary-button">
                        <span className="folder-icon" aria-hidden="true">
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <path
                                    d="M3 6.5C3 5.7 3.7 5 4.5 5H9L11 7H19.5C20.3 7 21 7.7 21 8.5V18.5C21 19.3 20.3 20 19.5 20H4.5C3.7 20 3 19.3 3 18.5V6.5Z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>

                        Datei auswählen
                    </span>
                </label>

                <ProgressBar
                    isLoading={isLoading}
                    onComplete={handleProgressComplete}
                />

                {errorMessage && (
                    <div className="error-box">
                        {errorMessage}
                    </div>
                )}
            </div>
        </section>
    );
}

export default FileUpload;