import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, MessageSquare } from "lucide-react";
import {
  useCreateTopic,
  DISCUSSION_CATEGORIES,
} from "@/hooks/useDiscussions";
import { LOTG_CATEGORIES } from "@/hooks/useLearning";
import { toast } from "sonner";

const DiscussionNew = () => {
  const navigate = useNavigate();
  const createTopic = useCreateTopic();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [lawReference, setLawReference] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !category) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    try {
      const topic = await createTopic.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        category,
        law_reference: lawReference || undefined,
      });
      toast.success("Topik diskusi berhasil dibuat");
      navigate(`/referee/discussions/${topic.id}`);
    } catch {
      toast.error("Gagal membuat topik diskusi");
    }
  };

  return (
    <AppLayout
      title="Topik Baru"
      showBackButton
      onBack={() => navigate("/referee/discussions")}
    >
      <div className="p-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
              Buat Topik Diskusi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Judul Topik <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Contoh: Interpretasi backpass dalam futsal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  {title.length}/200 karakter
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Kategori <span className="text-destructive">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="h-11">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCUSSION_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="law">Referensi Law (Opsional)</Label>
                <Select value={lawReference} onValueChange={setLawReference}>
                  <SelectTrigger id="law" className="h-11">
                    <SelectValue placeholder="Pilih Law" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tidak ada</SelectItem>
                    {LOTG_CATEGORIES.map((cat) => (
                      <SelectItem
                        key={cat.law}
                        value={cat.law.toString()}
                      >
                        Law {cat.law}: {cat.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">
                  Isi Diskusi <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="Jelaskan topik diskusi Anda secara detail. Sertakan contoh situasi jika ada..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[160px]"
                />
                <p className="text-xs text-muted-foreground">
                  Jelaskan dengan detail agar wasit lain dapat memberikan tanggapan yang relevan
                </p>
              </div>

              {/* Sticky bottom action */}
              <div className="flex gap-3 pt-4 sticky bottom-0 bg-card pb-safe">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => navigate("/referee/discussions")}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={createTopic.isPending} className="flex-1 h-12">
                  <Send className="h-4 w-4 mr-2" />
                  {createTopic.isPending ? "Mengirim..." : "Buat Topik"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DiscussionNew;
