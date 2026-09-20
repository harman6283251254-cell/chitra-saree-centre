-- =====================================================================
-- CHITRA SAREE CENTRE — Starting data
-- Run AFTER schema.sql. Safe to run more than once.
-- Demo products are marked "Demo" on the website. Delete them from
-- Admin > Products ("Delete all demo products") before going live.
-- =====================================================================

insert into public.categories (name, slug, description, sort_order) values
  ('Sarees',       'sarees',       'Banarasi, printed, handwork and pure sarees', 1),
  ('Suits',        'suits',        'Stitched, party wear and wedding wear suits', 2),
  ('Lehengas',     'lehengas',     'Wedding, party wear and designer lehengas', 3),
  ('Sharara',      'sharara',      'Wedding, party wear and designer shararas', 4),
  ('Gharara',      'gharara',      'Wedding, party wear and designer ghararas', 5),
  ('Kurta Pajama', 'kurta-pajama', 'Wedding, party wear, cotton and spun kurta pajamas', 6)
on conflict (slug) do nothing;

with s(cat, name, slug, ord) as (values
  ('suits','Stitched Suits','stitched-suits',1), ('suits','Party Wear Suits','party-wear-suits',2),
  ('suits','Wedding Wear Suits','wedding-wear-suits',3), ('suits','Pure Fabrics','pure-fabrics',4),
  ('suits','Handwork','handwork',5), ('suits','Threadwork','threadwork',6),
  ('suits','Gota Patti Work','gota-patti-work',7), ('suits','Kadhai Work','kadhai-work',8),

  ('sarees','Banarasi Sarees','banarasi-sarees',1), ('sarees','Kadhai / Handwork Sarees','kadhai-handwork-sarees',2),
  ('sarees','Printed Sarees','printed-sarees',3), ('sarees','Solaski Work Sarees','solaski-work-sarees',4),
  ('sarees','Gota Patti Work Sarees','gota-patti-work-sarees',5), ('sarees','Pure Sarees','pure-sarees',6),
  ('sarees','Handwork','handwork',7), ('sarees','Threadwork','threadwork',8),
  ('sarees','Gota Patti Work','gota-patti-work',9),

  ('lehengas','Wedding Lehengas','wedding-lehengas',1), ('lehengas','Party Wear Lehengas','party-wear-lehengas',2),
  ('lehengas','Designer Lehengas','designer-lehengas',3), ('lehengas','Pure Fabrics','pure-fabrics',4),
  ('lehengas','Handwork','handwork',5), ('lehengas','Threadwork','threadwork',6),
  ('lehengas','Gota Patti Work','gota-patti-work',7), ('lehengas','Kadhai Work','kadhai-work',8),

  ('sharara','Wedding & Party Wear Sharara','wedding-party-wear-sharara',1), ('sharara','Designer Sharara','designer-sharara',2),
  ('sharara','Pure Fabrics','pure-fabrics',3), ('sharara','Handwork','handwork',4),
  ('sharara','Threadwork','threadwork',5), ('sharara','Gota Patti Work','gota-patti-work',6),
  ('sharara','Kadhai Work','kadhai-work',7),

  ('gharara','Wedding & Party Wear Gharara','wedding-party-wear-gharara',1), ('gharara','Designer Gharara','designer-gharara',2),
  ('gharara','Pure Fabrics','pure-fabrics',3), ('gharara','Handwork','handwork',4),
  ('gharara','Threadwork','threadwork',5), ('gharara','Gota Patti Work','gota-patti-work',6),
  ('gharara','Kadhai Work','kadhai-work',7),

  ('kurta-pajama','Wedding Wear','wedding-wear',1), ('kurta-pajama','Party Wear','party-wear',2),
  ('kurta-pajama','Cotton','cotton',3), ('kurta-pajama','Spun','spun',4)
)
insert into public.subcategories (category_id, name, slug, sort_order)
select c.id, s.name, s.slug, s.ord from s join public.categories c on c.slug = s.cat
on conflict (category_id, slug) do nothing;

insert into public.fabrics (name, sort_order) values
  ('Pure',1),('Silk',2),('Pure Silk',3),('Fandy Silk',4),('Cotton',5),('Spun',6),
  ('Georgette',7),('Chiffon',8),('Other',99)
on conflict (name) do nothing;

insert into public.work_types (name, sort_order) values
  ('Handwork',1),('Threadwork',2),('Gota Patti',3),('Kadhai',4),('Solaski',5),
  ('Printed',6),('Banarasi Weave',7),('Plain',8),('Other',99)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- DEMO PRODUCTS (sample listings only — not real stock or prices)
-- ---------------------------------------------------------------------
with d(name, slug, sku, cat, sub, fab, wrk, price, mrp, stock, feat, newa, best, img, descr, tags) as (values
  ('Demo — Wine Banarasi Silk Saree','demo-wine-banarasi-silk-saree','DEMO-SAR-01','sarees','banarasi-sarees','Pure Silk','Banarasi Weave',
    4999, 6499, 8, true, true, false, '/demo/saree-1.svg',
    'Sample listing to show how a saree page looks. Replace with your own product, photos and price.', array['banarasi','silk','wedding']),
  ('Demo — Peacock Green Gota Patti Saree','demo-peacock-green-gota-patti-saree','DEMO-SAR-02','sarees','gota-patti-work-sarees','Georgette','Gota Patti',
    3299, 3999, 2, true, false, true, '/demo/saree-2.svg',
    'Sample listing. Shows the "Low stock" badge because only 2 are in stock.', array['gota patti','party wear']),
  ('Demo — Rust Printed Cotton Saree','demo-rust-printed-cotton-saree','DEMO-SAR-03','sarees','printed-sarees','Cotton','Printed',
    1299, 1299, 15, false, true, false, '/demo/saree-3.svg',
    'Sample listing. Selling price equals MRP, so no discount is shown.', array['printed','cotton','daily wear']),
  ('Demo — Indigo Threadwork Party Suit','demo-indigo-threadwork-party-suit','DEMO-SUI-01','suits','party-wear-suits','Fandy Silk','Threadwork',
    2499, 3199, 10, true, false, true, '/demo/suit-1.svg',
    'Sample listing to show how a suit page looks.', array['suit','threadwork','party wear']),
  ('Demo — Rose Handwork Wedding Suit','demo-rose-handwork-wedding-suit','DEMO-SUI-02','suits','wedding-wear-suits','Silk','Handwork',
    3799, 4599, 0, false, true, false, '/demo/suit-2.svg',
    'Sample listing. Shows the "Out of stock" state.', array['suit','handwork','wedding']),
  ('Demo — Crimson Bridal Lehenga','demo-crimson-bridal-lehenga','DEMO-LEH-01','lehengas','wedding-lehengas','Pure Silk','Kadhai',
    18999, 22999, 3, true, true, true, '/demo/lehenga-1.svg',
    'Sample listing to show how a lehenga page looks.', array['lehenga','bridal','kadhai','wedding']),
  ('Demo — Bottle Green Designer Sharara','demo-bottle-green-designer-sharara','DEMO-SHA-01','sharara','designer-sharara','Georgette','Gota Patti',
    5499, 6999, 5, false, true, false, '/demo/sharara-1.svg',
    'Sample listing to show how a sharara page looks.', array['sharara','designer','gota patti']),
  ('Demo — Plum Party Wear Gharara','demo-plum-party-wear-gharara','DEMO-GHA-01','gharara','wedding-party-wear-gharara','Silk','Threadwork',
    4799, 5799, 4, false, false, true, '/demo/gharara-1.svg',
    'Sample listing to show how a gharara page looks.', array['gharara','party wear']),
  ('Demo — Ivory Wedding Kurta Pajama','demo-ivory-wedding-kurta-pajama','DEMO-KUR-01','kurta-pajama','wedding-wear','Silk','Threadwork',
    2899, 3499, 6, true, false, false, '/demo/kurta-1.svg',
    'Sample listing to show how a kurta pajama page looks.', array['kurta','men','wedding'])
),
ins as (
  insert into public.products (name, slug, sku, description, category_id, subcategory_id, fabric_id, work_type_id,
    price, mrp, stock, is_available, is_featured, is_new_arrival, is_best_seller, tags, is_demo)
  select d.name, d.slug, d.sku, d.descr, c.id, sc.id, f.id, w.id, d.price, d.mrp, d.stock, true,
         d.feat, d.newa, d.best, d.tags, true
  from d
  join public.categories c on c.slug = d.cat
  left join public.subcategories sc on sc.category_id = c.id and sc.slug = d.sub
  left join public.fabrics f on f.name = d.fab
  left join public.work_types w on w.name = d.wrk
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.product_images (product_id, url, is_main, sort_order)
select ins.id, d.img, true, 0 from ins join d on d.slug = ins.slug;
