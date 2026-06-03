import Papa from "papaparse";
import * as XLSX from "xlsx";

export function parseFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("Es wurde keine Datei ausgewählt."));
            return;
        }

        const fileName = file.name.toLowerCase();

        if (fileName.endsWith(".csv")) {
            parseCsvFile(file, resolve, reject);
            return;
        }

        if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            parseExcelFile(file, resolve, reject);
            return;
        }

        reject(new Error("Dieses Dateiformat wird nicht unterstützt. Bitte CSV oder Excel verwenden."));
    });
}

function parseCsvFile(file, resolve, reject) {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        encoding: "windows-1252",
        complete: (result) => {
            const rawRows = result.data || [];
            const metaFields = result.meta?.fields || [];

            if (rawRows.length === 0) {
                reject(new Error("Die CSV-Datei enthält keine lesbaren Datensätze."));
                return;
            }

            const cleanedData = cleanRows(rawRows);
            const columns = metaFields.length > 0 ? metaFields : getColumns(cleanedData);

            if (columns.length === 0) {
                reject(new Error("Es konnten keine Spalten in der CSV-Datei erkannt werden."));
                return;
            }

            const warnings = [];

            if (result.errors && result.errors.length > 0) {
                warnings.push(
                    `${result.errors.length} mögliche CSV-Formatprobleme wurden erkannt. Die lesbaren Daten wurden trotzdem importiert.`
                );
            }

            resolve({
                fileName: file.name,
                rows: cleanedData,
                columns,
                fileType: "CSV",
                warnings
            });
        },
        error: () => {
            reject(new Error("Die CSV-Datei konnte nicht gelesen werden."));
        }
    });
}

function parseExcelFile(file, resolve, reject) {
    const reader = new FileReader();

    reader.onload = (event) => {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: "array" });

            const firstSheetName = workbook.SheetNames[0];

            if (!firstSheetName) {
                reject(new Error("Die Excel-Datei enthält kein Tabellenblatt."));
                return;
            }

            const worksheet = workbook.Sheets[firstSheetName];

            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                defval: "",
                raw: false
            });

            const cleanedData = cleanRows(jsonData);
            const columns = getColumns(cleanedData);

            resolve({
                fileName: file.name,
                rows: cleanedData,
                columns,
                fileType: "Excel",
                sheetName: firstSheetName,
                warnings: []
            });
        } catch (error) {
            reject(new Error("Die Excel-Datei konnte nicht gelesen werden."));
        }
    };

    reader.onerror = () => {
        reject(new Error("Die Excel-Datei konnte nicht gelesen werden."));
    };

    reader.readAsArrayBuffer(file);
}

function cleanRows(rows) {
    return rows
        .filter((row) => {
            return Object.values(row).some((value) => String(value).trim() !== "");
        })
        .map((row) => {
            const cleanedRow = {};

            Object.entries(row).forEach(([key, value]) => {
                if (key === "__parsed_extra") {
                    return;
                }

                const cleanKey = String(key).trim();
                const cleanValue = value === null || value === undefined ? "" : String(value).trim();

                cleanedRow[cleanKey] = cleanValue;
            });

            return cleanedRow;
        });
}

function getColumns(rows) {
    if (!rows || rows.length === 0) {
        return [];
    }

    const columnSet = new Set();

    rows.forEach((row) => {
        Object.keys(row).forEach((key) => columnSet.add(key));
    });

    return Array.from(columnSet);
}

export function analyseData(rows, columns) {
    const totalRows = rows.length;
    let emptyValues = 0;
    let filledValues = 0;

    rows.forEach((row) => {
        columns.forEach((column) => {
            const value = row[column];

            if (value === "" || value === null || value === undefined) {
                emptyValues++;
            } else {
                filledValues++;
            }
        });
    });

    return {
        totalRows,
        totalColumns: columns.length,
        emptyValues,
        filledValues
    };
}