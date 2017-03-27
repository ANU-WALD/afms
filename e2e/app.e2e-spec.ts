import { FmcPage } from './app.po';

describe('fmc App', () => {
  let page: FmcPage;

  beforeEach(() => {
    page = new FmcPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
