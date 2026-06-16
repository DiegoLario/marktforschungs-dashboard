import React, { useMemo, useState } from "react";
import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
);

function Dashboard({ fileData, analysis, config, onReset, onOpenTable, onBackToConfig }) {
    const [filters, setFilters] = useState({});
    const [questionDisplayName, setQuestionDisplayName] = useState("");
    const [secondQuestionDisplayName, setSecondQuestionDisplayName] = useState("");

    const chartColors = [
        "#004678",
        "#0477bf",
        "#00a6a6",
        "#6f8edb",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#14b8a6"
    ];

    const hasSecondQuestionColumn =
        config.secondQuestionColumn &&
        config.secondQuestionColumn !== config.questionColumn;

    const displayedQuestionName = questionDisplayName.trim()
        ? questionDisplayName.trim()
        : config.questionColumn;

    const displayedSecondQuestionName = secondQuestionDisplayName.trim()
        ? secondQuestionDisplayName.trim()
        : config.secondQuestionColumn;

    const filteredRows = useMemo(() => {
        return fileData.rows.filter((row) => {
            return config.filterColumns.every((column) => {
                const selectedValues = filters[column] || [];

                if (selectedValues.length === 0) {
                    return true;
                }

                return selectedValues.includes(row[column]);
            });
        });
    }, [fileData.rows, config.filterColumns, filters]);

    const activeFilters = useMemo(() => {
        return Object.entries(filters)
            .filter(([, values]) => Array.isArray(values) && values.length > 0)
            .flatMap(([column, values]) => {
                return values.map((value) => ({
                    column,
                    value
                }));
            });
    }, [filters]);

    const activeFilterGroups = useMemo(() => {
        const groupedFilters = {};

        activeFilters.forEach((filter) => {
            if (!groupedFilters[filter.column]) {
                groupedFilters[filter.column] = [];
            }

            groupedFilters[filter.column].push(filter.value);
        });

        return Object.entries(groupedFilters).map(([column, values]) => ({
            column,
            values
        }));
    }, [activeFilters]);

    const filteredPercent = useMemo(() => {
        if (analysis.totalRows === 0) {
            return 0;
        }

        return Math.round((filteredRows.length / analysis.totalRows) * 100);
    }, [filteredRows.length, analysis.totalRows]);

    const primaryAnswerStats = useMemo(() => {
        return getAnswerStats(filteredRows, config.questionColumn);
    }, [filteredRows, config.questionColumn]);

    const secondAnswerStats = useMemo(() => {
        if (!hasSecondQuestionColumn) {
            return [];
        }

        return getAnswerStats(filteredRows, config.secondQuestionColumn);
    }, [filteredRows, config.secondQuestionColumn, hasSecondQuestionColumn]);

    const primaryNumericStats = useMemo(() => {
        return getNumericState(filteredRows, config.questionColumn);
    }, [filteredRows, config.questionColumn]);

    const secondNumericStats = useMemo(() => {
        if (!hasSecondQuestionColumn) {
            return {
                isNumeric: false,
                numericCount: 0
            };
        }

        return getNumericState(filteredRows, config.secondQuestionColumn);
    }, [filteredRows, config.secondQuestionColumn, hasSecondQuestionColumn]);

    const primaryMissingAnswers = useMemo(() => {
        return getMissingCount(filteredRows, config.questionColumn);
    }, [filteredRows, config.questionColumn]);

    const secondMissingAnswers = useMemo(() => {
        if (!hasSecondQuestionColumn) {
            return 0;
        }

        return getMissingCount(filteredRows, config.secondQuestionColumn);
    }, [filteredRows, config.secondQuestionColumn, hasSecondQuestionColumn]);

    const validAnswers = Math.max(filteredRows.length - primaryMissingAnswers, 0);
    const topAnswers = primaryAnswerStats.slice(0, 3);
    const mostCommonAnswer = primaryAnswerStats.length > 0 ? primaryAnswerStats[0] : null;
    const secondMostCommonAnswer = secondAnswerStats.length > 0 ? secondAnswerStats[0] : null;

    const limitedPrimaryBarStats = useMemo(() => {
        return primaryAnswerStats.slice(0, 8);
    }, [primaryAnswerStats]);

    const limitedDoughnutStats = useMemo(() => {
        if (hasSecondQuestionColumn) {
            return secondAnswerStats.slice(0, 8);
        }

        return primaryAnswerStats.slice(0, 8);
    }, [hasSecondQuestionColumn, secondAnswerStats, primaryAnswerStats]);

    const useHorizontalBarChart = useMemo(() => {
        const hasManyAnswers = limitedPrimaryBarStats.length > 5;
        const hasLongLabels = limitedPrimaryBarStats.some((item) => item.answer.length > 18);

        return hasManyAnswers || hasLongLabels;
    }, [limitedPrimaryBarStats]);

    const barChartData = useMemo(() => {
        return {
            labels: limitedPrimaryBarStats.map((item) => item.answer),
            datasets: [
                {
                    label: "Anzahl Antworten",
                    data: limitedPrimaryBarStats.map((item) => item.count),
                    backgroundColor: limitedPrimaryBarStats.map((_, index) => {
                        return index === 0 ? "#004678" : "#83b9dd";
                    }),
                    borderColor: limitedPrimaryBarStats.map((_, index) => {
                        return index === 0 ? "#00385f" : "#0477bf";
                    }),
                    borderWidth: 1,
                    borderRadius: 8
                }
            ]
        };
    }, [limitedPrimaryBarStats]);

    const doughnutChartData = useMemo(() => {
        return {
            labels: limitedDoughnutStats.map((item) => item.answer),
            datasets: [
                {
                    label: "Anteil in %",
                    data: limitedDoughnutStats.map((item) => item.percent),
                    backgroundColor: limitedDoughnutStats.map(
                        (_, index) => chartColors[index % chartColors.length]
                    ),
                    borderColor: "#ffffff",
                    borderWidth: 3
                }
            ]
        };
    }, [limitedDoughnutStats]);

    const barChartOptions = useMemo(() => {
        return {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: useHorizontalBarChart ? "y" : "x",
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const item = limitedPrimaryBarStats[context.dataIndex];

                            if (!item) {
                                return `${context.raw} Antworten`;
                            }

                            return `${item.answer}: ${item.count} Antworten (${item.percent}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: "#64748b",
                        maxRotation: useHorizontalBarChart ? 0 : 35,
                        minRotation: 0
                    },
                    grid: {
                        color: useHorizontalBarChart ? "#e6eef5" : "transparent"
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "#64748b"
                    },
                    grid: {
                        color: useHorizontalBarChart ? "transparent" : "#e6eef5"
                    }
                }
            }
        };
    }, [useHorizontalBarChart, limitedPrimaryBarStats]);

    const doughnutChartOptions = useMemo(() => {
        return {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "62%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#334155",
                        boxWidth: 14,
                        padding: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const item = limitedDoughnutStats[context.dataIndex];

                            if (!item) {
                                return `${context.label}: ${context.raw}%`;
                            }

                            return `${item.answer}: ${item.count} Antworten (${item.percent}%)`;
                        }
                    }
                }
            }
        };
    }, [limitedDoughnutStats]);

    function getUniqueValues(column) {
        const values = fileData.rows
            .map((row) => row[column])
            .filter((value) => !isEmptyValue(value));

        return Array.from(new Set(values)).sort();
    }

    function handleFilterChange(column, value) {
        setFilters((currentFilters) => {
            const currentValues = currentFilters[column] || [];

            if (currentValues.includes(value)) {
                return {
                    ...currentFilters,
                    [column]: currentValues.filter((item) => item !== value)
                };
            }

            return {
                ...currentFilters,
                [column]: [...currentValues, value]
            };
        });
    }

    function toggleAllFilterValues(column, values) {
        setFilters((currentFilters) => {
            const currentValues = currentFilters[column] || [];
            const allValuesSelected = currentValues.length === values.length;

            return {
                ...currentFilters,
                [column]: allValuesSelected ? [] : values
            };
        });
    }

    function resetFilters() {
        setFilters({});
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

                        <h1>Dashboard</h1>
                    </div>

                    <p>Datei: {fileData.fileName}</p>
                </div>

                <div className="header-actions">
                    <button className="primary-button real-button" onClick={onOpenTable}>
                        Datentabelle anzeigen
                    </button>

                    <button className="secondary-button" onClick={onBackToConfig}>
                        Zurück zu Daten konfigurieren
                    </button>

                    <button className="secondary-button" onClick={onReset}>
                        Neue Datei hochladen
                    </button>
                </div>
            </div>

            <div className="summary-grid">
                <div className="summary-card">
                    <span>Anzahl Datensätze</span>
                    <strong>{analysis.totalRows}</strong>
                </div>

                <div className="summary-card">
                    <span>Gefilterte Datensätze</span>
                    <strong>
                        {filteredRows.length} von {analysis.totalRows}
                    </strong>
                    <small>{filteredPercent}% der Daten</small>
                </div>

                <div className="summary-card">
                    <span className="orange">Missings</span>
                    <strong className="orange">{primaryMissingAnswers}</strong>
                </div>

                <div className="summary-card">
                    <span>Gültige Werte</span>
                    <strong>{validAnswers}</strong>
                </div>
            </div>

            <div className="dashboard-info-grid">
                <div className="content-card compact-card">
                    <h2>Aktive Filter</h2>

                    {activeFilterGroups.length === 0 ? (
                        <p className="muted-text">Keine Filter aktiv</p>
                    ) : (
                        <div className="active-filter-list">
                            {activeFilterGroups.map((group) => {
                                const useCompactView = group.values.length > 3;

                                if (useCompactView) {
                                    return (
                                        <div
                                            className="active-filter-item active-filter-summary-item"
                                            key={group.column}
                                        >
                                            <div>
                                                <strong>{group.column}</strong>
                                                <span>{group.values.length} Werte ausgewählt</span>
                                            </div>

                                            <small>
                                                {group.values.slice(0, 3).join(", ")}
                                                {group.values.length > 3 ? " ..." : ""}
                                            </small>
                                        </div>
                                    );
                                }

                                return group.values.map((value) => (
                                    <div
                                        className="active-filter-item"
                                        key={`${group.column}-${value}`}
                                    >
                                        <strong>{group.column}</strong>
                                        <span>{value}</span>
                                    </div>
                                ));
                            })}
                        </div>
                    )}
                </div>

                <div className="content-card compact-card">
                    <h2>Top Antworten</h2>

                    {topAnswers.length === 0 ? (
                        <p className="muted-text">Keine gültigen Antworten vorhanden.</p>
                    ) : (
                        <ol className="top-answer-list">
                            {topAnswers.map((item) => (
                                <li key={item.answer}>
                                    <span>{item.answer}</span>
                                    <strong>{item.percent}%</strong>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            </div>

            <div className="content-card">
                <div className="card-header-row">
                    <div>
                        <h2>Filter</h2>
                        <p className="muted-text">
                            Die Filter basieren auf den Spalten, die in der Konfiguration ausgewählt wurden.
                            Es können pro Filter mehrere Werte ausgewählt werden.
                        </p>
                    </div>

                    <button className="small-button" onClick={resetFilters}>
                        Filter zurücksetzen
                    </button>
                </div>

                <div className={`multi-filter-grid ${config.filterColumns.length > 3 ? "multi-filter-grid-compact" : ""}`}>
                    {config.filterColumns.map((column) => {
                        const values = getUniqueValues(column);
                        const selectedValues = filters[column] || [];
                        const hasManyOptions = values.length > 10;
                        const allValuesSelected = selectedValues.length === values.length && values.length > 0;

                        return (
                            <div className="multi-filter-group" key={column}>
                                <div className="multi-filter-header">
                                    <div className="multi-filter-title">
                                        <h3>{column}</h3>

                                        {selectedValues.length === 0 ? (
                                            <small>Alle Werte aktiv</small>
                                        ) : (
                                            <small>
                                                {selectedValues.length} von {values.length} ausgewählt
                                            </small>
                                        )}
                                    </div>

                                    {hasManyOptions && (
                                        <button
                                            type="button"
                                            className="multi-filter-select-all"
                                            onClick={() => toggleAllFilterValues(column, values)}
                                        >
                                            {allValuesSelected ? "Abwählen" : "Alle"}
                                        </button>
                                    )}
                                </div>

                                {values.length === 0 ? (
                                    <p className="muted-text">Keine Werte vorhanden.</p>
                                ) : (
                                    <div className="multi-filter-options">
                                        {values.map((value) => (
                                            <label key={value} className="multi-filter-option">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedValues.includes(value)}
                                                    onChange={() => handleFilterChange(column, value)}
                                                />
                                                <span>{value}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="content-card">
                <h2>Ausgewertete Spalten</h2>

                <p className="muted-text">
                    Grafik 1 wertet die Spalte <strong>{config.questionColumn}</strong> aus.
                    {hasSecondQuestionColumn && (
                        <>
                            {" "}Grafik 2 wertet die Spalte <strong>{config.secondQuestionColumn}</strong> aus.
                        </>
                    )}
                </p>

                <div className="form-grid">
                    <div className="display-name-field">
                        <label>
                            Anzeigename für Grafik 1
                            <input
                                type="text"
                                placeholder="Optionaler Anzeigename, z. B. Zufriedenheit"
                                value={questionDisplayName}
                                onChange={(event) => setQuestionDisplayName(event.target.value)}
                            />
                        </label>
                    </div>

                    {hasSecondQuestionColumn && (
                        <div className="display-name-field">
                            <label>
                                Anzeigename für Grafik 2
                                <input
                                    type="text"
                                    placeholder="Optionaler Anzeigename, z. B. Weiterempfehlung"
                                    value={secondQuestionDisplayName}
                                    onChange={(event) => setSecondQuestionDisplayName(event.target.value)}
                                />
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {!primaryNumericStats.isNumeric && (
                <div className="warning-box">
                    <p>
                        Hinweis: In der ersten ausgewählten Spalte wurden keine numerischen Werte erkannt.
                        Es wird deshalb keine Durchschnittsberechnung angezeigt. Die Grafiken zeigen die Verteilung der gültigen Antworten.
                    </p>
                </div>
            )}

            {hasSecondQuestionColumn && !secondNumericStats.isNumeric && (
                <div className="warning-box">
                    <p>
                        Hinweis: In der zweiten ausgewählten Spalte wurden keine numerischen Werte erkannt.
                        Die zweite Grafik zeigt deshalb die prozentuale Verteilung der gültigen Antworten.
                    </p>
                </div>
            )}

            <div className="dashboard-grid">
                <div className="content-card chart-card">
                    <h2>Antwortverteilung: {displayedQuestionName}</h2>
                    <p className="muted-text">
                        {useHorizontalBarChart
                            ? "Viele oder lange Antwortwerte werden horizontal dargestellt."
                            : "Antwortverteilung der ersten ausgewählten Spalte."}
                    </p>

                    {primaryAnswerStats.length === 0 ? (
                        <p>Keine gültigen Werte für das Diagramm vorhanden.</p>
                    ) : (
                        <div className="chart-wrapper">
                            <Bar data={barChartData} options={barChartOptions} />
                        </div>
                    )}
                </div>

                <div className="content-card chart-card">
                    <h2>
                        {hasSecondQuestionColumn
                            ? `Prozentuale Verteilung: ${displayedSecondQuestionName}`
                            : `Prozentuale Verteilung: ${displayedQuestionName}`}
                    </h2>

                    <p className="muted-text">
                        {hasSecondQuestionColumn
                            ? "Prozentuale Verteilung der zweiten ausgewählten Spalte."
                            : "Prozentuale Verteilung der ersten ausgewählten Spalte."}
                    </p>

                    {limitedDoughnutStats.length === 0 ? (
                        <p>Keine gültigen Werte für das Diagramm vorhanden.</p>
                    ) : (
                        <div className="chart-wrapper doughnut-wrapper">
                            <Doughnut
                                data={doughnutChartData}
                                options={doughnutChartOptions}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="content-card">
                <h2>Automatische Erkenntnisse</h2>

                <div className="insight-list">
                    <div className="insight-item">
                        💡 Es wurden aktuell <strong>{filteredRows.length}</strong>{" "}
                        von <strong>{analysis.totalRows}</strong> Datensätzen ausgewertet.
                    </div>

                    <div className="insight-item">
                        💡 Der aktuelle Filter umfasst <strong>{filteredPercent}%</strong>{" "}
                        aller Datensätze.
                    </div>

                    {activeFilters.length === 0 ? (
                        <div className="insight-item">
                            💡 Es sind keine Filter aktiv. Die Auswertung basiert auf allen importierten Daten.
                        </div>
                    ) : (
                        <div className="insight-item">
                            💡 Es sind <strong>{activeFilters.length}</strong> Filterwerte aktiv.
                        </div>
                    )}

                    {mostCommonAnswer && (
                        <div className="insight-item">
                            💡 Die häufigste Antwort bei <strong>{displayedQuestionName}</strong> ist{" "}
                            <strong>{mostCommonAnswer.answer}</strong> mit{" "}
                            <strong>{mostCommonAnswer.percent}%</strong>.
                        </div>
                    )}

                    {hasSecondQuestionColumn && secondMostCommonAnswer && (
                        <div className="insight-item">
                            💡 Bei <strong>{displayedSecondQuestionName}</strong> ist die häufigste Antwort{" "}
                            <strong>{secondMostCommonAnswer.answer}</strong> mit{" "}
                            <strong>{secondMostCommonAnswer.percent}%</strong>.
                        </div>
                    )}

                    {topAnswers.length > 1 && (
                        <div className="insight-item">
                            💡 Die Top-{topAnswers.length} Antworten der ersten Grafik machen zusammen{" "}
                            <strong>
                                {topAnswers.reduce((total, item) => total + item.percent, 0)}%
                            </strong>{" "}
                            der gültigen Antworten aus.
                        </div>
                    )}

                    <div className="insight-item">
                        💡 Bei der ersten ausgewählten Spalte wurden{" "}
                        <strong>{primaryMissingAnswers}</strong> Missings gefunden.
                    </div>

                    {hasSecondQuestionColumn && (
                        <div className="insight-item">
                            💡 Bei der zweiten ausgewählten Spalte wurden{" "}
                            <strong>{secondMissingAnswers}</strong> Missings gefunden.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function getAnswerStats(rows, column) {
    const counts = {};

    rows.forEach((row) => {
        const rawValue = row[column];

        if (isEmptyValue(rawValue)) {
            return;
        }

        const value = String(rawValue).trim();

        if (!counts[value]) {
            counts[value] = 0;
        }

        counts[value]++;
    });

    const validAnswerCount = Object.values(counts).reduce((total, count) => {
        return total + count;
    }, 0);

    return Object.entries(counts)
        .map(([answer, count]) => ({
            answer,
            count,
            percent:
                validAnswerCount > 0
                    ? Math.round((count / validAnswerCount) * 100)
                    : 0
        }))
        .sort((a, b) => b.count - a.count);
}

function getNumericState(rows, column) {
    const numericValues = rows
        .map((row) => convertToNumber(row[column]))
        .filter((value) => value !== null);

    return {
        isNumeric: numericValues.length > 0,
        numericCount: numericValues.length
    };
}

function getMissingCount(rows, column) {
    return rows.filter((row) => {
        const value = row[column];
        return isEmptyValue(value);
    }).length;
}

function convertToNumber(value) {
    if (isEmptyValue(value)) {
        return null;
    }

    const cleanedValue = String(value)
        .trim()
        .replace("%", "")
        .replace(",", ".");

    if (cleanedValue === "") {
        return null;
    }

    const numberValue = Number(cleanedValue);

    if (Number.isNaN(numberValue)) {
        return null;
    }

    return numberValue;
}

function isEmptyValue(value) {
    if (value === "" || value === null || value === undefined) {
        return true;
    }

    const cleanedValue = String(value).trim().toLowerCase();

    return (
        cleanedValue === "" ||
        cleanedValue === "-" ||
        cleanedValue === "null" ||
        cleanedValue === "undefined" ||
        cleanedValue === "na" ||
        cleanedValue === "n/a"
    );
}

export default Dashboard;