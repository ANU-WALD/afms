import { Component, OnInit, OnChanges, Input } from '@angular/core';
import {SelectionService} from '../selection.service';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

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

  constructor(private selection:SelectionService) {
  }

  ngOnInit() {
  }

  ngOnChanges(changes:any){
    if(changes.start){
      this.minDate = this.selection.convertDate(this.start);
    }

    if(changes.end){
      this.maxDate = this.selection.convertDate(this.end);
    }
  }

  move(n:number){
    this.selection.move(n);
    this.checkLimits();
  }

  datesEqual(lhs:NgbDateStruct,rhs:NgbDateStruct):boolean{
    if(!lhs || !rhs){
      return false;
    }

    return (lhs.year===rhs.year) &&
           (lhs.month===rhs.month) &&
           (lhs.day===rhs.day);

  }
  dateChanged(){
    this.checkLimits();
  }

  checkLimits(){
    this.atMax = this.datesEqual(this.selection.date,this.maxDate);
    this.atMin = this.datesEqual(this.selection.date,this.minDate);
    console.log(this.atMax,this.atMin);
  }
}
