-- Connect themes were redefined to the brand palettes (royal, forest, crimson, slate, violet).
-- Unknown ids already fall back to the default in the app; this keeps the stored data tidy too.
ALTER TABLE "connect_profiles" ALTER COLUMN "theme" SET DEFAULT 'crimson';
UPDATE "connect_profiles" SET "theme" = 'crimson' WHERE "theme" NOT IN ('crimson','royal','forest','slate','violet');
