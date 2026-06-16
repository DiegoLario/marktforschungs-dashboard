import React, { useMemo, useState } from "react";

function DataConfig({ fileData, analysis, initialConfig, onStartDashboard, onReset }) {
    const columns = fileData.columns;

    const suggestedRegion = findColumn(columns, ["region", "regionen", "gebiet", "sprachregion"]);
    const suggestedAge = findColumn(columns, ["alter", "age", "agegrp", "altersgruppe"]);
    const suggestedGender = findColumn(columns, ["geschlecht", "gender", "sex", "s01"]);
    const suggestedLanguage = findColumn(columns, ["sprache", "language", "lang"]);

    const suggestedFilterColumns = useMemo(() => {
        return [
            suggestedRegion,
            suggestedAge,
            suggestedGender,
            suggestedLanguage
        ].filter(Boolean);
    }, [suggestedRegion, suggestedAge, suggestedGender, suggestedLanguage]);

    const [selectedQuestionColumn, setSelectedQuestionColumn] = useState(
        initialConfig?.questionColumn || ""
    );

    const [selectedSecondQuestionColumn, setSelectedSecondQuestionColumn] = useState(
        initialConfig?.secondQuestionColumn || ""
    );

    const [selectedFilterColumns, setSelectedFilterColumns] = useState(
        initialConfig?.filterColumns || suggestedFilterColumns
    );

    const [questionSearchTerm, setQuestionSearchTerm] = useState("");
    const [filterSearchTerm, setFilterSearchTerm] = useState("");

    const previewColumns = useMemo(() => {
        return columns.slice(0, 10);
    }, [columns]);

    const filteredQuestionColumns = useMemo(() => {
        if (!questionSearchTerm.trim()) {
            return columns;
        }

        const normalizedSearch = questionSearchTerm.toLowerCase();

        return columns.filter((column) => {
            return column.toLowerCase().includes(normalizedSearch);
        });
    }, [columns, questionSearchTerm]);

    const filteredOtherFilterColumns = useMemo(() => {
        const otherColumns = columns.filter((column) => {
            return !suggestedFilterColumns.includes(column);
        });

        if (!filterSearchTerm.trim()) {
            return otherColumns;
        }

        const normalizedSearch = filterSearchTerm.toLowerCase();

        return otherColumns.filter((column) => {
            return column.toLowerCase().includes(normalizedSearch);
        });
    }, [columns, suggestedFilterColumns, filterSearchTerm]);

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
            secondQuestionColumn: selectedSecondQuestionColumn,
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

            {initialConfig && (
                <div className="info-box">
                    Deine vorherige Auswahl wurde übernommen. Du kannst die Spalten oder Filter hier anpassen und danach das Dashboard erneut starten.
                </div>
            )}

            {fileData.warnings && fileData.warnings.length > 0 && (
                <div className="warning-box">
                    {fileData.warnings.map((warning, index) => (
                        <p key={index}>{warning}</p>
                    ))}
                </div>
            )}

            <div className="content-card">
                <h2>Hauptauswertung</h2>
                <p className="muted-text">
                    Wähle die Spalten aus, die im Dashboard visualisiert werden sollen.
                    Die erste Spalte ist Pflicht, die zweite Spalte ist optional.
                </p>

                <div className="column-search-box">
                    <label>
                        Spalte suchen
                        <input
                            type="text"
                            placeholder="z. B. Q01, Zufriedenheit, Bewertung..."
                            value={questionSearchTerm}
                            onChange={(event) => setQuestionSearchTerm(event.target.value)}
                        />
                    </label>
                </div>

                <div className="form-grid">
                    <label>
                        Grafik 1 / Hauptspalte
                        <select
                            value={selectedQuestionColumn}
                            onChange={(event) => setSelectedQuestionColumn(event.target.value)}
                        >
                            <option value="">Spalte auswählen</option>

                            {filteredQuestionColumns.map((column) => (
                                <option key={column} value={column}>
                                    {column}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Grafik 2 / optionale Vergleichsspalte
                        <select
                            value={selectedSecondQuestionColumn}
                            onChange={(event) => setSelectedSecondQuestionColumn(event.target.value)}
                        >
                            <option value="">Keine zweite Spalte</option>

                            {filteredQuestionColumns.map((column) => (
                                <option key={column} value={column}>
                                    {column}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <p className="column-result-info">
                    {filteredQuestionColumns.length} von {columns.length} Spalten gefunden
                </p>
            </div>

            <div className="content-card">
                <h2>Filterspalten</h2>
                <p className="muted-text">
                    Wähle die Spalten aus, die später als Filter im Dashboard angezeigt werden sollen.
                </p>

                <div className="suggested-columns-section">
                    <h3>Vorgeschlagene Filterspalten</h3>

                    {suggestedFilterColumns.length === 0 ? (
                        <p className="muted-text">
                            Es wurden keine typischen Filterspalten automatisch erkannt.
                        </p>
                    ) : (
                        <div className="suggested-filter-grid">
                            {suggestedFilterColumns.map((column) => (
                                <label key={column} className="checkbox-item suggested-checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedFilterColumns.includes(column)}
                                        onChange={() => toggleFilterColumn(column)}
                                    />
                                    <span>{column}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div className="other-columns-section">
                    <h3>Weitere Spalten</h3>

                    <div className="column-search-box">
                        <label>
                            Filterspalte suchen
                            <input
                                type="text"
                                placeholder="Spaltenname eingeben..."
                                value={filterSearchTerm}
                                onChange={(event) => setFilterSearchTerm(event.target.value)}
                            />
                        </label>
                    </div>

                    <div className="checkbox-grid">
                        {filteredOtherFilterColumns.map((column) => (
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

                    <p className="column-result-info">
                        {filteredOtherFilterColumns.length} weitere Spalten angezeigt
                    </p>
                </div>
            </div>

            <div className="content-card">
                <h2>Ausgewählte Auswertung</h2>

                <div className="selected-column-list">
                    {selectedQuestionColumn ? (
                        <span>Grafik 1: {selectedQuestionColumn}</span>
                    ) : (
                        <span>Grafik 1: Noch keine Spalte gewählt</span>
                    )}

                    {selectedSecondQuestionColumn ? (
                        <span>Grafik 2: {selectedSecondQuestionColumn}</span>
                    ) : (
                        <span>Grafik 2: Keine zweite Spalte</span>
                    )}
                </div>
            </div>

            <div className="content-card">
                <h2>Ausgewählte Filter</h2>

                {selectedFilterColumns.length === 0 ? (
                    <p className="muted-text">
                        Es wurden noch keine Filterspalten ausgewählt.
                    </p>
                ) : (
                    <div className="selected-column-list">
                        {selectedFilterColumns.map((column) => (
                            <span key={column}>{column}</span>
                        ))}
                    </div>
                )}
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
                    Neue Datei hochladen
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