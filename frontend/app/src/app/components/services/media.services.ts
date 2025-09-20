import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MediaServices {

    getMediaById(mediaId: string): string {
        return 'http://localhost:8080/media/' + mediaId

    }
}

