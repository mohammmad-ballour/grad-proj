import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserListDialogComponentComponent } from './user-list-dialog-component.component';

describe('UserListDialogComponentComponent', () => {
  let component: UserListDialogComponentComponent;
  let fixture: ComponentFixture<UserListDialogComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListDialogComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserListDialogComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
