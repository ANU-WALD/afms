import { Component, OnInit, OnChanges, Input, ViewChild } from '@angular/core';
import {SelectionService} from '../selection.service';
import { NgbDateStruct, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { TimeUtilsService, MetadataService, InterpolationService, UTCDate } from "map-wald";
import { VisibleLayer } from '../main-map/visible-layer';
import { NgbDatepickerNavigateEvent, NgbDatepicker } from '@ng-bootstrap/ng-bootstrap/datepicker/datepicker';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap/datepicker/ngb-date';
import { Observable, of } from 'rxjs';
import { DatesService } from '../dates.service';

@Component({
  selector: 'app-date-control',
  templateUrl: './date-control.component.html',
  styleUrls: ['./date-control.component.scss']
})
export class DateControlComponent implements OnInit, OnChanges {
  @Input() start:Date;
  @Input() end:Date;
  @Input() layer:VisibleLayer;
  @ViewChild('d') datePicker: NgbInputDatepicker;
  minDate:NgbDateStruct;
  maxDate:NgbDateStruct;

  atMax:boolean=false;
  atMin:boolean=false;

  validDateYear:number;
  validDates: UTCDate[] = [];
  dateDisabled: (date: NgbDate, current: { year: number; month: number; })=>boolean

  constructor(private selection:SelectionService, private timeUtils:TimeUtilsService,
              private metadata:MetadataService, private datesService:DatesService ) {
    this.selection.dateChange.subscribe(()=>this.dateChanged());
    let __this__ = this;
    this.dateDisabled = function(date: NgbDate, current: { year: number; month: number; }):boolean{
      if(!__this__.validDates.length){
        return false;
      }

      if(date.year !== __this__.validDateYear){
        return false;
      }

      return !__this__.validDates.some(d=>{
        return (d.getUTCFullYear()===date.year) &&
               (d.getUTCMonth()+1===date.month) &&
               (d.getUTCDate()===date.day);
      });
    }
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

    if(changes.layer){
      this.findValidDates(this.selection.year);
    }

    this.checkLimits();
  }

  move(n:number){
    this.selection.move(n);
    this.checkLimits();
  }

  stepForward(){
    this.move(this.layer.layer.timestep);
  }

  stepBackward(){
    this.move(-this.layer.layer.timestep);
  }

  stepYear(n:number){
    const d = Object.assign({},this.selection.date);
    d.year += n;
    this.selection.date = d;
    this.dateChanged();

  }
  dateChanged(){
    this.checkLimits();

    this.findValidDates(this.selection.year);
  }

  navigatingTo:any = null;
  findValidDates(year:number,month?:number){
    if(!this.layer||!this.layer.layer){
      this.validDates=[];
      this.validDateYear=null;
      return;
    }
    this.navigatingTo={year:year,month:month||this.selection.month};
    this.datesService.availableDates(this.layer,year).subscribe(dates=>{
      this.validDates = dates;
      this.validDateYear = year;
      this.datePicker.navigateTo(this.navigatingTo);
      this.datePicker.toggle();
      this.datePicker.toggle();
      this.navigatingTo = null;
    });
  }

  checkLimits(){
    this.atMax = this.timeUtils.datesEqual(this.selection.date,this.maxDate);
    this.atMin = this.timeUtils.datesEqual(this.selection.date,this.minDate);
  }

  datePickerMoved(evt:NgbDatepickerNavigateEvent){
    if(this.navigatingTo){
      this.datePicker.navigateTo(this.navigatingTo);
      return;
    }

    if(evt.next.year!==this.validDateYear){
      this.findValidDates(evt.next.year,evt.next.month);
    }
  }
}
