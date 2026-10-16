import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MessageSquare } from "lucide-react";
import { DiscussionCard } from "@/components/learning/DiscussionCard";
import {
  useDiscussionTopics,
  DISCUSSION_CATEGORIES,
} from "@/hooks/useDiscussions";

const Discussions = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const { data: topics, isLoading } = useDiscussionTopics({
    search: search || undefined,
    category: category !== "all" ? category : undefined,
  });

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Ruang Diskusi</h1>
            </div>
            <Button asChild size="sm" className="min-h-[40px]">
              <Link to="/referee/discussions/new">
                <Plus className="h-4 w-4 mr-1" />
                Buat Topik
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Diskusikan aturan dan studi kasus bersama wasit lain
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari topik diskusi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[180px] h-11">
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {DISCUSSION_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Topics List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
        ) : topics && topics.length > 0 ? (
          <div className="space-y-3">
            {topics.map((topic) => (
              <DiscussionCard key={topic.id} topic={topic} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Belum ada diskusi</h3>
            <p className="text-muted-foreground mt-1 mb-4 text-sm">
              Jadilah yang pertama memulai diskusi!
            </p>
            <Button asChild className="min-h-[44px]">
              <Link to="/referee/discussions/new">
                <Plus className="h-4 w-4 mr-2" />
                Buat Topik Baru
              </Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Discussions;
