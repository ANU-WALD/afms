import { Component, OnInit, OnChanges, Input } from '@angular/core';
import {SelectionService} from '../selection.service';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { TimeUtilsService } from "map-wald";

@Component({
  selector: 'app-date-control',
  templateUrl: './date-control.component.html',
  styleUrls: ['./date-control.component.scss']
})
export class DateControlComponent implements OnInit, OnChanges {
  @Input() start:Date;
  @Input() end:Date;
  minDate:NgbDateStruct;
  maxDate:NgbDateStruct;

  atMax:boolean=false;
  atMin:boolean=false;

  constructor(private selection:SelectionService, private timeUtils:TimeUtilsService) {
  }

  ngOnInit() {
  }

  ngOnChanges(changes:any){
    if(changes.start){
      this.minDate = this.timeUtils.convertDate(this.start);
    }

    if(changes.end){
      this.maxDate = this.timeUtils.convertDate(this.end);
    }

    this.checkLimits();
  }

  move(n:number){
    this.selection.move(n);
    this.checkLimits();
  }

  dateChanged(){
    this.checkLimits();
  }

  checkLimits(){
    this.atMax = this.timeUtils.datesEqual(this.selection.date,this.maxDate);
    this.atMin = this.timeUtils.datesEqual(this.selection.date,this.minDate);
  }
}
