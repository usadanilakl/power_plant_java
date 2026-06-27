import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';
import { FileConnectorDto, FileConnectorIdDto } from '../../../../models/file/file-connector.model';

/**
 * Result of the Equipment → FileConnector migration. Mirrors
 * {@code ConnectorMigrationReportDto.java}. Each {@link items} entry holds
 * a per-Equipment action so an operator can audit / grep failures.
 */
export interface ConnectorMigrationReportDto {
  dryRun: boolean;
  totalConnectorEquipment: number;
  migrated: number;
  skippedShortTag: number;
  skippedHasData: number;
  skippedNoSourceFile: number;
  skippedNoMatch: number;
  skippedAmbiguous: number;
  skippedAlreadyMigrated: number;
  paired: number;
  unpairedMultipleCandidates: number;
  items: ConnectorMigrationItemDto[];
}

export interface ConnectorMigrationItemDto {
  equipmentId: number;
  tagNumber: string;
  sourceFileId: number | null;
  /** MIGRATED | SKIP_SHORT_TAG | SKIP_HAS_DATA | SKIP_NO_SOURCE_FILE
   *  | SKIP_NO_MATCH | SKIP_AMBIGUOUS | SKIP_ALREADY_MIGRATED | DRY_RUN */
  action: string;
  newConnectorId: number | null;
  candidateFileIds: number[] | null;
  note: string;
}

/**
 * Client for {@code /ng/file-connectors} — off-page reference shapes on P&IDs
 * that point at other files. Kept separate from RfFileApiService since
 * connectors are their own domain (mostly file→file navigation, no overlap
 * with the file CRUD/upload/search surface).
 */
@Injectable({ providedIn: 'root' })
export class RfFileConnectorApiService {
  private apiUrl = `${environment.apiUrl}/file-connectors`;

  constructor(private http: HttpClient) {}

  /** All connectors drawn on the given source file — viewer fetches on file load. */
  bySourceFile(fileId: number): Observable<SpringApiResponse<FileConnectorDto[]>> {
    return this.http.get<SpringApiResponse<FileConnectorDto[]>>(
      `${this.apiUrl}/by-source-file/${fileId}`
    );
  }

  /** Single connector by id — used by click handlers to resolve target file. */
  getById(id: number): Observable<SpringApiResponse<FileConnectorDto>> {
    return this.http.get<SpringApiResponse<FileConnectorDto>>(
      `${this.apiUrl}/${id}`
    );
  }

  /** Create or update — caller supplies a FileConnectorIdDto. */
  save(connector: FileConnectorIdDto): Observable<SpringApiResponse<FileConnectorDto>> {
    return this.http.post<SpringApiResponse<FileConnectorDto>>(
      this.apiUrl,
      connector
    );
  }

  /** Soft-delete by id — also clears the surviving counterpart's pointer. */
  delete(id: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Bidirectional link between two connectors. Use this rather than patching
   * counterpartConnectorId via save() — the dedicated endpoint enforces atomic
   * dual-save and the "no self-link" invariant.
   */
  linkCounterpart(connectorId: number, otherId: number): Observable<SpringApiResponse<void>> {
    return this.http.post<SpringApiResponse<void>>(
      `${this.apiUrl}/${connectorId}/link-counterpart/${otherId}`,
      {}
    );
  }

  /** Bidirectional unlink — clears both sides. */
  unlinkCounterpart(connectorId: number): Observable<SpringApiResponse<void>> {
    return this.http.post<SpringApiResponse<void>>(
      `${this.apiUrl}/${connectorId}/unlink-counterpart`,
      {}
    );
  }

  /**
   * One-shot migration: convert legacy Equipment rows with eqType='connector'
   * to FileConnector + auto-pair unambiguous counterparts. Idempotent.
   * Run with dryRun=true first to preview impact without DB writes.
   */
  migrateFromEquipment(dryRun: boolean = false, minTagLength: number = 5):
      Observable<SpringApiResponse<ConnectorMigrationReportDto>> {
    const params = new HttpParams()
      .set('dryRun', String(dryRun))
      .set('minTagLength', String(minTagLength));
    return this.http.post<SpringApiResponse<ConnectorMigrationReportDto>>(
      `${this.apiUrl}/migrate-from-equipment`,
      {},
      { params }
    );
  }
}
