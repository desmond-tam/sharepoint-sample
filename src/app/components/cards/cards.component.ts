import { Component, OnInit } from '@angular/core';
import { IInsightItem } from '../../models/data.model';
import { GatewayService } from '../../services/gateway.service';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css'],
  imports:[CommonModule,CardComponent]
})
export class CardsComponent implements OnInit {
  list:IInsightItem[]=[];
  constructor(private service:GatewayService) { }

  ngOnInit() {
    this.service.onReceivingSearchResult().subscribe(results => {
      this.list = results;
      console.log(`${this.list.length}`);
    });
  }

}
