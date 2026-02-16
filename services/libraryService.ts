
import { Folder, MediaAsset } from '../types';

// --- USER PROVIDED IMAGE REPLACEMENTS ---
// Using specific Shopify CDN images as requested
const SHOPIFY_URLS = [
  'https://cdn.shopify.com/s/files/1/0598/4265/8483/files/IND-135-15.jpg?v=1755179365', // 0
  'https://cdn.shopify.com/s/files/1/0598/4265/8483/products/cdl-136.jpg?v=1691524373', // 1
  'https://cdn.shopify.com/s/files/1/0598/4265/8483/products/cdl-137.jpg?v=1691524374', // 2
  'https://cdn.shopify.com/s/files/1/0598/4265/8483/files/CDL_138_UNBRANDED_1.png?v=1751017884', // 3
  'https://cdn.shopify.com/s/files/1/0598/4265/8483/products/cdl-145.jpg?v=1691524379', // 4
  'https://cdn.shopify.com/s/files/1/0598/4265/8483/products/cdl-146.jpg?v=1718710560', // 5
  'https://cdn.shopify.com/s/files/1/0598/4265/8483/products/CDL-146_e0ffbcf9-4882-4f30-b2f4-ca2dd66c132c.jpg?v=1718710564', // 6
  'https://cdn.shopify.com/s/files/1/0598/4265/8483/products/cdl-149.jpg?v=1718710566', // 7
  'https://cdn.shopify.com/s/files/1/0598/4265/8483/files/CDL-155_0920c755-3eb6-44f2-8f44-771354d5b9da.jpg?v=1755086052', // 8
  'https://cdn.shopify.com/s/files/1/0598/4265/8483/files/IND-160-15.png?v=1754397803'  // 9
];

export const USER_PROVIDED_ASSETS = [
    // --- EXISTING REFERENCES (0-11) ---
    // 1. 
    { 
      id: 'img_riaana', 
      url: SHOPIFY_URLS[0], 
      label: 'Product IND-135' 
    },
    // 2.
    { 
      id: 'img_stiletto', 
      url: SHOPIFY_URLS[1], 
      label: 'Product CDL-136' 
    },
    // 3.
    { 
      id: 'img_liza', 
      url: SHOPIFY_URLS[2], 
      label: 'Product CDL-137' 
    },
    // 4.
    { 
      id: 'img_nude', 
      url: SHOPIFY_URLS[3], 
      label: 'Product CDL-138' 
    },
    // 5.
    { 
      id: 'img_johanni', 
      url: SHOPIFY_URLS[4], 
      label: 'Product CDL-145' 
    },
    // 6.
    { 
      id: 'img_prep', 
      url: SHOPIFY_URLS[5], 
      label: 'Product CDL-146' 
    },
    
    // 7.
    { 
      id: 'prod_008', 
      url: SHOPIFY_URLS[6], 
      label: 'Product CDL-146 (Alt)' 
    },
    // 8.
    { 
      id: 'prod_009', 
      url: SHOPIFY_URLS[7], 
      label: 'Product CDL-149' 
    },
    // 9.
    { 
      id: 'prod_012', 
      url: SHOPIFY_URLS[8], 
      label: 'Product CDL-155' 
    },
    // 10.
    { 
      id: 'prod_017', 
      url: SHOPIFY_URLS[9], 
      label: 'Product IND-160' 
    },
    // 11. (Cycle back to 0)
    { 
      id: 'prod_018', 
      url: SHOPIFY_URLS[0], 
      label: 'Product IND-135 (Copy)' 
    },
    // 12. (Cycle back to 1)
    { 
      id: 'prod_019', 
      url: SHOPIFY_URLS[1], 
      label: 'Product CDL-136 (Copy)' 
    },

    // --- STOCK IMAGES REPLACEMENTS (12+) ---
    // 13.
    {
      id: 'img_french',
      url: SHOPIFY_URLS[2],
      label: 'Product CDL-137 (Stock)'
    },
    // 14.
    {
      id: 'img_neon',
      url: SHOPIFY_URLS[3],
      label: 'Product CDL-138 (Stock)'
    },
    // 15.
    {
      id: 'img_dark',
      url: SHOPIFY_URLS[4],
      label: 'Product CDL-145 (Stock)'
    },
    // 16.
    {
      id: 'img_salon',
      url: SHOPIFY_URLS[5],
      label: 'Product CDL-146 (Stock)'
    },
    // 17.
    {
      id: 'img_pastel',
      url: SHOPIFY_URLS[6],
      label: 'Product CDL-146 Alt (Stock)'
    },
    // 18.
    {
      id: 'img_process',
      url: SHOPIFY_URLS[7],
      label: 'Product CDL-149 (Stock)'
    },
    // 19.
    {
      id: 'img_tools',
      url: SHOPIFY_URLS[8],
      label: 'Product CDL-155 (Stock)'
    },
    // 20.
    {
      id: 'img_foil',
      url: SHOPIFY_URLS[9],
      label: 'Product IND-160 (Stock)'
    },
    // 21.
    {
      id: 'img_abstract',
      url: SHOPIFY_URLS[0],
      label: 'Product IND-135 (Stock)'
    },
    // 22.
    {
      id: 'img_blue_swatch',
      url: SHOPIFY_URLS[1],
      label: 'Product CDL-136 (Stock)'
    },
    // 23.
    {
      id: 'img_glitter_pot',
      url: SHOPIFY_URLS[2],
      label: 'Product CDL-137 (Stock)'
    },
    // 24.
    {
      id: 'img_pro_hand',
      url: SHOPIFY_URLS[3],
      label: 'Product CDL-138 (Stock)'
    }
];

// Initial Folder Structure
export const INITIAL_FOLDERS: Folder[] = [
  {
    id: 'f_gdrive',
    name: 'Google Drive Imports',
    path: 'Google Drive Imports',
    locked: false,
    subfolders: [
        { id: 'f_gd_summer', name: 'Summer Campaign 2025', path: 'Google Drive Imports/Summer Campaign 2025', subfolders: [] },
        { id: 'f_gd_influencer', name: 'Influencer Drops', path: 'Google Drive Imports/Influencer Drops', subfolders: [] },
    ]
  },
  {
    id: 'f_inbox',
    name: 'Inbox (Unsorted)',
    path: 'Inbox (Unsorted)',
    locked: false,
    subfolders: []
  },
  {
    id: 'f_brand',
    name: 'Brand Assets',
    path: 'Brand Assets',
    locked: true,
    subfolders: [
      { id: 'f_brand_logo', name: 'Logos', path: 'Brand Assets/Logos', subfolders: [] },
      { id: 'f_brand_font', name: 'Fonts', path: 'Brand Assets/Fonts', subfolders: [] },
      { id: 'f_brand_colors', name: 'Colours & Backgrounds', path: 'Brand Assets/Colours & Backgrounds', subfolders: [] },
      { id: 'f_brand_templates', name: 'Templates', path: 'Brand Assets/Templates', subfolders: [] },
    ]
  },
  {
    id: 'f_products',
    name: 'Products',
    path: 'Products',
    locked: false,
    subfolders: [
      { id: 'f_prod_rubber', name: 'Rubber Base', path: 'Products/Rubber Base', subfolders: [] },
      { id: 'f_prod_builder', name: 'Builder Gel', path: 'Products/Builder Gel', subfolders: [] },
      { id: 'f_prod_polish', name: 'Gel Polish', path: 'Products/Gel Polish', subfolders: [] },
      { id: 'f_prod_cateye', name: 'Cat Eye', path: 'Products/Cat Eye', subfolders: [] },
      { id: 'f_prod_tools', name: 'Bits & Tools', path: 'Products/Bits & Tools', subfolders: [] },
    ]
  },
  {
    id: 'f_campaigns',
    name: 'Campaigns',
    path: 'Campaigns',
    locked: false,
    subfolders: [
      { id: 'f_camp_bf25', name: 'Black Friday 2025', path: 'Campaigns/Black Friday 2025', subfolders: [] },
      { id: 'f_camp_xmas25', name: 'Christmas 2025', path: 'Campaigns/Christmas 2025', subfolders: [] },
    ]
  },
  {
    id: 'f_edu',
    name: 'Education',
    path: 'Education',
    locked: false,
    subfolders: []
  },
  {
    id: 'f_ugc',
    name: 'Community (UGC)',
    path: 'Community (UGC)',
    locked: false,
    subfolders: [
        { id: 'f_ugc_amb', name: 'Ambassadors', path: 'Community (UGC)/Ambassadors', subfolders: [] },
        { id: 'f_ugc_clients', name: 'Client Sets', path: 'Community (UGC)/Client Sets', subfolders: [] },
    ]
  },
  {
    id: 'f_content',
    name: 'Content Ready',
    path: 'Content Ready',
    locked: false,
    subfolders: [
        { id: 'f_content_sched', name: 'Scheduled', path: 'Content Ready/Scheduled', subfolders: [] },
        { id: 'f_content_posted', name: 'Posted', path: 'Content Ready/Posted', subfolders: [] },
    ]
  },
  {
    id: 'f_engine',
    name: 'Engine Packs',
    path: 'Engine Packs',
    locked: true,
    subfolders: []
  }
];

const INITIAL_ASSETS: MediaAsset[] = [
    // --- User Uploaded Replacements ---
    {
        id: 'user_1',
        filename: 'IND-135-15.jpg',
        fileType: 'image',
        folderPath: 'Products/Gel Polish',
        stage: 'Final',
        url: USER_PROVIDED_ASSETS[0].url,
        createdAt: '2025-01-26',
        tags: ['purple', 'leaf', 'art', 'product'],
        permissions: { status: 'not_needed' },
        status: 'draft'
    },
    {
        id: 'user_2',
        filename: 'CDL-136.jpg',
        fileType: 'image',
        folderPath: 'Community (UGC)/Client Sets',
        stage: 'Raw',
        url: USER_PROVIDED_ASSETS[1].url, 
        createdAt: '2025-01-26',
        tags: ['yellow', 'stiletto', 'floral', 'product'],
        permissions: { status: 'not_needed' },
        status: 'draft'
    },
    {
        id: 'user_3',
        filename: 'CDL-137.jpg',
        fileType: 'image',
        folderPath: 'Products/Gel Polish',
        stage: 'Final',
        url: USER_PROVIDED_ASSETS[2].url,
        createdAt: '2025-01-26',
        tags: ['red', 'floral', 'product'],
        permissions: { status: 'not_needed' },
        status: 'draft'
    },
    {
        id: 'user_4',
        filename: 'CDL-138.png',
        fileType: 'image',
        folderPath: 'Products/Rubber Base',
        stage: 'Final',
        url: USER_PROVIDED_ASSETS[3].url,
        createdAt: '2025-01-22',
        tags: ['nude', 'glitter', 'product'],
        permissions: { status: 'not_needed' },
        status: 'draft'
    },
    {
        id: 'user_5',
        filename: 'CDL-145.jpg',
        fileType: 'image',
        folderPath: 'Inbox (Unsorted)',
        stage: 'Raw',
        url: USER_PROVIDED_ASSETS[4].url,
        createdAt: '2025-01-10',
        tags: ['ombre', 'pastel', 'matte', 'product'],
        permissions: { status: 'not_needed' },
        status: 'draft'
    },
    {
        id: 'user_6',
        filename: 'CDL-146.jpg',
        fileType: 'image',
        folderPath: 'Education',
        usageType: 'UGC',
        stage: 'Final',
        orientation: '1:1',
        url: USER_PROVIDED_ASSETS[5].url,
        createdAt: '2025-01-18',
        tags: ['education', 'prep', 'product'],
        permissions: { status: 'granted' },
        status: 'draft'
    },
    {
        id: 'prod_bottle_1',
        filename: 'CDL-146-Alt.jpg',
        fileType: 'image',
        folderPath: 'Products/Gel Polish',
        stage: 'Final',
        url: USER_PROVIDED_ASSETS[6].url,
        createdAt: '2025-01-15',
        tags: ['product', 'bottle'],
        permissions: { status: 'not_needed' },
        status: 'draft'
    },
    {
        id: 'prod_bottle_2',
        filename: 'CDL-149.jpg',
        fileType: 'image',
        folderPath: 'Products/Cat Eye',
        stage: 'Final',
        url: USER_PROVIDED_ASSETS[7].url,
        createdAt: '2025-01-15',
        tags: ['product', 'bottle', 'glitter'],
        permissions: { status: 'not_needed' },
        status: 'draft'
    },
    // --- Newly Added Stock Images (Now Shopify) ---
    {
        id: 'stock_12',
        filename: 'CDL-155.jpg',
        fileType: 'image',
        folderPath: 'Inbox (Unsorted)',
        stage: 'Raw',
        url: USER_PROVIDED_ASSETS[8].url,
        createdAt: '2025-01-28',
        tags: ['product', 'stock'],
        permissions: { status: 'not_needed' },
        status: 'draft'
    },
    {
        id: 'stock_13',
        filename: 'IND-160-15.png',
        fileType: 'image',
        folderPath: 'Google Drive Imports/Summer Campaign 2025',
        stage: 'Raw',
        url: USER_PROVIDED_ASSETS[9].url,
        createdAt: '2025-01-28',
        tags: ['product', 'stock'],
        permissions: { status: 'not_needed' },
        status: 'draft'
    },
    {
        id: 'stock_14',
        filename: 'IND-135-Stock.jpg',
        fileType: 'image',
        folderPath: 'Inbox (Unsorted)',
        stage: 'Raw',
        url: USER_PROVIDED_ASSETS[12].url,
        createdAt: '2025-01-28',
        tags: ['product', 'stock'],
        permissions: { status: 'not_needed' },
        status: 'draft'
    },
    {
        id: 'stock_15',
        filename: 'CDL-136-Stock.jpg',
        fileType: 'image',
        folderPath: 'Brand Assets/Templates',
        stage: 'Raw',
        url: USER_PROVIDED_ASSETS[13].url,
        createdAt: '2025-01-28',
        tags: ['product', 'stock'],
        permissions: { status: 'not_needed' },
        status: 'draft'
    },
    {
        id: 'stock_16',
        filename: 'CDL-137-Stock.jpg',
        fileType: 'image',
        folderPath: 'Products/Gel Polish',
        stage: 'Raw',
        url: USER_PROVIDED_ASSETS[14].url,
        createdAt: '2025-01-28',
        tags: ['product', 'stock'],
        permissions: { status: 'not_needed' },
        status: 'draft'
    },
    {
        id: 'stock_17',
        filename: 'CDL-138-Stock.png',
        fileType: 'image',
        folderPath: 'Education',
        stage: 'Raw',
        url: USER_PROVIDED_ASSETS[15].url,
        createdAt: '2025-01-28',
        tags: ['product', 'stock'],
        permissions: { status: 'not_needed' },
        status: 'draft'
    },
    {
        id: 'stock_18',
        filename: 'CDL-145-Stock.jpg',
        fileType: 'image',
        folderPath: 'Products/Bits & Tools',
        stage: 'Raw',
        url: USER_PROVIDED_ASSETS[16].url,
        createdAt: '2025-01-28',
        tags: ['product', 'stock'],
        permissions: { status: 'not_needed' },
        status: 'draft'
    },
    {
        id: 'stock_19',
        filename: 'CDL-146-Stock.jpg',
        fileType: 'image',
        folderPath: 'Inbox (Unsorted)',
        stage: 'Raw',
        url: USER_PROVIDED_ASSETS[17].url,
        createdAt: '2025-01-28',
        tags: ['product', 'stock'],
        permissions: { status: 'not_needed' },
        status: 'draft'
    }
];

// In-memory store
let assetsStore: MediaAsset[] = [...INITIAL_ASSETS];
let foldersStore: Folder[] = JSON.parse(JSON.stringify(INITIAL_FOLDERS));

export const getLibraryAssets = (): MediaAsset[] => {
    return [...assetsStore];
};

export const addAsset = (asset: MediaAsset) => {
    assetsStore = [asset, ...assetsStore];
    return asset;
};

export const addManyAssets = (assets: MediaAsset[]) => {
    assetsStore = [...assets, ...assetsStore];
    return assets;
};

export const updateAsset = (id: string, updates: Partial<MediaAsset>) => {
    assetsStore = assetsStore.map(a => a.id === id ? { ...a, ...updates } : a);
    return assetsStore.find(a => a.id === id);
};

export const deleteAsset = (id: string) => {
    assetsStore = assetsStore.filter(a => a.id !== id);
};

// --- FOLDER MANAGEMENT ---

export const getFolders = (): Folder[] => {
    return [...foldersStore];
};

export const createFolder = (name: string, parentPath: string | null) => {
    const newFolder: Folder = {
        id: `f_${Date.now()}`,
        name: name,
        path: parentPath ? `${parentPath}/${name}` : name,
        subfolders: [],
        locked: false
    };

    if (!parentPath) {
        foldersStore = [...foldersStore, newFolder];
    } else {
        const addToPath = (items: Folder[]): Folder[] => {
            return items.map(item => {
                if (item.path === parentPath) {
                    return { ...item, subfolders: [...item.subfolders, newFolder] };
                }
                if (item.subfolders.length > 0) {
                    return { ...item, subfolders: addToPath(item.subfolders) };
                }
                return item;
            });
        };
        foldersStore = addToPath(foldersStore);
    }
    return [...foldersStore];
};

export const deleteFolder = (pathToDelete: string) => {
    const filterPath = (items: Folder[]): Folder[] => {
        return items
            .filter(item => item.path !== pathToDelete)
            .map(item => ({
                ...item,
                subfolders: filterPath(item.subfolders)
            }));
    };
    foldersStore = filterPath(foldersStore);
    return [...foldersStore];
};

export const renameFolder = (oldPath: string, newName: string) => {
    const updateItems = (items: Folder[]): Folder[] => {
        return items.map(item => {
            if (item.path === oldPath) {
                // Determine new path
                const parentPathIndex = oldPath.lastIndexOf('/');
                const parentPath = parentPathIndex > -1 ? oldPath.substring(0, parentPathIndex) : '';
                const newPath = parentPath ? `${parentPath}/${newName}` : newName;
                
                return {
                    ...item,
                    name: newName,
                    path: newPath,
                    // Recursively update children paths
                    subfolders: updateChildrenPaths(item.subfolders, oldPath, newPath)
                };
            }
            if (item.subfolders.length > 0) {
                return { ...item, subfolders: updateItems(item.subfolders) };
            }
            return item;
        });
    };

    const updateChildrenPaths = (items: Folder[], oldParentPath: string, newParentPath: string): Folder[] => {
        return items.map(item => {
            const newPath = item.path.replace(oldParentPath, newParentPath);
            return {
                ...item,
                path: newPath,
                subfolders: updateChildrenPaths(item.subfolders, oldParentPath, newParentPath)
            };
        });
    };

    foldersStore = updateItems(foldersStore);
    return [...foldersStore];
};
