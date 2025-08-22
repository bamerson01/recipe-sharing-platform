import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function extractDatabaseSchema() {
  try {
    console.log('🔍 Extracting database schema...');

    const schema: any = {
      timestamp: new Date().toISOString(),
      tables: {},
      policies: {},
      functions: {},
      triggers: {},
      indexes: {},
      sequences: {}
    };

    // Get all tables
    console.log('📋 Getting tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (tablesError) {
      console.error('Error getting tables:', tablesError);
    } else {
      for (const table of tables || []) {
        const tableName = table.table_name;
        console.log(`  - Processing table: ${tableName}`);

        // Get table structure
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .order('ordinal_position');

        if (columnsError) {
          console.error(`Error getting columns for ${tableName}:`, columnsError);
        }

        // Get constraints
        const { data: constraints, error: constraintsError } = await supabase
          .from('information_schema.table_constraints')
          .select('constraint_name, constraint_type')
          .eq('table_schema', 'public')
          .eq('table_name', tableName);

        if (constraintsError) {
          console.error(`Error getting constraints for ${tableName}:`, constraintsError);
        }

        // Get foreign keys
        const { data: foreignKeys, error: fkError } = await supabase
          .from('information_schema.key_column_usage')
          .select(`
            constraint_name,
            column_name,
            referenced_table_name,
            referenced_column_name
          `)
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .not('referenced_table_name', 'is', null);

        if (fkError) {
          console.error(`Error getting foreign keys for ${tableName}:`, fkError);
        }

        schema.tables[tableName] = {
          columns: columns || [],
          constraints: constraints || [],
          foreignKeys: foreignKeys || []
        };
      }
    }

    // Get RLS policies
    console.log('🔐 Getting RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check')
      .eq('schemaname', 'public');

    if (policiesError) {
      console.error('Error getting policies:', policiesError);
    } else {
      schema.policies = policies || [];
    }

    // Get functions
    console.log('⚙️ Getting functions...');
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type, data_type, routine_definition')
      .eq('routine_schema', 'public');

    if (functionsError) {
      console.error('Error getting functions:', functionsError);
    } else {
      schema.functions = functions || [];
    }

    // Get triggers
    console.log('🔔 Getting triggers...');
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, event_object_table, action_statement')
      .eq('trigger_schema', 'public');

    if (triggersError) {
      console.error('Error getting triggers:', triggersError);
    } else {
      schema.triggers = triggers || [];
    }

    // Get indexes
    console.log('📊 Getting indexes...');
    const { data: indexes, error: indexesError } = await supabase
      .from('pg_indexes')
      .select('tablename, indexname, indexdef')
      .eq('schemaname', 'public');

    if (indexesError) {
      console.error('Error getting indexes:', indexesError);
    } else {
      schema.indexes = indexes || [];
    }

    // Get sequences
    console.log('🔢 Getting sequences...');
    const { data: sequences, error: sequencesError } = await supabase
      .from('information_schema.sequences')
      .select('sequence_name, data_type, start_value, minimum_value, maximum_value, increment')
      .eq('sequence_schema', 'public');

    if (sequencesError) {
      console.error('Error getting sequences:', sequencesError);
    } else {
      schema.sequences = sequences || [];
    }

    // Save to file
    const outputPath = path.join(__dirname, '../../database/current-schema.json');
    fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));

    console.log(`✅ Database schema extracted to: ${outputPath}`);

    // Also create a human-readable version
    const humanReadablePath = path.join(__dirname, '../../database/current-schema.md');
    const markdown = generateMarkdownSchema(schema);
    fs.writeFileSync(humanReadablePath, markdown);

    console.log(`✅ Human-readable schema saved to: ${humanReadablePath}`);

  } catch (error) {
    console.error('❌ Error extracting schema:', error);
  }
}

function generateMarkdownSchema(schema: any): string {
  let markdown = `# Current Database Schema

**Extracted on:** ${new Date(schema.timestamp).toLocaleString()}

## Tables

`;

  // Tables section
  for (const [tableName, tableData] of Object.entries(schema.tables)) {
    markdown += `### \`${tableName}\`\n\n`;

    // Columns
    markdown += '**Columns:**\n';
    for (const column of (tableData as any).columns) {
      const nullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultValue = column.column_default ? ` DEFAULT ${column.column_default}` : '';
      const maxLength = column.character_maximum_length ? `(${column.character_maximum_length})` : '';
      markdown += `- \`${column.column_name}\` \`${column.data_type}${maxLength}\` ${nullable}${defaultValue}\n`;
    }

    // Foreign Keys
    if ((tableData as any).foreignKeys.length > 0) {
      markdown += '\n**Foreign Keys:**\n';
      for (const fk of (tableData as any).foreignKeys) {
        markdown += `- \`${fk.column_name}\` → \`${fk.referenced_table_name}.${fk.referenced_column_name}\`\n`;
      }
    }

    markdown += '\n---\n\n';
  }

  // Policies section
  if (schema.policies.length > 0) {
    markdown += `## Row Level Security Policies\n\n`;
    for (const policy of schema.policies) {
      markdown += `### \`${policy.tablename}\` - \`${policy.policyname}\`\n`;
      markdown += `- **Type:** ${policy.cmd}\n`;
      markdown += `- **Permissive:** ${policy.permissive ? 'Yes' : 'No'}\n`;
      markdown += `- **Roles:** ${policy.roles?.join(', ') || 'All'}\n`;
      if (policy.qual) {
        markdown += `- **Condition:** \`${policy.qual}\`\n`;
      }
      if (policy.with_check) {
        markdown += `- **Check:** \`${policy.with_check}\`\n`;
      }
      markdown += '\n';
    }
  }

  // Functions section
  if (schema.functions.length > 0) {
    markdown += `## Functions\n\n`;
    for (const func of schema.functions) {
      markdown += `### \`${func.routine_name}\`\n`;
      markdown += `- **Type:** ${func.routine_type}\n`;
      markdown += `- **Returns:** ${func.data_type}\n`;
      markdown += `- **Definition:** \`${func.routine_definition}\`\n\n`;
    }
  }

  // Triggers section
  if (schema.triggers.length > 0) {
    markdown += `## Triggers\n\n`;
    for (const trigger of schema.triggers) {
      markdown += `### \`${trigger.trigger_name}\`\n`;
      markdown += `- **Table:** \`${trigger.event_object_table}\`\n`;
      markdown += `- **Event:** ${trigger.event_manipulation}\n`;
      markdown += `- **Action:** \`${trigger.action_statement}\`\n\n`;
    }
  }

  // Indexes section
  if (schema.indexes.length > 0) {
    markdown += `## Indexes\n\n`;
    for (const index of schema.indexes) {
      markdown += `### \`${index.indexname}\`\n`;
      markdown += `- **Table:** \`${index.tablename}\`\n`;
      markdown += `- **Definition:** \`${index.indexdef}\`\n\n`;
    }
  }

  return markdown;
}

// Run the extraction
extractDatabaseSchema().then(() => {
  console.log('🎉 Schema extraction complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Schema extraction failed:', error);
  process.exit(1);
});
