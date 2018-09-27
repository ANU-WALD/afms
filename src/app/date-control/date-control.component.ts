import { Component, OnInit, OnChanges, Input, ViewChild } from '@angular/core';
import {SelectionService} from '../selection.service';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { TimeUtilsService, MetadataService, InterpolationService } from "map-wald";
import { VisibleLayer } from '../main-map/visible-layer';
import { NgbDatepickerNavigateEvent, NgbDatepicker } from '@ng-bootstrap/ng-bootstrap/datepicker/datepicker';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap/datepicker/ngb-date';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-date-control',
  templateUrl: './date-control.component.html',
  styleUrls: ['./date-control.component.scss']
})
export class DateControlComponent implements OnInit, OnChanges {
  @Input() start:Date;
  @Input() end:Date;
  @Input() layer:VisibleLayer;
  @ViewChild('d') datePicker: NgbDatepicker;
  minDate:NgbDateStruct;
  maxDate:NgbDateStruct;

  atMax:boolean=false;
  atMin:boolean=false;

  validDateYear:number;
  validDates: Date[] = [];
  dateDisabled: (date: NgbDate, current: { year: number; month: number; })=>boolean

  constructor(private selection:SelectionService, private timeUtils:TimeUtilsService,
              private metadata:MetadataService ) {
    this.selection.dateChange.subscribe(()=>this.dateChanged());
    let __this__ = this;
    this.dateDisabled = function(date: NgbDate, current: { year: number; month: number; }):boolean{
      if(!__this__.validDates.length){
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

    this.checkLimits();
  }

  move(n:number){
    this.selection.move(n);
    this.checkLimits();
  }

  stepForward(){
    this.move(this.selection.timeStep);
  }

  stepBackward(){
    this.move(-this.selection.timeStep);
  }

  dateChanged(){
    this.checkLimits();

    this.findValidDates(this.selection.year);
  }

  findValidDates(year:number){
    if(!this.layer||!this.layer.layer){
      this.validDates=[];
      this.validDateYear=null;
      return;
    }
    const fn = InterpolationService.interpolate(this.layer.layer.path, {
      year: year
    });

    this.metadata.getTimeDimension(this.layer.host,fn).subscribe(dates=>{
      this.validDates = dates;
      this.validDateYear = year;
      this.datePicker.navigateTo();
    });
  }

  checkLimits(){
    this.atMax = this.timeUtils.datesEqual(this.selection.date,this.maxDate);
    this.atMin = this.timeUtils.datesEqual(this.selection.date,this.minDate);
  }

  datePickerMoved(evt:NgbDatepickerNavigateEvent){
    if(evt.next.year!==this.validDateYear){
      this.findValidDates(evt.next.year);
    }
    console.log(evt);
  }
}
