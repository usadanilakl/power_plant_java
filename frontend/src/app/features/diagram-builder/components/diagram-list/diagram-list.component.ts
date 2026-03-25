import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DiagramApiService } from '../../services/diagram-api.service';
import { DiagramDto } from '../../models/diagram.model';

@Component({
  selector: 'app-diagram-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="diagram-list-page">
      <div class="header">
        <h2>Diagrams</h2>
        <div class="header-actions">
          <button class="btn-secondary" (click)="seedFeedwaterTest()">Seed Feedwater Test</button>
          <button class="btn-primary" (click)="createNew()">+ New Diagram</button>
        </div>
      </div>

      @if (loading()) {
        <p class="loading">Loading diagrams...</p>
      } @else if (diagrams().length === 0) {
        <div class="empty-state">
          <p>No diagrams yet. Create your first one!</p>
        </div>
      } @else {
        <div class="diagram-grid">
          @for (diagram of diagrams(); track diagram.id) {
            <div class="diagram-card" (click)="openBuilder(diagram.id!)">
              <div class="card-body">
                <h3>{{ diagram.name || 'Untitled' }}</h3>
                <p class="description">{{ diagram.description || 'No description' }}</p>
                <p class="meta">
                  {{ diagram.canvasWidth }}×{{ diagram.canvasHeight }}
                  @if (diagram.dateModified) {
                    · Modified {{ diagram.dateModified | date:'short' }}
                  }
                </p>
              </div>
              <div class="card-actions">
                <button class="btn-sm" (click)="openBuilder(diagram.id!); $event.stopPropagation()">Edit</button>
                <button class="btn-sm" (click)="openViewer(diagram.id!); $event.stopPropagation()">View</button>
                <button class="btn-sm danger" (click)="deleteDiagram(diagram.id!); $event.stopPropagation()">Delete</button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .diagram-list-page {
      padding: 24px;
      background: #121212;
      color: #e0e0e0;
      min-height: 100%;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    h2 { margin: 0; }
    .btn-primary {
      padding: 8px 16px;
      background: #1565c0;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .btn-primary:hover { background: #1976d2; }
    .btn-secondary {
      padding: 8px 16px;
      background: #2e7d32;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .btn-secondary:hover { background: #388e3c; }
    .diagram-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    .diagram-card {
      background: #1e1e1e;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .diagram-card:hover { border-color: #2196f3; }
    .card-body h3 { margin: 0 0 8px; font-size: 16px; }
    .description { font-size: 13px; color: #888; margin: 0 0 8px; }
    .meta { font-size: 12px; color: #666; margin: 0; }
    .card-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #333;
    }
    .btn-sm {
      padding: 4px 12px;
      background: #2a2a2a;
      color: #ccc;
      border: 1px solid #444;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .btn-sm:hover { background: #3a3a3a; }
    .btn-sm.danger:hover { background: #c62828; border-color: #f44336; color: white; }
    .loading, .empty-state { text-align: center; padding: 48px; color: #666; }
  `],
})
export class DiagramListComponent implements OnInit {
  private api = inject(DiagramApiService);
  private router = inject(Router);

  diagrams = signal<DiagramDto[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadDiagrams();
  }

  loadDiagrams(): void {
    this.loading.set(true);
    this.api.getAll().subscribe({
      next: (res) => {
        this.diagrams.set(res.responseData || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createNew(): void {
    this.router.navigate(['/diagram-builder', 'new']);
  }

  seedFeedwaterTest(): void {
    this.api.seedFeedwaterControlTest().subscribe({
      next: (res) => {
        const diagram = res.responseData;
        this.loadDiagrams();
        if (diagram?.id) {
          this.router.navigate(['/diagram-builder', 'build', diagram.id]);
        }
      },
    });
  }

  openBuilder(id: number): void {
    this.router.navigate(['/diagram-builder', 'build', id]);
  }

  openViewer(id: number): void {
    this.router.navigate(['/diagram-builder', 'view', id]);
  }

  deleteDiagram(id: number): void {
    this.api.delete(id).subscribe({
      next: () => this.loadDiagrams(),
    });
  }
}
