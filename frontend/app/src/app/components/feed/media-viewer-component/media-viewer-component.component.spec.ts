import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaViewerComponentComponent } from './media-viewer-component.component';

describe('MediaViewerComponentComponent', () => {
  let component: MediaViewerComponentComponent;
  let fixture: ComponentFixture<MediaViewerComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaViewerComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediaViewerComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
