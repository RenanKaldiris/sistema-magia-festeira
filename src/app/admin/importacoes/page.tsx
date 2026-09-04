'use client';

import React from 'react';
import { ImportacoesTabContent } from '@/components/temas/ImportacoesTabContent';

/**
 * Gestão da Fila de Importação de Fotos & Pastas
 * Fila assíncrona para importação de links de pastas do Google Drive (drive.google.com) via queueImport
 * Deduplicação de pasta por fingerprint SHA-256 evitando reimportação de fotos idênticas
 */
export default function AdminImportacoesPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ImportacoesTabContent />
    </div>
  );
}
