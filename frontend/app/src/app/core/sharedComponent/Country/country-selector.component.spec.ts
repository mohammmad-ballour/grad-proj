import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResidenceSelectorComponent } from './country-selector.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('ResidenceSelectorComponent', () => {
  let component: ResidenceSelectorComponent;
  let fixture: ComponentFixture<ResidenceSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResidenceSelectorComponent], // ✅ لأن الكمبوننت مش standalone
      imports: [
        ReactiveFormsModule,
        FormsModule,
        CommonModule,
        HttpClientTestingModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatAutocompleteModule,
        MatOptionModule,
        BrowserAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResidenceSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
