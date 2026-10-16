import { motion } from "framer-motion";
import { MapPin, Check, X, Star } from "lucide-react";

const courts = [
  { id: 1, name: "Lapangan A", type: "Vinyl", size: "25x15m", price: "Rp 150.000/jam", available: true, rating: 4.8 },
  { id: 2, name: "Lapangan B", type: "Rumput Sintetis", size: "25x15m", price: "Rp 200.000/jam", available: false, rating: 4.9 },
  { id: 3, name: "Lapangan C", type: "Vinyl", size: "20x13m", price: "Rp 120.000/jam", available: true, rating: 4.5 },
  { id: 4, name: "Lapangan D", type: "Parquette", size: "25x15m", price: "Rp 180.000/jam", available: true, rating: 4.7 },
];

const Courts = () => {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Lapangan</h1>
        <p className="text-muted-foreground mt-1">Kelola semua lapangan futsal Anda</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courts.map((court, i) => (
          <motion.div
            key={court.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
              <MapPin className="w-16 h-16 text-primary/30" />
              <div className="absolute top-4 right-4">
                {court.available ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success text-success-foreground text-xs font-medium">
                    <Check className="w-3 h-3" /> Tersedia
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-medium">
                    <X className="w-3 h-3" /> Terpakai
                  </span>
                )}
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-card-foreground">{court.name}</h3>
                <div className="flex items-center gap-1 text-accent">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-semibold">{court.rating}</span>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>Tipe: <span className="text-card-foreground font-medium">{court.type}</span></p>
                <p>Ukuran: <span className="text-card-foreground font-medium">{court.size}</span></p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-primary">{court.price}</span>
                <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  Booking
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Courts;
