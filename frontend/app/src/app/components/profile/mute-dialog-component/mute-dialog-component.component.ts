import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MuteDuration } from '../models/MuteDurationDto';

@Component({
  selector: 'app-mute-dialog',
  imports: [
    MatDialogModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    ReactiveFormsModule,
    CommonModule

  ],
  template: `
    <h2 mat-dialog-title>Mute User</h2>
    <mat-dialog-content>
      <form [formGroup]="muteForm" style="padding: 5px;">
  <mat-form-field appearance="outline">
    <mat-label>Duration</mat-label>
    <mat-select formControlName="unit" (selectionChange)="onUnitChange($event)">
      <mat-option value="hours">Hours</mat-option>
      <mat-option value="days">Days</mat-option>
      <mat-option value="months">Months</mat-option>
      <mat-option value="forever">Forever</mat-option>
    </mat-select>
  </mat-form-field>

  <mat-form-field appearance="outline" *ngIf="muteForm.get('unit')?.value !== 'forever'">
    <mat-label>Amount</mat-label>
   <input
  matInput
  type="number"
  formControlName="amount"
  [min]="getAmountLimits().min"
  [max]="getAmountLimits().max"
  (input)="clampAmountValue()"
  required
/>

    <mat-error *ngIf="muteForm.get('amount')?.hasError('required')">
      Amount is required
    </mat-error>
    <mat-error *ngIf="muteForm.get('amount')?.hasError('min')">
      Amount must be at least {{ getAmountLimits().min }}
    </mat-error>
    <mat-error *ngIf="muteForm.get('amount')?.hasError('max')">
      Amount cannot exceed {{ getAmountLimits().max }}
    </mat-error>
  </mat-form-field>
</form>

    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="muteForm.invalid" (click)="mute()">Mute</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-form-field {
        width: 100%;
        margin-bottom: 16px;
      }
      mat-dialog-actions {
        margin-top: 16px;
      }
    `,
  ],
})
export class MuteDialogComponent {
  muteForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MuteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string, isMuted: boolean }
  ) {
    this.muteForm = this.fb.group({
      unit: ['days', Validators.required],
      amount: [1, [Validators.required, Validators.min(1)]],
    });
  }

  onUnitChange(event: any) {
    const { min, max } = this.getAmountLimits();
    const amountControl = this.muteForm.get('amount');
    if (amountControl) {
      amountControl.setValidators([
        Validators.required,
        Validators.min(min),
        Validators.max(max),
      ]);
      amountControl.updateValueAndValidity();
    }
  }
  clampAmountValue() {
    const amountControl = this.muteForm.get('amount');
    if (!amountControl) return;

    const { min, max } = this.getAmountLimits();
    let val = amountControl.value;

    if (val == max) {
      amountControl.setValue(min + 1);
    }
    if (val == min) {
      amountControl.setValue(max - 1);
    }
  }

  getAmountLimits() {
    const unit = this.muteForm.get('unit')?.value;
    if (unit === 'hours') {
      return { min: 0, max: 24 };
    } else if (unit === 'days') {
      return { min: 0, max: 29 };
    } else if (unit === 'months') {
      return { min: 0, max: 13 };
    } else {
      return { min: 1, max: 10 }; // default fallback if needed
    }
  }


  mute(): void {
    if (this.muteForm.valid) {
      const { amount, unit } = this.muteForm.value;
      this.dialogRef.close({ amount: unit === 'forever' ? 0 : amount, unit } as MuteDuration);
    }
  }


  onCancel(): void {
    this.dialogRef.close(true);
  }
}