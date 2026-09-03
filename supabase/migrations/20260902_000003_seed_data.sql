-- ==============================================================================
-- SISTEMA MAGIA FESTEIRA - MIGRATION 003: SEED DE DEMONSTRAÇÃO COMPLETO
-- ==============================================================================

-- 1. TENANT INICIAL: MAGIA FESTEIRA
INSERT INTO tenants (id, name, slug, contact_phone, contact_email, status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Magia Festeira Decorações',
    'magia-festeira',
    '(11) 99999-8888',
    'contato@magiafesteira.com.br',
    'active'
) ON CONFLICT (slug) DO NOTHING;

-- 2. ROLES
INSERT INTO roles (id, tenant_id, name, description) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Administrador', 'Acesso irrestrito a todo o sistema e integrações'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Gerente', 'Temas, estoque, agenda, clientes e relatórios'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Operação', 'Agenda, locações, devoluções e clientes'),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Catálogo', 'Leitura e edição visual de temas e fotos'),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Somente Leitura', 'Visualização autorizada')
ON CONFLICT DO NOTHING;

-- 3. CATEGORIAS
INSERT INTO categories (id, tenant_id, name, slug, description, sort_order) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Super-heróis', 'super-herois', 'Temas de heróis dos quadrinhos e filmes infantis', 1),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Infantil Meninos', 'infantil-meninos', 'Temas lúdicos e favoritos dos meninos', 2),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Infantil Meninas', 'infantil-meninas', 'Princesas, contos e temas delicados', 3),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '1º Aninho & Chá de Bebê', 'primeiro-aninho-cha-de-bebe', 'Comemorações de primeiro ano e recepções', 4),
('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Temas Especiais & Adultos', 'especiais-adultos', 'Tardezinha, boteco, aniversários e comemorações intimistas', 5)
ON CONFLICT DO NOTHING;

-- 4. ITENS AVULSOS DE ESTOQUE
INSERT INTO items (id, tenant_id, code, name, category, description, quantity_total, quantity_available, unit_price) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'IT-001', 'Cômoda Fake Branca', 'Mobília', 'Cômoda decorativa desmontável em MDF laqueado branco', 3, 2, 45.00),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'IT-002', 'Display de Chão Vingadores', 'Displays', 'Display de chão em MDF 90cm com suporte traseiro', 4, 3, 25.00),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'IT-003', 'Painel Redondo Ripado 2m', 'Painéis', 'Estrutura redonda desmontável em madeira nobre clara', 2, 1, 80.00),
('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'IT-004', 'Arco de Balões Desconstruído', 'Cenografia', 'Estrutura flexível para montagem orgânica', 5, 4, 60.00),
('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'IT-005', 'Tapete Grama Sintética 3x2m', 'Pisos', 'Tapete verde de alta densidade toque macio', 3, 2, 35.00)
ON CONFLICT DO NOTHING;

-- 5. TEMAS
INSERT INTO themes (id, tenant_id, code, name, slug, category_id, characters, piece_count, base_price, description, notes, status, stock_quantity, featured) VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'MF-0127',
    'Vingadores',
    'vingadores',
    'c0000000-0000-0000-0000-000000000001',
    ARRAY['Homem de Ferro', 'Capitão América', 'Hulk', 'Thor', 'Homem-Aranha'],
    18,
    180.00,
    'Decoração completa com painel temático de super-heróis, cilindros decorados, suporte de doces e personagens colecionáveis.',
    'Estoque total de 2 unidades completas deste tema para locações sobrepostas.',
    'active',
    2,
    true
),
(
    'e0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'MF-0128',
    'Minha Primeira Volta ao Sol',
    'minha-primeira-volta-ao-sol',
    'c0000000-0000-0000-0000-000000000004',
    ARRAY['Solzinho', 'Nuvens', 'Planetas fofos'],
    14,
    210.00,
    'Tema afetuoso em tons pastéis e amarelo suave, com solzinho iluminado em LED e arranjos delicados.',
    'Ideal para aniversários de 1 ano.',
    'active',
    1,
    true
),
(
    'e0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'MF-0129',
    'Tardezinha',
    'tardezinha',
    'c0000000-0000-0000-0000-000000000005',
    ARRAY['Pôr do sol', 'Fitas', 'Violão decorativo'],
    16,
    195.00,
    'Cenário descontraído inspirado em pôr do sol, pagode e comemorações ao ar livre.',
    'Acompanha tambor decorativo e letreiro personalizado.',
    'active',
    1,
    true
)
ON CONFLICT DO NOTHING;

-- 6. VARIAÇÕES DE TEMA
INSERT INTO theme_variants (id, theme_id, name, description, ai_confidence) VALUES
('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Vingadores Baby', 'Versão com personagens em traço infantil fofo e cores harmonizadas', 0.95),
('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Vingadores Clássico', 'Versão com estilo tradicional dos quadrinhos e tons fortes', 0.98),
('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'Vingadores Todos os Heróis', 'Cenário expandido com elementos do Hulkbuster e escudo do Capitão', 0.92)
ON CONFLICT DO NOTHING;

-- 7. KITS
INSERT INTO kits (id, theme_id, name, description, price, active) VALUES
('10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Kit Bronze', 'Painel redondo com capa temática + trio de cilindros decorados + bandejas', 140.00, true),
('10000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Kit Prata', 'Kit Bronze + Cômoda fake branca + 2 displays de chão + tapete verde', 169.90, true),
('10000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'Kit Ouro VIP', 'Decoração completa com arco orgânico de balões, iluminador LED e peças de luxo', 230.00, true)
ON CONFLICT DO NOTHING;

-- 8. COMPOSIÇÃO DOS KITS (KIT_ITEMS)
INSERT INTO kit_items (kit_id, item_id, quantity) VALUES
('10000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 1), -- Cômoda Fake
('10000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 2), -- 2 Displays de chão
('10000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005', 1)  -- Tapete de grama
ON CONFLICT DO NOTHING;

-- 9. MÍDIAS DOS TEMAS (FOTO PRINCIPAL E GALERIA COM URLs REAIS DEMONSTRATIVAS)
INSERT INTO media (id, tenant_id, entity_type, entity_id, storage_path, original_name, mime_type, file_size, fingerprint, sort_order, is_primary) VALUES
('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'theme', 'e0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80', 'vingadores_principal.jpg', 'image/jpeg', 1245000, 'sha256-vingadores-01', 1, true),
('20000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'theme', 'e0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80', 'vingadores_detalhe_cilindros.jpg', 'image/jpeg', 980000, 'sha256-vingadores-02', 2, false),
('20000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'theme', 'e0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&auto=format&fit=crop&q=80', 'volta_ao_sol_mesa.jpg', 'image/jpeg', 1420000, 'sha256-sol-01', 1, true),
('20000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'theme', 'e0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&auto=format&fit=crop&q=80', 'tardezinha_sunset.jpg', 'image/jpeg', 1150000, 'sha256-tardezinha-01', 1, true)
ON CONFLICT DO NOTHING;

-- 10. CLIENTES
INSERT INTO customers (id, tenant_id, name, phone, email, notes) VALUES
('30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'João Carlos da Silva', '(11) 98765-4321', 'joao.silva@email.com', 'Festa de 5 anos do Pedro'),
('30000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Mariana Albuquerque', '(11) 97654-3210', 'mariana.alb@email.com', 'Aniversário dos gêmeos'),
('30000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Camila Ferreira', '(11) 96543-2109', 'camila.f@email.com', 'Chá de 1º ano')
ON CONFLICT DO NOTHING;

-- 11. LOCAÇÕES (2 RESERVAS COEXISTENTES DE VINGADORES NO PERÍODO 14/09 A 16/09)
-- Como o estoque total de Vingadores é 2, essas duas reservas ocupam 100% do estoque nesse intervalo.
-- Uma 3ª reserva no mesmo período resultará em CONFLITO DE ESTOQUE!
INSERT INTO rentals (id, tenant_id, customer_id, theme_id, theme_variant_id, kit_id, event_date, pickup_date, return_date, status, total, paid, balance, delivery_location, notes) VALUES
(
    '40000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '2026-09-15',
    '2026-09-14',
    '2026-09-16',
    'reservado',
    169.90,
    60.00,
    109.90,
    'Buffet Sonho Meu - Rua das Flores 120',
    'Reserva A: Retirada 14/09 e devolução 16/09 (Unidade 1 ocupada)'
),
(
    '40000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    '2026-09-15',
    '2026-09-14',
    '2026-09-16',
    'reservado',
    169.90,
    169.90,
    0.00,
    'Salão de Festas Condomínio Bosque',
    'Reserva B: Retirada 14/09 e devolução 16/09 (Unidade 2 ocupada)'
)
ON CONFLICT DO NOTHING;

-- 12. PAGAMENTOS
INSERT INTO payments (id, rental_id, amount, method, paid_at, note) VALUES
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 60.00, 'pix', NOW() - INTERVAL '2 days', 'Sinal de 35% pago via PIX'),
('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 169.90, 'pix', NOW() - INTERVAL '1 day', 'Pagamento integral antecipado')
ON CONFLICT DO NOTHING;

-- 13. CALENDAR SYNC
INSERT INTO calendar_sync (rental_id, provider, external_event_id, sync_status, last_sync_at) VALUES
('40000000-0000-0000-0000-000000000001', 'google', 'gcal_evt_vingadores_001', 'synced', NOW()),
('40000000-0000-0000-0000-000000000002', 'google', 'gcal_evt_vingadores_002', 'synced', NOW())
ON CONFLICT DO NOTHING;
