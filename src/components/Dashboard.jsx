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

function Dashboard({ fileData, analysis, config, onReset }) {
    const [filters, setFilters] = useState({});
    const [showTable, setShowTable] = useState(false);

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

    const filteredRows = useMemo(() => {
        return fileData.rows.filter((row) => {
            return config.filterColumns.every((column) => {
                const selectedValue = filters[column];

                if (!selectedValue || selectedValue === "Alle") {
                    return true;
                }

                return row[column] === selectedValue;
            });
        });
    }, [fileData.rows, config.filterColumns, filters]);

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

    const numericStats = useMemo(() => {
        const numericValues = filteredRows
            .map((row) => convertToNumber(row[config.questionColumn]))
            .filter((value) => value !== null);

        if (numericValues.length === 0) {
            return {
                isNumeric: false,
                average: null,
                median: null,
                min: null,
                max: null,
                numericCount: 0
            };
        }

        const sum = numericValues.reduce((total, value) => total + value, 0);
        const average = sum / numericValues.length;

        const sortedValues = [...numericValues].sort((a, b) => a - b);
        const middleIndex = Math.floor(sortedValues.length / 2);

        const median =
            sortedValues.length % 2 === 0
                ? (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2
                : sortedValues[middleIndex];

        return {
            isNumeric: true,
            average,
            median,
            min: sortedValues[0],
            max: sortedValues[sortedValues.length - 1],
            numericCount: numericValues.length
        };
    }, [filteredRows, config.questionColumn]);

    const missingAnswers = useMemo(() => {
        return filteredRows.filter((row) => {
            const value = row[config.questionColumn];
            return isEmptyValue(value);
        }).length;
    }, [filteredRows, config.questionColumn]);

    const mostCommonAnswer = answerStats.length > 0 ? answerStats[0] : null;

    const barChartData = useMemo(() => {
        const limitedStats = answerStats.slice(0, 8);

        return {
            labels: limitedStats.map((item) => item.answer),
            datasets: [
                {
                    label: "Anzahl Antworten",
                    data: limitedStats.map((item) => item.count),
                    backgroundColor: "#0477bf",
                    borderColor: "#004678",
                    borderWidth: 1,
                    borderRadius: 8
                }
            ]
        };
    }, [answerStats]);

    const doughnutChartData = useMemo(() => {
        const limitedStats = answerStats.slice(0, 8);

        return {
            labels: limitedStats.map((item) => item.answer),
            datasets: [
                {
                    label: "Anteil in %",
                    data: limitedStats.map((item) => item.percent),
                    backgroundColor: limitedStats.map(
                        (_, index) => chartColors[index % chartColors.length]
                    ),
                    borderColor: "#ffffff",
                    borderWidth: 3
                }
            ]
        };
    }, [answerStats]);

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        return `${context.raw} Antworten`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: "#64748b",
                    maxRotation: 35,
                    minRotation: 0
                },
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: "#64748b"
                },
                grid: {
                    color: "#e6eef5"
                }
            }
        }
    };

    const doughnutChartOptions = {
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
                        return `${context.label}: ${context.raw}%`;
                    }
                }
            }
        }
    };

    function getUniqueValues(column) {
        const values = fileData.rows
            .map((row) => row[column])
            .filter((value) => !isEmptyValue(value));

        return Array.from(new Set(values)).sort();
    }

    function handleFilterChange(column, value) {
        setFilters((currentFilters) => ({
            ...currentFilters,
            [column]: value
        }));
    }

    function resetFilters() {
        setFilters({});
    }

    function formatNumber(value) {
        if (value === null || value === undefined || Number.isNaN(value)) {
            return "Nicht verfügbar";
        }

        return new Intl.NumberFormat("de-CH", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value);
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

                <button className="secondary-button" onClick={onReset}>
                    Neue Datei hochladen
                </button>
            </div>

            <div className="summary-grid">
                <div className="summary-card">
                    <span>Anzahl Datensätze</span>
                    <strong>{analysis.totalRows}</strong>
                </div>

                <div className="summary-card">
                    <span>Gefilterte Datensätze</span>
                    <strong>{filteredRows.length}</strong>
                </div>

                <div className="summary-card">
                    <span className="orange">Leere Werte</span>
                    <strong className="orange">{missingAnswers}</strong>
                </div>

                <div className="summary-card">
                    <span>Durchschnitt</span>
                    <strong>
                        {numericStats.isNumeric
                            ? formatNumber(numericStats.average)
                            : "Nicht verfügbar"}
                    </strong>
                </div>
            </div>

            <div className="content-card">
                <div className="card-header-row">
                    <div>
                        <h2>Filter</h2>
                        <p className="muted-text">
                            Die Filter basieren auf den Spalten, die in der Konfiguration ausgewählt wurden.
                        </p>
                    </div>

                    <button className="small-button" onClick={resetFilters}>
                        Filter zurücksetzen
                    </button>
                </div>

                <div className="filter-grid">
                    {config.filterColumns.map((column) => (
                        <label key={column}>
                            {column}
                            <select
                                value={filters[column] || "Alle"}
                                onChange={(event) =>
                                    handleFilterChange(column, event.target.value)
                                }
                            >
                                <option value="Alle">Alle</option>

                                {getUniqueValues(column).map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ))}
                </div>
            </div>

            <div className="content-card">
                <h2>Ausgewertete Spalte</h2>
                <p className="muted-text">
                    Aktuell wird die Spalte <strong>{config.questionColumn}</strong> ausgewertet.
                </p>

                {numericStats.isNumeric && (
                    <div className="mini-stats-grid">
                        <div className="mini-stat-card">
                            <span>Numerische Werte</span>
                            <strong>{numericStats.numericCount}</strong>
                        </div>

                        <div className="mini-stat-card">
                            <span>Median</span>
                            <strong>{formatNumber(numericStats.median)}</strong>
                        </div>

                        <div className="mini-stat-card">
                            <span>Tiefster Wert</span>
                            <strong>{formatNumber(numericStats.min)}</strong>
                        </div>

                        <div className="mini-stat-card">
                            <span>Höchster Wert</span>
                            <strong>{formatNumber(numericStats.max)}</strong>
                        </div>
                    </div>
                )}
            </div>

            <div className="dashboard-grid">
                <div className="content-card chart-card">
                    <h2>Balkendiagramm</h2>
                    <p className="muted-text">
                        Antwortverteilung der ausgewählten Spalte.
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
                    <h2>Doughnut-Diagramm</h2>
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
                        Datensätze ausgewertet.
                    </div>

                    {mostCommonAnswer && (
                        <div className="insight-item">
                            💡 Die häufigste Antwort ist{" "}
                            <strong>{mostCommonAnswer.answer}</strong> mit{" "}
                            <strong>{mostCommonAnswer.percent}%</strong>.
                        </div>
                    )}

                    <div className="insight-item">
                        💡 Bei der ausgewählten Spalte wurden{" "}
                        <strong>{missingAnswers}</strong> leere Werte gefunden.
                    </div>

                    {numericStats.isNumeric ? (
                        <div className="insight-item">
                            💡 Der Durchschnitt der ausgewählten Spalte liegt bei{" "}
                            <strong>{formatNumber(numericStats.average)}</strong>.
                        </div>
                    ) : (
                        <div className="insight-item">
                            💡 Für diese Spalte wurde kein Durchschnitt berechnet,
                            da sie keine rein numerischen Werte enthält.
                        </div>
                    )}
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