# Marktforschungs-Dashboard

Eine React-Web-Applikation zur Analyse und Visualisierung von Marktforschungsdaten aus CSV- und Excel-Dateien.

Die Daten werden direkt im Browser verarbeitet. Es wird keine Datenbank verwendet und die hochgeladenen Dateien werden nicht dauerhaft gespeichert.

## Funktionen

* Upload von CSV- und Excel-Dateien
* Drag & Drop für Dateien
* Auswahl einer Hauptspalte für die erste Grafik
* Optionale zweite Spalte für eine zweite Grafik
* Auswahl von Filterspalten
* Multi-Filter im Dashboard
* Kompakte Darstellung bei vielen Filterwerten
* Anzeige von KPIs, Missings und automatischen Erkenntnissen
* Balkendiagramm und Doughnut-Diagramm
* Datentabelle mit Suche, Sortierung und Pagination
* Lokale Verarbeitung im Browser

## Verwendete Technologien

* React
* Vite
* JavaScript
* CSS
* PapaParse
* SheetJS / XLSX
* Chart.js
* react-chartjs-2

## Installation

Projekt klonen:

```bash
git clone https://github.com/DiegoLario/marktforschungs-dashboard.git
```

In den Projektordner wechseln:

```bash
cd marktforschungs-dashboard
```

Abhängigkeiten installieren:

```bash
npm install
```

Projekt starten:

```bash
npm run dev
```

Danach kann die lokale URL im Browser geöffnet werden, zum Beispiel:

```bash
http://localhost:5173
```

## Nutzung

1. CSV- oder Excel-Datei hochladen.
2. Hauptspalte und optional eine zweite Spalte auswählen.
3. Filterspalten auswählen.
4. Dashboard starten.
5. Daten über Filter, Diagramme und Tabelle analysieren.
6. Bei Bedarf zurück zu „Daten konfigurieren“ wechseln und die Auswahl anpassen.
