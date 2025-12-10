// Canonical fallback catalog used when the mobile API is unreachable.
// Adds predictable ids so dropdowns keep working even without backend data.
const RAW_FALLBACK_MOBILE_COMPANIES = [
  {
    name: 'Apple',
    slug: 'apple',
    previewFrame: '/frames/Apple/iPhone14.svg',
    models: [
      { name: 'iPhone 14', framePath: '/frames/Apple/iPhone14.svg' },
      { name: 'iPhone 14 Pro', framePath: '/frames/Apple/iPhone14.svg' },
      { name: 'iPhone 15', framePath: '/frames/Apple/iPhone14.svg' },
    ],
  },
  {
    name: 'Samsung',
    slug: 'samsung',
    previewFrame: '/frames/Samsung/S23.png',
    models: [
      { name: 'Galaxy S23', framePath: '/frames/Samsung/S23.png' },
      { name: 'Galaxy F55', framePath: '/frames/Samsung/S23.png' },
      { name: 'Galaxy A54', framePath: '/frames/Samsung/S23.png' },
    ],
  },
  {
    name: 'OnePlus',
    slug: 'oneplus',
    previewFrame: '/frames/frame-1-fixed.svg',
    models: [
      { name: 'OnePlus 12R', framePath: '/frames/frame-1-fixed.svg' },
      { name: 'Nord CE4', framePath: '/frames/frame-1-fixed.svg' },
      { name: 'Nord 3', framePath: '/frames/frame-1-fixed.svg' },
    ],
  },
  {
    name: 'Nothing',
    slug: 'nothing',
    previewFrame: '/frames/frame-1.svg',
    models: [
      { name: 'Phone (2)', framePath: '/frames/frame-1.svg' },
      { name: 'Phone (2a)', framePath: '/frames/frame-1.svg' },
    ],
  },
  {
    name: 'Vivo',
    slug: 'vivo',
    previewFrame: '/frames/frame-1.svg',
    models: [
      { name: 'Vivo V29', framePath: '/frames/frame-1.svg' },
      { name: 'Vivo T2 Pro', framePath: '/frames/frame-1.svg' },
    ],
  },
];

const slugify = (input) => (input || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-');

const normalizeCompanies = (companies) =>
  companies.map((company, companyIndex) => ({
    ...company,
    __isFallback: true,
    _id: company._id || `fallback-${companyIndex}-${slugify(company.slug || company.name)}`,
    models: (company.models || []).map((model, modelIndex) => ({
      ...model,
      _id: model._id || `fallback-${slugify(company.slug || company.name)}-${modelIndex}`,
    })),
  }));

export const FALLBACK_MOBILE_COMPANIES = normalizeCompanies(RAW_FALLBACK_MOBILE_COMPANIES);

export default FALLBACK_MOBILE_COMPANIES;
