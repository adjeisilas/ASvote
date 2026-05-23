import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { databaseService } from '../../services/database';
import { Button } from '../ui/button';
import { notificationService } from '../../services/notificationService';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Image as ImageIcon, Calendar, Upload, X } from 'lucide-react';

export default function CreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'voting' as 'voting' | 'ticketing',
    commission: 10,
    startDate: '',
    endDate: '',
    coverImage: '',
    tags: '',
    // New Ticketing Fields
    venue: '',
    doorsOpen: '',
    mainEventStart: '',
    expectedEnd: '',
    organizerEmail: '',
    organizerPhone: '',
    salesStart: '',
    salesEnd: '',
    refundPolicy: '',
    maxTicketsPerUser: 10
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      const fetchEvent = async () => {
        setFetching(true);
        try {
          const data = await databaseService.getEventById(eventId);
          
          if (data) {
            setFormData({
              title: data.title || '',
              description: data.description || '',
              type: data.type || 'voting',
              commission: data.commission !== undefined ? data.commission : 10,
              startDate: data.startDate || '',
              endDate: data.endDate || '',
              coverImage: data.coverImage || '',
              tags: data.tags ? data.tags.join(', ') : '',
              // New Ticketing Fields
              venue: data.venue || '',
              doorsOpen: data.doorsOpen || '',
              mainEventStart: data.mainEventStart || '',
              expectedEnd: data.expectedEnd || '',
              organizerEmail: data.organizerEmail || '',
              organizerPhone: data.organizerPhone || '',
              salesStart: data.salesStart || '',
              salesEnd: data.salesEnd || '',
              refundPolicy: data.refundPolicy || '',
              maxTicketsPerUser: data.maxTicketsPerUser || 10
            });
            if (data.coverImage) {
              setCoverImagePreview(data.coverImage);
            }
          } else {
            toast.error("Event not found");
            navigate('/organizer');
          }
        } catch (error) {
          toast.error("Failed to fetch event details");
        } finally {
          setFetching(false);
        }
      };
      fetchEvent();
    }
  }, [eventId, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for Base64 storage
        toast.error("Image is too large. Please select an image smaller than 1MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, coverImage: base64String }));
        setCoverImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, coverImage: '' }));
    setCoverImagePreview(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.title.trim()) {
      newErrors.title = "Event title is required";
    } else if (formData.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters long";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Event description is required";
    } else if (formData.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters long to provide enough detail";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (formData.type === 'voting' && end <= start) {
        newErrors.endDate = "Voting end date must be after the start date";
      } else if (formData.type === 'ticketing' && end < start) {
        newErrors.endDate = "Event end date cannot be before the start date";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      // Validation error occurred
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form before submitting.");
      return;
    }
    
    setLoading(true);
    const tagsArray = formData.tags.split(',')
      .map(t => t.trim())
      .filter(t => t !== '');

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        coverImage: formData.coverImage,
        tags: tagsArray,
        commission: Number(formData.commission),
        venue: formData.venue,
        doorsOpen: formData.doorsOpen,
        mainEventStart: formData.mainEventStart,
        expectedEnd: formData.expectedEnd,
        organizerEmail: formData.organizerEmail,
        organizerPhone: formData.organizerPhone,
        salesStart: formData.salesStart,
        salesEnd: formData.salesEnd,
        refundPolicy: formData.refundPolicy,
        maxTicketsPerUser: Number(formData.maxTicketsPerUser),
        updated_at: new Date().toISOString()
      };

      if (eventId) {
        // Update existing event
        await databaseService.updateEvent(eventId, eventData);
        toast.success("Event updated successfully!");
      } else {
        // Create new event
        await databaseService.createEvent({
          ...eventData,
          organizer_id: user.uid,
          status: 'pending',
          total_votes: 0,
          created_at: new Date().toISOString()
        });

        // Send notification
        await notificationService.createNotification(
          user.uid,
          "Event Created",
          `Your event "${formData.title}" has been created and submitted for admin review.`,
          "info"
        );

        // Notify Admin
        await notificationService.notifyAdmin(
          "New Event Created",
          `Event: "${formData.title}" | Type: ${formData.type} | Organizer: ${user.email}`,
          "info"
        );

        toast.success(`Event ${eventId ? 'updated' : 'created'} successfully! Please add categories and participants.`);
      }
      navigate('/organizer');
    } catch (error: any) {
      toast.error(error.message || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/organizer')} className="mb-6 gap-2 text-slate-500 dark:text-slate-400">
        <ArrowLeft size={16} /> Back to Dashboard
      </Button>

      <Card className="border-none shadow-none bg-card text-card-foreground">
        <CardHeader className="border-b border-border pb-8">
          <CardTitle className="text-2xl font-bold text-foreground">
            {eventId ? 'Edit Event' : 'Create New Event'}
          </CardTitle>
          <CardDescription>
            {eventId ? 'Update the details of your event.' : 'Enter the basic details for your event. You\'ll be able to add participants or ticket tiers later.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input 
                id="title" 
                placeholder="e.g. Ghana's Best Artiste 2026" 
                value={formData.title || ''}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, title: e.target.value }));
                  if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                }}
                className={`h-11 shadow-sm ${errors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {errors.title && <p className="text-xs font-medium text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label>Event Type</Label>
              <RadioGroup 
                value={formData.type || 'voting'} 
                onValueChange={(val: any) => setFormData(prev => ({ ...prev, type: val }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex-1 bg-slate-50 dark:bg-slate-900 cursor-pointer">
                  <RadioGroupItem value="voting" id="voting" />
                  <Label htmlFor="voting" className="font-semibold cursor-pointer text-foreground">Voting Event</Label>
                </div>
                <div className="flex items-center space-x-2 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex-1 bg-slate-50 dark:bg-slate-900 cursor-pointer">
                  <RadioGroupItem value="ticketing" id="ticketing" />
                  <Label htmlFor="ticketing" className="font-semibold cursor-pointer text-foreground">Ticketing Event</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Event Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe what your event is about..." 
                className={`min-h-[120px] shadow-sm ${errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                value={formData.description || ''}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }));
                  if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                }}
              />
              {errors.description && <p className="text-xs font-medium text-red-500">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input 
                id="tags" 
                placeholder="e.g. music, conference, annual" 
                value={formData.tags || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="h-11 shadow-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Add tags to help people find your event.</p>
            </div>

            {formData.type === 'ticketing' && (
              <div className="space-y-6 pt-4 border-t border-border">
                <h3 className="text-lg font-bold text-foreground">Ticketing Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue Details (Physical Address or Virtual Link)</Label>
                  <Input 
                    id="venue" 
                    placeholder="e.g. Accra International Conference Centre" 
                    value={formData.venue}
                    onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                    className="h-11 shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizerEmail">Support Email</Label>
                    <Input 
                      id="organizerEmail" 
                      type="email"
                      placeholder="e.g. support@event.com" 
                      value={formData.organizerEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, organizerEmail: e.target.value }))}
                      className="h-11 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organizerPhone">Support Phone</Label>
                    <Input 
                      id="organizerPhone" 
                      placeholder="e.g. +233 20 000 0000" 
                      value={formData.organizerPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, organizerPhone: e.target.value }))}
                      className="h-11 shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="doorsOpen">Doors Open</Label>
                    <Input 
                      id="doorsOpen" 
                      type="time" 
                      value={formData.doorsOpen}
                      onChange={(e) => setFormData(prev => ({ ...prev, doorsOpen: e.target.value }))}
                      className="h-11 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mainEventStart">Start Time</Label>
                    <Input 
                      id="mainEventStart" 
                      type="time" 
                      value={formData.mainEventStart}
                      onChange={(e) => setFormData(prev => ({ ...prev, mainEventStart: e.target.value }))}
                      className="h-11 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedEnd">End Time</Label>
                    <Input 
                      id="expectedEnd" 
                      type="time" 
                      value={formData.expectedEnd}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedEnd: e.target.value }))}
                      className="h-11 shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salesStart">Sales Start Date</Label>
                    <Input 
                      id="salesStart" 
                      type="date" 
                      value={formData.salesStart}
                      onChange={(e) => setFormData(prev => ({ ...prev, salesStart: e.target.value }))}
                      className="h-11 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salesEnd">Sales End Date</Label>
                    <Input 
                      id="salesEnd" 
                      type="date" 
                      value={formData.salesEnd}
                      onChange={(e) => setFormData(prev => ({ ...prev, salesEnd: e.target.value }))}
                      className="h-11 shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <Label htmlFor="maxTicketsPerUser">Purchase Limit (Per User)</Label>
                    <Input 
                      id="maxTicketsPerUser" 
                      type="number"
                      value={formData.maxTicketsPerUser}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxTicketsPerUser: Number(e.target.value) }))}
                      className="h-11 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refundPolicy">Refund Policy</Label>
                    <Input 
                      id="refundPolicy" 
                      placeholder="e.g. No refunds" 
                      value={formData.refundPolicy}
                      onChange={(e) => setFormData(prev => ({ ...prev, refundPolicy: e.target.value }))}
                      className="h-11 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="startDate" 
                    type="date" 
                    className={`pl-10 h-11 shadow-sm ${errors.startDate ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    value={formData.startDate || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, startDate: e.target.value }));
                      if (errors.startDate) setErrors(prev => ({ ...prev, startDate: '' }));
                    }}
                  />
                </div>
                {errors.startDate && <p className="text-xs font-medium text-red-500">{errors.startDate}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="endDate" 
                    type="date" 
                    className={`pl-10 h-11 shadow-sm ${errors.endDate ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    value={formData.endDate || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, endDate: e.target.value }));
                      if (errors.endDate) setErrors(prev => ({ ...prev, endDate: '' }));
                    }}
                  />
                </div>
                {errors.endDate && <p className="text-xs font-medium text-red-500">{errors.endDate}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Event Cover Image</Label>
              {coverImagePreview ? (
                <div className="relative group rounded-xl overflow-hidden aspect-video border border-border">
                  <img src={coverImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm" 
                      onClick={removeImage}
                      className="gap-2"
                    >
                      <X size={16} /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Label 
                    htmlFor="coverImageInput" 
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors bg-white dark:bg-slate-950 shadow-sm"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-slate-400 dark:text-slate-500" />
                      <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">PNG, JPG or WEBP (MAX. 1MB)</p>
                    </div>
                    <input 
                      id="coverImageInput" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageChange}
                    />
                  </Label>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 shadow-none" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? 'Saving...' : (eventId ? 'Update Event' : 'Create Event')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
