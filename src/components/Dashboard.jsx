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

    const displayedQuestionName = questionDisplayName.trim()
        ? questionDisplayName.trim()
        : config.questionColumn;

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

    const filteredPercent = useMemo(() => {
        if (analysis.totalRows === 0) {
            return 0;
        }

        return Math.round((filteredRows.length / analysis.totalRows) * 100);
    }, [filteredRows.length, analysis.totalRows]);

    const answerStats = useMemo(() => {
        const counts = {};

        filteredRows.forEach((row) => {
            const rawValue = row[config.questionColumn];

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
    }, [filteredRows, config.questionColumn]);

    const topAnswers = useMemo(() => {
        return answerStats.slice(0, 3);
    }, [answerStats]);

    const numericStats = useMemo(() => {
        const numericValues = filteredRows
            .map((row) => convertToNumber(row[config.questionColumn]))
            .filter((value) => value !== null);

        return {
            isNumeric: numericValues.length > 0,
            numericCount: numericValues.length
        };
    }, [filteredRows, config.questionColumn]);

    const missingAnswers = useMemo(() => {
        return filteredRows.filter((row) => {
            const value = row[config.questionColumn];
            return isEmptyValue(value);
        }).length;
    }, [filteredRows, config.questionColumn]);

    const validAnswers = Math.max(filteredRows.length - missingAnswers, 0);
    const mostCommonAnswer = answerStats.length > 0 ? answerStats[0] : null;

    const limitedBarStats = useMemo(() => {
        return answerStats.slice(0, 8);
    }, [answerStats]);

    const limitedDoughnutStats = useMemo(() => {
        return answerStats.slice(0, 8);
    }, [answerStats]);

    const useHorizontalBarChart = useMemo(() => {
        const hasManyAnswers = limitedBarStats.length > 5;
        const hasLongLabels = limitedBarStats.some((item) => item.answer.length > 18);

        return hasManyAnswers || hasLongLabels;
    }, [limitedBarStats]);

    const barChartData = useMemo(() => {
        return {
            labels: limitedBarStats.map((item) => item.answer),
            datasets: [
                {
                    label: "Anzahl Antworten",
                    data: limitedBarStats.map((item) => item.count),
                    backgroundColor: limitedBarStats.map((_, index) => {
                        return index === 0 ? "#004678" : "#83b9dd";
                    }),
                    borderColor: limitedBarStats.map((_, index) => {
                        return index === 0 ? "#00385f" : "#0477bf";
                    }),
                    borderWidth: 1,
                    borderRadius: 8
                }
            ]
        };
    }, [limitedBarStats]);

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
                            const item = limitedBarStats[context.dataIndex];

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
    }, [useHorizontalBarChart, limitedBarStats]);

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
                    <strong className="orange">{missingAnswers}</strong>
                </div>

                <div className="summary-card">
                    <span>Gültige Werte</span>
                    <strong>{validAnswers}</strong>
                </div>
            </div>

            <div className="dashboard-info-grid">
                <div className="content-card compact-card">
                    <h2>Aktive Filter</h2>

                    {activeFilters.length === 0 ? (
                        <p className="muted-text">Keine Filter aktiv</p>
                    ) : (
                        <div className="active-filter-list">
                            {activeFilters.map((filter) => (
                                <div
                                    className="active-filter-item"
                                    key={`${filter.column}-${filter.value}`}
                                >
                                    <strong>{filter.column}</strong>
                                    <span>{filter.value}</span>
                                </div>
                            ))}
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

                <div className="multi-filter-grid">
                    {config.filterColumns.map((column) => {
                        const values = getUniqueValues(column);
                        const selectedValues = filters[column] || [];

                        return (
                            <div className="multi-filter-group" key={column}>
                                <h3>{column}</h3>

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
                <h2>Ausgewertete Spalte</h2>

                <p className="muted-text">
                    Aktuell wird die Spalte <strong>{config.questionColumn}</strong> ausgewertet.
                </p>

                <div className="display-name-field">
                    <label>
                        Anzeigename für diese Spalte
                        <input
                            type="text"
                            placeholder="Optionaler Anzeigename, z. B. Zufriedenheit"
                            value={questionDisplayName}
                            onChange={(event) => setQuestionDisplayName(event.target.value)}
                        />
                    </label>
                </div>

                <p className="muted-text">
                    Angezeigt als: <strong>{displayedQuestionName}</strong>
                </p>
            </div>

            {!numericStats.isNumeric && (
                <div className="warning-box">
                    <p>
                        Hinweis: In der ausgewählten Spalte wurden keine numerischen Werte erkannt.
                        Es wird deshalb keine Durchschnittsberechnung angezeigt. Die Grafiken zeigen die Verteilung der gültigen Antworten.
                    </p>
                </div>
            )}

            <div className="dashboard-grid">
                <div className="content-card chart-card">
                    <h2>Antwortverteilung: {displayedQuestionName}</h2>
                    <p className="muted-text">
                        {useHorizontalBarChart
                            ? "Viele oder lange Antwortwerte werden horizontal dargestellt."
                            : "Antwortverteilung der ausgewählten Spalte."}
                    </p>

                    {answerStats.length === 0 ? (
                        <p>Keine gültigen Werte für das Diagramm vorhanden.</p>
                    ) : (
                        <div className="chart-wrapper">
                            <Bar data={barChartData} options={barChartOptions} />
                        </div>
                    )}
                </div>

                <div className="content-card chart-card">
                    <h2>Prozentuale Verteilung: {displayedQuestionName}</h2>
                    <p className="muted-text">
                        Prozentuale Verteilung der häufigsten Antworten.
                    </p>

                    {answerStats.length === 0 ? (
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

                    {topAnswers.length > 1 && (
                        <div className="insight-item">
                            💡 Die Top-{topAnswers.length} Antworten machen zusammen{" "}
                            <strong>
                                {topAnswers.reduce((total, item) => total + item.percent, 0)}%
                            </strong>{" "}
                            der gültigen Antworten aus.
                        </div>
                    )}

                    <div className="insight-item">
                        💡 Bei der ausgewählten Spalte wurden{" "}
                        <strong>{missingAnswers}</strong> Missings gefunden.
                    </div>
                </div>
            </div>
        </section>
    );
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