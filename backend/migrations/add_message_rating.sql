
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS rating SMALLINT;

-- Only allow positive or negative ratings
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS chk_messages_rating;

ALTER TABLE messages
ADD CONSTRAINT chk_messages_rating
CHECK (
    rating IS NULL
    OR (
        sender = 'bot'
        AND rating IN (1, -1)
    )
);
