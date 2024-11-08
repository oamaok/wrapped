CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT NOT NULL
);

CREATE TABLE emojis (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  animated BOOLEAN NOT NULL
);

CREATE TABLE channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  channel_id TEXT NOT NULL REFERENCES channels(id),
  sent_at TIMESTAMP NOT NULL,
  content TEXT
);

CREATE TABLE reactions (
  user_id TEXT NOT NULL REFERENCES users(id),
  message_id TEXT NOT NULL REFERENCES messages(id),
  emoji_id TEXT NOT NULL REFERENCES emojis(id),
  UNIQUE (user_id, message_id, emoji_id)
);

CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES messages(id),
  type TEXT NOT NULL,
  url TEXT NOT NULL
);

CREATE TABLE replies (
  message_id TEXT NOT NULL,
  reply_to TEXT NOT NULL,
  UNIQUE(message_id, reply_to)
);
