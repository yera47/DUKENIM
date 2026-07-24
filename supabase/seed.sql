-- Тестовый арендатор для локальной разработки и Шага 2 (/s/test)
insert into tenants (
  id,
  slug,
  name,
  tagline,
  accent_color,
  city,
  address,
  phone,
  whatsapp,
  instagram,
  working_hours,
  status,
  plan
) values (
  '00000000-0000-4000-8000-000000000001',
  'test',
  'Test Shop',
  'Тестовая витрина Dukenim',
  '#1F5F4E',
  'Астана',
  'пр. Кабанбай батыра, 1',
  '+77001234567',
  '77001234567',
  'testshop',
  '{"mon":"10:00-20:00","tue":"10:00-20:00","wed":"10:00-20:00","thu":"10:00-20:00","fri":"10:00-20:00","sat":"11:00-18:00","sun":"closed"}'::jsonb,
  'active',
  'basic'
);

insert into tenant_settings (
  tenant_id,
  delivery_enabled,
  pickup_enabled,
  yandex_enabled,
  delivery_note,
  payment_online,
  payment_provider,
  loyalty_enabled,
  min_order
) values (
  '00000000-0000-4000-8000-000000000001',
  true,
  true,
  false,
  'Доставка по городу в день заказа',
  false,
  'none',
  false,
  0
);

insert into categories (id, tenant_id, name, slug, sort_order, is_active)
values (
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000001',
  'Новинки',
  'new',
  0,
  true
);

insert into delivery_zones (tenant_id, name, cost, free_from, eta_text, is_active, sort_order)
values (
  '00000000-0000-4000-8000-000000000001',
  'Астана',
  1500,
  25000,
  '1–3 часа',
  true,
  0
);
