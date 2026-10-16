import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOTG_CATEGORIES, LearningMaterial } from "@/hooks/useLearning";
import { LearningMaterialInput } from "@/hooks/useAdminLearning";

interface MaterialFormProps {
  defaultValues?: LearningMaterial;
  onSubmit: (data: LearningMaterialInput) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export const MaterialForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: MaterialFormProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LearningMaterialInput>({
    defaultValues: defaultValues
      ? {
          title: defaultValues.title,
          description: defaultValues.description || "",
          category: defaultValues.category,
          law_number: defaultValues.law_number || undefined,
          content: defaultValues.content,
          video_url: defaultValues.video_url || "",
          pdf_url: defaultValues.pdf_url || "",
          difficulty_level: defaultValues.difficulty_level,
          sort_order: defaultValues.sort_order,
          is_published: defaultValues.is_published,
        }
      : {
          difficulty_level: "basic",
          is_published: false,
          sort_order: 0,
        },
  });

  const category = watch("category");
  const isPublished = watch("is_published");

  const handleCategoryChange = (value: string) => {
    setValue("category", value);
    const lotgCat = LOTG_CATEGORIES.find((c) => c.category === value);
    if (lotgCat) {
      setValue("law_number", String(lotgCat.law));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Judul *</Label>
        <Input
          id="title"
          {...register("title", { required: "Judul wajib diisi" })}
          placeholder="Masukkan judul materi"
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Deskripsi singkat materi"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Kategori LOTG *</Label>
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {LOTG_CATEGORIES.map((cat) => (
                <SelectItem key={cat.category} value={cat.category}>
                  Law {cat.law}: {cat.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tingkat Kesulitan *</Label>
          <Select
            value={watch("difficulty_level")}
            onValueChange={(v) => setValue("difficulty_level", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Dasar</SelectItem>
              <SelectItem value="intermediate">Menengah</SelectItem>
              <SelectItem value="advanced">Lanjutan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Konten *</Label>
        <Textarea
          id="content"
          {...register("content", { required: "Konten wajib diisi" })}
          placeholder="Isi materi pembelajaran (mendukung Markdown)"
          rows={8}
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="video_url">URL Video (opsional)</Label>
          <Input
            id="video_url"
            {...register("video_url")}
            placeholder="https://youtube.com/..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pdf_url">URL PDF (opsional)</Label>
          <Input
            id="pdf_url"
            {...register("pdf_url")}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sort_order">Urutan</Label>
        <Input
          id="sort_order"
          type="number"
          {...register("sort_order", { valueAsNumber: true })}
          placeholder="0"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_published"
          checked={isPublished}
          onCheckedChange={(checked) => setValue("is_published", checked)}
        />
        <Label htmlFor="is_published">Publish materi</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
};
