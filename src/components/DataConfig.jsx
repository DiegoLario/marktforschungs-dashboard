import React, { useMemo, useState } from "react";

function DataConfig({ fileData, analysis, onStartDashboard, onReset }) {
    const columns = fileData.columns;

    const suggestedRegion = findColumn(columns, ["region", "regionen", "gebiet", "sprachregion"]);
    const suggestedAge = findColumn(columns, ["alter", "age", "agegrp", "altersgruppe"]);
    const suggestedGender = findColumn(columns, ["geschlecht", "gender", "sex", "s01"]);
    const suggestedLanguage = findColumn(columns, ["sprache", "language", "lang"]);

    const [selectedQuestionColumn, setSelectedQuestionColumn] = useState("");
    const [selectedFilterColumns, setSelectedFilterColumns] = useState(
        [suggestedRegion, suggestedAge, suggestedGender, suggestedLanguage].filter(Boolean)
    );

    const previewColumns = useMemo(() => {
        return columns.slice(0, 10);
    }, [columns]);

    function toggleFilterColumn(column) {
        setSelectedFilterColumns((currentColumns) => {
            if (currentColumns.includes(column)) {
                return currentColumns.filter((item) => item !== column);
            }

            return [...currentColumns, column];
        });
    }

    function handleStartDashboard() {
        if (!selectedQuestionColumn) {
            alert("Bitte wähle zuerst eine Frage- oder Antwortspalte aus.");
            return;
        }

        onStartDashboard({
            questionColumn: selectedQuestionColumn,
            filterColumns: selectedFilterColumns
        });
    }

    return (
        <section className="page-wrapper">
            <div className="page-header">
                <div className="page-title-block">
                    <div className="page-title-row">
                        <div className="page-icon-box">
                            <img
                                src="Marktforschung.png"
                                alt="Marktforschung"
                                className="market-icon"
                            />
                        </div>

                        <h1>Daten konfigurieren</h1>
                    </div>

                    <p>
                        Die Datei wurde erfolgreich eingelesen. Wähle nun aus,
                        welche Spalten für die Analyse verwendet werden sollen.
                    </p>
                </div>

                <button className="secondary-button" onClick={onReset}>
                    Neue Datei hochladen
                </button>
            </div>

            <div className="summary-grid">
                <div className="summary-card">
                    <span>Dateiname</span>
                    <strong>{fileData.fileName}</strong>
                </div>

                <div className="summary-card">
                    <span>Dateityp</span>
                    <strong>{fileData.fileType}</strong>
                </div>

                <div className="summary-card">
                    <span>Datensätze</span>
                    <strong>{analysis.totalRows}</strong>
                </div>

                <div className="summary-card">
                    <span>Spalten</span>
                    <strong>{analysis.totalColumns}</strong>
                </div>
            </div>

            {fileData.warnings && fileData.warnings.length > 0 && (
    <div className="warning-box">
        {fileData.warnings.map((warning, index) => (
            <p key={index}>{warning}</p>
        ))}
    </div>
)}

            <div className="content-card">
                <h2>Hauptauswertung</h2>

                <div className="form-grid">
                    <label>
                        Frage / Antwortspalte
                        <select
                            value={selectedQuestionColumn}
                            onChange={(event) => setSelectedQuestionColumn(event.target.value)}
                        >
                            <option value="">Spalte auswählen</option>

                            {columns.map((column) => (
                                <option key={column} value={column}>
                                    {column}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            <div className="content-card">
                <h2>Filterspalten</h2>
                <p className="muted-text">
                    Wähle die Spalten aus, die später als Filter im Dashboard angezeigt werden sollen.
                </p>

                <div className="checkbox-grid">
                    {columns.map((column) => (
                        <label key={column} className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={selectedFilterColumns.includes(column)}
                                onChange={() => toggleFilterColumn(column)}
                            />
                            <span>{column}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="content-card">
                <h2>Vorschau der erkannten Spalten</h2>

                <div className="column-preview">
                    {previewColumns.map((column) => (
                        <span key={column}>{column}</span>
                    ))}
                </div>
            </div>

            <div className="button-row">
                <button className="secondary-button" onClick={onReset}>
                    Zurück
                </button>

                <button className="primary-button real-button" onClick={handleStartDashboard}>
                    Dashboard starten
                </button>
            </div>
        </section>
    );
}

function findColumn(columns, possibleNames) {
    return columns.find((column) => {
        const normalizedColumn = column.toLowerCase().replaceAll("_", "").replaceAll(" ", "");

        return possibleNames.some((name) => {
            const normalizedName = name.toLowerCase().replaceAll("_", "").replaceAll(" ", "");
            return normalizedColumn.includes(normalizedName);
        });
    });
}

export default DataConfig;