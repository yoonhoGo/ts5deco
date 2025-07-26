#!/usr/bin/env node

/**
 * ts5deco-express-controller CLI
 * OpenAPI 타입 생성을 위한 CLI 도구
 */

import { program } from 'commander';
import { generateTypes } from '../lib/type-generator';
import { version } from '../../package.json';

program
  .name('ts5deco-express-controller')
  .description('TypeScript 5 Modern Decorator Express Controller Framework CLI')
  .version(version);

program
  .command('generate')
  .description('Generate TypeScript types from OpenAPI specification')
  .option('-i, --input <path>', 'OpenAPI specification file path', './api/openapi.yaml')
  .option('-o, --output <path>', 'Output directory for generated types', './src/types/generated')
  .option('--api-types <path>', 'Output path for API type aliases', './src/types/api.ts')
  .option('--utils <path>', 'Output path for utility types', './src/types/openapi-utils.ts')
  .option('--no-aliases', 'Skip generating type aliases')
  .option('--no-utils', 'Skip generating utility types')
  .action(async (options) => {
    try {
      console.log('🚀 Generating TypeScript types from OpenAPI specification...\n');
      
      await generateTypes({
        input: options.input,
        outputDir: options.output,
        apiTypesPath: options.apiTypes,
        utilsPath: options.utils,
        generateAliases: options.aliases,
        generateUtils: options.utils
      });
      
      console.log('✨ Type generation completed successfully!');
    } catch (error) {
      console.error('❌ Error generating types:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new project with example OpenAPI specification')
  .option('-d, --dir <path>', 'Target directory', '.')
  .action(async (options) => {
    try {
      console.log('🔧 Initializing project with OpenAPI configuration...\n');
      
      const { initProject } = await import('../lib/init');
      await initProject(options.dir);
      
      console.log('✨ Project initialized successfully!');
      console.log('\nNext steps:');
      console.log('1. Edit api/openapi.yaml to match your API');
      console.log('2. Run: npx ts5deco-express-controller generate');
      console.log('3. Import types in your controllers');
    } catch (error) {
      console.error('❌ Error initializing project:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();
