import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareDialogComponentComponent } from './share-dialog.component.component';

describe('ShareDialogComponentComponent', () => {
  let component: ShareDialogComponentComponent;
  let fixture: ComponentFixture<ShareDialogComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareDialogComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShareDialogComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
