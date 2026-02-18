import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit } from 'lucide-react';

export default function ContentManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-content'],
    queryFn: () => base44.entities.SiteContent.list({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SiteContent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SiteContent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
    },
  });

  const [formData, setFormData] = useState({
    section: 'hero',
    title: '',
    subtitle: '',
    content: '',
    image_url: '',
  });

  const resetForm = () => {
    setFormData({
      section: 'hero',
      title: '',
      subtitle: '',
      content: '',
      image_url: '',
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      section: item.section || 'hero',
      title: item.title || '',
      subtitle: item.subtitle || '',
      content: item.content || '',
      image_url: item.image_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Contenido del Sitio</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingItem(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Contenido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Contenido' : 'Nuevo Contenido'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Sección *</Label>
                <Select
                  value={formData.section}
                  onValueChange={(value) => setFormData({ ...formData, section: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero</SelectItem>
                    <SelectItem value="about">Acerca de</SelectItem>
                    <SelectItem value="experience">Experiencia</SelectItem>
                    <SelectItem value="location">Ubicación</SelectItem>
                    <SelectItem value="contact">Contacto</SelectItem>
                    <SelectItem value="gallery">Galería</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título de la sección"
                />
              </div>

              <div>
                <Label>Subtítulo</Label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Subtítulo"
                />
              </div>

              <div>
                <Label>Contenido</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  placeholder="Contenido principal..."
                />
              </div>

              <div>
                <Label>Imagen (URL)</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingItem ? 'Guardar Cambios' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{item.title || `Sección: ${item.section}`}</CardTitle>
                  {item.subtitle && (
                    <p className="text-sm text-gray-600 mt-1">{item.subtitle}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(item)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            {item.content && (
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3">{item.content}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}