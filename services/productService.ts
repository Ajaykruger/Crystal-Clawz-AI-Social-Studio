
import { Product } from '../types';
import { USER_PROVIDED_ASSETS } from './libraryService';

export const PRODUCT_CATALOG: Product[] = [
  { id: 'p1', sku: 'IND-008', name: 'Indulgence #008 (Vintage Rose)', price: 150, url: 'https://crystalclawz.co.za/indulgence-008', imageUrl: USER_PROVIDED_ASSETS[6].url, tags: ['color', 'classic', 'creme'] },
  { id: 'p2', sku: 'DIA-009', name: 'Diamond Gel #009 (Ruby Glitter)', price: 195, url: 'https://crystalclawz.co.za/diamond-009', imageUrl: USER_PROVIDED_ASSETS[7].url, tags: ['glitter', 'red', 'sparkle'] },
  { id: 'p3', sku: 'DIA-012', name: 'Diamond Gel #012 (Sapphire)', price: 195, url: 'https://crystalclawz.co.za/diamond-012', imageUrl: USER_PROVIDED_ASSETS[8].url, tags: ['glitter', 'blue', 'sparkle'] },
  { id: 'p4', sku: 'IND-017', name: 'Indulgence #017 (Lime)', price: 150, url: 'https://crystalclawz.co.za/indulgence-017', imageUrl: USER_PROVIDED_ASSETS[9].url, tags: ['color', 'neon', 'green'] },
  { id: 'p5', sku: 'IND-018', name: 'Indulgence #018 (Tangerine)', price: 150, url: 'https://crystalclawz.co.za/indulgence-018', imageUrl: USER_PROVIDED_ASSETS[10].url, tags: ['color', 'neon', 'orange'] },
  { id: 'p6', sku: 'IND-019', name: 'Indulgence #019 (Bubblegum)', price: 150, url: 'https://crystalclawz.co.za/indulgence-019', imageUrl: USER_PROVIDED_ASSETS[11].url, tags: ['color', 'pink'] },
];

export const searchProducts = (query: string): Product[] => {
    if (!query) return PRODUCT_CATALOG;
    const lowerQ = query.toLowerCase();
    return PRODUCT_CATALOG.filter(p => 
        p.name.toLowerCase().includes(lowerQ) || 
        p.sku.toLowerCase().includes(lowerQ) ||
        p.tags.some(t => t.includes(lowerQ))
    );
};
