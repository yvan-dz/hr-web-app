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

  /**
   * Berechnet das Netto-Gehalt und Steuerabzüge.
   */
  calculateSalary(): number {
    let salary = this.baseSalary;
    salary -= this.getVacationPenalty();
    salary -= this.getHoursPenalty();
    salary += this.getOvertimeBonus();
    if (this.companyCar) salary -= 800;
    if (this.jobBike) salary -= 50;
    salary += this.performanceBonus;
  
    // 🏛 Steuerberechnung
    setTimeout(() => {
      this.taxAmount = this.calculateTaxes(salary);
    });
  
    salary -= this.taxAmount;
    return Math.round(salary);
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
   * Berechnet die Vergütung für Überstunden.
   */
  getOvertimeBonus(): number {
    return this.overtimeHours > 10 ? (this.overtimeHours - 10) * 30 : 0;
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
      netSalary: this.calculateSalary(),
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
    if (!fileName) return; // Falls der Benutzer abbricht

    const doc = new jsPDF();
    doc.text("📄 Gehaltspaket Übersicht", 10, 10);
    doc.text(`Grundgehalt: ${this.baseSalary}€`, 10, 20);
    doc.text(`Urlaubstage: ${this.vacationDays}`, 10, 30);
    doc.text(`Arbeitsstunden: ${this.workingHours}`, 10, 40);
    doc.text(`Überstunden: ${this.overtimeHours}`, 10, 50);
    doc.text(`Firmenwagen: ${this.companyCar ? 'Ja' : 'Nein'}`, 10, 60);
    doc.text(`JobRad: ${this.jobBike ? 'Ja' : 'Nein'}`, 10, 70);
    doc.text(`Bonus: ${this.performanceBonus}€`, 10, 80);
    doc.text(`Steuerklasse: ${this.selectedTaxClass}`, 10, 90);
    doc.text(`Steuerabzüge: ${this.taxAmount}€`, 10, 100);
    doc.text(`Neues Netto-Gehalt: ${this.calculateSalary()}€`, 10, 110);
    doc.save(`${fileName}.pdf`);
  }
}
