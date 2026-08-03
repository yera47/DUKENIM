-- Seed data for Step 1 (tenants only — users created via Auth API in scripts/seed-step1.mjs)
-- Fixed UUIDs for stable testing

insert into tenants (
  id, slug, name, tagline, accent_color, city, phone, whatsapp, plan, status
) values (
  '00000000-0000-4000-8000-000000000001',
  'test',
  'Test Shop',
  'Тестовый магазин Dukenim',
  '#0E5C4A',
  'Астана',
  '+77001234567',
  '77001234567',
  'standard',
  'active'
);

insert into tenant_settings (tenant_id, delivery_enabled, pickup_enabled, min_order)
values ('00000000-0000-4000-8000-000000000001', true, true, 0);

insert into subscriptions (tenant_id, plan, status, current_period_end)
values (
  '00000000-0000-4000-8000-000000000001',
  'standard',
  'active',
  now() + interval '30 days'
);

insert into categories (id, tenant_id, name, slug, sort_order, is_active)
values (
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000001',
  'Новинки',
  'new',
  1,
  true
);

insert into delivery_zones (tenant_id, name, cost, free_from, eta_text, is_active, sort_order)
values (
  '00000000-0000-4000-8000-000000000001',
  'Астана',
  1500,
  25000,
  '1-3 часа',
  true,
  1
);
