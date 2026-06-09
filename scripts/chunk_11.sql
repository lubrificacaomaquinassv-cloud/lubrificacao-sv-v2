INSERT INTO preco_insumo (id, id_insumo, valor_unitario, data_vigencia, ativo) VALUES
('PRE-F-ACP-305', 'F-ACP-305', 14.0, '2026-06-08'::date, true),
('PRE-F-ARL-4154', 'F-ARL-4154', 30.0, '2026-06-08'::date, true),
('PRE-F-ARL-6091', 'F-ARL-6091', 13.0, '2026-06-08'::date, true),
('PRE-F-PEC-3045-FCBR-48S', 'F-PEC-3045-FCBR-48S', 109.0, '2026-06-08'::date, true),
('PRE-F-P-551807', 'F-P-551807', 83.62, '2026-06-08'::date, true),
('PRE-F-PSL-655', 'F-PSL-655', 53.06, '2026-06-08'::date, true),
('PRE-F-PSC-745', 'F-PSC-745', 53.17, '2026-06-08'::date, true),
('PRE-F-PSL-560', 'F-PSL-560', 12.95, '2026-06-08'::date, true),
('PRE-F-PSL-277', 'F-PSL-277', 89.91, '2026-06-08'::date, true),
('PRE-F-P-164378', 'F-P-164378', 133.5, '2026-06-08'::date, true),
('PRE-F-ARS-2499', 'F-ARS-2499', 145.0, '2026-06-08'::date, true),
('PRE-F-C-18450', 'F-C-18450', 71.66, '2026-06-08'::date, true),
('PRE-F-ARS-8234-FA-8280S', 'F-ARS-8234-FA-8280S', 77.4, '2026-06-08'::date, true),
('PRE-F-ACV-0798550', 'F-ACV-0798550', 219.26, '2026-06-08'::date, true)
ON CONFLICT (id) DO UPDATE SET valor_unitario=EXCLUDED.valor_unitario, data_vigencia=EXCLUDED.data_vigencia, ativo=true;