'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowLeftRight, Archive, Loader2 } from 'lucide-react';

export default function StockPage() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [products, setProducts] = useState([]); // For dropdown
  const [formData, setFormData] = useState({
    productId: '', type: 'IN', qty: '', note: ''
  });

  const fetchMovements = async () => {
    try {
      const res = await fetch('/api/stock');
      const data = await res.json();
      setMovements(data);
    } catch (e) { console.error(e); } 
  };

  const fetchProducts = async () => {
      // Just fetch top list for now or autocomplete. Quick select for prototype.
      const res = await fetch('/api/products?limit=100');
      const data = await res.json();
      setProducts(data.products || []);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMovements(), fetchProducts()]).then(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch('/api/stock/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            setIsDialogOpen(false);
            setFormData({ productId: '', type: 'IN', qty: '', note: '' });
            fetchMovements();
        } else {
            alert('فشل العملية - تأكد من المخزون');
        }
    } catch (error) {
        console.error(error);
    }
  };

  const getTypeStyle = (type) => {
      switch(type) {
          case 'IN': return 'text-green-600 bg-green-50';
          case 'OUT': return 'text-red-600 bg-red-50';
          default: return 'text-blue-600 bg-blue-50';
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">حركة المخزون</h1>
          <p className="text-sm text-slate-500">سجل عمليات الإدخال والإخراج</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-slate-900">
               <ArrowLeftRight size={18} />
               حركة يدوية
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
             <DialogHeader>
                 <DialogTitle className="text-right">تسجيل حركة مخزون</DialogTitle>
             </DialogHeader>
             <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="space-y-2">
                     <Label>المنتج</Label>
                     <select 
                        className="w-full p-2 border rounded-md bg-white"
                        value={formData.productId}
                        onChange={e => setFormData({...formData, productId: e.target.value})}
                        required
                     >
                         <option value="">اختر المنتج...</option>
                         {products.map(p => (
                             <option key={p._id} value={p._id}>{p.name} (R:{p.stockQty})</option>
                         ))}
                     </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                         <Label>النوع</Label>
                         <select 
                            className="w-full p-2 border rounded-md bg-white"
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value})}
                         >
                             <option value="IN">إدخال (شراء/مرتجع)</option>
                             <option value="OUT">إخراج (تالف/صرف)</option>
                             <option value="ADJUST">تعديل جرد</option>
                         </select>
                     </div>
                     <div className="space-y-2">
                         <Label>الكمية</Label>
                         <Input type="number" required value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} />
                     </div>
                 </div>
                 <div className="space-y-2">
                     <Label>ملاحظات</Label>
                     <Input value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
                 </div>
                 <DialogFooter>
                     <Button type="submit">تسجيل</Button>
                 </DialogFooter>
             </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">المنتج</TableHead>
              <TableHead className="text-right">النوع</TableHead>
              <TableHead className="text-right">الكمية</TableHead>
              <TableHead className="text-right">الملاحظات</TableHead>
              <TableHead className="text-right">بواسطة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin mx-auto text-blue-500"/></TableCell></TableRow>
            ) : movements.map(m => (
                <TableRow key={m._id}>
                    <TableCell className="text-xs text-slate-500 font-mono">
                        {new Date(m.date).toLocaleString('ar-SA')}
                    </TableCell>
                    <TableCell className="font-medium">{m.productId?.name}</TableCell>
                    <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getTypeStyle(m.type)}`}>
                            {m.type === 'IN' ? 'وارد' : m.type === 'OUT' ? 'صادر' : 'تعديل'}
                        </span>
                    </TableCell>
                    <TableCell className="font-bold">{m.qty}</TableCell>
                    <TableCell className="text-sm text-slate-600">{m.note}</TableCell>
                    <TableCell className="text-xs">{m.createdBy?.name || 'النظام'}</TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
