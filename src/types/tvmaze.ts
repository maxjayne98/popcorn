export interface ImageInfo {
  medium?: string;
  original?: string;
}

export interface RatingInfo {
  average?: number | null;
}

export interface ScheduleInfo {
  time: string;
  days: string[];
}

export interface ExternalsInfo {
  tvrage?: number | null;
  thetvdb?: number | null;
  imdb?: string | null;
}

export interface NetworkInfo {
  id: number;
  name: string;
  country?: {
    name: string;
    code: string;
    timezone: string;
  };
}

export interface TVMazeShow {
  id: number;
  name: string;
  genres: string[];
  type: string;
  language?: string;
  runtime?: number | null;
  premiered?: string | null;
  ended?: string | null;
  schedule: ScheduleInfo;
  rating: RatingInfo;
  image?: ImageInfo | null;
  summary?: string | null;
  url: string;
  officialSite?: string | null;
  status: string;
  network?: NetworkInfo | null;
  externals?: ExternalsInfo;
}

export interface SearchResult {
  score: number;
  show: TVMazeShow;
}

export interface TVMazeCastMember {
  person: {
    id: number;
    name: string;
    image?: ImageInfo | null;
  };
  character: {
    id: number;
    name: string;
    image?: ImageInfo | null;
  } | null;
  self?: boolean;
  voice?: boolean;
}
