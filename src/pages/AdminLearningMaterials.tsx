import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  Video,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminLearningMaterials,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
  useTogglePublish,
  LearningMaterialInput,
} from "@/hooks/useAdminLearning";
import {
  LOTG_CATEGORIES,
  getCategoryLabel,
  getDifficultyLabel,
  getDifficultyColor,
  LearningMaterial,
} from "@/hooks/useLearning";
import { MaterialForm } from "@/components/admin/MaterialForm";

const AdminLearningMaterials = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [publishedFilter, setPublishedFilter] = useState<string>("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<LearningMaterial | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: materials, isLoading } = useAdminLearningMaterials({
    search: search || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    is_published: publishedFilter === "all" ? undefined : publishedFilter === "published",
  });

  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const deleteMutation = useDeleteMaterial();
  const togglePublishMutation = useTogglePublish();

  const handleCreate = () => {
    setEditingMaterial(null);
    setIsFormOpen(true);
  };

  const handleEdit = (material: LearningMaterial) => {
    setEditingMaterial(material);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: LearningMaterialInput) => {
    try {
      if (editingMaterial) {
        await updateMutation.mutateAsync({ ...data, id: editingMaterial.id });
        toast.success("Materi berhasil diperbarui");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Materi berhasil dibuat");
      }
      setIsFormOpen(false);
      setEditingMaterial(null);
    } catch (error) {
      toast.error("Gagal menyimpan materi");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      toast.success("Materi berhasil dihapus");
      setDeletingId(null);
    } catch (error) {
      toast.error("Gagal menghapus materi");
    }
  };

  const handleTogglePublish = async (material: LearningMaterial) => {
    try {
      await togglePublishMutation.mutateAsync({
        id: material.id,
        is_published: !material.is_published,
      });
      toast.success(
        material.is_published ? "Materi di-unpublish" : "Materi dipublish"
      );
    } catch (error) {
      toast.error("Gagal mengubah status publish");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              Kelola Materi Pembelajaran
            </h1>
            <p className="text-muted-foreground mt-1">
              Tambah, edit, dan kelola materi LOTG Futsal
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Materi
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari materi..."
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
              {LOTG_CATEGORIES.map((cat) => (
                <SelectItem key={cat.category} value={cat.category}>
                  Law {cat.law}: {cat.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={publishedFilter} onValueChange={setPublishedFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : materials && materials.length > 0 ? (
                materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {material.title}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getCategoryLabel(material.category)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={getDifficultyColor(material.difficulty_level)}
                      >
                        {getDifficultyLabel(material.difficulty_level)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {material.video_url && (
                          <Video className="h-4 w-4 text-muted-foreground" />
                        )}
                        {material.pdf_url && (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={material.is_published ? "default" : "secondary"}
                      >
                        {material.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTogglePublish(material)}
                          title={material.is_published ? "Unpublish" : "Publish"}
                        >
                          {material.is_published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(material)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingId(material.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Belum ada materi</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? "Edit Materi" : "Tambah Materi Baru"}
              </DialogTitle>
            </DialogHeader>
            <MaterialForm
              defaultValues={editingMaterial || undefined}
              onSubmit={handleSubmit}
              onCancel={() => setIsFormOpen(false)}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Materi?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Materi akan dihapus secara permanen.
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

export default AdminLearningMaterials;
