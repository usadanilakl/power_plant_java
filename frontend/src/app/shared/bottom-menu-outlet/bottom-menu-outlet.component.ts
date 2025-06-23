import { Component, OnInit, ViewChild, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';

interface RouteData {
  bottomMenu?: any; // Replace 'any' with the actual type of your bottom menu components if possible
}

@Component({
  selector: 'app-bottom-menu-outlet',
  template: '<ng-container #bottomMenuHost></ng-container>'
})
export class BottomMenuOutletComponent implements OnInit {
  @ViewChild('bottomMenuHost', { read: ViewContainerRef, static: true }) bottomMenuHost!: ViewContainerRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.route),
      map(route => {
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      mergeMap(route => route.data)
    ).subscribe((data: RouteData) => {
      this.bottomMenuHost.clear(); // Always clear the previous content
      
      if (data && data.bottomMenu) {
        try {
          const componentFactory = this.componentFactoryResolver.resolveComponentFactory(data.bottomMenu);
          this.bottomMenuHost.createComponent(componentFactory);
        } catch (error) {
          console.error('Error creating bottom menu component:', error);
          // Optionally, you could display a default component or error message here
        }
      }
    });
  }
}
