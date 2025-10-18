import { Component, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { MediaService } from '../../../services/media.service';
import { MediaResponse, StatusResponse, StatusWithRepliesResponse } from '../../models/StatusWithRepliesResponseDto';
import { StatusServices } from '../../services/status.services';



type PreviewItem = { file: File; url: string };

@Component({
  standalone: true,
  selector: 'app-edit-status-content-dialog',
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule
  ],
  template: `
  <div class="dlg">
    <div class="dlg-header">
      <h3>Edit status </h3>
      <button mat-icon-button (click)="close()" aria-label="Close"><mat-icon>close</mat-icon></button>
    </div>

    <div class="dlg-body">
      <textarea [(ngModel)]="content" class="editor" rows="5" maxlength="280" placeholder="Edit your status..."></textarea>
      <div class="counter" [class.warn]="(content.length||0) > 260">{{ 280 - (content.length || 0) }}</div>

      <div class="section-label" *ngIf="existing.length">Attached Media</div>
      <div class="grid" *ngIf="existing.length">
        <div class="media" *ngFor="let m of existing; trackBy: trackByMediaId">
          <img *ngIf="m.mimeType.startsWith('image/')" [src]="mediaService.getMediaById(m.mediaId)" alt="image">
          <video *ngIf="m.mimeType.startsWith('video/')" [src]="mediaService.getMediaById(m.mediaId)" muted controls></video>
          <button mat-mini-fab class="flag" [color]="removed.has(m.mediaId) ? 'warn' : undefined"
                  (click)="toggleRemove(m.mediaId)"
                  [matTooltip]="removed.has(m.mediaId) ? 'Will be removed' : 'Keep this media'">
            <mat-icon>{{ removed.has(m.mediaId) ? 'delete' : 'check' }}</mat-icon>
          </button>
        </div>
      </div>

      <div class="add-row">
        <input type="file" #fileInput multiple accept="image/*,video/*" (change)="onFiles($event)" hidden>
        <button mat-stroked-button (click)="fileInput.click()" [disabled]="remainingSlots === 0">
          <mat-icon>photo</mat-icon> Add media
        </button>
        <span class="hint">You can attach up to 4 total. Remaining: {{ remainingSlots }}</span>
      </div>

      <div class="grid" *ngIf="previews.length">
        <div class="media" *ngFor="let p of previews; trackBy: trackByPreview">
          <img *ngIf="p.file.type.startsWith('image/')" [src]="p.url" alt="preview">
          <video *ngIf="p.file.type.startsWith('video/')" [src]="p.url" muted controls></video>
          <button mat-mini-fab class="flag" color="warn" (click)="removeNew(p.file)" matTooltip="Remove this new file">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
    </div>

    <div class="dlg-footer">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving">
        <ng-container *ngIf="!saving; else savingTpl">Save</ng-container>
      </button>
      <ng-template #savingTpl>
        <div class="saving">
          <mat-progress-spinner diameter="18" strokeWidth="3" mode="indeterminate"></mat-progress-spinner>
          <span>Saving…</span>
        </div>
      </ng-template>
    </div>
  </div>
  `,
  styles: [`
    .dlg{width:720px;max-width:95vw;background:#121212;display:flex;color:white;flex-direction:column;border-radius:12px;overflow:hidden}
    .dlg-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.1)}
    .dlg-body{padding:20px;overflow:visible}
    .dlg-footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 20px;border-top:1px solid rgba(255,255,255,.1)}
    .editor{width:100%;border:1px solid #2f3336;border-radius:12px;background:#0b0b0b;color:#e6e6e6;padding:12px;line-height:1.4;min-height:120px;resize:none}
    .counter{text-align:right;font-size:12px;color:#8a8f98;margin-top:4px}.counter.warn{color:#f29a9a}
    .section-label{margin-top:16px;font-size:13px;font-weight:600;color:#aaa}
    .grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));margin-top:8px}
    .media{position:relative;border-radius:12px;overflow:hidden;border:1px solid #2f3336;background:#000;aspect-ratio:16/10}
    .media img,.media video{width:100%;height:100%;object-fit:cover;display:block}
    .flag{position:absolute;top:8px;right:8px;width:32px;height:32px;box-shadow:0 3px 10px rgba(0,0,0,.35);backdrop-filter:blur(2px)}
    .add-row{display:flex;align-items:center;gap:12px;margin-top:16px}
    .hint{font-size:12px;color:#9aa3ad}.saving{display:flex;align-items:center;gap:8px}
    @media(max-width:520px){.dlg{width:100vw;border-radius:0}.grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}}
    @media(prefers-color-scheme:light){.dlg{background:#fff;color:#111}.editor{background:#fff;color:#111}.section-label,.hint{color:#5b6570}}
  `]
})
export class EditStatusContentDialogComponent implements OnDestroy {
  saving = false;

  content = '';
  existing: MediaResponse[] = [];
  removed = new Set<string>();
  previews: PreviewItem[] = [];
  private previewMap = new Map<File, string>();

  constructor(
    private ref: MatDialogRef<EditStatusContentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { status: StatusResponse },
    private api: StatusServices,
    public mediaService: MediaService
  ) {
    const s = data.status;
    this.content = s.content ?? '';
    this.existing = s.medias ?? [];
  }

  get remainingSlots(): number {
    const kept = this.existing.filter(m => !this.removed.has(m.mediaId)).length;
    return Math.max(0, 4 - kept - this.previews.length);
  }

  trackByMediaId = (_: number, m: MediaResponse) => m.mediaId;
  trackByPreview = (_: number, p: PreviewItem) => p.url;

  toggleRemove(id: string) { this.removed.has(id) ? this.removed.delete(id) : this.removed.add(id); }

  onFiles(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    const toAdd = files.slice(0, this.remainingSlots);
    for (const f of toAdd) {
      if (this.previewMap.has(f)) continue;
      const url = URL.createObjectURL(f);
      this.previewMap.set(f, url);
      this.previews.push({ file: f, url });
    }
    input.value = '';
  }

  removeNew(file: File) {
    const url = this.previewMap.get(file);
    if (url) URL.revokeObjectURL(url);
    this.previewMap.delete(file);
    this.previews = this.previews.filter(p => p.file !== file);
  }

  ngOnDestroy(): void {
    for (const url of this.previewMap.values()) URL.revokeObjectURL(url);
    this.previewMap.clear();
  }

  async save() {
    this.saving = true;
    const keepIds = this.existing.filter(m => !this.removed.has(m.mediaId)).map(m => m.mediaId);
    const removeIds = Array.from(this.removed);
    const newFiles = this.previews.map(p => p.file);

    try {
      await this.api.updateStatusContent(
        this.data.status.statusId,
        { newContent: this.content, keepMediaIds: keepIds, removeMediaIds: removeIds },
        newFiles
      ).toPromise();

      const full: StatusWithRepliesResponse = await firstValueFrom(
        this.api.getStatusById(this.data.status.statusId)
      );
      this.ref.close({ updated: full.statusResponse });
    } finally {
      this.saving = false;
    }
  }

  close() { this.ref.close(); }
}
