
import { Component, OnInit, ViewChild, ViewContainerRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, Event } from '@angular/router';
import { filter, map, mergeMap, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface RouteData {
  bottomMenu?: any;
}

@Component({
  selector: 'app-bottom-menu-outlet',
  template: '<ng-container #bottomMenuHost></ng-container>'
})
export class BottomMenuOutletComponent implements OnInit, AfterViewInit {
  @ViewChild('bottomMenuHost', { read: ViewContainerRef, static: false }) bottomMenuHost!: ViewContainerRef;

  private routeData$!: Observable<RouteData>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.routeData$ = this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null), // This will trigger the pipeline on initial load
      map(() => this.getChildRoute(this.route)),
      mergeMap(route => route.data)
    );
  }

  ngAfterViewInit() {
    this.routeData$.subscribe((data: RouteData) => {
      this.renderComponent(data);
      this.cdr.detectChanges(); // Force change detection
    });
  }

  private getChildRoute(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }

  private renderComponent(data: RouteData) {
    if (this.bottomMenuHost) {
      this.bottomMenuHost.clear();
      
      if (data && data.bottomMenu) {
        try {
          const componentRef = this.bottomMenuHost.createComponent(data.bottomMenu);
          componentRef.changeDetectorRef.detectChanges(); // Force change detection on the created component
        } catch (error) {
          console.error('Error creating bottom menu component:', error);
        }
      }
    }
  }
}