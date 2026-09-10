import { store } from '@/lib/store';
import { supabaseAdmin, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { Customer, Rental, RentalStatus, Payment, ThemeWithDetails, Orcamento } from '@/types/database';

/**
 * SISTEMA MAGIA FESTEIRA - API SERVICE INTEGRATOR
 * Orquestra as operações de dados da API RESTful e Webhooks externos,
 * garantindo consistência entre o Supabase Cloud, PostgreSQL e o Store operacional.
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
  private getAdminClient() {
    if (isSupabaseServerConfigured && supabaseAdmin) {
      return supabaseAdmin;
    }
    return null;
  }

  // ============================================================================
  // CLIENTES (CUSTOMERS)
  // ============================================================================

  public async getCustomers(params?: { search?: string; limit?: number; offset?: number }): Promise<{
    total: number;
    items: Customer[];
  }> {
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

    const customers = store.getCustomers();

    // 1. Procura exata com ou sem DDI 55
    const match = customers.find((c) => {
      const cClean = c.phone.replace(/\D/g, '');
      if (cClean === clean) return true;
      if (clean.length >= 10 && cClean.endsWith(clean)) return true;
      if (cClean.length >= 10 && clean.endsWith(cClean)) return true;
      return false;
    });

    return match || null;
  }

  public async getCustomerById(id: string): Promise<(Customer & { rentals?: Rental[] }) | null> {
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
    const existing = await this.getCustomerByPhone(cleanPhone);

    if (existing && data.upsert !== false) {
      // Atualizar dados do cliente existente se novos campos foram informados
      const updated = store.updateCustomer(existing.id, {
        name: data.name.trim() || existing.name,
        email: data.email !== undefined ? data.email : existing.email,
        document: data.document !== undefined ? data.document : existing.document,
        address: data.address !== undefined ? data.address : existing.address,
        notes: data.notes !== undefined ? data.notes : existing.notes,
      });

      // Garantir atualização no Supabase Server se configurado
      const admin = this.getAdminClient();
      if (admin) {
        await safeSupabaseServerOp(() =>
          admin
            .from('customers')
            .update({
              name: updated.name,
              email: updated.email,
              document: updated.document,
              address: updated.address,
              notes: updated.notes,
              updated_at: new Date().toISOString(),
            })
            .eq('id', updated.id)
        );
      }

      return { customer: updated, isNew: false };
    }

    // Criar novo cliente
    const newCustomer = store.createCustomer({
      name: data.name.trim(),
      phone: cleanPhone,
      email: data.email || null,
      document: data.document || null,
      address: data.address || null,
      notes: data.notes || null,
    });

    // Salvar diretamente com service_role se disponível no servidor
    const admin = this.getAdminClient();
    if (admin) {
      await safeSupabaseServerOp(() =>
        admin.from('customers').upsert({
          id: newCustomer.id,
          tenant_id: DEFAULT_TENANT_ID,
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email,
          document: newCustomer.document,
          address: newCustomer.address,
          notes: newCustomer.notes,
          created_at: newCustomer.created_at,
          updated_at: newCustomer.updated_at,
        })
      );
    }

    return { customer: newCustomer, isNew: true };
  }

  public async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    try {
      const updated = store.updateCustomer(id, updates);
      const admin = this.getAdminClient();
      if (admin) {
        await safeSupabaseServerOp(() =>
          admin
            .from('customers')
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
        );
      }
      return updated;
    } catch {
      return null;
    }
  }

  public async deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
    const rentals = store.getRentals().filter((r) => r.customer_id === id);
    if (rentals.length > 0) {
      return {
        success: false,
        error: `Não é possível excluir o cliente pois ele possui ${rentals.length} locação(ões) vinculada(s).`,
      };
    }

    const deleted = store.deleteCustomer(id);
    const admin = this.getAdminClient();
    if (deleted && admin) {
      await safeSupabaseServerOp(() =>
        admin.from('customers').delete().eq('id', id)
      );
    }

    return { success: deleted };
  }

  // ============================================================================
  // TEMAS & DISPONIBILIDADE (THEMES & AVAILABILITY)
  // ============================================================================

  public resolveTheme(themeIdOrQuery: string): ThemeWithDetails | null {
    if (!themeIdOrQuery) return null;
    const trimmed = themeIdOrQuery.trim();

    // 1. Por ID
    const byId = store.getThemeById(trimmed);
    if (byId) return byId;

    // 2. Por código (ex: MF-0127) ou Slug
    const bySlug = store.getThemeBySlug(trimmed);
    if (bySlug) return bySlug;

    // 3. Por busca no catálogo
    const themes = store.getThemes({ search: trimmed });
    if (themes.length > 0) {
      return themes[0];
    }

    return null;
  }

  public checkAvailability(
    themeIdOrQuery: string,
    pickupDate: string,
    returnDate: string,
    requestedQuantity = 1
  ) {
    const theme = this.resolveTheme(themeIdOrQuery);
    if (!theme) {
      return {
        found: false,
        error: `Tema "${themeIdOrQuery}" não encontrado no catálogo.`,
      };
    }

    const result = store.checkStockAvailability(theme.id, pickupDate, returnDate, requestedQuantity);
    return {
      found: true,
      theme: {
        id: theme.id,
        code: theme.code,
        name: theme.name,
        base_price: theme.base_price,
        stock_quantity: theme.stock_quantity,
      },
      ...result,
    };
  }

  public getThemes(filters?: { search?: string; categoryId?: string }) {
    return store.getThemes(filters);
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
    limit?: number;
    offset?: number;
  }) {
    let all = store.getRentals();

    if (filters?.status) {
      all = all.filter((r) => r.status === filters.status);
    }
    if (filters?.customerId) {
      all = all.filter((r) => r.customer_id === filters.customerId);
    }
    if (filters?.themeId) {
      all = all.filter((r) => r.theme_id === filters.themeId);
    }
    if (filters?.date) {
      all = all.filter((r) => r.pickup_date <= filters.date! && r.return_date >= filters.date!);
    }
    if (filters?.pickupDate) {
      all = all.filter((r) => r.pickup_date === filters.pickupDate);
    }

    const total = all.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    const items = all.slice(offset, offset + limit);

    return { total, items };
  }

  public getRentalById(id: string) {
    const rentals = store.getRentals();
    return rentals.find((r) => r.id === id) || null;
  }

  public async createRental(data: {
    // Cliente (ID ou dados diretos para criação instantânea)
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerAddress?: string;

    // Tema & Composição
    themeId?: string;
    themeQuery?: string; // ex: "Vingadores" ou "MF-0127"
    themeVariantId?: string | null;
    kitId?: string | null;

    // Datas
    eventDate: string; // YYYY-MM-DD
    pickupDate: string; // YYYY-MM-DD
    returnDate: string; // YYYY-MM-DD

    // Valores
    total: number;
    paid?: number;
    paymentMethod?: Payment['method'];

    // Detalhes operacionais
    deliveryLocation?: string | null;
    notes?: string | null;
    forceOverride?: boolean;
  }): Promise<{
    success: boolean;
    rental?: Rental;
    customer?: Customer;
    error?: string;
    conflict?: unknown;
  }> {
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
        address: data.deliveryLocation || data.customerAddress,
        notes: 'Cadastrado automaticamente via API / Pedido',
      });
      customer = upsertRes.customer;
      customerId = customer.id;
    } else {
      customer = store.getCustomerById(customerId);
      if (!customer) {
        return { success: false, error: `Cliente com ID ${customerId} não encontrado.` };
      }
    }

    // 2. Resolver Tema
    const themeIdentifier = data.themeId || data.themeQuery;
    if (!themeIdentifier) {
      return { success: false, error: 'É obrigatório informar "themeId" ou "themeQuery".' };
    }

    const theme = this.resolveTheme(themeIdentifier);
    if (!theme) {
      return { success: false, error: `Tema "${themeIdentifier}" não localizado no catálogo.` };
    }

    const paidAmount = data.paid || 0;
    const balanceAmount = Math.max(0, data.total - paidAmount);

    // 3. Criar locação com validação de conflito de datas/estoque
    const result = store.createRental(
      {
        tenant_id: DEFAULT_TENANT_ID,
        customer_id: customerId,
        theme_id: theme.id,
        theme_variant_id: data.themeVariantId || null,
        kit_id: data.kitId || null,
        event_date: data.eventDate,
        pickup_date: data.pickupDate,
        return_date: data.returnDate,
        status: 'reservado',
        total: data.total,
        paid: paidAmount,
        balance: balanceAmount,
        delivery_location: data.deliveryLocation || customer.address || null,
        notes: data.notes || null,
      },
      data.forceOverride === true
    );

    if (!result.success || !result.rental) {
      return {
        success: false,
        error: result.error || 'Não foi possível confirmar a reserva.',
        conflict: result.conflict,
      };
    }

    const rental = result.rental;

    // 4. Se houve pagamento inicial informado, registra no financeiro
    if (paidAmount > 0) {
      store.recordPayment(
        rental.id,
        paidAmount,
        data.paymentMethod || 'pix',
        'Sinal / Pagamento inicial registrado via API'
      );
    }

    // 5. Persistência direta no Supabase Server (service_role) se disponível
    const admin = this.getAdminClient();
    if (admin) {
      await safeSupabaseServerOp(() =>
        admin.from('rentals').upsert({
          id: rental.id,
          tenant_id: DEFAULT_TENANT_ID,
          customer_id: rental.customer_id,
          theme_id: rental.theme_id,
          theme_variant_id: rental.theme_variant_id,
          kit_id: rental.kit_id,
          event_date: rental.event_date,
          pickup_date: rental.pickup_date,
          return_date: rental.return_date,
          status: rental.status,
          total: rental.total,
          paid: paidAmount,
          balance: balanceAmount,
          delivery_location: rental.delivery_location,
          notes: rental.notes,
          created_at: rental.created_at,
          updated_at: rental.updated_at,
        })
      );
    }

    store.logAudit('API_CREATE_RENTAL', 'rentals', rental.id, {
      rentalId: rental.id,
      themeName: theme.name,
      customerName: customer.name,
      total: rental.total,
    });

    return {
      success: true,
      rental,
      customer,
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
    const res = store.updateRental(id, updates);
    if (!res.success) return res;

    const admin = this.getAdminClient();
    if (admin) {
      await safeSupabaseServerOp(() =>
        admin
          .from('rentals')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
      );
    }

    return res;
  }

  public async recordPayment(
    rentalId: string,
    amount: number,
    method: Payment['method'],
    note?: string
  ): Promise<{ success: boolean; payment?: Payment; rental?: Rental; error?: string }> {
    try {
      const payment = store.recordPayment(rentalId, amount, method, note);
      const rental = store.getRentals().find((r) => r.id === rentalId);

      const admin = this.getAdminClient();
      if (admin) {
        await safeSupabaseServerOp(() =>
          admin.from('payments').insert({
            id: payment.id,
            rental_id: rentalId,
            amount: payment.amount,
            method: payment.method,
            note: payment.note,
            paid_at: payment.paid_at,
            created_at: payment.created_at,
          })
        );

        if (rental) {
          await safeSupabaseServerOp(() =>
            admin
              .from('rentals')
              .update({
                paid: rental.paid,
                balance: rental.balance,
                updated_at: new Date().toISOString(),
              })
              .eq('id', rentalId)
          );
        }
      }

      return { success: true, payment, rental };
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
}

export const apiService = new ApiService();
