-- CreateTable
CREATE TABLE "SystemPromptVersion" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemPromptVersion_pkey" PRIMARY KEY ("id")
);
