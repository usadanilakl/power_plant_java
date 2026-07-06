import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EquipmentFactory3dService } from './services/equipment-factory-3d.service';
import { Layout3dService } from './services/layout-3d.service';
import { SAMPLE_CONNECTIONS, SAMPLE_PLANT } from './data/sample-plant';
import { connectionPointsFor } from './data/connection-points';
import { ThreeEquipmentInt } from './models/three-equipment.model';

/**
 * Lean, phone-friendly 3D plant view — reuses the three-plant bones (data model + connection-based LayoutService
 * + primitive factory) with a clean renderer. Sample data for now; the same shape maps from PhysicalObject.
 */
@Component({
  selector: 'app-plant-3d',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './plant-3d.component.html',
  styleUrls: ['./plant-3d.component.css'],
})
export class Plant3dComponent implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;
  private factory = inject(EquipmentFactory3dService);
  private layout = inject(Layout3dService);

  selected = signal<ThreeEquipmentInt | null>(null);
  count = signal(0);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private frame = 0;
  private objById = new Map<string, THREE.Object3D>();
  private resolved: ThreeEquipmentInt[] = [];
  private highlighted: THREE.Object3D | null = null;
  private onResize = () => this.resize();

  ngAfterViewInit() { this.init(); }

  ngOnDestroy() {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.onResize);
    this.controls?.dispose();
    this.renderer?.dispose();
  }

  private init(): void {
    const host = this.hostRef.nativeElement;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x151a1f);
    this.scene.fog = new THREE.Fog(0x151a1f, 90, 260);

    this.camera = new THREE.PerspectiveCamera(55, host.clientWidth / host.clientHeight, 0.1, 2000);
    this.camera.position.set(26, 22, 32);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap DPR for phones
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    this.renderer.shadowMap.enabled = true;
    host.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 2, 0);

    this.scene.add(new THREE.HemisphereLight(0xbfd4e6, 0x2a3038, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 1.15);
    sun.position.set(40, 60, 25);
    this.scene.add(sun);
    this.scene.add(new THREE.GridHelper(140, 47, 0x2c333b, 0x22272d));

    // Build the plant: layout (connection-based placement) → primitive per item → scene.
    this.resolved = this.layout.calculateLayout(SAMPLE_PLANT);
    this.count.set(this.resolved.length);
    for (const eq of this.resolved) {
      const obj = this.factory.build(eq);
      this.objById.set(eq.id, obj);
      this.scene.add(obj);
    }
    this.drawConnections();

    this.renderer.domElement.addEventListener('pointerdown', (e) => this.onPick(e));
    window.addEventListener('resize', this.onResize);

    const animate = () => {
      this.frame = requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  /** World position of a named connection point on a resolved equipment. */
  private cpWorld(eq: ThreeEquipmentInt, pointId: string): THREE.Vector3 | null {
    const cp = connectionPointsFor(eq.type, eq.size).find(p => p.id === pointId);
    if (!cp || !eq.position) return null;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(eq.rotation.x, eq.rotation.y, eq.rotation.z));
    return cp.position.clone().applyQuaternion(q).add(new THREE.Vector3(eq.position.x, eq.position.y, eq.position.z));
  }

  /** Draw the logical connections (topology) as coloured links between the connection points. */
  private drawConnections(): void {
    const byId = new Map(this.resolved.map(e => [e.id, e]));
    const colorOf: Record<string, number> = { 'process-flow': 0x5b9bd5, electrical: 0xffca28, shaft: 0xb0bec5 };
    for (const c of SAMPLE_CONNECTIONS) {
      const a = byId.get(c.sourceEquipmentId), b = byId.get(c.targetEquipmentId);
      if (!a || !b) continue;
      const pa = this.cpWorld(a, c.sourcePointId), pb = this.cpWorld(b, c.targetPointId);
      if (!pa || !pb) continue;
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([pa, pb]),
        new THREE.LineBasicMaterial({ color: colorOf[c.connectionTypeId] ?? 0x7cc6ff }));
      this.scene.add(line);
    }
  }

  private onPick(ev: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects([...this.objById.values()], true);
    let id: string | undefined;
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData['equipmentId']) o = o.parent;
      if (o) { id = o.userData['equipmentId']; break; }
    }
    this.select(id);
  }

  private select(id: string | undefined): void {
    if (this.highlighted) ((this.highlighted.userData['mesh'] as THREE.Mesh).material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
    this.highlighted = null;
    if (!id) { this.selected.set(null); return; }
    const obj = this.objById.get(id) ?? null;
    this.selected.set(this.resolved.find(e => e.id === id) ?? null);
    if (obj) { ((obj.userData['mesh'] as THREE.Mesh).material as THREE.MeshStandardMaterial).emissive.setHex(0x224a6b); this.highlighted = obj; }
  }

  private resize(): void {
    const host = this.hostRef.nativeElement;
    this.camera.aspect = host.clientWidth / host.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(host.clientWidth, host.clientHeight);
  }
}
