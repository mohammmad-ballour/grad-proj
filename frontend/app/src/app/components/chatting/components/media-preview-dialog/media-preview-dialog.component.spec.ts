import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaPreviewDialogComponent } from './media-preview-dialog.component';
import { CommonModule } from '@angular/common';

describe('MediaPreviewDialogComponent', () => {
  let component: MediaPreviewDialogComponent;
  let fixture: ComponentFixture<MediaPreviewDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaPreviewDialogComponent, CommonModule]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MediaPreviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
