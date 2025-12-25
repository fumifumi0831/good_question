import '@testing-library/jest-dom';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

// Global mock for IndexedDB in Node environment
(global as any).indexedDB = indexedDB;
(global as any).IDBKeyRange = IDBKeyRange;
