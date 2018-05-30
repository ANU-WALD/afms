import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Router} from '@angular/router';

@Component({
  selector: 'share-modal-component',
  templateUrl: './share-modal.component.html',
  styleUrls: ['./share-modal.component.scss']
})
export class ShareModalComponent implements OnInit {
  currentView = 'http://wenfo.org/afms/' + this.router.url;
  currentViewEmbed = '<iframe width="800" height="600" frameborder="0" src="http://wenfo.org/afms/' + this.router.url + '"></iframe>';
  topLevelSiteEmbed = '<iframe width="800" height="600" frameborder="0" src="http://wenfo.org/afms/"></iframe>';
  isVisible = true;
  constructor(public activeModal: NgbActiveModal, private router: Router) { }
  ngOnInit() {
  }

  copyToClipboard(site) {
    // Hardcoded based on IDs. Can be changed if required / needs to be extended.
         (<HTMLInputElement>document.getElementById(site)).select();
         document.execCommand('copy');
  }

  show(share) {
    if (share) {
      this.isVisible = true;
    } else {
      this.isVisible = false;
    }
  }
}
