-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PricingMode" AS ENUM ('TIERED', 'ON_REQUEST');

-- CreateEnum
CREATE TYPE "UnitKind" AS ENUM ('PC', 'SET', 'SQFT', 'PAIR', 'BOX', 'SHEET');

-- CreateEnum
CREATE TYPE "OptionDisplay" AS ENUM ('CHIP', 'SWATCH', 'DROPDOWN', 'IMAGE');

-- CreateEnum
CREATE TYPE "InquirySource" AS ENUM ('PRODUCT', 'CART', 'CONTACT');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST', 'SPAM');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'EDITOR');

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon_key" TEXT,
    "image_path" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "seo_title" TEXT,
    "seo_description" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "product_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("product_id","category_id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "short_description" TEXT,
    "description" TEXT,
    "specs" JSONB NOT NULL DEFAULT '[]',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unit" "UnitKind" NOT NULL DEFAULT 'PC',
    "unit_label" TEXT,
    "qty_step" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "moq" DECIMAL(12,2),
    "pricing_mode" "PricingMode" NOT NULL DEFAULT 'TIERED',
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "lead_time_days_min" INTEGER,
    "lead_time_days_max" INTEGER,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "badge_text" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "primary_image_id" UUID,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "min_unit_price" DECIMAL(12,2),
    "max_unit_price" DECIMAL(12,2),
    "effective_moq" DECIMAL(12,2),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_options" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "help_text" TEXT,
    "display_as" "OptionDisplay" NOT NULL DEFAULT 'CHIP',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_option_values" (
    "id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "valueCode" TEXT NOT NULL,
    "swatch_hex" TEXT,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_option_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skus" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sku_code" TEXT,
    "label" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "price_on_request" BOOLEAN NOT NULL DEFAULT false,
    "moq" DECIMAL(12,2),
    "option_signature" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "skus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sku_option_values" (
    "sku_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "option_value_id" UUID NOT NULL,

    CONSTRAINT "sku_option_values_pkey" PRIMARY KEY ("sku_id","option_id")
);

-- CreateTable
CREATE TABLE "price_tiers" (
    "id" UUID NOT NULL,
    "sku_id" UUID NOT NULL,
    "min_qty" DECIMAL(12,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "compare_at_price" DECIMAL(12,2),
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "price_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "option_value_id" UUID,
    "storage_path" TEXT,
    "external_url" TEXT,
    "alt" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "blur_data_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" UUID NOT NULL,
    "ref" TEXT NOT NULL,
    "source" "InquirySource" NOT NULL,
    "name" TEXT,
    "company" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "message" TEXT,
    "total_estimate" DECIMAL(12,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "assigned_to" UUID,
    "internal_note" TEXT,
    "user_agent" TEXT,
    "referer" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_items" (
    "id" UUID NOT NULL,
    "inquiry_id" UUID NOT NULL,
    "product_id" UUID,
    "sku_id" UUID,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_price" DECIMAL(12,2),
    "line_total" DECIMAL(12,2),
    "note" TEXT,
    "product_name_snapshot" TEXT NOT NULL,
    "product_slug_snapshot" TEXT NOT NULL,
    "options_snapshot" JSONB NOT NULL DEFAULT '[]',
    "unit_snapshot" "UnitKind" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "logo_path" TEXT,
    "website" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_items" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "client" TEXT,
    "event_type" TEXT,
    "summary" TEXT,
    "description" TEXT,
    "event_date" DATE,
    "cover_path" TEXT,
    "gallery" JSONB NOT NULL DEFAULT '[]',
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_products" (
    "portfolio_item_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "portfolio_products_pkey" PRIMARY KEY ("portfolio_item_id","product_id")
);

-- CreateTable
CREATE TABLE "homepage_banners" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "cta_label" TEXT,
    "cta_href" TEXT,
    "image_path" TEXT NOT NULL,
    "mobile_image_path" TEXT,
    "alt" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "homepage_banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" UUID NOT NULL,
    "quote" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_role" TEXT,
    "company" TEXT,
    "avatar_path" TEXT,
    "rating" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "whatsapp_number" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "address_line" TEXT NOT NULL,
    "address_city" TEXT NOT NULL,
    "map_url" TEXT,
    "facebook_url" TEXT,
    "instagram_url" TEXT,
    "linkedin_url" TEXT,
    "default_seo_title" TEXT,
    "default_seo_description" TEXT,
    "announcement_text" TEXT,
    "announcement_active" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_sort_order_idx" ON "categories"("parent_id", "sort_order");

-- CreateIndex
CREATE INDEX "categories_status_idx" ON "categories"("status");

-- CreateIndex
CREATE INDEX "product_categories_category_id_sort_order_idx" ON "product_categories"("category_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_primary_image_id_key" ON "products"("primary_image_id");

-- CreateIndex
CREATE INDEX "products_status_sort_order_idx" ON "products"("status", "sort_order");

-- CreateIndex
CREATE INDEX "products_is_featured_sort_order_idx" ON "products"("is_featured", "sort_order");

-- CreateIndex
CREATE INDEX "products_min_unit_price_idx" ON "products"("min_unit_price");

-- CreateIndex
CREATE UNIQUE INDEX "product_options_product_id_position_key" ON "product_options"("product_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "product_options_product_id_name_key" ON "product_options"("product_id", "name");

-- CreateIndex
CREATE INDEX "product_option_values_option_id_sort_order_idx" ON "product_option_values"("option_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "product_option_values_option_id_valueCode_key" ON "product_option_values"("option_id", "valueCode");

-- CreateIndex
CREATE UNIQUE INDEX "skus_sku_code_key" ON "skus"("sku_code");

-- CreateIndex
CREATE INDEX "skus_product_id_sort_order_idx" ON "skus"("product_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "skus_product_id_option_signature_key" ON "skus"("product_id", "option_signature");

-- CreateIndex
CREATE INDEX "sku_option_values_option_value_id_idx" ON "sku_option_values"("option_value_id");

-- CreateIndex
CREATE UNIQUE INDEX "sku_option_values_sku_id_option_value_id_key" ON "sku_option_values"("sku_id", "option_value_id");

-- CreateIndex
CREATE INDEX "price_tiers_sku_id_min_qty_idx" ON "price_tiers"("sku_id", "min_qty");

-- CreateIndex
CREATE UNIQUE INDEX "price_tiers_sku_id_min_qty_key" ON "price_tiers"("sku_id", "min_qty");

-- CreateIndex
CREATE INDEX "product_images_product_id_option_value_id_sort_order_idx" ON "product_images"("product_id", "option_value_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "inquiries_ref_key" ON "inquiries"("ref");

-- CreateIndex
CREATE INDEX "inquiries_status_created_at_idx" ON "inquiries"("status", "created_at");

-- CreateIndex
CREATE INDEX "inquiries_created_at_idx" ON "inquiries"("created_at");

-- CreateIndex
CREATE INDEX "inquiry_items_inquiry_id_idx" ON "inquiry_items"("inquiry_id");

-- CreateIndex
CREATE INDEX "inquiry_items_product_id_idx" ON "inquiry_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "partners_is_active_sort_order_idx" ON "partners"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_items_slug_key" ON "portfolio_items"("slug");

-- CreateIndex
CREATE INDEX "portfolio_items_status_sort_order_idx" ON "portfolio_items"("status", "sort_order");

-- CreateIndex
CREATE INDEX "homepage_banners_is_active_sort_order_idx" ON "homepage_banners"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "testimonials_is_active_sort_order_idx" ON "testimonials"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "faqs_is_active_category_sort_order_idx" ON "faqs"("is_active", "category", "sort_order");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_primary_image_id_fkey" FOREIGN KEY ("primary_image_id") REFERENCES "product_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "product_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skus" ADD CONSTRAINT "skus_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sku_option_values" ADD CONSTRAINT "sku_option_values_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "skus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sku_option_values" ADD CONSTRAINT "sku_option_values_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "product_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sku_option_values" ADD CONSTRAINT "sku_option_values_option_value_id_fkey" FOREIGN KEY ("option_value_id") REFERENCES "product_option_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "skus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_option_value_id_fkey" FOREIGN KEY ("option_value_id") REFERENCES "product_option_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_items" ADD CONSTRAINT "inquiry_items_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_items" ADD CONSTRAINT "inquiry_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_items" ADD CONSTRAINT "inquiry_items_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "skus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_products" ADD CONSTRAINT "portfolio_products_portfolio_item_id_fkey" FOREIGN KEY ("portfolio_item_id") REFERENCES "portfolio_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_products" ADD CONSTRAINT "portfolio_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
