import { Directive, DoCheck, ElementRef, EventEmitter, Input, KeyValueDiffer, KeyValueDiffers, NgZone, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import ResizeObserver from 'resize-observer-polyfill';
import VizceralGraph from 'vizceral';
import { VizceralSize } from './vizceral.interfaces';
const isEqual = require('lodash.isequal');






@Directive({
  selector: '[vizceral]',
  exportAs: 'ngxVizceral'
})
export class VizceralDirective implements OnInit, OnDestroy, DoCheck, OnChanges {
  private ro: any = null;
  private instance: any = null;

  private objectsJSON: any = null;


  private initialWidth: number = null;
  private initialHeight: number = null;

  private configDiff: KeyValueDiffer<string, any>;


  @Input() definitions: any = null;
  @Input() traffic: any = null;
  @Input() view: any = null;
  @Input() showLabels: Boolean = true;
  @Input() filters: any = null;
  @Output() viewChanged = new EventEmitter<any>();
  @Output() viewUpdated = new EventEmitter<any>();
  @Output() objectHighlighted = new EventEmitter<any>();
  @Output() nodeContextSizeChanged = new EventEmitter<any>();
  @Input() objectToHighlight: any = null;
  @Output() matchesFound = new EventEmitter<any>();
  @Output() nodeUpdated = new EventEmitter<any>();
  @Output() objectHovered = new EventEmitter<any>();
  @Input() match: any = null;
  @Input() modes: any = null;
  @Input() allowDraggingOfNodes: Boolean = false;
  @Input() styles: any = null;
  @Input() targetFramerate: any = null;

  @Input()
  set size(size: VizceralSize) {
    this.setSize(size.width, size.height);
  }

  private defaultProps = {
    connectionHighlighted: () => { },
    definitions: {},
    filters: [],
    match: '',
    nodeHighlighted: () => { },
    nodeUpdated: () => { },
    nodeContextSizeChanged: () => { },
    matchesFound: () => { },
    objectHighlighted: () => { },
    objectHovered: () => { },
    objectToHighlight: null,
    showLabels: true,
    allowDraggingOfNodes: false,
    styles: {},
    traffic: {},
    viewChanged: () => { },
    viewUpdated: () => { },
    view: [],
    targetFramerate: null
  };


  @Input('vizceral') config: any;


  constructor(private zone: NgZone,
    private elementRef: ElementRef, private differs: KeyValueDiffers) {
  }

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.instance = new VizceralGraph(this.elementRef.nativeElement, this.targetFramerate);

      this.instance.on('viewChanged', (event) => {
        this.zone.run(() => {
          this.viewChanged.emit(event);
        });
      });
      this.instance.on('objectHighlighted', (event) => {
        this.zone.run(() => {
          this.objectHighlighted.emit(event);
        });
      });
      this.instance.on('objectHovered', (event) => {
        this.zone.run(() => {
          this.objectHovered.emit(event);
        });
      });
      this.instance.on('nodeUpdated', (event) => {
        this.zone.run(() => {
          this.nodeUpdated.emit(event);
        });
      });
      this.instance.on('nodeContextSizeChanged', (event) => {
        this.zone.run(() => {
          this.nodeContextSizeChanged.emit(event);
        });
      });
      this.instance.on('matchesFound', (event) => {
        this.zone.run(() => {
          this.matchesFound.emit(event);
        });
      });
      this.instance.on('viewUpdated', (event) => {
        this.zone.run(() => {
          this.viewUpdated.emit(event);
        });
      });


      // Pass our defaults to Vizceral in the case that it has different defaults.
      this.instance.setOptions({
        allowDraggingOfNodes: this.allowDraggingOfNodes,
        showLabels: this.showLabels
      });


      //return back for this
      if (!isEqual(this.filters, this.defaultProps.filters)) {
        this.instance.setFilters(this.filters);
      }

      if (!isEqual(this.definitions, this.defaultProps.definitions)) {
        this.instance.updateDefinitions(this.definitions);
      }

      this.instance.updateStyles(this.styles);

      // Finish the current call stack before updating the view.
      // If vizceral-react was passed data directly without any asynchronous
      // calls to retrieve the data, the initially loaded graph would not
      // animate properly.
      setTimeout(() => {
        this.instance.setView(this.view || this.defaultProps.view, this.objectToHighlight);

        this.instance.updateData(this.traffic);
        const perfNow = this.getPerformanceNow();
        this.instance.animate(perfNow === null ? 0 : perfNow);
        this.instance.updateBoundingRectCache();
      }, 0);
    });

    this.zone.runOutsideAngular(() => {
      this.ro = new ResizeObserver((entries, observer) => {
        const element = this.elementRef.nativeElement.parentElement.parentElement;

        if (!this.initialWidth) {
          this.setSize(element.offsetWidth, element.offsetHeight);
        }
      });

      this.ro.observe(this.elementRef.nativeElement.parentElement.parentElement);
    });
  }

  public getPerformanceNow() {
    const g = window;
    if (g != null) {
      const perf = g.performance;
      if (perf != null) {
        try {
          const perfNow = perf.now();
          if (typeof perfNow === 'number') {
            return perfNow;
          }
        } catch (e) {
          // do nothing
        }
      }
    }
    return null;
  }

  ngOnDestroy(): void {

    if (this.ro) {
      this.ro.disconnect();
    }
    if (this.instance) {
      // this.objectsJSON = this.instance.toJSON();

      // this.instance.dispose();

      delete this.instance;
      this.instance = null;
    }
  }

  ngDoCheck(): void {
    if (this.configDiff) {
      const changes = this.configDiff.diff(this.config || {});

      if (changes) {
        this.ngOnDestroy();

        this.ngOnInit();
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.instance && changes['disabled']) {
      if (changes['disabled'].currentValue !== changes['disabled'].previousValue) {
        this.ngOnDestroy();

        this.ngOnInit();
      }
      else if (changes['traffic']) {
        this.instance.updateData(this.traffic);
      }
      else if (changes['styles']) {
        this.updateStyles(this.styles);
      }
      else if (changes['definitions']) {
        this.instance.updateDefinitions(this.definitions);
      }

    }

  }

  public vizceral(): any {
    return this.instance;
  }


  public setSize(width: number, height: number): void {
    this.initialWidth = width;
    this.initialHeight = height;

    if (this.instance) {
      this.instance.setSize(width, height);
    }
  }

  private updateStyles(styles) {
    const styleNames = this.instance.getStyles();
    const customStyles = styleNames.reduce((result, styleName) => {
      result[styleName] = styles[styleName] || result[styleName];
      return result;
    }, {});

    this.instance.updateStyles(customStyles);
  }

  private updateDefinitions(definitions) {
    this.instance.updateDefinitions(definitions)
  }
}
