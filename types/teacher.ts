
import { Profile } from './database';

export interface Teacher extends Profile {
    branches?: {
        name: string;
    } | null;
}
