-- Add difficulty, prep_time, and cook_time columns to recipes table

-- Add difficulty column (easy, medium, hard)
ALTER TABLE recipes 
ADD COLUMN difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Add prep_time column (in minutes)
ALTER TABLE recipes 
ADD COLUMN prep_time INTEGER CHECK (prep_time >= 0);

-- Add cook_time column (in minutes)
ALTER TABLE recipes 
ADD COLUMN cook_time INTEGER CHECK (cook_time >= 0);

-- Create an index on difficulty for filtering
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);

-- Update existing recipes with default values (optional)
UPDATE recipes 
SET difficulty = 'medium',
    prep_time = 15,
    cook_time = 30
WHERE difficulty IS NULL;