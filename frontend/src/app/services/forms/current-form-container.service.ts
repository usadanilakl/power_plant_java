import { DestroyRef, inject, Injectable } from "@angular/core";
import { FormContainerService } from "./form-container.service";
import { FormContainerDto } from "../../models/forms/form-container.model";
import { BehaviorSubject, map, Observable, switchMap } from "rxjs";
import { PrintableFormDto } from "../../models/forms/printable-form.model";
import { PrintableFormService } from "./printable-form.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Injectable({
  providedIn: 'root'
})
export class CurrentFormContainerService {


}