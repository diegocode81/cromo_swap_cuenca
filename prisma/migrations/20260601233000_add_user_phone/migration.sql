-- Add nullable phone field without breaking existing users.
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
