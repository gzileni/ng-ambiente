import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchAmbienteComponent } from './search-ambiente.component';

describe('SearchAmbienteComponent', () => {
  let component: SearchAmbienteComponent;
  let fixture: ComponentFixture<SearchAmbienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchAmbienteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchAmbienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
