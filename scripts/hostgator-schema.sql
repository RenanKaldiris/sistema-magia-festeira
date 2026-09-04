-- ==============================================================================
-- SISTEMA MAGIA FESTEIRA - SCHEMA COMPLETO PARA POSTGRESQL HOSTGATOR
-- ==============================================================================
-- Este script cria todas as 23 tabelas, índices e dados iniciais (seed) da
-- Magia Festeira. Pode ser colado diretamente no phpPgAdmin do cPanel ou
-- executado via terminal/script automatizado.
-- ==============================================================================

-- 1. TENTATIVA DE ATIVAR EXTENSÃO UUID (COM TRATAMENTO DE ERRO SE NÃO FOR SUPERUSUÁRIO)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Extensao uuid-ossp nao pode ser criada ou ja existe (ignorando)';
END $$;

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Extensao pgcrypto nao pode ser criada ou ja existe (ignorando)';
END $$;

-- 2. TENANTS (Multi-empresa)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ROLES (Perfis de Acesso)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PERMISSIONS
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 6. USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- 7. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

-- 8. THEMES
CREATE TABLE IF NOT EXISTS themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    characters TEXT[] DEFAULT '{}',
    piece_count INT NOT NULL DEFAULT 0,
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    stock_quantity INT NOT NULL DEFAULT 1,
    featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, code),
    UNIQUE(tenant_id, slug)
);

-- 9. THEME_VARIANTS
CREATE TABLE IF NOT EXISTS theme_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    ai_confidence DECIMAL(5, 4) DEFAULT 1.0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. KITS
CREATE TABLE IF NOT EXISTS kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ITEMS (Estoque de peças avulsas reutilizáveis)
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    quantity_total INT NOT NULL DEFAULT 1,
    quantity_available INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- 12. KIT_ITEMS (Composição de kits por itens de estoque)
CREATE TABLE IF NOT EXISTS kit_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    UNIQUE(kit_id, item_id)
);

-- 13. STOCK_UNITS (Unidades físicas individuais)
CREATE TABLE IF NOT EXISTS stock_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
    serial_or_unit_code VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'available',
    condition_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, serial_or_unit_code)
);

-- 14. THEME_ITEMS (Itens padrão vinculados a um tema)
CREATE TABLE IF NOT EXISTS theme_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    required BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(theme_id, item_id)
);

-- 15. MEDIA (Fotos e imagens com preservação dos originais)
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    fingerprint VARCHAR(128) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    ai_tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. CUSTOMERS (Clientes)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    document VARCHAR(50),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. RENTALS (Locações / Reservas)
CREATE TABLE IF NOT EXISTS rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE RESTRICT,
    theme_variant_id UUID REFERENCES theme_variants(id) ON DELETE RESTRICT,
    kit_id UUID REFERENCES kits(id) ON DELETE RESTRICT,
    event_date DATE NOT NULL,
    pickup_date DATE NOT NULL,
    return_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'reservado',
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    delivery_location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. RENTAL_LINES (Peças da reserva)
CREATE TABLE IF NOT EXISTS rental_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00
);

-- 19. PAYMENTS (Histórico financeiro)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. CALENDAR_SYNC (Sincronização Google Calendar)
CREATE TABLE IF NOT EXISTS calendar_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID NOT NULL UNIQUE REFERENCES rentals(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'google',
    external_event_id VARCHAR(255),
    sync_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. IMPORTS (Fila de importação)
CREATE TABLE IF NOT EXISTS imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    source_ref TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'received',
    total_files INT NOT NULL DEFAULT 0,
    processed_files INT NOT NULL DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

-- 22. IMPORT_ASSETS (Assets em fila)
CREATE TABLE IF NOT EXISTS import_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
    source_file VARCHAR(255) NOT NULL,
    fingerprint VARCHAR(128) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'received',
    detected_entity VARCHAR(255),
    confidence DECIMAL(5, 4),
    storage_path TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. AI_RUNS (Execuções IA / WhatsApp)
CREATE TABLE IF NOT EXISTS ai_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL,
    sender_id VARCHAR(100),
    input_text TEXT,
    model VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'success',
    confidence DECIMAL(5, 4),
    tool_calls JSONB DEFAULT '[]'::jsonb,
    output_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. AUDIT_LOGS (Rastreabilidade e governança)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id UUID,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÍNDICES DE ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_themes_tenant_code ON themes(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_themes_tenant_slug ON themes(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_items_tenant_code ON items(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_media_fingerprint ON media(fingerprint);
CREATE INDEX IF NOT EXISTS idx_media_entity ON media(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_rentals_dates ON rentals(pickup_date, return_date);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_event ON calendar_sync(external_event_id);
CREATE INDEX IF NOT EXISTS idx_import_assets_fingerprint ON import_assets(fingerprint);

-- ==============================================================================
-- DADOS INICIAIS DA MAGIA FESTEIRA (SEED COMPLETO)
-- ==============================================================================

-- 1. TENANT MAGIA FESTEIRA
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

-- 9. MÍDIAS DOS TEMAS
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

-- 11. LOCAÇÕES (2 RESERVAS DE VINGADORES NO PERÍODO 14/09 A 16/09)
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
