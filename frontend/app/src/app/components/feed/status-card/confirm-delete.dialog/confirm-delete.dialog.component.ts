import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-confirm-delete-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-4" style="min-width:300px">
      <h3 class="m-0 flex items-center gap-2">
        <mat-icon>delete</mat-icon> Delete status?
      </h3>
      <p class="mt-2 mb-4">This can’t be undone.</p>
      <div class="flex justify-end gap-2">
        <button mat-button (click)="ref.close(false)">Cancel</button>
        <button mat-raised-button color="warn" (click)="ref.close(true)">Delete</button>
      </div>
    </div>
  `
})
export class ConfirmDeleteDialogComponent {
  constructor(
    public ref: MatDialogRef<ConfirmDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { statusId: string }
  ) { }
}
