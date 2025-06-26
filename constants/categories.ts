export interface Subcategory {
  name: string;
}

export interface Category {
  name: string;
  icon: any; // Expo/Ionicons icon name
  color: string;
  subcategories: Subcategory[];
}

export const CATEGORIES: Category[] = [
  {
    name: 'Auto, Moto & Boats',
    icon: 'car-sport-outline',
    color: '#4285F4',
    subcategories: [
      { name: 'Cars' },
      { name: 'Motorcycles' },
      { name: 'Utility Vehicles' },
      { name: 'Car Parts & Accessories' },
    ],
  },
  {
    name: 'Properties',
    icon: 'home-outline',
    color: '#34A853',
    subcategories: [
        { name: 'Apartments for Rent' },
        { name: 'Apartments for Sale' },
        { name: 'Villas & Houses' },
        { name: 'Land & Plots' },
    ]
  },
  {
    name: 'Electronics',
    icon: 'phone-portrait-outline',
    color: '#9333ea',
    subcategories: [
        { name: 'Mobile Phones' },
        { name: 'Laptops & Computers' },
        { name: 'Cameras & Photography' },
        { name: 'TVs & Audio' },
    ]
  },
  {
    name: 'Fashion & Beauty',
    icon: 'shirt-outline',
    color: '#E91E63',
    subcategories: [
        { name: 'Clothing' },
        { name: 'Footwear' },
        { name: 'Accessories' },
        { name: 'Beauty Products' },
    ]
  },
    {
        name: 'Services',
        icon: 'cog-outline',
        color: '#F44336',
        subcategories: [
            { name: 'Home Services' },
            { name: 'Tutoring' },
            { name: 'Events & Catering' },
            { name: 'Health & Wellness' },
        ]
    },
    {
        name: 'Furniture',
        icon: 'cube-outline',
        color: '#795548',
        subcategories: [
            { name: 'Sofas & Chairs' },
            { name: 'Tables & Desks' },
            { name: 'Beds & Mattresses' },
            { name: 'Storage & Cabinets' },
        ]
    },
    {
        name: 'Jobs',
        icon: 'briefcase-outline',
        color: '#673AB7',
        subcategories: [
            { name: 'Job Offers' },
            { name: 'Resumes / CVs' },
        ]
    },
    {
        name: 'Pets',
        icon: 'heart-outline',
        color: '#EF5350',
        subcategories: [
            { name: 'Dogs' },
            { name: 'Cats' },
            { name: 'Pet Accessories' },
            { name: 'Pet Food' },
        ]
    },
    {
        name: 'Home & Garden',
        icon: 'leaf-outline',
        color: '#4CAF50',
        subcategories: [
            { name: 'Furniture' },
            { name: 'Decorations' },
            { name: 'Gardening' },
            { name: 'Home Appliances' },
        ]
    },
    {
        name: 'Sports, Leisure & Art',
        icon: 'bicycle-outline',
        color: '#3F51B5',
        subcategories: [
            { name: 'Sports Equipment' },
            { name: 'Bicycles' },
            { name: 'Art & Antiques' },
            { name: 'Books & Magazines' },
        ]
    }
];
