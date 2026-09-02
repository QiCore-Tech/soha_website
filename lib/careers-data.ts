export type CareerText = {
  zh: string;
  en: string;
};

export type CareerRole = {
  id: string;
  title: CareerText;
  team: CareerText;
  location: CareerText;
  type: CareerText;
  summary: CareerText;
  responsibilities: CareerText[];
  requirements: CareerText[];
  niceToHave: CareerText[];
  benefits: CareerText[];
  tags: CareerText[];
  postedAt: string;
  status: "open" | "soon";
};

export const CAREER_FILTERS: CareerText[] = [
  { zh: "全部岗位", en: "All roles" }
];
