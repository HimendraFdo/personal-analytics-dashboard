//This file defines the types for an Entry
//An entry is a single record of activity tht the user wants to track
export type EntryCategory = "Study" | "Finance" | "Health" | "Personal";

//The Entry type defines the structure of an entry object.
export type Entry = {
  id: string;
  title: string;
  value: number;
  category: EntryCategory;
  date: Date;
  note: string;
};