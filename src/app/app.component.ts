import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalaryPackageComponent } from './salary-package/salary-package.component';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SalaryPackageComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'HR Web App';
}
