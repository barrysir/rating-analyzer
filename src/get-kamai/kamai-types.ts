export type KamaiUser = {
    user: number,
    game: string,
    playtype: string,
};

export type KamaiScore = {
  timeAchieved: number;
  scoreData: {
    score: number;
    platinumScore: number;
    judgements: OngekiKamaiJudgements;
    optional: {
      damage: number;
      bellCount: number;
    };
  };
  scoreID: string;
  chartID: string;
};

export type KamaiSong = { 
  altTitles: string[];
  artist: string;
  data: {
    duration: number;
    genre: string;
  };
  id: number;
  searchTerms: string[];
  title: string;
};

export type KamaiChart = {
  chartID: string;
  songID: number;
  difficulty: string;
  isPrimary: boolean;
  level: string;
  levelNum: number;
  playtype: string;
  versions: string[];
};

export type OngekiKamaiJudgements = {
  cbreak: number;
  break: number;
  hit: number;
  miss: number;
};

