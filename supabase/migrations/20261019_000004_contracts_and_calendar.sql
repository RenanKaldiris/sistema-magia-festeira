-- Migration: 20261019_000004_contracts_and_calendar.sql
-- Adiciona suporte a link de contrato e integração Google no rentals

ALTER TABLE rentals ADD COLUMN IF NOT EXISTS contract_url TEXT;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS contract_drive_id TEXT;

-- Índice para busca rápida de locações com contratos gerados
CREATE INDEX IF NOT EXISTS idx_rentals_contract_url ON rentals(contract_url) WHERE contract_url IS NOT NULL;
