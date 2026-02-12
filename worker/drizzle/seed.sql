-- Seed Initial Data

-- Plans
INSERT INTO plans (id, name, slug, ai_mode, price_monthly, price_type, max_workspaces, max_transactions, is_active, sort_order) VALUES
('plan_basic', 'Basic (BYOK)', 'basic-byok', 'byok', 200000, 'one_time', 5, -1, 1, 1),
('plan_pro', 'Pro (AI Included)', 'pro-ai', 'global', 30000, 'recurring', 10, -1, 1, 2);

-- System Categories (default)
-- Note: categories usually belong to a workspace. For system defaults, maybe create a template workspace or handle in code?
-- The schema says workspace_id nullable for system defaults.
INSERT INTO categories (id, workspace_id, name, type, icon, color, is_system) VALUES
('cat_food', NULL, 'Makanan & Minuman', 'expense', '🍕', '#EF4444', 1),
('cat_transport', NULL, 'Transportasi', 'expense', '🚗', '#3B82F6', 1),
('cat_shopping', NULL, 'Belanja', 'expense', '🛍️', '#F59E0B', 1),
('cat_bills', NULL, 'Tagihan & Utilitas', 'expense', '💡', '#10B981', 1),
('cat_entertainment', NULL, 'Hiburan', 'expense', '🎬', '#8B5CF6', 1),
('cat_health', NULL, 'Kesehatan', 'expense', '💊', '#EC4899', 1),
('cat_education', NULL, 'Pendidikan', 'expense', '🎓', '#6366F1', 1),
('cat_income_salary', NULL, 'Gaji', 'income', '💰', '#10B981', 1),
('cat_income_bonus', NULL, 'Bonus', 'income', '🎁', '#F59E0B', 1),
('cat_transfer_out', NULL, 'Transfer Keluar', 'transfer', '↗️', '#64748B', 1),
('cat_transfer_in', NULL, 'Transfer Masuk', 'transfer', '↙️', '#64748B', 1);
