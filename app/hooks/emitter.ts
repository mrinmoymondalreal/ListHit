import mitt from 'mitt'

import { io, Socket } from "socket.io-client";
import { SERVER_LINK } from '~/constants/Server';
import { Sharing } from '~/constants/Share';
import { getDatabase, ListItemsScheme, ListsScheme, setListCollaborating } from "~/hooks/database";


export const emitter = mitt();

let socket: Socket;

export function initSocket(userId: string){
  socket = io(SERVER_LINK, {
    extraHeaders: {
      cookie: `userId=${userId}`
    }
  });
  return socket;
}

export async function sendToServer(table_name: string, unique_id: string, type: string, data: { [key: string]: string | number | boolean }) {

  // TODO: 
  // 0. Check if the list is a shared list - [x]
  // 1. Send data to server - [x]

  let unique_id_parent = unique_id;
  let unique_id_child = unique_id;

  if(table_name == 'list_items'){
    unique_id_parent = data.parent_unique_id as string;
  }

  // 0. Check if the list is a shared list
  const db = await getDatabase();
  const isColab = await db.getFirstAsync("SELECT * FROM collabrating_lists WHERE unique_id = ?", [unique_id_parent]);
  if(!isColab) return;


  // 1. Send data to server
  socket.emit('message', JSON.stringify({
    message: {
      table_name,
      unique_id_parent,
      unique_id_child,
      type,
      data
    },
    to: unique_id_parent
  }));

}

export function listenToServer(socket: Socket){
  // TODO:
  // Listen to server
  // 1. Get response
  // 2. Update the list
  // 3. Update the UI
  // 4. Update the local storage

  socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit("getLeftOverMessages", "");
  });

  socket.on("message", (message, ackCb) => {
    // event: "provide_list",
    // table: "lists",
    // list_name: req.params.uniqueId,


    // console.log(message);
    if(message.message.event == 'provide_list'){
      setListCollaborating(Sharing.current || "");
      ackCb(JSON.stringify(Sharing.data));
    }else if(message.message.type) {
      const from = message.from;
      const { table_name, unique_id_parent, unique_id_child, type, data } = message.message;
      // console.log("update request", table_name, unique_id_parent, type);

      prepareUpdate(type, table_name, unique_id_parent, unique_id_child, data);
      ackCb(true);
      // if(type == 'insert'){
      //   console.log("insert");
      //   // insertData(table_name, data, unique_id_parent);
      // }else if(type == 'update'){
      //   // updateData(table_name, data, unique_id_child);
      // }
    }else return ackCb();
  });
}

export async function prepareUpdate(type: string, table_name: string, list_unique_id: string, item_unique_id: string, data: any){
  const db = await getDatabase(); 
  const { title, isDone: checked } = data;
  const isDone = (checked == 1 || checked == true);
  if(table_name == "list_items"){
    if(type == 'insert'){
      const list_id = (await db.getFirstAsync("SELECT id FROM lists WHERE unique_id = ?", [list_unique_id]) as any).id;
      await db.runAsync('INSERT INTO list_items (unique_id, list_id, title, isDone) VALUES (?, ?, ?, ?)', [item_unique_id, list_id, title, isDone]);
    }else if(type == 'update'){
      // const list_id = (await db.getFirstAsync("SELECT id FROM lists WHERE unique_id = ?", [list_unique_id]) as any).id;
      await db.runAsync('UPDATE list_items SET title = ?, isDone = ? WHERE unique_id = ?', [title, isDone, item_unique_id]);
      emitter.emit('list-item-update-v2', [item_unique_id, title, isDone]);
    }else if(type == 'delete'){
      await db.runAsync('DELETE FROM list_items WHERE unique_id = ?', [item_unique_id]);
    }
    emitter.emit('list-item-update');
  } else if(table_name == "lists"){
    const { title, description, color, tag } = data;
    if(type == 'delete'){
      const list_id = (await db.getFirstAsync("SELECT id FROM lists WHERE unique_id = ?", [list_unique_id]) as any).id;
      await db.runAsync('DELETE FROM list_items WHERE list_id = ?', [list_id]);
      await db.runAsync('DELETE FROM lists WHERE unique_id = ?', [list_unique_id]);
      emitter.emit('list-item-update');
    }else if(type == 'update'){
      await db.runAsync('UPDATE lists SET title = ?, description = ?, color = ?, tag = ? WHERE unique_id = ?', [title, description, color, tag, list_unique_id]);
    }

    emitter.emit('list-update');
  }
}

export async function prepareList(data: { [key: string]: any }) {
  try{
    const db = await getDatabase();
    const { list_details, list_items } = data;
    const { title: list_title, description: list_description, color, tag, unique_id: list_unique_id } = list_details as ListsScheme;
    const list_pro = await db.runAsync('INSERT INTO lists (unique_id, title, description, color, tag, createdAt) VALUES (?, ?, ?, ?, ?, ?)', [list_unique_id || "", list_title, list_description, color, tag, Date.now()]);
    const list_id = list_pro.lastInsertRowId;

    for(let i = 0;i < (list_items as ListItemsScheme[]).length;i++){
      const { unique_id, title, isDone } = list_items[i] as ListItemsScheme;
      await db.runAsync('INSERT INTO list_items (unique_id, list_id, title, isDone) VALUES (?, ?, ?, ?)', [unique_id || "", list_id, title, isDone]);
    }
  
    emitter.emit('list-update');
    emitter.emit('list-item-update');

    setListCollaborating(list_unique_id || "");
  
    return true;
  }catch(err){
    console.log("from emitter.ts", err);
    return false;
  }
}

export async function getFullList(unique_id: string){
  const db = await getDatabase();
  Sharing.current = unique_id;
  const list_details = await db.getFirstAsync("SELECT * FROM lists WHERE unique_id = ?", [Sharing.current]) as ListsScheme;
  const list_id = list_details.id;
  const list_items = await db.getAllAsync("SELECT * FROM list_items WHERE list_id = ?", [list_id]);

  return {
    list_details,
    list_items
  }
}