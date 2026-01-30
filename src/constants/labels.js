/**
 * UI Labels & Text Constants
 * Centralized Arabic text for consistent UI messaging
 */

export const LABELS = {
    // Common
    common: {
        loading: 'جاري التحميل...',
        save: 'حفظ',
        cancel: 'إلغاء',
        delete: 'حذف',
        edit: 'تعديل',
        add: 'إضافة',
        search: 'بحث',
        filter: 'تصفية',
        all: 'الكل',
        confirm: 'تأكيد',
        close: 'إغلاق',
        refresh: 'تحديث',
        back: 'رجوع',
        next: 'التالي',
        previous: 'السابق',
        noData: 'لا توجد بيانات',
        error: 'حدث خطأ',
        success: 'تمت العملية بنجاح',
        currency: 'ج.م',
    },

    // Invoices
    invoices: {
        title: 'فواتير المبيعات',
        subtitle: 'إدارة وتتبع جميع العمليات التجارية والمالية',
        newInvoice: 'فاتورة جديدة',
        searchPlaceholder: 'بحث برقم الفاتورة أو اسم العميل...',
        loading: 'جاري تحميل الفواتير...',
        noInvoices: 'لا توجد فواتير',
        noMatchingInvoices: 'لم يتم العثور على فواتير مطابقة لخيارات البحث',
        deleteConfirm: 'هل أنت متأكد من حذف الفاتورة؟ سيتم استرجاع الكميات للمخزن.',
        deleteSuccess: 'تم حذف الفاتورة بنجاح',
        deleteFailed: 'فشل في حذف الفاتورة',
        createFailed: 'فشل في إنشاء الفاتورة',
        // Stats
        totalSales: 'إجمالي المبيعات',
        invoiceCount: 'عدد الفواتير',
        cashCollection: 'التحصيل النقدي',
        creditSales: 'المبيعات الآجلة',
        // Filter tabs
        filterAll: 'الكل',
        filterCash: 'نقدي',
        filterCredit: 'آجل',
    },

    // Customers
    customers: {
        title: 'إدارة العملاء',
        subtitle: 'متابعة حسابات العملاء، الديون، والمعاملات المالية',
        addCustomer: 'إضافة عميل',
        searchPlaceholder: 'بحث باسم العميل، العنوان، أو رقم الهاتف...',
        loading: 'جاري تحميل قائمة العملاء...',
        noCustomers: 'لا يوجد عملاء مطابقين للبحث',
        deleteConfirm: 'هل أنت متأكد من حذف هذا العميل نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
        addSuccess: 'تمت إضافة العميل بنجاح',
        updateSuccess: 'تم تحديث بيانات العميل',
        deleteSuccess: 'تم تعطيل حساب العميل',
        addFailed: 'فشل في إضافة العميل',
        updateFailed: 'فشل في تحديث العميل',
        deleteFailed: 'فشل في حذف العميل',
        // Table headers
        tableCustomer: 'العميل / الحالة',
        tableContact: 'الاتصال',
        tablePriceType: 'نوع السعر',
        tableDebt: 'ديون / رصيد',
        tableActions: 'الإجراءات',
        // Financial
        financialOverview: 'نظرة مالية شاملة',
    },

    // Products
    products: {
        title: 'إدارة المنتجات',
        addProduct: 'إضافة منتج',
        searchPlaceholder: 'بحث بالاسم أو الكود...',
        loading: 'جاري تحميل المنتجات...',
        noProducts: 'لا توجد منتجات',
    },

    // Financial
    financial: {
        totalReceivables: 'إجمالي المستحقات',
        pendingInvoices: 'فواتير معلقة',
        activeDebts: 'ديون نشطة',
        overdue: 'متأخرات',
        payment: 'تحصيل',
        recordPayment: 'تسجيل سداد',
    },

    // Pagination
    pagination: {
        page: 'صفحة',
        of: 'من',
        invoice: 'فاتورة',
        customer: 'عميل',
        product: 'منتج',
    },

    // Validation
    validation: {
        required: 'هذا الحقل مطلوب',
        invalidPhone: 'رقم الهاتف غير صالح',
        invalidEmail: 'البريد الإلكتروني غير صالح',
        phoneExists: 'رقم الهاتف مستخدم بالفعل لعميل آخر',
    },
};

export default LABELS;
