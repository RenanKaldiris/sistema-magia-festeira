/**
 * SISTEMA MAGIA FESTEIRA - MOTOR DE DADOS E REGRAS DE NEGÓCIO
 * Implementa a camada operacional com regras estritas de estoque, conflito de datas,
 * multi-tenancy, deduplicação por hash e auditoria.
 */

import {
  Tenant,
  Category,
  Theme,
  ThemeVariant,
  Kit,
  Item,
  KitItem,
  Media,
  Customer,
  Rental,
  RentalLine,
  Payment,
  CalendarSync,
  Import,
  ImportAsset,
  AIRun,
  AuditLog,
  ThemeWithDetails,
  RentalWithDetails,
} from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export interface StockCheckResult {
  available: boolean;
  themeId: string;
  themeName: string;
  stockTotal: number;
  stockCommitted: number;
  stockAvailable: number;
  requestedQuantity: number;
  interval: {
    pickup: string;
    return: string;
  };
  conflictingRentals: Rental[];
}

async function safeSupabaseOperation(op: PromiseLike<any>, label: string) {
  try {
    const res = await op;
    if (res && res.error) {
      console.error(`[Supabase Error: ${label}]`, res.error);
    }
  } catch (err) {
    console.error(`[Supabase Exception: ${label}]`, err);
  }
}

// Seed Inicial Conforme 003_seed_data.sql
const DEFAULT_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

class MagiaStore {
  private tenants: Tenant[] = [
    {
      id: DEFAULT_TENANT_ID,
      name: 'Magia Festeira Decorações',
      slug: 'magia-festeira',
      logo_url: '/logo/logo-dark.png',
      contact_phone: '(11) 99999-8888',
      contact_email: 'contato@magiafesteira.com.br',
      status: 'active',
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
  ];

  private categories: Category[] = [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      tenant_id: DEFAULT_TENANT_ID,
      name: 'Super-heróis',
      slug: 'super-herois',
      description: 'Temas de heróis dos quadrinhos e filmes infantis',
      sort_order: 1,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      tenant_id: DEFAULT_TENANT_ID,
      name: 'Infantil Meninos',
      slug: 'infantil-meninos',
      description: 'Temas lúdicos e favoritos dos meninos',
      sort_order: 2,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      tenant_id: DEFAULT_TENANT_ID,
      name: 'Infantil Meninas',
      slug: 'infantil-meninas',
      description: 'Princesas, contos e temas delicados',
      sort_order: 3,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'c0000000-0000-0000-0000-000000000004',
      tenant_id: DEFAULT_TENANT_ID,
      name: '1º Aninho & Chá de Bebê',
      slug: 'primeiro-aninho-cha-de-bebe',
      description: 'Comemorações de primeiro ano e recepções',
      sort_order: 4,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'c0000000-0000-0000-0000-000000000005',
      tenant_id: DEFAULT_TENANT_ID,
      name: 'Temas Especiais & Adultos',
      slug: 'especiais-adultos',
      description: 'Tardezinha, boteco, aniversários e comemorações intimistas',
      sort_order: 5,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
  ];

  private items: Item[] = [
    {
      id: 'd0000000-0000-0000-0000-000000000001',
      tenant_id: DEFAULT_TENANT_ID,
      code: 'IT-001',
      name: 'Cômoda Fake Branca',
      category: 'Mobília',
      description: 'Cômoda decorativa desmontável em MDF laqueado branco',
      quantity_total: 3,
      quantity_available: 2,
      unit_price: 45.0,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'd0000000-0000-0000-0000-000000000002',
      tenant_id: DEFAULT_TENANT_ID,
      code: 'IT-002',
      name: 'Display de Chão Vingadores',
      category: 'Displays',
      description: 'Display de chão em MDF 90cm com suporte traseiro',
      quantity_total: 4,
      quantity_available: 3,
      unit_price: 25.0,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'd0000000-0000-0000-0000-000000000003',
      tenant_id: DEFAULT_TENANT_ID,
      code: 'IT-003',
      name: 'Painel Redondo Ripado 2m',
      category: 'Painéis',
      description: 'Estrutura redonda desmontável em madeira nobre clara',
      quantity_total: 2,
      quantity_available: 1,
      unit_price: 80.0,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'd0000000-0000-0000-0000-000000000004',
      tenant_id: DEFAULT_TENANT_ID,
      code: 'IT-004',
      name: 'Arco de Balões Desconstruído',
      category: 'Cenografia',
      description: 'Estrutura flexível para montagem orgânica',
      quantity_total: 5,
      quantity_available: 4,
      unit_price: 60.0,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'd0000000-0000-0000-0000-000000000005',
      tenant_id: DEFAULT_TENANT_ID,
      code: 'IT-005',
      name: 'Tapete Grama Sintética 3x2m',
      category: 'Pisos',
      description: 'Tapete verde de alta densidade toque macio',
      quantity_total: 3,
      quantity_available: 2,
      unit_price: 35.0,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
  ];

  private themes: Theme[] = [
    {
      id: 'e0000000-0000-0000-0000-000000000001',
      tenant_id: DEFAULT_TENANT_ID,
      code: 'MF-0127',
      name: 'Vingadores',
      slug: 'vingadores',
      category_id: 'c0000000-0000-0000-0000-000000000001',
      characters: ['Homem de Ferro', 'Capitão América', 'Hulk', 'Thor', 'Homem-Aranha'],
      piece_count: 18,
      base_price: 180.0,
      description: 'Decoração completa com painel temático de super-heróis, cilindros decorados, suporte de doces e personagens colecionáveis.',
      notes: 'Estoque total de 2 unidades completas deste tema para locações sobrepostas.',
      status: 'active',
      stock_quantity: 2, // Conforme Prompt Mestre: Estoque 2
      featured: true,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000002',
      tenant_id: DEFAULT_TENANT_ID,
      code: 'MF-0128',
      name: 'Minha Primeira Volta ao Sol',
      slug: 'minha-primeira-volta-ao-sol',
      category_id: 'c0000000-0000-0000-0000-000000000004',
      characters: ['Solzinho', 'Nuvens', 'Planetas fofos'],
      piece_count: 14,
      base_price: 210.0,
      description: 'Tema afetuoso em tons pastéis e amarelo suave, com solzinho iluminado em LED e arranjos delicados.',
      notes: 'Ideal para aniversários de 1 ano.',
      status: 'active',
      stock_quantity: 1,
      featured: true,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000003',
      tenant_id: DEFAULT_TENANT_ID,
      code: 'MF-0129',
      name: 'Tardezinha',
      slug: 'tardezinha',
      category_id: 'c0000000-0000-0000-0000-000000000005',
      characters: ['Pôr do sol', 'Fitas', 'Violão decorativo'],
      piece_count: 16,
      base_price: 195.0,
      description: 'Cenário descontraído inspirado em pôr do sol, pagode e comemorações ao ar livre.',
      notes: 'Acompanha tambor decorativo e letreiro personalizado.',
      status: 'active',
      stock_quantity: 1,
      featured: true,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
  ];

  private themeVariants: ThemeVariant[] = [
    {
      id: 'f0000000-0000-0000-0000-000000000001',
      theme_id: 'e0000000-0000-0000-0000-000000000001',
      name: 'Vingadores Baby',
      description: 'Versão com personagens em traço infantil fofo e cores harmonizadas',
      ai_confidence: 0.95,
      active: true,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'f0000000-0000-0000-0000-000000000002',
      theme_id: 'e0000000-0000-0000-0000-000000000001',
      name: 'Vingadores Clássico',
      description: 'Versão com estilo tradicional dos quadrinhos e tons fortes',
      ai_confidence: 0.98,
      active: true,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'f0000000-0000-0000-0000-000000000003',
      theme_id: 'e0000000-0000-0000-0000-000000000001',
      name: 'Vingadores Todos os Heróis',
      description: 'Cenário expandido com elementos do Hulkbuster e escudo do Capitão',
      ai_confidence: 0.92,
      active: true,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
  ];

  private kits: Kit[] = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      theme_id: 'e0000000-0000-0000-0000-000000000001',
      name: 'Kit Bronze',
      description: 'Painel redondo com capa temática + trio de cilindros decorados + bandejas',
      price: 140.0,
      active: true,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      theme_id: 'e0000000-0000-0000-0000-000000000001',
      name: 'Kit Prata',
      description: 'Kit Bronze + Cômoda fake branca + 2 displays de chão + tapete verde',
      price: 169.9,
      active: true,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      theme_id: 'e0000000-0000-0000-0000-000000000001',
      name: 'Kit Ouro VIP',
      description: 'Decoração completa com arco orgânico de balões, iluminador LED e peças de luxo',
      price: 230.0,
      active: true,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
  ];

  private kitItems: KitItem[] = [
    {
      kit_id: '10000000-0000-0000-0000-000000000002',
      item_id: 'd0000000-0000-0000-0000-000000000001', // Cômoda Fake
      quantity: 1,
    },
    {
      kit_id: '10000000-0000-0000-0000-000000000002',
      item_id: 'd0000000-0000-0000-0000-000000000002', // 2 Displays
      quantity: 2,
    },
    {
      kit_id: '10000000-0000-0000-0000-000000000002',
      item_id: 'd0000000-0000-0000-0000-000000000005', // Tapete
      quantity: 1,
    },
  ];

  private media: Media[] = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      tenant_id: DEFAULT_TENANT_ID,
      entity_type: 'theme',
      entity_id: 'e0000000-0000-0000-0000-000000000001',
      storage_path: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80',
      original_name: 'vingadores_principal.jpg',
      mime_type: 'image/jpeg',
      file_size: 1245000,
      fingerprint: 'sha256-vingadores-01',
      sort_order: 1,
      is_primary: true,
      ai_tags: ['super-herois', 'vingadores', 'hulk', 'homem de ferro'],
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      tenant_id: DEFAULT_TENANT_ID,
      entity_type: 'theme',
      entity_id: 'e0000000-0000-0000-0000-000000000001',
      storage_path: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80',
      original_name: 'vingadores_detalhe_cilindros.jpg',
      mime_type: 'image/jpeg',
      file_size: 980000,
      fingerprint: 'sha256-vingadores-02',
      sort_order: 2,
      is_primary: false,
      ai_tags: ['cilindros', 'detalhe'],
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: '20000000-0000-0000-0000-000000000003',
      tenant_id: DEFAULT_TENANT_ID,
      entity_type: 'theme',
      entity_id: 'e0000000-0000-0000-0000-000000000002',
      storage_path: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&auto=format&fit=crop&q=80',
      original_name: 'volta_ao_sol_mesa.jpg',
      mime_type: 'image/jpeg',
      file_size: 1420000,
      fingerprint: 'sha256-sol-01',
      sort_order: 1,
      is_primary: true,
      ai_tags: ['1 ano', 'sol', 'infantil'],
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: '20000000-0000-0000-0000-000000000004',
      tenant_id: DEFAULT_TENANT_ID,
      entity_type: 'theme',
      entity_id: 'e0000000-0000-0000-0000-000000000003',
      storage_path: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&auto=format&fit=crop&q=80',
      original_name: 'tardezinha_sunset.jpg',
      mime_type: 'image/jpeg',
      file_size: 1150000,
      fingerprint: 'sha256-tardezinha-01',
      sort_order: 1,
      is_primary: true,
      ai_tags: ['tardezinha', 'sunset', 'adulto'],
      created_at: '2026-09-01T10:00:00Z',
    },
  ];

  private customers: Customer[] = [
    {
      id: '30000000-0000-0000-0000-000000000001',
      tenant_id: DEFAULT_TENANT_ID,
      name: 'João Carlos da Silva',
      phone: '(11) 98765-4321',
      email: 'joao.silva@email.com',
      notes: 'Festa de 5 anos do Pedro',
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      id: '30000000-0000-0000-0000-000000000002',
      tenant_id: DEFAULT_TENANT_ID,
      name: 'Mariana Albuquerque',
      phone: '(11) 97654-3210',
      email: 'mariana.alb@email.com',
      notes: 'Aniversário dos gêmeos',
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
  ];

  // Duas reservas sobrepostas no período 14/09 a 16/09 para o tema Vingadores (estoque 2)
  private rentals: Rental[] = [
    {
      id: '40000000-0000-0000-0000-000000000001',
      tenant_id: DEFAULT_TENANT_ID,
      customer_id: '30000000-0000-0000-0000-000000000001',
      theme_id: 'e0000000-0000-0000-0000-000000000001', // Vingadores
      theme_variant_id: 'f0000000-0000-0000-0000-000000000001',
      kit_id: '10000000-0000-0000-0000-000000000002',
      event_date: '2026-09-15',
      pickup_date: '2026-09-14',
      return_date: '2026-09-16',
      status: 'reservado',
      total: 169.9,
      paid: 60.0,
      balance: 109.9,
      delivery_location: 'Buffet Sonho Meu - Rua das Flores 120',
      notes: 'Reserva A: Retirada 14/09 e devolução 16/09 (Unidade 1 ocupada)',
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
    {
      id: '40000000-0000-0000-0000-000000000002',
      tenant_id: DEFAULT_TENANT_ID,
      customer_id: '30000000-0000-0000-0000-000000000002',
      theme_id: 'e0000000-0000-0000-0000-000000000001', // Vingadores
      theme_variant_id: 'f0000000-0000-0000-0000-000000000002',
      kit_id: '10000000-0000-0000-0000-000000000002',
      event_date: '2026-09-15',
      pickup_date: '2026-09-14',
      return_date: '2026-09-16',
      status: 'reservado',
      total: 169.9,
      paid: 169.9,
      balance: 0.0,
      delivery_location: 'Salão de Festas Condomínio Bosque',
      notes: 'Reserva B: Retirada 14/09 e devolução 16/09 (Unidade 2 ocupada)',
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    },
  ];

  private payments: Payment[] = [
    {
      id: '50000000-0000-0000-0000-000000000001',
      rental_id: '40000000-0000-0000-0000-000000000001',
      amount: 60.0,
      method: 'pix',
      paid_at: '2026-09-01T11:00:00Z',
      note: 'Sinal de 35% pago via PIX',
      created_at: '2026-09-01T11:00:00Z',
    },
    {
      id: '50000000-0000-0000-0000-000000000002',
      rental_id: '40000000-0000-0000-0000-000000000002',
      amount: 169.9,
      method: 'pix',
      paid_at: '2026-09-02T14:30:00Z',
      note: 'Pagamento integral antecipado',
      created_at: '2026-09-02T14:30:00Z',
    },
  ];

  private calendarSync: CalendarSync[] = [
    {
      id: '60000000-0000-0000-0000-000000000001',
      rental_id: '40000000-0000-0000-0000-000000000001',
      provider: 'google',
      external_event_id: 'gcal_evt_vingadores_001',
      sync_status: 'synced',
      last_sync_at: '2026-09-01T10:05:00Z',
      error_message: null,
      created_at: '2026-09-01T10:05:00Z',
      updated_at: '2026-09-01T10:05:00Z',
    },
    {
      id: '60000000-0000-0000-0000-000000000002',
      rental_id: '40000000-0000-0000-0000-000000000002',
      provider: 'google',
      external_event_id: 'gcal_evt_vingadores_002',
      sync_status: 'synced',
      last_sync_at: '2026-09-01T10:10:00Z',
      error_message: null,
      created_at: '2026-09-01T10:10:00Z',
      updated_at: '2026-09-01T10:10:00Z',
    },
  ];

  private imports: Import[] = [
    {
      id: '70000000-0000-0000-0000-000000000001',
      tenant_id: DEFAULT_TENANT_ID,
      source_type: 'google_drive',
      source_ref: 'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoP',
      status: 'review',
      total_files: 12,
      processed_files: 12,
      started_at: '2026-09-02T15:00:00Z',
      finished_at: '2026-09-02T15:02:30Z',
    },
  ];

  private importAssets: ImportAsset[] = [
    {
      id: '80000000-0000-0000-0000-000000000001',
      import_id: '70000000-0000-0000-0000-000000000001',
      source_file: 'Vingadores_Mesa_Principal.jpg',
      fingerprint: 'sha256-import-001',
      status: 'review',
      detected_entity: 'Vingadores (MF-0127)',
      confidence: 0.94,
      storage_path: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600',
      created_at: '2026-09-02T15:01:00Z',
    },
    {
      id: '80000000-0000-0000-0000-000000000002',
      import_id: '70000000-0000-0000-0000-000000000001',
      source_file: 'Vingadores_Baby_Detalhe.jpg',
      fingerprint: 'sha256-import-002',
      status: 'review',
      detected_entity: 'Vingadores Baby (Variação)',
      confidence: 0.89,
      storage_path: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600',
      created_at: '2026-09-02T15:01:30Z',
    },
  ];

  private aiRuns: AIRun[] = [
    {
      id: '90000000-0000-0000-0000-000000000001',
      tenant_id: DEFAULT_TENANT_ID,
      channel: 'whatsapp',
      sender_id: '5511999990000',
      input_text: 'Cadastre essa foto no tema Vingadores Baby',
      model: 'gemini-2.5-flash',
      status: 'success',
      confidence: 0.94,
      tool_calls: [
        {
          name: 'search_themes',
          args: { query: 'Vingadores' },
          result: { count: 1, themes: [{ id: 'e0000000-0000-0000-0000-000000000001', name: 'Vingadores' }] },
        },
        {
          name: 'create_theme_variant',
          args: { theme_id: 'e0000000-0000-0000-0000-000000000001', name: 'Vingadores Baby' },
          result: { id: 'f0000000-0000-0000-0000-000000000001', status: 'created' },
        },
      ],
      output_text: 'Identifiquei o tema Vingadores. Variação Vingadores Baby associada com sucesso. Confiança: 0,94.',
      created_at: '2026-09-02T18:00:00Z',
    },
  ];

  private auditLogs: AuditLog[] = [
    {
      id: 'a1000000-0000-0000-0000-000000000001',
      tenant_id: DEFAULT_TENANT_ID,
      action: 'SYSTEM_BOOT',
      entity: 'system',
      payload: { message: 'Sistema Magia Festeira inicializado com sucesso.' },
      created_at: '2026-09-01T10:00:00Z',
    },
  ];

  // ============================================================================
  // CONSTRUTOR E SINCRONIZAÇÃO AUTOMÁTICA COM SUPABASE NA NUVEM
  // ============================================================================

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromLocalStorage();
      this.syncWithSupabase();
    }
  }

  public saveToLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const state = {
        themes: this.themes,
        customers: this.customers,
        rentals: this.rentals,
        items: this.items,
        themeVariants: this.themeVariants,
        kits: this.kits,
        kitItems: this.kitItems,
        payments: this.payments,
        media: this.media,
        imports: this.imports,
        importAssets: this.importAssets,
        auditLogs: this.auditLogs,
      };
      localStorage.setItem('magia_festeira_local_store', JSON.stringify(state));
    } catch (e) {
      console.warn('[LocalStorage Save Error]', e);
    }
  }

  public loadFromLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('magia_festeira_local_store');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.themes && parsed.themes.length > 0) this.themes = parsed.themes;
      if (parsed.customers && parsed.customers.length > 0) this.customers = parsed.customers;
      if (parsed.rentals && parsed.rentals.length > 0) this.rentals = parsed.rentals;
      if (parsed.items && parsed.items.length > 0) this.items = parsed.items;
      if (parsed.themeVariants && parsed.themeVariants.length > 0) this.themeVariants = parsed.themeVariants;
      if (parsed.kits && parsed.kits.length > 0) this.kits = parsed.kits;
      if (parsed.kitItems && parsed.kitItems.length > 0) this.kitItems = parsed.kitItems;
      if (parsed.payments && parsed.payments.length > 0) this.payments = parsed.payments;
      if (parsed.media && parsed.media.length > 0) this.media = parsed.media;
      if (parsed.imports && parsed.imports.length > 0) this.imports = parsed.imports;
      if (parsed.importAssets && parsed.importAssets.length > 0) this.importAssets = parsed.importAssets;
      if (parsed.auditLogs && parsed.auditLogs.length > 0) this.auditLogs = parsed.auditLogs;
    } catch (e) {
      console.warn('[LocalStorage Load Error]', e);
    }
  }

  public async syncWithSupabase() {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const [themesRes, customersRes, rentalsRes, itemsRes, variantsRes, kitsRes, mediaRes] = await Promise.all([
        supabase.from('themes').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('rentals').select('*'),
        supabase.from('items').select('*'),
        supabase.from('theme_variants').select('*'),
        supabase.from('kits').select('*'),
        supabase.from('media').select('*'),
      ]);

      if (themesRes.data && themesRes.data.length > 0) {
        this.themes = themesRes.data;
      }
      if (customersRes.data && customersRes.data.length > 0) {
        this.customers = customersRes.data;
      }
      if (rentalsRes.data && rentalsRes.data.length > 0) {
        this.rentals = rentalsRes.data;
      }
      if (itemsRes.data && itemsRes.data.length > 0) {
        this.items = itemsRes.data;
      }
      if (variantsRes.data && variantsRes.data.length > 0) {
        this.themeVariants = variantsRes.data;
      }
      if (kitsRes.data && kitsRes.data.length > 0) {
        this.kits = kitsRes.data;
      }
      if (mediaRes.data && mediaRes.data.length > 0) {
        this.media = mediaRes.data;
      }
      this.saveToLocalStorage();
    } catch (err) {
      console.warn('[Supabase Sync Warning]', err);
    }
  }

  // ============================================================================
  // MÉTODOS DE CONSULTA (QUERIES)
  // ============================================================================

  public getTenant() {
    return this.tenants[0];
  }

  public getCategories() {
    return [...this.categories].sort((a, b) => a.sort_order - b.sort_order);
  }

  public getThemes(filters?: { categoryId?: string; search?: string; status?: string }) {
    let list = [...this.themes];
    if (filters?.categoryId) {
      list = list.filter((t) => t.category_id === filters.categoryId);
    }
    if (filters?.status) {
      list = list.filter((t) => t.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          t.characters.some((c) => c.toLowerCase().includes(q))
      );
    }
    return list;
  }

  public getThemeBySlug(slug: string): ThemeWithDetails | null {
    const theme = this.themes.find((t) => t.slug === slug || t.id === slug || t.code === slug);
    if (!theme) return null;
    return this.enrichTheme(theme);
  }

  public getThemeById(id: string): ThemeWithDetails | null {
    const theme = this.themes.find((t) => t.id === id);
    if (!theme) return null;
    return this.enrichTheme(theme);
  }

  private enrichTheme(theme: Theme): ThemeWithDetails {
    const category = this.categories.find((c) => c.id === theme.category_id) || null;
    const variants = this.themeVariants.filter((v) => v.theme_id === theme.id);
    const themeKits = this.kits
      .filter((k) => k.theme_id === theme.id)
      .map((kit) => {
        const items = this.kitItems
          .filter((ki) => ki.kit_id === kit.id)
          .map((ki) => ({
            ...ki,
            item: this.items.find((it) => it.id === ki.item_id)!,
          }))
          .filter((ki) => Boolean(ki.item));
        return { ...kit, items };
      });
    const media = this.media
      .filter((m) => m.entity_type === 'theme' && m.entity_id === theme.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const primaryMedia = media.find((m) => m.is_primary) || media[0] || null;

    return {
      ...theme,
      category,
      variants,
      kits: themeKits,
      items: [],
      media,
      primary_media: primaryMedia,
    };
  }

  public getItems() {
    return [...this.items];
  }

  public getCustomers() {
    return [...this.customers];
  }

  public getRentals(): RentalWithDetails[] {
    return this.rentals.map((r) => {
      const customer = this.customers.find((c) => c.id === r.customer_id);
      const theme = this.themes.find((t) => t.id === r.theme_id);
      const variant = this.themeVariants.find((v) => v.id === r.theme_variant_id) || null;
      const kit = this.kits.find((k) => k.id === r.kit_id) || null;
      const sync = this.calendarSync.find((s) => s.rental_id === r.id) || null;
      const rentalPayments = this.payments.filter((p) => p.rental_id === r.id);

      return {
        ...r,
        customer,
        theme,
        theme_variant: variant,
        kit,
        lines: [],
        payments: rentalPayments,
        calendar_sync: sync,
      };
    });
  }

  public getImports() {
    return [...this.imports];
  }

  public getImportAssets(importId?: string) {
    if (importId) {
      return this.importAssets.filter((a) => a.import_id === importId);
    }
    return [...this.importAssets];
  }

  public getAIRuns() {
    return [...this.aiRuns].reverse();
  }

  public getAuditLogs() {
    return [...this.auditLogs].reverse();
  }

  // ============================================================================
  // REGRA DE OURO: CÁLCULO DE DISPONIBILIDADE E CONFLITO DE ESTOQUE
  // ============================================================================

  /**
   * Avalia a disponibilidade de um tema considerando o INTERVALO INTEIRO
   * entre retirada e devolução (inclusive).
   */
  public checkStockAvailability(
    themeId: string,
    pickupDate: string,
    returnDate: string,
    requestedQuantity: number = 1,
    ignoreRentalId?: string
  ): StockCheckResult {
    const theme = this.themes.find((t) => t.id === themeId);
    if (!theme) {
      throw new Error(`Tema não encontrado: ${themeId}`);
    }

    const reqStart = new Date(pickupDate).getTime();
    const reqEnd = new Date(returnDate).getTime();

    // Filtra reservas ativas (não canceladas e não finalizadas se anterior)
    const activeRentals = this.rentals.filter((r) => {
      if (r.id === ignoreRentalId) return false;
      if (r.theme_id !== themeId) return false;
      if (r.status === 'cancelado' || r.status === 'devolvido') return false;

      const rStart = new Date(r.pickup_date).getTime();
      const rEnd = new Date(r.return_date).getTime();

      // Há sobreposição se: início do pedido <= fim da reserva E fim do pedido >= início da reserva
      return reqStart <= rEnd && reqEnd >= rStart;
    });

    const stockTotal = theme.stock_quantity;
    const stockCommitted = activeRentals.length; // cada reserva compromete 1 unidade padrão
    const stockAvailable = Math.max(0, stockTotal - stockCommitted);
    const available = stockAvailable >= requestedQuantity;

    return {
      available,
      themeId: theme.id,
      themeName: theme.name,
      stockTotal,
      stockCommitted,
      stockAvailable,
      requestedQuantity,
      interval: {
        pickup: pickupDate,
        return: returnDate,
      },
      conflictingRentals: activeRentals,
    };
  }

  // ============================================================================
  // MUTAÇÕES (ACTIONS / TOOLS)
  // ============================================================================

  public createRental(
    data: Omit<Rental, 'id' | 'created_at' | 'updated_at'>,
    forceAdminOverride: boolean = false
  ): { success: boolean; rental?: Rental; conflict?: StockCheckResult; error?: string } {
    const check = this.checkStockAvailability(
      data.theme_id,
      data.pickup_date,
      data.return_date,
      1
    );

    if (!check.available && !forceAdminOverride) {
      return {
        success: false,
        conflict: check,
        error: `CONFLITO DE ESTOQUE: O tema "${check.themeName}" possui ${check.stockTotal} unidades no total e já tem ${check.stockCommitted} unidade(s) comprometida(s) no intervalo de ${data.pickup_date} a ${data.return_date}.`,
      };
    }

    const id = '40000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0');
    const now = new Date().toISOString();

    const newRental: Rental = {
      ...data,
      id,
      balance: Math.max(0, data.total - data.paid),
      created_at: now,
      updated_at: now,
    };

    this.rentals.push(newRental);

    // Cria registro de espelho de calendário
    this.calendarSync.push({
      id: '60000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0'),
      rental_id: id,
      provider: 'google',
      external_event_id: `gcal_evt_${id.substring(0, 8)}`,
      sync_status: 'synced',
      last_sync_at: now,
      error_message: null,
      created_at: now,
      updated_at: now,
    });

    this.logAudit('CREATE_RENTAL', 'rentals', id, {
      rental: newRental,
      overrideUsed: !check.available && forceAdminOverride,
    });

    if (isSupabaseConfigured && supabase) {
      safeSupabaseOperation(
        supabase.from('rentals').insert({
          id: newRental.id,
          tenant_id: newRental.tenant_id,
          customer_id: newRental.customer_id,
          theme_id: newRental.theme_id,
          theme_variant_id: newRental.theme_variant_id,
          kit_id: newRental.kit_id,
          event_date: newRental.event_date,
          pickup_date: newRental.pickup_date,
          return_date: newRental.return_date,
          status: newRental.status,
          total: newRental.total,
          paid: newRental.paid,
          balance: newRental.balance,
          delivery_location: newRental.delivery_location,
          notes: newRental.notes,
        }),
        'Insert Rental'
      );
    }

    this.saveToLocalStorage();
    return { success: true, rental: newRental };
  }

  public updateRental(
    rentalId: string,
    updates: Partial<Rental>
  ): { success: boolean; rental?: Rental; error?: string } {
    const idx = this.rentals.findIndex((r) => r.id === rentalId);
    if (idx === -1) return { success: false, error: 'Reserva não encontrada' };

    const current = this.rentals[idx];
    const updated: Rental = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.paid !== undefined || updates.total !== undefined) {
      updated.balance = Math.max(0, updated.total - updated.paid);
    }

    this.rentals[idx] = updated;

    // Atualiza status no Google Calendar
    const sync = this.calendarSync.find((s) => s.rental_id === rentalId);
    if (sync) {
      sync.sync_status = 'synced';
      sync.last_sync_at = new Date().toISOString();
    }

    if (isSupabaseConfigured && supabase) {
      safeSupabaseOperation(
        supabase.from('rentals').update({
          ...updates,
          updated_at: updated.updated_at,
        }).eq('id', rentalId),
        'Update Rental'
      );
    }

    this.logAudit('UPDATE_RENTAL', 'rentals', rentalId, updates);
    this.saveToLocalStorage();
    return { success: true, rental: updated };
  }

  public createCustomer(data: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>): Customer {
    const id = '30000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0');
    const now = new Date().toISOString();

    const customer: Customer = {
      ...data,
      id,
      tenant_id: DEFAULT_TENANT_ID,
      created_at: now,
      updated_at: now,
    };

    this.customers.push(customer);
    this.logAudit('CREATE_CUSTOMER', 'customers', id, customer);

    if (isSupabaseConfigured && supabase) {
      safeSupabaseOperation(
        supabase.from('customers').insert({
          id: customer.id,
          tenant_id: customer.tenant_id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          notes: customer.notes,
        }),
        'Insert Customer'
      );
    }

    this.saveToLocalStorage();
    return customer;
  }

  public recordPayment(rentalId: string, amount: number, method: Payment['method'], note?: string) {
    const rental = this.rentals.find((r) => r.id === rentalId);
    if (!rental) throw new Error('Reserva não encontrada');

    const payment: Payment = {
      id: '50000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0'),
      rental_id: rentalId,
      amount,
      method,
      paid_at: new Date().toISOString(),
      note: note || null,
      created_at: new Date().toISOString(),
    };

    this.payments.push(payment);
    rental.paid += amount;
    rental.balance = Math.max(0, rental.total - rental.paid);
    rental.updated_at = new Date().toISOString();

    this.logAudit('RECORD_PAYMENT', 'payments', payment.id, { rentalId, amount, method });
    this.saveToLocalStorage();
    return payment;
  }

  public createTheme(data: {
    name: string;
    category_id?: string;
    characters?: string[];
    base_price: number;
    description?: string;
    stock_quantity?: number;
    imageUrl?: string;
  }): Theme {
    const count = this.themes.length + 127;
    const code = `MF-0${count}`;
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = 'e0000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0');
    const now = new Date().toISOString();

    const newTheme: Theme = {
      id,
      tenant_id: DEFAULT_TENANT_ID,
      code,
      name: data.name,
      slug,
      category_id: data.category_id || null,
      characters: data.characters || [],
      piece_count: 15,
      base_price: data.base_price || 150.0,
      description: data.description || null,
      notes: null,
      status: 'active',
      stock_quantity: data.stock_quantity || 1,
      featured: true,
      created_at: now,
      updated_at: now,
    };

    this.themes.push(newTheme);

    // Se forneceu foto inicial
    if (data.imageUrl) {
      this.addMediaToEntity({
        entity_type: 'theme',
        entity_id: id,
        storage_path: data.imageUrl,
        original_name: `${slug}_capa.jpg`,
        mime_type: 'image/jpeg',
        file_size: 500000,
        fingerprint: `sha256-${id.substring(0, 8)}`,
        is_primary: true,
        ai_tags: data.characters || [],
      });
    }

    this.logAudit('CREATE_THEME', 'themes', id, newTheme);

    if (isSupabaseConfigured && supabase) {
      safeSupabaseOperation(
        supabase.from('themes').insert({
          id: newTheme.id,
          tenant_id: newTheme.tenant_id,
          code: newTheme.code,
          name: newTheme.name,
          slug: newTheme.slug,
          category_id: newTheme.category_id,
          characters: newTheme.characters,
          piece_count: newTheme.piece_count,
          base_price: newTheme.base_price,
          description: newTheme.description,
          status: newTheme.status,
          stock_quantity: newTheme.stock_quantity,
          featured: newTheme.featured,
        }),
        'Insert Theme'
      );
    }

    this.saveToLocalStorage();
    return newTheme;
  }

  public updateTheme(id: string, updates: Partial<Theme> & { imageUrl?: string }): Theme {
    const idx = this.themes.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Tema não encontrado');

    const { imageUrl, ...themeUpdates } = updates;

    const updated = {
      ...this.themes[idx],
      ...themeUpdates,
      updated_at: new Date().toISOString(),
    };
    this.themes[idx] = updated;

    if (imageUrl && imageUrl.trim()) {
      const existingMedia = this.media.find((m) => m.entity_type === 'theme' && m.entity_id === id && m.is_primary);
      if (existingMedia) {
        existingMedia.storage_path = imageUrl.trim();
        existingMedia.thumbnail_path = imageUrl.trim();
      } else {
        this.addMediaToEntity({
          entity_type: 'theme',
          entity_id: id,
          storage_path: imageUrl.trim(),
          original_name: `${updated.slug}_capa.jpg`,
          mime_type: 'image/jpeg',
          file_size: 500000,
          fingerprint: `sha256-${id.substring(0, 8)}-${Date.now()}`,
          is_primary: true,
          ai_tags: updated.characters || [],
        });
      }
    }

    this.logAudit('UPDATE_THEME', 'themes', id, updates);

    if (isSupabaseConfigured && supabase) {
      safeSupabaseOperation(
        supabase.from('themes').update({
          ...themeUpdates,
          updated_at: updated.updated_at,
        }).eq('id', id),
        'Update Theme'
      );
    }

    this.saveToLocalStorage();
    return updated;
  }

  public deleteTheme(id: string): boolean {
    const theme = this.themes.find((t) => t.id === id);
    if (!theme) return false;

    this.themes = this.themes.filter((t) => t.id !== id);
    this.themeVariants = this.themeVariants.filter((v) => v.theme_id !== id);
    this.kits = this.kits.filter((k) => k.theme_id !== id);
    this.media = this.media.filter((m) => !(m.entity_type === 'theme' && m.entity_id === id));

    this.logAudit('DELETE_THEME', 'themes', id, { name: theme.name, code: theme.code });

    if (isSupabaseConfigured && supabase) {
      safeSupabaseOperation(
        supabase.from('themes').delete().eq('id', id),
        'Delete Theme'
      );
    }

    this.saveToLocalStorage();
    return true;
  }

  public deleteThemes(ids: string[]): number {
    const toDelete = this.themes.filter((t) => ids.includes(t.id));
    if (toDelete.length === 0) return 0;

    const idsSet = new Set(ids);
    this.themes = this.themes.filter((t) => !idsSet.has(t.id));
    this.themeVariants = this.themeVariants.filter((v) => !idsSet.has(v.theme_id));
    this.kits = this.kits.filter((k) => !idsSet.has(k.theme_id));
    this.media = this.media.filter((m) => !(m.entity_type === 'theme' && idsSet.has(m.entity_id)));

    for (const theme of toDelete) {
      this.logAudit('DELETE_THEME', 'themes', theme.id, { name: theme.name, code: theme.code });
    }

    if (isSupabaseConfigured && supabase) {
      safeSupabaseOperation(
        supabase.from('themes').delete().in('id', ids),
        'Delete Themes Batch'
      );
    }

    this.saveToLocalStorage();
    return toDelete.length;
  }

  public createThemeVariant(themeId: string, name: string, description?: string): ThemeVariant {
    const id = 'f0000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0');
    const now = new Date().toISOString();

    const variant: ThemeVariant = {
      id,
      theme_id: themeId,
      name,
      description: description || null,
      ai_confidence: 1.0,
      active: true,
      created_at: now,
      updated_at: now,
    };

    this.themeVariants.push(variant);
    this.logAudit('CREATE_VARIANT', 'theme_variants', id, { themeId, name });

    if (isSupabaseConfigured && supabase) {
      safeSupabaseOperation(
        supabase.from('theme_variants').insert({
          id: variant.id,
          theme_id: variant.theme_id,
          name: variant.name,
          description: variant.description,
          ai_confidence: variant.ai_confidence,
          active: variant.active,
        }),
        'Insert Variant'
      );
    }

    this.saveToLocalStorage();
    return variant;
  }

  public createKit(themeId: string, name: string, price: number, description?: string): Kit {
    const id = '10000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0');
    const now = new Date().toISOString();

    const kit: Kit = {
      id,
      theme_id: themeId,
      name,
      description: description || null,
      price,
      active: true,
      created_at: now,
      updated_at: now,
    };

    this.kits.push(kit);
    this.logAudit('CREATE_KIT', 'kits', id, { themeId, name, price });

    if (isSupabaseConfigured && supabase) {
      safeSupabaseOperation(
        supabase.from('kits').insert({
          id: kit.id,
          theme_id: kit.theme_id,
          name: kit.name,
          description: kit.description,
          price: kit.price,
          active: kit.active,
        }),
        'Insert Kit'
      );
    }

    this.saveToLocalStorage();
    return kit;
  }

  public addItemToKit(kitId: string, itemId: string, quantity: number = 1): KitItem {
    const existing = this.kitItems.find((ki) => ki.kit_id === kitId && ki.item_id === itemId);
    if (existing) {
      existing.quantity += quantity;
      this.saveToLocalStorage();
      return existing;
    }

    const kitItem: KitItem = {
      id: 'ki-' + Math.random().toString(36).substring(2, 10),
      kit_id: kitId,
      item_id: itemId,
      quantity,
    };
    this.kitItems.push(kitItem);
    this.saveToLocalStorage();
    return kitItem;
  }

  public createItem(data: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'quantity_available'>): Item {
    const id = 'd0000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0');
    const now = new Date().toISOString();

    const item: Item = {
      ...data,
      id,
      quantity_available: data.quantity_total,
      created_at: now,
      updated_at: now,
    };

    this.items.push(item);
    this.logAudit('CREATE_ITEM', 'items', id, item);

    if (isSupabaseConfigured && supabase) {
      safeSupabaseOperation(
        supabase.from('items').insert({
          id: item.id,
          tenant_id: item.tenant_id,
          code: item.code,
          name: item.name,
          category: item.category,
          description: item.description,
          quantity_total: item.quantity_total,
          quantity_available: item.quantity_available,
          unit_price: item.unit_price,
        }),
        'Insert Item'
      );
    }

    this.saveToLocalStorage();
    return item;
  }

  public addMediaToEntity(data: Omit<Media, 'id' | 'created_at' | 'tenant_id' | 'sort_order'> & { sort_order?: number }): {
    media: Media;
    isDuplicate: boolean;
  } {
    // Deduplicação por fingerprint SHA-256
    const existing = this.media.find((m) => m.fingerprint === data.fingerprint);
    if (existing) {
      return { media: existing, isDuplicate: true };
    }

    const id = '20000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0');
    const newMedia: Media = {
      ...data,
      id,
      tenant_id: DEFAULT_TENANT_ID,
      sort_order: data.sort_order || this.media.length + 1,
      created_at: new Date().toISOString(),
    };

    this.media.push(newMedia);
    this.logAudit('ADD_MEDIA', 'media', id, {
      entityType: data.entity_type,
      entityId: data.entity_id,
      fingerprint: data.fingerprint,
    });

    if (isSupabaseConfigured && supabase) {
      safeSupabaseOperation(
        supabase.from('media').insert({
          id: newMedia.id,
          tenant_id: newMedia.tenant_id,
          entity_type: newMedia.entity_type,
          entity_id: newMedia.entity_id,
          storage_path: newMedia.storage_path,
          thumbnail_path: newMedia.thumbnail_path,
          original_name: newMedia.original_name,
          mime_type: newMedia.mime_type,
          file_size: newMedia.file_size,
          fingerprint: newMedia.fingerprint,
          sort_order: newMedia.sort_order,
          is_primary: newMedia.is_primary,
          ai_tags: newMedia.ai_tags,
        }),
        'Insert Media'
      );
    }

    return { media: newMedia, isDuplicate: false };
  }

  public getMediaByEntity(entityType: string, entityId: string): Media[] {
    return this.media.filter((m) => m.entity_type === entityType && m.entity_id === entityId);
  }

  public deleteMedia(id: string): boolean {
    const idx = this.media.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    const [deleted] = this.media.splice(idx, 1);
    this.logAudit('DELETE_MEDIA', 'media', id, { entityType: deleted.entity_type, entityId: deleted.entity_id });
    if (isSupabaseConfigured && supabase) {
      safeSupabaseOperation(supabase.from('media').delete().eq('id', id), 'Delete Media');
    }
    this.saveToLocalStorage();
    return true;
  }

  public setPrimaryMedia(entityType: string, entityId: string, mediaId: string): boolean {
    let found = false;
    this.media.forEach((m) => {
      if (m.entity_type === entityType && m.entity_id === entityId) {
        if (m.id === mediaId) {
          m.is_primary = true;
          found = true;
        } else {
          m.is_primary = false;
        }
      }
    });
    if (found) {
      this.saveToLocalStorage();
    }
    return found;
  }

  public registerAIRun(run: Omit<AIRun, 'id' | 'tenant_id' | 'created_at'>): AIRun {
    const id = '90000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0');
    const newRun: AIRun = {
      ...run,
      id,
      tenant_id: DEFAULT_TENANT_ID,
      created_at: new Date().toISOString(),
    };
    this.aiRuns.push(newRun);
    return newRun;
  }

  public queueImport(sourceType: Import['source_type'], sourceRef: string, fileCount: number = 0): Import {
    const id = '70000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0');
    const imp: Import = {
      id,
      tenant_id: DEFAULT_TENANT_ID,
      source_type: sourceType,
      source_ref: sourceRef,
      status: 'processing',
      total_files: fileCount,
      processed_files: fileCount,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
    };
    this.imports.unshift(imp);
    this.logAudit('QUEUE_IMPORT', 'imports', id, { sourceType, sourceRef, fileCount });
    this.saveToLocalStorage();
    return imp;
  }

  public addImportAsset(asset: Omit<ImportAsset, 'id' | 'created_at'>): ImportAsset {
    const id = '80000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0');
    const newAsset: ImportAsset = {
      ...asset,
      id,
      created_at: new Date().toISOString(),
    };
    this.importAssets.unshift(newAsset);
    this.saveToLocalStorage();
    return newAsset;
  }

  public approveImportAsset(assetId: string): boolean {
    const asset = this.importAssets.find((a) => a.id === assetId);
    if (!asset) return false;
    asset.status = 'published';
    this.logAudit('APPROVE_IMPORT_ASSET', 'import_assets', assetId, { file: asset.source_file, entity: asset.detected_entity });
    this.saveToLocalStorage();
    return true;
  }

  public logAudit(action: string, entity: string, entityId?: string, payload?: Record<string, unknown> | object) {
    this.auditLogs.unshift({
      id: 'a1000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0'),
      tenant_id: DEFAULT_TENANT_ID,
      user_id: 'b0000000-0000-0000-0000-000000000001',
      action,
      entity,
      entity_id: entityId || null,
      payload: (payload as Record<string, unknown>) || {},
      created_at: new Date().toISOString(),
    });
  }
}

// Instância singleton global para persistência durante o ciclo de execução
export const store = new MagiaStore();
