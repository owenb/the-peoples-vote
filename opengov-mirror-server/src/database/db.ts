import Database from 'better-sqlite3';
import { settings } from '../config.js';
import { logger } from '../utils/logger.js';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface MirroredProposal {
  id: number;
  polkassemblyId: number;
  polkassemblyTitle: string;
  polkassemblyContent: string;
  polkassemblyUrl: string;
  polkassemblyStatus: string;
  polkassemblyTrack: number | null;
  polkassemblyCreatedAt: string;
  arkivCid: string | null;
  arkivUrl: string | null;
  paseoVoteContractAddress: string | null;
  paseoTxHash: string | null;
  paseoBlockNumber: number | null;
  processingStatus: ProcessingStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ProposalDatabase {
  private db: Database.Database;

  constructor(dbPath: string = settings.database.path) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.init();

    logger.info({
      msg: 'Database initialized',
      path: dbPath,
    });
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mirrored_proposals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        polkassembly_id INTEGER UNIQUE NOT NULL,
        polkassembly_title TEXT NOT NULL,
        polkassembly_content TEXT NOT NULL,
        polkassembly_url TEXT NOT NULL,
        polkassembly_status TEXT NOT NULL,
        polkassembly_track INTEGER,
        polkassembly_created_at TEXT NOT NULL,
        arkiv_cid TEXT,
        arkiv_url TEXT,
        paseo_vote_contract_address TEXT,
        paseo_tx_hash TEXT,
        paseo_block_number INTEGER,
        processing_status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_polkassembly_id
        ON mirrored_proposals(polkassembly_id);

      CREATE INDEX IF NOT EXISTS idx_processing_status
        ON mirrored_proposals(processing_status);

      CREATE INDEX IF NOT EXISTS idx_created_at
        ON mirrored_proposals(created_at);
    `);
  }

  /**
   * Insert a new proposal
   */
  insertProposal(data: {
    polkassemblyId: number;
    polkassemblyTitle: string;
    polkassemblyContent: string;
    polkassemblyUrl: string;
    polkassemblyStatus: string;
    polkassemblyTrack: number | null;
    polkassemblyCreatedAt: string;
  }): number {
    const stmt = this.db.prepare(`
      INSERT INTO mirrored_proposals (
        polkassembly_id, polkassembly_title, polkassembly_content,
        polkassembly_url, polkassembly_status, polkassembly_track,
        polkassembly_created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.polkassemblyId,
      data.polkassemblyTitle,
      data.polkassemblyContent,
      data.polkassemblyUrl,
      data.polkassemblyStatus,
      data.polkassemblyTrack,
      data.polkassemblyCreatedAt
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Update Arkiv information
   */
  updateArkiv(polkassemblyId: number, arkivCid: string, arkivUrl: string): void {
    const stmt = this.db.prepare(`
      UPDATE mirrored_proposals
      SET arkiv_cid = ?, arkiv_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE polkassembly_id = ?
    `);

    stmt.run(arkivCid, arkivUrl, polkassemblyId);
  }

  /**
   * Update Paseo information
   */
  updatePaseo(
    polkassemblyId: number,
    contractAddress: string,
    txHash: string,
    blockNumber: number
  ): void {
    const stmt = this.db.prepare(`
      UPDATE mirrored_proposals
      SET paseo_vote_contract_address = ?,
          paseo_tx_hash = ?,
          paseo_block_number = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE polkassembly_id = ?
    `);

    stmt.run(contractAddress, txHash, blockNumber, polkassemblyId);
  }

  /**
   * Update processing status
   */
  updateStatus(
    polkassemblyId: number,
    status: ProcessingStatus,
    errorMessage?: string
  ): void {
    const stmt = this.db.prepare(`
      UPDATE mirrored_proposals
      SET processing_status = ?,
          error_message = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE polkassembly_id = ?
    `);

    stmt.run(status, errorMessage || null, polkassemblyId);
  }

  /**
   * Check if proposal exists
   */
  exists(polkassemblyId: number): boolean {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM mirrored_proposals
      WHERE polkassembly_id = ?
    `);

    const result = stmt.get(polkassemblyId) as { count: number };
    return result.count > 0;
  }

  /**
   * Get proposal by Polkassembly ID
   */
  getByPolkassemblyId(polkassemblyId: number): MirroredProposal | null {
    const stmt = this.db.prepare(`
      SELECT * FROM mirrored_proposals
      WHERE polkassembly_id = ?
    `);

    const row = stmt.get(polkassemblyId);
    return row ? this.mapRow(row) : null;
  }

  /**
   * Get proposal by ID
   */
  getById(id: number): MirroredProposal | null {
    const stmt = this.db.prepare(`
      SELECT * FROM mirrored_proposals
      WHERE id = ?
    `);

    const row = stmt.get(id);
    return row ? this.mapRow(row) : null;
  }

  /**
   * Get all proposals with optional filters
   */
  getAll(params?: {
    status?: ProcessingStatus;
    limit?: number;
    offset?: number;
  }): MirroredProposal[] {
    let query = 'SELECT * FROM mirrored_proposals';
    const queryParams: any[] = [];

    if (params?.status) {
      query += ' WHERE processing_status = ?';
      queryParams.push(params.status);
    }

    query += ' ORDER BY created_at DESC';

    if (params?.limit) {
      query += ' LIMIT ?';
      queryParams.push(params.limit);
    }

    if (params?.offset) {
      query += ' OFFSET ?';
      queryParams.push(params.offset);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...queryParams);

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN processing_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN processing_status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN processing_status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN processing_status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM mirrored_proposals
    `);

    return stmt.get() as any;
  }

  /**
   * Get failed proposals
   */
  getFailed(): MirroredProposal[] {
    return this.getAll({ status: 'failed' });
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Map database row to MirroredProposal
   */
  private mapRow(row: any): MirroredProposal {
    return {
      id: row.id,
      polkassemblyId: row.polkassembly_id,
      polkassemblyTitle: row.polkassembly_title,
      polkassemblyContent: row.polkassembly_content,
      polkassemblyUrl: row.polkassembly_url,
      polkassemblyStatus: row.polkassembly_status,
      polkassemblyTrack: row.polkassembly_track,
      polkassemblyCreatedAt: row.polkassembly_created_at,
      arkivCid: row.arkiv_cid,
      arkivUrl: row.arkiv_url,
      paseoVoteContractAddress: row.paseo_vote_contract_address,
      paseoTxHash: row.paseo_tx_hash,
      paseoBlockNumber: row.paseo_block_number,
      processingStatus: row.processing_status,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// Singleton instance
export const db = new ProposalDatabase();
