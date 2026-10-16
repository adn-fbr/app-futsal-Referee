import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Save, Trash2, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAssignmentTemplates,
  useSaveAssignmentTemplate,
  useDeleteAssignmentTemplate,
  useApplyTemplate,
  type AssignmentTemplate,
} from "@/hooks/useSmartAssignment";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedReferees: { refereeId: string; name: string; role: "UTAMA" | "CADANGAN" }[];
}

export function SaveTemplateDialog({
  open,
  onOpenChange,
  selectedReferees,
}: SaveTemplateDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");

  const saveMutation = useSaveAssignmentTemplate();

  const handleSave = async () => {
    if (!name.trim() || selectedReferees.length === 0 || !user) return;

    await saveMutation.mutateAsync({
      name: name.trim(),
      description: description.trim() || null,
      category: category || null,
      referees: selectedReferees.map((r) => ({
        referee_id: r.refereeId,
        role: r.role,
      })),
      created_by: user.id,
    });

    setName("");
    setDescription("");
    setCategory("");
    onOpenChange(false);
  };

  const categories = [
    "Liga 1",
    "Liga 2",
    "Liga 3",
    "Pro Futsal League",
    "Piala Indonesia",
    "Turnamen Provinsi",
    "Turnamen Kabupaten",
    "Turnamen Lokal",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Simpan sebagai Template
          </DialogTitle>
          <DialogDescription>
            Simpan susunan wasit ini sebagai template untuk digunakan di event lain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Template *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Tim Wasit Liga 1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori Event</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori (opsional)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi template (opsional)"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Wasit dalam Template ({selectedReferees.length})</Label>
            <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-1">
              {selectedReferees.map((ref) => (
                <div key={ref.refereeId} className="flex items-center justify-between text-sm">
                  <span>{ref.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {ref.role}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || selectedReferees.length === 0 || saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Simpan Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ApplyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onApply: (template: AssignmentTemplate) => void;
}

export function ApplyTemplateDialog({
  open,
  onOpenChange,
  eventId,
  onApply,
}: ApplyTemplateDialogProps) {
  const { data: templates, isLoading } = useAssignmentTemplates();
  const deleteMutation = useDeleteAssignmentTemplate();
  const applyMutation = useApplyTemplate();

  const handleApply = async (template: AssignmentTemplate) => {
    await applyMutation.mutateAsync({ eventId, template });
    onOpenChange(false);
  };

  const handleDelete = async (templateId: string) => {
    await deleteMutation.mutateAsync(templateId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Template Penugasan
          </DialogTitle>
          <DialogDescription>
            Pilih template untuk diterapkan ke event ini.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat template...
            </div>
          ) : !templates?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Belum ada template tersimpan</p>
              <p className="text-xs mt-1">
                Pilih beberapa wasit dan simpan sebagai template
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <Card key={template.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{template.name}</h4>
                          {template.category && (
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {template.referees.length} wasit
                          </span>
                          <span>
                            {format(new Date(template.created_at), "d MMM yyyy", {
                              locale: idLocale,
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApply(template)}
                          disabled={applyMutation.isPending}
                        >
                          Terapkan
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
