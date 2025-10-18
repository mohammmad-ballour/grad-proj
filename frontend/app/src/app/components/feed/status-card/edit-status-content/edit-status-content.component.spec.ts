import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditStatusContentComponent } from './edit-status-content.component';

describe('EditStatusContentComponent', () => {
  let component: EditStatusContentComponent;
  let fixture: ComponentFixture<EditStatusContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditStatusContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditStatusContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
