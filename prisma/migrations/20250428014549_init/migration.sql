-- CreateTable
CREATE TABLE "students" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" BIGSERIAL NOT NULL,
    "students_id" BIGINT,
    "component_type" TEXT,
    "status" TEXT,
    "submit_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_component_type" (
    "name" TEXT NOT NULL,

    CONSTRAINT "submission_component_type_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "submissions_analysis" (
    "id" BIGSERIAL NOT NULL,
    "submissions_id" BIGINT,
    "score" INTEGER,
    "feedback" TEXT,
    "highlight_submit_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_highlights" (
    "id" BIGSERIAL NOT NULL,
    "submissions_analysis_id" BIGINT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_highlights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_media" (
    "id" BIGSERIAL NOT NULL,
    "submissions_id" BIGINT NOT NULL,
    "type" TEXT,
    "url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "submission_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_analysis" (
    "id" BIGSERIAL NOT NULL,
    "submissions_media_id" BIGINT NOT NULL,
    "result" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "media_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_logs" (
    "id" BIGSERIAL NOT NULL,
    "is_success" BOOLEAN,
    "http_status" INTEGER,
    "latency" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_logs" (
    "id" BIGSERIAL NOT NULL,
    "trace_id" UUID NOT NULL,
    "students_id" BIGINT,
    "submissions_id" BIGINT NOT NULL,
    "isSuccess" BOOLEAN,
    "latency" INTEGER,
    "action" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revisions" (
    "id" BIGSERIAL NOT NULL,
    "submissions_id" BIGINT NOT NULL,
    "isSuccess" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stats_daily" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT,
    "date" DATE NOT NULL,
    "success_cnt" INTEGER,
    "failure_cnt" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stats_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stats_weekly" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "success_cnt" INTEGER,
    "failure_cnt" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stats_weekly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stats_monthly" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT,
    "date" DATE NOT NULL,
    "success_cnt" INTEGER,
    "failure_cnt" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stats_monthly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "submissions_analysis_submissions_id_key" ON "submissions_analysis"("submissions_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_analysis_submissions_media_id_key" ON "media_analysis"("submissions_media_id");

-- CreateIndex
CREATE UNIQUE INDEX "submission_logs_trace_id_key" ON "submission_logs"("trace_id");

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_students_id_fkey" FOREIGN KEY ("students_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_component_type_fkey" FOREIGN KEY ("component_type") REFERENCES "submission_component_type"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions_analysis" ADD CONSTRAINT "submissions_analysis_submissions_id_fkey" FOREIGN KEY ("submissions_id") REFERENCES "submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_highlights" ADD CONSTRAINT "analysis_highlights_submissions_analysis_id_fkey" FOREIGN KEY ("submissions_analysis_id") REFERENCES "submissions_analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_media" ADD CONSTRAINT "submission_media_submissions_id_fkey" FOREIGN KEY ("submissions_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_analysis" ADD CONSTRAINT "media_analysis_submissions_media_id_fkey" FOREIGN KEY ("submissions_media_id") REFERENCES "submission_media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_logs" ADD CONSTRAINT "submission_logs_submissions_id_fkey" FOREIGN KEY ("submissions_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_submissions_id_fkey" FOREIGN KEY ("submissions_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
