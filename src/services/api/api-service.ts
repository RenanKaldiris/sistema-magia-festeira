import { store } from '@/lib/store';
import { supabaseAdmin, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Customer, Rental, RentalStatus, Payment, ThemeWithDetails, Orcamento } from '@/types/database';

/**
 * SISTEMA MAGIA FESTEIRA - API SERVICE INTEGRATOR (SUPABASE-FIRST)
 * Orquestra as operações de dados da API RESTful e Webhooks externos (WhatsApp / n8n),
 * conectando diretamente ao Supabase Cloud (PostgreSQL) para leituras e escritas em tempo real,
 * mantendo fallback no Store em memória caso o banco esteja indisponível.
 */

export const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'a0000000-0000-0000-0000-000000000001';

async function safeSupabaseServerOp(operation: () => PromiseLike<unknown>) {
  try {
    await operation();
  } catch (err) {
    console.error('[Supabase Server Op Error]', err);
  }
}

export class ApiService {
  private getClient() {
    if (isSupabaseConfigured && supabase) {
      return supabase;
    }
    if (isSupabaseServerConfigured && supabaseAdmin) {
      return supabaseAdmin;
    }
    return null;
  }

  private formatTheme(t: any, mediaRows: any[] = []): ThemeWithDetails {
    const storeMedia = store.getMediaByEntity('theme', t.id);
    const combinedMedia = mediaRows.length > 0 ? mediaRows : storeMedia;
    const sortedMedia = [...combinedMedia].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
    const primaryMedia = sortedMedia.find((m) => m.is_primary) || sortedMedia[0] || null;
    const primaryUrl = primaryMedia?.storage_path || t.imageUrl || t.image_url || undefined;

    return {
      id: t.id,
      tenant_id: t.tenant_id || DEFAULT_TENANT_ID,
      code: t.code || '',
      name: t.name || '',
      slug: t.slug || (t.name ? t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''),
      category_id: t.category_id || null,
      characters: t.characters || [],
      piece_count: Number(t.piece_count || 0),
      base_price: Number(t.base_price || 0),
      promotional_price: t.promotional_price ? Number(t.promotional_price) : null,
      description: t.description || null,
      notes: t.notes || null,
      status: t.status || 'active',
      stock_quantity: Number(t.stock_quantity || 1),
      featured: Boolean(t.featured),
      imageUrl: primaryUrl,
      created_at: t.created_at || new Date().toISOString(),
      updated_at: t.updated_at || new Date().toISOString(),
      kits: [],
      variants: [],
      items: [],
      media: sortedMedia,
      primary_media: primaryMedia,
    };
  }

  // ============================================================================
  // CLIENTES (CUSTOMERS)
  // ============================================================================

  public async getCustomers(params?: { search?: string; limit?: number; offset?: number }): Promise<{
    total: number;
    items: Customer[];
  }> {
    const client = this.getClient();
    if (client) {
      try {
        let query = client.from('customers').select('*');
        if (params?.search) {
          const s = params.search.trim();
          query = query.or(`name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%,document.ilike.%${s}%`);
        }
        const { data, error } = await query.order('name', { ascending: true });
        if (!error && data) {
          const total = data.length;
          const offset = params?.offset || 0;
          const limit = params?.limit || 50;
          const items = data.slice(offset, offset + limit);
          return { total, items };
        }
      } catch (err) {
        console.error('[ApiService getCustomers Supabase Error]', err);
      }
    }

    const search = params?.search?.trim().toLowerCase();
    let all = store.getCustomers();

    if (search) {
      all = all.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.phone.includes(search) ||
          (c.email && c.email.toLowerCase().includes(search)) ||
          (c.document && c.document.includes(search))
      );
    }

    const total = all.length;
    const offset = params?.offset || 0;
    const limit = params?.limit || 50;
    const items = all.slice(offset, offset + limit);

    return { total, items };
  }

  public async getCustomerByPhone(rawPhone: string): Promise<Customer | null> {
    const clean = rawPhone.replace(/\D/g, '');
    if (!clean) return null;

    const client = this.getClient();
    if (client) {
      try {
        const { data } = await client.from('customers').select('*');
        if (data && data.length > 0) {
          const match = data.find((c: any) => {
            const cClean = (c.phone || '').replace(/\D/g, '');
            if (cClean === clean) return true;
            if (clean.length >= 10 && cClean.endsWith(clean)) return true;
            if (cClean.length >= 10 && clean.endsWith(cClean)) return true;
            return false;
          });
          if (match) return match;
        }
      } catch (err) {
        console.error('[ApiService getCustomerByPhone Supabase Error]', err);
      }
    }

    const customers = store.getCustomers();
    const match = customers.find((c) => {
      const cClean = c.phone.replace(/\D/g, '');
      if (cClean === clean) return true;
      if (clean.length >= 10 && cClean.endsWith(clean)) return true;
      if (cClean.length >= 10 && clean.endsWith(cClean)) return true;
      return false;
    });

    return match || null;
  }

  public async getCustomerByDocument(rawDocument: string): Promise<Customer | null> {
    const clean = rawDocument.replace(/\D/g, '');
    if (!clean || clean.length < 5) return null;

    const client = this.getClient();
    if (client) {
      try {
        const { data } = await client.from('customers').select('*');
        if (data && data.length > 0) {
          const match = data.find((c: any) => {
            const cClean = (c.document || '').replace(/\D/g, '');
            return cClean === clean;
          });
          if (match) return match;
        }
      } catch (err) {
        console.error('[ApiService getCustomerByDocument Supabase Error]', err);
      }
    }

    const customers = store.getCustomers();
    const match = customers.find((c) => {
      const cClean = (c.document || '').replace(/\D/g, '');
      return cClean === clean;
    });

    return match || null;
  }

  public async getCustomerById(id: string): Promise<(Customer & { rentals?: Rental[] }) | null> {
    const client = this.getClient();
    if (client) {
      try {
        const [cRes, rRes] = await Promise.all([
          client.from('customers').select('*').eq('id', id).maybeSingle(),
          client.from('rentals').select('*').eq('customer_id', id),
        ]);
        if (cRes.data) {
          return {
            ...cRes.data,
            rentals: rRes.data || [],
          };
        }
      } catch (err) {
        console.error('[ApiService getCustomerById Supabase Error]', err);
      }
    }

    const customer = store.getCustomerById(id);
    if (!customer) return null;

    const rentals = store.getRentals().filter((r) => r.customer_id === id);
    return {
      ...customer,
      rentals,
    };
  }

  public async upsertCustomer(data: {
    name: string;
    phone: string;
    email?: string | null;
    document?: string | null;
    address?: string | null;
    notes?: string | null;
    upsert?: boolean;
  }): Promise<{ customer: Customer; isNew: boolean }> {
    const cleanPhone = data.phone.trim();
    let existing: Customer | null = null;

    // 1. Busca prioritária por CPF/Documento (se fornecido)
    if (data.document) {
      existing = await this.getCustomerByDocument(data.document);
    }
    // 2. Busca secundária por Telefone
    if (!existing && cleanPhone) {
      existing = await this.getCustomerByPhone(cleanPhone);
    }

    const client = this.getClient();

    if (existing && data.upsert !== false) {
      const updatedData: Partial<Customer> = {
        name: data.name.trim() || existing.name,
        email: data.email !== undefined ? (data.email || existing.email) : existing.email,
        document: data.document !== undefined ? (data.document || existing.document) : existing.document,
        address: data.address !== undefined ? (data.address || existing.address) : existing.address,
        notes: data.notes !== undefined ? (data.notes || existing.notes) : existing.notes,
        updated_at: new Date().toISOString(),
      };

      if (client) {
        await safeSupabaseServerOp(() =>
          client.from('customers').update(updatedData).eq('id', existing.id)
        );
      }

      const updated = store.updateCustomer(existing.id, updatedData);
      return { customer: { ...existing, ...updatedData, ...updated }, isNew: false };
    }

    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      tenant_id: DEFAULT_TENANT_ID,
      name: data.name.trim(),
      phone: cleanPhone,
      email: data.email || null,
      document: data.document || null,
      address: data.address || null,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (client) {
      await safeSupabaseServerOp(() => client.from('customers').insert(newCustomer));
    }

    store.createCustomer(newCustomer, true);
    return { customer: newCustomer, isNew: true };
  }

  public async updateCustomer(
    id: string,
    updates: Partial<Omit<Customer, 'id' | 'tenant_id' | 'created_at'>>
  ): Promise<Customer | null> {
    const client = this.getClient();
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (client) {
      await safeSupabaseServerOp(() =>
        client.from('customers').update(updatedData).eq('id', id)
      );
    }

    const updated = store.updateCustomer(id, updatedData);
    if (!updated) {
      const existing = await this.getCustomerById(id);
      if (existing) {
        return { ...existing, ...updatedData };
      }
      return null;
    }
    return updated;
  }

  public async deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (client) {
      const { data: rentals } = await client.from('rentals').select('id').eq('customer_id', id);
      if (rentals && rentals.length > 0) {
        return {
          success: false,
          error: `Não é possível excluir o cliente pois ele possui ${rentals.length} locação(ões) vinculada(s).`,
        };
      }
      await safeSupabaseServerOp(() => client.from('customers').delete().eq('id', id));
    }

    const deleted = store.deleteCustomer(id);
    return { success: deleted || true };
  }

  // ============================================================================
  // TEMAS & DISPONIBILIDADE (THEMES & AVAILABILITY - SUPABASE DIRECT)
  // ============================================================================

  public async getThemes(filters?: { search?: string; categoryId?: string }): Promise<ThemeWithDetails[]> {
    const client = this.getClient();
    if (client) {
      try {
        let query = client.from('themes').select('*').eq('status', 'active');
        if (filters?.categoryId) {
          query = query.eq('category_id', filters.categoryId);
        }
        if (filters?.search) {
          const s = filters.search.trim();
          const sHyphen = s.replace(/\s+/g, '-');
          const sSpace = s.replace(/[-_]+/g, ' ');
          if (sHyphen !== s || sSpace !== s) {
            query = query.or(`name.ilike.%${s}%,name.ilike.%${sHyphen}%,name.ilike.%${sSpace}%`);
          } else {
            query = query.ilike('name', `%${s}%`);
          }
        }
        const { data, error } = await query.order('name', { ascending: true });
        if (!error && data && data.length > 0) {
          const themeIds = data.map((t: any) => t.id);
          const { data: allMedia } = await client
            .from('media')
            .select('*')
            .eq('entity_type', 'theme')
            .in('entity_id', themeIds);

          const mediaMap = new Map<string, any[]>();
          (allMedia || []).forEach((m: any) => {
            const list = mediaMap.get(m.entity_id) || [];
            list.push(m);
            mediaMap.set(m.entity_id, list);
          });

          return data.map((t: any) => this.formatTheme(t, mediaMap.get(t.id) || []));
        }
      } catch (err) {
        console.error('[ApiService getThemes Supabase Error]', err);
      }
    }
    return store.getThemes(filters);
  }

  public async resolveTheme(themeIdOrQuery: string): Promise<ThemeWithDetails | null> {
    if (!themeIdOrQuery) return null;
    const trimmed = themeIdOrQuery.trim();
    const client = this.getClient();

    if (client) {
      try {
        let rawTheme: any = null;

        // 1. Por ID (UUID)
        if (trimmed.length > 20) {
          const { data: byId } = await client.from('themes').select('*').eq('id', trimmed).maybeSingle();
          if (byId) rawTheme = byId;
        }

        // 2. Por código (ex: MF-0136)
        if (!rawTheme) {
          const { data: byCode } = await client.from('themes').select('*').ilike('code', trimmed).limit(1);
          if (byCode && byCode.length > 0) rawTheme = byCode[0];
        }

        // 3. Por slug
        if (!rawTheme) {
          const { data: bySlug } = await client.from('themes').select('*').ilike('slug', trimmed).limit(1);
          if (bySlug && bySlug.length > 0) rawTheme = bySlug[0];
        }

        // 4. Por busca no nome (parcial e flexível com tolerância a espaços e hífens)
        if (!rawTheme) {
          const altHyphen = trimmed.replace(/\s+/g, '-');
          const altSpace = trimmed.replace(/-/g, ' ');
          const { data: byName } = await client
            .from('themes')
            .select('*')
            .or(`name.ilike.%${trimmed}%,name.ilike.%${altHyphen}%,name.ilike.%${altSpace}%`)
            .limit(1);
          if (byName && byName.length > 0) rawTheme = byName[0];
        }

        if (rawTheme) {
          const { data: mediaRows } = await client
            .from('media')
            .select('*')
            .eq('entity_type', 'theme')
            .eq('entity_id', rawTheme.id)
            .order('is_primary', { ascending: false })
            .order('sort_order', { ascending: true });

          return this.formatTheme(rawTheme, mediaRows || []);
        }
      } catch (err) {
        console.error('[ApiService resolveTheme Supabase Error]', err);
      }
    }

    // Fallback store
    const byId = store.getThemeById(trimmed);
    if (byId) return byId;
    const bySlug = store.getThemeBySlug(trimmed);
    if (bySlug) return bySlug;
    const themes = store.getThemes({ search: trimmed });
    if (themes.length > 0) return themes[0];

    return null;
  }

  public async resolveThemeOrCreate(
    themeIdOrQuery: string,
    defaultPrice?: number
  ): Promise<ThemeWithDetails> {
    const existing = await this.resolveTheme(themeIdOrQuery);
    if (existing) return existing;

    const trimmed = (themeIdOrQuery || '').trim();
    const cleanName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    const slug = cleanName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const code = `MF-AUTO-${Math.floor(1000 + Math.random() * 9000)}`;
    const newId = crypto.randomUUID();
    const price = typeof defaultPrice === 'number' && defaultPrice > 0 ? defaultPrice : 179.9;

    const newThemeObj = {
      id: newId,
      tenant_id: DEFAULT_TENANT_ID,
      code,
      name: cleanName,
      slug: slug || `tema-${Date.now()}`,
      characters: [cleanName],
      piece_count: 1,
      base_price: price,
      status: 'active' as const,
      stock_quantity: 1,
      featured: false,
      description: 'Tema cadastrado automaticamente a partir de locação/reserva.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const client = this.getClient();
    if (client) {
      await safeSupabaseServerOp(() => client.from('themes').insert(newThemeObj));
    }

    try {
      store.createTheme(newThemeObj, true);
    } catch (e) {
      // fallback caso já exista localmente
    }

    return this.formatTheme(newThemeObj);
  }

  public async checkAvailability(
    themeIdOrQuery: string,
    pickupDate: string,
    returnDate: string,
    requestedQuantity = 1
  ) {
    const theme = await this.resolveTheme(themeIdOrQuery);
    if (!theme) {
      return {
        found: false,
        error: `Tema "${themeIdOrQuery}" não encontrado no catálogo.`,
      };
    }

    const client = this.getClient();
    let conflictingRentals: any[] = [];

    if (client) {
      try {
        const { data: rentals } = await client
          .from('rentals')
          .select('*')
          .eq('theme_id', theme.id)
          .in('status', ['reservado', 'alugado']);

        if (rentals) {
          conflictingRentals = rentals.filter((r: any) => {
            const p = r.pickup_date || r.event_date;
            const ret = r.return_date || r.event_date;
            return !(returnDate < p || pickupDate > ret);
          });
        }
      } catch (err) {
        console.error('[ApiService checkAvailability Supabase Error]', err);
      }
    } else {
      const localCheck = store.checkStockAvailability(theme.id, pickupDate, returnDate, requestedQuantity);
      conflictingRentals = localCheck.conflictingRentals;
    }

    const totalStock = theme.stock_quantity || 1;
    const committed = conflictingRentals.length;
    const availableStock = Math.max(0, totalStock - committed);
    const isAvailable = availableStock >= requestedQuantity;

    return {
      found: true,
      available: isAvailable,
      theme: {
        id: theme.id,
        code: theme.code,
        name: theme.name,
        base_price: theme.base_price,
        stock_quantity: totalStock,
      },
      stockTotal: totalStock,
      stockCommitted: committed,
      stockAvailable: availableStock,
      requestedQuantity,
      interval: {
        pickup: pickupDate,
        return: returnDate,
      },
      conflictingRentals,
    };
  }

  // ============================================================================
  // PEDIDOS & LOCAÇÕES (RENTALS / ORDERS)
  // ============================================================================

  public async getRentals(filters?: {
    status?: RentalStatus;
    customerId?: string;
    themeId?: string;
    date?: string;
    pickupDate?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const client = this.getClient();
    if (client) {
      try {
        let query = client.from('rentals').select(`
          *,
          customer:customer_id(id, name, phone),
          theme:theme_id(id, name, code, base_price)
        `);

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.customerId) query = query.eq('customer_id', filters.customerId);
        if (filters?.themeId) query = query.eq('theme_id', filters.themeId);
        if (filters?.pickupDate) query = query.eq('pickup_date', filters.pickupDate);
        if (filters?.startDate && filters?.endDate) {
          query = query.gte('event_date', filters.startDate).lte('event_date', filters.endDate);
        } else if (filters?.startDate) {
          query = query.gte('event_date', filters.startDate);
        } else if (filters?.endDate) {
          query = query.lte('event_date', filters.endDate);
        }

        const { data, error } = await query.order('event_date', { ascending: false });
        if (!error && data) {
          const total = data.length;
          const offset = filters?.offset || 0;
          const limit = filters?.limit || 50;
          const items = data.slice(offset, offset + limit).map((r: any) => ({
            ...r,
            customer_name: r.customer?.name || null,
            customer_phone: r.customer?.phone || null,
            theme_name: r.theme?.name || null,
            theme_code: r.theme?.code || null,
          }));
          return { total, items };
        }
      } catch (err) {
        console.error('[ApiService getRentals Supabase Error]', err);
      }
    }

    // Fallback store
    let all = store.getRentals();
    if (filters?.status) all = all.filter((r) => r.status === filters.status);
    if (filters?.customerId) all = all.filter((r) => r.customer_id === filters.customerId);
    if (filters?.themeId) all = all.filter((r) => r.theme_id === filters.themeId);
    if (filters?.date) all = all.filter((r) => r.pickup_date <= filters.date! && r.return_date >= filters.date!);
    if (filters?.pickupDate) all = all.filter((r) => r.pickup_date === filters.pickupDate);
    if (filters?.startDate && filters?.endDate) {
      const s = filters.startDate;
      const e = filters.endDate;
      all = all.filter(
        (r) =>
          (r.event_date >= s && r.event_date <= e) ||
          (r.pickup_date <= e && r.return_date >= s)
      );
    } else if (filters?.startDate) {
      all = all.filter((r) => r.event_date >= filters.startDate! || r.return_date >= filters.startDate!);
    } else if (filters?.endDate) {
      all = all.filter((r) => r.event_date <= filters.endDate! || r.pickup_date <= filters.endDate!);
    }

    const total = all.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    const items = all.slice(offset, offset + limit);

    return { total, items };
  }

  public async getRentalById(id: string) {
    const client = this.getClient();
    if (client) {
      try {
        const { data } = await client
          .from('rentals')
          .select(`
            *,
            customer:customer_id(*),
            theme:theme_id(*),
            payments(*)
          `)
          .eq('id', id)
          .maybeSingle();

        if (data) return data;
      } catch (err) {
        console.error('[ApiService getRentalById Supabase Error]', err);
      }
    }
    const rentals = store.getRentals();
    return rentals.find((r) => r.id === id) || null;
  }

  public async createRental(data: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerDocument?: string;
    customerAddress?: string;

    themeId?: string;
    themeQuery?: string;
    themeVariantId?: string | null;
    kitId?: string | null;

    eventDate: string;
    pickupDate: string;
    returnDate: string;

    status?: RentalStatus;

    total: number;
    paid?: number;
    paymentMethod?: Payment['method'];

    deliveryLocation?: string | null;
    notes?: string | null;
    forceOverride?: boolean;

    // Campos extras do formulário/mensagem
    eventName?: string;
    startTime?: string;
    endTime?: string;
    paymentTerms?: string;
    extraItems?: string;
  }): Promise<{
    success: boolean;
    rental?: Rental;
    customer?: Customer;
    error?: string;
    conflict?: unknown;
    orderNumber?: string;
    displayId?: string;
  }> {
    // Detecção inteligente de status histórico:
    // Se data do evento for anterior a 01/10/2026, ou notas/termos contiverem indicação de histórico/passado, ou solicitado explicitamente
    const isHistoricalByDate = Boolean(data.eventDate && data.eventDate < '2026-10-01');
    const isHistoricalByText = Boolean(
      (data.notes && /hist[oó]rico|passad[oa]|legado/i.test(data.notes)) ||
      (data.paymentTerms && /hist[oó]rico|passad[oa]|legado/i.test(data.paymentTerms)) ||
      (data.eventName && /hist[oó]rico|passad[oa]|legado/i.test(data.eventName))
    );
    const isHistorical = data.status === 'historico' || isHistoricalByDate || isHistoricalByText;
    const resolvedStatus: RentalStatus = isHistorical ? 'historico' : (data.status || 'reservado');

    // 1. Resolver ou criar cliente
    let customerId = data.customerId;
    let customer: Customer | undefined;

    if (!customerId) {
      if (!data.customerName || !data.customerPhone) {
        return {
          success: false,
          error: 'É obrigatório informar "customerId" ou o par "customerName" e "customerPhone".',
        };
      }

      const upsertRes = await this.upsertCustomer({
        name: data.customerName,
        phone: data.customerPhone,
        email: data.customerEmail,
        document: data.customerDocument,
        address: data.customerAddress || data.deliveryLocation,
        notes: isHistorical
          ? 'Cliente histórico / importado via WhatsApp / API'
          : 'Cadastrado/atualizado via Assessor WhatsApp / API',
      });
      customer = upsertRes.customer;
      customerId = customer.id;
    } else {
      customer = (await this.getCustomerById(customerId)) || undefined;
      if (!customer) {
        return { success: false, error: `Cliente com ID ${customerId} não encontrado.` };
      }
      // Atualiza documento ou endereço se fornecido
      if (data.customerDocument || data.customerAddress) {
        await this.updateCustomer(customerId, {
          ...(data.customerDocument ? { document: data.customerDocument } : {}),
          ...(data.customerAddress ? { address: data.customerAddress } : {}),
        });
      }
    }

    // 2. Resolver ou Auto-Criar Tema no Supabase (nunca bloqueia reserva)
    const themeIdentifier = data.themeId || data.themeQuery;
    if (!themeIdentifier) {
      return { success: false, error: 'É obrigatório informar "themeId" ou "themeQuery".' };
    }

    let theme = await this.resolveTheme(themeIdentifier);
    if (!theme) {
      theme = await this.resolveThemeOrCreate(themeIdentifier, data.total);
    }

    // 3. Validação de Disponibilidade no Supabase (não bloqueia para históricos ou forceOverride)
    if (data.forceOverride !== true && !isHistorical) {
      const avail = await this.checkAvailability(theme.id, data.pickupDate, data.returnDate, 1);
      if (!avail.available) {
        return {
          success: false,
          error: `O tema "${theme.name}" já está reservado no período de ${data.pickupDate} a ${data.returnDate}.`,
          conflict: avail,
        };
      }
    }

    const paidAmount = data.paid || 0;
    const balanceAmount = Math.max(0, data.total - paidAmount);
    const newRentalId = crypto.randomUUID();

    // Calcular número sequencial de pedido (ex: 0001, 0002)
    let orderNumber = '0001';
    const clientDb = this.getClient();
    if (clientDb) {
      try {
        const { count } = await clientDb.from('rentals').select('*', { count: 'exact', head: true });
        orderNumber = String((count || 0) + 1).padStart(4, '0');
      } catch (e) {
        orderNumber = String(store.getRentals().length + 1).padStart(4, '0');
      }
    } else {
      orderNumber = String(store.getRentals().length + 1).padStart(4, '0');
    }

    // Formatação de observações ricas com todos os dados do formulário/mensagem
    const notesParts: string[] = [];
    notesParts.push(`📋 Pedido: #${orderNumber}`);
    if (data.eventName) notesParts.push(`🎉 Evento: ${data.eventName}`);
    if (data.startTime || data.endTime) {
      notesParts.push(`⏰ Horário: ${[data.startTime, data.endTime].filter(Boolean).join(' às ')}`);
    }
    if (data.paymentTerms) notesParts.push(`💳 Condição de Pagamento: ${data.paymentTerms}`);
    if (data.customerAddress && data.deliveryLocation && data.customerAddress !== data.deliveryLocation) {
      notesParts.push(`🏠 Endereço Residencial: ${data.customerAddress}`);
    }
    if (data.extraItems) notesParts.push(`📦 Itens Extras / Opcionais: ${data.extraItems}`);
    if (data.notes) notesParts.push(`📝 Observações: ${data.notes}`);

    const formattedNotes = notesParts.length > 0 ? notesParts.join('\n') : (data.notes || null);

    const rental: Rental = {
      id: newRentalId,
      tenant_id: DEFAULT_TENANT_ID,
      customer_id: customerId,
      theme_id: theme.id,
      theme_variant_id: data.themeVariantId || null,
      kit_id: data.kitId || null,
      event_date: data.eventDate,
      pickup_date: data.pickupDate,
      return_date: data.returnDate,
      status: resolvedStatus,
      total: data.total,
      paid: paidAmount,
      balance: balanceAmount,
      delivery_location: data.deliveryLocation || customer.address || null,
      notes: formattedNotes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 4. Inserção no Supabase Cloud
    if (clientDb) {
      await safeSupabaseServerOp(() => clientDb.from('rentals').insert(rental));

      if (paidAmount > 0) {
        const paymentId = crypto.randomUUID();
        await safeSupabaseServerOp(() =>
          clientDb.from('payments').insert({
            id: paymentId,
            rental_id: rental.id,
            amount: paidAmount,
            method: data.paymentMethod || 'pix',
            note: isHistorical
              ? 'Pagamento registrado para histórico'
              : 'Sinal / Pagamento inicial registrado via API WhatsApp',
            paid_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          })
        );
      }
    }

    // Manter sincronizado no Store local (com skipSupabase=true para evitar duplicação)
    try {
      store.createRental(rental, true, true);
      if (paidAmount > 0) {
        store.recordPayment(rental.id, paidAmount, data.paymentMethod || 'pix', 'Sinal inicial');
      }
    } catch (storeErr) {
      console.warn('[ApiService Store Sync Warning]', storeErr);
    }

    return {
      success: true,
      rental,
      customer,
      orderNumber,
      displayId: `#${orderNumber}`,
    };
  }

  public async updateRental(
    id: string,
    updates: {
      status?: RentalStatus;
      notes?: string;
      pickup_date?: string;
      return_date?: string;
      event_date?: string;
      delivery_location?: string;
      total?: number;
    }
  ) {
    const client = this.getClient();
    if (client) {
      await safeSupabaseServerOp(() =>
        client
          .from('rentals')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
      );
    }
    return store.updateRental(id, updates);
  }

  public async recordPayment(
    rentalId: string,
    amount: number,
    method: Payment['method'],
    note?: string,
    status: 'efetivado' | 'pendente' = 'efetivado',
    paidAt?: string
  ): Promise<{ success: boolean; payment?: Payment; rental?: Rental; error?: string }> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();
      const paymentDate = paidAt || now;

      if (client) {
        // Deduplicação inteligente de sinal no Supabase
        const isSignal = (note || '').toLowerCase().includes('sinal') || (note || '').toLowerCase().includes('api');
        const { data: existingPayments } = await client
          .from('payments')
          .select('*')
          .eq('rental_id', rentalId);

        const dup = (existingPayments || []).find((p: any) => {
          if (Math.abs(Number(p.amount) - Number(amount)) > 0.001) return false;
          const pNote = (p.note || '').toLowerCase();
          if (isSignal && (pNote.includes('sinal') || pNote.includes('api') || pNote.includes('reserva') || pNote.includes('whatsapp'))) {
            return true;
          }
          const pTime = new Date(p.created_at || p.paid_at).getTime();
          return !isNaN(pTime) && Math.abs(Date.now() - pTime) < 15 * 60 * 1000;
        });

        if (dup) {
          // Já existe sinal registrado: não duplica!
          const storePayment = store.recordPayment(rentalId, amount, method, note, status, paymentDate);
          const rental = store.getRentals().find((r) => r.id === rentalId);
          return { success: true, payment: storePayment, rental };
        }

        const paymentId = crypto.randomUUID();
        const payment: Payment = {
          id: paymentId,
          rental_id: rentalId,
          amount,
          method,
          note: note || null,
          status,
          paid_at: paymentDate,
          created_at: now,
        };

        await safeSupabaseServerOp(() => client.from('payments').insert(payment));

        // Atualizar saldo da locação no banco
        const { data: currentRental } = await client.from('rentals').select('paid, total').eq('id', rentalId).maybeSingle();
        if (currentRental && status === 'efetivado') {
          const newPaid = Number(currentRental.paid || 0) + amount;
          const newBalance = Math.max(0, Number(currentRental.total || 0) - newPaid);
          await safeSupabaseServerOp(() =>
            client.from('rentals').update({ paid: newPaid, balance: newBalance, updated_at: now }).eq('id', rentalId)
          );
        }
      }

      const payment = store.recordPayment(rentalId, amount, method, note, status, paymentDate);
      const rental = store.getRentals().find((r) => r.id === rentalId);

      return { success: true, payment, rental };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }

  public async updatePayment(
    paymentId: string,
    updates: {
      amount?: number;
      method?: Payment['method'];
      note?: string | null;
      paid_at?: string;
      status?: 'efetivado' | 'pendente';
    }
  ): Promise<{ success: boolean; payment?: Payment; rental?: Rental; error?: string }> {
    try {
      const client = this.getClient();
      if (client) {
        await safeSupabaseServerOp(() =>
          client
            .from('payments')
            .update({
              ...(updates.amount !== undefined ? { amount: updates.amount } : {}),
              ...(updates.method !== undefined ? { method: updates.method } : {}),
              ...(updates.note !== undefined ? { note: updates.note } : {}),
              ...(updates.paid_at !== undefined ? { paid_at: updates.paid_at } : {}),
            })
            .eq('id', paymentId)
        );
      }

      return store.updatePayment(paymentId, updates);
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }

  public async deletePayment(
    paymentId: string
  ): Promise<{ success: boolean; rental?: Rental; error?: string }> {
    try {
      const client = this.getClient();
      if (client) {
        await safeSupabaseServerOp(() =>
          client.from('payments').delete().eq('id', paymentId)
        );
      }

      return store.deletePayment(paymentId);
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }

  // ============================================================================
  // ORÇAMENTOS (BUDGETS)
  // ============================================================================

  public getOrcamentos(): Orcamento[] {
    return store.getOrcamentos();
  }

  public createOrcamento(data: Parameters<typeof store.createOrcamento>[0]): Orcamento {
    return store.createOrcamento(data);
  }

  // ============================================================================
  // RELATÓRIOS & MÉTRICAS (REPORTS & ASSESSOR SUMMARY - SUPABASE DIRECT)
  // ============================================================================

  public async getReportsSummary(params?: {
    period?: 'next_weekend' | 'last_month' | 'current_month' | 'themes' | 'custom';
    startDate?: string;
    endDate?: string;
    referenceDate?: string;
  }) {
    const period = params?.period || 'current_month';
    const client = this.getClient();

    // 1. Relatório de Temas / Disponibilidade
    if (period === 'themes') {
      let allThemes: any[] = [];
      let activeRentals: any[] = [];
      let debugError: any = null;

      if (client) {
        try {
          const tRes = await client
            .from('themes')
            .select('id, name, code, base_price, stock_quantity, status');

          if (tRes.error) {
            debugError = tRes.error;
          } else if (tRes.data && tRes.data.length > 0) {
            allThemes = tRes.data;
          }
        } catch (err: any) {
          debugError = err.message;
        }

        try {
          const rRes = await client
            .from('rentals')
            .select('id, theme_id, status, event_date')
            .in('status', ['reservado', 'alugado']);

          if (rRes.data) {
            activeRentals = rRes.data;
          }
        } catch (err) {
          console.error('[ApiService getReportsSummary rentals Supabase Error]', err);
        }
      }

      const usedStore = allThemes.length === 0;
      if (allThemes.length === 0) {
        allThemes = store.getThemes();
        activeRentals = store.getRentals().filter((r) => r.status === 'reservado' || r.status === 'alugado');
      }

      const bookedThemeIds = new Set(activeRentals.map((r) => r.theme_id));
      const availableThemes = allThemes.filter((t) => !bookedThemeIds.has(t.id));

      const sortedNames = allThemes
        .map((t) => t.name)
        .filter(Boolean)
        .sort((a: string, b: string) => a.localeCompare('pt-BR'));

      return {
        period: 'themes',
        totalThemes: allThemes.length,
        availableThemesCount: availableThemes.length,
        bookedThemesCount: bookedThemeIds.size,
        availableThemes: availableThemes.slice(0, 30).map((t) => ({
          id: t.id,
          code: t.code,
          name: t.name,
          base_price: Number(t.base_price || 0),
          stock_quantity: Number(t.stock_quantity || 1),
        })),
        allThemeNames: sortedNames,
        allThemesListText: sortedNames.map((n, i) => `${i + 1}. ${n}`).join('\n'),
        summaryText: `Temos ${allThemes.length} temas cadastrados no acervo da Magia Festeira, sendo ${availableThemes.length} atualmente livres para locação.`,
      };
    }

    const refDate = params?.referenceDate ? new Date(params.referenceDate) : new Date();
    const toISODate = (d: Date) => d.toISOString().split('T')[0];

    let startDate = params?.startDate || '';
    let endDate = params?.endDate || '';
    let periodTitle = '';

    if (period === 'next_weekend') {
      const currentDay = refDate.getDay(); // 0 = Domingo, 6 = Sábado
      const daysUntilSaturday = currentDay === 6 ? 7 : (6 - currentDay + 7) % 7 || 7;
      const saturday = new Date(refDate);
      saturday.setDate(refDate.getDate() + (currentDay === 5 || currentDay === 6 || currentDay === 0 ? (currentDay === 5 ? 1 : currentDay === 6 ? 0 : -1) : daysUntilSaturday));
      
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);

      startDate = toISODate(saturday);
      endDate = toISODate(sunday);
      periodTitle = `Próximo Final de Semana (${startDate.split('-').reverse().slice(0,2).join('/')} a ${endDate.split('-').reverse().slice(0,2).join('/')})`;
    } else if (period === 'last_month') {
      const year = refDate.getMonth() === 0 ? refDate.getFullYear() - 1 : refDate.getFullYear();
      const month = refDate.getMonth() === 0 ? 11 : refDate.getMonth() - 1;
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      startDate = toISODate(firstDay);
      endDate = toISODate(lastDay);
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      periodTitle = `Mês Passado (${monthNames[month]}/${year})`;
    } else if (period === 'current_month') {
      const year = refDate.getFullYear();
      const month = refDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      startDate = toISODate(firstDay);
      endDate = toISODate(lastDay);
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      periodTitle = `Mês Atual (${monthNames[month]}/${year})`;
    } else {
      periodTitle = `Período Personalizado (${startDate} a ${endDate})`;
    }

    let filteredRentals: any[] = [];

    if (client) {
      try {
        const { data: rentals } = await client
          .from('rentals')
          .select(`
            *,
            customer:customer_id(id, name, phone),
            theme:theme_id(id, name, code, base_price)
          `)
          .gte('event_date', startDate)
          .lte('event_date', endDate)
          .order('event_date', { ascending: true });

        if (rentals) {
          filteredRentals = rentals;
        }
      } catch (err) {
        console.error('[ApiService getReportsSummary rentals Supabase Error]', err);
      }
    }

    if (filteredRentals.length === 0) {
      const allRentals = store.getRentals();
      filteredRentals = allRentals.filter((r) => {
        const ev = r.event_date || r.pickup_date;
        return (ev >= startDate && ev <= endDate) || (r.pickup_date <= endDate && r.return_date >= startDate);
      });
    }

    const totalCount = filteredRentals.length;
    const totalRevenue = filteredRentals.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const totalPaid = filteredRentals.reduce((sum, r) => sum + (Number(r.paid) || 0), 0);
    const totalPending = Math.max(0, totalRevenue - totalPaid);

    return {
      period,
      periodTitle,
      startDate,
      endDate,
      totalRentals: totalCount,
      totalRevenue,
      totalPaid,
      totalPending,
      rentals: filteredRentals.map((r: any) => ({
        id: r.id,
        customerName: r.customer?.name || r.customer_name || 'Cliente',
        customerPhone: r.customer?.phone || '',
        themeName: r.theme?.name || r.theme_name || 'Tema',
        themeCode: r.theme?.code || '',
        eventDate: r.event_date,
        status: r.status,
        total: Number(r.total || 0),
        paid: Number(r.paid || 0),
        balance: Number(r.balance || (r.total - r.paid) || 0),
      })),
      summaryText: `No período ${periodTitle}, foram registradas ${totalCount} locações, somando R$ ${totalRevenue.toFixed(2)} em faturamento (R$ ${totalPaid.toFixed(2)} recebidos, R$ ${totalPending.toFixed(2)} pendentes).`,
    };
  }
}

export const apiService = new ApiService();
