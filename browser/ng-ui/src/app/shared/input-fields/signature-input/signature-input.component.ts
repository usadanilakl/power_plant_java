import {
  Component,
  ElementRef,
  forwardRef,
  Input,
  ViewChild,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-signature-input',
  standalone: true,
  imports: [],
  templateUrl: './signature-input.component.html',
  styleUrl: './signature-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SignatureInputComponent),
      multi: true
    }
  ]
})
export class SignatureInputComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  @Input() label: string = 'Signature';
  @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  hasSignature = false;

  onChange: Function = () => {};
  onTouched: Function = () => {};

  private resizeObserver?: ResizeObserver;

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();
    this.setupCanvas();

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(canvas.parentElement!);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  private resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;
    canvas.width = parent.clientWidth - 4; // account for border
    canvas.height = 200;
    this.setupCanvas();
  }

  private setupCanvas() {
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  onPointerDown(event: PointerEvent) {
    this.isDrawing = true;
    const pos = this.getPosition(event);
    this.lastX = pos.x;
    this.lastY = pos.y;
    this.canvasRef.nativeElement.setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent) {
    if (!this.isDrawing) return;
    event.preventDefault();
    const pos = this.getPosition(event);
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.lastX = pos.x;
    this.lastY = pos.y;
    this.hasSignature = true;
  }

  onPointerUp() {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.emitValue();
    }
  }

  private getPosition(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  clear() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasSignature = false;
    this.onChange(null);
    this.onTouched();
  }

  private emitValue() {
    const canvas = this.canvasRef.nativeElement;
    const base64 = canvas.toDataURL('image/png');
    this.onChange(base64);
    this.onTouched();
  }

  writeValue(value: any) {
    if (!value) {
      if (this.canvasRef) {
        this.clear();
      }
      return;
    }
    // If a base64 image is provided, draw it on the canvas
    if (typeof value === 'string' && value.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        const canvas = this.canvasRef.nativeElement;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.ctx.drawImage(img, 0, 0);
        this.hasSignature = true;
      };
      img.src = value;
    }
  }

  registerOnChange(fn: Function) {
    this.onChange = fn;
  }

  registerOnTouched(fn: Function) {
    this.onTouched = fn;
  }
}
