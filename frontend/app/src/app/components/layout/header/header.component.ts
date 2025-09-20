import { Component, EventEmitter, Output } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
  ],


  template: `
    <mat-form-field    class="search-bar"  >
       <input   
        matInput
        placeholder="Search..."
        #searchInput
        (keyup.enter)="onSearch(searchInput.value)"
        aria-label="Search content"
      >
      <button
        mat-icon-button
        matSuffix
        (click)="onSearch(searchInput.value)"
        aria-label="Submit search"
      >
        <mat-icon>search</mat-icon>
      </button>
    </mat-form-field>
  `,



  styleUrl: './header.component.css',
})
export class HeaderComponent {
  @Output() search = new EventEmitter<string>();

  onSearch(query: string) {
    const trimmedQuery = query?.trim();
    if (trimmedQuery) {
      this.search.emit(trimmedQuery);
      console.log('Search query:', trimmedQuery);
    }
  }
}