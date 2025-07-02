import { Component, OnInit } from '@angular/core';
import { CardComponent } from '../card/card.component';
import { GatewayService } from '../../services/gateway.service';
import { IInsightItem } from '../../models/data.model';
import { CommonModule } from '@angular/common';
import { CardsComponent } from '../cards/cards.component';

@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.css'],
  imports: [CommonModule, CardsComponent]
})
export class BodyComponent implements OnInit {
  constructor(private service:GatewayService) { }

  ngOnInit() {
    this.service.Initialize();
  }

}
