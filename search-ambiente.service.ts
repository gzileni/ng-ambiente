import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { SearchService } from '@search/search.service';
import { MapService } from '@map/map.service';
import { CopernicusService } from '@copernicus/copernicus.service';

import { GeoJSON } from 'ol/format';
import VectorSource from 'ol/source/Vector';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { Heatmap as HeatmapLayer } from 'ol/layer';

import moment from 'moment';
import _ from 'lodash-es';

@Injectable({
  providedIn: 'root'
})
export class SearchAmbienteService {

  private _station_changed = new Subject<string>();
  public station_changed = this._station_changed.asObservable();

  private _pollution_changed = new Subject<string>();
  public pollution_changed = this._pollution_changed.asObservable();

  pollution: Array<string> = ['PM10', 'PM2.5', 'SWAM',
                              'BLACK CARB', 'C6H6', 'CO',
                              'H2S', 'IPA TOT', 'HCHO',
                              'NO2', 'O3', 'SO2', 'CH4'];
  private _pollutionSelected: string = '';

  private _layers: Array<string> = ['stations_values'];
  private _heatMapLayer!: HeatmapLayer | any;
  private _station: string = '';
  private _domain: any = {
    min: 0,
    max: 0
  }

  constructor(private search: SearchService,
              private http: HttpClient,
              private mapSvc: MapService,
              private copernicus: CopernicusService) { }

  /**
   *
   */
  public get domain(): any {
    return this._domain
  }

  public set domain(value: any) {
    this._domain = value;
  }

  public get layers(): Array<string> {
    return this._layers
  }

  public get filter(): string {
    return `${this.search.get_filter()} AND pollution LIKE '${this.pollutionSelected}')`
  }

  /**
   *
   */
  public get pollutionSelected(): string {
    return this._pollutionSelected
  }

  /**
   *
   */
  public set pollutionSelected(value: string) {
    this._pollutionSelected = value;
    this.domain = value;
    this._pollution_changed.next(value);
    this.copernicus.pollutionSelected = value;
  }

  /**
   *
   */
  public update_pollution() {
    this._pollution_changed.next(this.pollutionSelected);
  }

  /**
   *
   */
  public get station(): string {
    return this._station
  }

  public set station(value: string) {
    this._station = value;
    this._station_changed.next(value);
  }

  /**
   *
   */
  public removeLayer(): void {
    if (this._heatMapLayer != null && this._heatMapLayer != undefined) {
      this.mapSvc.map.removeLayer(this._heatMapLayer)
    }
  }

  /**
   *   add heatmap
   *
   *   Example url to get features from geoserver
   *   http://www.openpuglia.org:8080/geoserver/wfs?service=WFS&version=1.1.0&request=GetFeature&typename=stations_values&outputFormat=application/json&srsname=EPSG:4326&CQL_FILTERs=(['ts'] BEFORE '2022-03-13T23:00:00Z')
   */
  public load(): void {

    this.removeLayer();

    const station_values = new VectorSource({
      format: new GeoJSON(),
      url: this.mapSvc.get_url(this.layers, this.filter),
      strategy: bboxStrategy,
    });

    this._heatMapLayer = new HeatmapLayer({
      source: station_values,
      blur: 60,
      radius: 15,
      opacity: 0.7,
      gradient: ['#ca0051', '#f7000e', '#ff571f', '#f8b34c', '#f4ee77', '#d9f39e'],
      weight: (feature: any) => {
        let min: number = feature.get('soglia') != null && feature.get('soglia') != undefined ? feature.get('soglia') : 0;
        let max: number = feature.get('soglia_alert') != null && feature.get('soglia_alert') != undefined ? feature.get('soglia_alert') : 0;

        this.domain = {
          min: min,
          max: max
        };

        let value: number = feature.get('value') != null && feature.get('value') != undefined ? feature.get('value') : 0;
        return (1 - 0) * (value - min) / (max - min) + 0
      },
    });

    this.mapSvc.map.addLayer(this._heatMapLayer);

    this.copernicus.load();

  }

  /**
   *
   */
  public get near_station(): Observable<any> {

    const formData = new FormData();
    formData.append('lat', String(this.search.coordinates[1]));
    formData.append('lng', String(this.search.coordinates[0]));
    formData.append('pollution', this.pollutionSelected);
    formData.append('start', moment(this.search.startDate, "DD/MM/YYYY").format("YYYY-MM-DD"));
    formData.append('end', moment(this.search.endDate, "DD/MM/YYYY").format("YYYY-MM-DD"));
    formData.append('crs', String(this.mapSvc.srCode));
    return this.http.post<any>('/ambiente/near', formData)
  }

  /**
   *
   */
  public get data_graph(): Observable<any> {
    const formData = new FormData();
    formData.append('station', this.station);
    formData.append('pollution', this.pollutionSelected);
    formData.append('start', moment(this.search.startDate, "DD/MM/YYYY").format("YYYY-MM-DD"));
    formData.append('end', moment(this.search.endDate, "DD/MM/YYYY").format("YYYY-MM-DD"));
    formData.append('crs', String(this.mapSvc.srCode));
    return this.http.post<any>('/ambiente/data', formData)
  }

  /**
   *
   */
  public get data_graph_history(): Observable<any> {
    const formData = new FormData();
    formData.append('station', this.station);
    formData.append('pollution', this.pollutionSelected);
    return this.http.post<any>('/ambiente/history', formData)
  }

  /**
   *
   */
  public get pollutions(): Observable<any> {
    return this.http.get(`/ambiente/pollution/${this.station}`)
  }

}
