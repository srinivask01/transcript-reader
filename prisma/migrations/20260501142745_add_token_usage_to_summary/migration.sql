-- AlterTable
ALTER TABLE "Summary" ADD COLUMN     "cacheReadTokens" INTEGER,
ADD COLUMN     "cacheWriteTokens" INTEGER,
ADD COLUMN     "inputTokens" INTEGER,
ADD COLUMN     "llmCallCount" INTEGER,
ADD COLUMN     "outputTokens" INTEGER,
ALTER COLUMN "analysisResult" DROP DEFAULT;
