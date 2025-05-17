/*
  # Create books and bookmarks tables

  1. New Tables
    - `books`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `author` (text)
      - `cover_url` (text)
      - `file_path` (text)
      - `format` (text)
      - `current_page` (integer)
      - `total_pages` (integer)
      - `last_read_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `bookmarks`
      - `id` (uuid, primary key)
      - `book_id` (uuid, references books)
      - `user_id` (uuid, references auth.users)
      - `page` (integer)
      - `note` (text)
      - `created_at` (timestamptz)

    - `reading_stats`
      - `id` (uuid, primary key)
      - `book_id` (uuid, references books)
      - `user_id` (uuid, references auth.users)
      - `pages_read` (integer)
      - `time_spent` (interval)
      - `date` (date)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  author text NOT NULL,
  cover_url text,
  file_path text NOT NULL,
  format text NOT NULL,
  current_page integer DEFAULT 1,
  total_pages integer,
  last_read_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  page integer NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

-- Create reading_stats table
CREATE TABLE IF NOT EXISTS reading_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  pages_read integer DEFAULT 0,
  time_spent interval DEFAULT '0 seconds',
  date date DEFAULT CURRENT_DATE,
  UNIQUE(book_id, user_id, date)
);

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for books
CREATE POLICY "Users can view their own books"
  ON books
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own books"
  ON books
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books"
  ON books
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON bookmarks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for reading_stats
CREATE POLICY "Users can view their own reading stats"
  ON reading_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading stats"
  ON reading_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading stats"
  ON reading_stats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading stats"
  ON reading_stats
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update books.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for books.updated_at
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE
  ON books
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();