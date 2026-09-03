/**
 * SISTEMA MAGIA FESTEIRA - DEFINIÇÕES DE TIPOS DO DOMÍNIO
 * 22 Entidades completas mapeando o schema relacional PostgreSQL / Supabase
 */

export type EntityStatus = 'active' | 'inactive' | 'archived';

export type RentalStatus = 'reservado' | 'alugado' | 'devolvido' | 'cancelado';

export type SyncStatus = 'pending' | 'synced' | 'error';

export type ImportStatus = 'received' | 'downloading' | 'processing' | 'grouped' | 'review' | 'published' | 'error';

export type UserRoleName = 'Administrador' | 'Gerente' | 'Operação' | 'Catálogo' | 'Somente Leitura';

// 1. Tenant
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

// 2. Role
export interface Role {
  id: string;
  tenant_id: string;
  name: UserRoleName;
  description?: string | null;
  created_at: string;
}

// 3. Permission
export interface Permission {
  id: string;
  key: string;
  description?: string | null;
  created_at: string;
}

// 4. RolePermission
export interface RolePermission {
  role_id: string;
  permission_id: string;
}

// 5. User
export interface User {
  id: string;
  tenant_id: string;
  role_id?: string | null;
  name: string;
  email: string;
  avatar_url?: string | null;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

// 6. Category
export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// 7. Theme
export interface Theme {
  id: string;
  tenant_id: string;
  code: string; // MF-0127
  name: string;
  slug: string;
  category_id?: string | null;
  characters: string[];
  piece_count: number;
  base_price: number;
  description?: string | null;
  notes?: string | null;
  status: EntityStatus;
  stock_quantity: number; // Quantidade de unidades totais deste tema
  featured: boolean;
  created_at: string;
  updated_at: string;
}

// 8. ThemeVariant
export interface ThemeVariant {
  id: string;
  theme_id: string;
  name: string; // Vingadores Baby, Vingadores Clássico
  description?: string | null;
  ai_confidence?: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// 9. Kit
export interface Kit {
  id: string;
  theme_id: string;
  name: string; // Bronze, Prata, Ouro
  description?: string | null;
  price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// 10. Item (Peça avulsa reutilizável com estoque independente)
export interface Item {
  id: string;
  tenant_id: string;
  code: string; // IT-001
  name: string;
  category?: string | null; // Mobília, Painéis, Displays
  description?: string | null;
  quantity_total: number;
  quantity_available: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

// 11. KitItem
export interface KitItem {
  id?: string;
  kit_id: string;
  item_id: string;
  quantity: number;
}

// 12. StockUnit
export interface StockUnit {
  id: string;
  tenant_id: string;
  item_id?: string | null;
  theme_id?: string | null;
  serial_or_unit_code: string;
  status: 'available' | 'reserved' | 'maintenance' | 'retired';
  condition_notes?: string | null;
  created_at: string;
  updated_at: string;
}

// 13. ThemeItem
export interface ThemeItem {
  id: string;
  theme_id: string;
  item_id: string;
  quantity: number;
  required: boolean;
}

// 14. Media (Fotos preservando o original)
export interface Media {
  id: string;
  tenant_id: string;
  entity_type: 'theme' | 'variant' | 'item' | 'banner';
  entity_id: string;
  storage_path: string;
  thumbnail_path?: string | null;
  original_name: string;
  mime_type: string;
  file_size: number;
  fingerprint: string; // Hash SHA-256
  sort_order: number;
  is_primary: boolean;
  ai_tags: string[];
  created_at: string;
}

// 15. Customer
export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  email?: string | null;
  document?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// 16. Rental (Locação / Reserva com datas estritas de retirada e devolução)
export interface Rental {
  id: string;
  tenant_id: string;
  customer_id: string;
  theme_id: string;
  theme_variant_id?: string | null;
  kit_id?: string | null;
  event_date: string; // YYYY-MM-DD
  pickup_date: string; // YYYY-MM-DD
  return_date: string; // YYYY-MM-DD
  status: RentalStatus;
  total: number;
  paid: number;
  balance: number;
  delivery_location?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// 17. RentalLine
export interface RentalLine {
  id: string;
  rental_id: string;
  item_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// 18. Payment
export interface Payment {
  id: string;
  rental_id: string;
  amount: number;
  method: 'pix' | 'dinheiro' | 'cartao' | 'transferencia';
  paid_at: string;
  note?: string | null;
  created_at: string;
}

// 19. CalendarSync (Espelho do Google Calendar)
export interface CalendarSync {
  id: string;
  rental_id: string;
  provider: string; // 'google'
  external_event_id?: string | null;
  sync_status: SyncStatus;
  last_sync_at?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

// 20. Import (Fila de importação)
export interface Import {
  id: string;
  tenant_id: string;
  source_type: 'local_folder' | 'google_drive' | 'whatsapp';
  source_ref: string;
  status: ImportStatus;
  total_files: number;
  processed_files: number;
  error_message?: string | null;
  started_at: string;
  finished_at?: string | null;
}

// 21. ImportAsset
export interface ImportAsset {
  id: string;
  import_id: string;
  source_file: string;
  fingerprint: string;
  status: ImportStatus;
  detected_entity?: string | null;
  confidence?: number | null;
  storage_path?: string | null;
  error_message?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// 22. AIRun (Auditoria de execuções de IA)
export interface AIRun {
  id: string;
  tenant_id: string;
  channel: 'whatsapp' | 'dashboard' | 'api';
  sender_id?: string | null;
  input_text?: string | null;
  model: string;
  status: 'success' | 'clarification_needed' | 'error';
  confidence?: number | null;
  tool_calls: Array<{
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
  }>;
  output_text?: string | null;
  created_at: string;
}

// 23. AuditLog
export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id?: string | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  payload?: Record<string, unknown>;
  created_at: string;
}

// Tipos agregados / Views
export interface ThemeWithDetails extends Theme {
  category?: Category | null;
  variants: ThemeVariant[];
  kits: (Kit & { items?: (KitItem & { item: Item })[] })[];
  items: (ThemeItem & { item: Item })[];
  media: Media[];
  primary_media?: Media | null;
}

export interface RentalWithDetails extends Rental {
  customer?: Customer;
  theme?: Theme;
  theme_variant?: ThemeVariant | null;
  kit?: Kit | null;
  lines: RentalLine[];
  payments: Payment[];
  calendar_sync?: CalendarSync | null;
}
