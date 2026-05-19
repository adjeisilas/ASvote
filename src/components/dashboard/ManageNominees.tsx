import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { databaseService } from '../../services/database';
import { Category, Nominee } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft, Loader2, User, Upload, X, Settings } from 'lucide-react';
import { ConfirmationDialog } from '../ui/confirmation-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export default function ManageNominees() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [newCatPrice, setNewCatPrice] = useState('1');
  const [newCatCapacity, setNewCatCapacity] = useState('100');
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAddingNominee, setIsAddingNominee] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [nomineeFormData, setNomineeFormData] = useState({
    name: '',
    description: '',
    image: '',
    capacity: 0
  });
  const [nomineeImagePreview, setNomineeImagePreview] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'nominee', id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    if (!eventId) return;
    try {
      const eventData = await databaseService.getEventById(eventId);
      setEvent(eventData as any);

      const catsData = await databaseService.getCategories(eventId, eventData.type as any);
      setCategories(catsData || []);

      if (eventData.type === 'voting') {
        const nomsData = await databaseService.getNominees(eventId);
        setNominees(nomsData || []);
      } else {
        setNominees([]);
      }
    } catch (error) {
      console.error("Error fetching categories/nominees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!eventId) return;

    // Use specific tables based on event type if possible, or just subscribe to both
    const votingCatsSub = supabase.channel(`v_cats-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voting_categories', filter: `event_id=eq.${eventId}` }, () => fetchData())
      .subscribe();

    const ticketTiersSub = supabase.channel(`tt_tiers-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_tiers', filter: `event_id=eq.${eventId}` }, () => fetchData())
      .subscribe();

    const nomsSub = supabase.channel(`noms-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nominees', filter: `event_id=eq.${eventId}` }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(votingCatsSub);
      supabase.removeChannel(ticketTiersSub);
      supabase.removeChannel(nomsSub);
    };
  }, [eventId]);

  const addCategory = async () => {
    if (!newCatName || !eventId) return;
    const price = parseFloat(newCatPrice);
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid price.");
      return;
    }
    
    try {
      await databaseService.createCategory({
        name: newCatName,
        description: newCatDescription,
        votePrice: price,
        price: price,
        capacity: parseInt(newCatCapacity) || 0,
        eventId: eventId
      });
      setNewCatName('');
      setNewCatDescription('');
      setNewCatPrice('1');
      setNewCatCapacity('100');
      toast.success(`${isTicketing ? 'Ticket type' : 'Category'} added.`);
      fetchData();
    } catch (error) {
      console.error("Create Category Error:", error);
      toast.error("Failed to add category.");
    }
  };

  const updateCategory = async () => {
    if (!editCat || !eventId) return;
    setSubmitLoading(true);
    try {
      await databaseService.updateCategory(editCat.id, {
        name: editCat.name,
        description: editCat.description,
        votePrice: editCat.votePrice,
        price: editCat.price,
        capacity: editCat.capacity,
        eventId: eventId
      }, isTicketing ? 'ticketing' : 'voting');
      toast.success(`${isTicketing ? 'Ticket type' : 'Category'} updated.`);
      setIsEditingCat(false);
      fetchData();
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update category.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenAddNominee = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    setNomineeFormData({ name: '', description: '', image: '', capacity: 0 });
    setNomineeImagePreview(null);
    setIsAddingNominee(true);
  };

  const handleNomineeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 512) { // 500KB limit for Base64 storage
        toast.error("Image is too large. Max 500KB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setNomineeFormData(prev => ({ ...prev, image: base64String }));
        setNomineeImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNomineeSubmit = async () => {
    if (!nomineeFormData.name) {
      toast.error("Please enter a name.");
      return;
    }
    if (!activeCategoryId || !eventId) {
      console.warn("Missing activeCategoryId or eventId", { activeCategoryId, eventId });
      toast.error("Internal selection error. Please try clicking 'Add' again.");
      return;
    }

    setSubmitLoading(true);
    try {
      // Find category prefix consistently
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      // Sort categories by created_at to ensure consistent prefix assignment if possible
      const sortedCats = [...categories].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA && timeB) return timeA - timeB;
        return a.id.localeCompare(b.id); // Fallback to ID sorting
      });
      const catIndex = sortedCats.findIndex(c => c.id === activeCategoryId);
      const prefix = alphabet[catIndex % 26] || 'X';

      // Generate unique code with prefix + 3 digits
      let code = '';
      let isUnique = false;
      let attempts = 0;
      
      // Get all existing codes for this event to ensure uniqueness
      const existingCodes = nominees.map(n => n.code);
      
      while (!isUnique && attempts < 100) {
        // Generate 3 random digits (100-999)
        const digits = Math.floor(100 + Math.random() * 900).toString();
        const potentialCode = `${prefix}${digits}`;
        
        if (!existingCodes.includes(potentialCode)) {
          code = potentialCode;
          isUnique = true;
        }
        attempts++;
      }

      if (!code) {
        // Fallback
        code = `${prefix}${Math.floor(100 + Math.random() * 900).toString().slice(0, 3)}`;
      }
      
      const nomineeData = {
        name: nomineeFormData.name,
        description: nomineeFormData.description,
        imageUrl: nomineeFormData.image,
        capacity: (nomineeFormData as any).capacity || 0,
        code,
        categoryId: activeCategoryId,
        eventId: eventId,
        vote_count: 0
      };

      await databaseService.createNominee(nomineeData);
      
      toast.success(`${isTicketing ? 'Option' : 'Nominee'} added with code ${code}.`);
      setIsAddingNominee(false);
      
      // Refresh data after a small delay to ensure DB catch-up
      setTimeout(() => fetchData(), 500);
    } catch (error: any) {
      console.error("Nominee creation error:", error);
      toast.error(error.message || `Failed to add ${isTicketing ? 'option' : 'nominee'}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClick = (type: 'category' | 'nominee', id: string, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || !eventId) return;

    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'category') {
        const type = (event as any)?.type || 'voting';
        await databaseService.deleteCategory(itemToDelete.id, type as any);
      } else {
        await databaseService.deleteNominee(itemToDelete.id);
      }
      toast.success(`${itemToDelete.type} deleted.`);
      setItemToDelete(null);
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || `Failed to delete ${itemToDelete.type}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading...</div>;

  const isTicketing = (event as any)?.type === 'ticketing';

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate('/organizer')} className="mb-4 md:mb-6 gap-2 -ml-2 h-8">
        <ArrowLeft size={14} /> Back to Dashboard
      </Button>
      
      <div className="flex flex-col gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">{isTicketing ? 'Manage Tickets' : 'Manage Content'}</h1>
        <div className="flex flex-col gap-3 w-full bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                {isTicketing ? 'Ticket Package/Section' : 'Category Name'}
              </Label>
              <Input 
                placeholder={isTicketing ? "e.g. VIP Tables" : "e.g. Best Artist"} 
                value={newCatName} 
                onChange={e => setNewCatName(e.target.value)}
                className="w-full h-10"
              />
            </div>
            <div className="flex-grow sm:flex-[2_2_0%]">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                Description (Optional)
              </Label>
              <Input 
                placeholder={isTicketing ? "e.g. Includes exclusive lounge access" : "Brief description..."} 
                value={newCatDescription} 
                onChange={e => setNewCatDescription(e.target.value)}
                className="w-full h-10"
              />
            </div>
            <div className="w-full sm:w-28">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                {isTicketing ? 'Ticket Price' : 'Price (GHS)'}
              </Label>
              <Input 
                type="number"
                placeholder="1.00" 
                value={newCatPrice} 
                onChange={e => setNewCatPrice(e.target.value)}
                className="w-full h-10"
              />
            </div>
            {isTicketing && (
              <div className="w-full sm:w-32">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Capacity</Label>
                <Input 
                  type="number"
                  placeholder="100" 
                  value={newCatCapacity} 
                  onChange={e => setNewCatCapacity(e.target.value)}
                  className="w-full h-10"
                />
              </div>
            )}
          </div>
          <Button onClick={addCategory} className="bg-indigo-600 w-full h-10 shadow-sm shadow-indigo-100">
            <Plus size={16} className="mr-1" /> {isTicketing ? 'Add Ticket Type' : 'Add Category'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {categories.map(cat => (
          <Card key={cat.id} className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 md:px-6 py-3 md:py-4 gap-3">
              <div>
                <CardTitle className="text-base md:text-lg font-bold text-slate-900">{cat.name}</CardTitle>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-0.5">
                  {cat.price ?? cat.votePrice ?? 0} GHS PER {isTicketing ? 'TICKET' : 'VOTE'} {isTicketing && `• ${(cat.soldCount ?? 0)}/${(cat.capacity ?? 0)} SOLD`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isTicketing && (
                  <Button variant="outline" size="sm" onClick={() => handleOpenAddNominee(cat.id)} className="h-8 md:h-9 flex-1 sm:flex-none px-3 md:px-4 border-indigo-100 text-indigo-700 hover:bg-white text-[11px] md:text-sm">
                    <Plus size={14} className="mr-1.5 md:mr-2" /> <span className="sm:hidden lg:inline">Add </span>
                    Nominee
                  </Button>
                )}
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-slate-400 hover:text-indigo-600 hover:bg-white" onClick={() => {
                    setEditCat({...cat});
                    setIsEditingCat(true);
                  }}>
                    <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-red-400 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteClick('category', cat.id, cat.name)}>
                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className={isTicketing ? "px-4 md:px-6 py-4 md:py-6" : "p-0"}>
              {isTicketing ? (
                <div className="space-y-4">
                  {cat.description && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-500 text-sm">
                      "{cat.description}"
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     <div className="p-3 bg-white border border-slate-100 rounded-lg">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Status</p>
                        <p className="text-xs font-bold text-slate-900">
                          {(cat.soldCount ?? 0) >= (cat.capacity ?? 0) ? 'Sold Out' : 'Active'}
                        </p>
                     </div>
                     <div className="p-3 bg-white border border-slate-100 rounded-lg">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Inventory</p>
                        <p className="text-xs font-bold text-slate-900">{cat.capacity} Total</p>
                     </div>
                     <div className="p-3 bg-white border border-slate-100 rounded-lg">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Price</p>
                        <p className="text-xs font-bold text-slate-900">{cat.price} GHS</p>
                     </div>
                  </div>
                </div>
              ) : (
                <>
                <div className="divide-y divide-slate-100">
                  {nominees.filter(n => n.categoryId === cat.id || (n as any).category_id === cat.id).map(nominee => (
                    <div key={nominee.id} className="flex justify-between items-center p-3 md:p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 overflow-hidden shrink-0">
                          {nominee.imageUrl ? (
                            <img src={nominee.imageUrl} alt={nominee.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 md:w-5 md:h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm md:text-base truncate">{nominee.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                            <span className="text-[9px] md:text-[10px] font-bold bg-slate-100 px-1.5 md:px-2 py-0.5 rounded text-slate-600 tracking-wider">CODE: {nominee.code}</span>
                            <span className="text-[9px] md:text-[10px] font-bold bg-indigo-100 px-1.5 md:px-2 py-0.5 rounded text-indigo-700">
                               {nominee.voteCount} Votes
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0" onClick={() => handleDeleteClick('nominee', nominee.id, nominee.name)}>
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {nominees.filter(n => n.categoryId === cat.id).length === 0 && (
                  <div className="text-center py-8 md:py-12 px-4">
                    <p className="text-slate-400 text-xs md:text-sm italic">No nominees in this category.</p>
                    <Button variant="link" size="sm" onClick={() => handleOpenAddNominee(cat.id)} className="text-indigo-600 font-semibold mt-1 h-auto p-0">
                      Add the first nominee
                    </Button>
                  </div>
                )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">No categories created yet</h3>
            <p className="text-slate-500 mt-1">{isTicketing ? "Create a ticket group to start adding options." : "Create a category to start adding nominees."}</p>
          </div>
        )}
      </div>

      <Dialog open={isEditingCat} onOpenChange={setIsEditingCat}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isTicketing ? 'Edit Ticket Category' : 'Edit Category'}</DialogTitle>
            <DialogDescription>
              {isTicketing ? 'Update the name and pricing for this ticket group.' : 'Update the name and voting price for this category.'}
            </DialogDescription>
          </DialogHeader>
          {editCat && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editName">Category Name</Label>
                <Input
                  id="editName"
                  value={editCat.name || ''}
                  onChange={(e) => setEditCat({...editCat, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editDescription">Description</Label>
                <Input
                  id="editDescription"
                  value={editCat.description || ''}
                  onChange={(e) => setEditCat({...editCat, description: e.target.value})}
                  placeholder="Optional description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editPrice">{isTicketing ? 'Ticket Price (GHS)' : 'Vote Price (GHS)'}</Label>
                <Input
                  id="editPrice"
                  type="number"
                  value={(isTicketing ? editCat.price : editCat.votePrice) ?? 0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (isTicketing) {
                      setEditCat({...editCat, price: val});
                    } else {
                      setEditCat({...editCat, votePrice: val});
                    }
                  }}
                />
              </div>
              {isTicketing && (
                <div className="grid gap-2">
                  <Label htmlFor="editCapacity">Capacity</Label>
                  <Input
                    id="editCapacity"
                    type="number"
                    value={editCat.capacity ?? 100}
                    onChange={(e) => setEditCat({...editCat, capacity: parseInt(e.target.value) || 0})}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingCat(false)}>Cancel</Button>
            <Button onClick={updateCategory} disabled={submitLoading} className="bg-indigo-600">
              {submitLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingNominee} onOpenChange={setIsAddingNominee}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isTicketing ? 'Add New Ticket Option' : 'Add New Nominee'}</DialogTitle>
            <DialogDescription>
              {isTicketing ? 'Specify the details for this ticket type.' : 'Enter the details of the nominee for this category.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <Label htmlFor="image" className="block">{isTicketing ? 'Tier Visual (Optional)' : 'Nominee Image'}</Label>
              {nomineeImagePreview ? (
                <div className="relative w-32 h-32 mx-auto rounded-xl overflow-hidden border-2 border-slate-100 shadow-sm group">
                  <img src={nomineeImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => {
                        setNomineeImagePreview(null);
                        setNomineeFormData(prev => ({ ...prev, image: '' }));
                    }}
                    className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="text-white" size={24} />
                  </button>
                </div>
              ) : (
                <Label 
                  htmlFor="nomineeImageInput" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors bg-white"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-slate-400" />
                    <p className="text-xs text-slate-500">Click to upload photo</p>
                  </div>
                  <input 
                    id="nomineeImageInput" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleNomineeImageChange}
                  />
                </Label>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">{isTicketing ? 'Tier Name' : 'Full Name'}</Label>
              <Input
                id="name"
                placeholder={isTicketing ? "e.g. VIP Front row" : "e.g. John Doe"}
                value={nomineeFormData.name || ''}
                onChange={(e) => setNomineeFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">{isTicketing ? 'Features / Benefits' : 'Short Bio (Optional)'}</Label>
              <Input
                id="description"
                placeholder={isTicketing ? "e.g. Includes exclusive lounge access" : "Brief description..."}
                value={nomineeFormData.description || ''}
                onChange={(e) => setNomineeFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            {isTicketing && (
              <div className="grid gap-2">
                <Label htmlFor="nomCapacity">Inventory / Tickets for this option</Label>
                <Input
                  id="nomCapacity"
                  type="number"
                  placeholder="e.g. 50"
                  value={(nomineeFormData as any).capacity || ''}
                  onChange={(e) => setNomineeFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingNominee(false)}>Cancel</Button>
            <Button onClick={handleAddNomineeSubmit} disabled={submitLoading} className="bg-indigo-600">
              {submitLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isTicketing ? 'Save Option' : 'Save Nominee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete ${itemToDelete?.type}`}
        description={`Are you sure you want to delete the ${itemToDelete?.type} "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText={`Delete ${itemToDelete?.type}`}
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
