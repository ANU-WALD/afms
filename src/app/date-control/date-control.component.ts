import { Component, OnInit } from '@angular/core';
import {SelectionService} from '../selection.service';

@Component({
  selector: 'app-date-control',
  templateUrl: './date-control.component.html',
  styleUrls: ['./date-control.component.scss']
})
export class DateControlComponent implements OnInit {

  constructor(private selection:SelectionService) {
  }

  ngOnInit() {
  }

  move(n:number){
    this.selection.move(n);
  }
}
