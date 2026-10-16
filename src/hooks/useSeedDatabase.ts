import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SeedResult {
  success: boolean;
  message: string;
  summary: {
    users_created: number;
    users_skipped: number;
    events_created: number;
    assignments_created: number;
    honors_created: number;
    reviews_created: number;
    criteria_created: number;
    evaluations_created: number;
    learning_materials_created: number;
    discussion_topics_created: number;
    discussion_replies_created: number;
    pengurus_created: number;
  };
  created_users?: { email: string; id: string; role: string }[];
  skipped_users?: { email: string; reason: string }[];
  errors?: { email: string; error: string }[];
}

export function useSeedDatabase() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const seedDatabase = async (): Promise<SeedResult | null> => {
    setIsSeeding(true);
    setProgress('Memulai seeding database...');

    try {
      setProgress('Menghubungi server...');
      
      const { data, error } = await supabase.functions.invoke('seed-database', {
        method: 'POST',
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Seed database gagal');
      }

      setProgress('Seeding selesai!');
      
      const summary = data.summary;
      const totalCreated = 
        summary.users_created + 
        summary.events_created + 
        summary.learning_materials_created + 
        summary.discussion_topics_created + 
        summary.pengurus_created;

      toast.success('Database berhasil di-seed!', {
        description: `${totalCreated} entitas baru dibuat`,
      });

      return data as SeedResult;
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Gagal melakukan seed database', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
      return null;
    } finally {
      setIsSeeding(false);
      setTimeout(() => setProgress(null), 3000);
    }
  };

  return {
    seedDatabase,
    isSeeding,
    progress,
  };
}

// Seed data summary for display
export const SEED_DATA_SUMMARY = {
  users: [
    { role: 'Admin Provinsi', count: 1 },
    { role: 'Admin Kab/Kota', count: 2 },
    { role: 'Panitia', count: 2 },
    { role: 'Evaluator', count: 1 },
    { role: 'Wasit', count: 15 },
  ],
  wasitDetails: [
    { level: 'Level 1', count: 5, description: '5 wasit dengan lisensi Level 1 (tertinggi)' },
    { level: 'Level 2', count: 6, description: '6 wasit dengan lisensi Level 2, termasuk 1 inactive dan 1 expired' },
    { level: 'Level 3', count: 4, description: '4 wasit dengan lisensi Level 3, beberapa akan segera expired' },
  ],
  events: {
    total: 10,
    breakdown: [
      { status: 'SELESAI', count: 3, description: 'Event yang sudah selesai (masa lalu)' },
      { status: 'DISETUJUI', count: 3, description: 'Event yang sudah disetujui (akan datang)' },
      { status: 'DIAJUKAN', count: 3, description: 'Event menunggu persetujuan' },
      { status: 'DITOLAK', count: 1, description: 'Event yang ditolak' },
    ],
  },
  evaluations: {
    criteria: 10,
    evaluations: 8,
    description: '10 kriteria evaluasi standar FIFA, 8 evaluasi untuk wasit di event selesai',
  },
  learning: {
    materials: 17,
    description: '17 materi LOTG (Law 1-17) dengan berbagai level kesulitan',
    levels: [
      { level: 'Basic', count: 10, description: 'Materi dasar untuk pemula' },
      { level: 'Intermediate', count: 5, description: 'Materi menengah' },
      { level: 'Advanced', count: 2, description: 'Materi lanjutan' },
    ],
  },
  discussions: {
    topics: 10,
    replies: 25,
    description: '10 topik diskusi dengan 25+ balasan dan nested replies',
    categories: ['lotg', 'interpretation', 'case_study', 'general'],
  },
  organization: {
    pengurusProvinsi: 5,
    pengurusKabKota: 15,
    description: 'Struktur kepengurusan provinsi dan 5 kabupaten/kota',
    positions: ['Ketua Umum', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Koordinator Wasit'],
  },
  honors: {
    total: 12,
    description: 'Honor untuk wasit di event selesai (draft, pending, verified)',
    amounts: ['Rp 350.000 - Rp 750.000'],
  },
  reviews: {
    total: 25,
    description: '25+ review publik untuk wasit dengan rating 4-5 bintang',
  },
  other: [
    'Penugasan wasit ke event dengan berbagai role',
    'Approval event oleh admin',
    'Referee cards untuk beberapa wasit',
    'Notifikasi untuk user',
  ],
};
