import { Component, Input, OnInit } from '@angular/core';
import { IInsightItem } from '../../models/data.model';
import { GatewayService } from '../../services/gateway.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
  imports:[CommonModule]
})
export class CardComponent implements OnInit {
  @Input() model:IInsightItem | undefined;
  card:IInsightItem | undefined;
  constructor() {
    console.log(JSON.stringify(this.model));
  }

  ngOnInit() {
    this.card = this.model;
  }

}
