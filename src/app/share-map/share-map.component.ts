import {AboutComponent} from '../about/about.component';
import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ShareModalComponent} from '../share-modal/share-modal.component';

@Component({
  selector: 'share-map',
  templateUrl: './share-map.component.html',
  styleUrls: ['./share-map.component.scss']
})
export class ShareMapComponent implements OnInit {
  @Output() zoomPress: EventEmitter<number> = new EventEmitter<number>();

  constructor(private modalService: NgbModal) { }

  ngOnInit() {
  }

  shareView(event) {
    event.preventDefault();
    event.stopPropagation();
    const modalRef = this.modalService.open(ShareModalComponent);
  }

}
