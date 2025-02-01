create database if not exists listhit;

create table users(
  userId TEXT primary key,
  created_at timestamp default current_timestamp
);

create table lists(
  listId TEXT primary key,
  userId TEXT[],
  created_at timestamp default current_timestamp
);

create table updates (
  updateId SERIAL primary key,
  listId TEXT,
  to_userId TEXT,
  created_at timestamp default current_timestamp,
  updateType TEXT,
  updateData TEXT
);