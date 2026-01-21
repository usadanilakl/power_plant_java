import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavigationCardGroup } from '../../models/ui/navigation-card.model';

@Component({
  selector: 'app-group-navigation-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './group-navigation-card.component.html',
  styleUrl: './group-navigation-card.component.scss'
})
export class GroupNavigationCardComponent {
  group = input.required<NavigationCardGroup>();
}
