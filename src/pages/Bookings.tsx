import { motion } from "framer-motion";
import { CalendarDays, Plus, Filter } from "lucide-react";
import { useState } from "react";

type BookingStatus = "semua" | "dikonfirmasi" | "menunggu" | "dibatalkan";

const allBookings = [
  { id: 1, court: "Lapangan A", team: "FC Elang", date: "14 Feb 2026", time: "08:00 - 09:00", status: "dikonfirmasi", price: "Rp 150.000" },
  { id: 2, court: "Lapangan B", team: "Garuda FC", date: "14 Feb 2026", time: "09:00 - 10:00", status: "dikonfirmasi", price: "Rp 200.000" },
  { id: 3, court: "Lapangan A", team: "Rajawali FC", date: "14 Feb 2026", time: "10:00 - 11:00", status: "menunggu", price: "Rp 150.000" },
  { id: 4, court: "Lapangan C", team: "Bintang FC", date: "15 Feb 2026", time: "13:00 - 14:00", status: "dikonfirmasi", price: "Rp 120.000" },
  { id: 5, court: "Lapangan B", team: "Thunder FC", date: "15 Feb 2026", time: "15:00 - 16:00", status: "menunggu", price: "Rp 200.000" },
  { id: 6, court: "Lapangan D", team: "Meteor FC", date: "16 Feb 2026", time: "19:00 - 20:00", status: "dibatalkan", price: "Rp 180.000" },
];

const statusStyles: Record<string, string> = {
  dikonfirmasi: "bg-success/15 text-success",
  menunggu: "bg-accent/15 text-accent",
  dibatalkan: "bg-destructive/15 text-destructive",
};

const Bookings = () => {
  const [filter, setFilter] = useState<BookingStatus>("semua");
  const filtered = filter === "semua" ? allBookings : allBookings.filter((b) => b.status === filter);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Booking</h1>
          <p className="text-muted-foreground mt-1">Kelola semua reservasi lapangan</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Tambah Booking
        </button>
      </motion.div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {(["semua", "dikonfirmasi", "menunggu", "dibatalkan"] as BookingStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border shadow-sm overflow-x-auto"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lapangan</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tim</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Waktu</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Harga</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b, i) => (
              <motion.tr
                key={b.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-medium text-card-foreground">{b.court}</td>
                <td className="px-6 py-4 text-sm text-card-foreground">{b.team}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{b.date}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{b.time}</td>
                <td className="px-6 py-4 text-sm font-medium text-card-foreground">{b.price}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusStyles[b.status]}`}>
                    {b.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

export default Bookings;
