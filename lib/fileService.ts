import fs from 'fs';
import path from 'path';
import { FileDatabase, FileRecord } from './fileDb';
import { HashingService } from './hashing';

const FILES_DIR = path.join(process.cwd(), 'Files');
const UPLOADS_DIR = path.join(FILES_DIR, 'uploads');

export interface UploadResult {
  success: boolean;
  fileId?: string;
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  isValid: boolean;      // true = "No contamination detected", false = "Contaminated"
  filename?: string;
  fileBuffer?: Buffer;
  error?: string;
}

export interface FileInfo {
  id: string;
  filename: string;
  filetype: string;
  uploadedAt: string;
  uploadedBy: string;
}

/**
 * FileService - Handles file upload, download, and integrity verification
 */
export class FileService {

  /**
   * Ensure the Files directory and user subdirectory exist
   */
  private static ensureUserDir(username: string): string {
    const userDir = path.join(FILES_DIR, username);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    return userDir;
  }

  /**
   * Upload a file for a specific user (admin only)
   * @param fileBuffer - File content as Buffer
   * @param filename - Original filename
   * @param targetUsername - Username to upload file for
   * @param adminUsername - Admin who is uploading
   */
  static async uploadFile(
    fileBuffer: Buffer,
    filename: string,
    targetUsername: string,
    adminUsername: string
  ): Promise<UploadResult> {
    try {
      // Ensure user directory exists
      const userDir = this.ensureUserDir(targetUsername);

      // Generate HMAC hash with random key (not hardcoded as per assignment)
      const { hash, key } = HashingService.hashFileWithHmac(fileBuffer);

      // Generate unique file ID
      const fileId = FileDatabase.generateId();

      // Get file extension/type
      const filetype = path.extname(filename).toLowerCase() || 'unknown';

      // Save file to disk
      const filePath = path.join(userDir, `${fileId}_${filename}`);
      fs.writeFileSync(filePath, fileBuffer);

      // Save metadata to JSON database (separate from user database)
      const record: FileRecord = {
        id: fileId,
        filename: filename,
        filetype: filetype,
        hash: hash,
        hmacKey: key,
        uploadedBy: adminUsername,
        uploadedFor: targetUsername,
        uploadedAt: new Date().toISOString()
      };

      FileDatabase.create(record);

      return { success: true, fileId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Get list of files for a specific user
   */
  static getFilesForUser(username: string): FileInfo[] {
    const records = FileDatabase.getByUser(username);
    return records.map(r => ({
      id: r.id,
      filename: r.filename,
      filetype: r.filetype,
      uploadedAt: r.uploadedAt,
      uploadedBy: r.uploadedBy
    }));
  }

  /**
   * Get all files (for admin view)
   */
  static getAllFiles(): FileInfo[] {
    const records = FileDatabase.getAll();
    return records.map(r => ({
      id: r.id,
      filename: r.filename,
      filetype: r.filetype,
      uploadedAt: r.uploadedAt,
      uploadedBy: r.uploadedBy
    }));
  }

  /**
   * Get external files (from third-party uploads)
   */
  static getExternalFiles(): FileInfo[] {
    const records = FileDatabase.getByUser('uploads');
    return records.map(r => ({
      id: r.id,
      filename: r.filename,
      filetype: r.filetype,
      uploadedAt: r.uploadedAt,
      uploadedBy: r.uploadedBy
    }));
  }

  /**
   * Verify file integrity and prepare for download
   * Returns "No contamination detected" or "Contaminated" status
   */
  static verifyAndDownload(fileId: string, username: string): DownloadResult {
    try {
      // Get file record from database
      const record = FileDatabase.getById(fileId);
      if (!record) {
        return { success: false, isValid: false, error: 'File not found' };
      }

      // Check if user has access to this file
      // External files (uploadedFor === 'uploads') are accessible by admin
      const isExternalFile = record.uploadedFor === 'uploads';
      if (!isExternalFile && record.uploadedFor !== username) {
        return { success: false, isValid: false, error: 'Access denied' };
      }

      // Build file path - external files are in uploads folder
      let filePath: string;
      if (isExternalFile) {
        filePath = path.join(UPLOADS_DIR, `${fileId}_${record.filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
      } else {
        filePath = path.join(FILES_DIR, username, `${fileId}_${record.filename}`);
      }

      // Check if file exists on disk
      if (!fs.existsSync(filePath)) {
        return { success: false, isValid: false, error: 'File not found on disk' };
      }

      // Read file
      const fileBuffer = fs.readFileSync(filePath);

      // Verify integrity using stored HMAC
      const isValid = HashingService.verifyFileIntegrity(
        fileBuffer,
        record.hash,
        record.hmacKey
      );

      return {
        success: true,
        isValid: isValid,  // true = "No contamination detected", false = "Contaminated"
        filename: record.filename,
        fileBuffer: fileBuffer
      };
    } catch (error) {
      return {
        success: false,
        isValid: false,
        error: error instanceof Error ? error.message : 'Download failed'
      };
    }
  }

  /**
   * Check file integrity without downloading
   */
  static checkIntegrity(fileId: string): { valid: boolean; message: string } {
    const record = FileDatabase.getById(fileId);
    if (!record) {
      return { valid: false, message: 'File not found' };
    }

    const filePath = path.join(FILES_DIR, record.uploadedFor, `${fileId}_${record.filename}`);

    if (!fs.existsSync(filePath)) {
      return { valid: false, message: 'File not found on disk' };
    }

    const fileBuffer = fs.readFileSync(filePath);
    const isValid = HashingService.verifyFileIntegrity(fileBuffer, record.hash, record.hmacKey);

    return {
      valid: isValid,
      message: isValid ? 'No contamination detected' : 'Contaminated'
    };
  }

  /**
   * Delete a file (admin only)
   */
  static deleteFile(fileId: string, adminUsername: string): boolean {
    const record = FileDatabase.getById(fileId);
    if (!record) return false;

    // Only the admin who uploaded can delete (or any admin)
    // For simplicity, any admin can delete

    // Delete from disk
    const filePath = path.join(FILES_DIR, record.uploadedFor, `${fileId}_${record.filename}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    return FileDatabase.delete(fileId);
  }
}

export default FileService;
