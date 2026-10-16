import { motion } from "framer-motion";
import { Users, UserPlus, Shield } from "lucide-react";

const teams = [
  {
    id: 1,
    name: "FC Elang",
    captain: "Ahmad Rizky",
    players: 10,
    wins: 8,
    losses: 2,
    color: "from-primary/20 to-primary/5",
  },
  {
    id: 2,
    name: "Garuda FC",
    captain: "Budi Santoso",
    players: 12,
    wins: 6,
    losses: 4,
    color: "from-accent/20 to-accent/5",
  },
  {
    id: 3,
    name: "Rajawali FC",
    captain: "Dian Permana",
    players: 8,
    wins: 5,
    losses: 5,
    color: "from-primary/20 to-primary/5",
  },
  {
    id: 4,
    name: "Bintang FC",
    captain: "Eko Prasetyo",
    players: 11,
    wins: 9,
    losses: 1,
    color: "from-accent/20 to-accent/5",
  },
  {
    id: 5,
    name: "Thunder FC",
    captain: "Fajar Nugroho",
    players: 9,
    wins: 4,
    losses: 6,
    color: "from-primary/20 to-primary/5",
  },
  {
    id: 6,
    name: "Meteor FC",
    captain: "Gilang Ramadhan",
    players: 10,
    wins: 7,
    losses: 3,
    color: "from-accent/20 to-accent/5",
  },
];

const Teams = () => {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tim & Pemain</h1>
          <p className="text-muted-foreground mt-1">Kelola tim dan daftar pemain</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
          <UserPlus className="w-4 h-4" /> Tambah Tim
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team, i) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className={`h-24 bg-gradient-to-br ${team.color} flex items-center justify-center`}>
              <Shield className="w-12 h-12 text-primary/30" />
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold text-card-foreground">{team.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">Kapten: {team.captain}</p>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="bg-muted rounded-lg p-2">
                  <p className="text-lg font-bold text-card-foreground">{team.players}</p>
                  <p className="text-xs text-muted-foreground">Pemain</p>
                </div>
                <div className="bg-success/10 rounded-lg p-2">
                  <p className="text-lg font-bold text-success">{team.wins}</p>
                  <p className="text-xs text-muted-foreground">Menang</p>
                </div>
                <div className="bg-destructive/10 rounded-lg p-2">
                  <p className="text-lg font-bold text-destructive">{team.losses}</p>
                  <p className="text-xs text-muted-foreground">Kalah</p>
                </div>
              </div>

              <button className="mt-4 w-full py-2 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
                <Users className="w-4 h-4" /> Lihat Detail
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Teams;
