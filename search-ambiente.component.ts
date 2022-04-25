import { Component, OnInit } from '@angular/core';
import { SearchService, DataGraphLine } from '@search/search.service';
import { FormControl } from '@angular/forms';
import { SearchAmbienteService } from './search-ambiente.service';
import { MapService } from '@map/map.service';

import _ from 'lodash';
import moment from 'moment';
@Component({
  selector: 'app-search-ambiente',
  templateUrl: './search-ambiente.component.html',
  styleUrls: ['./search-ambiente.component.scss']
})
export class SearchAmbienteComponent implements OnInit {

  private _pollutionSelected: string = '';

  pollutionCtrl = new FormControl();
  pollution: Array<string> = [];
  coordinates: Array<number> = [];
  station: string = '';

  public width_graph: number = 500;
  public height_graph: number = 500;

  public data_graph!: DataGraphLine;
  public pollutions: Array<any> = [];

  constructor(private searchSvc: SearchService,
              private searchAmb: SearchAmbienteService,
              private mapSvc: MapService) {

    this.data_graph = this.searchSvc.empty_DataGraphLine;
  }

  ngOnInit(): void {

    this.pollution = this.searchAmb.pollution;
    this.pollutionSelected = 'PM10';
    this.searchAmb.update_pollution();

    this.searchSvc.map_moved.subscribe({
      next: (coords: Array<number>) => {
        this.coordinates = coords;
        /** read near station */
        if (_.size(coords) > 0) {
          this.searchAmb.near_station.subscribe({
            next: (res: any) => {
              this.searchAmb.station = res['station'];
              this.station = res['station'];
              this.searchAmb.load();

              this.searchAmb.pollutions.subscribe({
                next: (res: any) => {
                  this.pollutions = res;
                  this.pollution = _.map(this.pollutions, (item: any) => {
                    return item.pollution.toUpperCase()
                  })
                },
                error: (error: any) => {
                  console.error(error);
                }
              });

            },
            error: (error: any) => {
              this.searchAmb.station = ''
            }
          });
        } else {
          this.searchAmb.load();
        }
      },
      error: (err: any) => {
        console.error(err)
      }
    });

    this.searchSvc.search();

  }

  public get isLocation(): boolean {
    return _.size(this.coordinates) > 0
  }

  /**
   *
   * @param data
   * @returns
   */
  private _mapDataset(data: Array<any>, features?: boolean, history?: boolean): Array<any> {

    let result: Array<any> = [];

    result = _.map(data, (item:any) => {

      let item_i: any = {};

      if (history != null && history != undefined && history == true) {
        item_i['date'] = features != null && features != undefined && features == true ?
                        moment(item.properties.ts).format("DD/MM/YYYY HH:mm") :
                        moment(item.ts).format("DD/MM/YYYY HH:mm");
      } else {
        item_i['date'] = features != null && features != undefined && features == true ?
                        moment(item.properties.ts, "YYYYMMDD").format("DD/MM/YYYY") :
                        moment(item.ts, "YYYYMMDD").format("DD/MM/YYYY");
      }

      item_i['value'] = features != null && features != undefined && features == true ?
                     item.properties.value :
                     item.value;

      return {
        date: item_i['date'],
        value: item_i['value']
      }
    });

    result = _.uniqBy(_.compact(_.sortBy(result, (o: any) => {
      return moment(o.date, "DD/MM/YYYY");
    })), 'date');

    return result

  }

  /**
   *
   * @param data
   */
  private _computeDatasetForGraph(data: any): void {

    this.data_graph.dataset = this._mapDataset(data.features, true);

    this.data_graph.title = this.searchAmb.station;
    this.data_graph.subtitle = `${this.searchSvc.startDate} - ${this.searchSvc.endDate}`;
    this.data_graph.label = this.searchAmb.pollutionSelected;
    this.data_graph.info = data.features[0].properties.address;
    this.data_graph.um = data.features[0].properties.um;
    this.data_graph.max = parseFloat(data.features[0].properties.allert_level);

    this.data_graph.url = this.mapSvc.get_url(this.searchAmb.layers, this.searchAmb.filter);
    this.data_graph.history = false;
    this.searchSvc.update_graph_line(this.data_graph);

  }

  /**
   *
   */
  public openGraph() {
    this.searchSvc.spinner(true);
    this.data_graph = this.searchSvc.empty_DataGraphLine;
    this.searchAmb.data_graph.subscribe({
      next: (data: any) => {
        this._computeDatasetForGraph(data);
        this.searchSvc.spinner(false);
      },
      error: (error: any) => {
        console.error(error);
        this.searchSvc.spinner(false);
      }
    })
  }

  /**
   *
   */
  public get pollutionSelected(): string {
    return this._pollutionSelected
  }

  public set pollutionSelected(value: string) {
    this._pollutionSelected = value;
    this.searchAmb.pollutionSelected = value
  }

}
