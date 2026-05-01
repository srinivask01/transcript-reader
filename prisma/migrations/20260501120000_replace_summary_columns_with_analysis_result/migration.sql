-- Drop old summary columns and add analysisResult
ALTER TABLE "Summary" ADD COLUMN "analysisResult" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "Summary" DROP COLUMN "keyTopics";
ALTER TABLE "Summary" DROP COLUMN "actionItems";
ALTER TABLE "Summary" DROP COLUMN "decisions";
ALTER TABLE "Summary" DROP COLUMN "nextSteps";
