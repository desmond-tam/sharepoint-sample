import { Component, OnInit } from '@angular/core';
import { NotificationComponent } from "../notification/notification.component";
import { AlertComponent } from "../alert/alert.component";
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [MenuComponent]
})
export class HeaderComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
