-- Remove chat storage after logical backup.
ALTER TABLE "Report" DROP CONSTRAINT IF EXISTS "Report_conversationId_fkey";
ALTER TABLE "Report" DROP COLUMN IF EXISTS "conversationId";

DROP TABLE IF EXISTS "Message";
DROP TABLE IF EXISTS "Conversation";
