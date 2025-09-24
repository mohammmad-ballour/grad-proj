import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { StatusResponse, StatusWithRepliesResponse } from './models/StatusWithRepliesResponseDto';
import { ActivatedRoute } from '@angular/router';
import { StatusDetailComponent } from "./status-detail/status-detail.component";
import { Subject, takeUntil } from 'rxjs';
import { StatusServices } from './services/status.services';
import { MatIconModule } from "@angular/material/icon";
import { StatusCardComponent } from "./status-card/status-card.component";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";


@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, MatCardModule, StatusDetailComponent, MatIconModule, StatusCardComponent, MatProgressSpinnerModule],
  template: `
    <div class="feed w-100 rounded"   #scrollContainer (scroll)="onScroll()"  style=" overflow-y: auto;">
      @if(feedMode){
        <div  style="padding: 10px; ">
              @if(isLoading && feed.length == 0){
                  <div class="loading-spinner">
                    <mat-spinner diameter="40"></mat-spinner>
                  </div>
            }@else{

               @for(post of feed; track post.statusId){
                  <app-status-card [statusData]="post"></app-status-card>
                }

               
            }
        </div>
          @if(isLoading && feed.length > 0){
                <div class="loading-spinner">
                <mat-spinner diameter="40"></mat-spinner>
                  </div>
          }

      }@else {
          @if(statusNotFound){
                  <div class="unavailable-content rounded"  style="background-color: white; padding:20px; "> 
              <mat-icon class="lock-icon">lock</mat-icon>
              <h3>This content isn't available at the moment</h3>
              <p>When this happens, it's usually because the owner only shared it with a small group of people, changed who can see it, or it's been deleted.</p>
            </div>
          }@else{
            <app-status-detail [statusData]="statusData"></app-status-detail>
          } 
      }
   
    </div>
  `,
  styles: [`
    .feed {
      display: flex;
      flex-direction: column;
      gap: 16px;
      height: 100%;

    }

    .unavailable-content {
      display: flex;
      flex-direction: column;
      justify-content: center; 
      align-items: center;     
      text-align: center;
      background-color: white;
      padding: 20px;
      margin: auto; 
      max-width: 600px; 
      border-radius: 8px;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }
  `]
})
export class FeedComponent {

  feedMode: boolean = false;
  private destroy$ = new Subject<void>();
  statusId!: string;
  statusNotFound: boolean = false;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  feed: StatusResponse[] = [];
  page: number = 0;
  isLoading: boolean = false;
  hasMoreFeed: boolean = true;

  constructor(
    private activatedRoute: ActivatedRoute,
    private statusServices: StatusServices
  ) { }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  ngOnInit(): void {
    console.log('tedd')
    this.activatedRoute.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.initFeed();
      });
  }

  statusData!: StatusWithRepliesResponse;
  private initFeed(): void {
    const statusId = this.activatedRoute.snapshot.paramMap.get('statusId');
    console.log(statusId)
    if (statusId) {

      this.statusServices.getStatusById(statusId).subscribe(
        {
          next: (res) => {
            this.statusId = statusId;
            this.statusData = res;
            console.log(res)
            console.log('fetch status')
          }
          , error: () => {
            this.statusNotFound = true;
          },
        }
      )
    } else {
      this.feedMode = true;
      this.loadFeed();
    }

  }


  loadFeed(): void {
    if (this.isLoading) return;
    console.log('Loading feed page', this.page);

    this.isLoading = true;


    this.statusServices.fetchUserFeed(this.page).subscribe({
      next: (res) => {
        console.log('Feed data received', res);

        this.feed.push(...res.statuses);

        if (res.statuses.length > 0) {
          this.page++;
        }
        this.hasMoreFeed = res.statuses.length > 0;
      },
      error: (err) => {
        console.error('Failed to load feed', err);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.scrollContainer) {
      return;
    }
    this.scrollContainer.nativeElement.addEventListener('scroll', () => {
      this.onScroll();
    });
  }

  onScroll(): void {
    const container = this.scrollContainer.nativeElement;
    const threshold = 150;
    const position = container.scrollTop + container.clientHeight;
    const height = container.scrollHeight;
    if (position >= height - threshold && !this.isLoading && this.hasMoreFeed) {
      this.loadFeed();
    }
  }

}

