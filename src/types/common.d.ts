interface DayRecord {
    slot1?: string[];
    slot2?: string[];
    custom?: string[];
}

interface Records {
    [dateKey: string]: DayRecord;
}

interface Config {
    project_name: string;
}

interface Storage {
    config?: Config;
    records?: Records;
}

interface TTData {
    project: string;
    date: string;
    slot1: string[];
    slot2: string[];
}

export type { DayRecord, Records, Config, Storage, TTData };
