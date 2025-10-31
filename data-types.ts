export const OngekiDifficulty = {
    BASIC: "BASIC",
    ADVANCED: "ADVANCED",
    EXPERT: "EXPERT",
    MASTER: "MASTER",
    LUNATIC: "LUNATIC",
} as const;
export type OngekiDifficulty = (typeof OngekiDifficulty)[keyof typeof OngekiDifficulty];

export const BellLamp = {
    NONE: "none",
    FB: "fb",
} as const;
export type BellLamp = (typeof BellLamp)[keyof typeof BellLamp];

export const ClearLamp = {
    NONE: "none",
    FC: "fc",
    AB: "ab",
    ACB: "ab+",
} as const;
export type ClearLamp = (typeof ClearLamp)[keyof typeof ClearLamp];

export const GradeLamp = {
    NONE: "none",
    S: "S",
    SS: "SS",
    SSS: "SSS",
    SSS_PLUS: "SSS+",
} as const;
export type GradeLamp = (typeof GradeLamp)[keyof typeof GradeLamp];
