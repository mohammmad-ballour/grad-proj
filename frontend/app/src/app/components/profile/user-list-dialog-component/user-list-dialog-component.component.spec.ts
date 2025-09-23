import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserListDialogComponent } from './user-list-dialog-component.component';

describe('UserListDialogComponentComponent', () => {
  let component: UserListDialogComponent;
  let fixture: ComponentFixture<UserListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListDialogComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UserListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
