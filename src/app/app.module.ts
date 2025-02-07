import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; 
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { SalaryPackageComponent } from './salary-package/salary-package.component';

import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';

// Deutsche Lokalisierung aktivieren
registerLocaleData(localeDe);

@NgModule({
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'de-DE' } // Setzt Deutsch als Standard-Lokalisierung
  ]
})
export class AppModule { }

bootstrapApplication(AppComponent, {
  providers: [
    { provide: LOCALE_ID, useValue: 'de-DE' } // Auch hier sicherstellen, dass de-DE genutzt wird
  ],
});
