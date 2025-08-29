import { Component, OnInit, ViewChild, ViewContainerRef, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, Event } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, mergeMap, startWith } from 'rxjs/operators';

interface RouteData {
  leftMenu?: any;
}

@Component({
  selector: 'app-left-menu-outlet',
  template: '<ng-container #leftMenuHost></ng-container>'
})
export class LeftMenuOutletComponent implements OnInit, AfterViewInit {
  @ViewChild('leftMenuHost', { read: ViewContainerRef, static: false }) leftMenuHost!: ViewContainerRef;

  private routeData$!: Observable<RouteData>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.routeData$ = this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.getChildRoute(this.route)),
      mergeMap(route => route.data)
    );
  }

  ngAfterViewInit() {
    this.routeData$.subscribe((data: RouteData) => {
      this.ngZone.run(() => {
        this.renderComponent(data);
        this.cdr.detectChanges();
      });
    });
  }

  private getChildRoute(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }

  private renderComponent(data: RouteData) {
    if (this.leftMenuHost) {
      this.leftMenuHost.clear();
      
      if (data && data.leftMenu) {
        try {
          const componentRef = this.leftMenuHost.createComponent(data.leftMenu);
          componentRef.changeDetectorRef.detectChanges();
        } catch (error) {
          console.error('Error creating left menu component:', error);
        }
      }
    }
  }
}