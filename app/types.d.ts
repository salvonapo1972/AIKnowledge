/* types.d.ts */
import { Document } from '@contentful/rich-text-types';

export type SongItem = {
    fields: {
        title: string;
        slug: string;
        date: Date;
        testoCanzone: Document;
        urlVideo: string;
    }
}

export type SongItems = ReadonlyArray<SongItem>;

export type SongQueryResult = {
    items: SongItems;
}
