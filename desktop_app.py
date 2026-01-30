import tkinter as tk
from tkinter import ttk, messagebox
import requests
import json
from datetime import datetime
import threading

# Configuration
BASE_URL = "http://localhost:3000"

class FinanceApp(tk.Tk):
    def __init__(self):
        super().__init__()
        
        self.title("نظام الإدارة المتكامل - نسخة سطح المكتب")
        self.geometry("1200x800")
        self.minsize(1000, 700)
        
        # Application state
        self.session = requests.Session()
        self.user_data = None
        self.current_view = None
        
        # Define modern styles
        self.setup_styles()
        
        # Root container
        self.main_container = ttk.Frame(self, style="Main.TFrame")
        self.main_container.pack(fill="both", expand=True)
        
        self.show_login()

    def setup_styles(self):
        style = ttk.Style()
        style.theme_use('clam')
        
        # Palette
        self.colors = {
            "bg": "#121212",
            "sidebar_bg": "#1e1e1e",
            "card_bg": "#252525",
            "fg": "#e0e0e0",
            "accent": "#3b82f6",
            "success": "#10b981",
            "danger": "#ef4444",
            "warning": "#f59e0b",
            "muted": "#888888"
        }
        
        self.configure(bg=self.colors["bg"])
        
        style.configure("Main.TFrame", background=self.colors["bg"])
        style.configure("Sidebar.TFrame", background=self.colors["sidebar_bg"])
        style.configure("TLabel", background=self.colors["bg"], foreground=self.colors["fg"], font=("Segoe UI", 10))
        style.configure("Header.TLabel", font=("Segoe UI", 20, "bold"), foreground=self.colors["accent"])
        style.configure("Card.TFrame", background=self.colors["card_bg"], relief="flat")
        style.configure("CardTitle.TLabel", background=self.colors["card_bg"], font=("Segoe UI", 9), foreground=self.colors["muted"])
        style.configure("CardValue.TLabel", background=self.colors["card_bg"], font=("Segoe UI", 16, "bold"), foreground=self.colors["fg"])
        
        # Navigation Buttons
        style.configure("Nav.TButton", font=("Segoe UI", 11), foreground=self.colors["fg"], background=self.colors["sidebar_bg"], borderwidth=0)
        style.map("Nav.TButton", 
                  background=[("active", self.colors["accent"]), ("selected", self.colors["accent"])],
                  foreground=[("active", "white"), ("selected", "white")])
        
        # Standard Buttons
        style.configure("Primary.TButton", font=("Segoe UI", 10, "bold"), foreground="white", background=self.colors["accent"])
        style.map("Primary.TButton", background=[("active", "#2563eb")])
        
        style.configure("Success.TButton", font=("Segoe UI", 10, "bold"), foreground="white", background=self.colors["success"])
        style.map("Success.TButton", background=[("active", "#059669")])
        
        style.configure("Danger.TButton", font=("Segoe UI", 10, "bold"), foreground="white", background=self.colors["danger"])
        style.map("Danger.TButton", background=[("active", "#dc2626")])

        # Treeview (Table)
        style.configure("Treeview", 
                        background=self.colors["card_bg"], 
                        foreground=self.colors["fg"], 
                        fieldbackground=self.colors["card_bg"],
                        rowheight=35,
                        font=("Segoe UI", 9))
        style.configure("Treeview.Heading", background="#3d3d3d", foreground=self.colors["fg"], font=("Segoe UI", 10, "bold"))
        style.map("Treeview", background=[('selected', self.colors["accent"])])

    def show_login(self):
        if self.current_view: self.current_view.destroy()
        self.current_view = LoginFrame(self.main_container, self)
        self.current_view.pack(fill="both", expand=True)

    def show_main_interface(self):
        if self.current_view: self.current_view.destroy()
        self.layout = ttk.Frame(self.main_container, style="Main.TFrame")
        self.layout.pack(fill="both", expand=True)
        self.sidebar = Sidebar(self.layout, self)
        self.sidebar.pack(side="right", fill="y")
        self.content_area = ttk.Frame(self.layout, style="Main.TFrame")
        self.content_area.pack(side="left", fill="both", expand=True)
        self.switch_view(DashboardView)

    def switch_view(self, view_class):
        for widget in self.content_area.winfo_children(): widget.destroy()
        self.current_view = view_class(self.content_area, self)
        self.current_view.pack(fill="both", expand=True)

    def api_request(self, method, endpoint, **kwargs):
        try:
            url = f"{BASE_URL}{endpoint}"
            response = self.session.request(method, url, **kwargs)
            
            if response.status_code == 401:
                print("Unauthorized - please login again")
                return None
                
            response.raise_for_status()
            if response.content:
                data = response.json()
                # If wrapped in common API handler format { success, data, message }
                if isinstance(data, dict) and "success" in data:
                    if not data.get("success"):
                        print(f"API Logic Error: {data.get('message')}")
                        return None
                    return data.get("data", data)
                return data
            return True
        except Exception as e:
            msg = f"API Error: {e}"
            if hasattr(e, 'response') and e.response is not None:
                try: 
                    err_data = e.response.json()
                    msg = err_data.get('message', err_data.get('error', msg))
                except: pass
            print(msg)
            return None

    def print_receipt(self, invoice):
        try:
            filename = f"receipt_{invoice.get('number', 'draft')}.txt"
            content = f"""
========================================
         {self.user_data.get('name', 'NKL System')}
========================================
رقم الفاتورة: {invoice.get('number', 'مسودة')}
التاريخ: {invoice.get('createdAt', datetime.now().isoformat())[:10]}
العميل: {invoice.get('customerName', invoice.get('customer', {}).get('name', 'عميل نقدي'))}
----------------------------------------
البيان          الكمية    السعر    الإجمالي
----------------------------------------
"""
            items = invoice.get('items', [])
            for item in items:
                name = (item.get('name') or 'صنف')[:15].ljust(15)
                qty = str(item.get('qty')).center(8)
                price = f"{item.get('unitPrice', 0):,}".center(8)
                total = f"{(item.get('qty', 0) * item.get('unitPrice', 0)):,}".rjust(8)
                content += f"{name} {qty} {price} {total}\n"
            
            content += f"""----------------------------------------
الإجمالي: {invoice.get('total', 0):,} ج.م
المدفوع:  {invoice.get('paidAmount', 0):,} ج.م
المتبقي:  {(invoice.get('total', 0) - invoice.get('paidAmount', 0)):,} ج.م
----------------------------------------
شكراً لتعاملكم معنا
========================================
"""
            with open(filename, "w", encoding="utf-8") as f:
                f.write(content)
            
            import os
            os.startfile(filename)
        except Exception as e:
            messagebox.showerror("خطأ في الطباعة", str(e))

class Sidebar(ttk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent, style="Sidebar.TFrame", width=220)
        self.controller = controller
        self.pack_propagate(False)
        profile = ttk.Frame(self, style="Sidebar.TFrame", padding=20)
        profile.pack(fill="x")
        user = self.controller.user_data or {}
        ttk.Label(profile, text=user.get("name", "User"), font=("Segoe UI", 12, "bold"), background=self.controller.colors["sidebar_bg"]).pack()
        ttk.Label(profile, text=user.get("role", "Guest"), font=("Segoe UI", 9), foreground=self.controller.colors["muted"], background=self.controller.colors["sidebar_bg"]).pack()
        ttk.Separator(self, orient="horizontal").pack(fill="x", padx=10, pady=10)
        nav_items = [("الرئيسية", DashboardView), ("الفواتير", InvoicesView), ("المنتجات", ProductsView), ("الخزينة", TreasuryView), ("العملاء", CustomersView), ("الموردين", SuppliersView)]
        for label, view_class in nav_items:
            ttk.Button(self, text=label, style="Nav.TButton", command=lambda v=view_class: self.controller.switch_view(v)).pack(fill="x", padx=5, pady=2, ipady=8)
        ttk.Frame(self, style="Sidebar.TFrame").pack(fill="both", expand=True)
        ttk.Button(self, text="خروج", style="Danger.TButton", command=self.controller.show_login).pack(fill="x", padx=10, pady=20, ipady=5)

class LoginFrame(ttk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent, style="Main.TFrame")
        self.controller = controller
        box = ttk.Frame(self, style="Card.TFrame", padding=40)
        box.place(relx=0.5, rely=0.5, anchor="center")
        ttk.Label(box, text="دخول النظام", style="Header.TLabel", background=self.controller.colors["card_bg"]).pack(pady=(0, 30))
        self.e_email = self.create_f(box, "البريد", "admin@gmail.com")
        self.e_pass = self.create_f(box, "كلمة المرور", "123456", show="*")
        ttk.Button(box, text="دخول", style="Primary.TButton", command=self.login).pack(fill="x", pady=(20, 0), ipady=5)

    def create_f(self, p, l, d="", show=None):
        ttk.Label(p, text=l, background=self.controller.colors["card_bg"]).pack(fill="x")
        e = ttk.Entry(p, width=35, font=("Segoe UI", 11), show=show)
        e.pack(pady=(5, 15), ipady=5); e.insert(0, d)
        return e

    def login(self):
        def do():
            res = self.controller.api_request("POST", "/api/auth/login", json={"email": self.e_email.get(), "password": self.e_pass.get()})
            if res and isinstance(res, dict) and "user" in res:
                self.controller.user_data = res["user"]
                self.controller.after(0, self.controller.show_main_interface)
            else:
                self.controller.after(0, lambda: messagebox.showerror("خطأ", "فشل تسجيل الدخول. تأكد من البيانات."))
        threading.Thread(target=do).start()

class BaseView(ttk.Frame):
    def __init__(self, parent, controller, title):
        super().__init__(parent, style="Main.TFrame")
        self.controller = controller
        h = ttk.Frame(self, style="Main.TFrame", padding=(20, 20))
        h.pack(fill="x")
        ttk.Label(h, text=title, font=("Segoe UI", 18, "bold"), foreground=self.controller.colors["accent"]).pack(side="right")
        self.acts = ttk.Frame(h, style="Main.TFrame")
        self.acts.pack(side="left")

    def add_btn(self, t, c, s="Primary.TButton"):
        b = ttk.Button(self.acts, text=t, command=c, style=s)
        b.pack(side="left", padx=5); return b

    def create_table(self, cols, heads):
        p = ttk.Frame(self, style="Main.TFrame", padding=20)
        p.pack(fill="both", expand=True)
        t = ttk.Treeview(p, columns=cols, show="headings")
        for c, h in zip(cols, heads): t.heading(c, text=h); t.column(c, anchor="center")
        t.pack(side="right", fill="both", expand=True)
        s = ttk.Scrollbar(p, command=t.yview); t.configure(yscrollcommand=s.set); s.pack(side="left", fill="y")
        return t

class DashboardView(BaseView):
    def __init__(self, parent, controller):
        super().__init__(parent, controller, "لوحة التحكم")
        self.cards = {}
        grid = ttk.Frame(self, style="Main.TFrame", padding=20)
        grid.pack(fill="x")
        for i, (l, k, c) in enumerate([("مبيعات اليوم", "todaySales", "#10b981"), ("ربح اليوم", "todayProfit", "#3b82f6"), ("رصيد الخزينة", "cashBalance", "#f59e0b"), ("قيمة المخزون", "totalStockValue", "#e0e0e0")]):
            f = ttk.Frame(grid, style="Card.TFrame", padding=15)
            f.grid(row=0, column=i, padx=10, sticky="nsew")
            grid.columnconfigure(i, weight=1)
            ttk.Label(f, text=l, style="CardTitle.TLabel").pack(anchor="e")
            v = ttk.Label(f, text="...", style="CardValue.TLabel", foreground=c)
            v.pack(anchor="e", pady=5); self.cards[k] = v
        self.load()

    def load(self):
        def do():
            res = self.controller.api_request("GET", "/api/dashboard")
            if res:
                kpis = res.get("kpis", {})
                self.controller.after(0, lambda: self.upd(kpis))
        threading.Thread(target=do).start()

    def upd(self, data):
        for k, v in self.cards.items(): v.configure(text=f"{data.get(k, 0):,.2f}")

class ProductsView(BaseView):
    def __init__(self, parent, controller):
        super().__init__(parent, controller, "المنتجات")
        self.add_btn("إضافة منتج (+)", self.add, "Success.TButton")
        self.add_btn("تحديث", self.load)
        self.t = self.create_table(("id", "name", "code", "qty", "price"), ("ID", "الاسم", "الكود", "الكمية", "السعر"))
        self.t.column("id", width=0, stretch=False)
        self.load()

    def load(self):
        def do():
            res = self.controller.api_request("GET", "/api/products")
            if res:
                # API returns { products: [], count: 0 }
                products = res.get("products", []) if isinstance(res, dict) else []
                self.controller.after(0, lambda: self.upd(products))
        threading.Thread(target=do).start()

    def upd(self, data):
        for i in self.t.get_children(): self.t.delete(i)
        for p in data: self.t.insert("", "end", values=(p['_id'], p['name'], p.get('code', '-'), p.get('stockQty', 0), f"{p.get('retailPrice', 0):,}"))

    def add(self):
        d = ProductDialog(self, self.controller); self.wait_window(d); self.load()

class ProductDialog(tk.Toplevel):
    def __init__(self, parent, controller):
        super().__init__(parent); self.c = controller
        self.title("إضافة منتج"); self.geometry("400x550"); self.configure(bg="#1e1e1e")
        p = ttk.Frame(self, style="Main.TFrame", padding=20); p.pack(fill="both")
        self.e = {}
        for l, k, d in [("الاسم", "name", ""), ("الكود", "code", ""), ("سعر البيع", "retailPrice", "0"), ("سعر الشراء", "buyPrice", "0"), ("الكمية بالمحل", "shopQty", "0"), ("الكمية بالمخزن", "warehouseQty", "0")]:
            ttk.Label(p, text=l).pack(fill="x")
            e = ttk.Entry(p, font=("Segoe UI", 11)); e.pack(fill="x", pady=(5, 10), ipady=3); e.insert(0, d); self.e[k] = e
        ttk.Button(p, text="حفظ", style="Success.TButton", command=self.save).pack(fill="x", pady=20, ipady=5)

    def save(self):
        data = {k: v.get() for k, v in self.e.items()}
        def do():
            if self.c.api_request("POST", "/api/products", json=data): self.after(0, self.destroy)
            else: self.after(0, lambda: messagebox.showerror("خطأ", "فشل الحفظ"))
        threading.Thread(target=do).start()

class TreasuryView(BaseView):
    def __init__(self, parent, controller):
        super().__init__(parent, controller, "الخزينة")
        self.add_btn("إيداع", lambda: self.open_tx("INCOME"), "Success.TButton")
        self.add_btn("مصرف", lambda: self.open_tx("EXPENSE"), "Danger.TButton")
        self.add_btn("تحديث", self.load)
        self.bal = ttk.Label(self, text="...", font=("Segoe UI", 16, "bold"), foreground="#10b981")
        self.bal.pack(pady=10)
        self.t = self.create_table(("id", "date", "desc", "amt", "type"), ("ID", "التاريخ", "البيان", "المبلغ", "النوع"))
        self.t.column("id", width=0, stretch=False)
        self.load()

    def load(self):
        def do():
            res = self.controller.api_request("GET", "/api/financial/treasury")
            if res: self.controller.after(0, lambda: self.upd(res))
        threading.Thread(target=do).start()

    def upd(self, res):
        self.bal.configure(text=f"الرصيد: {res.get('balance', 0):,.2f} ج.م")
        for i in self.t.get_children(): self.t.delete(i)
        for tx in res.get("transactions", []):
            self.t.insert("", "end", values=(tx['_id'], tx['date'][:16].replace('T', ' '), tx['description'], f"{tx['amount']:,}", "وارد" if tx['type']=="INCOME" else "صادر"))

    def open_tx(self, t):
        d = TxDialog(self, t, self.controller); self.wait_window(d); self.load()

class TxDialog(tk.Toplevel):
    def __init__(self, parent, t, c):
        super().__init__(parent); self.t, self.c = t, c
        self.title("معاملة جديدة"); self.geometry("350x300"); self.configure(bg="#1e1e1e")
        p = ttk.Frame(self, style="Main.TFrame", padding=20); p.pack(fill="both")
        ttk.Label(p, text="المبلغ").pack(fill="x")
        self.e_amt = ttk.Entry(p); self.e_amt.pack(fill="x", pady=5)
        ttk.Label(p, text="البيان").pack(fill="x")
        self.e_desc = ttk.Entry(p); self.e_desc.pack(fill="x", pady=5)
        ttk.Button(p, text="حفظ", style="Primary.TButton" if t=="INCOME" else "Danger.TButton", command=self.save).pack(fill="x", pady=20)

    def save(self):
        data = {"amount": self.e_amt.get(), "description": self.e_desc.get(), "type": self.t}
        def do():
            if self.c.api_request("POST", "/api/financial/transaction", json=data): self.after(0, self.destroy)
        threading.Thread(target=do).start()

class InvoicesView(BaseView):
    def __init__(self, parent, controller):
        super().__init__(parent, controller, "الفواتير")
        self.add_btn("إنشاء فاتورة (+)", self.add, "Success.TButton")
        self.add_btn("تحديث", self.load)
        self.t = self.create_table(("id", "num", "cust", "total", "date"), ("ID", "رقم", "العميل", "الإجمالي", "التاريخ"))
        self.t.column("id", width=0, stretch=False)
        self.t.bind("<Double-1>", self.on_double_click)
        self.load()

    def load(self):
        def do():
            res = self.controller.api_request("GET", "/api/invoices")
            if res:
                invoices = res.get("invoices", []) if isinstance(res, dict) else []
                self.controller.after(0, lambda: self.upd(invoices))
        threading.Thread(target=do).start()

    def upd(self, data):
        for i in self.t.get_children(): self.t.delete(i)
        for inv in data: self.t.insert("", "end", values=(inv['_id'], inv['number'], inv.get('customerName', 'عميل نقدي'), f"{inv['total']:,}", inv['createdAt'][:10]))

    def add(self):
        d = InvoiceCreateDialog(self, self.controller); self.wait_window(d); self.load()

    def on_double_click(self, e):
        sel = self.t.selection()
        if not sel: return
        inv_id = self.t.item(sel[0])['values'][0]
        def do():
            inv = self.controller.api_request("GET", f"/api/invoices/{inv_id}")
            if inv: self.controller.after(0, lambda: self.controller.print_receipt(inv))
        threading.Thread(target=do).start()

class InvoiceCreateDialog(tk.Toplevel):
    def __init__(self, parent, controller):
        super().__init__(parent); self.c = controller
        self.title("إنشاء فاتورة مبيعات"); self.geometry("800x600"); self.configure(bg="#121212")
        self.items = []
        
        main = ttk.Frame(self, style="Main.TFrame", padding=20)
        main.pack(fill="both", expand=True)
        
        # Upper: Customer and Items input
        up = ttk.Frame(main, style="Main.TFrame")
        up.pack(fill="x", pady=(0, 20))
        
        ttk.Label(up, text="العميل (نقدي إذا ترك فارغاً)").pack(side="right", padx=5)
        self.e_customer = ttk.Entry(up, width=30); self.e_customer.pack(side="right", padx=10)
        
        ttk.Separator(main, orient="horizontal").pack(fill="x", pady=10)
        
        # Item Input Area
        item_f = ttk.Frame(main, style="Main.TFrame")
        item_f.pack(fill="x", pady=10)
        
        ttk.Label(item_f, text="الصنف:").pack(side="right", padx=5)
        self.e_item_name = ttk.Entry(item_f, width=20); self.e_item_name.pack(side="right", padx=5)
        
        ttk.Label(item_f, text="الكمية:").pack(side="right", padx=5)
        self.e_item_qty = ttk.Entry(item_f, width=10); self.e_item_qty.pack(side="right", padx=5); self.e_item_qty.insert(0, "1")
        
        ttk.Label(item_f, text="السعر:").pack(side="right", padx=5)
        self.e_item_price = ttk.Entry(item_f, width=10); self.e_item_price.pack(side="right", padx=5)
        
        ttk.Button(item_f, text="إضافة للصنف", command=self.add_item, style="Success.TButton").pack(side="right", padx=10)
        
        # Table of items
        self.t = ttk.Treeview(main, columns=("name", "qty", "price", "total"), show="headings")
        for c, h in [("name", "الصنف"), ("qty", "الكمية"), ("price", "السعر"), ("total", "الإجمالي")]:
            self.t.heading(c, text=h); self.t.column(c, anchor="center")
        self.t.pack(fill="both", expand=True, pady=10)
        
        # Bottom: Total and Save
        bot = ttk.Frame(main, style="Main.TFrame")
        bot.pack(fill="x", pady=10)
        
        self.l_total = ttk.Label(bot, text="الإجمالي: 0.00 ج.م", font=("Segoe UI", 14, "bold"), foreground="#10b981")
        self.l_total.pack(side="right")
        
        ttk.Button(bot, text="حفظ وطباعة الفاتورة", style="Primary.TButton", command=self.save).pack(side="left", padx=10, ipady=5)

    def add_item(self):
        try:
            name = self.e_item_name.get()
            qty = float(self.e_item_qty.get())
            price = float(self.e_item_price.get())
            if not name: return
            
            total = qty * price
            self.items.append({"name": name, "qty": qty, "unitPrice": price})
            self.t.insert("", "end", values=(name, qty, price, f"{total:,}"))
            
            grand_total = sum(i['qty'] * i['unitPrice'] for i in self.items)
            self.l_total.configure(text=f"الإجمالي: {grand_total:,.2f} ج.م")
            
            self.e_item_name.delete(0, "end"); self.e_item_qty.delete(0, "end"); self.e_item_qty.insert(0, "1"); self.e_item_price.delete(0, "end")
        except: messagebox.showerror("خطأ", "بيانات الصنف غير صحيحة")

    def save(self):
        if not self.items: return
        data = {
            "customerName": self.e_customer.get() or "عميل نقدي",
            "items": self.items,
            "paymentType": "cash"
        }
        def do():
            res = self.c.api_request("POST", "/api/invoices", json=data)
            if res:
                self.after(0, lambda: self.finish(res))
            else:
                self.after(0, lambda: messagebox.showerror("خطأ", "فشل حفظ الفاتورة"))
        threading.Thread(target=do).start()

    def finish(self, invoice):
        self.c.print_receipt(invoice)
        self.destroy()

class CustomersView(BaseView):
    def __init__(self, parent, controller):
        super().__init__(parent, controller, "العملاء")
        self.add_btn("تحديث", self.load)
        self.t = self.create_table(("name", "phone", "bal"), ("الاسم", "الهاتف", "الرصيد"))
        self.load()

    def load(self):
        def do():
            res = self.controller.api_request("GET", "/api/customers")
            if res: self.controller.after(0, lambda: self.upd(res.get("customers", [])))
        threading.Thread(target=do).start()

    def upd(self, data):
        for i in self.t.get_children(): self.t.delete(i)
        for c in data: self.t.insert("", "end", values=(c['name'], c['phone'], f"{c.get('balance', 0):,}"))

class SuppliersView(BaseView):
    def __init__(self, parent, controller):
        super().__init__(parent, controller, "الموردين")
        self.add_btn("تحديث", self.load)
        self.t = self.create_table(("name", "phone", "bal"), ("الاسم", "الهاتف", "الرصيد"))
        self.load()

    def load(self):
        def do():
            res = self.controller.api_request("GET", "/api/suppliers")
            if res: self.controller.after(0, lambda: self.upd(res.get("suppliers", [])))
        threading.Thread(target=do).start()

    def upd(self, data):
        for i in self.t.get_children(): self.t.delete(i)
        for s in data: self.t.insert("", "end", values=(s['name'], s.get('phone', '-'), f"{s.get('balance', 0):,}"))

if __name__ == "__main__":
    FinanceApp().mainloop()
