import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { COUNTRIES } from '../../constants/countries.constant';
@Component({
  selector: 'app-country-selector',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule
  ], templateUrl: 'country-selector.component.html',
  styleUrl: './country-selector.component.css'
})
export class CountrySelectorComponent {
  @Input() control!: FormControl;
  filteredCountries: string[] = COUNTRIES;

  filterCountries(searchText: string): void {
    const query = searchText.toLowerCase().trim();
    this.filteredCountries = COUNTRIES.filter(c =>
      c.toLowerCase().includes(query)
    );
  }

  onCountryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filterCountries(input.value);
  }

}
