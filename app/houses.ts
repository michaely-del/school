export interface House {
  id: number;
  name: string;
  points: number;
  color: string;
}

export const initialHouses: House[] = [
  { id: 1, name: "Oso", points: 0, color: "#111111" },
  { id: 2, name: "Bhalu", points: 0, color: "#4cc9f0" },
  { id: 3, name: "Xiong", points: 0, color: "#2a9d8f" },
  { id: 4, name: "Bjorn", points: 0, color: "#e63946" },
  { id: 5, name: "Kuma", points: 0, color: "#9b5de5" },
  { id: 6, name: "Gom", points: 0, color: "#f15bb5" },
  { id: 7, name: "Dubb", points: 0, color: "#ff9f1c" },
  { id: 8, name: "Urso", points: 0, color: "#e76f51" }
];
