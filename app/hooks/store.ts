import { emitter, sendToServer } from './emitter';

import * as Crypto from 'expo-crypto';

import { getDatabase, ListItemsScheme, ListsScheme } from './database';
import { SERVER_LINK } from '~/constants/Server';

type asUnQ = {
  unique_id: string;
}

function getRandomId(){
  return Crypto.randomUUID();
}

async function getUniqueId(table: string, id: number): Promise<string> {
  const db = await getDatabase();
  return (await db.getFirstAsync(`SELECT unique_id FROM ${table} WHERE id = ?`, [id]) as asUnQ).unique_id;
}

export async function initRun(){
  try{
    const db = await getDatabase();
    await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS lists (unique_id TEXT UNIQUE, id INTEGER PRIMARY KEY NOT NULL, title TEXT NOT NULL, description TEXT, color TEXT NOT NULL, tag TEXT NOT NULL, createdAt INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS list_items (unique_id TEXT UNIQUE, id INTEGER PRIMARY KEY NOT NULL, list_id INTEGER NOT NULL, title TEXT NOT NULL, isDone BOOLEAN NOT NULL DEFAULT FALSE);
    CREATE TABLE IF NOT EXISTS collabrating_lists (unique_id TEXT, id INTEGER PRIMARY KEY NOT NULL);
    `);
  }catch(err){
    console.log('Error in creating tables', err);
  }
}

// Read
export async function getAllLists(): Promise<ListsScheme[]> {
  const db = await getDatabase();
  return await db.getAllAsync('SELECT * FROM lists');
}

export async function getListDetail(id: number): Promise<ListsScheme[]> {
  const db = await getDatabase();
  return await db.getAllAsync('SELECT * FROM lists WHERE id = ? LIMIT 1', [id]);
}

export async function getAllListItems(id: number): Promise<ListItemsScheme[]> {
  const db = await getDatabase();
  return await db.getAllAsync('SELECT * FROM list_items WHERE list_id = ?', [id]);
}

// Insert
export const addList = async (title: string, description: string, color: string, tag: string) => {
  const db = await getDatabase();
  const unique_id = getRandomId();
  const res = await db.runAsync('INSERT INTO lists (unique_id, title, description, color, tag, createdAt) VALUES (?, ?, ?, ?, ?, ?)', [unique_id, title, description, color, tag, Date.now()]);

  sendToServer('lists', unique_id, 'insert', { title, description , color, tag });
  emitter.emit('list-update');

  return res.lastInsertRowId;
}

export const addListItem = async (list_id: number, title: string, isDone: boolean) => {
  const db = await getDatabase();
  const uniqueId = getRandomId();
  const res = await db.runAsync('INSERT INTO list_items (unique_id, list_id, title, isDone) VALUES (?, ?, ?, ?)', [uniqueId, list_id, title, isDone]);
  
  const parent_unique_id = await getUniqueId('lists', list_id);
  sendToServer('list_items', uniqueId, 'insert', { list_id, title, isDone, parent_unique_id });
  emitter.emit('list-item-update');

  return res.lastInsertRowId;
}

// Update
export const updateListItem = async (list_id: number, id: number, title: string, isDone: boolean) => {
  const db = await getDatabase();

  const unique_id = await getUniqueId('list_items', id);
  const res = await db.runAsync('UPDATE list_items SET title = ?, isDone = ? WHERE list_id = ? AND id = ? RETURNING unique_id', [title, isDone, list_id, id]);

  const parent_unique_id = await getUniqueId('lists', list_id);

  if(res.changes > 0) sendToServer('list_items', unique_id, 'update', { parent_unique_id, list_id, id, title, isDone });
  emitter.emit('list-item-update');

}

export async function updateList(id: number, title: string, description: string, color: string, tag: string){
  const db = await getDatabase();

  const unique_id = await getUniqueId('lists', id);
  const res = await db.runAsync('UPDATE lists SET title = ?, description = ?, color = ?, tag = ? WHERE id = ?', [title, description, color, tag, id]);

  if(res.changes > 0) sendToServer('lists', unique_id, 'update', { id, title, description, color, tag });
  emitter.emit('list-update');
}

// Delete
export async function deleteList(id: number){
  const db = await getDatabase();
  
  const unique_id = await getUniqueId('lists', id);

  const res = await db.runAsync('DELETE FROM lists WHERE id = ?', [id]);
  await db.runAsync('DELETE FROM list_items WHERE list_id = ?', [id]);

  if(res.changes > 0) sendToServer('lists', unique_id, 'delete', { id });

  await fetch(`${SERVER_LINK}/shared/delete/${unique_id}`, {
    method: "POST",
  });

  emitter.emit('list-update');
}

export async function deleteListItem(list_id: number, id: number){
  const db = await getDatabase();

  const unique_id = await getUniqueId('list_items', id);
  const res = await db.runAsync('DELETE FROM list_items WHERE list_id = ? AND id = ?', [list_id, id]);
  const parent_unique_id = await getUniqueId('lists', list_id);
  if(res.changes > 0) sendToServer('list_items', unique_id, 'delete', { parent_unique_id, list_id, id });
  emitter.emit('list-item-update');

}
