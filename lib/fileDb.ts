import fs from 'fs';
import path from 'path';

/**
 * FileRecord - Structure for file metadata
 * Stored in separate JSON database (not SQLite) for security compartmentalization
 */
export interface FileRecord {
  id: string;
  filename: string;
  filetype: string;
  hash: string;           // HMAC-SHA256 for integrity verification
  hmacKey: string;        // Random key used for this file's HMAC
  uploadedBy: string;     // Admin username who uploaded
  uploadedFor: string;    // Username the file is intended for
  uploadedAt: string;     // ISO timestamp
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'fileMetadata.json');

/**
 * FileDatabase - JSON-based database for file metadata
 * Separate from Prisma/SQLite user database as per assignment requirements
 */
export class FileDatabase {

  /**
   * Ensure data directory and database file exist
   */
  private static ensureDbExists(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, '[]', 'utf-8');
    }
  }

  /**
   * Read all file records from the database
   */
  static getAll(): FileRecord[] {
    this.ensureDbExists();
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data) as FileRecord[];
  }

  /**
   * Get a single file record by ID
   */
  static getById(id: string): FileRecord | null {
    const records = this.getAll();
    return records.find(r => r.id === id) || null;
  }

  /**
   * Get all files for a specific user
   */
  static getByUser(username: string): FileRecord[] {
    const records = this.getAll();
    return records.filter(r => r.uploadedFor === username);
  }

  /**
   * Get all files uploaded by a specific admin
   */
  static getByUploader(adminUsername: string): FileRecord[] {
    const records = this.getAll();
    return records.filter(r => r.uploadedBy === adminUsername);
  }

  /**
   * Add a new file record
   */
  static create(record: FileRecord): FileRecord {
    const records = this.getAll();
    records.push(record);
    this.saveAll(records);
    return record;
  }

  /**
   * Update a file record
   */
  static update(id: string, updates: Partial<FileRecord>): FileRecord | null {
    const records = this.getAll();
    const index = records.findIndex(r => r.id === id);
    if (index === -1) return null;

    records[index] = { ...records[index], ...updates };
    this.saveAll(records);
    return records[index];
  }

  /**
   * Delete a file record
   */
  static delete(id: string): boolean {
    const records = this.getAll();
    const index = records.findIndex(r => r.id === id);
    if (index === -1) return false;

    records.splice(index, 1);
    this.saveAll(records);
    return true;
  }

  /**
   * Save all records to the database file
   */
  private static saveAll(records: FileRecord[]): void {
    this.ensureDbExists();
    fs.writeFileSync(DB_PATH, JSON.stringify(records, null, 2), 'utf-8');
  }

  /**
   * Generate a unique ID for a new record
   */
  static generateId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export default FileDatabase;
