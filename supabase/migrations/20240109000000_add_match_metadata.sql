-- Migration to add season and competition columns to matches table

alter table matches
add column if not exists season text,
add column if not exists competition text;
