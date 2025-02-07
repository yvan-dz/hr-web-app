import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // FormsModule importieren
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { SalaryPackageComponent } from './salary-package/salary-package.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: []
})
export class AppModule { }

bootstrapApplication(AppComponent, {
  providers: [],
});
