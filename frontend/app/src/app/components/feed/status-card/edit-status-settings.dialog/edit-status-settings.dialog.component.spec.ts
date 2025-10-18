import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditStatusSettingsDialogComponent } from './edit-status-settings.dialog.component';

describe('EditStatusSettingsDialogComponent', () => {
  let component: EditStatusSettingsDialogComponent;
  let fixture: ComponentFixture<EditStatusSettingsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditStatusSettingsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditStatusSettingsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
