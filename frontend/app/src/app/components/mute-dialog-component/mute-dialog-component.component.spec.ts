import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MuteDialogComponentComponent } from './mute-dialog-component.component';

describe('MuteDialogComponentComponent', () => {
  let component: MuteDialogComponentComponent;
  let fixture: ComponentFixture<MuteDialogComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MuteDialogComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MuteDialogComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
