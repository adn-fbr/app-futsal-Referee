import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import { MapPin, CalendarDays, Users, DollarSign, Clock, TrendingUp } from "lucide-react";

const todayBookings = [
  { id: 1, court: "Lapangan A", team: "FC Elang", time: "08:00 - 09:00", status: "selesai" },
  { id: 2, court: "Lapangan B", team: "Garuda FC", time: "09:00 - 10:00", status: "berlangsung" },
  { id: 3, court: "Lapangan A", team: "Rajawali FC", time: "10:00 - 11:00", status: "akan datang" },
  { id: 4, court: "Lapangan C", team: "Bintang FC", time: "13:00 - 14:00", status: "akan datang" },
  { id: 5, court: "Lapangan B", team: "Thunder FC", time: "15:00 - 16:00", status: "akan datang" },
];

const statusStyles: Record<string, string> = {
  selesai: "bg-muted text-muted-foreground",
  berlangsung: "bg-primary/15 text-primary font-semibold",
  "akan datang": "bg-accent/15 text-accent-foreground",
};

const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Selamat datang di FutsalPro Management</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Lapangan"
          value={4}
          icon={<MapPin className="w-6 h-6" />}
          description="2 tersedia"
        />
        <StatCard
          title="Booking Hari Ini"
          value={5}
          icon={<CalendarDays className="w-6 h-6" />}
          trend="up"
          trendValue="20% dari kemarin"
        />
        <StatCard
          title="Tim Terdaftar"
          value={12}
          icon={<Users className="w-6 h-6" />}
          trend="up"
          trendValue="2 baru minggu ini"
        />
        <StatCard
          title="Pendapatan Bulan Ini"
          value="Rp 8.5jt"
          icon={<DollarSign className="w-6 h-6" />}
          trend="up"
          trendValue="15% dari bulan lalu"
        />
      </div>

      {/* Today's Bookings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border shadow-sm"
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-card-foreground">Jadwal Hari Ini</h2>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-primary font-medium">
            <TrendingUp className="w-4 h-4" />
            5 booking
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lapangan</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tim</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Waktu</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {todayBookings.map((booking, i) => (
                <motion.tr
                  key={booking.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-card-foreground">{booking.court}</td>
                  <td className="px-6 py-4 text-sm text-card-foreground">{booking.team}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{booking.time}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusStyles[booking.status]}`}>
                      {booking.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
