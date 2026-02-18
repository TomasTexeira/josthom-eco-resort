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
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function AccommodationsManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-accommodations'],
    queryFn: () => base44.entities.Accommodation.list({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Accommodation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accommodations'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Accommodation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accommodations'] });
      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Accommodation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accommodations'] });
    },
  });

  const [formData, setFormData] = useState({
    name: '',
    type: 'cabaña',
    capacity: 5,
    bedrooms: 1,
    bathrooms: 1,
    description: '',
    short_description: '',
    main_image: '',
    booking_url: '',
    is_featured: false,
    order: 0,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'cabaña',
      capacity: 5,
      bedrooms: 1,
      bathrooms: 1,
      description: '',
      short_description: '',
      main_image: '',
      booking_url: '',
      is_featured: false,
      order: 0,
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      type: item.type || 'cabaña',
      capacity: item.capacity || 5,
      bedrooms: item.bedrooms || 1,
      bathrooms: item.bathrooms || 1,
      description: item.description || '',
      short_description: item.short_description || '',
      main_image: item.main_image || '',
      booking_url: item.booking_url || '',
      is_featured: item.is_featured || false,
      order: item.order || 0,
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
        <h2 className="text-xl font-semibold">Gestión de Alojamientos</h2>
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
              Nuevo Alojamiento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Alojamiento' : 'Nuevo Alojamiento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Cabaña 1"
                  />
                </div>

                <div>
                  <Label>Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cabaña">Cabaña</SelectItem>
                      <SelectItem value="casa">Casa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Capacidad *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label>Habitaciones</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label>Baños</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label>Orden</Label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Imagen Principal (URL)</Label>
                  <Input
                    value={formData.main_image}
                    onChange={(e) => setFormData({ ...formData, main_image: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="col-span-2">
                  <Label>URL de Reserva Externa</Label>
                  <Input
                    value={formData.booking_url}
                    onChange={(e) => setFormData({ ...formData, booking_url: e.target.value })}
                    placeholder="https://airbnb.com/..."
                  />
                </div>

                <div className="col-span-2">
                  <Label>Descripción Corta</Label>
                  <Textarea
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Descripción Completa</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="featured">Destacado en home</Label>
                </div>
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
                  <CardTitle>{item.name}</CardTitle>
                  <div className="text-sm text-gray-600 mt-1">
                    {item.type} • {item.capacity} personas • {item.bedrooms} hab. • {item.bathrooms} baños
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      if (confirm('¿Eliminar este alojamiento?')) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {item.short_description && (
              <CardContent>
                <p className="text-sm text-gray-600">{item.short_description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}