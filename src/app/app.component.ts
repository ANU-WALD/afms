import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app works!';

  constructor(){
//    this.p = Proj(defs('EPSG:3857'));
  }

  p:any;

}
