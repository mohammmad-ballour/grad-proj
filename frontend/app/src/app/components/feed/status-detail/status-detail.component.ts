import { Component, Input } from '@angular/core';
import { StatusWithRepliesResponse } from '../models/StatusWithRepliesResponseDto';
import { CommonModule } from '@angular/common';
import { StatusCardComponent } from "../status-card/status-card.component"; // Import CommonModule and DatePipe
import { StatusRplyCardComponent } from "../status-reply-card/status-reply-card.component";

@Component({
  selector: 'app-status-detail',
  templateUrl: './status-detail.component.html',
  styleUrls: ['./status-detail.component.css'],
  imports: [CommonModule, StatusCardComponent, StatusRplyCardComponent]
})
export class StatusDetailComponent {
  @Input() statusData!: StatusWithRepliesResponse;
}