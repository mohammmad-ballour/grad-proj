import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service';

@Injectable({ providedIn: 'root' })
export class MediaService extends BaseService {

    getMediaById(mediaId: string): string {
        return `${this.baseUrl}${this.ENDPOINTS.Media}${mediaId}`

    }
}

