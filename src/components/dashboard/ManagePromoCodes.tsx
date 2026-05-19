import React, { useState, useEffect } from 'react';
import { databaseService } from '../../services/database';
import { PromoCode, Event } from '../../types';
import { 
  Plus, 
  Trash2, 
  Search, 
  Ticket, 
  Calendar, 
  Tag, 
  Percent, 
  Coins,
  Loader2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';

export default function ManagePromoCodes() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // New Promo Code Form
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    usageLimit: '',
    expiryDate: '',
    isActive: true
  });

  const fetchPromoCodes = async () => {
    if (!eventId) return;
    try {
      const data = await databaseService.getPromoCodes(eventId);
      setPromoCodes(data);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
    }
  };

  const fetchEvent = async () => {
    if (!eventId) return;
    try {
      const data = await databaseService.getEventById(eventId);
      setEvent(data);
    } catch (error) {
      console.error("Error fetching event:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchEvent(), fetchPromoCodes()]);
      setLoading(false);
    };
    init();
  }, [eventId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    if (!formData.code || !formData.discountValue) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsCreating(true);
    try {
      await databaseService.createPromoCode({
        eventId,
        code: formData.code.toUpperCase().trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
        expiryDate: formData.expiryDate || undefined,
        isActive: formData.isActive,
        usageCount: 0
      });
      
      toast.success("Promo code created successfully!");
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        usageLimit: '',
        expiryDate: '',
        isActive: true
      });
      fetchPromoCodes();
    } catch (error: any) {
      toast.error(error.message || "Failed to create promo code");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;
    try {
      await databaseService.deletePromoCode(id);
      toast.success("Promo code deleted");
      fetchPromoCodes();
    } catch (error) {
      toast.error("Failed to delete promo code");
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/organizer')} className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Promo Codes</h1>
            <p className="text-slate-500 font-medium text-sm">{event?.title}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-none shadow-xl shadow-slate-100 sticky top-24">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Plus className="text-indigo-600" size={18} />
                Create New
              </CardTitle>
              <CardDescription>Add a discount code for your event.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-xs font-black uppercase text-slate-400">Promo Code</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="code" 
                      placeholder="E.G. EARLYBIRD25" 
                      className="font-bold uppercase tracking-widest h-11"
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setFormData({ ...formData, code: Math.random().toString(36).substring(2, 8).toUpperCase() })}
                      className="h-11 font-bold shrink-0"
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400">Discount Type</Label>
                    <Select 
                      value={formData.discountType} 
                      onValueChange={(val: any) => setFormData({...formData, discountType: val})}
                    >
                      <SelectTrigger className="font-bold h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage" className="font-bold">Percentage (%)</SelectItem>
                        <SelectItem value="fixed" className="font-bold">Fixed (GHS)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value" className="text-xs font-black uppercase text-slate-400">Value</Label>
                    <Input 
                      id="value" 
                      type="number" 
                      placeholder={formData.discountType === 'percentage' ? '25' : '10'} 
                      className="font-bold h-11"
                      value={formData.discountValue}
                      onChange={e => setFormData({...formData, discountValue: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage" className="text-xs font-black uppercase text-slate-400">Usage Limit (Optional)</Label>
                  <Input 
                    id="usage" 
                    type="number" 
                    placeholder="Unlimited if empty" 
                    className="font-bold h-11"
                    value={formData.usageLimit}
                    onChange={e => setFormData({...formData, usageLimit: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry" className="text-xs font-black uppercase text-slate-400">Expiry Date (Optional)</Label>
                  <Input 
                    id="expiry" 
                    type="date" 
                    className="font-bold h-11"
                    value={formData.expiryDate}
                    onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t border-slate-100">
                  <Label htmlFor="active" className="text-xs font-black uppercase text-slate-400">Active Status</Label>
                  <Switch 
                     id="active"
                     checked={formData.isActive}
                     onCheckedChange={checked => setFormData({...formData, isActive: checked})}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-slate-900 font-black h-12 rounded-xl mt-4"
                  disabled={isCreating}
                >
                  {isCreating ? <Loader2 className="animate-spin" size={18} /> : 'GENERATE CODE'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* List View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promoCodes.length > 0 ? (
              promoCodes.map((promo) => (
                <Card key={promo.id} className="border-none shadow-md overflow-hidden hover:shadow-lg transition-all group">
                   <div className={`h-1.5 w-full ${promo.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                   <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                           <div className="bg-indigo-50 p-2 rounded-lg">
                             <Tag className="text-indigo-600" size={16} />
                           </div>
                           <h4 className="font-black text-xl tracking-widest text-slate-900 uppercase">
                             {promo.code}
                           </h4>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(promo.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="flex gap-4">
                           <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Discount</span>
                              <div className="flex items-center gap-1 font-bold text-slate-900">
                                {promo.discountType === 'percentage' ? (
                                  <><Percent size={14} className="text-indigo-500" /> {promo.discountValue}%</>
                                ) : (
                                  <><Coins size={14} className="text-emerald-500" /> {promo.discountValue} GHS</>
                                )}
                              </div>
                           </div>
                           <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Redemptions</span>
                              <div className="flex items-center gap-1 font-bold text-slate-900">
                                <Ticket size={14} className="text-slate-400" /> 
                                {promo.usageCount}
                                {promo.usageLimit ? <span className="text-slate-400 text-xs font-medium ml-1">/ {promo.usageLimit}</span> : null}
                              </div>
                           </div>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <div className={`flex items-center gap-1.5 font-bold ${promo.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {promo.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                            {promo.isActive ? 'Active' : 'Inactive'}
                          </div>
                          {promo.expiryDate && (
                            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                               <Calendar size={14} />
                               Exp: {format(new Date(promo.expiryDate), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                   </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                 <Tag size={48} className="opacity-10 mb-4" />
                 <h3 className="font-bold text-slate-900 mb-1">No Promo Codes Yet</h3>
                 <p className="text-sm">Create your first discount code to boost sales.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
