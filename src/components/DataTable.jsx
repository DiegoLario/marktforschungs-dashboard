import React, { useMemo, useState } from "react";

function DataTable({ rows, columns, fileName, onBack }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(100);
    const [sortConfig, setSortConfig] = useState({
        column: "",
        direction: "asc"
    });

    const visibleColumns = columns;

    const searchedRows = useMemo(() => {
        if (!searchTerm.trim()) {
            return rows;
        }

        const normalizedSearch = searchTerm.toLowerCase();

        return rows.filter((row) => {
            return visibleColumns.some((column) => {
                return String(row[column] || "")
                    .toLowerCase()
                    .includes(normalizedSearch);
            });
        });
    }, [rows, visibleColumns, searchTerm]);

    const sortedRows = useMemo(() => {
        if (!sortConfig.column) {
            return searchedRows;
        }

        return [...searchedRows].sort((a, b) => {
            const valueA = a[sortConfig.column];
            const valueB = b[sortConfig.column];

            const comparison = compareValues(valueA, valueB);

            if (sortConfig.direction === "asc") {
                return comparison;
            }

            return comparison * -1;
        });
    }, [searchedRows, sortConfig]);

    const showAllRows = rowsPerPage === "all";

    const totalPages = showAllRows
        ? 1
        : Math.ceil(sortedRows.length / rowsPerPage);

    const paginatedRows = useMemo(() => {
        if (showAllRows) {
            return sortedRows;
        }

        const startIndex = (currentPage - 1) * rowsPerPage;
        return sortedRows.slice(startIndex, startIndex + rowsPerPage);
    }, [sortedRows, currentPage, rowsPerPage, showAllRows]);

    function handleSearchChange(event) {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    }

    function resetSearch() {
        setSearchTerm("");
        setCurrentPage(1);
    }

    function handleRowsPerPageChange(event) {
        const selectedValue = event.target.value;

        if (selectedValue === "all") {
            setRowsPerPage("all");
        } else {
            setRowsPerPage(Number(selectedValue));
        }

        setCurrentPage(1);
    }

    function handleSort(column) {
        setSortConfig((currentSort) => {
            if (currentSort.column === column) {
                return {
                    column,
                    direction: currentSort.direction === "asc" ? "desc" : "asc"
                };
            }

            return {
                column,
                direction: "asc"
            };
        });

        setCurrentPage(1);
    }

    function goToPreviousPage() {
        setCurrentPage((page) => Math.max(page - 1, 1));
    }

    function goToNextPage() {
        setCurrentPage((page) => Math.min(page + 1, totalPages));
    }

    function getSortIcon(column) {
        if (sortConfig.column !== column) {
            return "↕";
        }

        return sortConfig.direction === "asc" ? "↑" : "↓";
    }

    return (
        <section className="table-page">
            <div className="table-page-header">
                <div className="page-title-block">
                    <div className="page-title-row">
                        <div className="page-icon-box">
                            <img
                                src="Marktforschung.png"
                                alt="Marktforschung"
                                className="market-icon"
                            />
                        </div>

                        <h1>Datentabelle</h1>
                    </div>

                    <p>Datei: {fileName}</p>
                </div>

                <button className="primary-button real-button" onClick={onBack}>
                    Zurück zum Dashboard
                </button>
            </div>

            <div className="table-control-card">
                <div className="table-control-left">
                    <label>
                        Suche
                        <div className="search-control">
                            <input
                                type="text"
                                placeholder="Suchbegriff eingeben..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />

                            {searchTerm.trim() && (
                                <button
                                    type="button"
                                    className="small-button"
                                    onClick={resetSearch}
                                >
                                    Suche zurücksetzen
                                </button>
                            )}
                        </div>
                    </label>

                    <label>
                        Einträge pro Seite
                        <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                            <option value={500}>500</option>
                            <option value={1000}>1000</option>
                            <option value="all">Alle</option>
                        </select>
                    </label>
                </div>

                <div className="table-count">
                    <strong>{sortedRows.length}</strong> von {rows.length} Datensätzen
                </div>
            </div>

            <div className="excel-table-wrapper">
                <table className="excel-table">
                    <thead>
                        <tr>
                            {visibleColumns.map((column) => (
                                <th key={column}>
                                    <button
                                        type="button"
                                        className="table-sort-button"
                                        onClick={() => handleSort(column)}
                                    >
                                        <span>{column}</span>
                                        <span>{getSortIcon(column)}</span>
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedRows.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length}>
                                    Keine Datensätze gefunden.
                                </td>
                            </tr>
                        ) : (
                            paginatedRows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {visibleColumns.map((column) => (
                                        <td key={column}>
                                            {isEmptyValue(row[column]) ? "-" : row[column]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!showAllRows && (
                <div className="table-pagination">
                    <button onClick={goToPreviousPage} disabled={currentPage === 1}>
                        Zurück
                    </button>

                    <span>
                        Seite {currentPage} von {totalPages || 1}
                    </span>

                    <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        Weiter
                    </button>
                </div>
            )}

            {showAllRows && (
                <div className="table-pagination">
                    <span>Alle gefilterten Datensätze werden angezeigt.</span>
                </div>
            )}
        </section>
    );
}

function compareValues(valueA, valueB) {
    const emptyA = isEmptyValue(valueA);
    const emptyB = isEmptyValue(valueB);

    if (emptyA && emptyB) {
        return 0;
    }

    if (emptyA) {
        return 1;
    }

    if (emptyB) {
        return -1;
    }

    const numberA = convertToNumber(valueA);
    const numberB = convertToNumber(valueB);

    if (numberA !== null && numberB !== null) {
        return numberA - numberB;
    }

    return String(valueA).localeCompare(String(valueB), "de-CH", {
        numeric: true,
        sensitivity: "base"
    });
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

export default DataTable;