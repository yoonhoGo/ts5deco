// Temporary debug file to understand decorator execution order
import { Injectable, Scope, getClassMetadata } from './src/index';

console.log('=== Testing decorator execution order ===');

@Injectable('prototype')
@Scope('singleton')
class TestService {}

const metadata = getClassMetadata(TestService);
console.log('Class metadata:', metadata);
console.log('Expected scope: singleton, Actual scope:', metadata?.scope);