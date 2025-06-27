/**
 * This file defines the structure of categories and subcategories for the ads in the application.
 * Each category can have multiple subcategories, each with its own set of filters.
 * This centralized structure makes it easy to manage and update the available categories and their filtering options.
 */

// Define a type for a filter to ensure consistency.
export type Filter = {
    name: string;
    label: string;
    type: 'select' | 'range' | 'text' | 'number';
    options?: string[]; // Options for 'select' type filters.
};

// Define a type for a subcategory.
export type Subcategory = {
    name:string;
    filters: Filter[];
};

// Define a type for a main category.
export type Category = {
    name: string;
    icon: string;       // Icon name from a library like Ionicons.
    color: string;      // Hex color code for styling.
    subcategories: Subcategory[];
};

// Define common filters that can be reused across different categories.
const commonFilters = {
    price: { name: 'price', label: 'السعر', type: 'range' as const },
    location: { name: 'location', label: 'الموقع', type: 'text' as const },
    condition: { name: 'condition', label: 'الحالة', type: 'select' as const, options: ['جديد', 'مستعمل'] }
};


// Define all the categories available in the application.
export const CATEGORIES: Category[] = [
    {
        name: 'Motors',
        icon: 'car-sport-outline',
        color: '#4285F4', // Google Blue
        subcategories: [
            {
                name: 'Cars for Sale',
                filters: [
                    { name: 'make', label: 'الشركة المصنعة', type: 'select', options: ['تويوتا', 'هوندا', 'فورد', 'نيسان', 'شيفروليه'] },
                    { name: 'year', label: 'سنة الصنع', type: 'number' },
                    { name: 'mileage', label: 'المسافة المقطوعة', type: 'number' },
                    commonFilters.condition,
                    commonFilters.price,
                    commonFilters.location,
                ],
            },
            {
                name: 'Cars for Rent',
                filters: [
                    { name: 'rentalPeriod', label: 'مدة الإيجار', type: 'select', options: ['يومي', 'أسبوعي', 'شهري'] },
                    { name: 'carType', label: 'فئة السيارة', type: 'select', options: ['اقتصادية', 'عائلية', 'فاخرة', 'رياضية'] },
                    commonFilters.price,
                    commonFilters.location,
                ],
            },
            {
                name: 'Car Parts',
                filters: [
                    { name: 'partType', label: 'نوع القطعة', type: 'select', options: ['محركات', 'اطارات', 'فرامل', 'اكسسوارات'] },
                    commonFilters.condition, 
                    commonFilters.price, 
                    commonFilters.location
                ],
            },
        ],
    },
    {
        name: 'Properties',
        icon: 'home-outline',
        color: '#34A853', // Google Green
        subcategories: [
            {
                name: 'Apartments & Villas',
                filters: [
                    { name: 'type', label: 'النوع', type: 'select', options: ['شقة', 'فيلا', 'دوبلكس'] },
                    { name: 'bedrooms', label: 'عدد غرف النوم', type: 'number' },
                    { name: 'bathrooms', label: 'عدد الحمامات', type: 'number' },
                    { name: 'area', label: 'المساحة (م²)', type: 'number' },
                    commonFilters.price,
                    commonFilters.location,
                ]
            },
            {
                name: 'Land & Plots',
                filters: [
                    { name: 'landType', label: 'نوع الأرض', type: 'select', options: ['سكنية', 'تجارية', 'زراعية'] },
                    { name: 'area', label: 'المساحة (م²)', type: 'number' },
                    commonFilters.price,
                    commonFilters.location,
                ]
            },
        ],
    },
    {
        name: 'Electronics',
        icon: 'phone-portrait-outline',
        color: '#9333ea',
        subcategories: [
            {
                name: 'Mobiles & Tablets',
                filters: [
                    { name: 'brand', label: 'الماركة', type: 'select', options: ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Oppo'] },
                    { name: 'storage', label: 'سعة التخزين', type: 'select', options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
                    commonFilters.condition,
                    commonFilters.price,
                    commonFilters.location,
                ],
            },
            {
                name: 'Laptops & Computers',
                filters: [
                    { name: 'brand', label: 'الماركة', type: 'select', options: ['HP', 'Dell', 'Apple', 'Lenovo', 'Asus'] },
                    { name: 'ram', label: 'الرام', type: 'select', options: ['8GB', '16GB', '32GB', '64GB'] },
                    commonFilters.condition,
                    commonFilters.price,
                    commonFilters.location,
                ]
            },
            {
                name: 'Home Appliances',
                filters: [
                    { name: 'applianceType', label: 'نوع الجهاز', type: 'select', options: ['ثلاجة', 'غسالة', 'مكيف', 'فرن'] },
                    commonFilters.condition,
                    commonFilters.price,
                    commonFilters.location,
                ]
            },
        ],
    },
    {
      name: 'Fashion',
      icon: 'shirt-outline',
      color: '#E91E63',
      subcategories: [
          {
              name: "Men's Fashion",
              filters: [
                  { name: 'itemType', label: 'نوع القطعة', type: 'select', options: ['ملابس', 'أحذية', 'اكسسوارات', 'ساعات'] },
                  { name: 'size', label: 'المقاس', type: 'select', options: ['S', 'M', 'L', 'XL', 'XXL'] },
                  commonFilters.condition,
                  commonFilters.price,
                  commonFilters.location,
              ]
          },
          {
              name: "Women's Fashion",
              filters: [
                  { name: 'itemType', label: 'نوع القطعة', type: 'select', options: ['ملابس', 'أحذية', 'حقائب', 'مجوهرات'] },
                  { name: 'size', label: 'المقاس', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL'] },
                  commonFilters.condition,
                  commonFilters.price,
                  commonFilters.location,
              ]
          },
      ]
  },
  
    {
        name: 'Services',
        icon: 'cog-outline',
        color: '#F44336',
        subcategories: [
            {
                name: 'Business Services',
                filters: [
                    { name: 'serviceType', label: 'نوع الخدمة', type: 'select', options: ['استشارات', 'تسويق', 'تطوير مواقع', 'خدمات قانونية'] },
                    commonFilters.price,
                    commonFilters.location,
                ]
            },
            {
                name: 'Home Services',
                filters: [
                    { name: 'serviceType', label: 'نوع الخدمة', type: 'select', options: ['تنظيف', 'صيانة', 'سباكة', 'كهرباء'] },
                    commonFilters.price,
                    commonFilters.location,
                ]
            },
        ]
    },
    // You can add more categories here.
];
