// This file generates Pocketbase collection schemas that can be imported via the admin UI
// Run with: node scripts/generate-collections.js > scripts/collections.json

const collections = [
  {
    name: 'dialects',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true, options: { min: 1, max: 100 } },
      { name: 'code', type: 'text', required: true, options: { min: 1, max: 50, pattern: '^[a-z0-9_]+$' } },
      { name: 'description', type: 'text', required: false },
      { name: 'parent', type: 'relation', required: false, options: { collectionId: 'dialects', cascadeDelete: false, maxSelect: 1 } },
      { name: 'region', type: 'text', required: false },
      { name: 'speakers', type: 'number', required: false },
      { name: 'status', type: 'select', required: true, options: { maxSelect: 1, values: ['active', 'inactive'] } },
      { name: 'metadata', type: 'json', required: false },
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_dialect_name ON dialects (name)',
      'CREATE UNIQUE INDEX idx_dialect_code ON dialects (code)',
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  },
  {
    name: 'phonological_positions',
    type: 'base',
    schema: [
      { name: 'initial', type: 'text', required: true },
      { name: 'final', type: 'text', required: true },
      { name: 'tone', type: 'text', required: true },
      { name: 'division', type: 'text', required: false },
      { name: 'articulation', type: 'text', required: false },
      { name: 'class', type: 'text', required: false },
      { name: 'description', type: 'text', required: false },
      { name: 'metadata', type: 'json', required: false },
    ],
    indexes: [
      'CREATE INDEX idx_phonological_composite ON phonological_positions (initial, final, tone)',
    ],
    listRule: '',
    viewRule: '',
    createRule: '@request.auth.role ?= "moderator" || @request.auth.role ?= "admin"',
    updateRule: '@request.auth.role ?= "moderator" || @request.auth.role ?= "admin"',
    deleteRule: '@request.auth.role = "admin"',
  },
  {
    name: 'characters',
    type: 'base',
    schema: [
      { name: 'simplified', type: 'text', required: true, options: { min: 1, max: 10 } },
      { name: 'traditional', type: 'text', required: false, options: { max: 10 } },
      { name: 'phonological_position', type: 'relation', required: false, options: { collectionId: 'phonological_positions', cascadeDelete: false, maxSelect: 1 } },
      { name: 'unicode', type: 'text', required: true },
      { name: 'radical', type: 'text', required: false },
      { name: 'stroke_count', type: 'number', required: false },
      { name: 'meanings', type: 'json', required: false },
      { name: 'variants', type: 'json', required: false },
      { name: 'metadata', type: 'json', required: false },
    ],
    indexes: [
      'CREATE INDEX idx_char_simplified ON characters (simplified)',
      'CREATE INDEX idx_char_traditional ON characters (traditional)',
      'CREATE INDEX idx_char_unicode ON characters (unicode)',
    ],
    listRule: '',
    viewRule: '',
    createRule: '@request.auth.role ?= "moderator" || @request.auth.role ?= "admin"',
    updateRule: '@request.auth.role ?= "moderator" || @request.auth.role ?= "admin"',
    deleteRule: '@request.auth.role = "admin"',
  },
  // Note: This is a simplified version. The full script would generate all collections.
  // For production, collections should be created through migrations or admin UI.
];

console.log(JSON.stringify(collections, null, 2));
