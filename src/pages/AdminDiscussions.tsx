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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MessageSquare,
  MoreVertical,
  Pin,
  PinOff,
  Lock,
  Unlock,
  Trash2,
  Eye,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
  useDiscussionTopics,
  useDeleteTopic,
  useTogglePinTopic,
  useToggleLockTopic,
  DISCUSSION_CATEGORIES,
  getCategoryLabel,
  getCategoryColor,
  DiscussionTopic,
} from "@/hooks/useDiscussions";

const AdminDiscussions = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: topics, isLoading } = useDiscussionTopics({
    search: search || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });

  const deleteMutation = useDeleteTopic();
  const togglePinMutation = useTogglePinTopic();
  const toggleLockMutation = useToggleLockTopic();

  const handleTogglePin = async (topic: DiscussionTopic) => {
    try {
      await togglePinMutation.mutateAsync({
        topicId: topic.id,
        isPinned: !topic.is_pinned,
      });
      toast.success(topic.is_pinned ? "Topik di-unpin" : "Topik di-pin");
    } catch (error) {
      toast.error("Gagal mengubah status pin");
    }
  };

  const handleToggleLock = async (topic: DiscussionTopic) => {
    try {
      await toggleLockMutation.mutateAsync({
        topicId: topic.id,
        isLocked: !topic.is_locked,
      });
      toast.success(topic.is_locked ? "Topik dibuka" : "Topik dikunci");
    } catch (error) {
      toast.error("Gagal mengubah status kunci");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      toast.success("Topik berhasil dihapus");
      setDeletingId(null);
    } catch (error) {
      toast.error("Gagal menghapus topik");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-7 w-7 text-primary" />
              Moderasi Forum Diskusi
            </h1>
            <p className="text-muted-foreground mt-1">
              Kelola dan moderasi topik diskusi
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari topik..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Kategori" />
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Topik</p>
            <p className="text-2xl font-bold">{topics?.length || 0}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Topik Pinned</p>
            <p className="text-2xl font-bold">
              {topics?.filter((t) => t.is_pinned).length || 0}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Topik Terkunci</p>
            <p className="text-2xl font-bold">
              {topics?.filter((t) => t.is_locked).length || 0}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Balasan</p>
            <p className="text-2xl font-bold">
              {topics?.reduce((sum, t) => sum + (t.replies_count || 0), 0) || 0}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topik</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Author</TableHead>
                <TableHead className="text-center">Balasan</TableHead>
                <TableHead className="text-center">Views</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : topics && topics.length > 0 ? (
                topics.map((topic) => (
                  <TableRow key={topic.id}>
                    <TableCell className="font-medium max-w-[250px]">
                      <div className="flex items-center gap-2">
                        {topic.is_pinned && (
                          <Pin className="h-3 w-3 text-primary shrink-0" />
                        )}
                        {topic.is_locked && (
                          <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate">{topic.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={getCategoryColor(topic.category)}
                      >
                        {getCategoryLabel(topic.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {topic.author?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {topic.replies_count || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="h-3 w-3" />
                        {topic.views_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {topic.is_pinned && (
                          <Badge variant="secondary" className="text-xs">
                            Pinned
                          </Badge>
                        )}
                        {topic.is_locked && (
                          <Badge variant="outline" className="text-xs">
                            Locked
                          </Badge>
                        )}
                        {!topic.is_pinned && !topic.is_locked && (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(topic.created_at), {
                        addSuffix: true,
                        locale: id,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/referee/discussions/${topic.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat Detail
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePin(topic)}>
                            {topic.is_pinned ? (
                              <>
                                <PinOff className="h-4 w-4 mr-2" />
                                Unpin
                              </>
                            ) : (
                              <>
                                <Pin className="h-4 w-4 mr-2" />
                                Pin Topik
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleLock(topic)}>
                            {topic.is_locked ? (
                              <>
                                <Unlock className="h-4 w-4 mr-2" />
                                Buka Kunci
                              </>
                            ) : (
                              <>
                                <Lock className="h-4 w-4 mr-2" />
                                Kunci Topik
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingId(topic.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Belum ada topik diskusi</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Topik?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Topik dan semua balasannya akan
                dihapus secara permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default AdminDiscussions;
