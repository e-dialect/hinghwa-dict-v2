/**
 * Word utilities
 * 
 * Helper functions for word processing
 */

/**
 * Split definition string into structured definitions
 * 
 * Example input: "1. 定义1 例：例句1 2. 定义2 俗：俗语1"
 * Output: [
 *   {
 *     content: "定义1",
 *     examples: [{ type: "例", content: "例句1", explain: "" }]
 *   },
 *   {
 *     content: "定义2",
 *     examples: [{ type: "俗", content: "俗语1", explain: "" }]
 *   }
 * ]
 */
export function splitDefinition(definition: string): any[] {
  if (!definition) return [];
  
  const definitions: any[] = [];
  
  // Split by definition numbers (1. 2. 3. etc.)
  const defParts = definition.split(/(\d+\.\s*)/g).filter(s => s.trim());
  
  let currentDef: any = null;
  
  for (let i = 0; i < defParts.length; i++) {
    const part = defParts[i].trim();
    
    // Check if it's a definition number
    if (/^\d+\.\s*$/.test(part)) {
      // Save previous definition
      if (currentDef) {
        definitions.push(currentDef);
      }
      
      // Start new definition
      currentDef = {
        content: '',
        examples: [],
      };
      continue;
    }
    
    if (!currentDef) {
      // No numbered definition found, treat whole as single definition
      currentDef = {
        content: part,
        examples: [],
      };
      continue;
    }
    
    // Parse content and examples
    // Examples can be: 例：内容 解释 or 俗：内容 解释
    const exampleRegex = /(例|俗|谚|歇)[:：](.*?)(?=(例|俗|谚|歇)[:：]|$)/g;
    let match;
    let lastIndex = 0;
    
    while ((match = exampleRegex.exec(part)) !== null) {
      // Add content before first example
      if (lastIndex === 0 && match.index > 0) {
        currentDef.content = part.substring(0, match.index).trim();
      }
      
      // Add example
      const exampleType = match[1];
      const exampleContent = match[2].trim();
      
      // Try to split example content and explanation
      const exampleParts = exampleContent.split(/\s+/);
      const content = exampleParts[0] || '';
      const explain = exampleParts.slice(1).join(' ') || '';
      
      currentDef.examples.push({
        type: exampleType,
        content,
        explain,
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // If no examples found, treat as content
    if (lastIndex === 0) {
      currentDef.content = part;
    }
  }
  
  // Add last definition
  if (currentDef) {
    definitions.push(currentDef);
  }
  
  return definitions;
}

/**
 * Combine definitions back into string format
 */
export function combineDefinitions(definitions: any[]): string {
  if (!definitions || definitions.length === 0) return '';
  
  return definitions.map((def, index) => {
    let result = `${index + 1}. ${def.content}`;
    
    if (def.examples && def.examples.length > 0) {
      const examples = def.examples.map((ex: any) => {
        return `${ex.type}：${ex.content}${ex.explain ? ' ' + ex.explain : ''}`;
      }).join(' ');
      
      result += ' ' + examples;
    }
    
    return result;
  }).join(' ');
}
