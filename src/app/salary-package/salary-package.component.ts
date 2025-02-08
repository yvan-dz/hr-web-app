import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { saveAs } from 'file-saver';
import CryptoJS from "crypto-js";


@Component({
  selector: 'app-salary-package',
  standalone: true,
  imports: [CommonModule, FormsModule, MatInputModule, MatCheckboxModule, MatButtonModule, MatCardModule, MatSelectModule],
  templateUrl: './salary-package.component.html',
  styleUrls: ['./salary-package.component.css']
})
export class SalaryPackageComponent {
  // **Variablen für Gehaltsberechnung**
  baseSalary: number = 40000;
  vacationDays: number = 28;
  workingHours: number = 40;
  companyCar: boolean = false;
  jobBike: boolean = false;
  overtimeHours: number = 0;
  performanceBonus: number = 0;
  selectedTaxClass: number = 1; // Standard: Steuerklasse 1
  taxAmount: number = 0; // Steuerabzüge
  netSalary: number = 0;


  /**
   * Berechnet das Netto-Gehalt und Steuerabzüge.
   */
  updateSalary(): void {
    let salary = this.baseSalary;

    salary -= this.getVacationPenalty();
    salary -= this.getHoursPenalty();
    salary += this.getExtraHoursBonus(); // Bonus für mehr Arbeitsstunden
    salary += this.getOvertimeBonus();
    salary += this.performanceBonus;

    // 🏎️ **Firmenwagen & JobRad als monatliche Abzüge berechnen**
    if (this.companyCar) salary -= (500 * 12);  // 500€ pro Monat = 6000€ pro Jahr
    if (this.jobBike) salary -= (50 * 12);  // 50€ pro Monat = 600€ pro Jahr

    // 🏛 Steuerberechnung durchführen (auf Brutto-Gehalt inkl. Abzüge)
    this.taxAmount = this.calculateTaxes(salary);
    this.netSalary = Math.round(salary - this.taxAmount);
}


  

  /**
   * Berechnet die Steuerabzüge basierend auf Steuerklasse.
   */
  calculateTaxes(income: number): number {
    let taxRate = this.getProgressiveTaxRate(income);
    let taxFreeAmount = this.getTaxFreeAmount();
    let taxableIncome = Math.max(0, income - taxFreeAmount);
    return Math.round(taxableIncome * taxRate);
  }

  /**
   * Steuerfreibeträge für jede Steuerklasse.
   */
  getTaxFreeAmount(): number {
    switch (this.selectedTaxClass) {
      case 1: return 10908; // Grundfreibetrag
      case 2: return 10908 + 4260; // Steuerklasse 2: Alleinerziehende
      case 3: return 21000; // Steuerklasse 3: Verheiratete mit Alleinverdiener-Vorteil
      case 4: return 10908; // Steuerklasse 4: Verheiratete ohne Vorteile
      case 5: return 0; // Steuerklasse 5: Kein Freibetrag
      case 6: return 0; // Steuerklasse 6: Höchste Steuerklasse
      default: return 10908;
    }
  }

  /**
   * Progressive Steuerberechnung basierend auf Einkommen.
   */
  getProgressiveTaxRate(income: number): number {
    if (income <= 10908) return 0.0;
    if (income <= 16000) return 0.14;
    if (income <= 31000) return 0.24;
    if (income <= 60000) return 0.32;
    if (income <= 90000) return 0.42;
    return 0.45;
  }

  /**
   * Berechnet die Gehaltskürzung für Urlaub.
   */
  getVacationPenalty(): number {
    return this.vacationDays > 30 ? (this.vacationDays - 30) * 150 : 0;
  }

  /**
   * Berechnet die Gehaltskürzung für Teilzeit.
   */
  getHoursPenalty(): number {
    return this.workingHours < 40 ? (40 - this.workingHours) * (this.baseSalary / 40) : 0;
  }

 /**
   * Berechnet zusätzlichen Gehaltsanteil für mehr als 40 Arbeitsstunden/Woche.
   */
 getExtraHoursBonus(): number {
  return this.workingHours > 40 ? (this.workingHours - 40) * (this.baseSalary / 160) : 0;
}

/**
 * Berechnet die Vergütung für Überstunden (jede Überstunde zählt).
 */
getOvertimeBonus(): number {
  return this.overtimeHours * 30; // Jede Überstunde = 30 €
}

  /**
   * Speichert die Gehaltsdaten als JSON.
   */
  savePackage(): void {
    const fileName = prompt("Geben Sie den Namen der JSON-Datei ein:", "gehaltspaket");
    if (!fileName) return; // Falls der Benutzer abbricht

    const password = prompt("Setzen Sie ein Passwort für die Datei:");
    if (!password) {
        alert("Speichern abgebrochen. Kein Passwort eingegeben.");
        return;
    }

    const data = {
        baseSalary: this.baseSalary,
        vacationDays: this.vacationDays,
        workingHours: this.workingHours,
        overtimeHours: this.overtimeHours,
        companyCar: this.companyCar,
        jobBike: this.jobBike,
        performanceBonus: this.performanceBonus,
        selectedTaxClass: this.selectedTaxClass,
        netSalary: this.updateSalary(),
        taxAmount: this.taxAmount
    };

    // JSON-Daten in String umwandeln
    const jsonString = JSON.stringify(data);

    // **AES-Verschlüsselung mit dem eingegebenen Passwort**
    const encryptedData = CryptoJS.AES.encrypt(jsonString, password).toString();

    // Datei speichern
    const blob = new Blob([encryptedData], { type: "application/json" });
    saveAs(blob, `${fileName}.json`);

    alert("Die Datei wurde sicher verschlüsselt gespeichert.");
}


  /**
   * Lädt eine gespeicherte JSON-Datei.
   */
  loadPackageFromFile(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
        const encryptedData = e.target.result;

        const password = prompt("Geben Sie das Passwort ein, um die Datei zu entschlüsseln:");
        if (!password) {
            alert("Laden abgebrochen. Kein Passwort eingegeben.");
            return;
        }

        try {
            // **Entschlüsselung mit AES**
            const bytes = CryptoJS.AES.decrypt(encryptedData, password);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedData) {
                throw new Error("Falsches Passwort oder beschädigte Datei.");
            }

            // **JSON-Daten parsen**
            const data = JSON.parse(decryptedData);

            // **Daten setzen**
            this.baseSalary = data.baseSalary;
            this.vacationDays = data.vacationDays;
            this.workingHours = data.workingHours;
            this.overtimeHours = data.overtimeHours;
            this.companyCar = data.companyCar;
            this.jobBike = data.jobBike;
            this.performanceBonus = data.performanceBonus;
            this.selectedTaxClass = data.selectedTaxClass;

            // **Gehaltsberechnung aktualisieren**
            this.updateSalary();

            alert("Die Datei wurde erfolgreich geladen.");
        } catch (error) {
            alert("Fehler beim Laden der Datei: Falsches Passwort oder beschädigte Datei.");
        }
    };

    reader.readAsText(file);
}


  /**
   * Erstellt ein PDF mit Gehaltsdetails.
   */
  exportToPDF(): void {
    const fileName = prompt("Geben Sie den Namen der PDF-Datei ein:", "gehaltspaket");
    if (!fileName) return;

    const doc = new jsPDF();

    // ** Titel Formatieren **
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("Gehaltspaket Übersicht", 105, 15, { align: "center" });

    // ** Linie unter dem Titel **
    doc.setLineWidth(0.5);
    doc.line(14, 20, 196, 20);

    // ** Abschnittstitel **
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 150); // Dunkelblau
    doc.text("Allgemeine Daten", 14, 30);

    // ** Tabelle mit Rahmen und Hintergrundfarben **
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const tableData = [
        ["Grundgehalt:", `${this.baseSalary} €`],
        ["Urlaubstage:", `${this.vacationDays} Tage`],
        ["Arbeitsstunden:", `${this.workingHours} Stunden/Woche`],
        ["Überstunden:", `${this.overtimeHours} Stunden/Monat`],
        ["Firmenwagen:", this.companyCar ? "Ja (-800 €)" : "Nein"],
        ["JobRad:", this.jobBike ? "Ja (-50 €)" : "Nein"],
        ["Bonus:", `${this.performanceBonus} €`],
        ["Steuerklasse:", `Klasse ${this.selectedTaxClass}`],
        ["Steuerabzüge:", `-${this.taxAmount} €`],
        
    ];

    let yPosition = 37;
    tableData.forEach(([key, value], index) => {
        // Hintergrundfarbe für abwechselnde Zeilen
        if (index % 2 === 0) {
            doc.setFillColor(240, 240, 240); // Hellgrau
            doc.rect(14, yPosition - 4, 180, 6, "F"); // Rechteck als Hintergrund
        }

        // ** Schlüssel (links) **
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(key, 14, yPosition);

        // ** Wert (rechts) **
        doc.setFont("helvetica", "normal");
        doc.text(value, 90, yPosition);

        yPosition += 7;
    });

    // ** Netto-Gehalt hervorheben **
    doc.setFillColor(255, 230, 204); // Helles Orange für Netto-Gehalt
    doc.rect(14, yPosition - 4, 180, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 150, 0); // Rot für Netto-Gehalt
    doc.text(" Netto-Gehalt:", 14, yPosition);
    doc.setFont("helvetica", "bold");
    doc.text(`${this.netSalary} €`, 90, yPosition);

    // ** Speichern der Datei **
    doc.save(`${fileName}.pdf`);
}
  
  /**
   * Erstellt und speichert die Dokumentation als PDF mit professionellem Styling.
   */
  exportDocumentationToPDF(): void {
    const fileName = "Gehaltspaket_Dokumentation";
    const doc = new jsPDF("p", "mm", "a4");
    let yPosition = 20;

    // Funktion für Abschnittstitel mit professioneller Formatierung
    const addSectionTitle = (title: string) => {
        if (yPosition > 270) { // Falls Seite voll, neue Seite
            doc.addPage();
            yPosition = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14); // Klare und gut lesbare Größe für Überschriften
        doc.setTextColor(0, 0, 128);
        doc.text(title, 14, yPosition);
        yPosition += 8;
        doc.setDrawColor(0, 0, 128);
        doc.line(14, yPosition, 196, yPosition); // Linie unter der Überschrift
        yPosition += 6;
    };

    // Funktion für normalen Text mit schönem Abstand und automatischem Seitenumbruch
    const addContent = (text: string) => {
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
        }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11); // Gut lesbare Schriftgröße für Text
        doc.setTextColor(50, 50, 50);
        const splitText = doc.splitTextToSize(text, 180);
        doc.text(splitText, 14, yPosition);
        yPosition += splitText.length * 6; // Genügend Abstand für nächsten Abschnitt
    };

    // Titel
    doc.setFontSize(16);
    doc.setTextColor(30, 30, 30);
    doc.text("Gehaltspaket Dokumentation", 105, yPosition, { align: "center" });
    yPosition += 10;

    // Linie unter dem Titel
    doc.setLineWidth(0.5);
    doc.line(14, yPosition, 196, yPosition);
    yPosition += 8;

    // Einführung
    addSectionTitle("1. Einführung");
    addContent(
        "Der Gehaltspaket-Konfigurator ermöglicht es Mitarbeitenden, verschiedene Faktoren wie " +
        "das Grundgehalt, Überstunden, Urlaubstage und Zusatzleistungen anzupassen. Die Anwendung " +
        "berechnet in Echtzeit das Netto-Gehalt, berücksichtigt Steuerabzüge und ermöglicht " +
        "die Speicherung als JSON oder PDF."
    );

    // Gehaltsberechnung
    addSectionTitle("2. Gehaltsberechnung");
    addContent("Das Gehalt setzt sich aus mehreren Faktoren zusammen:");

    const bulletPoints = [
        "Grundgehalt: Basisbruttoeinkommen.",
        "Steuerklasse: Steuerliche Einstufung beeinflusst Abzüge.",
        "Urlaubstage: Ab 30 Tagen Gehaltskürzung von 150 € pro Tag.",
        "Arbeitsstunden pro Woche: Mehr als 40 Stunden = Gehaltssteigerung.",
        "Überstunden: Jede Überstunde wird mit 30 € vergütet.",
        "Firmenwagen: Gehaltsabzug von 500 € pro Monat (~340 € nach Steuerabzug).",
        "JobRad: Gehaltsabzug von 50 € pro Monat (~34 € nach Steuerabzug).",
        "Leistungsbonus: Individuelle Bonuszahlungen."
    ];

    bulletPoints.forEach((point, index) => {
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
        }
        doc.setFontSize(11);
        doc.text(`• ${point}`, 18, yPosition);
        yPosition += 6;
    });

    yPosition += 10;

    // Steuerberechnung
    addSectionTitle("3. Steuerberechnung");
    addContent(
        "Die Steuerberechnung erfolgt in drei Schritten:\n\n" +
        "1. Steuerfreibetrag abziehen:\n" +
        "   - Jede Steuerklasse hat einen festen Freibetrag.\n" +
        "   - Beispiel (Steuerklasse 1, Jahreseinkommen 40.000 €):\n" +
        "     - Steuerfreibetrag: 10.908 €\n" +
        "     - Zu versteuerndes Einkommen: 40.000 € - 10.908 € = 29.092 €\n\n" +
        "2. Steuersatz nach Einkommenshöhe berechnen:\n" +
        "   - Steuerprogression: Je höher das Einkommen, desto höher der Steuersatz.\n" +
        "   - Berechnung für Steuerklasse 1:\n" +
        "     - 0 € - 10.908 €: 0 % Steuer = 0 €\n" +
        "     - 10.908 € - 16.000 € (5.092 €): 14 % Steuer = 713 €\n" +
        "     - 16.000 € - 31.000 € (15.000 €): 24 % Steuer = 3.600 €\n" +
        "     - 31.000 € - 40.000 € (9.000 €): 32 % Steuer = 2.880 €\n" +
        "     - Gesamtsteuer: 713 € + 3.600 € + 2.880 € = 7.193 €\n\n" +
        "3. Netto-Gehalt berechnen:\n" +
        "   - Brutto-Gehalt: 40.000 €\n" +
        "   - Steuerabzug: 7.193 €\n" +
        "   - Netto-Gehalt pro Jahr: 40.000 € - 7.193 € = 32.807 €\n" +
        "   - Netto-Gehalt pro Monat: 32.807 € / 12 = 2.734 €\n\n" +
        "Ein Firmenwagen oder JobRad wird zum Bruttogehalt addiert und somit versteuert. Beispiel für einen Firmenwagen mit 500 € pro Monat:\n" +
        "   - Neues Brutto: 40.000 € + (500 € * 12) = 46.000 €\n" +
        "   - Steuer auf 46.000 € berechnen (mit höheren Steuersätzen)\n" +
        "   - Netto-Gehalt nach Abzug der Steuer und des Firmenwagen-Wertes."
    );

    yPosition += 10;

    // Speicher- und Exportfunktionen
    addSectionTitle("4. Speicher- und Exportfunktionen");
    addContent("Der Gehaltsrechner erlaubt es, die Konfiguration als JSON zu speichern oder als PDF zu exportieren.");

    const saveOptions = [
        "JSON speichern: Zur späteren Nutzung oder Bearbeitung.",
        "PDF-Export: Optisch formatierte Gehaltsübersicht."
    ];

    saveOptions.forEach((point, index) => {
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
        }
        doc.setFontSize(11);
        doc.text(`• ${point}`, 18, yPosition);
        yPosition += 6;
    });

    yPosition += 10;

    // Nutzungshinweise
    addSectionTitle("5. Nutzungshinweise");
    addContent("Falls nach einer Aktualisierung der Seite nicht gespeicherte Daten verloren gehen, empfehlen wir, die JSON-Speicherfunktion zu nutzen.");

    // Speichern der PDF-Datei
    doc.save(`${fileName}.pdf`);
}
}



