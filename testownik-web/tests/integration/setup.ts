/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import {
  indexedDB as fidbIndexedDB,
  IDBKeyRange as fidbKeyRange,
  IDBCursor as fidbCursor,
  IDBRequest as fidbRequest,
} from 'fake-indexeddb'

globalThis.indexedDB =
  fidbIndexedDB as unknown as typeof globalThis.indexedDB
globalThis.IDBKeyRange =
  fidbKeyRange as unknown as typeof globalThis.IDBKeyRange
globalThis.IDBCursor =
  fidbCursor as unknown as typeof globalThis.IDBCursor
globalThis.IDBRequest =
  fidbRequest as unknown as typeof globalThis.IDBRequest
