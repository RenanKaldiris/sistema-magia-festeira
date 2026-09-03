-- ==============================================================================
-- SISTEMA MAGIA FESTEIRA - MIGRATION 002: ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Ativar RLS em todas as tabelas operacionais
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. POLÍTICAS PÚBLICAS PARA O CATÁLOGO PÚBLICO
-- Visitantes não autenticados podem APENAS visualizar categorias ativas, temas ativos, suas variações, kits e mídias públicas
CREATE POLICY "Public Read Categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Public Read Themes" ON themes
    FOR SELECT USING (status = 'active');

CREATE POLICY "Public Read Theme Variants" ON theme_variants
    FOR SELECT USING (active = true);

CREATE POLICY "Public Read Kits" ON kits
    FOR SELECT USING (active = true);

CREATE POLICY "Public Read Media" ON media
    FOR SELECT USING (true);

-- 2. POLÍTICAS PARA USUÁRIOS AUTENTICADOS (ISOLAMENTO POR TENANT)
CREATE POLICY "Tenant User Access Themes" ON themes
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Tenant User Access Items" ON items
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Tenant User Access Rentals" ON rentals
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Tenant User Access Customers" ON customers
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Tenant User Access Payments" ON payments
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Tenant User Access Imports" ON imports
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Tenant User Access AIRuns" ON ai_runs
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Tenant User Access AuditLogs" ON audit_logs
    FOR ALL USING (auth.uid() IS NOT NULL);
