import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SeedUser {
  email: string;
  password: string;
  full_name: string;
  role: "admin_provinsi" | "admin_kab_kota" | "panitia" | "wasit" | "evaluator";
  kabupaten_kota_id?: string;
  birth_date?: string;
  license_level?: string;
  license_expiry?: string;
  afk_origin?: string;
  occupation?: string;
  is_active?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const caller = await resolveCaller(req, supabaseAdmin);
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!hasAnyRole(caller, ["admin_provinsi"])) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Starting comprehensive database seeding...");

    // Get kabupaten_kota data
    const { data: kabKota } = await supabaseAdmin
      .from("kabupaten_kota")
      .select("id, name")
      .order("name");

    if (!kabKota || kabKota.length === 0) {
      return new Response(
        JSON.stringify({ error: "No kabupaten_kota data found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get provinsi data
    const { data: provinsiData } = await supabaseAdmin
      .from("provinsi")
      .select("id, name")
      .limit(1);
    
    const provinsiId = provinsiData?.[0]?.id;

    const kabKotaMap = new Map(kabKota.map(k => [k.name, k.id]));
    
    // Get IDs for various kabupaten/kota
    const makassarId = kabKotaMap.get("Kota Makassar") || kabKota[0].id;
    const gowaId = kabKotaMap.get("Kabupaten Gowa") || kabKota[1]?.id || kabKota[0].id;
    const marosId = kabKotaMap.get("Kabupaten Maros") || kabKota[2]?.id || kabKota[0].id;
    const takalarId = kabKotaMap.get("Kabupaten Takalar") || kabKota[3]?.id || kabKota[0].id;
    const boneId = kabKotaMap.get("Kabupaten Bone") || kabKota[4]?.id || kabKota[0].id;
    const bulukumbaId = kabKotaMap.get("Kabupaten Bulukumba") || kabKota[5]?.id || kabKota[0].id;
    const sinjaiId = kabKotaMap.get("Kabupaten Sinjai") || kabKota[6]?.id || kabKota[0].id;
    const jenepontoId = kabKotaMap.get("Kabupaten Jeneponto") || kabKota[7]?.id || kabKota[0].id;
    const bantaengId = kabKotaMap.get("Kabupaten Bantaeng") || kabKota[8]?.id || kabKota[0].id;
    const wajoId = kabKotaMap.get("Kabupaten Wajo") || kabKota[9]?.id || kabKota[0].id;
    const soppengId = kabKotaMap.get("Kabupaten Soppeng") || kabKota[10]?.id || kabKota[0].id;
    const parepareId = kabKotaMap.get("Kota Parepare") || kabKota[11]?.id || kabKota[0].id;

    // Define seed users
    const seedUsers: SeedUser[] = [
      // Admin Provinsi
      {
        email: "admin.provinsi@ffss.id",
        password: "Admin123!",
        full_name: "Admin Provinsi Sulsel",
        role: "admin_provinsi",
        kabupaten_kota_id: makassarId,
        occupation: "Administrator",
      },
      // Admin Kab/Kota
      {
        email: "admin.makassar@ffss.id",
        password: "Admin123!",
        full_name: "Admin Kota Makassar",
        role: "admin_kab_kota",
        kabupaten_kota_id: makassarId,
        occupation: "Administrator",
      },
      {
        email: "admin.gowa@ffss.id",
        password: "Admin123!",
        full_name: "Admin Kabupaten Gowa",
        role: "admin_kab_kota",
        kabupaten_kota_id: gowaId,
        occupation: "Administrator",
      },
      // Panitia
      {
        email: "panitia.makassar@ffss.id",
        password: "Panitia123!",
        full_name: "Panitia Makassar 1",
        role: "panitia",
        kabupaten_kota_id: makassarId,
        occupation: "Event Organizer",
      },
      {
        email: "panitia.gowa@ffss.id",
        password: "Panitia123!",
        full_name: "Panitia Gowa 1",
        role: "panitia",
        kabupaten_kota_id: gowaId,
        occupation: "Event Organizer",
      },
      // Evaluator
      {
        email: "evaluator@ffss.id",
        password: "Evaluator123!",
        full_name: "Evaluator Sulsel",
        role: "evaluator",
        kabupaten_kota_id: makassarId,
        occupation: "Evaluator",
      },
      // ============= 15 WASIT =============
      // Level 1 - 5 wasit
      {
        email: "ahmad.rizky@ffss.id",
        password: "Wasit123!",
        full_name: "Ahmad Rizky Pratama",
        role: "wasit",
        kabupaten_kota_id: makassarId,
        birth_date: "1990-05-15",
        license_level: "level_1",
        license_expiry: "2026-12-31",
        afk_origin: "AFK Makassar",
        occupation: "Guru Olahraga",
        is_active: true,
      },
      {
        email: "budi.santoso@ffss.id",
        password: "Wasit123!",
        full_name: "Budi Santoso",
        role: "wasit",
        kabupaten_kota_id: gowaId,
        birth_date: "1988-08-20",
        license_level: "level_1",
        license_expiry: "2026-06-30",
        afk_origin: "AFK Gowa",
        occupation: "Pelatih Futsal",
        is_active: true,
      },
      {
        email: "gunawan.setiawan@ffss.id",
        password: "Wasit123!",
        full_name: "Gunawan Setiawan",
        role: "wasit",
        kabupaten_kota_id: boneId,
        birth_date: "1991-09-30",
        license_level: "level_1",
        license_expiry: "2026-03-20",
        afk_origin: "AFK Bone",
        occupation: "PNS",
        is_active: true,
      },
      {
        email: "kurnia.hidayat@ffss.id",
        password: "Wasit123!",
        full_name: "Kurnia Hidayat",
        role: "wasit",
        kabupaten_kota_id: jenepontoId,
        birth_date: "1987-04-22",
        license_level: "level_1",
        license_expiry: "2026-08-20",
        afk_origin: "AFK Jeneponto",
        occupation: "Wiraswasta",
        is_active: true,
      },
      {
        email: "oscar.pratama@ffss.id",
        password: "Wasit123!",
        full_name: "Oscar Pratama",
        role: "wasit",
        kabupaten_kota_id: parepareId,
        birth_date: "1989-11-08",
        license_level: "level_1",
        license_expiry: "2026-07-15",
        afk_origin: "AFK Parepare",
        occupation: "Karyawan BUMN",
        is_active: true,
      },
      // Level 2 - 6 wasit
      {
        email: "cahya.putra@ffss.id",
        password: "Wasit123!",
        full_name: "Cahya Putra Wijaya",
        role: "wasit",
        kabupaten_kota_id: marosId,
        birth_date: "1992-03-10",
        license_level: "level_2",
        license_expiry: "2025-08-15",
        afk_origin: "AFK Maros",
        occupation: "Wiraswasta",
        is_active: true,
      },
      {
        email: "dedi.kurniawan@ffss.id",
        password: "Wasit123!",
        full_name: "Dedi Kurniawan",
        role: "wasit",
        kabupaten_kota_id: makassarId,
        birth_date: "1995-11-25",
        license_level: "level_2",
        license_expiry: "2025-10-20",
        afk_origin: "AFK Makassar",
        occupation: "Karyawan Swasta",
        is_active: false,
      },
      {
        email: "hendra.saputra@ffss.id",
        password: "Wasit123!",
        full_name: "Hendra Saputra",
        role: "wasit",
        kabupaten_kota_id: makassarId,
        birth_date: "1994-12-05",
        license_level: "level_2",
        license_expiry: "2025-11-10",
        afk_origin: "AFK Makassar",
        occupation: "Guru",
        is_active: true,
      },
      {
        email: "irfan.maulana@ffss.id",
        password: "Wasit123!",
        full_name: "Irfan Maulana",
        role: "wasit",
        kabupaten_kota_id: bulukumbaId,
        birth_date: "1993-06-18",
        license_level: "level_2",
        license_expiry: "2026-02-28",
        afk_origin: "AFK Bulukumba",
        occupation: "Freelancer",
        is_active: true,
      },
      {
        email: "lukman.hakim@ffss.id",
        password: "Wasit123!",
        full_name: "Lukman Hakim",
        role: "wasit",
        kabupaten_kota_id: bantaengId,
        birth_date: "1986-02-14",
        license_level: "level_2",
        license_expiry: "2024-12-31",
        afk_origin: "AFK Bantaeng",
        occupation: "Pensiunan",
        is_active: false,
      },
      {
        email: "nur.alam@ffss.id",
        password: "Wasit123!",
        full_name: "Nur Alam",
        role: "wasit",
        kabupaten_kota_id: soppengId,
        birth_date: "1990-07-25",
        license_level: "level_2",
        license_expiry: "2025-05-20",
        afk_origin: "AFK Soppeng",
        occupation: "Petani",
        is_active: true,
      },
      // Level 3 - 4 wasit
      {
        email: "eko.prasetyo@ffss.id",
        password: "Wasit123!",
        full_name: "Eko Prasetyo",
        role: "wasit",
        kabupaten_kota_id: takalarId,
        birth_date: "1993-07-08",
        license_level: "level_3",
        license_expiry: "2025-04-30",
        afk_origin: "AFK Takalar",
        occupation: "Mahasiswa",
        is_active: true,
      },
      {
        email: "fajar.ramadhan@ffss.id",
        password: "Wasit123!",
        full_name: "Fajar Ramadhan",
        role: "wasit",
        kabupaten_kota_id: gowaId,
        birth_date: "1997-01-12",
        license_level: "level_3",
        license_expiry: "2025-09-15",
        afk_origin: "AFK Gowa",
        occupation: "Freelancer",
        is_active: true,
      },
      {
        email: "joko.susanto@ffss.id",
        password: "Wasit123!",
        full_name: "Joko Susanto",
        role: "wasit",
        kabupaten_kota_id: sinjaiId,
        birth_date: "1996-10-03",
        license_level: "level_3",
        license_expiry: "2025-03-15",
        afk_origin: "AFK Sinjai",
        occupation: "Mahasiswa",
        is_active: true,
      },
      {
        email: "muhammad.fauzi@ffss.id",
        password: "Wasit123!",
        full_name: "Muhammad Fauzi",
        role: "wasit",
        kabupaten_kota_id: wajoId,
        birth_date: "1985-09-17",
        license_level: "level_3",
        license_expiry: "2026-01-15",
        afk_origin: "AFK Wajo",
        occupation: "Pedagang",
        is_active: true,
      },
    ];

    const createdUsers: { email: string; id: string; role: string }[] = [];
    const skippedUsers: { email: string; reason: string }[] = [];
    const errors: { email: string; error: string }[] = [];

    // Create users
    for (const user of seedUsers) {
      try {
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const userExists = existingUser?.users?.some(u => u.email === user.email);
        
        if (userExists) {
          console.log(`User ${user.email} already exists, skipping...`);
          skippedUsers.push({ email: user.email, reason: "Already exists" });
          continue;
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.full_name },
        });

        if (createError) {
          errors.push({ email: user.email, error: createError.message });
          continue;
        }

        const profileUpdate: Record<string, unknown> = {
          kabupaten_kota_id: user.kabupaten_kota_id,
          is_profile_complete: true,
          is_active: user.is_active ?? true,
          registration_status: "approved",
        };

        if (user.birth_date) profileUpdate.birth_date = user.birth_date;
        if (user.license_level) profileUpdate.license_level = user.license_level;
        if (user.license_expiry) profileUpdate.license_expiry = user.license_expiry;
        if (user.afk_origin) profileUpdate.afk_origin = user.afk_origin;
        if (user.occupation) profileUpdate.occupation = user.occupation;

        await supabaseAdmin.from("profiles").update(profileUpdate).eq("id", newUser.user.id);
        await supabaseAdmin.from("user_roles").insert({ user_id: newUser.user.id, role: user.role });

        createdUsers.push({ email: user.email, id: newUser.user.id, role: user.role });
        console.log(`Created user: ${user.email} with role ${user.role}`);
      } catch (err) {
        errors.push({ email: user.email, error: String(err) });
      }
    }

    // Get all user IDs by role
    const { data: wasitUsers } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "wasit");
    const wasitIds = wasitUsers?.map(w => w.user_id) || [];

    const { data: panitiaUsers } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "panitia");
    const panitiaId = panitiaUsers?.[0]?.user_id;

    const { data: adminUsers } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin_provinsi");
    const adminId = adminUsers?.[0]?.user_id;

    const { data: evaluatorUsers } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "evaluator");
    const evaluatorId = evaluatorUsers?.[0]?.user_id;

    let eventsCreated = 0;
    let assignmentsCreated = 0;
    let honorsCreated = 0;
    let reviewsCreated = 0;
    let criteriaCreated = 0;
    let evaluationsCreated = 0;
    let learningMaterialsCreated = 0;
    let discussionTopicsCreated = 0;
    let discussionRepliesCreated = 0;
    let pengurusCreated = 0;

    // ============= PHASE 1: EVALUATION CRITERIA =============
    const { data: existingCriteria } = await supabaseAdmin.from("evaluation_criteria").select("id").limit(1);
    
    if (!existingCriteria || existingCriteria.length === 0) {
      const evaluationCriteria = [
        { name: "Pengetahuan Aturan (LOTG)", description: "Pemahaman mendalam tentang Laws of the Game FIFA Futsal", weight: 15, sort_order: 1, is_active: true },
        { name: "Penerapan Aturan", description: "Kemampuan menerapkan aturan secara konsisten dan tepat", weight: 15, sort_order: 2, is_active: true },
        { name: "Positioning & Sudut Pandang", description: "Penempatan posisi untuk melihat permainan dengan jelas", weight: 12, sort_order: 3, is_active: true },
        { name: "Ketegasan Keputusan", description: "Kepercayaan diri dan ketegasan dalam mengambil keputusan", weight: 10, sort_order: 4, is_active: true },
        { name: "Komunikasi dengan Pemain", description: "Kemampuan berkomunikasi efektif dengan pemain dan official", weight: 10, sort_order: 5, is_active: true },
        { name: "Manajemen Pertandingan", description: "Kemampuan mengelola jalannya pertandingan secara keseluruhan", weight: 10, sort_order: 6, is_active: true },
        { name: "Kebugaran Fisik", description: "Kondisi fisik untuk mengikuti permainan dengan baik", weight: 8, sort_order: 7, is_active: true },
        { name: "Penampilan & Profesionalisme", description: "Penampilan rapi dan sikap profesional", weight: 8, sort_order: 8, is_active: true },
        { name: "Kerja Sama Tim Wasit", description: "Koordinasi dan komunikasi dengan wasit lain", weight: 7, sort_order: 9, is_active: true },
        { name: "Penanganan Situasi Sulit", description: "Kemampuan menangani situasi konflik dan tekanan", weight: 5, sort_order: 10, is_active: true },
      ];

      const { data: createdCriteria, error: criteriaError } = await supabaseAdmin.from("evaluation_criteria").insert(evaluationCriteria).select();
      if (!criteriaError && createdCriteria) {
        criteriaCreated = createdCriteria.length;
        console.log(`Created ${criteriaCreated} evaluation criteria`);
      }
    }

    // ============= CREATE EVENTS =============
    if (panitiaId && wasitIds.length > 0) {
      const events = [
        // SELESAI events (past dates)
        { name: "Piala Walikota Futsal 2025", date: "2025-01-15", start_date: "2025-01-15", end_date: "2025-01-17", location: "GOR Sudiang, Makassar", category: "Profesional", description: "Turnamen futsal tahunan tingkat kota", status: "SELESAI", kabupaten_kota_id: makassarId, created_by: panitiaId },
        { name: "Liga Futsal Pelajar Sulsel", date: "2024-12-10", start_date: "2024-12-10", end_date: "2024-12-15", location: "GOR Mattoangin, Makassar", category: "Pelajar", description: "Kompetisi pelajar se-Sulawesi Selatan", status: "SELESAI", kabupaten_kota_id: makassarId, created_by: panitiaId },
        { name: "Turnamen Futsal Kemerdekaan", date: "2024-08-17", start_date: "2024-08-17", end_date: "2024-08-20", location: "GOR Sungguminasa, Gowa", category: "Umum", description: "Turnamen menyambut HUT RI", status: "SELESAI", kabupaten_kota_id: gowaId, created_by: panitiaId },
        // DISETUJUI events
        { name: "Liga Futsal Pelajar Gowa 2026", date: "2026-02-20", start_date: "2026-02-20", end_date: "2026-02-22", location: "GOR Sungguminasa, Gowa", category: "Pelajar", description: "Kompetisi antar sekolah SMA/SMK", status: "DISETUJUI", kabupaten_kota_id: gowaId, created_by: panitiaId },
        { name: "Piala Gubernur Futsal 2026", date: "2026-03-15", start_date: "2026-03-15", end_date: "2026-03-20", location: "GOR Sudiang, Makassar", category: "Profesional", description: "Kejuaraan tingkat provinsi", status: "DISETUJUI", kabupaten_kota_id: makassarId, created_by: panitiaId },
        { name: "Festival Futsal Ramadhan", date: "2026-03-25", start_date: "2026-03-25", end_date: "2026-03-27", location: "Lapangan Karebosi, Makassar", category: "Umum", description: "Turnamen Ramadhan", status: "DISETUJUI", kabupaten_kota_id: makassarId, created_by: panitiaId },
        // DIAJUKAN events
        { name: "Turnamen Futsal Antar Instansi", date: "2026-04-10", start_date: "2026-04-10", end_date: "2026-04-12", location: "GOR Mattoangin, Makassar", category: "Profesional", description: "Kompetisi antar instansi pemerintah", status: "DIAJUKAN", kabupaten_kota_id: makassarId, created_by: panitiaId },
        { name: "Liga Futsal Wanita Sulsel", date: "2026-05-01", start_date: "2026-05-01", end_date: "2026-05-03", location: "GOR Sudiang, Makassar", category: "Profesional", description: "Liga futsal khusus wanita", status: "DIAJUKAN", kabupaten_kota_id: makassarId, created_by: panitiaId },
        { name: "Turnamen Futsal Veteran", date: "2026-05-20", start_date: "2026-05-20", end_date: "2026-05-22", location: "GOR Sungguminasa, Gowa", category: "Umum", description: "Turnamen untuk pemain usia 35+", status: "DIAJUKAN", kabupaten_kota_id: gowaId, created_by: panitiaId },
        // DITOLAK event
        { name: "Festival Futsal Sulsel", date: "2026-06-15", start_date: "2026-06-15", end_date: "2026-06-18", location: "GOR Sudiang, Makassar", category: "Profesional", description: "Festival futsal terbesar", status: "DITOLAK", kabupaten_kota_id: makassarId, created_by: panitiaId },
      ];

      const { data: existingEvents } = await supabaseAdmin.from("events").select("name").in("name", events.map(e => e.name));
      const existingEventNames = new Set(existingEvents?.map(e => e.name) || []);
      const newEvents = events.filter(e => !existingEventNames.has(e.name));

      if (newEvents.length > 0) {
        const { data: createdEvents, error: eventError } = await supabaseAdmin.from("events").insert(newEvents).select();

        if (!eventError && createdEvents) {
          eventsCreated = createdEvents.length;
          console.log(`Created ${eventsCreated} events`);

          // Create approvals
          if (adminId) {
            const approvals = createdEvents.map(event => ({
              event_id: event.id,
              status: event.status === "DIAJUKAN" ? "pending" : event.status === "DISETUJUI" || event.status === "SELESAI" ? "approved" : "rejected",
              approver_id: event.status === "DIAJUKAN" ? null : adminId,
              notes: event.status === "DIAJUKAN" ? "Menunggu persetujuan" : event.status === "DITOLAK" ? "Jadwal bentrok" : "Disetujui",
            }));
            await supabaseAdmin.from("event_approvals").insert(approvals);
          }

          // Create assignments for approved/completed events
          const assignableEvents = createdEvents.filter(e => e.status === "DISETUJUI" || e.status === "SELESAI");
          const roles = ["wasit_utama", "wasit_kedua", "wasit_ketiga", "wasit_cadangan"];
          
          for (const event of assignableEvents) {
            const shuffledWasit = [...wasitIds].sort(() => Math.random() - 0.5);
            const assignCount = Math.min(4, shuffledWasit.length);
            
            for (let i = 0; i < assignCount; i++) {
              await supabaseAdmin.from("event_assignments").insert({
                event_id: event.id,
                referee_id: shuffledWasit[i],
                role: roles[i],
                status: event.status === "SELESAI" ? "confirmed" : i < 2 ? "confirmed" : "pending",
              });
              assignmentsCreated++;
            }
          }

          // Create honors for completed events
          const completedEvents = createdEvents.filter(e => e.status === "SELESAI");
          for (const event of completedEvents) {
            const { data: assignments } = await supabaseAdmin.from("event_assignments").select("referee_id, role").eq("event_id", event.id);
            
            for (const assignment of assignments || []) {
              const amounts: Record<string, number> = { wasit_utama: 750000, wasit_kedua: 600000, wasit_ketiga: 500000, wasit_cadangan: 350000 };
              const statuses = ["verified", "pending", "draft"];
              const status = statuses[Math.floor(Math.random() * statuses.length)];
              
              await supabaseAdmin.from("honors").insert({
                referee_id: assignment.referee_id,
                event_id: event.id,
                amount: amounts[assignment.role] || 400000,
                status,
                verified_by: status === "verified" ? adminId : null,
                verified_at: status === "verified" ? new Date().toISOString() : null,
                notes: `Honor ${assignment.role} untuk ${event.name}`,
              });
              honorsCreated++;
            }
          }

          // ============= PHASE 2: EVALUATIONS =============
          if (evaluatorId && completedEvents.length > 0) {
            const { data: allCriteria } = await supabaseAdmin.from("evaluation_criteria").select("id, weight").order("sort_order");
            
            for (const event of completedEvents) {
              const { data: assignments } = await supabaseAdmin.from("event_assignments").select("referee_id").eq("event_id", event.id).limit(3);
              
              for (const assignment of assignments || []) {
                const statuses = ["submitted", "reviewed", "draft"];
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                
                const { data: evaluation, error: evalError } = await supabaseAdmin.from("evaluations").insert({
                  event_id: event.id,
                  referee_id: assignment.referee_id,
                  evaluator_id: evaluatorId,
                  status,
                  submitted_at: status !== "draft" ? new Date().toISOString() : null,
                  notes: status === "reviewed" ? "Evaluasi telah direview dan disetujui" : status === "submitted" ? "Menunggu review" : "Draft evaluasi",
                }).select().single();

                if (!evalError && evaluation && allCriteria) {
                  let totalScore = 0;
                  let totalWeight = 0;
                  
                  for (const criteria of allCriteria) {
                    const score = Math.floor(Math.random() * 21) + 80; // 80-100
                    await supabaseAdmin.from("evaluation_scores").insert({
                      evaluation_id: evaluation.id,
                      criteria_id: criteria.id,
                      score,
                      notes: score >= 90 ? "Sangat baik" : score >= 80 ? "Baik" : "Cukup",
                    });
                    totalScore += score * criteria.weight;
                    totalWeight += criteria.weight;
                  }

                  await supabaseAdmin.from("evaluations").update({ total_score: totalWeight > 0 ? totalScore / totalWeight : 0 }).eq("id", evaluation.id);
                  evaluationsCreated++;
                }
              }
            }
          }
        }
      }
    }

    // ============= PHASE 3: LEARNING MATERIALS =============
    const { data: existingMaterials } = await supabaseAdmin.from("learning_materials").select("id").limit(1);
    
    if (!existingMaterials || existingMaterials.length === 0) {
      const learningMaterials = [
        { title: "Pengenalan Lapangan Futsal", description: "Memahami dimensi dan marking lapangan futsal sesuai standar FIFA", category: "law_1_pitch", law_number: "1", content: "Lapangan futsal memiliki panjang 25-42m dan lebar 16-25m. Garis batas harus jelas dan berwarna berbeda dari permukaan lapangan.", content_type: "document", difficulty_level: "basic", duration_minutes: 15, sort_order: 1, is_published: true },
        { title: "Spesifikasi Bola Futsal", description: "Karakteristik bola futsal yang sesuai standar", category: "law_2_ball", law_number: "2", content: "Bola futsal berukuran 4 dengan berat 400-440g. Bola harus memiliki bounce 50-65cm pada drop pertama.", content_type: "document", difficulty_level: "basic", duration_minutes: 10, sort_order: 2, is_published: true },
        { title: "Jumlah dan Pergantian Pemain", description: "Aturan tentang jumlah pemain dan prosedur pergantian", category: "law_3_players", law_number: "3", content: "Setiap tim terdiri dari 5 pemain termasuk kiper. Pergantian dapat dilakukan kapan saja dan tidak terbatas.", content_type: "document", difficulty_level: "basic", duration_minutes: 20, sort_order: 3, is_published: true },
        { title: "Perlengkapan Pemain Futsal", description: "Aturan tentang jersey, sepatu, dan pelindung", category: "law_4_equipment", law_number: "4", content: "Pemain wajib menggunakan jersey bernomor, celana pendek, kaos kaki, pelindung tulang kering, dan sepatu futsal.", content_type: "document", difficulty_level: "basic", duration_minutes: 15, sort_order: 4, is_published: true },
        { title: "Tugas dan Wewenang Wasit", description: "Panduan lengkap tugas wasit dalam pertandingan", category: "law_5_referees", law_number: "5", content: "Wasit utama memiliki wewenang penuh dalam pertandingan. Keputusan wasit bersifat final untuk fakta permainan.", content_type: "document", difficulty_level: "intermediate", duration_minutes: 30, sort_order: 5, is_published: true },
        { title: "Peran Petugas Pertandingan", description: "Tugas wasit kedua, pencatat waktu, dan wasit ketiga", category: "law_6_officials", law_number: "6", content: "Wasit kedua membantu wasit utama dan bertanggung jawab pada sisi lapangan yang berlawanan.", content_type: "document", difficulty_level: "intermediate", duration_minutes: 25, sort_order: 6, is_published: true },
        { title: "Durasi Pertandingan Futsal", description: "Aturan waktu permainan dan time-out", category: "law_7_duration", law_number: "7", content: "Pertandingan terdiri dari 2 babak @ 20 menit bersih. Setiap tim berhak 1 time-out per babak.", content_type: "document", difficulty_level: "basic", duration_minutes: 15, sort_order: 7, is_published: true },
        { title: "Kick-off dan Memulai Permainan", description: "Prosedur memulai dan melanjutkan permainan", category: "law_8_start", law_number: "8", content: "Kick-off dilakukan dari titik tengah. Bola harus bergerak ke depan dan menyentuh pemain lain sebelum dikuasai.", content_type: "document", difficulty_level: "basic", duration_minutes: 15, sort_order: 8, is_published: true },
        { title: "Bola Dalam dan Luar Permainan", description: "Kapan bola dinyatakan dalam atau luar permainan", category: "law_9_ball_play", law_number: "9", content: "Bola keluar saat seluruh bagian bola melewati garis batas. Bola dalam permainan saat berada dalam lapangan.", content_type: "document", difficulty_level: "basic", duration_minutes: 10, sort_order: 9, is_published: true },
        { title: "Terjadinya Gol", description: "Aturan penentuan gol yang sah", category: "law_10_goal", law_number: "10", content: "Gol terjadi saat seluruh bagian bola melewati garis gawang antara tiang dan mistar, tanpa pelanggaran.", content_type: "document", difficulty_level: "basic", duration_minutes: 10, sort_order: 10, is_published: true },
        { title: "Pelanggaran Terakumulasi", description: "Sistem akumulasi pelanggaran dan tendangan bebas kedua", category: "law_11_accumulated", law_number: "11", content: "Pelanggaran ke-6 dan seterusnya per babak dihukum tendangan bebas tanpa dinding dari titik penalti kedua.", content_type: "document", difficulty_level: "advanced", duration_minutes: 25, sort_order: 11, is_published: true },
        { title: "Jenis Pelanggaran Futsal", description: "Pelanggaran yang dapat dikenai sanksi", category: "law_12_fouls", law_number: "12", content: "Pelanggaran meliputi menendang, menjegal, melompat, mencharge, memukul, mendorong, menarik, meludah.", content_type: "document", difficulty_level: "intermediate", duration_minutes: 35, sort_order: 12, is_published: true },
        { title: "Tendangan Bebas", description: "Prosedur tendangan bebas langsung dan tidak langsung", category: "law_13_free_kicks", law_number: "13", content: "Tendangan bebas langsung dapat langsung menghasilkan gol. Tendangan tidak langsung harus menyentuh pemain lain.", content_type: "document", difficulty_level: "intermediate", duration_minutes: 25, sort_order: 13, is_published: true },
        { title: "Tendangan Penalti", description: "Prosedur dan aturan tendangan penalti", category: "law_14_penalty", law_number: "14", content: "Tendangan penalti dilakukan dari jarak 6m. Kiper harus di garis gawang hingga bola ditendang.", content_type: "document", difficulty_level: "intermediate", duration_minutes: 20, sort_order: 14, is_published: true },
        { title: "Tendangan Ke Dalam (Kick-in)", description: "Prosedur tendangan ke dalam pengganti throw-in", category: "law_15_kick_in", law_number: "15", content: "Kick-in dilakukan dengan kaki dari posisi di atas atau di belakang garis batas. Tidak boleh langsung gol.", content_type: "document", difficulty_level: "basic", duration_minutes: 15, sort_order: 15, is_published: true },
        { title: "Goal Clearance", description: "Prosedur lemparan kiper pengganti goal kick", category: "law_16_goal_clearance", law_number: "16", content: "Goal clearance dilakukan dengan lemparan tangan oleh kiper. Bola harus keluar area penalti dalam 4 detik.", content_type: "document", difficulty_level: "basic", duration_minutes: 15, sort_order: 16, is_published: true },
        { title: "Tendangan Sudut", description: "Prosedur dan aturan tendangan sudut", category: "law_17_corner", law_number: "17", content: "Tendangan sudut dilakukan dari sudut lapangan. Dapat langsung menghasilkan gol.", content_type: "document", difficulty_level: "basic", duration_minutes: 15, sort_order: 17, is_published: true },
      ];

      const { data: createdMaterials, error: materialError } = await supabaseAdmin.from("learning_materials").insert(learningMaterials).select();
      if (!materialError && createdMaterials) {
        learningMaterialsCreated = createdMaterials.length;
        console.log(`Created ${learningMaterialsCreated} learning materials`);
      }
    }

    // ============= PHASE 4: DISCUSSION FORUM =============
    const { data: existingTopics } = await supabaseAdmin.from("discussion_topics").select("id").limit(1);
    
    if ((!existingTopics || existingTopics.length === 0) && wasitIds.length > 0) {
      const discussionTopics = [
        { title: "Kapan tendangan bebas langsung vs tidak langsung?", content: "Saya sering bingung membedakan kapan harus memberikan tendangan bebas langsung dan tidak langsung. Apakah ada tips untuk mengingat perbedaannya?", category: "lotg", law_reference: "Law 13", author_id: wasitIds[0], views_count: 156, replies_count: 8 },
        { title: "Interpretasi handball di area penalti", content: "Bagaimana cara menilai apakah handball layak dikenai penalti? Faktor apa saja yang harus dipertimbangkan?", category: "interpretation", law_reference: "Law 12", author_id: wasitIds[1] || wasitIds[0], views_count: 234, replies_count: 12 },
        { title: "Studi kasus: Simulasi atau pelanggaran?", content: "Dalam pertandingan kemarin, seorang pemain terjatuh di area penalti setelah kontak minimal. Bagaimana seharusnya wasit menilai situasi ini?", category: "case_study", author_id: wasitIds[2] || wasitIds[0], views_count: 189, replies_count: 15 },
        { title: "Teknik positioning yang efektif", content: "Apa tips untuk positioning yang baik agar dapat melihat permainan dengan jelas? Terutama saat situasi ramai di area penalti.", category: "general", author_id: wasitIds[3] || wasitIds[0], views_count: 98, replies_count: 6 },
        { title: "Aturan 4 detik untuk kiper", content: "Kapan hitungan 4 detik dimulai untuk kiper? Apakah dari saat bola dikuasai atau dari saat kiper berdiri?", category: "lotg", law_reference: "Law 16", author_id: wasitIds[4] || wasitIds[0], views_count: 145, replies_count: 9 },
        { title: "Menangani pemain yang protes", content: "Bagaimana cara terbaik menangani pemain yang terus-menerus protes keputusan wasit? Kapan sebaiknya memberikan kartu?", category: "general", author_id: wasitIds[5] || wasitIds[0], views_count: 267, replies_count: 18 },
        { title: "Akumulasi pelanggaran di babak perpanjangan", content: "Apakah akumulasi pelanggaran direset saat babak perpanjangan dimulai?", category: "lotg", law_reference: "Law 11", author_id: wasitIds[6] || wasitIds[0], views_count: 78, replies_count: 5 },
        { title: "Power play: aturan dan implementasi", content: "Tolong jelaskan aturan power play dengan kiper terbang. Kapan tim boleh menggunakan dan apa konsekuensinya?", category: "interpretation", author_id: wasitIds[7] || wasitIds[0], views_count: 201, replies_count: 11 },
        { title: "Offside dalam futsal?", content: "Apakah ada aturan offside dalam futsal? Saya pernah ditanya penonton dan tidak yakin jawabannya.", category: "lotg", author_id: wasitIds[8] || wasitIds[0], views_count: 312, replies_count: 7 },
        { title: "Pengalaman pertama memimpin final", content: "Minggu depan saya akan memimpin pertandingan final pertama saya. Ada tips dari senior untuk persiapan mental dan fisik?", category: "general", author_id: wasitIds[9] || wasitIds[0], views_count: 156, replies_count: 14 },
      ];

      const { data: createdTopics, error: topicError } = await supabaseAdmin.from("discussion_topics").insert(discussionTopics).select();
      
      if (!topicError && createdTopics) {
        discussionTopicsCreated = createdTopics.length;
        console.log(`Created ${discussionTopicsCreated} discussion topics`);

        // Create replies
        const replyContents = [
          "Terima kasih atas pertanyaannya. Menurut pengalaman saya...",
          "Ini memang situasi yang tricky. Saya biasanya mempertimbangkan...",
          "Setuju dengan pendapat di atas. Tambahan dari saya...",
          "Berdasarkan LOTG terbaru, aturannya adalah...",
          "Saya pernah mengalami situasi serupa. Yang saya lakukan adalah...",
          "Poin bagus! Jangan lupa juga mempertimbangkan...",
          "Ini solusi yang sangat membantu. Terima kasih!",
          "Menurut pelatihan yang saya ikuti, seharusnya...",
        ];

        for (const topic of createdTopics) {
          const replyCount = Math.floor(Math.random() * 4) + 2; // 2-5 replies per topic
          
          for (let i = 0; i < replyCount; i++) {
            const authorId = wasitIds[Math.floor(Math.random() * wasitIds.length)];
            const isSolution = i === 0 && Math.random() > 0.7;
            
            const { data: reply } = await supabaseAdmin.from("discussion_replies").insert({
              topic_id: topic.id,
              author_id: authorId,
              content: replyContents[Math.floor(Math.random() * replyContents.length)],
              is_solution: isSolution,
            }).select().single();

            discussionRepliesCreated++;

            // Add nested reply occasionally
            if (reply && Math.random() > 0.6) {
              await supabaseAdmin.from("discussion_replies").insert({
                topic_id: topic.id,
                parent_reply_id: reply.id,
                author_id: wasitIds[Math.floor(Math.random() * wasitIds.length)],
                content: "Setuju dengan penjelasan ini. " + replyContents[Math.floor(Math.random() * replyContents.length)],
                is_solution: false,
              });
              discussionRepliesCreated++;
            }
          }
        }
      }
    }

    // ============= PHASE 5: PENGURUS =============
    const { data: existingPengurus } = await supabaseAdmin.from("pengurus").select("id").limit(1);
    
    if ((!existingPengurus || existingPengurus.length === 0) && adminId && provinsiId) {
      // Get user profiles for pengurus
      const { data: allProfiles } = await supabaseAdmin.from("profiles").select("id, full_name, kabupaten_kota_id").limit(30);

      const pengurusProvinsi = [
        { user_id: adminId, jabatan: "Ketua Umum", level: "PROVINSI" as const, provinsi_id: provinsiId, is_active: true },
      ];

      // Add more provinsi pengurus from other users
      if (allProfiles && allProfiles.length > 5) {
        pengurusProvinsi.push(
          { user_id: allProfiles[1]?.id || adminId, jabatan: "Wakil Ketua", level: "PROVINSI" as const, provinsi_id: provinsiId, is_active: true },
          { user_id: allProfiles[2]?.id || adminId, jabatan: "Sekretaris Jenderal", level: "PROVINSI" as const, provinsi_id: provinsiId, is_active: true },
          { user_id: allProfiles[3]?.id || adminId, jabatan: "Bendahara", level: "PROVINSI" as const, provinsi_id: provinsiId, is_active: true },
          { user_id: allProfiles[4]?.id || adminId, jabatan: "Koordinator Wasit Provinsi", level: "PROVINSI" as const, provinsi_id: provinsiId, is_active: true },
        );
      }

      const { error: pengurusProvinsiError } = await supabaseAdmin.from("pengurus").insert(pengurusProvinsi);
      if (!pengurusProvinsiError) {
        pengurusCreated += pengurusProvinsi.length;
      }

      // Pengurus Kabupaten/Kota
      const kabKotaIds = [makassarId, gowaId, marosId, takalarId, boneId];
      const jabatanKabKota = ["Ketua", "Sekretaris", "Koordinator Wasit"];
      
      let profileIndex = 5;
      for (const kabKotaId of kabKotaIds) {
        for (const jabatan of jabatanKabKota) {
          if (allProfiles && allProfiles[profileIndex]) {
            await supabaseAdmin.from("pengurus").insert({
              user_id: allProfiles[profileIndex].id,
              jabatan,
              level: "KAB_KOTA" as const,
              kabupaten_kota_id: kabKotaId,
              is_active: true,
            });
            pengurusCreated++;
            profileIndex++;
          }
        }
      }

      console.log(`Created ${pengurusCreated} pengurus`);
    }

    // ============= PHASE 6: REFEREE REVIEWS =============
    if (wasitIds.length > 0) {
      const { data: existingReviews } = await supabaseAdmin.from("referee_reviews").select("id").limit(1);

      if (!existingReviews || existingReviews.length === 0) {
        const reviewers = ["Bapak Andi Mappanyukki", "Ibu Siti Fatimah", "Pak Ahmad Daeng", "Bu Nurjannah", "Mas Joko", "Mbak Dewi", "Pak Rusli", "Bu Aminah"];
        const comments = [
          "Wasit sangat profesional dan adil",
          "Keputusan wasit sangat baik dan konsisten",
          "Performa wasit memuaskan",
          "Wasit tegas dalam keputusan",
          "Komunikasi wasit sangat baik",
          "Wasit menguasai aturan dengan baik",
          "Penampilan meyakinkan",
          "Cepat dan tepat",
        ];

        const reviews = [];
        for (let i = 0; i < Math.min(10, wasitIds.length); i++) {
          const reviewCount = Math.floor(Math.random() * 4) + 2;
          for (let j = 0; j < reviewCount; j++) {
            reviews.push({
              referee_id: wasitIds[i],
              rating: Math.floor(Math.random() * 2) + 4,
              reviewer_name: reviewers[Math.floor(Math.random() * reviewers.length)],
              comment: comments[Math.floor(Math.random() * comments.length)],
            });
          }
        }

        const { error: reviewError } = await supabaseAdmin.from("referee_reviews").insert(reviews);
        if (!reviewError) {
          reviewsCreated = reviews.length;
          console.log(`Created ${reviewsCreated} referee reviews`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Database seeded successfully with comprehensive data",
        summary: {
          users_created: createdUsers.length,
          users_skipped: skippedUsers.length,
          events_created: eventsCreated,
          assignments_created: assignmentsCreated,
          honors_created: honorsCreated,
          reviews_created: reviewsCreated,
          criteria_created: criteriaCreated,
          evaluations_created: evaluationsCreated,
          learning_materials_created: learningMaterialsCreated,
          discussion_topics_created: discussionTopicsCreated,
          discussion_replies_created: discussionRepliesCreated,
          pengurus_created: pengurusCreated,
        },
        created_users: createdUsers,
        skipped_users: skippedUsers.length > 0 ? skippedUsers : undefined,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
