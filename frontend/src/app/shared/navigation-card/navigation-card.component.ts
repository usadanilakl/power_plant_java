import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavigationCard } from '../../models/ui/navigation-card.model';
import { GuideDirective } from '../guide/guide.directive';

@Component({
  selector: 'app-navigation-card',
  standalone: true,
  imports: [RouterLink, GuideDirective],
  templateUrl: './navigation-card.component.html',
  styleUrl: './navigation-card.component.scss'
})
export class NavigationCardComponent {
  card = input.required<NavigationCard>();
}
