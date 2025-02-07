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
    if (this.companyCar) salary -= 800;
    if (this.jobBike) salary -= 50;
    salary += this.performanceBonus;

    // 🏛 Steuerberechnung sofort durchführen
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

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `${fileName}.json`);
  }


  /**
   * Lädt eine gespeicherte JSON-Datei.
   */
  loadPackageFromFile(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = JSON.parse(e.target.result);
        this.baseSalary = data.baseSalary;
        this.vacationDays = data.vacationDays;
        this.workingHours = data.workingHours;
        this.overtimeHours = data.overtimeHours;
        this.companyCar = data.companyCar;
        this.jobBike = data.jobBike;
        this.performanceBonus = data.performanceBonus;
        this.selectedTaxClass = data.selectedTaxClass;

        // **Gehalt sofort neu berechnen**
        this.updateSalary();

      } catch (error) {
        console.error("Fehler beim Laden der Datei", error);
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

}
