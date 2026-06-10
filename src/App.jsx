import React, { useMemo, useState } from "react";
import FileUpload from "./components/FileUpload";
import DataConfig from "./components/DataConfig";
import Dashboard from "./components/Dashboard";
import { analyseData } from "./utils/fileParser";

function App() {
    const [fileData, setFileData] = useState(null);
    const [config, setConfig] = useState(null);

    const analysis = useMemo(() => {
        if (!fileData) {
            return null;
        }

        return analyseData(fileData.rows, fileData.columns);
    }, [fileData]);

    function handleFileLoaded(parsedFile) {
        setFileData(parsedFile);
        setConfig(null);
    }

    function handleStartDashboard(newConfig) {
        setConfig(newConfig);
    }

    function handleReset() {
        setFileData(null);
        setConfig(null);
    }

    if (!fileData) {
        return (
            <FileUpload onFileLoaded={handleFileLoaded} />
        );
    }

    if (fileData && !config) {
        return (
            <DataConfig
                fileData={fileData}
                analysis={analysis}
                onStartDashboard={handleStartDashboard}
                onReset={handleReset}
            />
        );
    }

    return (
        <Dashboard
            fileData={fileData}
            analysis={analysis}
            config={config}
            onReset={handleReset}
        />
    );
}

export default App;