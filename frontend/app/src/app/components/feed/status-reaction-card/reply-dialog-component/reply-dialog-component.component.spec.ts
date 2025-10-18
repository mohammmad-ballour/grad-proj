import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplyDialogComponentComponent } from './reply-dialog-component.component';

describe('ReplyDialogComponentComponent', () => {
  let component: ReplyDialogComponentComponent;
  let fixture: ComponentFixture<ReplyDialogComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReplyDialogComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReplyDialogComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
