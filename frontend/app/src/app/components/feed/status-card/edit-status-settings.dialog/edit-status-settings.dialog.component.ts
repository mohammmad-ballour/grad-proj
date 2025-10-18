import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { StatusPrivacy, StatusAudience, StatusResponse } from '../../models/StatusWithRepliesResponseDto';
import { StatusServices } from '../../services/status.services';



@Component({
  standalone: true,
  selector: 'app-edit-status-settings-dialog',
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  template: `
  <div class="p-4" style="width:560px;max-width:92vw;">
    <h3 class="m-0">Update post settings</h3>

    <div class="chips" style="display:flex;gap:8px;flex-wrap:wrap;margin:16px 0;">
      <!-- Privacy -->
      <button mat-button class="chip" [matMenuTriggerFor]="menuPrivacy">
        <mat-icon>{{ privacyIcon(privacy) }}</mat-icon>
        {{ privacyLabel(privacy) }} <mat-icon>expand_more</mat-icon>
      </button>
      <mat-menu #menuPrivacy="matMenu">
        <button mat-menu-item (click)="setPrivacy(StatusPrivacy.PUBLIC)"><mat-icon>public</mat-icon>Public</button>
        <button mat-menu-item (click)="setPrivacy(StatusPrivacy.FOLLOWERS)"><mat-icon>people</mat-icon>Followers only</button>
        <button mat-menu-item (click)="setPrivacy(StatusPrivacy.PRIVATE)"><mat-icon>lock</mat-icon>Only me</button>
      </mat-menu>

      <!-- Reply -->
      <button mat-button class="chip" [matMenuTriggerFor]="menuReply">
        <mat-icon>{{ audienceIcon(replyAudience) }}</mat-icon>
        {{ audienceLabel(replyAudience) }} <mat-icon>expand_more</mat-icon>
      </button>
      <mat-menu #menuReply="matMenu">
        <button mat-menu-item (click)="setReply(StatusAudience.EVERYONE)"  [disabled]="!isAllowed(StatusAudience.EVERYONE)"><mat-icon>public</mat-icon>Everyone</button>
        <button mat-menu-item (click)="setReply(StatusAudience.FOLLOWERS)" [disabled]="!isAllowed(StatusAudience.FOLLOWERS)"><mat-icon>people</mat-icon>People follow you</button>
        <button mat-menu-item (click)="setReply(StatusAudience.ONLY_ME)"   [disabled]="!isAllowed(StatusAudience.ONLY_ME)"><mat-icon>lock</mat-icon>Only me</button>
      </mat-menu>

      <!-- Share -->
      <button mat-button class="chip" [matMenuTriggerFor]="menuShare">
        <mat-icon>{{ audienceIcon(shareAudience) }}</mat-icon>
        {{ audienceLabel(shareAudience) }} <mat-icon>expand_more</mat-icon>
      </button>
      <mat-menu #menuShare="matMenu">
        <button mat-menu-item (click)="setShare(StatusAudience.EVERYONE)"  [disabled]="!isAllowed(StatusAudience.EVERYONE)"><mat-icon>public</mat-icon>Everyone</button>
        <button mat-menu-item (click)="setShare(StatusAudience.FOLLOWERS)" [disabled]="!isAllowed(StatusAudience.FOLLOWERS)"><mat-icon>people</mat-icon>People follow you</button>
        <button mat-menu-item (click)="setShare(StatusAudience.ONLY_ME)"   [disabled]="!isAllowed(StatusAudience.ONLY_ME)"><mat-icon>lock</mat-icon>Only me</button>
      </mat-menu>
    </div>

    <div style="display:flex;justify-content:flex-end;gap:8px;">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving">
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </div>
  </div>
  `,
  styles: [`.chip{border-radius:999px;border:1px solid #2f3336;}`]
})
export class EditStatusSettingsDialogComponent {
  // expose enums to template
  StatusPrivacy = StatusPrivacy;
  StatusAudience = StatusAudience;

  saving = false;
  privacy: StatusPrivacy;
  replyAudience: StatusAudience;
  shareAudience: StatusAudience;

  constructor(
    private ref: MatDialogRef<EditStatusSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { status: StatusResponse },
    private api: StatusServices
  ) {
    this.privacy = data.status.privacy;
    this.replyAudience = data.status.replyAudience;
    this.shareAudience = data.status.shareAudience;
  }

  // same rules as compose
  isAllowed(a: StatusAudience) {
    if (this.privacy === StatusPrivacy.PUBLIC) return true;
    if (this.privacy === StatusPrivacy.FOLLOWERS) return a !== StatusAudience.EVERYONE;
    return a === StatusAudience.ONLY_ME;
  }
  private coerce() {
    if (!this.isAllowed(this.replyAudience)) {
      this.replyAudience = (this.privacy === StatusPrivacy.FOLLOWERS)
        ? StatusAudience.FOLLOWERS
        : StatusAudience.ONLY_ME;
    }
    if (!this.isAllowed(this.shareAudience)) {
      this.shareAudience = (this.privacy === StatusPrivacy.FOLLOWERS)
        ? StatusAudience.FOLLOWERS
        : StatusAudience.ONLY_ME;
    }
  }

  setPrivacy(p: StatusPrivacy) { this.privacy = p; this.coerce(); }
  setReply(a: StatusAudience) { if (this.isAllowed(a)) this.replyAudience = a; }
  setShare(a: StatusAudience) { if (this.isAllowed(a)) this.shareAudience = a; }

  privacyLabel(p: StatusPrivacy) { return p === StatusPrivacy.PUBLIC ? 'Public' : p === StatusPrivacy.FOLLOWERS ? 'Followers only' : 'Only me'; }
  privacyIcon(p: StatusPrivacy) { return p === StatusPrivacy.PUBLIC ? 'public' : p === StatusPrivacy.FOLLOWERS ? 'people' : 'lock'; }
  audienceLabel(a: StatusAudience) { return a === StatusAudience.EVERYONE ? 'Everyone' : a === StatusAudience.FOLLOWERS ? 'People follow you' : 'Only me'; }
  audienceIcon(a: StatusAudience) { return a === StatusAudience.EVERYONE ? 'public' : a === StatusAudience.FOLLOWERS ? 'people' : 'lock'; }

  async save() {
    this.saving = true;
    try {
      await this.api.updateStatusSettings(this.data.status.statusId, {
        statusPrivacy: this.privacy,          // ✅ enum, matches backend field name
        replyAudience: this.replyAudience,
        shareAudience: this.shareAudience
      }).toPromise();

      // Return only changed fields; card will merge
      this.ref.close({
        privacy: this.privacy,
        replyAudience: this.replyAudience,
        shareAudience: this.shareAudience
      } as Partial<StatusResponse>);
    } finally {
      this.saving = false;
    }
  }

  close() { this.ref.close(); }
}
