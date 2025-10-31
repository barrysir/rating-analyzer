export const OngekiDifficulty = {
    BASIC: "BASIC",
    ADVANCED: "ADVANCED",
    EXPERT: "EXPERT",
    MASTER: "MASTER",
    LUNATIC: "LUNATIC",
} as const;
export type OngekiDifficulty = (typeof OngekiDifficulty)[keyof typeof OngekiDifficulty];
