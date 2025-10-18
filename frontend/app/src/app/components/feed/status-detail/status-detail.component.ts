import { Component, Input, ViewChild, ElementRef, SimpleChanges, OnChanges, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusCardComponent } from '../status-card/status-card.component';
import { StatusRplyCardComponent } from '../status-reply-card/status-reply-card.component';
import { ReplyService } from '../services/reply.service';
import { StatusWithRepliesResponse } from '../models/StatusWithRepliesResponseDto';
interface TimestampSeekRequest {
  lastHappenedAt: string;
  lastEntityId: string;
}
@Component({
  selector: 'app-status-detail',
  template: `
    <div #scrollContainer class="container-status-detail" (scroll)="onScroll()">

      @if (statusData; as data) {
        @if (data.statusResponse) {
          <app-status-card 
          [statusData]="data.statusResponse"
            (reloadRequested)="reloadRequested.emit($event)">

          ></app-status-card>
        }

        @if (data.replies.length > 0) {
          <div class="replies-section">
            <h3>Replies</h3>
            @for (reply of data.replies; track reply.replyId) {
              <app-status-reply-card [reply]="reply"
                [parentStatus]="data.statusResponse"
                ></app-status-reply-card>
            }
          </div>
        } @else {
          <p>No replies available.</p>
        }
      } @else {
        <p>Loading status...</p>
      }

    </div>
  `,
  styleUrls: ['./status-detail.component.css'],
  imports: [CommonModule, StatusCardComponent, StatusRplyCardComponent]
})
export class StatusDetailComponent implements OnChanges {
  @ViewChild('scrollContainer', { static: true }) scrollContainer!: ElementRef<HTMLDivElement>;
  @Input() statusData!: StatusWithRepliesResponse;
  @Output() reloadRequested = new EventEmitter<string>()
  timestampSeekRequest: TimestampSeekRequest = {
    lastEntityId: '',
    lastHappenedAt: ''
  };
  hasMoreReplies: boolean = true;

  constructor(private replyService: ReplyService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['statusData'] && this.statusData?.replies?.length) {
      const lastReply = this.statusData.replies[this.statusData.replies.length - 1];
      this.timestampSeekRequest.lastEntityId = lastReply.replyId;
    }
  }



  onScroll(): void {
    const container = this.scrollContainer.nativeElement;
    const threshold = 150;
    const position = container.scrollTop + container.clientHeight;
    const height = container.scrollHeight;

    if (position >= height - threshold) {
      this.onScrollDown();
    }
  }

  onScrollDown(): void {
    console.log('test')
    if (!this.statusData?.statusResponse || !this.hasMoreReplies) return;

    this.replyService.fetchMoreReplies(this.statusData.statusResponse.statusId, this.timestampSeekRequest)
      .subscribe({
        next: (newReplies) => {

          console.log(newReplies)
          if (newReplies.length > 0) {
            this.statusData.replies.push(...newReplies);
            const lastReply = this.statusData.replies[this.statusData.replies.length - 1];
            this.timestampSeekRequest.lastEntityId = lastReply.replyId;
          } else {
            this.hasMoreReplies = false;
            console.log(newReplies)
          }
        },
        error: (err) => console.error('Error loading more replies', err)
      });
  }
}
