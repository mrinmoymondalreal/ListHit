import * as SQLite from 'expo-sqlite';

let database: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if(!database){
    database = await SQLite.openDatabaseAsync('databaseName');
  }
  return database;
}

export function setListCollaborating(unique_id: string){
  getDatabase().then(async db => {
    const resp = await db.getFirstAsync("SELECT * FROM collabrating_lists WHERE unique_id = ?", [unique_id]) as any;
    if(!resp || !resp.unique_id) await db.runAsync('INSERT INTO collabrating_lists(unique_id) VALUES (?)', [unique_id]);
  });

  return true;
}

export interface ListItemsScheme {
  id: number;
  list_id: number;
  title: string;
  isDone: boolean;
  unique_id?: string;
}

export interface ListsScheme {
  id: number;
  title: string;
  description: string;
  color: string;
  tag: string;
  createdAt: number;
  unique_id?: string;
}