import { Profile } from "./database";

export type Student = Profile & {
    class: {
        id: string;
        name: string;
        grade_level: number;
    } | null;
}
