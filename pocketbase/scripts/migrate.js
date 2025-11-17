#!/usr/bin/env node

/**
 * Comprehensive Data Migration Script
 * 
 * This script migrates data from Django backend to Pocketbase
 * 
 * Usage:
 *   node migrate.js --step=export
 *   node migrate.js --step=transform
 *   node migrate.js --step=import
 *   node migrate.js --step=all
 */

const PocketBase = require('pocketbase');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  pbUrl: process.env.POCKETBASE_URL || 'http://127.0.0.1:8090',
  pbEmail: process.env.PB_ADMIN_EMAIL || 'admin@example.com',
  pbPassword: process.env.PB_ADMIN_PASSWORD || 'admin-password',
  exportDir: path.join(__dirname, 'export'),
  transformDir: path.join(__dirname, 'transform'),
};

const pb = new PocketBase(CONFIG.pbUrl);

/**
 * Step 1: Export Django Data
 * Note: This requires access to Django database
 * Run this script on the Django server or with database access
 */
async function exportDjangoData() {
  console.log('Step 1: Export Django Data');
  console.log('Please run the Python export script on the Django server:');
  console.log('  python scripts/export_django_data.py');
  console.log('Then copy the export/ directory here.');
}

/**
 * Step 2: Transform Data
 */
async function transformData() {
  console.log('Step 2: Transform Data');
  
  await fs.mkdir(CONFIG.transformDir, { recursive: true });
  
  // Transform users
  console.log('Transforming users...');
  const users = JSON.parse(await fs.readFile(path.join(CONFIG.exportDir, 'users.json'), 'utf-8'));
  const transformedUsers = users.map(user => ({
    username: user.username,
    email: user.email,
    name: user.nickname || user.username,
    old_id: user.id,
  }));
  await fs.writeFile(
    path.join(CONFIG.transformDir, 'users.json'),
    JSON.stringify(transformedUsers, null, 2)
  );
  console.log(`✓ Transformed ${transformedUsers.length} users`);
  
  // Transform words
  console.log('Transforming words...');
  const words = JSON.parse(await fs.readFile(path.join(CONFIG.exportDir, 'words.json'), 'utf-8'));
  const transformedWords = words.map(word => ({
    word: word.word,
    definition: word.definition,
    annotation: word.annotation,
    standard_ipa: word.standard_ipa,
    standard_romanization: word.standard_pinyin,
    views: word.views || 0,
    verified: word.visibility,
    old_id: word.id,
    old_contributor_id: word.contributor_id,
  }));
  await fs.writeFile(
    path.join(CONFIG.transformDir, 'words.json'),
    JSON.stringify(transformedWords, null, 2)
  );
  console.log(`✓ Transformed ${transformedWords.length} words`);
  
  // Transform characters
  console.log('Transforming characters...');
  const characters = JSON.parse(await fs.readFile(path.join(CONFIG.exportDir, 'characters.json'), 'utf-8'));
  
  // Deduplicate characters
  const charMap = new Map();
  for (const char of characters) {
    const key = char.simplified;
    if (!charMap.has(key) || (char.town === '城里' && char.county === '莆田')) {
      charMap.set(key, {
        simplified: char.simplified,
        traditional: char.traditional || char.simplified,
        unicode: char.unicode || char.simplified.codePointAt(0).toString(16),
      });
    }
  }
  
  const transformedCharacters = Array.from(charMap.values());
  await fs.writeFile(
    path.join(CONFIG.transformDir, 'characters.json'),
    JSON.stringify(transformedCharacters, null, 2)
  );
  console.log(`✓ Transformed ${transformedCharacters.length} characters`);
  
  // Transform character pronunciations
  console.log('Transforming character pronunciations...');
  const transformedCharProns = characters.map(char => ({
    character_text: char.character,
    ipa: char.ipa,
    romanization: char.pinyin,
    initial: char.shengmu,
    final: char.yunmu,
    tone: char.shengdiao,
    reading_type: char.type || 'both',
    county: char.county,
    town: char.town,
  }));
  await fs.writeFile(
    path.join(CONFIG.transformDir, 'character_pronunciations.json'),
    JSON.stringify(transformedCharProns, null, 2)
  );
  console.log(`✓ Transformed ${transformedCharProns.length} character pronunciations`);
  
  console.log('✓ Transformation complete');
}

/**
 * Step 3: Import to Pocketbase
 */
async function importToPocketbase() {
  console.log('Step 3: Import to Pocketbase');
  
  // Authenticate
  await pb.admins.authWithPassword(CONFIG.pbEmail, CONFIG.pbPassword);
  console.log('✓ Authenticated as admin');
  
  // Create default dialect
  console.log('Creating default dialect...');
  let dialect;
  try {
    dialect = await pb.collection('dialects').create({
      name: '莆仙话',
      code: 'puxian',
      description: '莆田市及周边地区的莆仙方言',
      region: '福建省莆田市',
      speakers: 5000000,
      status: 'active',
    });
    console.log('✓ Created dialect:', dialect.name);
  } catch (error) {
    console.log('Dialect may already exist, continuing...');
    const dialects = await pb.collection('dialects').getFullList({ filter: "code='puxian'" });
    dialect = dialects[0];
  }
  
  // Import users
  console.log('Importing users...');
  const users = JSON.parse(await fs.readFile(path.join(CONFIG.transformDir, 'users.json'), 'utf-8'));
  const userIdMap = {};
  
  for (const user of users) {
    try {
      const password = Math.random().toString(36).slice(-10);
      const pbUser = await pb.collection('users').create({
        username: user.username,
        email: user.email,
        password: password,
        passwordConfirm: password,
        emailVisibility: true,
        verified: false,
      });
      
      // Create profile
      await pb.collection('user_profiles').create({
        user: pbUser.id,
        nickname: user.name,
      });
      
      userIdMap[user.old_id] = pbUser.id;
      console.log(`  ✓ ${user.username}`);
    } catch (error) {
      console.log(`  ✗ ${user.username}: ${error.message}`);
    }
  }
  console.log(`✓ Imported ${Object.keys(userIdMap).length}/${users.length} users`);
  
  // Save user ID mapping
  await fs.writeFile(
    path.join(CONFIG.transformDir, 'user_id_map.json'),
    JSON.stringify(userIdMap, null, 2)
  );
  
  // Import characters
  console.log('Importing characters...');
  const characters = JSON.parse(await fs.readFile(path.join(CONFIG.transformDir, 'characters.json'), 'utf-8'));
  const charIdMap = {};
  
  for (const char of characters) {
    try {
      const pbChar = await pb.collection('characters').create({
        simplified: char.simplified,
        traditional: char.traditional,
        unicode: char.unicode,
      });
      charIdMap[char.simplified] = pbChar.id;
      console.log(`  ✓ ${char.simplified}`);
    } catch (error) {
      console.log(`  ✗ ${char.simplified}: ${error.message}`);
    }
  }
  console.log(`✓ Imported ${Object.keys(charIdMap).length}/${characters.length} characters`);
  
  // Import character pronunciations
  console.log('Importing character pronunciations...');
  const charProns = JSON.parse(await fs.readFile(path.join(CONFIG.transformDir, 'character_pronunciations.json'), 'utf-8'));
  
  let imported = 0;
  for (const pron of charProns) {
    const charId = charIdMap[pron.character_text];
    if (!charId) {
      console.log(`  ✗ Character not found: ${pron.character_text}`);
      continue;
    }
    
    try {
      await pb.collection('character_pronunciations').create({
        character: charId,
        dialect: dialect.id,
        ipa: pron.ipa,
        romanization: pron.romanization,
        initial: pron.initial,
        final: pron.final,
        tone: pron.tone,
        reading_type: pron.reading_type,
        verified: false,
      });
      imported++;
    } catch (error) {
      console.log(`  ✗ ${pron.character_text}: ${error.message}`);
    }
  }
  console.log(`✓ Imported ${imported}/${charProns.length} character pronunciations`);
  
  // Import words
  console.log('Importing words...');
  const words = JSON.parse(await fs.readFile(path.join(CONFIG.transformDir, 'words.json'), 'utf-8'));
  
  imported = 0;
  for (const word of words) {
    const contributorId = userIdMap[word.old_contributor_id];
    if (!contributorId) {
      console.log(`  ✗ Contributor not found for word: ${word.word}`);
      continue;
    }
    
    try {
      await pb.collection('words').create({
        word: word.word,
        dialect: dialect.id,
        definition: word.definition,
        annotation: word.annotation,
        standard_ipa: word.standard_ipa,
        standard_romanization: word.standard_romanization,
        views: word.views,
        verified: word.verified,
        contributor: contributorId,
      });
      imported++;
      if (imported % 100 === 0) {
        console.log(`  ... ${imported} words imported`);
      }
    } catch (error) {
      console.log(`  ✗ ${word.word}: ${error.message}`);
    }
  }
  console.log(`✓ Imported ${imported}/${words.length} words`);
  
  console.log('✓ Import complete!');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const stepArg = args.find(arg => arg.startsWith('--step='));
  const step = stepArg ? stepArg.split('=')[1] : 'all';
  
  console.log('='.repeat(60));
  console.log('Django to Pocketbase Data Migration');
  console.log('='.repeat(60));
  console.log();
  
  try {
    if (step === 'export' || step === 'all') {
      await exportDjangoData();
      if (step === 'export') return;
    }
    
    if (step === 'transform' || step === 'all') {
      await transformData();
      if (step === 'transform') return;
    }
    
    if (step === 'import' || step === 'all') {
      await importToPocketbase();
    }
    
    console.log();
    console.log('='.repeat(60));
    console.log('Migration completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { exportDjangoData, transformData, importToPocketbase };
