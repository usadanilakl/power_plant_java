import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  getCurrentRouteInfo(): any {
    return {
      url: this.router.url,
      path: this.getDeepestActivatedRouteSnapshot().routeConfig?.path,
      params: this.getDeepestActivatedRouteSnapshot().params,
      queryParams: this.getDeepestActivatedRouteSnapshot().queryParams
    };
  }

  private getDeepestActivatedRouteSnapshot(): ActivatedRoute['snapshot'] {
    let route = this.activatedRoute.snapshot;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }

  onRouteChange() {
    return this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    );
  }
}