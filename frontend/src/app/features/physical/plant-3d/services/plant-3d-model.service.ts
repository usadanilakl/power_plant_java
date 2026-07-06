import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RfFileApiService } from '../../../files/refactored/services/rf-file-api.service';
import { SharedDataService } from '../../../../services/shared-data.service';
import { ValueDto } from '../../../../models/value.model';

/** A GLB/GLTF model available to attach to a shape. */
export interface ModelFileRef { id: number; name: string; url: string; }

/**
 * Orchestrates custom 3D-model (GLB/GLTF) files for the builder — reusing the existing FileObject pipeline:
 * upload via /ng/files/multi-upload (a .glb bypasses all image processing → stored byte-for-byte), list already
 * uploaded models by extension, and turn a stored fileLink into a root-relative URL the GLTFLoader can fetch.
 * A model is filed under a File-Type + Vendor Value (the app's standard filing), picked in the UI.
 */
@Injectable({ providedIn: 'root' })
export class Plant3dModelService {
  private files = inject(RfFileApiService);
  private shared = inject(SharedDataService);

  /** True once `.glb` is in the server's allowed-extensions (needs the property + a restart). */
  async glbEnabled(): Promise<boolean> {
    const exts = (await firstValueFrom(this.files.getAllowedExtensions())).responseData ?? [];
    return exts.map(e => e.toLowerCase()).includes('glb');
  }

  fileTypes(): Promise<ValueDto[]> { return firstValueFrom(this.shared.loadFileTypes()); }
  vendors(): Promise<ValueDto[]> { return firstValueFrom(this.shared.loadVendors()); }

  /** Already-uploaded GLB/GLTF files, so one model can be reused across shapes without re-uploading. */
  async existingModels(): Promise<ModelFileRef[]> {
    const files = (await firstValueFrom(this.files.getByExtensions(['glb', 'gltf']))).responseData ?? [];
    return files.map((f: any) => ({ id: f.id, name: this.label(f), url: this.urlOf(f.fileLink) }));
  }

  /** Upload one model file; returns its id + fetchable URL. convertToJpg=false (irrelevant for a binary .glb). */
  async upload(file: File, fileTypeId: number, vendorId: number, name: string): Promise<ModelFileRef> {
    const res = (await firstValueFrom(this.files.uploadMultipleFiles([file], fileTypeId, vendorId, name, false))).responseData ?? [];
    const f: any = res[0];
    if (!f) throw new Error('Upload returned no file');
    return { id: f.id, name: this.label(f), url: this.urlOf(f.fileLink) };
  }

  /** Stored fileLink (e.g. "uploads/glb/3D Model/Vendor/x.glb") → root-relative, URL-encoded path. */
  urlOf(fileLink: string | null | undefined): string {
    if (!fileLink) return '';
    return encodeURI('/' + String(fileLink).replace(/^\/+/, ''));
  }

  private label(f: any): string {
    if (f?.name) return f.name;
    const fn = f?.fileNumber;
    return (Array.isArray(fn) ? fn.join(',') : fn) || `#${f?.id ?? '?'}`;
  }
}
