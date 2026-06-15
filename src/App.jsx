import React, { useMemo, useState } from "react";
import FileUpload from "./components/FileUpload";
import DataConfig from "./components/DataConfig";
import Dashboard from "./components/Dashboard";
import DataTable from "./components/DataTable";
import { analyseData } from "./utils/fileParser";

function App() {
    const [fileData, setFileData] = useState(null);
    const [config, setConfig] = useState(null);
    const [currentPage, setCurrentPage] = useState("upload");

    const analysis = useMemo(() => {
        if (!fileData) {
            return null;
        }

        return analyseData(fileData.rows, fileData.columns);
    }, [fileData]);

    function handleFileLoaded(parsedFile) {
        setFileData(parsedFile);
        setConfig(null);
        setCurrentPage("config");
    }

    function handleStartDashboard(newConfig) {
        setConfig(newConfig);
        setCurrentPage("dashboard");
    }

    function handleReset() {
        setFileData(null);
        setConfig(null);
        setCurrentPage("upload");
    }

    function handleOpenTable() {
        setCurrentPage("table");
    }

    function handleBackToDashboard() {
        setCurrentPage("dashboard");
    }

    function handleBackToConfig() {
        setCurrentPage("config");
    }

    if (!fileData || currentPage === "upload") {
        return (
            <FileUpload onFileLoaded={handleFileLoaded} />
        );
    }

    if (fileData && currentPage === "config") {
        return (
            <DataConfig
                fileData={fileData}
                analysis={analysis}
                initialConfig={config}
                onStartDashboard={handleStartDashboard}
                onReset={handleReset}
            />
        );
    }

    if (fileData && config && currentPage === "table") {
        return (
            <DataTable
                rows={fileData.rows}
                columns={fileData.columns}
                fileName={fileData.fileName}
                onBack={handleBackToDashboard}
            />
        );
    }

    return (
        <Dashboard
            fileData={fileData}
            analysis={analysis}
            config={config}
            onReset={handleReset}
            onOpenTable={handleOpenTable}
            onBackToConfig={handleBackToConfig}
        />
    );
}

export default App;