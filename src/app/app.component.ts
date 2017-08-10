import { Component, OnInit } from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import { AboutComponent } from './about/about.component';
import {SplashModalComponent} from './splash-modal/splash-modal.component'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'app works!';

  constructor(private modalService: NgbModal){
//    this.p = Proj(defs('EPSG:3857'));
  }

  p:any;

  aboutSite(event){
    event.preventDefault();
    event.stopPropagation();
    const modalRef = this.modalService.open(AboutComponent);
  }

  ngOnInit() {
    this.modalService.open(SplashModalComponent);

  }
}
