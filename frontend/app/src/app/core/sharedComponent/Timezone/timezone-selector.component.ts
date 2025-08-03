import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { TIMEZONES } from '../../constants/timezones.constant';


@Component({
  selector: 'app-timezone-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule
  ],
  templateUrl: './timezone-selector.component.html',
})
export class TimezoneSelectorComponent {
  @Input() control!: FormControl;

  timezones = TIMEZONES;
  filteredTimezones = TIMEZONES;


  onTimezoneInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    this.filterTimezones(input);
  }

  filterTimezones(searchTerm: string): void {
    const term = searchTerm.toLowerCase();
    this.filteredTimezones = this.timezones
      .map(group => ({
        group: group.group,
        zones: group.zones.filter(zone =>
          zone.toLowerCase().includes(term)
        )
      }))
      .filter(group => group.zones.length > 0);
  }


  get hasRequiredError() {
    return this.control?.touched && this.control?.errors?.['required'];
  }

  get hasInvalidTimezoneError() {
    return this.control?.touched && this.control?.errors?.['invalidTimezone'];
  }

}
