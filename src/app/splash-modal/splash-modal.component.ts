import { Component, OnInit } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
@Component({
  selector: 'fmc-splash-modal',
  templateUrl: './splash-modal.component.html',
  styleUrls: ['./splash-modal.component.scss']
})
export class SplashModalComponent {

  constructor(public activeModal: NgbActiveModal) { }

}
