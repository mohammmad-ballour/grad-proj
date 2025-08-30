import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MessageResponse } from '../../models/message-response';
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from '@angular/common';
import { MatMenu } from "@angular/material/menu";

@Component({
  selector: 'app-media-preview-dialog',
  templateUrl: './media-preview-dialog.component.html',
  styleUrls: ['./media-preview-dialog.component.css'],
  standalone: true,
  imports: [MatIconModule, CommonModule, MatMenu]
})
export class MediaPreviewDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MessageResponse,
    private dialogRef: MatDialogRef<MediaPreviewDialogComponent>
  ) { }

  ngOnInit() {
    console.log(this.data);
  }

  close() {
    this.dialogRef.close();
  }
}
